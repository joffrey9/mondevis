// ── Config pays : France & Belgique ──
// Source unique pour les taux TVA, mentions légales et formats
// par pays — réutilisé dans le formulaire, la création, le rendu

export type Country = "FR" | "BE";

export interface CountryConfig {
  label: string;
  flag: string;
  currency: string;
  locale: string;
  companyLabel: string;
  companyPlaceholder: string;
  legalMentions: string[];
  tvaRates: { value: number; label: string; hint?: string }[];
  defaultTvaRate: number;
}

export const COUNTRIES: Record<Country, CountryConfig> = {
  FR: {
    label: "France",
    flag: "🇫🇷",
    currency: "€",
    locale: "fr-FR",
    companyLabel: "SIRET",
    companyPlaceholder: "123 456 789 00010",
    legalMentions: [
      "Délai de rétractation de 14 jours pour les clients particuliers (conformément à la directive européenne)",
      "Garantie décennale (si travaux de gros œuvre concernés)",
      "Tribunal de commerce compétent en cas de litige",
      "TVA non applicable, article 293 B du CGI (régime de la franchise en base de TVA) — le cas échéant",
    ],
    tvaRates: [
      { value: 20,   label: "TVA 20%",   hint: "Taux standard — tous travaux courants" },
      { value: 10,   label: "TVA 10%",   hint: "Taux réduit — rénovation de logements >2 ans" },
      { value: 5.5,  label: "TVA 5,5%", hint: "Taux super-réduit — rénovation énergétique, équipements PMR" },
      { value: 2.1,  label: "TVA 2,1%", hint: "Taux particulier — sécurité sociale, presse" },
      { value: 0,    label: "TVA 0%",   hint: "Hors champ TVA / auto-liquidation (B2B)" },
    ],
    defaultTvaRate: 20,
  },
  BE: {
    label: "Belgique",
    flag: "🇧🇪",
    currency: "€",
    locale: "fr-BE",
    companyLabel: "N° TVA / BCE",
    companyPlaceholder: "BE 0123.456.789",
    legalMentions: [
      "Délai de rétractation de 14 jours pour les clients particuliers (conformément à la directive européenne)",
      "Garantie décennale (si travaux de gros œuvre concernés)",
      "Tribunal de l'entreprise compétent en cas de litige",
      "Application de l'autoliquidation de la TVA conformément à l'article 20 de l'arrêté royal n°1 du CTVA — la TVA est due par le client cocontractant (le cas échéant)",
    ],
    tvaRates: [
      { value: 21,   label: "TVA 21%",   hint: "Taux standard — tous travaux courants" },
      { value: 12,   label: "TVA 12%",   hint: "Taux réduit — logement social, certaines rénovations" },
      { value: 6,    label: "TVA 6%",    hint: "Taux super-réduit — rénovation logement >10 ans, produits essentiels" },
      { value: 0,    label: "Co-contractant (autoliquidation)", hint: "⚠️ TVA due par le client (B2B) — mention légale automatique ajoutée" },
    ],
    defaultTvaRate: 21,
  },
};

/** Liste des pays supportés */
export const COUNTRY_LIST: { code: Country; label: string; flag: string }[] = [
  { code: "FR", label: "France", flag: "🇫🇷" },
  { code: "BE", label: "Belgique", flag: "🇧🇪" },
];

/** Récupère la config d'un pays */
export function getCountry(country: Country): CountryConfig {
  return COUNTRIES[country];
}

/** Retourne les taux TVA valides pour un pays */
export function getTvaRates(country: Country) {
  return COUNTRIES[country].tvaRates;
}

/** Valide un taux TVA pour un pays donné, fallback sur le défaut */
export function validateTvaRate(country: Country, rate: number): number {
  const valid = COUNTRIES[country].tvaRates.find((r) => r.value === rate);
  return valid ? rate : COUNTRIES[country].defaultTvaRate;
}

/** Liste des professions/métiers avec suggestions pré-remplies */
export const PROFESSIONS: Record<string, { value: string; label: string; emoji: string; suggestion: string }[]> = {
  "🏗️ Second œuvre": [
    { value: "Menuiserie", emoji: "🪵", label: "Menuiserie", suggestion: "Pose de parquet en chêne massif — 35m²" },
    { value: "Plâtrerie", emoji: "🏗️", label: "Plâtrerie / Placo", suggestion: "Pose de cloisons placo — 40m²" },
    { value: "Peinture", emoji: "🎨", label: "Peinture", suggestion: "Peinture intérieure — murs et plafonds, 60m²" },
    { value: "Carrelage", emoji: "🔲", label: "Carrelage", suggestion: "Pose de carrelage sol et mural — 25m²" },
    { value: "Électricité", emoji: "⚡", label: "Électricité", suggestion: "Mise aux normes tableau électrique — maison" },
    { value: "Plomberie", emoji: "🔧", label: "Plomberie", suggestion: "Installation sanitaire complète — salle de bain" },
  ],
  "🏠 Gros œuvre": [
    { value: "Toiture", emoji: "🏠", label: "Toiture / Charpente", suggestion: "Réfection de toiture — ardoises, 80m²" },
    { value: "Maçonnerie", emoji: "🧱", label: "Maçonnerie", suggestion: "Construction mur de soutènement — parpaings" },
    { value: "Isolation", emoji: "🌡️", label: "Isolation", suggestion: "Isolation des combles — laine de roche, 60m²" },
  ],
  "🌿 Extérieur": [
    { value: "Jardin/Paysage", emoji: "🌳", label: "Jardin / Paysage", suggestion: "Aménagement paysager — terrasse + plantations" },
    { value: "Terrasse", emoji: "🪨", label: "Terrasse", suggestion: "Construction terrasse en bois — 30m²" },
  ],
};

/**
 * Normalise un numéro TVA / SIRET : retire espaces, points et tirets,
 * passe en majuscules. Helper partagé pour la détection de type client
 * et la détection du pays (FR / BE) dans les formulaires.
 */
export function normalizeNumero(numero: string | null | undefined): string {
  if (!numero) return "";
  return numero.replace(/[\s.\-]/g, "").toUpperCase().trim();
}

/**
 * Détecte si un client est Professionnel ou Particulier
 * en fonction de son numéro de TVA / SIRET.
 *
 * 🇫🇷 France : SIRET (14 chiffres) ou TVA FR + 11 chiffres → Professionnel
 * 🇧🇪 Belgique : TVA BE + 10 chiffres → Professionnel
 * Sinon → Particulier
 */
export function detectClientType(numero: string | null | undefined, _country?: Country): "professionnel" | "particulier" {
  const cleaned = normalizeNumero(numero);
  if (!cleaned) return "particulier";

  // Détection par format du numéro (indépendant du pays sélectionné)
  // SIRET France : 14 chiffres
  if (/^\d{14}$/.test(cleaned)) return "professionnel";
  // TVA intracommunautaire FR : FR + 11 chiffres
  if (/^FR\d{11}$/.test(cleaned)) return "professionnel";
  // TVA belge : BE + 10 chiffres
  if (/^BE\d{10}$/.test(cleaned)) return "professionnel";

  return "particulier";
}

/** Formatte un montant selon la locale du pays */
export function formatCurrency(amount: number, country: Country): string {
  return new Intl.NumberFormat(COUNTRIES[country].locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
