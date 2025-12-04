import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint de diagnostic RAG
 * À SUPPRIMER après diagnostic
 */
export async function GET() {
  const config = {
    qdrant: {
      url: process.env.QDRANT_URL ? "✅ Configurée" : "❌ Manquante",
      urlValue: process.env.QDRANT_URL || "undefined",
      apiKey: process.env.QDRANT_API_KEY ? "✅ Configurée" : "❌ Manquante",
      apiKeyLength: process.env.QDRANT_API_KEY?.length || 0,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY ? "✅ Configurée" : "❌ Manquante",
      apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    },
    node: {
      env: process.env.NODE_ENV,
      vercel: process.env.VERCEL ? "✅ Running on Vercel" : "❌ Not Vercel",
    },
  };

  return NextResponse.json(config, { status: 200 });
}

