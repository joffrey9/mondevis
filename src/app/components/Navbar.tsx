"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, PenTool } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 navbar-glass py-3 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">
              Mon<span className="gradient-text">Devis</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="nav-link text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Fonctionnalités</a>
            <a href="#how-it-works" className="nav-link text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Comment ça marche</a>
            <a href="#pricing" className="nav-link text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Tarifs</a>
            <a href="#faq" className="nav-link text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/signin" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">Se connecter</Link>
            <Link href="/auth/signin" className="text-sm font-semibold px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">Essai gratuit</Link>
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Menu">
            {open ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden mobile-menu bg-white/95 backdrop-blur-xl border-b border-gray-200/50 px-6 py-6 space-y-4">
            <a href="#features" onClick={() => setOpen(false)} className="block text-base font-medium text-gray-700 hover:text-indigo-600 transition-colors">Fonctionnalités</a>
            <a href="#how-it-works" onClick={() => setOpen(false)} className="block text-base font-medium text-gray-700 hover:text-indigo-600 transition-colors">Comment ça marche</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="block text-base font-medium text-gray-700 hover:text-indigo-600 transition-colors">Tarifs</a>
            <a href="#faq" onClick={() => setOpen(false)} className="block text-base font-medium text-gray-700 hover:text-indigo-600 transition-colors">FAQ</a>
            <div className="flex gap-3 pt-2">
              <Link href="/auth/signin" className="flex-1 text-center py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Se connecter</Link>
              <Link href="/auth/signin" className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all">Essai gratuit</Link>
            </div>
          </div>
        )}
      </nav>
      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
}
