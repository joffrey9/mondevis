import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Scale, Mail, Phone, MapPin, Wrench, FileText, Pencil } from "lucide-react";
import { updateDevisStatus } from "@/app/actions/devis";
import { createFacture } from "@/app/actions/factures";
import { PrintButton } from "@/app/components/PrintButton";
import { DevisPDFDownload } from "@/app/components/DevisPDFDownload";
import { WhatsAppShareButton } from "@/app/components/WhatsAppShareButton";
import { DevisSendButtons } from "@/app/components/DevisSendButtons";
import { getCountry, detectClientType, type Country } from "@/lib/countries";

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" },
  sent: { label: "Envoyé", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  accepted: { label: "Accepté ✅", color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" },
  refused: { label: "Refusé ❌", color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" },
  archived: { label: "Archivé", color: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" },
};

export default async function DevisDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id } = await props.params;
  const [devis, user] = await Promise.all([
    prisma.devis.findUnique({
      where: { id },
      include: { lines: true },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { companyName: true, companyLogo: true, customLegalMentions: true, companyIban: true, companyBic: true, whatsappNumber: true } }),
  ]);
  if (!devis || devis.userId !== session.user.id) notFound();

  const countryConfig = getCountry((devis.country || "FR") as Country);
  const st = statusLabels[devis.status] ?? statusLabels.draft;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/devis" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition">
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold dark:text-gray-100">Devis {devis.number}</h1>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {countryConfig.flag} {countryConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Créé le {new Date(devis.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${st.color}`}>{st.label}</span>
      </header>

      {/* Devis content */}
      <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-8 border-b border-gray-100 dark:border-[#1e1e30]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Client</p>
              <p className="text-lg font-semibold mt-1 dark:text-gray-100">{devis.clientName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">N° {devis.number}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date(devis.createdAt).toLocaleDateString("fr-FR")}</p>
              {devis.profession && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{devis.profession}</p>
              )}
            </div>
          </div>
        </div>

        {/* Lines table */}
        <div className="p-4 sm:p-8 overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#1e1e30] text-gray-500 dark:text-gray-400 uppercase text-xs">
                <th className="text-left pb-3 pr-4 w-2/5">Description</th>
                <th className="text-right pb-3 px-3 w-[10%]">Qté</th>
                <th className="text-right pb-3 px-3 w-[18%]">Prix unitaire</th>
                <th className="text-right pb-3 px-3 w-[12%]">TVA</th>
                <th className="text-right pb-3 pl-4 w-[18%]">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {devis.lines.map((line) => (
                <tr key={line.id} className="border-b border-gray-100 dark:border-[#1e1e30]">
                  <td className="py-3 font-medium text-sm pr-4 dark:text-gray-200">{line.description}</td>
                  <td className="py-3 text-right tabular-nums text-sm px-3 dark:text-gray-300">{line.quantity}</td>
                  <td className="py-3 text-right tabular-nums text-sm px-3 dark:text-gray-300">{line.unitPrice.toFixed(2)} €</td>
                  <td className="py-3 text-right tabular-nums text-sm px-3 dark:text-gray-300">{line.tvaRate}%</td>
                  <td className="py-3 text-right tabular-nums text-sm pl-4 font-medium dark:text-gray-200">{line.totalHt.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#1e1e30] space-y-1 text-right">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total HT : <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{devis.totalHt.toFixed(2)} €</span></p>
            <p className="text-lg sm:text-xl font-bold tabular-nums dark:text-gray-100">Total TTC : {devis.totalTtc.toFixed(2)} €</p>
          </div>
        </div>

        {/* Notes */}
        {devis.notes && (
          <div className="px-8 pb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">Notes :</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{devis.notes}</p>
          </div>
        )}

        {/* Conditions de paiement */}
        {(devis.acomptePct > 0 || devis.delaiPaiement > 0) && (
          <div className="px-8 pb-4 border-t border-gray-100 dark:border-[#1e1e30] pt-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">💰 Conditions de paiement</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 dark:text-gray-500">Acompte à la commande</p>
                <p className="font-semibold dark:text-gray-200">{devis.acomptePct}% ({(devis.totalTtc * devis.acomptePct / 100).toFixed(2)} € TTC)</p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-gray-500">Délai de paiement</p>
                <p className="font-semibold dark:text-gray-200">{devis.delaiPaiement} jours</p>
              </div>
            </div>
          </div>
        )}

        {/* Mentions légales par pays */}
        <div className="px-8 pb-8 pt-4 border-t border-gray-100 dark:border-[#1e1e30]">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Mentions légales — {countryConfig.flag} {countryConfig.label}
            </p>
          </div>
          <ul className="space-y-1">
            {countryConfig.legalMentions.map((mention, i) => (
              <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
                <span className="text-gray-300 dark:text-gray-600 mt-0.5">•</span>
                <span>{mention}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Client info section */}
      <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm mt-6">
        <h3 className="font-semibold mb-4 dark:text-gray-100">👤 Informations client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {devis.profession && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Wrench className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">{devis.profession}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="font-medium">{devis.clientName}</span>
          </div>
          {devis.clientEmail && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <a href={`mailto:${devis.clientEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline">{devis.clientEmail}</a>
            </div>
          )}
          {devis.clientPhone && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span>{devis.clientPhone}</span>
            </div>
          )}
          {devis.clientAddress && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 md:col-span-2">
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span>{devis.clientAddress}</span>
            </div>
          )}
          {/* 🆕 Type client : Privé / Professionnel */}
          <div className="md:col-span-2 flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-[#1e1e30]">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              detectClientType(devis.clientSiret, (devis.country || "FR") as Country) === "professionnel"
                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                : "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400"
            }`}>
              {detectClientType(devis.clientSiret, (devis.country || "FR") as Country) === "professionnel"
                ? "🏢 Professionnel"
                : "👤 Particulier"}
            </span>
            {devis.clientSiret && (
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                {devis.country === "BE" ? "TVA BE" : "SIRET/TVA"} : {devis.clientSiret}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mentions légales personnalisées */}
      {user?.customLegalMentions && (
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm mt-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">📋 Mentions personnalisées</p>
          <ul className="space-y-1">
            {user.customLegalMentions.split("\n").filter(Boolean).map((mention, i) => (
              <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
                <span className="text-gray-300 dark:text-gray-600 mt-0.5">•</span>
                <span>{mention}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
        {devis.status === "draft" && (
          <>
            <Link
              href={`/dashboard/devis/nouveau?editId=${devis.id}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 dark:bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-500 transition"
            >
              <Pencil className="w-4 h-4" /> Modifier
            </Link>
            <form action={async () => { "use server"; await updateDevisStatus(devis.id, "sent"); }}>
              <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition">
                ✉️ Marquer comme envoyé
              </button>
            </form>
          </>
        )}
        {devis.status === "sent" && (
          <>
            <form action={async () => { "use server"; await updateDevisStatus(devis.id, "accepted"); }}>
              <button type="submit" className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition">
                ✅ Accepter
              </button>
            </form>
            <form action={async () => { "use server"; await updateDevisStatus(devis.id, "refused"); }}>
              <button type="submit" className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition">
                ❌ Refuser
              </button>
            </form>
          </>
        )}
        {devis.status === "accepted" && (
          <form action={async () => {
            "use server";
            const facture = await createFacture({
              devisId: devis.id,
              clientId: devis.clientId || undefined,
              clientName: devis.clientName,
              clientSiret: devis.clientSiret || undefined,
              clientEmail: devis.clientEmail || undefined,
              clientPhone: devis.clientPhone || undefined,
              clientAddress: devis.clientAddress || undefined,
              country: (devis.country || "FR") as Country,
              profession: devis.profession || undefined,
              lines: devis.lines.map((l) => ({
                description: l.description,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                tvaRate: l.tvaRate,
              })),
              acomptePct: devis.acomptePct,
              delaiPaiement: devis.delaiPaiement,
              iban: user?.companyIban || undefined,
              bic: user?.companyBic || undefined,
              notes: devis.notes || undefined,
            });
            redirect(`/dashboard/factures/${facture.id}`);
          }}>
            <button type="submit" className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition">
              <FileText className="w-4 h-4" />
              Transformer en facture
            </button>
          </form>
        )}
        <DevisPDFDownload
          devis={devis}
          companyLogo={user?.companyLogo}
          companyName={user?.companyName}
          customLegalMentions={user?.customLegalMentions}
        />
        <DevisSendButtons
          devisId={devis.id}
          hasClientEmail={!!devis.clientEmail}
          status={devis.status}
        />
        <WhatsAppShareButton
          clientPhone={devis.clientPhone}
          whatsappNumber={user?.whatsappNumber}
          clientName={devis.clientName}
          devisNumber={devis.number}
          totalTtc={devis.totalTtc}
          devisUrl={`/dashboard/devis/${devis.id}`}
          companyName={user?.companyName}
        />
        <PrintButton />
      </div>
    </div>
  );
}

