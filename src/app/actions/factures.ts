"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { validateTvaRate, type Country } from "@/lib/countries";

export type FactureLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  tvaRate: number;
};

export type CreateFactureInput = {
  clientId?: string;             // Lien vers le carnet clients (optionnel)
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientSiret?: string;            // N° TVA / SIRET client
  country?: Country;
  profession?: string;
  devisId?: string;            // Optionnel : créer depuis un devis
  facturePrefix?: string;
  lines: FactureLineInput[];
  notes?: string;
  acomptePct?: number;
  delaiPaiement?: number;
  iban?: string;
  bic?: string;
};

/** Génère un numéro de facture séquentiel */
async function getNextFactureNumber(userId: string, prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const last = await prisma.facture.findFirst({
    where: { userId, number: { startsWith: `${prefix}-${year}-` } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  let nextNum = 1;
  if (last) {
    const match = last.number.match(/-(\d{4})$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `${prefix}-${year}-${String(nextNum).padStart(4, "0")}`;
}

export async function createFacture(input: CreateFactureInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  // Sécurité : le client lié doit appartenir à l'utilisateur
  if (input.clientId) {
    const owned = await prisma.client.findFirst({
      where: { id: input.clientId, userId: session.user.id },
      select: { id: true },
    });
    if (!owned) throw new Error("Client introuvable");
  }

  const totalHt = input.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const totalTtc = input.lines.reduce(
    (s, l) => s + l.quantity * l.unitPrice * (1 + l.tvaRate / 100), 0
  );

  const country = input.country || "FR";
  const prefix = input.facturePrefix || (country === "BE" ? "FAC-BE" : "FAC");
  const number = await getNextFactureNumber(session.user.id, prefix);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (input.delaiPaiement ?? 30));

  const validLines = input.lines.map((l) => ({
    ...l,
    tvaRate: validateTvaRate(country, l.tvaRate),
  }));

  // Si création depuis un devis, marquer le devis comme facturé
  if (input.devisId) {
    await prisma.devis.update({
      where: { id: input.devisId, userId: session.user.id },
      data: { status: "accepted" },
    });
  }

  const facture = await prisma.facture.create({
    data: {
      userId: session.user.id,
      devisId: input.devisId || null,
      clientId: input.clientId || null,
      clientName: input.clientName,
      clientEmail: input.clientEmail || null,
      clientPhone: input.clientPhone || null,
      clientAddress: input.clientAddress || null,
      clientSiret: input.clientSiret || null,
      country,
      profession: input.profession || null,
      facturePrefix: input.facturePrefix || prefix,
      number,
      status: "draft",
      totalHt,
      totalTtc,
      iban: input.iban || null,
      bic: input.bic || null,
      acomptePct: input.acomptePct ?? 0,
      delaiPaiement: input.delaiPaiement ?? 30,
      dueDate,
      notes: input.notes || null,
      lines: {
        create: validLines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          tvaRate: l.tvaRate,
          totalHt: l.quantity * l.unitPrice,
        })),
      },
    },
    include: { lines: true },
  });

  revalidatePath("/dashboard/factures");
  if (input.devisId) revalidatePath(`/dashboard/devis/${input.devisId}`);
  return facture;
}

export async function updateFactureStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const now = status === "sent" ? new Date() : undefined;
  const paidAt = status === "paid" ? new Date() : undefined;

  await prisma.facture.update({
    where: { id, userId: session.user.id },
    data: { status, sentAt: now, paidAt },
  });

  revalidatePath(`/dashboard/factures/${id}`);
  revalidatePath("/dashboard/factures");
  return { success: true };
}

export async function deleteFacture(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  await prisma.facture.delete({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/dashboard/factures");
  return { success: true };
}

export async function getNextFactureInfo(userId?: string) {
  const session = await auth();
  const uid = userId || session?.user?.id;
  if (!uid) return null;

  const last = await prisma.facture.findFirst({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });

  const year = new Date().getFullYear();
  let nextNum = 1;
  if (last) {
    const match = last.number.match(/-(\d{4})$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }

  return {
    nextNumber: `FAC-${year}-${String(nextNum).padStart(4, "0")}`,
    count: nextNum - 1,
  };
}
