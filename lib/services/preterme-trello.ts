/**
 * Dispatcher Trello pour les prétermes Auto.
 *
 * Crée une carte Trello par client conservé + routé.
 * - Format titre : [PRETERME][{AGENCE}][AUTO][{MOIS}] {NOM_CLIENT} - {NUM_CONTRAT}
 * - Idempotence : vérifie trelloCardId en base avant création
 * - Rate limiting : délai de 200ms entre chaque carte + retry exponentiel sur 429
 */

import type { PretermeClient, AgenceCode } from "@/types/preterme";
import type { RoutageResult } from "./preterme-router";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrelloCardResult {
  clientId: string;
  numeroContrat: string;
  cardId: string;
  cardUrl: string;
  success: boolean;
  error?: string;
}

export interface DispatchResult {
  total: number;
  success: number;
  errors: number;
  cards: TrelloCardResult[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TRELLO_API = "https://api.trello.com/1";
const DELAY_MS = 250;          // délai entre cartes (évite 429)
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Formatte le titre de la carte selon le standard défini dans les specs §4.2 */
function formatTitre(
  agence: AgenceCode,
  moisKey: string,
  nomClient: string,
  numeroContrat: string
): string {
  return `[PRETERME][${agence}][AUTO][${moisKey}] ${nomClient} - ${numeroContrat}`;
}

/** Formatte la description de la carte (style CRM, specs §4) */
function formatDescription(
  client: PretermeClient,
  moisKey: string,
  seuilEtp: number,
  seuilVariation: number
): string {
  const anomalies: string[] = [];
  if (client.etp !== null && client.etp !== undefined && client.etp >= seuilEtp) {
    anomalies.push(`⚠️ **ETP élevé : ${client.etp}** (seuil ≥ ${seuilEtp})`);
  }
  if (
    client.tauxVariation !== null &&
    client.tauxVariation !== undefined &&
    client.tauxVariation >= seuilVariation
  ) {
    anomalies.push(
      `⚠️ **Taux de variation : ${client.tauxVariation}%** (seuil ≥ ${seuilVariation}%)`
    );
  }

  const lignes = [
    `## Préterme Auto — ${moisKey}`,
    ``,
    `**Client :** ${client.nomClient}${client.nomGerant ? ` *(Gérant : ${client.nomGerant})*` : ""}`,
    `**N° Contrat :** ${client.numeroContrat}`,
    `**Agence :** ${client.agence}`,
    `**Branche :** Auto`,
    ``,
    `---`,
    ``,
    `**Prime précédente :** ${client.primeTTCAnnuellePrecedente != null ? `${client.primeTTCAnnuellePrecedente} €` : "—"}`,
    `**Prime actualisée :** ${client.primeTTCAnnuelleActualisee != null ? `${client.primeTTCAnnuelleActualisee} €` : "—"}`,
    `**Taux de variation :** ${client.tauxVariation != null ? `${client.tauxVariation}%` : "—"}`,
    `**ETP :** ${client.etp != null ? client.etp : "—"}`,
    `**Bonus/Malus :** ${client.bonusMalus || "—"}`,
    `**Nb sinistres :** ${client.nbSinistres ?? "—"}`,
    `**Échéance :** ${client.echeancePrincipale || "—"}`,
    ``,
  ];

  if (anomalies.length > 0) {
    lignes.push(`---`, ``, `### 🔴 Anomalies détectées`, ``);
    anomalies.forEach((a) => lignes.push(a));
  }

  return lignes.join("\n");
}

/** Appelle l'API Trello avec retry sur 429 */
async function trelloRequest(
  method: "GET" | "POST",
  endpoint: string,
  body: Record<string, string | undefined>,
  apiKey: string,
  token: string,
  retries = 0
): Promise<Response> {
  const url = new URL(`${TRELLO_API}${endpoint}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("token", token);

  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });

  if (res.status === 429 && retries < MAX_RETRIES) {
    await delay(RETRY_BASE_MS * Math.pow(2, retries));
    return trelloRequest(method, endpoint, body, apiKey, token, retries + 1);
  }

  return res;
}

/** Crée une carte Trello et retourne son ID + URL */
async function creerCarte(
  route: RoutageResult,
  agence: AgenceCode,
  moisKey: string,
  seuilEtp: number,
  seuilVariation: number,
  apiKey: string,
  token: string
): Promise<TrelloCardResult> {
  const { client, trello } = route;

  const titre = formatTitre(agence, moisKey, client.nomClient, client.numeroContrat);
  const description = formatDescription(client, moisKey, seuilEtp, seuilVariation);

  try {
    const res = await trelloRequest(
      "POST",
      "/cards",
      {
        idList: trello.trelloListId,
        name: titre,
        desc: description,
        idMembers: trello.trelloMemberId || undefined,
        pos: "bottom",
      },
      apiKey,
      token
    );

    if (!res.ok) {
      const text = await res.text();
      return {
        clientId: client.id,
        numeroContrat: client.numeroContrat,
        cardId: "",
        cardUrl: "",
        success: false,
        error: `HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const data = await res.json();
    return {
      clientId: client.id,
      numeroContrat: client.numeroContrat,
      cardId: data.id,
      cardUrl: data.shortUrl ?? data.url ?? "",
      success: true,
    };
  } catch (e) {
    return {
      clientId: client.id,
      numeroContrat: client.numeroContrat,
      cardId: "",
      cardUrl: "",
      success: false,
      error: e instanceof Error ? e.message : "Erreur réseau",
    };
  }
}

// ─── Dispatcher principal ─────────────────────────────────────────────────────

/**
 * Dispatch toutes les routes vers Trello avec délai anti-rate-limit.
 * - Ignore les clients qui ont déjà un trelloCardId (idempotence).
 * - Retourne le résumé complet de l'opération.
 */
export async function dispatcherTrello(
  routes: RoutageResult[],
  agence: AgenceCode,
  moisKey: string,
  seuilEtp: number,
  seuilVariation: number,
  apiKey: string,
  token: string
): Promise<DispatchResult> {
  const cards: TrelloCardResult[] = [];

  for (const route of routes) {
    // Idempotence : skip si carte déjà créée
    if (route.client.trelloCardId) {
      cards.push({
        clientId: route.client.id,
        numeroContrat: route.client.numeroContrat,
        cardId: route.client.trelloCardId,
        cardUrl: route.client.trelloCardUrl ?? "",
        success: true,
      });
      continue;
    }

    const result = await creerCarte(
      route, agence, moisKey, seuilEtp, seuilVariation, apiKey, token
    );
    cards.push(result);

    // Délai anti-rate-limit entre chaque carte
    await delay(DELAY_MS);
  }

  const success = cards.filter((c) => c.success).length;

  return {
    total: routes.length,
    success,
    errors: routes.length - success,
    cards,
  };
}
