/** Libellé lisible du statut d'abonnement (module pur, sans dépendance serveur). */
export function formatSubscriptionStatus(status: string): string {
  const labels: Record<string, string> = {
    active: "✅ Actif",
    trialing: "🆓 Essai",
    past_due: "⚠️ Paiement en retard",
    canceled: "⛔ Résilié",
    incomplete: "⏳ En attente",
    unpaid: "🚫 Impayé",
  };
  return labels[status] ?? status;
}
