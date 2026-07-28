import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Scale, Mail, Phone, MapPin, Wrench, FileText } from "lucide-react";
import { updateDevisStatus } from "@/app/actions/devis";
import { createFacture } from "@/app/actions/factures";
import { PrintButton } from "@/app/components/PrintButton";
import { DevisPDFDownload } from "@/app/components/DevisPDFDownload";
import { WhatsAppShareButton } from "@/app/components/WhatsAppShareButton";
import { getCountry, type Country } from "@/lib/countries";

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
  sent: { label: "Envoyé", color: "bg-blue-100 text-blue-700" },
  accepted: { label: "Accepté ✅", color: "bg-green-100 text-green-700" },
  refused: { label: "Refusé ❌", color: "bg-red-100 text-red-700" },
  archived: { label: "Archivé", color: "bg-gray-100 text-gray-500" },
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
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);
  if (!devis || devis.userId !== session.user.id) notFound();

  const countryConfig = getCountry((devis.country || "FR") as Country);
  const st = statusLabels[devis.status] ?? statusLabels.draft;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/devis" className="p-2 hover:bg-gray-100 rounded transition">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Devis {devis.number}</h1>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                {countryConfig.flag} {countryConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Créé le {new Date(devis.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${st.color}`}>{st.label}</span>
      </header>

      {/* Devis content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-8 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="text-lg font-semibold mt-1">{devis.clientName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">N° {devis.number}</p>
              <p className="text-sm text-gray-500 mt-1">{new Date(devis.createdAt).toLocaleDateString("fr-FR")}</p>
              {devis.profession && (
                <p className="text-xs text-gray-400 mt-1">{devis.profession}</p>
              )}
            </div>
          </div>
        </div>

        {/* Lines table */}
        <div className="p-4 sm:p-8 overflow-x-auto">
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase text-xs">
                <th className="text-left pb-3">Description</th>
                <th className="text-right pb-3">Qté</th>
                <th className="text-right pb-3">Prix unitaire</th>
                <th className="text-right pb-3">TVA</th>
                <th className="text-right pb-3">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {devis.lines.map((line) => (
                <tr key={line.id} className="border-b border-gray-100">
                  <td className="py-3 font-medium text-sm">{line.description}</td>
                  <td className="py-3 text-right tabular-nums text-sm">{line.quantity}</td>
                  <td className="py-3 text-right tabular-nums text-sm">{line.unitPrice.toFixed(2)} €</td>
                  <td className="py-3 text-right tabular-nums text-sm">{line.tvaRate}%</td>
                  <td className="py-3 text-right tabular-nums text-sm">{line.totalHt.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-1 text-right">
            <p className="text-xs sm:text-sm text-gray-500">Total HT : <span className="font-medium text-gray-900 tabular-nums">{devis.totalHt.toFixed(2)} €</span></p>
            <p className="text-lg sm:text-xl font-bold tabular-nums">Total TTC : {devis.totalTtc.toFixed(2)} €</p>
          </div>
        </div>

        {/* Notes */}
        {devis.notes && (
          <div className="px-8 pb-8">
            <p className="text-sm text-gray-500">Notes :</p>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{devis.notes}</p>
          </div>
        )}

        {/* Conditions de paiement */}
        {(devis.acomptePct > 0 || devis.delaiPaiement > 0) && (
          <div className="px-8 pb-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-600 mb-2">💰 Conditions de paiement</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Acompte à la commande</p>
                <p className="font-semibold">{devis.acomptePct}% ({(devis.totalTtc * devis.acomptePct / 100).toFixed(2)} € TTC)</p>
              </div>
              <div>
                <p className="text-gray-400">Délai de paiement</p>
                <p className="font-semibold">{devis.delaiPaiement} jours</p>
              </div>
            </div>
          </div>
        )}

        {/* Mentions légales par pays */}
        <div className="px-8 pb-8 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">
              Mentions légales — {countryConfig.flag} {countryConfig.label}
            </p>
          </div>
          <ul className="space-y-1">
            {countryConfig.legalMentions.map((mention, i) => (
              <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">•</span>
                <span>{mention}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Client info section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mt-6">
        <h3 className="font-semibold mb-4">👤 Informations client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {devis.profession && (
            <div className="flex items-center gap-2 text-gray-600">
              <Wrench className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{devis.profession}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <span className="font-medium">{devis.clientName}</span>
          </div>
          {devis.clientEmail && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <a href={`mailto:${devis.clientEmail}`} className="text-blue-600 hover:underline">{devis.clientEmail}</a>
            </div>
          )}
          {devis.clientPhone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{devis.clientPhone}</span>
            </div>
          )}
          {devis.clientAddress && (
            <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{devis.clientAddress}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
        {devis.status === "draft" && (
          <form action={async () => { "use server"; await updateDevisStatus(devis.id, "sent"); }}>
            <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition">
              ✉️ Marquer comme envoyé
            </button>
          </form>
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
              clientName: devis.clientName,
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
        />
        <WhatsAppShareButton
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

