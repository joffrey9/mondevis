import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Wrench } from "lucide-react";
import { updateFactureStatus } from "@/app/actions/factures";
import { getCountry, detectClientType, type Country } from "@/lib/countries";
import { UBLDownloadButton } from "./UBLDownloadButton";
import { FacturePDFDownload } from "@/app/components/FacturePDFDownload";

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" },
  sent: { label: "Envoyée", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  paid: { label: "Payée ✅", color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" },
  cancelled: { label: "Annulée", color: "bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-300" },
};

export default async function FactureDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id } = await props.params;
  const [facture, user] = await Promise.all([
    prisma.facture.findUnique({
      where: { id },
      include: { lines: true, devis: { select: { id: true, number: true } } },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        companySiret: true,
        companyAddress: true,
        companyEmail: true,
        companyLogo: true,
        companyIban: true,
        companyBic: true,
        peppolProvider: true,
        customLegalMentions: true,
      },
    }),
  ]);
  if (!facture || facture.userId !== session.user.id) notFound();

  const countryConfig = getCountry((facture.country || "FR") as Country);
  const st = statusLabels[facture.status] ?? statusLabels.draft;

  // Préparer les données pour l'export UBL
  const ublData = {
    id: facture.id,
    numero: facture.number,
    dateEmission: facture.createdAt.toISOString().split("T")[0],
    pays: (facture.country || "FR") as "FR" | "BE",
    entreprise: {
      nom: user?.companyName || session.user.name || "Entreprise",
      siret: user?.companySiret || "",
      tvaIntracom: user?.companySiret || "",
      adresse: user?.companyAddress || "",
      email: user?.companyEmail || session.user.email || "",
    },
    client: {
      nom: facture.clientName,
      adresse: facture.clientAddress || "",
      email: facture.clientEmail || "",
    },
    totalHT: facture.totalHt,
    totalTTC: facture.totalTtc,
    tva: facture.totalTtc - facture.totalHt,
    delaiPaiement: facture.delaiPaiement,
    iban: facture.iban || "",
    bic: facture.bic || "",
    lignes: facture.lines.map((l) => ({
      description: l.description,
      quantite: l.quantity,
      prixUnitaire: l.unitPrice,
      tvaRate: l.tvaRate,
      totalHT: l.totalHt,
    })),
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/factures" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition">
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold dark:text-gray-100">Facture {facture.number}</h1>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {countryConfig.flag} {countryConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Créée le {new Date(facture.createdAt).toLocaleDateString("fr-FR")}
              {facture.devis && (
                <span> — Issue du devis <Link href={`/dashboard/devis/${facture.devis.id}`} className="text-blue-600 hover:underline">{facture.devis.number}</Link></span>
              )}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${st.color}`}>{st.label}</span>
      </header>

      {/* Contenu facture */}
      <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-8 border-b border-gray-100 dark:border-[#1e1e30]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Client</p>
              <p className="text-lg font-semibold mt-1 dark:text-gray-100">{facture.clientName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">N° {facture.number}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date(facture.createdAt).toLocaleDateString("fr-FR")}</p>
              {facture.dueDate && (
                <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Échéance : {new Date(facture.dueDate).toLocaleDateString("fr-FR")}</p>
              )}
              {facture.profession && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{facture.profession}</p>
              )}
            </div>
          </div>
        </div>

        {/* IBAN/BIC */}
        {(facture.iban || facture.bic) && (
          <div className="px-8 pt-4 border-b border-gray-100 dark:border-[#1e1e30] pb-4">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">🏦 Coordonnées bancaires</p>
            <div className="text-sm space-y-1">
              {facture.iban && <p><span className="text-gray-500 dark:text-gray-400">IBAN :</span> <span className="font-mono font-medium dark:text-gray-200">{facture.iban}</span></p>}
              {facture.bic && <p><span className="text-gray-500 dark:text-gray-400">BIC :</span> <span className="font-mono font-medium dark:text-gray-200">{facture.bic}</span></p>}
            </div>
          </div>
        )}

        {/* Tableau des lignes */}
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
              {facture.lines.map((line) => (
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

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#1e1e30] space-y-1 text-right">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total HT : <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{facture.totalHt.toFixed(2)} €</span></p>
            <p className="text-lg sm:text-xl font-bold tabular-nums dark:text-gray-100">Total TTC : {facture.totalTtc.toFixed(2)} €</p>
          </div>
        </div>

        {/* Notes */}
        {facture.notes && (
          <div className="px-8 pb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">Notes :</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{facture.notes}</p>
          </div>
        )}

        {/* Conditions de paiement */}
        {facture.delaiPaiement > 0 && (
          <div className="px-8 pb-8 pt-4 border-t border-gray-100 dark:border-[#1e1e30]">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <p className="text-gray-400 dark:text-gray-500">Délai de paiement</p>
              <p className="font-semibold dark:text-gray-200">{facture.delaiPaiement} jours{facture.dueDate ? ` (échéance : ${new Date(facture.dueDate).toLocaleDateString("fr-FR")})` : ""}</p>
            </div>
          </div>
        )}

        {/* Mentions légales */}
        <div className="px-8 pb-8 pt-4 border-t border-gray-100 dark:border-[#1e1e30]">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">⚖️ Mentions légales — {countryConfig.flag} {countryConfig.label}</p>
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

      {/* Informations client */}
      <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold dark:text-gray-100">👤 Informations client</h3>
          {facture.clientId && (
            <Link href="/dashboard/clients" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Voir dans le carnet clients →
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {facture.profession && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Wrench className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">{facture.profession}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="font-medium">{facture.clientName}</span>
          </div>
          {facture.clientEmail && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <a href={`mailto:${facture.clientEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline">{facture.clientEmail}</a>
            </div>
          )}
          {facture.clientPhone && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span>{facture.clientPhone}</span>
            </div>
          )}
          {facture.clientAddress && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 md:col-span-2">
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span>{facture.clientAddress}</span>
            </div>
          )}
          {/* Type client : Privé / Professionnel */}
          <div className="md:col-span-2 flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-[#1e1e30]">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              detectClientType(facture.clientSiret, (facture.country || "FR") as Country) === "professionnel"
                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                : "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400"
            }`}>
              {detectClientType(facture.clientSiret, (facture.country || "FR") as Country) === "professionnel"
                ? "🏢 Professionnel"
                : "👤 Particulier"}
            </span>
            {facture.clientSiret && (
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                {facture.country === "BE" ? "TVA BE" : "SIRET/TVA"} : {facture.clientSiret}
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
        {facture.status === "draft" && (
          <form action={async () => { "use server"; await updateFactureStatus(facture.id, "sent"); }}>
            <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition">
              ✉️ Marquer comme envoyée
            </button>
          </form>
        )}
        {facture.status === "sent" && (
          <form action={async () => { "use server"; await updateFactureStatus(facture.id, "paid"); }}>
            <button type="submit" className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition">
              ✅ Marquer comme payée
            </button>
          </form>
        )}
        {["draft", "sent"].includes(facture.status) && (
          <form action={async () => { "use server"; await updateFactureStatus(facture.id, "cancelled"); }}>
            <button type="submit" className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition">
              ❌ Annuler
            </button>
          </form>
        )}

        {/* Bouton PDF */}
        <FacturePDFDownload
          facture={facture}
          companyLogo={user?.companyLogo}
          companyName={user?.companyName}
          companySiret={user?.companySiret}
          companyAddress={user?.companyAddress}
          companyEmail={user?.companyEmail}
          companyIban={user?.companyIban}
          companyBic={user?.companyBic}
          customLegalMentions={user?.customLegalMentions}
        />

        {/* Bouton UBL Peppol */}
        <UBLDownloadButton ublData={ublData} filename={`facture-${facture.number.toLowerCase()}`} />
      </div>

      {/* Info Peppol si connecté */}
      {user?.peppolProvider && (
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">📤 Peppol connecté</p>
          <p className="text-blue-700 dark:text-blue-300">
            Fournisseur : <strong>{{
              einvoice: "e-invoice.be",
              billit: "Billit",
              banqup: "Banqup",
              nexxhub: "NexxHub",
              other: "Autre fournisseur",
            }[user.peppolProvider] || user.peppolProvider}</strong>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Téléchargez le fichier XML UBL ci-dessus et importez-le chez votre fournisseur Peppol.
            L&apos;envoi automatique sera disponible prochainement.
          </p>
        </div>
      )}
    </div>
  );
}
