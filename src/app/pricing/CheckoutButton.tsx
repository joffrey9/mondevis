"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCheckoutSession } from "@/app/actions/checkout";

interface Props {
  plan: "pro" | "business";
  isCurrentPlan: boolean;
  isAuthenticated: boolean;
  popular: boolean;
  label: string;
}

export function CheckoutButton({ plan, isCurrentPlan, isAuthenticated, popular, label }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (isCurrentPlan) {
      router.push("/dashboard");
      return;
    }
    if (!isAuthenticated) {
      router.push("/auth/signin");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession(plan);
      if (url) window.location.href = url;
    } catch (e) {
      setError((e as Error).message || "Erreur inattendue");
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        onClick={handleClick}
        disabled={loading || isCurrentPlan}
        className={`w-full block text-center py-3.5 rounded-xl font-semibold transition-all duration-300 disabled:opacity-60 ${
          popular
            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
        }`}
      >
        {loading ? "Redirection vers Stripe…" : isCurrentPlan ? "✅ Plan actuel" : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-600 text-center">{error}</p>}
    </div>
  );
}
