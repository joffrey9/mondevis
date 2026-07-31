"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generatePeppolUBL, type UBLInvoiceData } from "@/lib/ubl";
import { detectClientType, type Country } from "@/lib/countries";
import { Resend } from "resend";

const PEPPOL_API_URL = process.env.PEPPOL_API_URL || "https://api.e-invoice.be/v1";

/** Charge une facture + les infos entreprise de l'utilisateur, avec garde d'appartenance */
async function loadOwnedFacture(factureId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const facture = await prisma.facture.findUnique({
    where: { id: factureId, userId: session.user.id },
    include: { lines: true },
  });
  if (!facture) throw new Error("Facture introuvable");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      companyName: true,
      companySiret: true,
      companyAddress: true,
      companyEmail: true,
      companyIban: true,
      companyBic: true,
    },
  });

  return { facture, user };
}

type OwnedFacture = Awaited<ReturnType<typeof loadOwnedFacture>>;

/** Échappe les caractères HTML (réutilisé pour le template email) */
function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Construit les données UBL pour l'export XML Peppol (même shape que la page détail) */
function buildUblData(facture: OwnedFacture["facture"], user: OwnedFacture["user"]): UBLInvoiceData {
  return {
    id: facture.id,
    numero: facture.number,
    dateEmission: facture.createdAt.toISOString().split("T")[0],
    pays: (facture.country || "FR") as "FR" | "BE",
    entreprise: {
      nom: user?.companyName || user?.name || "Entreprise",
      siret: user?.companySiret || "",
      tvaIntracom: user?.companySiret || "",
      adresse: user?.companyAddress || "",
      email: user?.companyEmail || user?.email || "",
    },
    client: {
      nom: facture.clientName,
      adresse: facture.clientAddress || "",
      email: facture.clientEmail || "",
      tva: facture.clientSiret || "",
    },
    totalHT: facture.totalHt,
    totalTTC: facture.totalTtc,
    tva: facture.totalTtc - facture.totalHt,
    delaiPaiement: facture.delaiPaiement,
    iban: facture.iban || "",
    bic: facture.bic || "",
    lignes: facture.lines.map((l) => ({
      description: l.description,
      quantite: l.quantity,
      prixUnitaire: l.unitPrice,
      tvaRate: l.tvaRate,
      totalHT: l.totalHt,
    })),
  };
}

/** Template HTML de l'email de facture (client privé) */
function buildFactureEmailHtml(facture: OwnedFacture["facture"], user: OwnedFacture["user"]): string {
  const seller = user?.companyName || user?.name || "Entreprise";
  const rows = facture.lines
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

  return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#1d4ed8;color:#ffffff;padding:24px 32px;">
      <h1 style="margin:0;font-size:20px;">Facture ${esc(facture.number)}</h1>
      <p style="margin:4px 0 0;font-size:14px;opacity:.9;">${esc(seller)}</p>
    </div>
    <div style="padding:24px 32px;">
      <p style="margin:0 0 16px;color:#52525b;font-size:14px;">Bonjour ${esc(facture.clientName)},<br/>Veuillez trouver ci-dessous le détail de votre facture.</p>
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
        <p style="margin:4px 0;color:#52525b;">Total HT : <strong>${facture.totalHt.toFixed(2)} €</strong></p>
        <p style="margin:4px 0;font-size:18px;font-weight:bold;">Total TTC : ${facture.totalTtc.toFixed(2)} €</p>
        ${facture.dueDate ? `<p style="margin:8px 0 0;color:#52525b;font-size:13px;">Échéance : ${new Date(facture.dueDate).toLocaleDateString("fr-FR")}</p>` : ""}
      </div>
      ${facture.iban ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e4e4e7;font-size:13px;color:#52525b;">
        <p style="margin:2px 0;"><strong>Coordonnées bancaires</strong></p>
        ${facture.iban ? `<p style="margin:2px 0;font-family:monospace;">IBAN : ${esc(facture.iban)}</p>` : ""}
        ${facture.bic ? `<p style="margin:2px 0;font-family:monospace;">BIC : ${esc(facture.bic)}</p>` : ""}
      </div>` : ""}
      <p style="margin:20px 0 0;font-size:12px;color:#a1a1aa;">Merci de votre confiance — ${esc(seller)}</p>
    </div>
  </div>
</body>
</html>`;
}

/** Envoie la facture par email au client (privé) via Resend, puis la marque comme envoyée */
export async function sendFactureByEmail(factureId: string) {
  const { facture, user } = await loadOwnedFacture(factureId);
  if (!facture.clientEmail) throw new Error("Aucun email client renseigné sur cette facture");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email non configuré : ajoutez RESEND_API_KEY dans les variables d'environnement");

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "noreply@mondevis.fr";
  const seller = user?.companyName || user?.name || "Entreprise";

  const { error } = await resend.emails.send({
    from,
    to: facture.clientEmail,
    subject: `Votre facture ${facture.number} — ${seller}`,
    html: buildFactureEmailHtml(facture, user),
  });
  if (error) throw new Error(`Envoi échoué : ${error.message}`);

  await prisma.facture.update({
    where: { id: facture.id, userId: facture.userId },
    data: { status: "sent", sentAt: new Date() },
  });

  revalidatePath(`/dashboard/factures/${facture.id}`);
  revalidatePath("/dashboard/factures");
  return { success: true, message: `Facture envoyée par email à ${facture.clientEmail}` };
}

/** Envoie la facture B2B via le réseau Peppol (API e-invoice.be) puis la marque comme envoyée */
export async function sendFactureViaPeppol(factureId: string) {
  const { facture, user } = await loadOwnedFacture(factureId);

  const apiKey = process.env.PEPPOL_API_KEY;
  if (!apiKey) {
    throw new Error("API Peppol non configurée : ajoutez PEPPOL_API_KEY dans les variables d'environnement (clé e-invoice.be)");
  }

  // L'envoi Peppol est réservé aux factures B2B belges : client professionnel avec n° TVA
  if (facture.country !== "BE") {
    throw new Error("L'envoi Peppol est actuellement disponible pour les factures belges (pays BE)");
  }
  if (detectClientType(facture.clientSiret, (facture.country || "FR") as Country) !== "professionnel") {
    throw new Error("L'envoi Peppol est réservé aux factures B2B : le client doit être un professionnel avec un n° TVA");
  }

  const ublXml = generatePeppolUBL(buildUblData(facture, user));
  const payload: Record<string, unknown> = { ublXml };
  const senderId = process.env.PEPPOL_SENDER_ID;
  if (senderId) payload.sender = { peppolId: senderId };

  let response: Response;
  try {
    response = await fetch(`${PEPPOL_API_URL}/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    throw new Error(`Impossible de joindre l'API Peppol (${PEPPOL_API_URL}) : ${e instanceof Error ? e.message : String(e)}`);
  }

  // Lire le corps une seule fois (json() consomme le flux, text() ensuite renverrait vide)
  const raw = await response.text().catch(() => "");
  let apiError: string | null = null;
  try {
    const body: unknown = raw ? JSON.parse(raw) : null;
    if (typeof body === "object" && body !== null) {
      const err = (body as Record<string, unknown>)["error"] || (body as Record<string, unknown>)["message"];
      if (typeof err === "string" && err.length > 0) apiError = err;
    }
  } catch {
    // corps non-JSON : on garde raw pour le message d'erreur
  }

  if (!response.ok) {
    const text = apiError || raw;
    if (response.status === 401 || response.status === 403) {
      throw new Error("Clé API Peppol invalide ou révoquée. Vérifiez-la sur e-invoice.be");
    }
    throw new Error(`Erreur API Peppol (${response.status}) : ${text.slice(0, 200)}`);
  }

  if (apiError) {
    throw new Error(`L'API Peppol a rejeté la facture : ${apiError.slice(0, 200)}`);
  }

  await prisma.facture.update({
    where: { id: facture.id, userId: facture.userId },
    data: { status: "sent", sentAt: new Date() },
  });

  revalidatePath(`/dashboard/factures/${facture.id}`);
  revalidatePath("/dashboard/factures");
  return { success: true, message: "Facture envoyée via le réseau Peppol (e-invoice.be)" };
}
