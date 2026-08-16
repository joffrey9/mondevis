import Link from "next/link";

export default function CgvPage() {
  return (
    <div className="min-h-screen py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <h1 className="text-3xl font-bold text-gray-900">Conditions générales de vente et d&apos;utilisation</h1>
        <p className="text-sm text-gray-500 mt-2">Dernière mise à jour : 16 août 2026</p>

        <p className="text-sm text-gray-600">
          Les présentes conditions régissent l&apos;accès et l&apos;utilisation du service MonDevis,
          édité par <strong>Joffrey Fortemps</strong> — Rue Général Michel 11, 1120 Bruxelles, Belgique — BE 0891.930.638,
          joignable à{" "}
          <a href="mailto:hello@mondedevis.eu" className="text-blue-600 hover:underline">
            hello@mondedevis.eu
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold mt-8">1. Objet</h2>
        <p className="text-sm text-gray-600">
          MonDevis est un service en ligne qui permet aux artisans et indépendants de créer, envoyer
          et suivre leurs devis et factures, avec signature électronique et envoi via email ou
          WhatsApp.
        </p>

        <h2 className="text-xl font-semibold mt-8">2. Offre gratuite (Débutant)</h2>
        <p className="text-sm text-gray-600">
          Le plan Débutant est gratuit et permet <strong>3 devis par mois</strong>, sans carte
          bancaire.
        </p>

        <h2 className="text-xl font-semibold mt-8">3. Abonnements payants</h2>
        <p className="text-sm text-gray-600">
          Deux abonnements sont proposés, facturés chaque mois via Stripe :
        </p>
        <ul className="text-sm text-gray-600 list-disc pl-6">
          <li><strong>Pro</strong> : 19 € TTC / mois — devis illimités, signature électronique, statistiques, support prioritaire.</li>
          <li><strong>Business</strong> : 49 € TTC / mois — tout le plan Pro, factures Peppol, multi-utilisateurs, marque blanche, API.</li>
        </ul>
        <p className="text-sm text-gray-600">
          Chaque abonnement payant inclut un <strong>essai gratuit de 14 jours</strong> à la première
          souscription. Aucun prélèvement n&apos;intervient pendant cette période. L&apos;abonnement est
          résiliable à tout moment depuis l&apos;espace client, sans préavis ni frais.
        </p>

        <h2 className="text-xl font-semibold mt-8">4. Paiement</h2>
        <p className="text-sm text-gray-600">
          Les paiements sont traités par <strong>Stripe</strong>, prestataire de paiement sécurisé.
          MonDevis ne stocke jamais les numéros de carte bancaire. Une facture est émise pour chaque
          paiement.
        </p>

        <h2 className="text-xl font-semibold mt-8">5. Droit de rétractation</h2>
        <p className="text-sm text-gray-600">
          Le client consommateur dispose d&apos;un délai de 14 jours pour exercer son droit de
          rétractation (voir la page{" "}
          <Link href="/retractation" className="text-blue-600 hover:underline">rétractation</Link>
          ). Pour un service numérique dont l&apos;exécution commence immédiatement avec l&apos;accord du
          client, celui-ci renonce expressément à ce droit.
        </p>

        <h2 className="text-xl font-semibold mt-8">6. Obligations de l&apos;utilisateur</h2>
        <p className="text-sm text-gray-600">
          L&apos;utilisateur s&apos;engage à fournir des informations exactes, à vérifier la conformité
          légale, fiscale et commerciale de ses devis et factures (TVA, mentions obligatoires) avant
          envoi, et à ne pas utiliser le service à des fins illicites.
        </p>

        <h2 className="text-xl font-semibold mt-8">7. Responsabilité</h2>
        <p className="text-sm text-gray-600">
          MonDevis met en œuvre les moyens raisonnables pour assurer la disponibilité et
          l&apos;exactitude du service. Les calculs (TVA FR / BE, totaux) sont fournis à titre indicatif :
          l&apos;utilisateur reste responsable de leur validation. MonDevis ne saurait être tenu
          responsable des dommages indirects ni des erreurs résultant de données saisies par
          l&apos;utilisateur.
        </p>

        <h2 className="text-xl font-semibold mt-8">8. Données personnelles</h2>
        <p className="text-sm text-gray-600">
          Le traitement des données personnelles est décrit dans la{" "}
          <Link href="/confidentialite" className="text-blue-600 hover:underline">politique de confidentialité</Link>
          .
        </p>

        <h2 className="text-xl font-semibold mt-8">9. Droit applicable</h2>
        <p className="text-sm text-gray-600">
          Les présentes CGV sont soumises au droit belge. En cas de
          litige, une solution amiable sera recherchée avant toute action judiciaire.
        </p>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Retour à l&apos;accueil</Link>
        </div>
      </div>
    </div>
  );
}
