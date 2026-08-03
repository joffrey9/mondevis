"use client";

import { useState } from "react";
import { createPortalSession } from "@/app/actions/checkout";

export function PortalButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const { url } = await createPortalSession();
      if (url) window.location.href = url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
      }
    >
      {loading ? "Redirection…" : "Gérer mon abonnement →"}
    </button>
  );
}
