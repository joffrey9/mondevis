import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">❌ Erreur de connexion</h1>
        <p className="text-sm text-gray-600 mb-6">
          Une erreur est survenue lors de la connexion. Vérifie tes identifiants ou réessaie.
        </p>
        <Link
          href="/auth/signin"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
        >
          Réessayer →
        </Link>
      </div>
    </div>
  );
}
