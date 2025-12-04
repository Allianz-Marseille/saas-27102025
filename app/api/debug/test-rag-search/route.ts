import { NextResponse } from "next/server";
import { searchRelevantContexts } from "@/lib/rag/chat-service";

export const dynamic = "force-dynamic";

/**
 * Endpoint de test de recherche RAG
 * À SUPPRIMER après diagnostic
 */
export async function GET() {
  const testQuery = "codes firme agents différenciés pro";
  
  try {
    console.log("[DEBUG] Début test recherche RAG...");
    
    const results = await searchRelevantContexts(testQuery, 3);
    
    console.log("[DEBUG] Résultats obtenus:", results.length);
    
    return NextResponse.json({
      success: true,
      query: testQuery,
      resultsCount: results.length,
      results: results.map((r) => ({
        score: r.score,
        documentId: r.documentId,
        filename: r.filename,
        textPreview: r.text.substring(0, 150) + "...",
      })),
    });
  } catch (error) {
    console.error("[DEBUG] Erreur complète:", error);
    
    return NextResponse.json({
      success: false,
      query: testQuery,
      error: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

