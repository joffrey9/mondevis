"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { validateTvaRate, type Country } from "@/lib/countries";

export type DevisLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  tvaRate: number;
};

export type CreateDevisInput = {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientId?: string;
  country?: Country;
  profession?: string;
  devisPrefix?: string;
  lines: DevisLineInput[];
  notes?: string;
  acomptePct?: number;
  delaiPaiement?: number;
};

/** Génère un numéro de devis séquentiel */
async function getNextDevisNumber(userId: string, prefix: string): Promise<string> {
  const year = new Date().getFullYear();

  // Vérifier si l'utilisateur a défini un prochain numéro personnalisé
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nextDevisNumber: true },
  });

  if (user?.nextDevisNumber != null && user.nextDevisNumber > 0) {
    const num = user.nextDevisNumber;
    // Reset du compteur personnalisé après utilisation
    await prisma.user.update({
      where: { id: userId },
      data: { nextDevisNumber: null },
    });
    return `${prefix}-${year}-${String(num).padStart(4, "0")}`;
  }

  // Sinon, trouver le dernier numéro existant
  const last = await prisma.devis.findFirst({
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

export async function createDevis(input: CreateDevisInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const totalHt = input.lines.reduce(
    (s, l) => s + l.quantity * l.unitPrice, 0
  );
  const totalTtc = input.lines.reduce(
    (s, l) => s + l.quantity * l.unitPrice * (1 + l.tvaRate / 100), 0
  );

  const country = input.country || "FR";

  // Valider chaque taux TVA par rapport au pays
  const validLines = input.lines.map((l) => ({
    ...l,
    tvaRate: validateTvaRate(country, l.tvaRate),
  }));

  // Préfixe custom ou auto
  const prefix = input.devisPrefix || (country === "BE" ? "DEV-BE" : "DEV");
  const number = await getNextDevisNumber(session.user.id, prefix);

  const devis = await prisma.devis.create({
    data: {
      userId: session.user.id,
      clientName: input.clientName,
      clientEmail: input.clientEmail || null,
      clientPhone: input.clientPhone || null,
      clientAddress: input.clientAddress || null,
      clientId: input.clientId || null,
      country,
      profession: input.profession || null,
      devisPrefix: input.devisPrefix || null,
      number,
      totalHt,
      totalTtc,
      acomptePct: input.acomptePct ?? 30,
      delaiPaiement: input.delaiPaiement ?? 30,
      notes: input.notes || null,
      status: "draft",
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

  revalidatePath("/dashboard/devis");
  return devis;
}

export async function getNextDevisInfo(userId?: string) {
  const session = await auth();
  const uid = userId || session?.user?.id;
  if (!uid) return null;

  // Vérifier si un prochain numéro personnalisé est défini
  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { nextDevisNumber: true },
  });

  const year = new Date().getFullYear();
  if (user?.nextDevisNumber != null && user.nextDevisNumber > 0) {
    return {
      nextNumber: `DEV-${year}-${String(user.nextDevisNumber).padStart(4, "0")}`,
      count: user.nextDevisNumber - 1,
      custom: true,
    };
  }

  const last = await prisma.devis.findFirst({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });

  let nextNum = 1;
  if (last) {
    const match = last.number.match(/-(\d{4})$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }

  return {
    nextNumber: `DEV-${year}-${String(nextNum).padStart(4, "0")}`,
    count: nextNum - 1,
    custom: false,
  };
}

export async function updateDevisStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const now = status === "sent" ? new Date() : undefined;
  const acceptedAt = status === "accepted" ? new Date() : undefined;

  await prisma.devis.update({
    where: { id, userId: session.user.id },
    data: { status, sentAt: now, acceptedAt },
  });

  revalidatePath(`/dashboard/devis/${id}`);
  revalidatePath("/dashboard/devis");
  return { success: true };
}

export async function deleteDevis(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  await prisma.devis.delete({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/dashboard/devis");
  return { success: true };
}

export async function getDevisStats() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [total, draft, sent, accepted, refused] = await Promise.all([
    prisma.devis.count({ where: { userId: session.user.id } }),
    prisma.devis.count({ where: { userId: session.user.id, status: "draft" } }),
    prisma.devis.count({ where: { userId: session.user.id, status: "sent" } }),
    prisma.devis.count({ where: { userId: session.user.id, status: "accepted" } }),
    prisma.devis.count({ where: { userId: session.user.id, status: "refused" } }),
  ]);

  return { total, draft, sent, accepted, refused };
}
