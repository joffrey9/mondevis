import Link from "next/link";
import {
  ArrowRight, CheckCircle, FileText, Send, BarChart3,
  Smartphone, Shield, Zap, Sparkles, ChevronDown,
  Star, Users, Clock, TrendingUp,
  PenTool, MousePointerClick, Mail, Globe,
} from "lucide-react";
import Navbar from "./components/Navbar";
import ScrollReveal from "./components/ScrollReveal";

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* ── HAUTE BARRE D'URGENCE ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-indigo-900/95 backdrop-blur-sm border-b border-indigo-700/50 text-white">
        <div className="max-w-7xl mx-auto px-6 py-1.5 text-center text-sm">
          ⚠️ Obligation Peppol 2026 : Mettez votre entreprise en conformité dès aujourd’hui en toute simplicité.
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-20 pb-32 md:pt-32 md:pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
                La facturation Peppol sans la prise de tête.
              </h1>
              <p className="mt-6 text-xl md:text-2xl text-indigo-100 max-w-lg">
                Générez vos devis et envoyez vos factures conformes en 3 clics.
              </p>
              <p className="mt-4 text-lg md:text-base text-indigo-200/90">
                Conçu pour les indépendants, artisans et TPE qui refusent les logiciels comptables complexes à 40€/mois. Simple, rapide et 100% conforme à la législation européenne.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/auth/signin"
                  className="inline-block w-full sm:w-auto text-center px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-md shadow-indigo-200">
                  👉 Essayer gratuitement (14 jours sans engagement)
                </Link>
                <span className="block mt-2 text-indigo-200/80 text-xs">Aucune carte bancaire requise • Prêt en 2 minutes</span>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl shadow-indigo-950/50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs font-medium text-slate-500">Facture FAC-2026-014</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">Client : Menuiserie Dupont</span>
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Prête</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Pose de 3 châssis</span><span>1 250,00 €</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Main d&apos;oeuvre</span><span>320,00 €</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                      <span>Total HT</span><span>1 570,00 €</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold">
                    <Send className="w-4 h-4" />
                    Envoyer via Peppol
                  </div>
                  <p className="text-center text-xs text-slate-400">Reçu par le client en 2 secondes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BADGES DE RÉASSURANCE ── */}
      <section className="relative py-12 bg-indigo-50"
        >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 justify-center">
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Conforme Réseau Peppol (Format UBL)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Prêt pour l'obligation belge 2026</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Prise en main en 3 minutes chrono</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <Mail className="w-4 h-4 text-green-500" />
            <span>Export facile pour votre comptable</span>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE EN 3 ÉTAPES ── */}
      <section id="how-it-works" className="relative py-24 bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 via-indigo-100 to-indigo-50" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-indigo-600">
              Être en règle n'a jamais été aussi simple
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Trois étapes et votre facture est conforme et envoyée.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group border border-indigo-200/70 bg-white rounded-2xl p-6 hover:border-indigo-400 transition-colors">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                <PenTool className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-indigo-600">Étape 1 : Créez votre devis ou facture</h3>
              <p className="mt-2 text-slate-600">
                Remplissez les informations de votre client en quelques secondes grâce à notre interface épurée.
              </p>
            </div>

            <div className="group border border-indigo-200/70 bg-white rounded-2xl p-6 hover:border-indigo-400 transition-colors">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                <Send className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-indigo-600">Étape 2 : Un clic pour transformer et valider</h3>
              <p className="mt-2 text-slate-600">
                Le devis est accepté ? Transformez-le instantanément en facture officielle aux normes légales.
              </p>
            </div>

            <div className="group border border-indigo-200/70 bg-white rounded-2xl p-6 hover:border-indigo-400 transition-colors">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-indigo-600">Étape 3 : Envoi direct sur Peppol</h3>
              <p className="mt-2 text-slate-600">
                Envoyez la facture directement sur le réseau Peppol de votre client et recevez une confirmation de réception instantanée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── POURQUOI CHOISIR MONDE DEVIS ? ── */}
      <section className="relative py-24 bg-indigo-50"
        >
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-indigo-600">
              Oubliez les logiciels usines à gaz
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-indigo-600 mb-4">Face à Word & Excel</h3>
              <p className="text-slate-600">
                Vos tableurs ne seront plus légaux pour les factures B2B. Avec Monde Devis, vous gardez la même simplicité, la conformité Peppol en plus.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-indigo-600 mb-4">Face aux gros logiciels à 40€/mois</h3>
              <p className="text-slate-600">
                Vous n'avez pas besoin de 200 fonctionnalités inutiles. Vous payez uniquement pour ce dont vous avez besoin : devis, factures, envoi Peppol.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-indigo-600 mb-4">Comptable-friendly</h3>
              <p className="text-slate-600">
                Téléchargez vos fichiers ou transmettez-les à votre fiduciaire en un clic à la fin du trimestre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── GRILLE TARIFAIRE ── */}
      <section id="pricing" className="relative py-24 bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 via-indigo-100 to-indigo-50" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-indigo-600">
              Un prix juste, pensé pour les indépendants
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Des plans clairs, sans surprise, adaptés à votre activité.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div
              className="border-indigo-200 rounded-2xl p-6 bg-indigo-50"
            >
              <h3 className="text-xl font-medium text-indigo-600 mb-4">Offre Découverte : 0 €</h3>
              <p className="text-slate-600">Idéal pour tester</p>
              <ul className="mt-3 space-y-2 text-sm text-indigo-500">
                <li><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> 3 factures Peppol offertes</li>
                <li><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Devis illimités</li>
              </ul>
              <button
                className="w-full mt-6 px-4 py-2 rounded-xl font-medium text-indigo-600 border border-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
              >
                Créer mon compte
              </button>
            </div>

            <div
              className="border-t border-indigo-500 border-4 rounded-2xl p-8 bg-gradient-to-b from-indigo-600 to-violet-600 shadow-xl"
            >
              <h3 className="text-3xl font-bold text-white mb-2">Offre Pro (Recommandé) : 9,99 € / mois</h3>
              <p className="text-white/80 mb-6">
                Envois Peppol illimités
              </p>
              <ul className="mt-4 space-y-3 text-white/80">
                <li><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Devis et Factures illimités</li>
                <li><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Support réactif par email</li>
                <li><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Sans engagement, résiliable à tout moment</li>
              </ul>
              <button
                className="w-full mt-6 px-6 py-3 rounded-xl font-semibold bg-white text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                Démarrer l'essai gratuit
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            Tarifs HT. TVA applicable selon pays.
            <a href="/pricing" className="font-medium text-indigo-600 hover:underline">Voir la grille détaillée →</a>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative py-16 border-t border-indigo-200/50 bg-indigo-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="w-10 h-10 rounded-md bg-indigo-600/20 flex items-center justify-center mb-4">
                <PenTool className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Monde Devis</h3>
              <p className="mt-4 text-indigo-300/70">
                Logiciel de facturation Peppol pour indépendants et TPE
              </p>
              <p className="mt-6 text-indigo-300/70">
                ✍️ Société : Mon Devis
              </p>
              <p className="mt-2 text-indigo-300/70">
                📁 TVA : BE0891.930.638
              </p>
              <a
                href="mailto:hello@mondevis.eu"
                className="mt-4 inline-block text-indigo-300/70 hover:text-white transition-colors"
              >hello@mondevis.eu</a>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Liens utiles</h4>
              <div className="space-y-3 text-indigo-300/70">
                <a href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</a>
                <a href="/cgv" className="hover:text-white transition-colors">Conditions générales</a>
                <a href="/confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Réseaux sociaux</h4>
              <div className="flex gap-4">
                {/* Social links would go here */}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-indigo-700/50 text-indigo-300/70 text-center">
            <p>© {new Date().getFullYear()} Monde Devis. Tous droits réservés.</p>
            <p className="mt-2 text-indigo-300/50">Conforme Peppol 2026 • Conformité européenne</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
