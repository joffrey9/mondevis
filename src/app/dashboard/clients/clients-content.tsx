"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Plus, Search, Mail, Phone, MapPin, Building2,
  FileText, Receipt, Trash2, Edit2, UserCircle, Briefcase, ChevronRight, X
} from "lucide-react";
import { createClient, updateClient, deleteClient } from "@/app/actions/clients";
import { detectClientType } from "@/lib/countries";

type Client = {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  siret: string | null;
  type: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { devis: number };
};

type FormData = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  siret: string;
  notes: string;
};

export function ClientsContent({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<FormData>({
    name: "", email: "", phone: "", address: "", siret: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const particuliers = clients.filter((c) => c.type === "particulier");
  const professionnels = clients.filter((c) => c.type === "professionnel");

  const searchLower = search.toLowerCase();
  const filterClient = (c: Client) =>
    !searchLower ||
    c.name.toLowerCase().includes(searchLower) ||
    (c.email || "").toLowerCase().includes(searchLower) ||
    (c.phone || "").toLowerCase().includes(searchLower) ||
    (c.siret || "").toLowerCase().includes(searchLower);

  const filteredParticuliers = particuliers.filter(filterClient);
  const filteredProfessionnels = professionnels.filter(filterClient);

  const siretType = (siret: string) => {
    const clean = siret.replace(/[\s.\-]/g, "");
    if (clean.length === 14) return "SIRET";
    if (/^FR/i.test(clean)) return "TVA FR";
    if (/^BE/i.test(clean)) return "TVA BE";
    return "";
  };

  const detectTypeFromSiret = (siret: string) => {
    const type = detectClientType(siret, "FR");
    return siret.trim() ? type : null;
  };

  const openNew = useCallback(() => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", address: "", siret: "", notes: "" });
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((client: Client) => {
    setEditing(client);
    setForm({
      id: client.id,
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      siret: client.siret || "",
      notes: client.notes || "",
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateClient({
          id: editing.id,
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          siret: form.siret || undefined,
          notes: form.notes || undefined,
        });
      } else {
        await createClient({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          siret: form.siret || undefined,
          notes: form.notes || undefined,
        });
      }
      closeModal();
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    try {
      await deleteClient(id);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" />
            Clients
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {clients.length} client{clients.length !== 1 ? "s" : ""} enregistré{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau client</span>
        </button>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un client par nom, email, téléphone..."
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#14141f] border border-gray-200 dark:border-[#1e1e30] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:text-gray-100 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {clients.length === 0 ? (
        /* Empty state */
        <div className="bg-white dark:bg-[#14141f] rounded-2xl border border-gray-200 dark:border-[#1e1e30] p-16 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center">
            <Users className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold dark:text-gray-200 mb-2">Carnet d&apos;adresses vide</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
            Ajoute tes premiers clients pour les retrouver rapidement lors de la création de devis et factures.
          </p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" /> Ajouter un client
          </button>
        </div>
      ) : (
        <>
          {/* Professionnels */}
          {filteredProfessionnels.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold dark:text-gray-100">Professionnels</h2>
                <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">{filteredProfessionnels.length}</span>
              </div>
              <div className="grid gap-3">
                {filteredProfessionnels.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onEdit={() => openEdit(client)}
                    onDelete={() => handleDelete(client.id, client.name)}
                    siretType={siretType(client.siret || "")}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Particuliers */}
          {filteredParticuliers.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UserCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold dark:text-gray-100">Particuliers</h2>
                <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">{filteredParticuliers.length}</span>
              </div>
              <div className="grid gap-3">
                {filteredParticuliers.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onEdit={() => openEdit(client)}
                    onDelete={() => handleDelete(client.id, client.name)}
                    siretType={siretType(client.siret || "")}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Aucun résultat */}
          {filteredParticuliers.length === 0 && filteredProfessionnels.length === 0 && search && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>Aucun client ne correspond à &quot;{search}&quot;</p>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 ${modalOpen ? "flex" : "hidden"} items-center justify-center bg-black/50 backdrop-blur-sm p-4`}
        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="bg-white dark:bg-[#14141f] rounded-2xl border border-gray-200 dark:border-[#1e1e30] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-100 dark:border-[#1e1e30] flex items-center justify-between">
            <h2 className="text-lg font-bold dark:text-gray-100">
              {editing ? "Modifier le client" : "Nouveau client"}
            </h2>
            <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nom du client <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jean Dupont"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#1e1e30] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:text-gray-100 transition"
              />
            </div>

            {/* Email + Téléphone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jean@exemple.fr"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#1e1e30] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:text-gray-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#1e1e30] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:text-gray-100 transition"
                />
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Adresse</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Rue de Paris, 75001 Paris"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#1e1e30] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:text-gray-100 transition"
              />
            </div>

            {/* N° TVA / SIRET */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">N° TVA / SIRET</label>
              <input
                type="text"
                value={form.siret}
                onChange={(e) => setForm({ ...form, siret: e.target.value })}
                placeholder="FR12345678901 ou BE0123456789"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#1e1e30] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:text-gray-100 transition"
              />
              {form.siret && (
                <p className="text-xs mt-1.5">
                  {detectTypeFromSiret(form.siret) === "professionnel" ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      🏢 Professionnel détecté
                    </span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      👤 Particulier
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes internes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Référé par..., Préférences..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#1e1e30] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:text-gray-100 transition resize-none"
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-[#1e1e30] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Carte client
   ═══════════════════════════════════════════ */

function ClientCard({
  client, onEdit, onDelete, siretType,
}: {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
  siretType: string;
}) {
  const isPro = client.type === "professionnel";

  return (
    <div className="client-card group bg-white dark:bg-[#14141f] rounded-xl border border-gray-200 dark:border-[#1e1e30] p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-800/50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isPro
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          }`}>
            {isPro ? <Briefcase className="w-5 h-5" /> : <UserCircle className="w-5 h-5" />}
          </div>

          {/* Infos */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold dark:text-gray-100 truncate">{client.name}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                isPro
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200"
              }`}>
                {isPro ? "🏢 Pro" : "👤 Part"}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition" title={client.email}>
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[180px]">{client.email}</span>
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition" title={client.phone}>
                  <Phone className="w-3.5 h-3.5" />
                  <span>{client.phone}</span>
                </a>
              )}
            </div>

            {client.address && (
              <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{client.address}</span>
              </p>
            )}

            {client.siret && (
              <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span>{client.siret}</span>
                {siretType && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                    {siretType}
                  </span>
                )}
              </p>
            )}

            {client._count && client._count.devis > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                <FileText className="w-3 h-3" />
                <span>{client._count.devis} devis</span>
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
          <button onClick={onEdit} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition" title="Modifier">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition" title="Supprimer">
            <Trash2 className="w-4 h-4" />
          </button>
          <a
            href={`/dashboard/devis/nouveau?clientId=${client.id}`}
            className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            title="Créer un devis pour ce client"
          >
            <FileText className="w-4 h-4" />
          </a>
          <a
            href={`/dashboard/factures/nouveau?clientId=${client.id}`}
            className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            title="Créer une facture pour ce client"
          >
            <Receipt className="w-4 h-4" />
          </a>
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        </div>
      </div>
    </div>
  );
}
