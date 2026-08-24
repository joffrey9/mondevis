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
    const prompt = `Tu es un expert en rédaction de descriptions de travaux pour artisans du bâtiment en ${pays}.

Reformule la description des travaux ci-dessous en un texte professionnel de 3 à 6 lignes, sans titre, sans prix, sans en-tête.

Type de prestation : ${prestation || "Non spécifié"}

Description brute : ${description}

Réponds UNIQUEMENT avec la description reformulée, sans aucun en-tête ni pied de page.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
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
    const generated = (data.choices?.[0]?.message?.content || description).trim();
    return NextResponse.json({ generated });
  } catch (error: any) {
    console.error("[Groq Error]", error?.message || error);
    return NextResponse.json(
      { error: "Erreur lors de la génération" },
      { status: 500 }
    );
  }
}
