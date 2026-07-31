"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, Trash2, Building2, MapPin, Phone, Mail, Hash, Image } from "lucide-react";
import { updateProfile, getProfile } from "@/app/actions/profile";
import type { ProfileInput } from "@/app/actions/profile";

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<ProfileInput>({
    companyName: "",
    companySiret: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    companyLogo: null,
    companyIban: "",
    companyBic: "",
    nextDevisNumber: null,
    peppolProvider: "",
    whatsappNumber: "",
    customLegalMentions: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const profile = await getProfile();
      if (profile) {
        setForm({
          companyName: profile.companyName || "",
          companySiret: profile.companySiret || "",
          companyAddress: profile.companyAddress || "",
          companyPhone: profile.companyPhone || "",
          companyEmail: profile.companyEmail || "",
          companyLogo: profile.companyLogo || null,
          companyIban: profile.companyIban || "",
          companyBic: profile.companyBic || "",
          nextDevisNumber: profile.nextDevisNumber ?? null,
        peppolProvider: profile.peppolProvider || "",
        whatsappNumber: profile.whatsappNumber || "",
        customLegalMentions: profile.customLegalMentions || "",
      });
        setLogoPreview(profile.companyLogo || null);
      }
    } catch (e) {
      setError("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Format accepté : PNG, JPEG ou WebP");
      return;
    }
    if (file.size > 500_000) {
      setError("Le logo ne doit pas dépasser 500 KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setForm((prev) => ({ ...prev, companyLogo: dataUrl }));
      setLogoPreview(dataUrl);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setForm((prev) => ({ ...prev, companyLogo: null }));
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateProfile(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-100">Mon entreprise</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Ces informations apparaîtront sur vos devis, factures et exports UBL Peppol
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2 dark:text-gray-100">
            <Image className="w-4 h-4" />
            Logo de l&apos;entreprise
          </h2>
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {logoPreview ? (
                <div className="relative w-32 h-32 rounded-xl border-2 border-gray-200 dark:border-[#1e1e30] overflow-hidden bg-gray-50 dark:bg-[#0f0f1a]">
                  <img src={logoPreview} alt="Logo entreprise" className="w-full h-full object-contain p-2" />
                  <button type="button" onClick={removeLogo}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-sm" title="Supprimer le logo">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#0f0f1a] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <Upload className="w-8 h-8 mb-1" />
                  <span className="text-xs">Logo</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Téléchargez le logo de votre entreprise (PNG, JPEG ou WebP — max 500 KB).</p>
              <div className="flex gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium">
                  <Upload className="w-4 h-4" />
                  {logoPreview ? "Changer le logo" : "Choisir un fichier"}
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} className="hidden" />
                </label>
                {logoPreview && (
                  <button type="button" onClick={removeLogo} className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium">
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Infos entreprise */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2 dark:text-gray-100">
            <Building2 className="w-4 h-4" /> Informations de l&apos;entreprise
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l&apos;entreprise</label>
              <input type="text" value={form.companyName || ""} onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                placeholder="Votre entreprise" className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3" /> SIRET (FR) ou N° TVA (BE)
              </label>
              <input type="text" value={form.companySiret || ""} onChange={(e) => setForm((prev) => ({ ...prev, companySiret: e.target.value }))}
                placeholder="123 456 789 00010 ou BE 0123.456.789" className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone</label>
              <input type="tel" value={form.companyPhone || ""} onChange={(e) => setForm((prev) => ({ ...prev, companyPhone: e.target.value }))}
                placeholder="+32 4 12 34 56 78" className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email professionnel</label>
              <input type="email" value={form.companyEmail || ""} onChange={(e) => setForm((prev) => ({ ...prev, companyEmail: e.target.value }))}
                placeholder="contact@monentreprise.be" className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Adresse</label>
              <textarea value={form.companyAddress || ""} onChange={(e) => setForm((prev) => ({ ...prev, companyAddress: e.target.value }))}
                placeholder="Rue, numéro, code postal, ville" rows={2} className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            </div>
          </div>
        </div>

        {/* Coordonnées bancaires */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <h2 className="font-semibold mb-4 dark:text-gray-100">🏦 Coordonnées bancaires</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">IBAN et BIC pour les virements — ils apparaîtront sur les factures et dans l&apos;export UBL Peppol.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IBAN</label>
              <input type="text" value={form.companyIban || ""} onChange={(e) => setForm((prev) => ({ ...prev, companyIban: e.target.value }))}
                placeholder="BE68 1234 5678 9012" maxLength={34} className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BIC</label>
              <input type="text" value={form.companyBic || ""} onChange={(e) => setForm((prev) => ({ ...prev, companyBic: e.target.value }))}
                placeholder="BBRUBEBB" maxLength={11} className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            </div>
          </div>
        </div>

        {/* Numérotation des devis */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <h2 className="font-semibold mb-4 dark:text-gray-100">🔢 Numérotation des devis</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Les numéros de devis sont générés automatiquement (DEV-2026-0001, DEV-2026-0002...). Vous pouvez définir un point de départ personnalisé.</p>
          <div>              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prochain numéro de devis</label>
              <input type="number" value={form.nextDevisNumber ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, nextDevisNumber: e.target.value ? parseInt(e.target.value, 10) : null }))}
                placeholder="Laisser vide pour auto" min="1" max="99999" className="w-full max-w-xs px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Exemple : entrez <strong>42</strong> pour que le prochain devis soit <strong>DEV-{new Date().getFullYear()}-0042</strong></p>
          </div>
        </div>

        {/* Connexion Peppol */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <h2 className="font-semibold mb-4 dark:text-gray-100">📤 Connexion Peppol</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Peppol est le réseau européen d&apos;échange de factures électroniques.
            {new Date().getFullYear() >= 2026 ? " Depuis 2026, la Belgique impose Peppol pour les factures B2B." : ""}
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fournisseur Peppol</label>
              <select value={form.peppolProvider || ""} onChange={(e) => setForm((prev) => ({ ...prev, peppolProvider: e.target.value }))}
                className="w-full max-w-md px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200">
                <option value="">-- Non configuré --</option>
                <option value="einvoice">🇧🇪 e-invoice.be (recommandé pour la Belgique)</option>
                <option value="billit">🇧🇪 Billit (Peppol Belgique)</option>
                <option value="banqup">🇧🇪 Banqup (Peppol Belgique)</option>
                <option value="nexxhub">🇪🇺 NexxHub (Europe)</option>
                <option value="other">Autre fournisseur Peppol</option>
              </select>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium text-blue-800">🔗 Liens utiles</p>
              <ul className="space-y-1.5">
                <li><a href="https://www.e-invoice.be" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">🇧🇪 e-invoice.be — Plateforme Peppol belge officielle</a></li>
                <li><a href="https://www.billit.be" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">🇧🇪 Billit — Solution Peppol pour indépendants</a></li>
                <li><a href="https://www.banqup.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">🇧🇪 Banqup — Facturation électronique Peppol</a></li>
                <li><a href="https://peppol.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">🌐 peppol.org — Site officiel du réseau Peppol</a></li>
              </ul>
            </div>
            {form.peppolProvider && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                ✅ Fournisseur enregistré. Utilisez le bouton <strong>📤 Télécharger UBL (Peppol)</strong> sur chaque facture pour obtenir le fichier XML à importer chez votre fournisseur.
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <h2 className="font-semibold mb-4 dark:text-gray-100">📱 WhatsApp</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Configurez votre numéro WhatsApp pour envoyer les devis directement à vos clients depuis la page du devis.
            Un lien WhatsApp s&apos;ouvrira avec un message pré-formaté contenant le récapitulatif.
          </p>
          <div>              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numéro WhatsApp (format international, sans +)</label>
              <input type="tel" value={form.whatsappNumber || ""} onChange={(e) => setForm((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                placeholder="32412345678" className="w-full max-w-md px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Exemple : <strong>32412345678</strong> pour le numéro belge +32 4 12 34 56 78</p>
            {form.whatsappNumber && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 mt-3">
                ✅ WhatsApp configuré ! Le bouton apparaîtra sur vos devis.
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {/* Mentions légales personnalisées */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <h2 className="font-semibold mb-2 dark:text-gray-100">⚖️ Mentions légales personnalisées</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Ajoutez vos propres mentions légales qui apparaîtront sur vos devis et factures, en complément des mentions obligatoires par pays.
          </p>
          <textarea
            value={form.customLegalMentions || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, customLegalMentions: e.target.value }))}
            placeholder="Ex: Garantie de 2 ans sur tous les travaux de finition. Devis valable 30 jours à compter de la date d'émission."
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Une mention par ligne. Ces mentions seront ajoutées après les mentions légales obligatoires du pays sélectionné.</p>
        </div>

        {success && <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm p-3 rounded-lg border border-green-200 dark:border-green-800/30 flex items-center gap-2">✅ Profil mis à jour avec succès !</div>}
        {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm p-3 rounded-lg border border-red-200 dark:border-red-800/30">{error}</div>}

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm">
            <Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
