"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

interface WhatsAppShareButtonProps {
  /** Numéro WhatsApp de l'artisan (format international, sans +) */
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

/**
 * Bouton "Envoyer par WhatsApp" qui ouvre wa.me avec un message pré-formaté.
 */
export function WhatsAppShareButton({
  whatsappNumber,
  clientName,
  devisNumber,
  totalTtc,
  devisUrl,
  companyName,
}: WhatsAppShareButtonProps) {
  const [sent, setSent] = useState(false);

  if (!whatsappNumber) return null;

  function handleShare() {
    const fullUrl = typeof window !== "undefined"
      ? `${window.location.origin}${devisUrl}`
      : devisUrl;

    const msg = encodeURIComponent(
      `📄 *Devis ${devisNumber}*${companyName ? ` — ${companyName}` : ""}\n\n` +
      `Bonjour ${clientName},\n\n` +
      `Voici votre devis d'un montant de *${totalTtc.toFixed(2)} € TTC*.\n\n` +
      `Vous pouvez le consulter ici : ${fullUrl}\n\n` +
      `Cordialement.`
    );

    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, "_blank");
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition shadow-sm ${
        sent
          ? "bg-green-600 text-white"
          : "bg-green-500 text-white hover:bg-green-600"
      }`}
    >
      <MessageCircle className="w-4 h-4" />
      {sent ? "✅ Envoyé !" : "📱 Envoyer par WhatsApp"}
    </button>
  );
}
