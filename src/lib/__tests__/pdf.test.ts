import { describe, it, expect } from "vitest";
import { buildFacturePdfDoc, facturePdfFilename, type FactureWithLines } from "@/lib/pdf/facture-pdf";
import { buildDevisPdfDoc, devisPdfFilename, getPdfCountryLabel, type DevisWithLines } from "@/lib/pdf/devis-pdf";

function makeFacture(): FactureWithLines {
  return {
    id: "fac-1",
    userId: "u1",
    devisId: null,
    clientId: null,
    clientName: "Jean Dupont",
    clientEmail: "jean@example.com",
    clientPhone: null,
    clientAddress: "12 rue de la Paix",
    clientSiret: null,
    country: "FR",
    profession: "Menuiserie",
    number: "FAC-2026-0001",
    facturePrefix: null,
    status: "draft",
    totalHt: 1000,
    totalTtc: 1200,
    iban: "FR761234567890",
    bic: "AGRIFFPP",
    acomptePct: 0,
    delaiPaiement: 30,
    notes: null,
    sentAt: null,
    paidAt: null,
    dueDate: new Date("2026-08-31"),
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-08-01"),
    lines: [
      {
        id: "l1",
        factureId: "fac-1",
        description: "Pose cuisine complète",
        quantity: 1,
        unitPrice: 1000,
        tvaRate: 20,
        totalHt: 1000,
      },
    ],
  };
}

function makeDevis(): DevisWithLines {
  return {
    id: "dev-1",
    userId: "u1",
    clientId: null,
    clientName: "Jean Dupont",
    clientEmail: "jean@example.com",
    clientPhone: null,
    clientAddress: null,
    clientSiret: null,
    country: "BE",
    profession: null,
    number: "DEV-BE-2026-0001",
    devisPrefix: null,
    status: "draft",
    totalHt: 500,
    totalTtc: 605,
    acomptePct: 30,
    delaiPaiement: 30,
    notes: null,
    sentAt: null,
    acceptedAt: null,
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-08-01"),
    lines: [
      {
        id: "dl1",
        devisId: "dev-1",
        description: "Fourniture & pose baie vitrée",
        quantity: 1,
        unitPrice: 500,
        tvaRate: 21,
        totalHt: 500,
      },
    ],
  };
}

describe("PDF facture (génération serveur compatible)", () => {
  it("génère un buffer PDF valide commençant par %PDF", async () => {
    const doc = await buildFacturePdfDoc(makeFacture(), { name: "Mon Entreprise" });
    const arrayBuffer = doc.output("arraybuffer");
    const bytes = new Uint8Array(arrayBuffer);
    const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
    expect(header).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(500);
  });

  it("calcule le nom de fichier standard", () => {
    expect(facturePdfFilename(makeFacture())).toBe("facture-fac-2026-0001.pdf");
  });
});

describe("Libellés pays PDF", () => {
  it("retourne un libellé compatible avec les polices PDF standard", () => {
    expect(getPdfCountryLabel("BE")).toBe("Belgique");
    expect(getPdfCountryLabel("FR")).toBe("France");
    expect(getPdfCountryLabel("BE")).not.toMatch(/[\uD83C][\uDDE6-\uDDFF]/);
  });
});

describe("PDF devis (génération serveur compatible)", () => {
  it("génère un buffer PDF valide commençant par %PDF", async () => {
    const doc = await buildDevisPdfDoc(makeDevis(), { company: { name: "Mon Entreprise" } });
    const arrayBuffer = doc.output("arraybuffer");
    const bytes = new Uint8Array(arrayBuffer);
    const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
    expect(header).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(500);
  });

  it("calcule le nom de fichier standard", () => {
    expect(devisPdfFilename(makeDevis())).toBe("devis-dev-be-2026-0001.pdf");
  });
});
