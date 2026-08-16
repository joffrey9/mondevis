import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { FileText, Send, CheckCircle, XCircle, Receipt, CreditCard } from "lucide-react";
import { formatSubscriptionStatus } from "@/lib/subscription";
import { PortalButton } from "./PortalButton";

export default async function DashboardPage(props: { searchParams: Promise<{ checkout?: string }> }) {
  const { checkout } = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: { in: ["active", "trialing", "past_due", "canceled"] } },
    orderBy: { createdAt: "desc" },
  });

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
          <h1 className="text-3xl font-bold dark:text-gray-100">Tableau de bord</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Bienvenue{session.user.name ? `, ${session.user.name}` : ""} 👋</p>
        </div>
        <form action={async () => {
          "use server";
          const { signOut } = await import("@/auth");
          await signOut({ redirectTo: "/" });
        }}>
          <button type="submit" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline">
            Déconnexion
          </button>
        </form>
      </header>

      {/* Confirmation checkout */}
      {checkout === "success" && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-green-800 dark:text-green-300 text-sm">
          🎉 Merci ! Votre essai gratuit de 14 jours a démarré. Bienvenue parmi les artisans MonDevis Pro. 🚀
        </div>
      )}

      {/* Abonnement Stripe */}
      {subscription && (
        <section className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold dark:text-gray-100">
                Abonnement : {formatSubscriptionStatus(subscription.status)}
              </p>
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Prochaine échéance : {subscription.currentPeriodEnd.toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          </div>
          <PortalButton />
        </section>
      )}

      {/* Stats devis */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Link href="/dashboard/devis" className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm hover:shadow-md transition">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{total}</p>
        </Link>
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1"><FileText className="w-3 h-3" /> Brouillon</p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{draft}</p>
        </div>
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1"><Send className="w-3 h-3 text-blue-500" /> Envoyé</p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{sent}</p>
        </div>
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Accepté</p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{accepted}</p>
        </div>
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> Refusé</p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{refused}</p>
        </div>
      </section>

      {/* Stats factures */}
      <section className="grid grid-cols-3 gap-3">
        <Link href="/dashboard/factures" className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm hover:shadow-md transition">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1"><Receipt className="w-3 h-3" /> Factures</p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{factureTotal}</p>
        </Link>
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1"><Send className="w-3 h-3 text-blue-500" /> Envoyée</p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{factureSent}</p>
        </div>
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Payée</p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{facturePaid}</p>
        </div>
      </section>

      {/* Nouveau devis + Liste récente */}
      <section className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-[#1e1e30] flex items-center justify-between">
          <h2 className="font-semibold dark:text-gray-100">Derniers devis</h2>
          <Link href="/dashboard/devis/nouveau" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            + Nouveau devis
          </Link>
        </div>
        {recentDevis.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Aucun devis pour le moment. Crée ton premier devis !
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#1e1e30]">
            {recentDevis.map((d) => (
              <Link key={d.id} href={`/dashboard/devis/${d.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a2e] transition">
                <div>
                  <p className="font-medium text-sm dark:text-gray-100">{d.clientName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{d.number}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums dark:text-gray-100">{d.totalTtc.toFixed(2)} €</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Info */}
      <section className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Connecté en tant que <strong>{session.user.email}</strong> — Rôle : <strong className="capitalize">{session.user.role}</strong>
        </p>
      </section>
    </div>
  );
}
