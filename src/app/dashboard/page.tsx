import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { FileText, Send, CheckCircle, XCircle, Receipt } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const [
    total, draft, sent, accepted, refused,
    factureTotal, factureSent, facturePaid,
  ] = await Promise.all([
    prisma.devis.count({ where: { userId: session.user.id } }),
    prisma.devis.count({ where: { userId: session.user.id, status: "draft" } }),
    prisma.devis.count({ where: { userId: session.user.id, status: "sent" } }),
    prisma.devis.count({ where: { userId: session.user.id, status: "accepted" } }),
    prisma.devis.count({ where: { userId: session.user.id, status: "refused" } }),
    prisma.facture.count({ where: { userId: session.user.id } }),
    prisma.facture.count({ where: { userId: session.user.id, status: "sent" } }),
    prisma.facture.count({ where: { userId: session.user.id, status: "paid" } }),
  ]);

  const recentDevis = await prisma.devis.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">Bienvenue{session.user.name ? `, ${session.user.name}` : ""} 👋</p>
        </div>
        <form action={async () => {
          "use server";
          const { signOut } = await import("@/auth");
          await signOut({ redirectTo: "/" });
        }}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 underline">
            Déconnexion
          </button>
        </form>
      </header>

      {/* Stats devis */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Link href="/dashboard/devis" className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold mt-1">{total}</p>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><FileText className="w-3 h-3" /> Brouillon</p>
          <p className="text-2xl font-bold mt-1">{draft}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Send className="w-3 h-3 text-blue-500" /> Envoyé</p>
          <p className="text-2xl font-bold mt-1">{sent}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Accepté</p>
          <p className="text-2xl font-bold mt-1">{accepted}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> Refusé</p>
          <p className="text-2xl font-bold mt-1">{refused}</p>
        </div>
      </section>

      {/* Stats factures */}
      <section className="grid grid-cols-3 gap-3">
        <Link href="/dashboard/factures" className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
          <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Receipt className="w-3 h-3" /> Factures</p>
          <p className="text-2xl font-bold mt-1">{factureTotal}</p>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Send className="w-3 h-3 text-blue-500" /> Envoyée</p>
          <p className="text-2xl font-bold mt-1">{factureSent}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Payée</p>
          <p className="text-2xl font-bold mt-1">{facturePaid}</p>
        </div>
      </section>

      {/* Nouveau devis + Liste récente */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold">Derniers devis</h2>
          <Link href="/dashboard/devis/nouveau" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            + Nouveau devis
          </Link>
        </div>
        {recentDevis.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Aucun devis pour le moment. Crée ton premier devis !
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentDevis.map((d) => (
              <Link key={d.id} href={`/dashboard/devis/${d.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                <div>
                  <p className="font-medium text-sm">{d.clientName}</p>
                  <p className="text-xs text-gray-500 font-mono">{d.number}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{d.totalTtc.toFixed(2)} €</p>
                  <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Info */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          Connecté en tant que <strong>{session.user.email}</strong> — Rôle : <strong className="capitalize">{session.user.role}</strong>
        </p>
      </section>
    </div>
  );
}
