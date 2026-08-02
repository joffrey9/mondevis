"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { sendDevisByEmail } from "@/app/actions/devis-envoi";

/**
 * Bouton d'envoi de devis par email (Resend).
 * Réservé aux devis avec un email client renseigné.
 */
export function DevisSendButtons({
  devisId,
  hasClientEmail,
  status,
}: {
  devisId: string;
  hasClientEmail: boolean;
  status: string;
}) {
  const [emailPending, startEmail] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  if (status === "archived" || status === "refused") return null;
  if (!hasClientEmail) return null;

  async function handleEmail() {
    setMessage(null);
    startEmail(async () => {
      try {
        const res = await sendDevisByEmail(devisId);
        setMessage({ ok: true, text: res.message });
        router.refresh();
      } catch (e) {
        setMessage({ ok: false, text: e instanceof Error ? e.message : "Erreur lors de l'envoi" });
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleEmail}
        disabled={emailPending}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
      >
        {emailPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {emailPending ? "Envoi en cours..." : "✉️ Envoyer par email"}
      </button>
      {message && (
        <p
          role="status"
          aria-live="polite"
          className={`text-sm flex items-start gap-1.5 ${
            message.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{message.text}</span>
        </p>
      )}
    </div>
  );
}
