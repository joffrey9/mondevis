import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, any> = {};

  try {
    // Test connexion DB
    await prisma.$connect();
    results.db = "connected";
    
    // Compter les utilisateurs
    const userCount = await prisma.user.count();
    results.userCount = userCount;
    
    // Chercher admin
    const admin = await prisma.user.findUnique({
      where: { email: "joffrey@mondevis.fr" },
      select: { id: true, email: true, name: true, role: true },
    });
    
    if (admin) {
      results.admin = "found";
      results.adminRole = admin.role;
      
      // Vérifier le compte credentials
      const account = await prisma.account.findFirst({
        where: { userId: admin.id, provider: "credentials" },
      });
      results.credentialsAccount = account ? "found" : "missing";
    } else {
      results.admin = "not_found";
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      name: error.name,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
