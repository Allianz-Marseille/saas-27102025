/**
 * Service Slack pour la synthèse de fin de traitement préterme IARD.
 *
 * Réutilise le même canal CE58HNVF0 que l'Auto.
 * Différences : header "Prétermes IARD", ETP affiché en décimal (seuilEtp/100).
 */

import { envoyerSlack, type SlackSynthesisData, type SlackSendResult } from "./preterme-slack";

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: unknown[];
}

function formatMoisLabel(moisKey: string): string {
  const [year, month] = moisKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/** Construit les blocs Slack pour le préterme IARD */
export function buildIrdSlackBlocks(data: SlackSynthesisData): SlackBlock[] {
  const totalGlobaux   = data.agences.reduce((s, a) => s + a.globaux,   0);
  const totalConserves = data.agences.reduce((s, a) => s + a.conserves, 0);
  const ratioGlobal = totalGlobaux > 0
    ? Math.round((totalConserves / totalGlobaux) * 100)
    : 0;

  const moisLabel = formatMoisLabel(data.moisKey);
  const seuilEtpDecimal = (data.seuilEtp / 100).toFixed(2);

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🛡️ Prétermes IARD — ${moisLabel}`,
        emoji: true,
      },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Synthèse globale*\n${totalGlobaux} prétermes importés → *${totalConserves} conservés* (${ratioGlobal}% de conservation)`,
      },
    },
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
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `_Seuils appliqués : ETP ≥ ${seuilEtpDecimal} | Taux de variation ≥ ${data.seuilVariation}% — Règle : ETP OU Variation_`,
        },
      ],
    }
  );

  return blocks;
}

/** Envoie la synthèse IARD sur Slack (avec blocs IARD) */
export async function envoyerIrdSlack(
  channelId: string,
  botToken: string,
  data: SlackSynthesisData
): Promise<SlackSendResult> {
  // On passe par envoyerSlack générique mais on remplace les blocs IARD
  // via une adaptation du payload : reconstruire directement l'appel
  if (!channelId || !botToken) {
    return { success: false, error: "channelId et botToken sont requis." };
  }

  const blocks = buildIrdSlackBlocks(data);
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
        text: `Synthèse prétermes IARD — ${moisLabel}`,
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

// Ré-exporte les types partagés
export type { SlackSynthesisData, SlackSendResult };
// Ré-exporte envoyerSlack si besoin
export { envoyerSlack };
