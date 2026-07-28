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

/** Copie une chaîne dans le presse-papier (avec fallback textarea) */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.warn("WhatsAppShareButton: clipboard failed", err);
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

/** Ouvre un lien dans un nouvel onglet sans être bloqué par les popup blockers */
function openUrl(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Boutons WhatsApp pour la fiche devis.
 *
 * Stratégie : on NE compte PAS sur le paramètre ?text= de wa.me car
 * WhatsApp le supprime souvent (anti-spam). À la place :
 * 1. On copie le message complet dans le presse-papier
 * 2. On ouvre wa.me/{phone} (sans texte)
 * 3. L'utilisateur colle le message (Ctrl+V / Cmd+V)
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
  const [step, setStep] = useState<"idle" | "copied" | "done">("idle");
  const [copyError, setCopyError] = useState(false);
  const [contactCopied, setContactCopied] = useState(false);
  const [contactError, setContactError] = useState(false);

  function getFullUrl() {
    return typeof window !== "undefined"
      ? `${window.location.origin}${devisUrl}`
      : devisUrl;
  }

  function buildMessage(): string {
    const fullUrl = getFullUrl();
    return (
      `Devis ${devisNumber}${companyName ? ` - ${companyName}` : ""}\n\n` +
      `Bonjour ${clientName},\n\n` +
      `Montant : ${totalTtc.toFixed(2).replace(".", ",")} EUR\n\n` +
      `Cordialement\n\n` +
      `${fullUrl}`
    );
  }

  async function handleSendToClient() {
    // Si déjà fait, on recopie seulement sans rouvrir WhatsApp
    if (step === "done") {
      const ok = await copyToClipboard(buildMessage());
      setStep(ok ? "done" : "idle");
      setCopyError(!ok);
      if (!ok) setTimeout(() => setCopyError(false), 3000);
      return;
    }

    const clean = sanitizePhone(clientPhone ?? "");
    if (!clean) return;

    // Copier le message
    const ok = await copyToClipboard(buildMessage());
    if (!ok) {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
      return;
    }

    setStep("copied");

    // Ouvrir WhatsApp (sans ?text=)
    openUrl(`https://wa.me/${clean}`);

    // done → puis retour idle après 20s
    setTimeout(() => setStep("done"), 3000);
    setTimeout(() => setStep("idle"), 20000);
  }

  async function handleCopyContact() {
    const clean = sanitizePhone(whatsappNumber ?? "");
    if (!clean) return;

    const fullUrl = getFullUrl();
    const link = `https://wa.me/${clean}?text=${encodeURIComponent(
      `Bonjour${companyName ? ` ${companyName}` : ""}, je suis interesse par votre devis ${devisNumber}. ${fullUrl}`
    )}`;

    const ok = await copyToClipboard(link);
    if (ok) {
      setContactCopied(true);
      setContactError(false);
    } else {
      setContactError(true);
    }
    setTimeout(() => {
      setContactCopied(false);
      setContactError(false);
    }, 3000);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Bouton 1 : Envoyer le devis au client */}
      {clientPhone ? (
        <button
          type="button"
          onClick={handleSendToClient}
          disabled={step === "copied"}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition shadow-sm active:scale-95 disabled:opacity-80 ${
            copyError
              ? "bg-orange-500 text-white"
              : step === "done"
              ? "bg-green-600 text-white"
              : step === "copied"
              ? "bg-blue-600 text-white"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          <Send className="w-4 h-4" />
          {copyError
            ? "Erreur copie"
            : step === "done"
            ? "Coller dans WhatsApp (Cmd+V)"
            : step === "copied"
            ? "Message copie !"
            : "Envoyer par WhatsApp"}
        </button>
      ) : (
        <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 bg-gray-100 border border-dashed border-gray-300">
          <MessageCircle className="w-4 h-4" />
          Ajoutez un telephone client pour envoyer par WhatsApp
        </span>
      )}

      {/* Bouton 2 : Copier le lien WhatsApp de l'artisan */}
      {whatsappNumber && (
        <button
          type="button"
          onClick={handleCopyContact}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition shadow-sm active:scale-95 ${
            contactCopied
              ? "bg-blue-600 text-white"
              : contactError
              ? "bg-orange-500 text-white"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {contactCopied ? (
            <><Check className="w-4 h-4" /> Lien copie !</>
          ) : contactError ? (
            <><Copy className="w-4 h-4" /> Copie manuelle</>
          ) : (
            <><Copy className="w-4 h-4" /> Copier mon contact</>
          )}
        </button>
      )}
    </div>
  );
}
