"use client";

import type { Prisma } from "@prisma/client";
import { buildFacturePdfDoc, facturePdfFilename, type FacturePdfCompany } from "@/lib/pdf/facture-pdf";

type FactureWithLines = Prisma.FactureGetPayload<{ include: { lines: true } }>;

/**
 * Télécharge le PDF de la facture côté client.
 * La construction du document est partagée avec le serveur (src/lib/pdf/facture-pdf.ts)
 * pour être réutilisée dans l'envoi par email.
 */
export function downloadFacturePDF(
  facture: FactureWithLines,
  companyLogo?: string | null,
  companyName?: string | null,
  companySiret?: string | null,
  companyAddress?: string | null,
  companyEmail?: string | null,
  companyIban?: string | null,
  companyBic?: string | null,
  customLegalMentions?: string | null
) {
  const company: FacturePdfCompany = {
    logo: companyLogo,
    name: companyName,
    siret: companySiret,
    address: companyAddress,
    email: companyEmail,
    iban: companyIban,
    bic: companyBic,
    customLegalMentions,
  };

  void buildFacturePdfDoc(facture, company).then((doc) => {
    doc.save(facturePdfFilename(facture));
  });
}
