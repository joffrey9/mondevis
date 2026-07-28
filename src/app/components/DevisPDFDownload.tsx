"use client";

import { useState, useCallback } from "react";
import { FileDown } from "lucide-react";
import { SignaturePad } from "./SignaturePad";
import { downloadDevisPDF } from "./DevisPDF";
import type { Prisma } from "@prisma/client";

type DevisWithLines = Prisma.DevisGetPayload<{ include: { lines: true } }>;

export function DevisPDFDownload({
  devis,
  companyLogo,
  companyName,
}: {
  devis: DevisWithLines;
  companyLogo?: string | null;
  companyName?: string | null;
}) {
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignatureChange = useCallback((data: string | null) => {
    setSignatureData(data);
  }, []);

  function handleDownload(withSignature: boolean) {
    setLoading(true);
    try {
      downloadDevisPDF(devis, withSignature ? signatureData : null, companyLogo, companyName);
    } finally {
      setLoading(false);
    }
  }

  const acompteMontant = devis.totalTtc * (devis.acomptePct || 0) / 100;
  const soldeMontant = devis.totalTtc - acompteMontant;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleDownload(false)}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
        >
          <FileDown className="w-4 h-4" />
          {loading ? "Génération..." : "📄 Télécharger PDF"}
        </button>
        {!showSignature ? (
          <button
            type="button"
            onClick={() => setShowSignature(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            ✍️ Présenter au client pour signature
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleDownload(true)}
            disabled={loading || !signatureData}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 text-white rounded-xl font-medium text-sm hover:bg-amber-700 disabled:opacity-50 transition shadow-sm"
          >
            {loading ? "Génération..." : "✅ Télécharger avec signature"}
          </button>
        )}
      </div>

      {showSignature && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
          {/* Résumé des montants */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h4 className="font-semibold text-sm text-amber-800 mb-2">
              💰 Récapitulatif du devis
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-amber-600">Total TTC</p>
                <p className="text-lg font-bold text-amber-900">{devis.totalTtc.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-amber-600">Acompte à la commande</p>
                <p className="font-semibold text-amber-800">{devis.acomptePct || 30}% — {acompteMontant.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-amber-600">Solde à la réception</p>
                <p className="font-semibold text-amber-800">{soldeMontant.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-amber-600">Délai de paiement</p>
                <p className="font-semibold text-amber-800">{devis.delaiPaiement || 30} jours</p>
              </div>
            </div>
          </div>

          <SignaturePad onSignatureChange={handleSignatureChange} />

          {signatureData ? (
            <p className="text-xs text-green-600 flex items-center gap-1">
              ✓ Signature capturée — le PDF incluera la signature avec la mention « Bon pour accord »
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              Le client signe ci-dessus pour acceptation du devis et des conditions de paiement
            </p>
          )}
        </div>
      )}
    </div>
  );
}
