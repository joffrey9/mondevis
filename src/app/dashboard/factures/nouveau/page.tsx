"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Wrench, Settings, Plus, Trash2 } from "lucide-react";
import { createFacture } from "@/app/actions/factures";
import { getClient } from "@/app/actions/clients";
import { COUNTRY_LIST, getTvaRates, PROFESSIONS, type Country, normalizeNumero, detectClientType } from "@/lib/countries";
import { DictationButton } from "@/app/components/DictationButton";
import { AddressAutocomplete } from "@/app/components/AddressAutocomplete";
import { ClientSelect } from "@/app/components/ClientSelect";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tvaRate: number;
}

export default function NouvelleFacturePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-6"><div className="animate-pulse space-y-6"><div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" /><div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" /></div></div>}>
      <NouvelleFactureForm />
    </Suspense>
  );
}

function NouvelleFactureForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get("clientId");
  const [country, setCountry] = useState<Country>("FR");
  const [profession, setProfession] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientSiret, setClientSiret] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [facturePrefix, setFacturePrefix] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const acomptePct = 0; // % d'acompte (fixé à 0, configurabilité future)
  const [delaiPaiement, setDelaiPaiement] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, tvaRate: 20 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tvaOptions = getTvaRates(country);

  // Pré-remplir depuis ?clientId= (lien depuis le carnet clients)
  useEffect(() => {
    if (!clientIdParam) return;
    let cancelled = false;
    (async () => {
      try {
        const c = await getClient(clientIdParam);
        if (cancelled || !c) return;
        setSelectedClientId(c.id);
        setClientName(c.name);
        setClientEmail(c.email || "");
        setClientPhone(c.phone || "");
        setClientAddress(c.address || "");
        setClientSiret(c.siret || "");
        if (normalizeNumero(c.siret).startsWith("BE")) setCountry("BE");
      } catch {
        // client introuvable : on laisse la saisie libre
      }
    })();
    return () => { cancelled = true; };
  }, [clientIdParam]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) { setError("Nom du client requis"); return; }
    if (lines.some((l) => !l.description.trim())) { setError("Toutes les lignes doivent avoir une description"); return; }

    setSaving(true); setError(null);
    try {
      await createFacture({
        clientId: selectedClientId || undefined,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        clientSiret: clientSiret.trim() || undefined,
        country,
        profession: profession || undefined,
        facturePrefix: facturePrefix.trim() || undefined,
        iban: iban.trim() || undefined,
        bic: bic.trim() || undefined,
        lines: lines.map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, tvaRate: l.tvaRate })),
        notes: notes || undefined,
        acomptePct,
        delaiPaiement,
      });
      router.push("/dashboard/factures");
    } catch (e) { setError((e as Error).message); setSaving(false); }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/factures" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <h1 className="text-3xl font-bold dark:text-gray-100">Nouvelle facture</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pays */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <h2 className="font-semibold mb-4 dark:text-gray-100">
            <Globe className="w-4 h-4 inline mr-2" />
            Pays
          </h2>
          <div className="flex gap-3">
            {COUNTRY_LIST.map((c) => (
              <button key={c.code} type="button" onClick={() => handleCountryChange(c.code)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition ${
                  country === c.code ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-[#1e1e30] bg-white dark:bg-[#0f0f1a] text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}>
                <span className="text-lg">{c.flag}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Métier */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <h2 className="font-semibold mb-4 dark:text-gray-100">
            <Wrench className="w-4 h-4 inline mr-2" />
            Votre métier
          </h2>
          <select value={profession} onChange={(e) => setProfession(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200">
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

        {/* Client */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <h2 className="font-semibold mb-4 dark:text-gray-100">👤 Client</h2>
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Ou sélectionner un client du carnet
            </label>
            <ClientSelect
              selectedId={selectedClientId}
              onSelect={(c) => {
                if (!c) { setSelectedClientId(""); return; }
                setSelectedClientId(c.id);
                setClientName(c.name);
                setClientEmail(c.email || "");
                setClientPhone(c.phone || "");
                setClientAddress(c.address || "");
                setClientSiret(c.siret || "");
                if (normalizeNumero(c.siret).startsWith("BE")) setCountry("BE");
              }}
            />
            {selectedClientId && (
              <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1.5">
                ✓ Client du carnet lié — modifie les champs ci-dessous pour cette fiche seulement
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
                placeholder="Nom du client *" required
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            </div>
            <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Email du client" className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Téléphone" className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
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
            </div>
            {/* N° TVA / SIRET client avec détection automatique */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input type="text" value={clientSiret} onChange={(e) => setClientSiret(e.target.value)}
                    placeholder="N° TVA / SIRET du client (ex: FR12345678901 ou BE0123456789)"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    Saisissez le numéro pour détection automatique : 👤 Particulier ou 🏢 Professionnel
                  </p>
                </div>
                {clientName && (
                  <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                    detectClientType(clientSiret, country) === "professionnel"
                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                      : "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-700"
                  }`}>
                    {detectClientType(clientSiret, country) === "professionnel" ? "🏢 Professionnel" : "👤 Particulier"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Coordonnées bancaires */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <h2 className="font-semibold mb-4 dark:text-gray-100">🏦 Coordonnées bancaires</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            IBAN et BIC pour le virement — ces informations apparaîtront sur la facture et dans l&apos;export UBL Peppol.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">IBAN</label>
              <input type="text" value={iban} onChange={(e) => setIban(e.target.value)}
                placeholder="BE68 1234 5678 9012" maxLength={34}
                className="mt-1 w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">BIC</label>
              <input type="text" value={bic} onChange={(e) => setBic(e.target.value)}
                placeholder="BBRUBEBB" maxLength={11}
                className="mt-1 w-full px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
            </div>
          </div>
        </div>

        {/* Lignes */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold dark:text-gray-100">Lignes de la facture</h2>
            <button type="button" onClick={addLine}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
              <Plus className="w-4 h-4" /> Ajouter une ligne
            </button>
          </div>
          <div className="space-y-3">
            {lines.map((line) => (
              <div key={line.id} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 p-3 bg-gray-50 dark:bg-[#0f0f1a] rounded-lg">
                <div className="flex-1 min-w-0">
                  <input type="text" value={line.description} onChange={(e) => updateLine(line.id, "description", e.target.value)}
                    placeholder="Description" className="w-full px-3 py-2 border border-gray-300 dark:border-[#1e1e30] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#14141f] dark:text-gray-200" />
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-16 sm:w-20">
                    <input type="number" value={line.quantity || ""} onChange={(e) => updateLine(line.id, "quantity", parseFloat(e.target.value) || 0)}
                      placeholder="Qté" min="0" step="1" className="w-full px-3 py-2 border border-gray-300 dark:border-[#1e1e30] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#14141f] dark:text-gray-200" />
                  </div>
                  <div className="w-20 sm:w-24">
                    <input type="number" value={line.unitPrice || ""} onChange={(e) => updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                      placeholder="Prix" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 dark:border-[#1e1e30] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#14141f] dark:text-gray-200" />
                  </div>
                  <div className="w-24 sm:w-28">
                    <select value={line.tvaRate} onChange={(e) => updateLine(line.id, "tvaRate", parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#1e1e30] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#14141f] dark:text-gray-200">
                      {tvaOptions.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                    </select>
                  </div>
                  <div className="w-16 sm:w-20 text-right py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 tabular-nums font-medium truncate">
                    {(line.quantity * line.unitPrice).toFixed(2)} €
                  </div>
                  <button type="button" onClick={() => removeLine(line.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#1e1e30] space-y-1 text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total HT : <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{totalHt.toFixed(2)} €</span></p>
            <p className="text-lg font-bold tabular-nums dark:text-gray-100">Total TTC : {totalTtc.toFixed(2)} €</p>
          </div>
        </div>

        {/* Paramètres avancés */}
        <div className="bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-6 shadow-sm">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 w-full text-left">
            <Settings className="w-4 h-4" />
            Paramètres avancés
            <span className="ml-auto text-gray-400">{showAdvanced ? "▲" : "▼"}</span>
          </button>
          {showAdvanced && (
            <div className="mt-4 space-y-4 border-t border-gray-100 dark:border-[#1e1e30] pt-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Préfixe de la facture</label>
                <input type="text" value={facturePrefix} onChange={(e) => setFacturePrefix(e.target.value)}
                  placeholder={country === "BE" ? "FAC-BE" : "FAC"}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-[#1e1e30] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Le numéro sera généré automatiquement.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Délai de paiement</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="number" value={delaiPaiement} onChange={(e) => setDelaiPaiement(parseInt(e.target.value) || 30)}
                      min="0" className="w-full px-3 py-2 border border-gray-300 dark:border-[#1e1e30] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">jours</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes personnelles, conditions particulières..."
                  rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-[#1e1e30] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f0f1a] dark:text-gray-200" />
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm p-3 rounded-lg border border-red-200 dark:border-red-800/30">{error}</div>}

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
          {saving ? "Création..." : `${country === "BE" ? "🇧🇪" : "🇫🇷"} Créer la facture`}
        </button>
      </form>
    </div>
  );
}
