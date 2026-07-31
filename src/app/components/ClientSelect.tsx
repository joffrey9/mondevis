"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Search, ChevronDown, Check, X, UserCircle, Briefcase } from "lucide-react";
import { getClients } from "@/app/actions/clients";
import Link from "next/link";

export type ClientOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  siret: string | null;
  type: string;
};

type ClientSelectProps = {
  selectedId: string;
  onSelect: (client: ClientOption | null) => void;
  placeholder?: string;
};

export function ClientSelect({ selectedId, onSelect, placeholder = "Sélectionner un client enregistré..." }: ClientSelectProps) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Charger les clients du carnet au montage
  useEffect(() => {
    let cancelled = false;
    getClients()
      .then((list) => {
        if (cancelled) return;
        setClients(list.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          siret: c.siret,
          type: c.type,
        })));
      })
      .catch(() => { if (!cancelled) setClients([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Fermer au clic extérieur ou à Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const selected = clients.find((c) => c.id === selectedId) || null;

  const q = search.trim().toLowerCase();
  const filtered = clients.filter((c) =>
    !q
    || c.name.toLowerCase().includes(q)
    || (c.email || "").toLowerCase().includes(q)
    || (c.siret || "").toLowerCase().includes(q)
  );

  // Index actif sécurisé : toujours dans les bornes, 0 si la liste est non vide
  const safeActive = filtered.length > 0
    ? Math.max(0, Math.min(activeIndex, filtered.length - 1))
    : -1;

  // Faire défiler l'option active dans la liste visible
  useEffect(() => {
    if (safeActive < 0 || !listRef.current) return;
    const el = listRef.current.children[safeActive] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [safeActive]);

  function toggle() {
    if (!open) setActiveIndex(filtered.length > 0 ? 0 : -1);
    setOpen(!open);
  }

  function pick(client: ClientOption) {
    onSelect(client);
    setOpen(false);
    setSearch("");
  }

  function detach() {
    onSelect(null);
    setOpen(false);
  }

  function handleDetachKey(e: React.KeyboardEvent) {
    e.stopPropagation();
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      detach();
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (filtered.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(filtered.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (safeActive >= 0 && filtered[safeActive]) pick(filtered[safeActive]);
        break;
    }
  }

  const activeId = safeActive >= 0 && filtered[safeActive]
    ? `client-option-${filtered[safeActive].id}`
    : undefined;

  return (
    <div ref={containerRef} className="relative">
      {/* Bouton principal */}
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-3 py-2.5 border border-gray-300 dark:border-[#1e1e30] rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0f0f1a] dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-700 transition"
      >
        {selected ? (
          <>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              selected.type === "professionnel"
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            }`}>
              {selected.type === "professionnel" ? <Briefcase className="w-4 h-4" /> : <UserCircle className="w-4 h-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{selected.name}</span>
              <span className="block truncate text-[10px] text-gray-400 dark:text-gray-500">
                {selected.type === "professionnel" ? "🏢 Professionnel" : "👤 Particulier"}
                {selected.email ? ` · ${selected.email}` : ""}
              </span>
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); detach(); }}
              onKeyDown={handleDetachKey}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition flex-shrink-0 cursor-pointer"
              title="Détacher le client"
              aria-label="Détacher le client"
            >
              <X className="w-4 h-4" />
            </span>
          </>
        ) : (
          <>
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate text-gray-400 dark:text-gray-500 flex-1">
              {loading ? "Chargement des clients..." : placeholder}
            </span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Menu déroulant */}
      {open && (
        <div
          role="listbox"
          aria-label="Clients du carnet"
          className="absolute z-30 mt-2 w-full bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#1e1e30] rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="p-2 border-b border-gray-100 dark:border-[#1e1e30]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setActiveIndex(0); }}
                onKeyDown={handleSearchKeyDown}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls="client-listbox"
                aria-activedescendant={activeId}
                placeholder="Rechercher par nom, email..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#0f0f1a] border border-gray-200 dark:border-[#1e1e30] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
              />
            </div>
          </div>
          <div ref={listRef} id="client-listbox" className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
                  {clients.length === 0 ? "Aucun client enregistré pour l'instant" : "Aucun résultat pour cette recherche"}
                </p>
                <Link href="/dashboard/clients" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  + Créer un client dans le carnet
                </Link>
              </div>
            ) : (
              filtered.map((c, i) => (
                <button
                  key={c.id}
                  id={`client-option-${c.id}`}
                  type="button"
                  role="option"
                  aria-selected={c.id === selectedId}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(c)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition text-left ${
                    i === safeActive
                      ? "bg-indigo-50 dark:bg-indigo-900/30"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    c.type === "professionnel"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  }`}>
                    {c.type === "professionnel" ? <Briefcase className="w-4 h-4" /> : <UserCircle className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium dark:text-gray-100">{c.name}</span>
                    <span className="block truncate text-[10px] text-gray-400 dark:text-gray-500">
                      {c.type === "professionnel" ? "🏢 Pro" : "👤 Part"}
                      {c.email ? ` · ${c.email}` : ""}
                      {c.siret ? ` · ${c.siret}` : ""}
                    </span>
                  </span>
                  {c.id === selectedId && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
