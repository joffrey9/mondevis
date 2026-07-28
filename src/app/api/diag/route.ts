import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const info: Record<string, any> = {};

  // Nombre d'utilisateurs
  try {
    const count = await prisma.user.count();
    info.userCount = count;
    
    const users = await prisma.user.findMany({ select: { email: true, role: true } });
    info.users = users;
    
    const admin = await prisma.user.findUnique({
      where: { email: "joffrey@mondevis.fr" },
      select: { id: true, email: true, role: true },
    });
    info.adminFound = !!admin;
    if (admin) info.adminRole = admin.role;
    
    const account = admin ? await prisma.account.findFirst({
      where: { userId: admin.id, provider: "credentials" },
    }) : null;
    info.credentialsFound = !!account;
    
    info.dbUrlPrefix = (process.env.DATABASE_URL || "").substring(0, 40) + "...";
    
  } catch (e: any) {
    info.error = e.message;
  }

  return NextResponse.json(info);
}
