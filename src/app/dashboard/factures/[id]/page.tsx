import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Wrench, Download, FileText } from "lucide-react";
import { updateFactureStatus } from "@/app/actions/factures";
import { getCountry, type Country } from "@/lib/countries";
import { UBLDownloadButton } from "./UBLDownloadButton";
import { FacturePDFDownload } from "@/app/components/FacturePDFDownload";

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
  sent: { label: "Envoyée", color: "bg-blue-100 text-blue-700" },
  paid: { label: "Payée ✅", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-500" },
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
          <Link href="/dashboard/factures" className="p-2 hover:bg-gray-100 rounded transition">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Facture {facture.number}</h1>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                {countryConfig.flag} {countryConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-8 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="text-lg font-semibold mt-1">{facture.clientName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">N° {facture.number}</p>
              <p className="text-sm text-gray-500 mt-1">{new Date(facture.createdAt).toLocaleDateString("fr-FR")}</p>
              {facture.dueDate && (
                <p className="text-xs mt-1 text-gray-400">Échéance : {new Date(facture.dueDate).toLocaleDateString("fr-FR")}</p>
              )}
              {facture.profession && (
                <p className="text-xs text-gray-400 mt-1">{facture.profession}</p>
              )}
            </div>
          </div>
        </div>

        {/* IBAN/BIC */}
        {(facture.iban || facture.bic) && (
          <div className="px-8 pt-4 border-b border-gray-100 pb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">🏦 Coordonnées bancaires</p>
            <div className="text-sm space-y-1">
              {facture.iban && <p><span className="text-gray-500">IBAN :</span> <span className="font-mono font-medium">{facture.iban}</span></p>}
              {facture.bic && <p><span className="text-gray-500">BIC :</span> <span className="font-mono font-medium">{facture.bic}</span></p>}
            </div>
          </div>
        )}

        {/* Tableau des lignes */}
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
              {facture.lines.map((line) => (
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

          <div className="mt-6 pt-4 border-t border-gray-200 space-y-1 text-right">
            <p className="text-xs sm:text-sm text-gray-500">Total HT : <span className="font-medium text-gray-900 tabular-nums">{facture.totalHt.toFixed(2)} €</span></p>
            <p className="text-lg sm:text-xl font-bold tabular-nums">Total TTC : {facture.totalTtc.toFixed(2)} €</p>
          </div>
        </div>

        {/* Notes */}
        {facture.notes && (
          <div className="px-8 pb-8">
            <p className="text-sm text-gray-500">Notes :</p>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{facture.notes}</p>
          </div>
        )}

        {/* Conditions de paiement */}
        {facture.delaiPaiement > 0 && (
          <div className="px-8 pb-8 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <p className="text-gray-400">Délai de paiement</p>
              <p className="font-semibold">{facture.delaiPaiement} jours{facture.dueDate ? ` (échéance : ${new Date(facture.dueDate).toLocaleDateString("fr-FR")})` : ""}</p>
            </div>
          </div>
        )}

        {/* Mentions légales */}
        <div className="px-8 pb-8 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-2">⚖️ Mentions légales — {countryConfig.flag} {countryConfig.label}</p>
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
        />

        {/* Bouton UBL Peppol */}
        <UBLDownloadButton ublData={ublData} filename={`facture-${facture.number.toLowerCase()}`} />

      {/* Info Peppol si connecté */}
      {user?.peppolProvider && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-800 mb-1">📤 Peppol connecté</p>
          <p className="text-blue-700">
            Fournisseur : <strong>{{
              einvoice: "e-invoice.be",
              billit: "Billit",
              banqup: "Banqup",
              nexxhub: "NexxHub",
              other: "Autre fournisseur",
            }[user.peppolProvider] || user.peppolProvider}</strong>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Téléchargez le fichier XML UBL ci-dessus et importez-le chez votre fournisseur Peppol.
            L&apos;envoi automatique sera disponible prochainement.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}

