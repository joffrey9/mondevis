import { describe, it, expect } from "vitest";
import { formatSubscriptionStatus } from "../format-subscription";

describe("formatSubscriptionStatus", () => {
  it("traduit les statuts Stripe en libellés français", () => {
    expect(formatSubscriptionStatus("active")).toBe("✅ Actif");
    expect(formatSubscriptionStatus("trialing")).toBe("🆓 Essai");
    expect(formatSubscriptionStatus("past_due")).toBe("⚠️ Paiement en retard");
    expect(formatSubscriptionStatus("canceled")).toBe("⛔ Résilié");
    expect(formatSubscriptionStatus("incomplete")).toBe("⏳ En attente");
    expect(formatSubscriptionStatus("unpaid")).toBe("🚫 Impayé");
  });

  it("retourne le statut brut si inconnu", () => {
    expect(formatSubscriptionStatus("paused")).toBe("paused");
  });
});
