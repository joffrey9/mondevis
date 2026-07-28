"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type ProfileInput = {
  companyName?: string;
  companySiret?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string | null;
  companyIban?: string;
  companyBic?: string;
  nextDevisNumber?: number | null;
  peppolProvider?: string;
  whatsappNumber?: string;
};

export async function updateProfile(input: ProfileInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  if (input.companyLogo && input.companyLogo.length > 500_000) {
    throw new Error("Le logo est trop volumineux (max 500 KB)");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      companyName: input.companyName || null,
      companySiret: input.companySiret || null,
      companyAddress: input.companyAddress || null,
      companyPhone: input.companyPhone || null,
      companyEmail: input.companyEmail || null,
      companyLogo: input.companyLogo || null,
      companyIban: input.companyIban || null,
      companyBic: input.companyBic || null,
      nextDevisNumber: input.nextDevisNumber !== undefined ? input.nextDevisNumber : null,
      peppolProvider: input.peppolProvider || null,
      whatsappNumber: input.whatsappNumber || null,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/factures");
  revalidatePath("/dashboard/devis");

  return { success: true };
}

export async function getProfile() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      companyName: true,
      companySiret: true,
      companyAddress: true,
      companyPhone: true,
      companyEmail: true,
      companyLogo: true,
      companyIban: true,
      companyBic: true,
      nextDevisNumber: true,
      peppolProvider: true,
      whatsappNumber: true,
    },
  });

  return user;
}
