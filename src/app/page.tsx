import Link from "next/link";
import {
  ArrowRight, CheckCircle, FileText, Send, BarChart3,
  Smartphone, Shield, Zap, Sparkles, ChevronDown,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafbff] overflow-hidden">
      {/* ── Floating Background Shapes ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="floating-shape w-96 h-96 bg-gradient-to-br from-violet-400 to-indigo-600 -top-20 -left-20 animate-float" />
        <div className="floating-shape w-80 h-80 bg-gradient-to-br from-pink-400 to-rose-500 top-1/3 -right-32 animate-float-delayed" />
        <div className="floating-shape w-64 h-64 bg-gradient-to-br from-amber-400 to-orange-500 bottom-1/4 left-1/4 animate-float" style={{ animationDelay: "4s" }} />
        <div className="floating-shape w-48 h-48 bg-gradient-to-br from-cyan-400 to-blue-500 bottom-10 right-1/3 animate-float-delayed" style={{ animationDelay: "1s" }} />
      </div>

      {/* ── Hero Section ── */}
      <section className="relative px-6 pt-20 pb-20 md:pt-32 md:pb-28 text-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 animated-gradient opacity-[0.07]" />
        <div className="absolute inset-0 noise-bg" />

        <div className="relative max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/50 text-sm font-medium text-indigo-600 mb-8 animate-fade-in-up shadow-sm">
            <Sparkles className="w-4 h-4" />
            Nouveau — Devis intelligents avec IA
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <span className="text-gray-900">Crée des</span>
            <br />
            <span className="gradient-text">devis professionnels</span>
            <br />
            <span className="text-gray-900">en 2 minutes</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Plus de logiciels compliqués. <strong className="text-gray-700">MonDevis</strong> te permet de créer,
            envoyer et suivre tes devis depuis ton téléphone ou ton ordinateur.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link
              href="/auth/signin"
              className="group relative px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-2">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              Voir les offres
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Sans engagement</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Annulable à tout moment</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> 14 jours gratuits</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 flex justify-center animate-bounce-subtle">
          <ChevronDown className="w-6 h-6 text-gray-300" />
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="relative px-6 py-16 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50/50 to-transparent" />
        <div className="relative max-w-5xl mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Rejoint par plus de <span className="text-indigo-600">500</span> artisans</p>
          <div className="mt-6 flex flex-wrap justify-center gap-8 md:gap-16">
            {["Électricité Lyon", "Plomberie Paris", "Maçonnerie Sud", "Rénovation IDF", "Bois & Co"].map((name, i) => (
              <div
                key={name}
                className="text-base font-semibold text-gray-300 hover:text-indigo-400 transition-colors duration-300 card-3d"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {name}
              </div>
            ))}
          </div>
          <blockquote className="mt-10 max-w-2xl mx-auto">
            <div className="relative bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-sm">
              <div className="absolute -top-3 left-8 text-4xl text-indigo-200">"</div>
              <p className="text-base md:text-lg text-gray-600 italic leading-relaxed">
                J&apos;ai réduit mon temps de devis de 45 minutes à 3 minutes. Je ne reviendrai jamais en arrière.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                  JD
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Jean D.</p>
                  <p className="text-xs text-gray-400">Électricien à Lyon</p>
                </div>
              </div>
            </div>
          </blockquote>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/30 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-gray-900">
            Tout ce qu&apos;il <span className="gradient-text">faut</span>
          </h2>
          <p className="mt-4 text-center text-gray-500 max-w-xl mx-auto">
            Pas de bloat. Juste l&apos;essentiel pour gagner du temps et vendre plus.
          </p>

          <div className="mt-16 grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: FileText, title: "Devis en 2 min", desc: "Modèles pré-remplis, TVA automatique, catalogue produits.", gradient: "from-indigo-500 to-violet-500" },
              { icon: Send, title: "Envoi instantané", desc: "Email, WhatsApp ou lien direct. Signature électronique incluse.", gradient: "from-pink-500 to-rose-500" },
              { icon: BarChart3, title: "Suivi en temps réel", desc: "Statut : envoyé, lu, accepté, refusé. Relances automatiques.", gradient: "from-amber-500 to-orange-500" },
              { icon: Smartphone, title: "100% mobile", desc: "Crée et envoie un devis depuis ton téléphone en 2 minutes.", gradient: "from-emerald-500 to-teal-500" },
              { icon: Shield, title: "Conforme RGPD", desc: "Données hébergées en France. Chiffrement de bout en bout.", gradient: "from-cyan-500 to-blue-500" },
              { icon: Zap, title: "Gratuit pour commencer", desc: "14 jours d'essai gratuit. Sans carte bancaire.", gradient: "from-violet-500 to-purple-500" },
            ].map((f, i) => (
              <div
                key={f.title}
                className="group card-3d bg-white/70 backdrop-blur-sm rounded-2xl p-7 border border-gray-200/50 shadow-sm hover:shadow-xl transition-all duration-500"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="relative px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/30 to-transparent" />
        <div className="relative max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-gray-900">
            Simple. Pas de <span className="gradient-text">surprise</span>.
          </h2>
          <p className="mt-4 text-center text-gray-500">Tous les plans incluent 14 jours d&apos;essai gratuit.</p>

          <div className="mt-12 grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { name: "Débutant", price: "0 €", period: "/mois", features: ["3 devis/mois", "Modèles de base", "Envoi par email"], popular: false },
              { name: "Pro", price: "19 €", period: "/mois", features: ["Devis illimités", "Signature électronique", "Statistiques avancées", "Support prioritaire"], popular: true },
              { name: "Business", price: "49 €", period: "/mois", features: ["Tout le Pro", "API accès", "Multi-utilisateurs", "Marque blanche"], popular: false },
            ].map((plan, i) => (
              <div
                key={plan.name}
                className={`relative card-3d rounded-2xl p-8 ${
                  plan.popular
                    ? "bg-white border-2 border-indigo-500 shadow-xl shadow-indigo-100"
                    : "bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-sm"
                }`}
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold px-5 py-1.5 rounded-full shadow-lg">
                    ✨ Recommandé
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
                <Link
                  href="/auth/signin"
                  className={`mt-8 block text-center py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                  }`}
                >
                  {plan.popular ? "Essayer 14 jours" : "Commencer"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/30 to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900">
            Questions <span className="gradient-text">fréquentes</span>
          </h2>
          <div className="mt-12 space-y-4">
            {[
              { q: "Combien de temps pour créer un devis ?", a: "Avec MonDevis, tu crées un devis pro en moins de 2 minutes. Modèle pré-rempli, TVA auto, prêt à envoyer." },
              { q: "Puis-je annuler à tout moment ?", a: "Absolument. Pas d'engagement. Tu annules en 1 clic depuis ton tableau de bord." },
              { q: "Mes données sont-elles sécurisées ?", a: "Oui. Hébergement sécurisé, chiffrement SSL, sauvegarde quotidienne. Conforme RGPD." },
              { q: "Puis-je utiliser MonDevis sur mobile ?", a: "Oui, 100% responsive. Crée et envoie un devis depuis ton téléphone aussi facilement que depuis ton ordinateur." },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-5 transition-all duration-300 hover:shadow-md hover:border-indigo-200/50 open:shadow-md open:border-indigo-200/50"
              >
                <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between gap-4">
                  <span>{faq.q}</span>
                  <span className="shrink-0 text-gray-400 group-open:rotate-180 transition-transform duration-300 bg-gray-100 rounded-full p-1">
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </summary>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="relative px-6 py-24 text-center overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-[0.06]" />
        <div className="relative max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
            Prêt à <span className="gradient-text">gagner du temps</span> ?
          </h2>
          <p className="mt-4 text-lg text-gray-500">14 jours d&apos;essai gratuit. Sans carte bancaire.</p>
          <Link
            href="/auth/signin"
            className="group mt-10 inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 text-lg"
          >
            Commencer maintenant
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative px-6 py-10 text-center border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} <span className="font-semibold gradient-text">MonDevis</span>. Tous droits réservés.
          </p>
          <div className="flex justify-center gap-6 mt-3">
            <Link href="/mentions-legales" className="text-xs text-gray-400 hover:text-indigo-500 transition-colors">
              Mentions légales
            </Link>
            <a href="mailto:hello@mondevis.fr" className="text-xs text-gray-400 hover:text-indigo-500 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
