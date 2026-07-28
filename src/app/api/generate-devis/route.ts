import { NextResponse } from "next/server";

const apiKey = process.env.MISTRAL_API_KEY;

export async function POST(request: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API Mistral non configurée. Ajoute MISTRAL_API_KEY dans .env" },
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
3. Les prix doivent être réalistes pour ${pays} en 2026
4. La quantité ne doit JAMAIS être 0 — min 1
5. Fais varier les taux TVA selon le type de prestation (ex: rénovation énergétique = taux réduit)

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte avant/après) au format :
{
  "description": "Description reformulée du projet en 1-2 phrases",
  "lines": [
    { "description": "...", "quantity": 1, "unitPrice": 0, "tvaRate": 20 }
  ]
}

Description brute : ${description}`;

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Mistral HTTP]", response.status, err);
      if (response.status === 401) {
        return NextResponse.json({ error: "Clé API Mistral invalide" }, { status: 500 });
      }
      return NextResponse.json({ error: "Erreur API Mistral" }, { status: 500 });
    }

    const data = await response.json();
    const content = (data.choices?.[0]?.message?.content || "").trim();

    // Nettoyer le texte : enlever les ```json ``` si présents
    let cleanContent = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch {
      console.error("[Mistral Parse] Impossible de parser:", cleanContent.slice(0, 300));
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
    console.error("[Mistral Error]", error?.message || error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du devis" },
      { status: 500 }
    );
  }
}
