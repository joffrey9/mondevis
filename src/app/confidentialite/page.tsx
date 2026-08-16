import Link from "next/link";

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <h1 className="text-3xl font-bold text-gray-900">Politique de confidentialité</h1>
        <p className="text-sm text-gray-500 mt-2">Dernière mise à jour : 16 août 2026</p>

        <h2 className="text-xl font-semibold mt-8">1. Responsable du traitement</h2>
        <p className="text-sm text-gray-600">
          Le responsable du traitement est <strong>Joffrey Fortemps</strong> — [ADRESSE COMPLÈTE],
          joignable à{" "}
          <a href="mailto:hello@mondedevis.eu" className="text-blue-600 hover:underline">
            hello@mondedevis.eu
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold mt-8">2. Données collectées</h2>
        <ul className="text-sm text-gray-600 list-disc pl-6">
          <li><strong>Compte</strong> : nom, email, mot de passe (chiffré) ou identifiants Google.</li>
          <li><strong>Contenu métier</strong> : devis, factures, clients, données saisies par l&apos;utilisateur.</li>
          <li><strong>Paiement</strong> : traité exclusivement par Stripe (MonDevis ne stocke pas les numéros de carte).</li>
          <li><strong>Données techniques</strong> : adresse IP, navigateur (journalisées de façon limitée).</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">3. Finalités et bases légales</h2>
        <ul className="text-sm text-gray-600 list-disc pl-6">
          <li>Fournir et améliorer le service (exécution du contrat).</li>
          <li>Gérer les abonnements et les notifications (exécution du contrat).</li>
          <li>Respecter les obligations légales et comptables.</li>
          <li>Assurer la sécurité et prévenir la fraude (intérêt légitime).</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">4. Sous-traitants</h2>
        <ul className="text-sm text-gray-600 list-disc pl-6">
          <li><strong>Vercel Inc.</strong> — hébergement du site (États-Unis, clauses contractuelles types).</li>
          <li><strong>Neon</strong> — base de données PostgreSQL managée (Europe).</li>
          <li><strong>Mistral AI</strong> — génération assistée par IA du contenu des devis (Europe).</li>
          <li><strong>Stripe</strong> — traitement des paiements.</li>
          <li><strong>Resend</strong> — envoi des emails transactionnels.</li>
          <li><strong>Google</strong> — connexion OAuth (uniquement si l&apos;utilisateur choisit cette méthode).</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">5. Durée de conservation</h2>
        <p className="text-sm text-gray-600">
          Les devis, factures et données de compte sont conservés tant que le compte est actif, puis
          supprimés à la demande. Les données de facturation sont conservées conformément aux
          obligations légales et comptables.
        </p>

        <h2 className="text-xl font-semibold mt-8">6. Vos droits (RGPD)</h2>
        <p className="text-sm text-gray-600">
          Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation, de
          portabilité et d&apos;opposition. Vous pouvez les exercer en écrivant à{" "}
          <a href="mailto:hello@mondedevis.eu" className="text-blue-600 hover:underline">
            hello@mondedevis.eu
          </a>
          . Vous pouvez également introduire une réclamation auprès de l&apos;autorité de contrôle
          compétente (APD en Belgique, CNIL en France).
        </p>

        <h2 className="text-xl font-semibold mt-8">7. Sécurité</h2>
        <p className="text-sm text-gray-600">
          Le service utilise des mesures de sécurité appropriées : chiffrement SSL/TLS, mots de passe
          hachés, secrets stockés de façon chiffrée. Les paiements sont traités par Stripe
          (conforme PCI-DSS).
        </p>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Retour à l&apos;accueil</Link>
        </div>
      </div>
    </div>
  );
}
