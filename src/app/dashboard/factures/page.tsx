import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { FileText, Send, CheckCircle, Hourglass, Plus } from "lucide-react";
import { getCountry, type Country } from "@/lib/countries";

const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700", icon: "📄" },
  sent: { label: "Envoyée", color: "bg-blue-100 text-blue-700", icon: "✉️" },
  paid: { label: "Payée ✅", color: "bg-green-100 text-green-700", icon: "✅" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700", icon: "❌" },
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
          <h1 className="text-3xl font-bold">Factures</h1>
          <p className="text-gray-500 mt-1">
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
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <FileText className="w-3 h-3" /> Brouillon
          </p>
          <p className="text-2xl font-bold mt-1">{draft}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <Send className="w-3 h-3 text-blue-500" /> Envoyée
          </p>
          <p className="text-2xl font-bold mt-1">{sent}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" /> Payée
          </p>
          <p className="text-2xl font-bold mt-1">{paid}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <Hourglass className="w-3 h-3 text-red-400" /> Annulée
          </p>
          <p className="text-2xl font-bold mt-1">{cancelled}</p>
        </div>
      </section>

      {/* Liste */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {factures.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">
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
          <div className="divide-y divide-gray-100">
            {factures.map((f) => {
              const st = statusLabels[f.status] ?? statusLabels.draft;
              const countryConfig = getCountry((f.country || "FR") as Country);
              return (
                <Link
                  key={f.id}
                  href={`/dashboard/factures/${f.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">{countryConfig.flag}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {f.clientName}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {f.number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`hidden sm:inline px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}
                    >
                      {st.label}
                    </span>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">
                        {f.totalTtc.toFixed(2)} €
                      </p>
                      <p className="text-xs text-gray-400">
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

export async function generateStaticParams() {
  return [];
}
