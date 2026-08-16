import Link from "next/link";

export default function RetractationPage() {
  return (
    <div className="min-h-screen py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <h1 className="text-3xl font-bold text-gray-900">Droit de rétractation</h1>
        <p className="text-sm text-gray-500 mt-2">Dernière mise à jour : 16 août 2026</p>

        <h2 className="text-xl font-semibold mt-8">Délai de rétractation</h2>
        <p className="text-sm text-gray-600">
          Conformément à la réglementation européenne (article L.221-18 du Code de la consommation et
          dispositions équivalentes), le client <strong>consommateur</strong> dispose d&apos;un délai de{" "}
          <strong>14 jours</strong> à compter de la conclusion du contrat pour exercer son droit de
          rétractation, sans avoir à motiver sa décision.
        </p>

        <h2 className="text-xl font-semibold mt-8">Exception — service numérique fourni immédiatement</h2>
        <p className="text-sm text-gray-600">
          Conformément à l&apos;article L.221-28 du Code de la consommation, le droit de rétractation ne
          peut être exercé pour un contrat de fourniture de contenu numérique dont l&apos;exécution a
          commencé avec l&apos;accord exprès du consommateur et pour lequel il a renoncé à son droit de
          rétractation.
        </p>
        <p className="text-sm text-gray-600">
          En souscrivant un abonnement MonDevis, le client reconnaît que le service (accès immédiat
          aux devis et factures) commence immédiatement et renonce expressément à son droit de
          rétractation.
        </p>

        <h2 className="text-xl font-semibold mt-8">Exercer son droit</h2>
        <p className="text-sm text-gray-600">
          Pour exercer votre droit de rétractation (dans la limite des exceptions ci-dessus),
          adressez une déclaration sans équivoque à{" "}
          <a href="mailto:hello@mondedevis.eu" className="text-blue-600 hover:underline">
            hello@mondedevis.eu
          </a>
          , par exemple au moyen du modèle ci-dessous.
        </p>

        <h2 className="text-xl font-semibold mt-8">Remboursement</h2>
        <p className="text-sm text-gray-600">
          En cas de rétractation valable, le remboursement est effectué au plus tard sous 14 jours à
          compter de la réception de la demande, par le même moyen de paiement que celui utilisé lors
          de la transaction.
        </p>

        <h2 className="text-xl font-semibold mt-8">Modèle de formulaire de rétractation</h2>
        <div className="text-sm text-gray-600 border border-gray-200 rounded-lg p-6">
          <p>
            À l&apos;attention de Joffrey Fortemps — hello@mondedevis.eu :
          </p>
          <p className="mt-3">
            Je vous notifie par la présente ma rétractation du contrat portant sur la prestation de
            service ci-dessous :
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Souscrit le : [DATE]</li>
            <li>Nom du consommateur : [NOM]</li>
            <li>Email du consommateur : [EMAIL]</li>
          </ul>
          <p className="mt-3">Date : [DATE]</p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Retour à l&apos;accueil</Link>
        </div>
      </div>
    </div>
  );
}
