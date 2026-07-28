import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const results: Record<string, any> = {};

  try {
    // Test 1: Connexion à la base de données
    const userCount = await prisma.user.count();
    results.db = { status: "ok", userCount };

    // Test 2: Chercher l'admin
    const admin = await prisma.user.findUnique({
      where: { email: "joffrey@mondevis.fr" },
      select: { id: true, email: true, name: true, role: true },
    });
    results.admin = admin ? { status: "found", email: admin.email, role: admin.role } : { status: "not_found" };

    // Test 3: Credentials account
    if (admin) {
      const account = await prisma.account.findFirst({
        where: { userId: admin.id, provider: "credentials" },
        select: { id: true },
      });
      results.credentialsAccount = account ? { status: "found" } : { status: "not_found" };
    }

    // Test 4: Variables d'environnement
    results.env = {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      nodeEnv: process.env.NODE_ENV,
      dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
    };

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.split("\n").slice(0, 3).join("\n"),
    }, { status: 500 });
  }
}
