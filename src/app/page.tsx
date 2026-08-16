import Link from "next/link";
import {
  ArrowRight, CheckCircle, FileText, Send, BarChart3,
  Smartphone, Shield, Zap, Sparkles, ChevronDown,
  Star, Users, Clock, TrendingUp,
  PenTool, MousePointerClick, Mail, Globe,
} from "lucide-react";
import Navbar from "./components/Navbar";
import ScrollReveal from "./components/ScrollReveal";
import CountUp from "./components/CountUp";

/* ── Features Data ── */
const features = [
  { icon: FileText, title: "Devis en 2 minutes", desc: "Modèles pré-remplis, TVA automatique, catalogue produits. Plus rapide que Word ou Excel.", gradient: "from-indigo-500 to-violet-500", benefit: "÷ 20 sur le temps de création" },
  { icon: Send, title: "Envoi instantané", desc: "Email, WhatsApp ou lien direct. Le client reçoit le devis en 1 seconde. Signature électronique incluse.", gradient: "from-pink-500 to-rose-500", benefit: "Taux de signature × 3" },
  { icon: BarChart3, title: "Suivi en temps réel", desc: "Statut : envoyé, lu, accepté, refusé. Relances automatiques pour ne plus jamais perdre une vente.", gradient: "from-amber-500 to-orange-500", benefit: "Taux de conversion +40%" },
  { icon: Smartphone, title: "100% mobile", desc: "Crée et envoie un devis depuis ton téléphone, sur le chantier, en 2 minutes. Sans rien installer.", gradient: "from-emerald-500 to-teal-500", benefit: "Fonctionne partout" },
  { icon: Shield, title: "Conforme et sécurisé", desc: "Données hébergées en France, chiffrement SSL, RGPD. Factures électroniques compatibles Peppol.", gradient: "from-cyan-500 to-blue-500", benefit: "Normes européennes" },
  { icon: Zap, title: "IA intelligente", desc: "L'IA pré-remplit les descriptions, suggère les prix et détecte automatiquement la TVA applicable.", gradient: "from-violet-500 to-purple-500", benefit: "Zéro saisie inutile" },
];

const testimonials = [
  { quote: "J'ai réduit mon temps de devis de 45 minutes à 3 minutes. Je ne reviendrai jamais en arrière.", name: "Jean D.", role: "Électricien à Lyon", initials: "JD", gradient: "from-indigo-400 to-violet-500" },
  { quote: "L'envoi par WhatsApp a changé ma vie. Mes clients répondent en 5 minutes au lieu de 3 jours.", name: "Sophie M.", role: "Plombière à Paris", initials: "SM", gradient: "from-pink-400 to-rose-500" },
  { quote: "Mes factures sont maintenant aux normes Peppol sans effort. Un vrai gain de temps pour ma compta.", name: "Karim B.", role: "Maçon à Marseille", initials: "KB", gradient: "from-amber-400 to-orange-500" },
  { quote: "Simple, rapide, efficace. Exactement ce dont un artisan a besoin. Pas de fonctionnalités inutiles.", name: "Lucie T.", role: "Peintre à Bordeaux", initials: "LT", gradient: "from-emerald-400 to-teal-500" },
];

const faqs = [
  { q: "Combien de temps pour créer un devis ?", a: "Avec MonDevis, tu crées un devis professionnel en moins de 2 minutes. Modèle pré-rempli, TVA calculée automatiquement, prêt à envoyer." },
  { q: "Puis-je annuler à tout moment ?", a: "Absolument. Pas d'engagement. Tu annules en 1 clic depuis ton tableau de bord. Aucune question posée." },
  { q: "Mes données sont-elles sécurisées ?", a: "Oui. Hébergement en France (Neon PostgreSQL), chiffrement SSL/TLS, sauvegarde quotidienne. Conforme RGPD." },
  { q: "Puis-je utiliser MonDevis sur mon téléphone ?", a: "Oui, 100% responsive. Crée et envoie un devis depuis ton téléphone aussi facilement que depuis ton ordinateur. Aucune app à installer." },
  { q: "Est-ce que ça gère la TVA belge ?", a: "Oui ! MonDevis gère automatiquement la TVA française (20%, 10%, 5.5%) et la TVA belge (21%, 12%, 6%). Idéal pour les artisans frontaliers." },
  { q: "Puis-je envoyer des factures via Peppol ?", a: "Oui, MonDevis est connecté au réseau Peppol. En un clic, ta facture est envoyée directement dans le système de ton client pro." },
];

const plans = [
  { name: "Débutant", price: "0", period: "€/mois", features: ["3 devis/mois", "Modèles de base", "Envoi par email", "Support standard"], cta: "Commencer", popular: false },
  { name: "Pro", price: "19", period: "€/mois", features: ["Devis illimités", "Signature électronique", "Statistiques avancées", "Support prioritaire", "WhatsApp intégré"], cta: "Essayer 14 jours", popular: true },
  { name: "Business", price: "49", period: "€/mois", features: ["Tout le Pro", "Factures Peppol", "Multi-utilisateurs", "Marque blanche", "API accès", "Support dédié"], cta: "Démarrer", popular: false },
];

const stats = [
  { icon: Users, value: 500, suffix: "+", label: "Artisans conquis" },
  { icon: FileText, value: 12000, suffix: "+", label: "Devis générés" },
  { icon: Clock, value: 2, suffix: " min", label: "Pour créer un devis" },
  { icon: TrendingUp, value: 97, suffix: "%", label: "Satisfaction clients" },
];

const steps = [
  { step: "1", icon: PenTool, title: "Crée ton devis", desc: "Choisis un modèle, remplis les lignes. La TVA et les totaux sont calculés automatiquement.", color: "from-indigo-500 to-violet-500" },
  { step: "2", icon: Send, title: "Envoie-le", desc: "Par email, WhatsApp ou lien direct. Le client le reçoit instantanément et peut signer électroniquement.", color: "from-pink-500 to-rose-500" },
  { step: "3", icon: BarChart3, title: "Suis les résultats", desc: "Tu vois en temps réel qui a ouvert, lu, accepté. Relances automatiques jusqu'à signature.", color: "from-amber-500 to-orange-500" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafbff] overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Floating shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="floating-shape w-96 h-96 bg-gradient-to-br from-violet-400 to-indigo-600 -top-20 -left-20 animate-float" />
        <div className="floating-shape w-80 h-80 bg-gradient-to-br from-pink-400 to-rose-500 top-1/3 -right-32 animate-float-delayed" />
        <div className="floating-shape w-64 h-64 bg-gradient-to-br from-amber-400 to-orange-500 bottom-1/4 left-1/4 animate-float" style={{ animationDelay: "4s" }} />
        <div className="floating-shape w-48 h-48 bg-gradient-to-br from-cyan-400 to-blue-500 bottom-10 right-1/3 animate-float-delayed" style={{ animationDelay: "1s" }} />
      </div>

      {/* ── HERO ── */}
      <section className="relative px-6 pt-12 pb-20 md:pt-20 md:pb-28 text-center overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-[0.06]" />
        <div className="absolute inset-0 noise-bg" />

        <div className="relative max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/50 text-sm font-medium text-indigo-600 mb-8 animate-fade-in-up shadow-sm">
            <Sparkles className="w-4 h-4" />
            Nouveau — Devis intelligents avec IA
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <span className="text-gray-900">Le devis que tes clients</span>
            <br />
            <span className="gradient-text">attendaient</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Crée, envoie et fais signer tes devis en <strong className="text-gray-700">2 minutes</strong>.
            Depuis ton téléphone ou ton ordinateur. Sans logiciel compliqué.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link href="/auth/signin" className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 text-base">
              <span className="relative z-10 flex items-center gap-2">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <a href="#how-it-works" className="px-8 py-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              Voir la démo
            </a>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Sans engagement</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> 14 jours gratuits</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Sans carte bancaire</span>
          </div>
        </div>

        <div className="mt-16 flex justify-center animate-bounce-subtle">
          <ChevronDown className="w-6 h-6 text-gray-300" />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative px-6 py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50/40 to-transparent" />
        <div className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <ScrollReveal key={stat.label}>
                <stat.icon className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                <p className="text-3xl md:text-4xl font-extrabold text-gray-900">
                  <CountUp end={stat.value} suffix={stat.suffix} duration={2500} />
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/20 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 mb-4">
                <MousePointerClick className="w-3.5 h-3.5" />
                Simple comme bonjour
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                Comment ça <span className="gradient-text">marche</span> ?
              </h2>
              <p className="mt-4 text-gray-500 max-w-xl mx-auto">
                Pas de formation, pas de manuel. Trois étapes et c&apos;est envoyé.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-16 grid md:grid-cols-3 gap-8 step-connector">
            {steps.map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 150}>
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xl relative`}>
                    <item.icon className="w-10 h-10 text-white" />
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-sm font-extrabold text-gray-700 shadow-sm">{item.step}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/30 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-xs font-semibold text-violet-700 mb-4">
                <Zap className="w-3.5 h-3.5" />
                Fonctionnalités
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                Tout ce qu&apos;il <span className="gradient-text">faut</span>
              </h2>
              <p className="mt-4 text-gray-500 max-w-xl mx-auto">
                Pas de bloat. Juste l&apos;essentiel pour gagner du temps et vendre plus.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-16 grid md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 100}>
                <div className="group card-3d bg-white/70 backdrop-blur-sm rounded-2xl p-7 border border-gray-200/50 shadow-sm hover:shadow-xl transition-all duration-500 h-full">
                  <div className={`feature-icon-wrapper w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  <p className="mt-3 inline-block text-xs font-semibold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">{f.benefit}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-50/30 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-xs font-semibold text-pink-700 mb-4">
                <Star className="w-3.5 h-3.5 fill-pink-500" />
                Témoignages
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                Ils ont <span className="gradient-text">adopté</span> MonDevis
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 100}>
                <div className="testimonial-card bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-sm text-gray-600 italic leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</blockquote>
                  <div className="mt-5 flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-sm font-bold shrink-0`}>{t.initials}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/30 to-transparent" />
        <div className="relative max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-xs font-semibold text-amber-700 mb-4">
                <Globe className="w-3.5 h-3.5" />
                Tarifs
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                Simple. Pas de <span className="gradient-text">surprise</span>.
              </h2>
              <p className="mt-4 text-gray-500">Tous les plans incluent 14 jours d&apos;essai gratuit. Annulable à tout moment.</p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 150}>
                <div className={`card-3d rounded-2xl p-8 ${plan.popular ? "pricing-popular bg-white border-2 border-transparent shadow-xl shadow-indigo-100" : "bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-sm"}`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold px-5 py-1.5 rounded-full shadow-lg">
                      ✨ Le plus populaire
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="mt-4">
                    <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-400 ml-1">{plan.period}</span>
                  </p>
                  <ul className="mt-6 space-y-3.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing" className={`mt-8 block text-center py-3.5 rounded-xl font-semibold transition-all duration-300 ${plan.popular ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-lg hover:-translate-y-0.5" : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"}`}>{plan.cta}</Link>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            Tarifs HT. TVA applicable selon pays.{" "}
            <Link href="/pricing" className="text-indigo-500 hover:underline font-medium">Voir la grille détaillée →</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/30 to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-xs font-semibold text-cyan-700 mb-4">
                <Mail className="w-3.5 h-3.5" />
                FAQ
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Questions <span className="gradient-text">fréquentes</span>
              </h2>
            </div>
          </ScrollReveal>
          <div className="mt-12 space-y-3">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <details className="group bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-5 transition-all duration-300 hover:shadow-md hover:border-indigo-200/50 open:shadow-md open:border-indigo-200/50">
                  <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between gap-4">
                    <span>{faq.q}</span>
                    <span className="shrink-0 text-gray-400 group-open:rotate-180 transition-transform duration-300 bg-gray-100 rounded-full p-1">
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative px-6 py-24 text-center overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-[0.06]" />
        <div className="relative max-w-3xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
              Prêt à <span className="gradient-text">gagner du temps</span> ?
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mt-4 text-lg text-gray-500">
              14 jours d&apos;essai gratuit. Sans carte bancaire. Annulable à tout moment.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <Link href="/auth/signin" className="group mt-10 inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 text-lg">
              Commencer maintenant
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative px-6 py-12 text-center border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <PenTool className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Mon<span className="gradient-text">Devis</span></span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} MonDevis. Tous droits réservés.</p>
          <div className="flex flex-wrap justify-center gap-6 mt-3">
            <Link href="/mentions-legales" className="text-xs text-gray-400 hover:text-indigo-500 transition-colors">Mentions légales</Link>
            <Link href="/cgv" className="text-xs text-gray-400 hover:text-indigo-500 transition-colors">CGV</Link>
            <Link href="/confidentialite" className="text-xs text-gray-400 hover:text-indigo-500 transition-colors">Confidentialité</Link>
            <Link href="/retractation" className="text-xs text-gray-400 hover:text-indigo-500 transition-colors">Rétractation</Link>
            <Link href="/pricing" className="text-xs text-gray-400 hover:text-indigo-500 transition-colors">Tarifs</Link>
            <a href="mailto:hello@mondedevis.eu" className="text-xs text-gray-400 hover:text-indigo-500 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
