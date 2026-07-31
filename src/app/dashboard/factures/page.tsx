import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { FileText, Send, CheckCircle, Hourglass, Plus } from "lucide-react";
import { getCountry, detectClientType, type Country } from "@/lib/countries";

const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300", icon: "📄" },
  sent: { label: "Envoyée", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300", icon: "✉️" },
  paid: { label: "Payée ✅", color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300", icon: "✅" },
  cancelled: { label: "Annulée", color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300", icon: "❌" },
};

export default async function FacturesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const [total, draft, sent, paid, cancelled, factures] = await Promise.all([
    prisma.facture.count({ where: { userId: session.user.id } }),
    prisma.facture.count({ where: { userId: session.user.id, status: "draft" } }),
    prisma.facture.count({ where: { userId: session.user.id, status: "sent" } }),
    prisma.facture.count({ where: { userId: session.user.id, status: "paid" } }),
    prisma.facture.count({ where: { userId: session.user.id, status: "cancelled" } }),
    prisma.facture.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { lines: true },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-100">Factures</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {total === 0
              ? "Aucune facture pour le moment"
              : `${total} facture${total > 1 ? "s" : ""} au total`}
          </p>
        </div>
        <Link
          href="/dashboard/factures/nouveau"
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle facture
        </Link>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{total}</p>
        </div>
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <FileText className="w-3 h-3" /> Brouillon
          </p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{draft}</p>
        </div>
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <Send className="w-3 h-3 text-blue-500" /> Envoyée
          </p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{sent}</p>
        </div>
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" /> Payée
          </p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{paid}</p>
        </div>
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <Hourglass className="w-3 h-3 text-red-400" /> Annulée
          </p>
          <p className="text-2xl font-bold mt-1 dark:text-gray-100">{cancelled}</p>
        </div>
      </section>

      {/* Liste */}
      <section className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] shadow-sm">
        {factures.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Vous n&apos;avez pas encore de facture.
            </p>
            <Link
              href="/dashboard/factures/nouveau"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Créer ma première facture
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#1e1e30]">
            {factures.map((f) => {
              const st = statusLabels[f.status] ?? statusLabels.draft;
              const countryConfig = getCountry((f.country || "FR") as Country);
              return (
                <Link
                  key={f.id}
                  href={`/dashboard/factures/${f.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a2e] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">{countryConfig.flag}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate dark:text-gray-200">
                        {f.clientName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          detectClientType(f.clientSiret, (f.country || "FR") as Country) === "professionnel"
                            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                            : "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400"
                        }`}>
                          {detectClientType(f.clientSiret, (f.country || "FR") as Country) === "professionnel"
                            ? "🏢 Pro"
                            : "👤 Part"}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {f.number}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`hidden sm:inline px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}
                    >
                      {st.label}
                    </span>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums dark:text-gray-200">
                        {f.totalTtc.toFixed(2)} €
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(f.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

