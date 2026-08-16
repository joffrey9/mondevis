import Link from "next/link";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <h1 className="text-3xl font-bold text-gray-900">Mentions légales</h1>
        <p className="text-sm text-gray-500 mt-2">Dernière mise à jour : 16 août 2026</p>

        <h2 className="text-xl font-semibold mt-8">Éditeur du site</h2>
        <p className="text-sm text-gray-600">
          Le site MonDevis est édité par <strong>Joffrey Fortemps</strong>.<br />
          Adresse : Rue Général Michel 11, 1120 Bruxelles, Belgique<br />
          N° d&apos;entreprise / TVA : BE 0891.930.638<br />
          Email :{" "}
          <a href="mailto:hello@mondedevis.eu" className="text-blue-600 hover:underline">
            hello@mondedevis.eu
          </a>
        </p>

        <h2 className="text-xl font-semibold mt-8">Hébergement</h2>
        <p className="text-sm text-gray-600">
          Le site est hébergé par <strong>Vercel Inc.</strong> (440 N Barranca Ave #4133, Covina,
          CA 91723, États-Unis). Les données (devis, factures, comptes) sont stockées dans une base
          PostgreSQL managée par <strong>Neon</strong>, hébergée en Europe.
        </p>

        <h2 className="text-xl font-semibold mt-8">Propriété intellectuelle</h2>
        <p className="text-sm text-gray-600">
          L&apos;ensemble des contenus du site (textes, graphismes, logos) est la propriété
          exclusive de MonDevis. Toute reproduction sans autorisation est interdite. Les devis et
          factures générés par les utilisateurs restent leur propriété.
        </p>

        <h2 className="text-xl font-semibold mt-8">Données personnelles</h2>
        <p className="text-sm text-gray-600">
          Les données collectées sont utilisées uniquement dans le cadre du fonctionnement du
          service, conformément au RGPD. Les modalités détaillées figurent dans la{" "}
          <Link href="/confidentialite" className="text-blue-600 hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>

        <h2 className="text-xl font-semibold mt-8">Informations complémentaires</h2>
        <p className="text-sm text-gray-600">
          <Link href="/cgv" className="text-blue-600 hover:underline">Conditions générales de vente</Link>
          {" · "}
          <Link href="/confidentialite" className="text-blue-600 hover:underline">Confidentialité</Link>
          {" · "}
          <Link href="/retractation" className="text-blue-600 hover:underline">Droit de rétractation</Link>
        </p>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Retour à l&apos;accueil</Link>
        </div>
      </div>
    </div>
  );
}
