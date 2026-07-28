import Link from "next/link";
import { CheckCircle } from "lucide-react";

const plans = [
  {
    name: "Débutant",
    price: "0 €",
    period: "/mois",
    features: ["3 devis/mois", "Modèles de base", "Envoi par email"],
    cta: "Commencer",
    popular: false,
  },
  {
    name: "Pro",
    price: "19 €",
    period: "/mois",
    features: ["Devis illimités", "Signature électronique", "Statistiques", "Support prioritaire"],
    cta: "Essayer 14 jours",
    popular: true,
  },
  {
    name: "Business",
    price: "49 €",
    period: "/mois",
    features: ["Tout le Pro", "API accès", "Multi-utilisateurs", "Marque blanche"],
    cta: "Nous contacter",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen py-20 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900">Nos offres</h1>
        <p className="mt-4 text-center text-gray-600">Tous les plans incluent 14 jours d'essai gratuit. Annulable à tout moment.</p>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`p-8 rounded-2xl border-2 bg-white relative ${plan.popular ? "border-blue-500 shadow-xl" : "border-gray-200"}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-4 py-1 rounded-full">Recommandé</div>}
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-4"><span className="text-4xl font-extrabold text-gray-900">{plan.price}</span><span className="text-sm text-gray-500 ml-1">{plan.period}</span></p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signin" className={`mt-6 block text-center py-3 rounded-xl font-semibold transition ${plan.popular ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
