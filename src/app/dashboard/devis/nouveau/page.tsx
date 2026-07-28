"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Globe, Sparkles, Wrench, Settings } from "lucide-react";
import { createDevis } from "@/app/actions/devis";
import { COUNTRY_LIST, getTvaRates, PROFESSIONS, type Country } from "@/lib/countries";
import { DictationButton } from "@/app/components/DictationButton";
import { AddressAutocomplete } from "@/app/components/AddressAutocomplete";
import { Wand2 } from "lucide-react";
import Link from "next/link";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tvaRate: number;
}

export default function NouveauDevisPage() {
  const router = useRouter();
  const [country, setCountry] = useState<Country>("FR");
  const [profession, setProfession] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [devisPrefix, setDevisPrefix] = useState("");
  const [acomptePct, setAcomptePct] = useState(30);
  const [delaiPaiement, setDelaiPaiement] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, tvaRate: 20 },
  ]);
  const [description, setDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tvaOptions = getTvaRates(country);

  function handleCountryChange(newCountry: Country) {
    setCountry(newCountry);
    const defaultRate = newCountry === "BE" ? 21 : 20;
    setLines((prev) => prev.map((l) => ({ ...l, tvaRate: defaultRate })));
  }

  function addLine() {
    const defaultRate = country === "BE" ? 21 : 20;
    setLines([...lines, { id: String(Date.now()), description: "", quantity: 1, unitPrice: 0, tvaRate: defaultRate }]);
  }

  function removeLine(id: string) {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.id !== id));
  }

  function updateLine(id: string, field: keyof LineItem, value: string | number) {
    setLines(lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  const totalHt = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const totalTtc = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (1 + l.tvaRate / 100), 0);
  const acompteMontant = totalTtc * (acomptePct / 100);

  async function handleAiEnhance() {
    if (!description.trim()) { setError("Décris d'abord le projet dans le champ ci-dessus"); return; }
    setAiLoading(true); setError(null);
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, prestation: profession || "Travaux de rénovation", country }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDescription(data.generated);
    } catch (e) { setError((e as Error).message); }
    finally { setAiLoading(false); }
  }

  async function handleAiGenerate() {
    if (!description.trim()) { setError("Décris d'abord le projet dans le champ ci-dessus"); return; }
    setAiGenerating(true); setError(null);
    try {
      const res = await fetch("/api/generate-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, prestation: profession || "Travaux de rénovation", country }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Mettre à jour la description avec la version reformulée
      if (data.description) setDescription(data.description);

      // Remplacer les lignes par celles générées par l'IA
      if (data.lines && data.lines.length > 0) {
        setLines(data.lines.map((l: any, i: number) => ({
          id: String(Date.now() + i),
          description: l.description || "",
          quantity: Math.max(1, l.quantity || 1),
          unitPrice: Math.max(0, l.unitPrice || 0),
          tvaRate: l.tvaRate || (country === "BE" ? 21 : 20),
        })));
      }
    } catch (e) { setError((e as Error).message); }
    finally { setAiGenerating(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) { setError("Nom du client requis"); return; }
    if (lines.some((l) => !l.description.trim())) { setError("Toutes les lignes doivent avoir une description"); return; }

    setSaving(true); setError(null);
    try {
      const devis = await createDevis({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        country,
        profession: profession || undefined,
        devisPrefix: devisPrefix.trim() || undefined,
        lines: lines.map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, tvaRate: l.tvaRate })),
        notes: [description, notes].filter(Boolean).join("\n\n") || undefined,
        acomptePct,
        delaiPaiement,
      });
      router.push(`/dashboard/devis/${devis.id}`);
    } catch (e) { setError((e as Error).message); setSaving(false); }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/devis" className="p-2 hover:bg-gray-100 rounded transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-3xl font-bold">Nouveau devis</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pays */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold mb-4">
            <Globe className="w-4 h-4 inline mr-2" />
            Pays
          </h2>
          <div className="flex gap-3">
            {COUNTRY_LIST.map((c) => (
              <button key={c.code} type="button" onClick={() => handleCountryChange(c.code)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition ${
                  country === c.code ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}>
                <span className="text-lg">{c.flag}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Métier */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold mb-4">
            <Wrench className="w-4 h-4 inline mr-2" />
            Votre métier
          </h2>
          <select value={profession} onChange={(e) => setProfession(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">-- Sélectionnez votre spécialité --</option>
            {Object.entries(PROFESSIONS).map(([cat, trades]) => (
              <optgroup key={cat} label={cat}>
                {trades.map((t) => (
                  <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Client complet */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold mb-4">👤 Client</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
                placeholder="Nom du client *" required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Email du client" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Téléphone" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <AddressAutocomplete
                  value={clientAddress}
                  onChange={setClientAddress}
                  country={country}
                  placeholder={country === "BE" ? "Cherchez une adresse en Belgique..." : "Cherchez une adresse en France..."}
                />
                <DictationButton onResult={(text) => setClientAddress(prev => prev ? prev + " " + text : text)} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Tapez au moins 3 caractères pour voir les suggestions (ex: "Rue des Artisans...")
              </p>
            </div>
          </div>
        </div>

        {/* Description IA */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold mb-2">📝 Description du projet</h2>
          <p className="text-xs text-gray-400 mb-3">Décris les travaux en quelques mots, puis laisse l&apos;IA générer le devis complet.</p>
          <div className="flex gap-2 items-start">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: pose parquet chêne massif 35m² avec sous-couche, Lyon" rows={3}
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <div className="flex flex-col gap-1.5">
              <DictationButton onResult={(text) => setDescription(prev => prev ? prev + " " + text : text)} />
              <button type="button" onClick={handleAiEnhance} disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium text-xs hover:bg-gray-200 disabled:opacity-50 transition"
                title="Améliorer le texte">
                <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
                {aiLoading ? "..." : "Améliorer"}
              </button>
              <button type="button" onClick={handleAiGenerate} disabled={aiGenerating || !description.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-xs hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition shadow-sm">
                <Wand2 className={`w-3.5 h-3.5 ${aiGenerating ? "animate-spin" : ""}`} />
                {aiGenerating ? "Génération..." : "✨ Générer le devis"}
              </button>
            </div>
          </div>
          {aiGenerating && (
            <div className="mt-3 flex items-center gap-2 text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
              L&apos;IA analyse votre description et génère les lignes du devis...
            </div>
          )}
        </div>

        {/* Lignes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Lignes du devis</h2>
            <button type="button" onClick={addLine}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
              <Plus className="w-4 h-4" /> Ajouter une ligne
            </button>
          </div>
          <div className="space-y-3">
            {lines.map((line) => {
              const tvaInfo = tvaOptions.find((r) => r.value === line.tvaRate);
              return (
                <div key={line.id} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <input type="text" value={line.description} onChange={(e) => updateLine(line.id, "description", e.target.value)}
                      placeholder="Description" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <div className="w-16 sm:w-20">
                      <input type="number" value={line.quantity || ""} onChange={(e) => updateLine(line.id, "quantity", parseFloat(e.target.value) || 0)}
                        placeholder="Qté" min="0" step="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="w-20 sm:w-24">
                      <input type="number" value={line.unitPrice || ""} onChange={(e) => updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        placeholder="Prix" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="w-24 sm:w-28">
                      <select value={line.tvaRate} onChange={(e) => updateLine(line.id, "tvaRate", parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" title={tvaInfo?.hint}>
                        {tvaOptions.map((r) => (<option key={r.value} value={r.value} title={r.hint}>{r.label}</option>))}
                      </select>
                    </div>
                    <div className="w-16 sm:w-20 text-right py-2 text-xs sm:text-sm text-gray-700 tabular-nums font-medium truncate">
                      {(line.quantity * line.unitPrice).toFixed(2)} €
                    </div>
                    <button type="button" onClick={() => removeLine(line.id)} className="p-2 hover:bg-red-100 rounded transition">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-right">
            <p className="text-sm text-gray-500">Total HT : <span className="font-medium text-gray-900 tabular-nums">{totalHt.toFixed(2)} €</span></p>
            <p className="text-lg font-bold tabular-nums">Total TTC : {totalTtc.toFixed(2)} €</p>
          </div>
        </div>

        {/* Paramètres avancés */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 w-full text-left">
            <Settings className="w-4 h-4" />
            Paramètres avancés
            <span className="ml-auto text-gray-400">{showAdvanced ? "▲" : "▼"}</span>
          </button>
          {showAdvanced && (
            <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
              {/* Numérotation */}
              <div>
                <label className="text-sm font-medium text-gray-700">Préfixe du devis</label>
                <input type="text" value={devisPrefix} onChange={(e) => setDevisPrefix(e.target.value)}
                  placeholder={country === "BE" ? "DEV-BE" : "DEV"}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-1">
                  La numérotation est désormais <strong>séquentielle</strong> :
                  <br />Numéro généré : <strong>{devisPrefix || (country === "BE" ? "DEV-BE" : "DEV")}-{new Date().getFullYear()}-XXXX</strong>
                  <br />Pour changer le point de départ, allez dans <strong>Mon entreprise</strong>.
                </p>
              </div>
              {/* Conditions de paiement */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Acompte à la commande</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="number" value={acomptePct} onChange={(e) => setAcomptePct(parseFloat(e.target.value) || 0)}
                      min="0" max="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  {totalTtc > 0 && (
                    <p className="text-xs text-gray-400 mt-1">Soit {acompteMontant.toFixed(2)} € TTC</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Délai de paiement</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="number" value={delaiPaiement} onChange={(e) => setDelaiPaiement(parseInt(e.target.value) || 30)}
                      min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span className="text-sm text-gray-500">jours</span>
                  </div>
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700">Notes personnelles</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes personnelles, conditions particulières..."
                  rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
          {saving ? "Création..." : `${country === "BE" ? "🇧🇪" : "🇫🇷"} Créer le devis`}
        </button>
      </form>
    </div>
  );
}
