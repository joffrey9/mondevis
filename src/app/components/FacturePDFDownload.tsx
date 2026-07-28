"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { downloadFacturePDF } from "./FacturePDF";
import type { Prisma } from "@prisma/client";

type FactureWithLines = Prisma.FactureGetPayload<{ include: { lines: true } }>;

export function FacturePDFDownload({
  facture,
  companyLogo,
  companyName,
  companySiret,
  companyAddress,
  companyEmail,
  companyIban,
  companyBic,
}: {
  facture: FactureWithLines;
  companyLogo?: string | null;
  companyName?: string | null;
  companySiret?: string | null;
  companyAddress?: string | null;
  companyEmail?: string | null;
  companyIban?: string | null;
  companyBic?: string | null;
}) {
  const [loading, setLoading] = useState(false);

  function handleDownload() {
    setLoading(true);
    try {
      downloadFacturePDF(
        facture,
        companyLogo,
        companyName,
        companySiret,
        companyAddress,
        companyEmail,
        companyIban,
        companyBic
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
    >
      <FileDown className="w-4 h-4" />
      {loading ? "Génération..." : "📄 Télécharger PDF"}
    </button>
  );
}
