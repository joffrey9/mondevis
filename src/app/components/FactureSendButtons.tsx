"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { sendFactureByEmail, sendFactureViaPeppol } from "@/app/actions/facture-envoi";

/**
 * Boutons d'envoi de facture :
 * - Email (Resend) : réservé aux factures avec un email client renseigné (particulier ou pro)
 * - Peppol (e-invoice.be) : réservé aux factures B2B belges (client professionnel avec n° TVA)
 */
export function FactureSendButtons({
  factureId,
  hasClientEmail,
  canSendPeppol,
  status,
}: {
  factureId: string;
  hasClientEmail: boolean;
  canSendPeppol: boolean;
  status: string;
}) {
  const [emailPending, startEmail] = useTransition();
  const [peppolPending, startPeppol] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  if (status === "cancelled") return null;
  if (!hasClientEmail && !canSendPeppol) return null;

  async function handleEmail() {
    setMessage(null);
    startEmail(async () => {
      try {
        const res = await sendFactureByEmail(factureId);
        setMessage({ ok: true, text: res.message });
        router.refresh();
      } catch (e) {
        setMessage({ ok: false, text: e instanceof Error ? e.message : "Erreur lors de l'envoi" });
      }
    });
  }

  async function handlePeppol() {
    setMessage(null);
    startPeppol(async () => {
      try {
        const res = await sendFactureViaPeppol(factureId);
        setMessage({ ok: true, text: res.message });
        router.refresh();
      } catch (e) {
        setMessage({ ok: false, text: e instanceof Error ? e.message : "Erreur lors de l'envoi Peppol" });
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
        {hasClientEmail && (
          <button
            type="button"
            onClick={handleEmail}
            disabled={emailPending || peppolPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
          >
            {emailPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {emailPending ? "Envoi en cours..." : "✉️ Envoyer par email"}
          </button>
        )}
        {canSendPeppol && (
          <button
            type="button"
            onClick={handlePeppol}
            disabled={emailPending || peppolPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
          >
            {peppolPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {peppolPending ? "Envoi Peppol..." : "🇪🇺 Envoyer via Peppol (B2B)"}
          </button>
        )}
      </div>
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
