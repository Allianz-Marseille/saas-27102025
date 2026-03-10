/**
 * Service Slack pour la synthèse de fin de traitement préterme.
 *
 * Utilise l'API Web Slack (chat.postMessage) avec un Bot Token.
 * Le canal cible est paramétré dans la config mensuelle (slackChannelId).
 *
 * Format du message : blocs Slack structurés, orienté synthèse commerciale.
 */

export interface SlackSynthesisData {
  moisKey: string;
  agences: {
    code: string;
    nom: string;
    globaux: number;
    conserves: number;
  }[];
  parCharge: Record<string, number>; // prénom → nb clients
  nbSocietesEnAttente: number;
  seuilEtp: number;
  seuilVariation: number;
}

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: unknown[];
}

// ─── Construction du message ──────────────────────────────────────────────────

function formatMoisLabel(moisKey: string): string {
  const [year, month] = moisKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function buildSlackBlocks(data: SlackSynthesisData): SlackBlock[] {
  const totalGlobaux  = data.agences.reduce((s, a) => s + a.globaux,   0);
  const totalConserves = data.agences.reduce((s, a) => s + a.conserves, 0);
  const ratioGlobal = totalGlobaux > 0
    ? Math.round((totalConserves / totalGlobaux) * 100)
    : 0;

  const moisLabel = formatMoisLabel(data.moisKey);

  const blocks: SlackBlock[] = [
    // ── Header ──
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📋 Prétermes Auto — ${moisLabel}`,
        emoji: true,
      },
    },
    { type: "divider" },

    // ── Synthèse globale ──
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Synthèse globale*\n${totalGlobaux} prétermes importés → *${totalConserves} conservés* (${ratioGlobal}% de conservation)`,
      },
    },

    // ── Détail par agence ──
    {
      type: "section",
      fields: data.agences.map((a) => {
        const ratio = a.globaux > 0 ? Math.round((a.conserves / a.globaux) * 100) : 0;
        return {
          type: "mrkdwn",
          text: `*${a.code} – ${a.nom}*\n${a.globaux} importés · ${a.conserves} conservés · ${ratio}%`,
        };
      }),
    },

    { type: "divider" },

    // ── Répartition CDC ──
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Charge par collaborateur*\n${
          Object.entries(data.parCharge)
            .sort(([, a], [, b]) => b - a)
            .map(([prenom, nb]) => `• ${prenom} : *${nb}* dossiers`)
            .join("\n")
        }`,
      },
    },
  ];

  // ── Sociétés en attente ──
  if (data.nbSocietesEnAttente > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `⚠️ *${data.nbSocietesEnAttente} société(s) en attente de validation* (nom du gérant non renseigné — pas de carte Trello créée).`,
      },
    });
  }

  blocks.push(
    { type: "divider" },
    // ── Seuils appliqués ──
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `_Seuils appliqués : ETP ≥ ${data.seuilEtp} | Taux de variation ≥ ${data.seuilVariation}% — Règle : ETP OU Variation_`,
        },
      ],
    }
  );

  return blocks;
}

// ─── Envoi ────────────────────────────────────────────────────────────────────

export interface SlackSendResult {
  success: boolean;
  ts?: string;   // timestamp du message (identifiant Slack)
  error?: string;
}

export async function envoyerSlack(
  channelId: string,
  botToken: string,
  data: SlackSynthesisData
): Promise<SlackSendResult> {
  if (!channelId || !botToken) {
    return { success: false, error: "channelId et botToken sont requis." };
  }

  const blocks = buildSlackBlocks(data);
  const moisLabel = formatMoisLabel(data.moisKey);

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${botToken}`,
      },
      body: JSON.stringify({
        channel: channelId,
        text: `Synthèse prétermes Auto — ${moisLabel}`, // fallback texte
        blocks,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      return { success: false, error: json.error ?? "Erreur API Slack" };
    }

    return { success: true, ts: json.ts };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erreur réseau",
    };
  }
}
