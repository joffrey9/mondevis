"use client";

import type { Prisma } from "@prisma/client";
import { buildDevisPdfDoc, devisPdfFilename, type DevisPdfCompany } from "@/lib/pdf/devis-pdf";

type DevisWithLines = Prisma.DevisGetPayload<{ include: { lines: true } }>;

/**
 * Télécharge le PDF du devis côté client.
 * La construction du document est partagée avec le serveur (src/lib/pdf/devis-pdf.ts)
 * pour être réutilisée dans l'envoi par email.
 */
export function downloadDevisPDF(
  devis: DevisWithLines,
  signatureData?: string | null,
  companyLogo?: string | null,
  companyName?: string | null,
  customLegalMentions?: string | null
) {
  const company: DevisPdfCompany = {
    logo: companyLogo,
    name: companyName,
    customLegalMentions,
  };

  void buildDevisPdfDoc(devis, { signatureData, company }).then((doc) => {
    doc.save(devisPdfFilename(devis));
  });
}
