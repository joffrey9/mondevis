import Link from "next/link";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <h1 className="text-3xl font-bold text-gray-900">Mentions légales</h1>

        <h2 className="text-xl font-semibold mt-8">Éditeur</h2>
        <p className="text-sm text-gray-600">
          MonDevis est édité par <strong>Joffrey Fortemps</strong>.<br />
          Contact : <a href="mailto:hello@mondevis.fr" className="text-blue-600 hover:underline">hello@mondevis.fr</a>
        </p>

        <h2 className="text-xl font-semibold mt-8">Hébergement</h2>
        <p className="text-sm text-gray-600">
          Le site est hébergé par Vercel Inc. (San Francisco, USA).
        </p>

        <h2 className="text-xl font-semibold mt-8">Propriété intellectuelle</h2>
        <p className="text-sm text-gray-600">
          L&apos;ensemble des contenus du site (textes, graphismes, logos) est la propriété exclusive de MonDevis.
          Toute reproduction sans autorisation est interdite.
        </p>

        <h2 className="text-xl font-semibold mt-8">Données personnelles</h2>
        <p className="text-sm text-gray-600">
          Les données collectées via le formulaire d&apos;inscription sont utilisées uniquement dans le cadre 
          du fonctionnement du service. Conformément au RGPD, vous pouvez demander la suppression de vos 
          données à tout moment par email.
        </p>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
