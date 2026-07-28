"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"credentials" | "magic">("credentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Email ou mot de passe incorrect" : result.error);
        return;
      }
      // Redirection complète pour que le cookie de session soit bien pris en compte
      window.location.href = "/dashboard";
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Erreur de connexion. Vérifie tes identifiants.");
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("resend", { email, redirect: false, callbackUrl: "/dashboard" });
    setLoading(false);

    if (result?.error) {
      setError("Erreur d'envoi du lien. Vérifie l'email.");
      return;
    }
    alert("📬 Un lien de connexion t'a été envoyé par email !");
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <form onSubmit={mode === "credentials" ? handleCredentials : handleMagicLink} className="space-y-4">
      {mode === "credentials" ? (
        <div className="space-y-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe" required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition">
            {loading ? "Envoi..." : "Recevoir un Magic Link ✉️"}
          </button>
        </div>
      )}

      <button type="button" onClick={() => setMode(mode === "credentials" ? "magic" : "credentials")}
        className="text-sm text-blue-600 hover:underline block mx-auto">
        {mode === "credentials" ? "Connexion sans mot de passe ?" : "Mot de passe ?"}
      </button>

      <div className="flex items-center gap-2 my-4">
        <hr className="flex-1 border-gray-200" />
        <span className="text-xs text-gray-400">ou</span>
        <hr className="flex-1 border-gray-200" />
      </div>

      <button type="button" onClick={handleGoogleSignIn} disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition">
        Continuer avec Google
      </button>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>
      )}

      <p className="text-xs text-center text-gray-500 mt-4">
        Pas de compte ? <a href="/auth/register" className="text-blue-600 hover:underline">S&apos;inscrire</a>
      </p>
    </form>
  );
}
