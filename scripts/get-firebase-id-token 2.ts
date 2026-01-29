#!/usr/bin/env ts-node
/**
 * Récupère un Firebase ID token pour les smoke tests (ex. Bonjour → Nina).
 * Usage :
 *   SMOKE_TEST_EMAIL=... SMOKE_TEST_PASSWORD=... npm run get-firebase-token
 *   Puis : SMOKE_TEST_AUTH_TOKEN=$(...) SMOKE_TEST_BASE_URL=https://... npm run smoke:nina
 *
 * Lit NEXT_PUBLIC_FIREBASE_API_KEY depuis .env.local (ou .env).
 * Erreurs sur stderr ; seul le token est écrit sur stdout en cas de succès.
 */

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const EMAIL = process.env.SMOKE_TEST_EMAIL;
const PASSWORD = process.env.SMOKE_TEST_PASSWORD;

const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;

async function main(): Promise<void> {
  if (!API_KEY || API_KEY === "your_api_key_here") {
    console.error("Erreur : NEXT_PUBLIC_FIREBASE_API_KEY manquant ou invalide.");
    process.exit(1);
  }
  if (!EMAIL || !PASSWORD) {
    console.error("Erreur : définissez SMOKE_TEST_EMAIL et SMOKE_TEST_PASSWORD.");
    process.exit(1);
  }

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      returnSecureToken: true,
    }),
  });

  const data = (await res.json()) as { idToken?: string; error?: { message: string } };
  if (!res.ok) {
    console.error("Firebase Auth:", data.error?.message || res.statusText);
    process.exit(1);
  }
  if (!data.idToken) {
    console.error("Réponse sans idToken.");
    process.exit(1);
  }
  process.stdout.write(data.idToken);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
