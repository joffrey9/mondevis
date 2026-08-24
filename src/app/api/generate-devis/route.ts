import { NextResponse } from "next/server";

const groqApiKey = process.env.GROQ_API_KEY;

export async function POST(request: Request) {
  if (!groqApiKey) {
    return NextResponse.json(
      { error: "Clé API Groq non configurée. Ajoute GROQ_API_KEY dans .env" },
      { status: 500 }
    );
  }

  try {
    const { description, prestation, country } = await request.json();

    if (!description?.trim()) {
      return NextResponse.json(
        { error: "Description requise" },
        { status: 400 }
      );
    }

    const pays = country === "BE" ? "Belgique" : "France";
    const devise = "EUR";
    const tvaDefaults = country === "BE"
      ? "TVA possible : 21% (standard), 12% (réduit), 6% (super-réduit)"
      : "TVA possible : 20% (standard), 10% (réduit), 5.5% (super-réduit)";

    const prompt = `Tu es un expert en chiffrage de travaux pour artisans du bâtiment en ${pays}.

L'utilisateur décrit un projet de travaux. Génère un devis structuré au format JSON.

CONTEXTE :
- Pays : ${pays}
- Prestation : ${prestation || "Non spécifié"}
- ${tvaDefaults}

RÈGLES :
1. Découpe le projet en 3 à 7 lignes de devis (items)
2. Chaque ligne doit avoir : description, quantité, prixUnitaire (€ HT), tvaRate
3. Les prix unitaires (€ HT) doivent être réalistes pour ${pays} en 2026 — JAMAIS 0 €, JAMAIS vides
4. Les quantités doivent refléter la réalité du chantier (m², ml, unités, forfaits) — JAMAIS 0
5. Fais varier les taux TVA selon le type de prestation (ex: rénovation énergétique = taux réduit)

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte avant/après) au format :
{
  "description": "Description reformulée du projet en 1-2 phrases",
  "lines": [
    { "description": "Dépose de l'ancien revêtement", "quantity": 50, "unitPrice": 12, "tvaRate": 10 }
  ]
}

Description brute : ${description}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Groq HTTP]", response.status, err);
      if (response.status === 401) {
        return NextResponse.json({ error: "Clé API Groq invalide" }, { status: 500 });
      }
      return NextResponse.json({ error: "Erreur API Groq" }, { status: 500 });
    }

    const data = await response.json();
    const content = (data.choices?.[0]?.message?.content || "").trim();

    // Nettoyer le texte : enlever les ```json ``` si présents
    let cleanContent = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch {
      console.error("[Groq Parse] Impossible de parser:", cleanContent.slice(0, 300));
      return NextResponse.json(
        { error: "Erreur de parsing de la réponse IA" },
        { status: 500 }
      );
    }

    // Validation des lignes
    if (!parsed.lines || !Array.isArray(parsed.lines) || parsed.lines.length === 0) {
      return NextResponse.json(
        { error: "L'IA n'a pas généré de lignes de devis valides" },
        { status: 500 }
      );
    }

    // Normaliser les lignes
    const defaultTva = country === "BE" ? 21 : 20;
    const lines = parsed.lines.map((l: any) => ({
      description: l.description || "Prestation",
      quantity: Math.max(1, parseFloat(l.quantity) || 1),
      unitPrice: Math.max(0, parseFloat(l.unitPrice) || 0),
      tvaRate: parseFloat(l.tvaRate) || defaultTva,
    }));

    return NextResponse.json({
      description: parsed.description || description,
      lines,
    });
  } catch (error: any) {
    console.error("[Groq Error]", error?.message || error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du devis" },
      { status: 500 }
    );
  }
}
