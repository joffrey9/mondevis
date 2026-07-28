// ── Générateur XML UBL 2.1 conforme Peppol BIS Billing 3.0 ──
// Porté depuis DevisFlash (app.js) vers TypeScript

export interface UBLInvoiceData {
  id: string;
  numero: string;
  dateEmission?: string;  // YYYY-MM-DD
  pays?: "FR" | "BE";

  // Vendeur
  entreprise?: {
    nom?: string;
    siret?: string;
    tvaIntracom?: string;
    adresse?: string;
    email?: string;
  };

  // Client
  client?: {
    nom?: string;
    adresse?: string;
    email?: string;
  };

  // Financier
  totalHT: number;
  totalTTC: number;
  tva?: number;
  tauxTVA?: number;
  delaiPaiement?: number;

  // IBAN/BIC
  iban?: string;
  bic?: string;
  rib?: { iban?: string; bic?: string };

  // Lignes de facture
  lignes?: Array<{
    description: string;
    quantite: number;
    prixUnitaire: number;
    tvaRate: number;
    totalHT: number;
  }>;
}

function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Génère la section TaxTotal avec support multi-taux TVA */
function generateTaxSection(
  lignes: UBLInvoiceData["lignes"],
  totalTva: number,
  totalHT: number,
  currency: string
): string {
  if (!lignes || lignes.length === 0) {
    // Fallback: un seul taux depuis les totaux
    return `<cac:TaxTotal>
    <cbc:TaxAmount currencyID="${esc(currency)}">${totalTva.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${esc(currency)}">${totalHT.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${esc(currency)}">${totalTva.toFixed(2)}</cbc:TaxAmount>
      <cbc:Percent>21.00</cbc:Percent>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>`;
  }

  // Grouper les lignes par taux TVA
  const groups = new Map<number, { totalHT: number; totalTVA: number }>();
  for (const l of lignes) {
    const rate = l.tvaRate;
    const lineHT = l.quantite * l.prixUnitaire;
    const lineTVA = lineHT * (rate / 100);
    const existing = groups.get(rate) || { totalHT: 0, totalTVA: 0 };
    existing.totalHT += lineHT;
    existing.totalTVA += lineTVA;
    groups.set(rate, existing);
  }

  // Catégorie Peppol selon le taux
  function getPeppolCategory(pct: number): string {
    if (pct >= 20) return "S";       // Standard
    if (pct >= 10) return "AA";      // Reduced
    if (pct > 0) return "AO";        // Very reduced
    return "E";                       // Exempt
  }

  const subtotals = Array.from(groups.entries())
    .sort(([a], [b]) => b - a) // du plus élevé au plus bas
    .map(([rate, vals]) => `    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${esc(currency)}">${vals.totalHT.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${esc(currency)}">${vals.totalTVA.toFixed(2)}</cbc:TaxAmount>
      <cbc:Percent>${rate.toFixed(2)}</cbc:Percent>
      <cac:TaxCategory>
        <cbc:ID>${getPeppolCategory(rate)}</cbc:ID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`)
    .join("\n");

  return `<cac:TaxTotal>
    <cbc:TaxAmount currencyID="${esc(currency)}">${totalTva.toFixed(2)}</cbc:TaxAmount>
${subtotals}
  </cac:TaxTotal>`;
}

/** Génère un XML UBL 2.1 à partir des données de facture */
export function generatePeppolUBL(f: UBLInvoiceData): string {
  const now = new Date();
  const dateStr = f.dateEmission || now.toISOString().split("T")[0];

  const invoiceId = f.numero || "FAC-0001";
  const invoiceUuid = "uuid:" + (f.id || "fac-" + Date.now());

  // Données entreprise
  const sellerName = f.entreprise?.nom || "Entreprise";
  const sellerSiret = f.entreprise?.siret || "";
  const sellerVatId = f.entreprise?.tvaIntracom || sellerSiret;
  const sellerAddress = f.entreprise?.adresse || "";
  const sellerEmail = f.entreprise?.email || "";

  // Données client
  const buyerName = f.client?.nom || "Client";
  const buyerAddress = f.client?.adresse || "";
  const buyerEmail = f.client?.email || "";

  // Données financières
  const currency = "EUR";
  const tauxTVA = f.tauxTVA || 0.21;
  const totalHT = f.totalHT || 0;
  const totalTTC = f.totalTTC || 0;
  const tva = f.tva ?? totalTTC - totalHT;

  // Période de paiement
  const delaiPaiement = f.delaiPaiement || 30;
  const echeanceDate = new Date(now.getTime() + delaiPaiement * 86400000)
    .toISOString()
    .split("T")[0];

  // Coordonnées bancaires
  const ribIban = f.iban || f.rib?.iban || "";
  const ribBic = f.bic || f.rib?.bic || "";

  // Pays
  const countryCode = f.pays === "FR" ? "FR" : "BE";

  // Numéro TVA formaté pour Peppol
  const vatSchemeId = countryCode === "BE" ? "BE:VAT" : "FR:VAT";
  const vatIdValue = sellerVatId.replace(/[\s.\-]/g, "");

  // Lignes de facture
  const lignes = f.lignes || [];

  // Construction du XML UBL 2.1
  const xmlLines = lignes
    .map(
      (l, i) =>
        `  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${l.quantite}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${(l.quantite * l.prixUnitaire).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${esc(l.description)}</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${l.prixUnitaire.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionURI>urn:www.cenbii.eu:transaction:biicoretrdm010:ver1.0</ext:ExtensionURI>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${esc(invoiceId)}</cbc:ID>
  <cbc:IssueDate>${esc(dateStr)}</cbc:IssueDate>
  <cbc:DueDate>${esc(echeanceDate)}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${esc(currency)}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${esc(currency)}</cbc:TaxCurrencyCode>
  <cbc:Note>Facture ${esc(invoiceId)} du ${esc(dateStr)}</cbc:Note>
  <cac:PaymentTerms>
    <cbc:Note>Paiement sous ${esc(String(delaiPaiement))} jours</cbc:Note>
  </cac:PaymentTerms>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${esc(sellerName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:CountrySubentityCode>${esc(countryCode)}</cbc:CountrySubentityCode>
        <cac:AddressLine>
          <cbc:Line>${esc(sellerAddress)}</cbc:Line>
        </cac:AddressLine>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID schemeID="${esc(vatSchemeId)}">${esc(vatIdValue)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact>
        <cbc:ElectronicMail>${esc(sellerEmail)}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${esc(buyerName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cac:AddressLine>
          <cbc:Line>${esc(buyerAddress)}</cbc:Line>
        </cac:AddressLine>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:ElectronicMail>${esc(buyerEmail)}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>${
    ribIban
      ? `
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${esc(ribIban)}</cbc:ID>${
          ribBic
            ? `
      <cac:FinancialInstitutionBranch>
        <cac:FinancialInstitution>
          <cbc:ID>${esc(ribBic)}</cbc:ID>
        </cac:FinancialInstitution>
      </cac:FinancialInstitutionBranch>`
            : ""
        }
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>`
      : ""
  }
  ${generateTaxSection(lignes, tva, totalHT, currency)}
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${esc(currency)}">${totalHT.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${esc(currency)}">${totalHT.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${esc(currency)}">${totalTTC.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${esc(currency)}">${totalTTC.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${xmlLines}
</Invoice>`;
}

/** Télécharge un fichier XML UBL côté client */
export function downloadUBL(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xml") ? filename : `${filename}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
