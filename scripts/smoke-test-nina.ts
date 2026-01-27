/**
 * Smoke test pour Nina (bot secrétaire) et l'endpoint /api/assistant/chat.
 * Usage : npm run smoke:nina [BASE_URL]
 * Pour valider la réponse "Nina" au "Bonjour", définir SMOKE_TEST_AUTH_TOKEN (Bearer Firebase ID token).
 */

const BASE_URL = process.env.SMOKE_TEST_BASE_URL || process.argv[2] || "http://localhost:3000";
const AUTH_TOKEN = process.env.SMOKE_TEST_AUTH_TOKEN;

async function smokeTestEndpointReachable(): Promise<boolean> {
  const url = `${BASE_URL}/api/assistant/chat`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Bonjour" }),
  });

  if (res.status === 401) {
    console.log("✅ Endpoint /api/assistant/chat atteint (401 = auth requise)");
    return true;
  }

  if (res.status === 200) {
    console.log("✅ Endpoint /api/assistant/chat répond 200");
    return true;
  }

  console.error(`❌ Endpoint /api/assistant/chat : statut inattendu ${res.status}`);
  const text = await res.text();
  if (text) console.error("   Body:", text.slice(0, 200));
  return false;
}

async function smokeTestBonjourNina(): Promise<boolean> {
  if (!AUTH_TOKEN) {
    console.log("⏭️  SMOKE_TEST_AUTH_TOKEN non défini — test « Bonjour → Nina » ignoré");
    return true;
  }

  const url = `${BASE_URL}/api/assistant/chat`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify({ message: "Bonjour", stream: false }),
  });

  if (res.status !== 200) {
    console.error(`❌ POST Bonjour : statut ${res.status}`);
    const text = await res.text();
    if (text) console.error("   Body:", text.slice(0, 300));
    return false;
  }

  const data = (await res.json()) as { success?: boolean; response?: string; error?: string };
  const responseText = typeof data.response === "string" ? data.response : "";

  if (!responseText.toLowerCase().includes("nina")) {
    console.error("❌ La réponse au « Bonjour » ne contient pas « Nina »");
    console.error("   Réponse reçue:", responseText.slice(0, 200));
    return false;
  }

  console.log("✅ POST « Bonjour » → 200 et réponse contient « Nina »");
  return true;
}

async function main() {
  console.log(`Smoke test Nina — BASE_URL=${BASE_URL}\n`);

  const ok1 = await smokeTestEndpointReachable();
  const ok2 = await smokeTestBonjourNina();

  if (ok1 && ok2) {
    console.log("\n✅ Tous les smoke tests Nina sont passés.");
    process.exit(0);
  }

  console.log("\n❌ Au moins un smoke test a échoué.");
  process.exit(1);
}

main().catch((err) => {
  console.error("Erreur smoke test:", err);
  process.exit(1);
});
