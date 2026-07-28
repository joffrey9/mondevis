import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Créer un compte</h1>
        <p className="text-sm text-gray-600 mb-6">
          Pour t&apos;inscrire, utilise le lien <strong>Magic Link</strong> ou <strong>Google</strong> depuis la page de connexion.
        </p>
        <Link
          href="/auth/signin"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
        >
          Aller à la connexion →
        </Link>
      </div>
    </div>
  );
}
