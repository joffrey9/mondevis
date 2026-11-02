/**
 * Analyse les captures extraites de la vidéo démo (demo-video/frames/)
 * avec le modèle vision Groq déjà configuré dans le projet, pour établir
 * la timeline des scènes (dashboard → devis → PDF → facture → accueil).
 * Usage : npx tsx scripts/analyze-video-frames.ts
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY manquante (sourcer .env)");

const FRAMES_DIR = "demo-video/frames";

const frameFiles = readdirSync(FRAMES_DIR).filter((f) => f.endsWith(".jpg")).sort();

const content: unknown[] = [
  {
    text: `Voici ${frameFiles.length} captures extraites d'une vidéo de démonstration d'une app SaaS de devis/factures pour artisans, prises toutes les 10 secondes (image 1 = 0:00, image 2 = 0:10, etc.).
Pour CHAQUE image, réponds sur une ligne au format :
"Image N (mm:ss) : <ce qui est affiché>"
Types d'écrans possibles : (a) dashboard/liste des devis, (b) détail d'un devis, (c) PDF d'un devis ouvert, (d) détail d'une facture, (e) page d'accueil du site web mondedevis.eu, (f) autre (précise). Sois concis.`,
  },
];

for (const f of frameFiles) {
  const b64 = readFileSync(join(FRAMES_DIR, f)).toString("base64");
  content.push({ inline_data: { mime_type: "image/jpeg", data: b64 } });
}

async function main() {
async function callGemini(content: unknown[]): Promise<string> {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: content }], generationConfig: { temperature: 0.1 } }),
      }
    );
    if (!res.ok) {
      console.error(`Modèle ${model} indisponible :`, res.status, (await res.text()).slice(0, 400));
      continue;
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (text) return text;
  }
  throw new Error("Aucun modèle vision disponible");
}
  console.log(await callGemini(content));
}

main().catch(console.error);
