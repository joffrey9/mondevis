"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { buildDevisPdfDoc, devisPdfFilename } from "@/lib/pdf/devis-pdf";
import { Resend } from "resend";

/** Charge un devis + les infos entreprise de l'utilisateur, avec garde d'appartenance */
async function loadOwnedDevis(devisId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const devis = await prisma.devis.findUnique({
    where: { id: devisId, userId: session.user.id },
    include: { lines: true },
  });
  if (!devis) throw new Error("Devis introuvable");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      companyName: true,
      companyEmail: true,
      companyLogo: true,
      customLegalMentions: true,
    },
  });

  return { devis, user };
}

type OwnedDevis = Awaited<ReturnType<typeof loadOwnedDevis>>;

/** Échappe les caractères HTML */
function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Template HTML de l'email de devis */
function buildDevisEmailHtml(devis: OwnedDevis["devis"], user: OwnedDevis["user"]): string {
  const seller = user?.companyName || user?.name || "Entreprise";
  const rows = devis.lines
    .map(
      (l) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${esc(l.description)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${l.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${l.unitPrice.toFixed(2)} €</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${l.tvaRate}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${l.totalHt.toFixed(2)} €</td>
      </tr>`
    )
    .join("");

  const acompteMontant = devis.totalTtc * devis.acomptePct / 100;

  return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#16a34a;color:#ffffff;padding:24px 32px;">
      <h1 style="margin:0;font-size:20px;">Devis ${esc(devis.number)}</h1>
      <p style="margin:4px 0 0;font-size:14px;opacity:.9;">${esc(seller)}</p>
    </div>
    <div style="padding:24px 32px;">
      <p style="margin:0 0 16px;color:#52525b;font-size:14px;">Bonjour ${esc(devis.clientName)},<br/>Veuillez trouver ci-dessous le détail de votre devis, ainsi que le PDF en pièce jointe.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f4f4f5;color:#52525b;">
            <th style="padding:8px 12px;text-align:left;">Description</th>
            <th style="padding:8px 12px;text-align:center;">Qté</th>
            <th style="padding:8px 12px;text-align:right;">PU</th>
            <th style="padding:8px 12px;text-align:right;">TVA</th>
            <th style="padding:8px 12px;text-align:right;">Total HT</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:16px;text-align:right;font-size:15px;">
        <p style="margin:4px 0;color:#52525b;">Total HT : <strong>${devis.totalHt.toFixed(2)} €</strong></p>
        <p style="margin:4px 0;font-size:18px;font-weight:bold;">Total TTC : ${devis.totalTtc.toFixed(2)} €</p>
        ${devis.acomptePct > 0 ? `<p style="margin:8px 0 0;color:#52525b;font-size:13px;">Acompte ${devis.acomptePct}% à la commande : ${acompteMontant.toFixed(2)} € TTC</p>` : ""}
        ${devis.delaiPaiement > 0 ? `<p style="margin:2px 0 0;color:#52525b;font-size:13px;">Délai de paiement : ${devis.delaiPaiement} jours</p>` : ""}
      </div>
      <p style="margin:20px 0 0;font-size:12px;color:#a1a1aa;">Merci de votre confiance — ${esc(seller)}</p>
    </div>
  </div>
</body>
</html>`;
}

/** Génère le buffer PDF du devis (utilisé en pièce jointe) */
async function buildDevisPdfBuffer(devis: OwnedDevis["devis"], user: OwnedDevis["user"]): Promise<Buffer> {
  const doc = await buildDevisPdfDoc(devis, {
    company: {
      logo: user?.companyLogo,
      name: user?.companyName || user?.name,
      customLegalMentions: user?.customLegalMentions,
    },
  });
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

/** Envoie le devis par email au client via Resend, puis le marque comme envoyé */
export async function sendDevisByEmail(devisId: string) {
  const { devis, user } = await loadOwnedDevis(devisId);
  if (!devis.clientEmail) throw new Error("Aucun email client renseigné sur ce devis");

  const apiKey = process.env.RESEND_API_KEY || process.env.AUTH_RESEND_KEY;
  if (!apiKey) throw new Error("Email non configuré : ajoutez RESEND_API_KEY ou AUTH_RESEND_KEY dans les variables d'environnement");

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || process.env.AUTH_RESEND_FROM || "noreply@mondedevis.eu";
  const seller = user?.companyName || user?.name || "Entreprise";

  const pdfBuffer = await buildDevisPdfBuffer(devis, user);
  const pdfFilename = devisPdfFilename(devis);

  const { error } = await resend.emails.send({
    from,
    to: devis.clientEmail,
    subject: `Votre devis ${devis.number} — ${seller}`,
    html: buildDevisEmailHtml(devis, user),
    attachments: [
      {
        filename: pdfFilename,
        content: pdfBuffer,
      },
    ],
  });
  if (error) throw new Error(`Envoi échoué : ${error.message}`);

  await prisma.devis.update({
    where: { id: devis.id, userId: devis.userId },
    data: { status: "sent", sentAt: new Date() },
  });

  revalidatePath(`/dashboard/devis/${devis.id}`);
  revalidatePath("/dashboard/devis");
  return { success: true, message: `Devis envoyé par email à ${devis.clientEmail}` };
}
