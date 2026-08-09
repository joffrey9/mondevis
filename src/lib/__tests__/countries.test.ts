import { describe, it, expect } from "vitest";
import { normalizeNumero, detectClientType, validateTvaRate, getTvaRates, formatCurrency, COUNTRY_LIST, getCountry } from "../countries";

describe("normalizeNumero", () => {
  it("supprime espaces, points et tirets et passe en majuscules", () => {
    expect(normalizeNumero("be 0123.456.789")).toBe("BE0123456789");
    expect(normalizeNumero("FR-123-456-789-01")).toBe("FR12345678901");
    expect(normalizeNumero("  123 456 789 00010  ")).toBe("12345678900010");
  });

  it("retourne une chaîne vide pour null/undefined/vide", () => {
    expect(normalizeNumero(null)).toBe("");
    expect(normalizeNumero(undefined)).toBe("");
    expect(normalizeNumero("")).toBe("");
  });
});

describe("detectClientType", () => {
  it("détecte un professionnel avec un SIRET FR (14 chiffres)", () => {
    expect(detectClientType("123 456 789 00010")).toBe("professionnel");
    expect(detectClientType("12345678900010")).toBe("professionnel");
  });

  it("détecte un professionnel avec une TVA intracommunautaire FR", () => {
    expect(detectClientType("FR 12 345678901")).toBe("professionnel");
    expect(detectClientType("FR12345678901")).toBe("professionnel");
  });

  it("détecte un professionnel avec une TVA belge", () => {
    expect(detectClientType("BE 0123.456.789")).toBe("professionnel");
    expect(detectClientType("be0123456789")).toBe("professionnel");
  });

  it("retourne particulier sans numéro ou format inconnu", () => {
    expect(detectClientType(null)).toBe("particulier");
    expect(detectClientType("")).toBe("particulier");
    expect(detectClientType("12345")).toBe("particulier");
    expect(detectClientType("DE123456789")).toBe("particulier");
  });
});

describe("validateTvaRate", () => {
  it("conserve les taux valides du pays", () => {
    expect(validateTvaRate("FR", 20)).toBe(20);
    expect(validateTvaRate("FR", 5.5)).toBe(5.5);
    expect(validateTvaRate("BE", 21)).toBe(21);
    expect(validateTvaRate("BE", 6)).toBe(6);
    expect(validateTvaRate("BE", 0)).toBe(0);
  });

  it("retombe sur le taux par défaut si le taux est invalide", () => {
    expect(validateTvaRate("FR", 21)).toBe(20); // 21% n'existe pas en FR
    expect(validateTvaRate("BE", 20)).toBe(21); // 20% n'existe pas en BE
    expect(validateTvaRate("FR", 99)).toBe(20);
  });
});

describe("formatCurrency", () => {
  it("formate en euros selon la locale du pays", () => {
    const fr = formatCurrency(1234.5, "FR").replace(/[\u202F\u00A0]/g, " ");
    const be = formatCurrency(1234.5, "BE").replace(/[\u202F\u00A0]/g, " ");
    expect(fr).toContain("1 234,50");
    expect(be).toContain("1 234,50");
    expect(fr).toContain("€");
  });
});

describe("getTvaRates / COUNTRY_LIST", () => {
  it("expose les taux TVA de chaque pays", () => {
    expect(getTvaRates("FR").map((r) => r.value)).toEqual([20, 10, 5.5, 2.1, 0]);
    expect(getTvaRates("BE").map((r) => r.value)).toEqual([21, 12, 6, 0]);
  });

  it("liste la France et la Belgique", () => {
    expect(COUNTRY_LIST.map((c) => c.code)).toEqual(["FR", "BE"]);
  });
});


describe("Libellés pays compatibles PDF", () => {
  it("conserve le nom du pays sans drapeau emoji dans le libellé texte", () => {
    expect(getCountry("BE").label).toBe("Belgique");
    expect(getCountry("FR").label).toBe("France");
    expect(getCountry("BE").label).not.toMatch(/[\uD83C][\uDDE6-\uDDFF]/);
    expect(getCountry("FR").label).not.toMatch(/[\uD83C][\uDDE6-\uDDFF]/);
  });
});
