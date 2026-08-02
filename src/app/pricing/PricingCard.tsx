"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";

interface Plan {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  popular: boolean;
}

export default function PricingCard({ plan, index }: { plan: Plan; index: number }) {
  return (
    <ScrollReveal delay={index * 150}>
      <div
        className={`card-3d rounded-2xl p-8 h-full ${
          plan.popular
            ? "pricing-popular bg-white border-2 border-transparent shadow-xl shadow-indigo-100"
            : "bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-sm"
        }`}
      >
        {plan.popular && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold px-5 py-1.5 rounded-full shadow-lg">
            ✨ Le plus populaire
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
        <p className="text-xs text-gray-400 mt-1">{plan.desc}</p>
        <p className="mt-4">
          <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
          <span className="text-sm text-gray-400 ml-1">{plan.period}</span>
        </p>
        <ul className="mt-6 space-y-3">
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
          {plan.cta}
        </Link>
      </div>
    </ScrollReveal>
  );
}
