/**
 * GET /api/admin/preterme-ird/trello-lists
 *
 * Récupère la liste des colonnes (lists) d'un tableau Trello (périmètre IRD).
 * Identique fonctionnellement à l'endpoint Auto — séparé pour la clarté des logs.
 *
 * Query params :
 *   - boardId  : ID du tableau Trello
 *   - apiKey   : clé API Trello (non stockée)
 *   - token    : token Trello (non stocké)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";

const TRELLO_API = "https://api.trello.com/1";

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const boardId = searchParams.get("boardId")?.trim();
  const apiKey  = searchParams.get("apiKey")?.trim();
  const token   = searchParams.get("token")?.trim();

  if (!boardId || !apiKey || !token) {
    return NextResponse.json(
      { error: "Paramètres manquants : boardId, apiKey, token requis" },
      { status: 400 }
    );
  }

  const url = new URL(`${TRELLO_API}/boards/${boardId}/lists`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("token", token);
  url.searchParams.set("filter", "open");
  url.searchParams.set("fields", "id,name,pos");

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text();
    const status = res.status === 401 ? 401 : 502;
    return NextResponse.json(
      { error: `Trello API ${res.status}: ${text.slice(0, 200)}` },
      { status }
    );
  }

  const raw = await res.json() as { id: string; name: string; pos: number }[];

  const lists = raw
    .sort((a, b) => a.pos - b.pos)
    .map(({ id, name }) => ({ id, name }));

  return NextResponse.json({ lists });
}
