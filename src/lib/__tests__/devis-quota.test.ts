import { describe, it, expect } from "vitest";
import {
  computeDevisQuota,
  FREE_MONTHLY_DEVIS_LIMIT,
} from "../devis-quota";

describe("computeDevisQuota", () => {
  it("plafonne le plan Débutant à 3 devis/mois", () => {
    expect(FREE_MONTHLY_DEVIS_LIMIT).toBe(3);
    expect(computeDevisQuota({ subscribed: false, monthlyCount: 2 })).toEqual({
      subscribed: false,
      used: 2,
      remaining: 1,
      limit: 3,
      allowed: true,
    });
  });

  it("bloque au-delà de la limite gratuite", () => {
    expect(computeDevisQuota({ subscribed: false, monthlyCount: 3 })).toEqual({
      subscribed: false,
      used: 3,
      remaining: 0,
      limit: 3,
      allowed: false,
    });
    expect(computeDevisQuota({ subscribed: false, monthlyCount: 7 })).toEqual({
      subscribed: false,
      used: 7,
      remaining: 0,
      limit: 3,
      allowed: false,
    });
  });

  it("négatif est ramené à 0", () => {
    expect(computeDevisQuota({ subscribed: false, monthlyCount: -5 })).toEqual({
      subscribed: false,
      used: 0,
      remaining: 3,
      limit: 3,
      allowed: true,
    });
  });

  it("abonné Pro/Business : illimité même au-delà de 3", () => {
    expect(computeDevisQuota({ subscribed: true, monthlyCount: 42 })).toEqual({
      subscribed: true,
      used: 42,
      remaining: null,
      limit: null,
      allowed: true,
    });
  });
});
