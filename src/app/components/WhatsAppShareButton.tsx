"use client";

import { useState } from "react";
import { Send, Copy, Check, MessageCircle } from "lucide-react";

interface WhatsAppShareButtonProps {
  /** Numéro de téléphone du client (format international, sans +) — pour lui envoyer le devis */
  clientPhone?: string | null;
  /** Numéro WhatsApp de l'artisan (format international, sans +) — pour copier son lien de contact */
  whatsappNumber?: string | null;
  /** Nom du client */
  clientName: string;
  /** Numéro du devis */
  devisNumber: string;
  /** Montant TTC */
  totalTtc: number;
  /** URL de la page du devis (pour le lien) */
  devisUrl: string;
  /** Nom de l'entreprise */
  companyName?: string | null;
}

/** Nettoie un numéro de téléphone pour wa.me : garde uniquement les chiffres, enlève le préfixe 00 */
function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "").replace(/^00/, "");
}

/**
 * Boutons WhatsApp pour la fiche devis :
 * 1. Envoyer le devis au client (via son téléphone)
 * 2. Copier le lien WhatsApp de l'artisan dans le presse-papier
 */
export function WhatsAppShareButton({
  clientPhone,
  whatsappNumber,
  clientName,
  devisNumber,
  totalTtc,
  devisUrl,
  companyName,
}: WhatsAppShareButtonProps) {
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  function getFullUrl() {
    return typeof window !== "undefined"
      ? `${window.location.origin}${devisUrl}`
      : devisUrl;
  }

  /** Envoyer le devis directement au client sur WhatsApp */
  function handleSendToClient() {
    const clean = sanitizePhone(clientPhone ?? "");
    if (!clean) return;

    const fullUrl = getFullUrl();
    const msg = encodeURIComponent(
      `📄 *Devis ${devisNumber}*${companyName ? ` — ${companyName}` : ""}\n\n` +
      `Bonjour ${clientName},\n\n` +
      `Voici votre devis d'un montant de *${totalTtc.toFixed(2)} € TTC*.\n\n` +
      `Vous pouvez le consulter ici : ${fullUrl}\n\n` +
      `Cordialement.`
    );
    window.open(`https://wa.me/${clean}?text=${msg}`, "_blank");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  /** Copier le lien WhatsApp de l'artisan dans le presse-papier */
  async function handleCopyContact() {
    const clean = sanitizePhone(whatsappNumber ?? "");
    if (!clean) return;

    const fullUrl = getFullUrl();
    const link = `https://wa.me/${clean}?text=${encodeURIComponent(
      `Bonjour${companyName ? ` ${companyName}` : ""}, je suis intéressé par votre devis *${devisNumber}*. ${fullUrl}`
    )}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setCopyError(false);
    } catch (err) {
      console.warn("Clipboard copy failed:", err);
      // Fallback : créer un textarea temporaire
      try {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setCopyError(false);
      } catch {
        setCopyError(true);
      }
    }
    setTimeout(() => {
      setCopied(false);
      setCopyError(false);
    }, 3000);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Bouton 1 : Envoyer le devis au client */}
      {clientPhone ? (
        <button
          type="button"
          onClick={handleSendToClient}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition shadow-sm active:scale-95 ${
            sent
              ? "bg-green-600 text-white"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          <Send className="w-4 h-4" />
          {sent ? "✅ Envoyé !" : "📲 Envoyer au client"}
        </button>
      ) : (
        <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 bg-gray-100 border border-dashed border-gray-300">
          <MessageCircle className="w-4 h-4" />
          Ajoutez un téléphone client pour envoyer par WhatsApp
        </span>
      )}

      {/* Bouton 2 : Copier le lien WhatsApp de l'artisan */}
      {whatsappNumber && (
        <button
          type="button"
          onClick={handleCopyContact}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition shadow-sm active:scale-95 ${
            copied
              ? "bg-blue-600 text-white"
              : copyError
              ? "bg-orange-500 text-white"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {copied ? (
            <><Check className="w-4 h-4" /> Lien copié !</>
          ) : copyError ? (
            <><Copy className="w-4 h-4" /> Copie manuelle</>
          ) : (
            <><Copy className="w-4 h-4" /> Copier mon contact WhatsApp</>
          )}
        </button>
      )}
    </div>
  );
}
