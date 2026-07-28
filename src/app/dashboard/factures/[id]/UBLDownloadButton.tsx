"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { generatePeppolUBL, downloadUBL, type UBLInvoiceData } from "@/lib/ubl";

export function UBLDownloadButton({
  ublData,
  filename,
}: {
  ublData: UBLInvoiceData;
  filename: string;
}) {
  const [loading, setLoading] = useState(false);

  function handleDownload() {
    setLoading(true);
    try {
      const xml = generatePeppolUBL(ublData);
      downloadUBL(xml, filename);
    } catch (err) {
      console.error("UBL generation error:", err);
      alert("Erreur lors de la génération du XML UBL.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 disabled:opacity-50 transition shadow-sm"
    >
      <Download className="w-4 h-4" />
      {loading ? "Génération..." : "📤 Télécharger UBL (Peppol)"}
    </button>
  );
}
