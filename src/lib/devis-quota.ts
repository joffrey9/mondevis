/**
 * Quota de devis mensuel — plan Débutant (gratuit) vs Pro/Business.
 *
 * Module PUR (sans dépendance serveur / prisma) : testable unitairement.
 * Règles :
 *   - Plan Débutant  : 3 devis / mois civil (créés, quel que soit le statut)
 *   - Pro / Business : illimité
 */

export const FREE_MONTHLY_DEVIS_LIMIT = 3;

export type DevisQuota = {
  /** true si l'utilisateur est Pro/Business (abonnement actif ou en essai). */
  subscribed: boolean;
  /** Nombre de devis créés ce mois-ci. */
  used: number;
  /** Nombre de devis encore autorisés ce mois-ci. null si illimité. */
  remaining: number | null;
  /** Plafond mensuel. null si illimité. */
  limit: number | null;
  /** Peut-il encore créer un devis ? */
  allowed: boolean;
};

/** Calcule le quota à partir du statut d'abonnement et du compteur mensuel. */
export function computeDevisQuota(input: {
  subscribed: boolean;
  monthlyCount: number;
}): DevisQuota {
  const { subscribed, monthlyCount } = input;
  if (subscribed) {
    return {
      subscribed: true,
      used: monthlyCount,
      remaining: null,
      limit: null,
      allowed: true,
    };
  }
  const used = Math.max(0, monthlyCount);
  const remaining = Math.max(0, FREE_MONTHLY_DEVIS_LIMIT - used);
  return {
    subscribed: false,
    used,
    remaining,
    limit: FREE_MONTHLY_DEVIS_LIMIT,
    allowed: remaining > 0,
  };
}
