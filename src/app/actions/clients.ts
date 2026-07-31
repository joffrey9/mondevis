"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { detectClientType } from "@/lib/countries";
import { revalidatePath } from "next/cache";

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  siret?: string;
  notes?: string;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  id: string;
}

/** Récupère tous les clients de l'utilisateur connecté */
export async function getClients() {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  return prisma.client.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { devis: true } } },
  });
}

/** Récupère un client par son ID */
export async function getClient(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  return prisma.client.findFirst({
    where: { id, userId: session.user.id },
    include: {
      devis: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

/** Crée un nouveau client avec détection auto du type */
export async function createClient(input: CreateClientInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  if (!input.name.trim()) throw new Error("Le nom du client est requis");

  const siret = input.siret?.trim() || null;
  const type = detectClientType(siret, "FR");

  const client = await prisma.client.create({
    data: {
      userId: session.user.id,
      name: input.name.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      siret,
      notes: input.notes?.trim() || null,
      type,
    },
  });

  revalidatePath("/dashboard/clients");
  return client;
}

/** Met à jour un client (recrée le type auto si le siret change) */
export async function updateClient(input: UpdateClientInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  const existing = await prisma.client.findFirst({
    where: { id: input.id, userId: session.user.id },
  });
  if (!existing) throw new Error("Client introuvable");

  const siret = input.siret?.trim() ?? existing.siret;
  const type = detectClientType(siret, "FR");

  const updated = await prisma.client.update({
    where: { id: input.id },
    data: {
      name: input.name?.trim() ?? existing.name,
      email: input.email?.trim() ?? existing.email,
      phone: input.phone?.trim() ?? existing.phone,
      address: input.address?.trim() ?? existing.address,
      siret,
      notes: input.notes?.trim() ?? existing.notes,
      type,
    },
  });

  revalidatePath("/dashboard/clients");
  return updated;
}

/** Supprime un client */
export async function deleteClient(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  const existing = await prisma.client.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) throw new Error("Client introuvable");

  // Détacher les devis et factures liés (ils gardent un snapshot des coordonnées client)
  // avant suppression pour éviter la contrainte FK en Postgres
  await prisma.$transaction([
    prisma.devis.updateMany({
      where: { clientId: id, userId: session.user.id },
      data: { clientId: null },
    }),
    prisma.facture.updateMany({
      where: { clientId: id, userId: session.user.id },
      data: { clientId: null },
    }),
    prisma.client.delete({ where: { id } }),
  ]);
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/devis");
}
