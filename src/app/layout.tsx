import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MonDevis — Crée des devis pros en 2 minutes",
  description:
    "MonDevis permet aux artisans de créer, envoyer et suivre leurs devis depuis leur téléphone. Devis, factures Peppol, signature électronique. Essai gratuit 14 jours.",
  keywords: ["devis", "facture", "artisan", "Peppol", "signature électronique", "devis gratuit", "logiciel devis"],
  authors: [{ name: "MonDevis" }],
  creator: "MonDevis",
  publisher: "MonDevis",
  metadataBase: new URL("https://mondedevis.eu"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MonDevis — Crée des devis pros en 2 minutes",
    description:
      "Le devis que tes clients attendaient. Crée, envoie et fais signer tes devis en 2 minutes. Pour artisans et indépendants.",
    url: "https://mondedevis.eu",
    siteName: "MonDevis",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MonDevis — Crée des devis pros en 2 minutes",
    description:
      "Le devis que tes clients attendaient. Crée, envoie et fais signer tes devis en 2 minutes.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
