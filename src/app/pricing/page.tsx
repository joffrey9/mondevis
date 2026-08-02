import Link from "next/link";
import { CheckCircle, ArrowLeft, PenTool } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import PricingCard from "./PricingCard";

const allPlans = [
  { name: "Débutant", price: "0", period: "€/mois", desc: "Pour démarrer gratuitement", features: ["3 devis/mois", "Modèles de base", "Envoi par email", "Support standard", "1 utilisateur"], cta: "Commencer gratuitement", popular: false },
  { name: "Pro", price: "19", period: "€/mois", desc: "Pour les artisans actifs", features: ["Devis illimités", "Signature électronique", "Statistiques avancées", "Support prioritaire", "WhatsApp intégré", "Relances automatiques", "Personnalisation PDF"], cta: "Essayer 14 jours", popular: true },
  { name: "Business", price: "49", period: "€/mois", desc: "Pour les PME et équipes", features: ["Tout le plan Pro", "Factures électroniques Peppol", "Multi-utilisateurs (5)", "Marque blanche", "API accès", "Support dédié", "Formation incluse"], cta: "Démarrer", popular: false },
];

const comparisonRows = [
  ["Devis illimités", "—", "✅", "✅"],
  ["Signature électronique", "—", "✅", "✅"],
  ["Envoi WhatsApp", "—", "✅", "✅"],
  ["Statistiques", "—", "✅", "✅"],
  ["Relances automatiques", "—", "✅", "✅"],
  ["Personnalisation PDF", "—", "✅", "✅"],
  ["Factures Peppol", "—", "—", "✅"],
  ["Multi-utilisateurs", "—", "—", "✅"],
  ["Marque blanche", "—", "—", "✅"],
  ["API", "—", "—", "✅"],
  ["Support prioritaire", "—", "✅", "✅"],
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#fafbff]">
      {/* Floating shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="floating-shape w-96 h-96 bg-gradient-to-br from-violet-400 to-indigo-600 -top-20 -left-20 animate-float" />
        <div className="floating-shape w-80 h-80 bg-gradient-to-br from-pink-400 to-rose-500 bottom-1/3 -right-32 animate-float-delayed" />
      </div>

      {/* Back link */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>
      </div>

      {/* Header */}
      <section className="px-6 pt-12 pb-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Mon<span className="gradient-text">Devis</span>
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900">
            Des tarifs <span className="gradient-text">simples</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Tous les plans incluent 14 jours d&apos;essai gratuit. Sans carte bancaire. Annulable à tout moment.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 py-8 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {allPlans.map((plan, i) => (
              <PricingCard key={plan.name} plan={plan} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-6 py-16 bg-white/40">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
              Comparaison <span className="gradient-text">détaillée</span>
            </h2>
          </ScrollReveal>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 pr-4 font-semibold text-gray-700">Fonctionnalité</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Débutant</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700 bg-indigo-50 rounded-t-lg">Pro</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Business</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {comparisonRows.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-gray-50/50" : ""}`}>
                    <td className="py-3 pr-4">{row[0]}</td>
                    <td className="text-center py-3 px-4">{row[1]}</td>
                    <td className="text-center py-3 px-4 bg-indigo-50/50 font-medium">{row[2]}</td>
                    <td className="text-center py-3 px-4">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900">Encore une question ?</h2>
          <p className="mt-2 text-gray-500">
            Écris-nous à{" "}
            <a href="mailto:hello@mondedevis.eu" className="text-indigo-600 hover:underline font-medium">
              hello@mondedevis.eu
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
