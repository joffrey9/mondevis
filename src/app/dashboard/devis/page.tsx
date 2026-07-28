import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Eye, Trash2, Send, CheckCircle, XCircle } from "lucide-react";
import { updateDevisStatus, deleteDevis } from "@/app/actions/devis";
import { COUNTRIES, type Country } from "@/lib/countries";

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
  sent: { label: "Envoyé", color: "bg-blue-100 text-blue-700" },
  accepted: { label: "Accepté", color: "bg-green-100 text-green-700" },
  refused: { label: "Refusé", color: "bg-red-100 text-red-700" },
  archived: { label: "Archivé", color: "bg-gray-100 text-gray-500" },
};

export default async function DevisListPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const devisList = await prisma.devis.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { lines: true } } },
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mes devis</h1>
          <p className="text-gray-500 mt-1">{devisList.length} devis créés</p>
        </div>
        <Link
          href="/dashboard/devis/nouveau"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> Nouveau devis
        </Link>
      </header>

      {devisList.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Aucun devis pour le moment.</p>
          <Link href="/dashboard/devis/nouveau" className="mt-4 inline-block text-blue-600 hover:underline">
            Créer ton premier devis →
          </Link>
        </div>
      ) : (
        <>
          {/* Vue Desktop : tableau */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="text-left p-4">N°</th>
                    <th className="text-left p-4">Client</th>
                    <th className="text-center p-4">Pays</th>
                    <th className="text-center p-4">Métier</th>
                    <th className="text-right p-4">Montant</th>
                    <th className="text-center p-4">Statut</th>
                    <th className="text-right p-4">Date</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devisList.map((devis) => {
                    const st = statusLabels[devis.status] ?? statusLabels.draft;
                    return (
                      <tr key={devis.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-mono text-sm">{devis.number}</td>
                        <td className="p-4 font-medium">{devis.clientName}</td>
                        <td className="p-4 text-center">
                          <span className="text-xs font-medium text-gray-500">
                            {COUNTRIES[(devis.country || "FR") as Country]?.flag}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-xs text-gray-400">{devis.profession || "—"}</span>
                        </td>
                        <td className="p-4 text-right tabular-nums">
                          {devis.totalTtc.toFixed(2)} €
                          <div className="text-xs text-gray-400">HT: {devis.totalHt.toFixed(2)} €</div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                        </td>
                        <td className="p-4 text-right text-gray-500 text-xs">
                          {new Date(devis.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/dashboard/devis/${devis.id}`} className="p-1.5 hover:bg-gray-100 rounded transition" title="Voir">
                              <Eye className="w-4 h-4 text-gray-500" />
                            </Link>
                            {devis.status === "draft" && (
                              <form action={async () => { "use server"; await updateDevisStatus(devis.id, "sent"); }}>
                                <button type="submit" className="p-1.5 hover:bg-blue-100 rounded transition" title="Envoyer">
                                  <Send className="w-4 h-4 text-blue-500" />
                                </button>
                              </form>
                            )}
                            {devis.status === "sent" && (
                              <>
                                <form action={async () => { "use server"; await updateDevisStatus(devis.id, "accepted"); }}>
                                  <button type="submit" className="p-1.5 hover:bg-green-100 rounded transition" title="Accepter">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </button>
                                </form>
                                <form action={async () => { "use server"; await updateDevisStatus(devis.id, "refused"); }}>
                                  <button type="submit" className="p-1.5 hover:bg-red-100 rounded transition" title="Refuser">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  </button>
                                </form>
                              </>
                            )}
                            <form action={async () => { "use server"; await deleteDevis(devis.id); }}>
                              <button type="submit" className="p-1.5 hover:bg-red-100 rounded transition" title="Supprimer">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vue Mobile : cards */}
          <div className="md:hidden space-y-3">
            {devisList.map((devis) => {
              const st = statusLabels[devis.status] ?? statusLabels.draft;
              return (
                <div key={devis.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <Link href={`/dashboard/devis/${devis.id}`} className="block">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-mono text-xs text-gray-500">{devis.number}</p>
                        <p className="font-semibold text-sm mt-0.5">{devis.clientName}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {COUNTRIES[(devis.country || "FR") as Country]?.flag}
                        {devis.profession && ` · ${devis.profession}`}
                      </span>
                      <span className="tabular-nums font-semibold text-gray-900">{devis.totalTtc.toFixed(2)} €</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(devis.createdAt).toLocaleDateString("fr-FR")}</p>
                  </Link>
                  {/* Actions rapides */}
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    <Link href={`/dashboard/devis/${devis.id}`}
                      className="flex-1 text-center text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium">
                      Voir
                    </Link>
                    {devis.status === "draft" && (
                      <form action={async () => { "use server"; await updateDevisStatus(devis.id, "sent"); }} className="flex-1">
                        <button type="submit" className="w-full text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium">
                          ✉️ Envoyer
                        </button>
                      </form>
                    )}
                    {devis.status === "sent" && (
                      <>
                        <form action={async () => { "use server"; await updateDevisStatus(devis.id, "accepted"); }} className="flex-1">
                          <button type="submit" className="w-full text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium">
                            ✅ Accepter
                          </button>
                        </form>
                        <form action={async () => { "use server"; await updateDevisStatus(devis.id, "refused"); }} className="flex-1">
                          <button type="submit" className="w-full text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium">
                            ❌ Refuser
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
