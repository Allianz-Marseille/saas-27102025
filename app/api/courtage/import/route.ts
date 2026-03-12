/**
 * POST /api/courtage/import
 *
 * Import initial des compagnies de courtage.
 * Idempotent : chaque ligne est insérée seulement si la compagnie n'existe pas déjà.
 * Pour les doublons légitimes (ex: Allianz Travel), un suffixe de distinction est conservé.
 *
 * Réservé aux administrateurs.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";
import { normalizeCompanyName, sanitizeInternetLink } from "@/lib/utils/courtage-format";

const SEED_DATA = [
  { compagnie: "Add Value", identifiant: "jm.nogaro@allianz.fr", password: "ALLIANZadd2025@", internet: "https://courtage.add-value.fr/" },
  { compagnie: "Allianz Travel (Julien)", identifiant: "Julien.boetti@allianz.fr", password: "H91358h92083az@", internet: "https://allianztravel-agentmax.fr/onePortalIUI/#/" },
  { compagnie: "Apivia", identifiant: "jean_michel,nogaro@C361D", password: "H91358@H92083", internet: "" },
  { compagnie: "April", identifiant: "H91358AZ", password: "H91358az@@nb", internet: "" },
  { compagnie: "Assurimat", identifiant: "h913581@agents.allianz.fr", password: "H91358", internet: "https://www.assurimmat.fr/v3/home" },
  { compagnie: "Assurmax Pro", identifiant: "AC07021584", password: "a9s2y7a3", internet: "" },
  { compagnie: "Assurmax New", identifiant: "jm.nogaro@allianz.fr", password: "H91358az@", internet: "Extranet | Assurmax" },
  { compagnie: "Carene", identifiant: "H91358", password: "eDdB65WM", internet: "" },
  { compagnie: "Entoria", identifiant: "104248 / JNOGARO", password: "H91358AZh92083@", internet: "https://espacecourtier.entoria.fr/login" },
  { compagnie: "Fma", identifiant: "8423", password: "H91358h92083@", internet: "" },
  { compagnie: "Mondial Assistance", identifiant: "203160", password: "VE203160", internet: "Mondial Assistance Pro" },
  { compagnie: "Mutuelle Du Soleil", identifiant: "nogaro.jean-michel", password: "H91358AZ", internet: "Espace Courtier · Mutuelles du soleil" },
  { compagnie: "Netvox", identifiant: "NETX9590_1372", password: "Corniche13007!", internet: "Courtier en assurance : Login Netvox" },
  { compagnie: "Plus Simple", identifiant: "corniche13007@allianz.fr", password: "Hh91358AZ", internet: "https://app.simplifieurs.pro/auth/login?redirect_uri=%2Fcatalog%2Faprilentrepriseest-opt11-multi" },
  { compagnie: "Progeas", identifiant: "91892", password: "gdfd886", internet: "Progeas" },
  { compagnie: "Repam", identifiant: "jm.nogaro@allianz.fr", password: "H91358h92083@", internet: "Espace courtier" },
  { compagnie: "SIDEXA", identifiant: "FR0295014A / hme01", password: "H91358h92083@", internet: "https://www.sidexa.fr" },
  { compagnie: "Solly Azar", identifiant: "corniche13007@allianz.fr", password: "H91358az@", internet: "Solly Azar Pro" },
  { compagnie: "SOS Immeuble", identifiant: "jm.nogaro@allianz.fr", password: "H91358az@", internet: "https://sos-assurance-immeubles-tarifs.fr/SOS_Assurance_Immeubles" },
  { compagnie: "Stoik", identifiant: "jm.nogaro@allianz.fr", password: "H91358h92083@", internet: "Stoïk · Connexion (stoik.io)" },
  { compagnie: "Tetris", identifiant: "corniche13007@allianz.fr", password: "H91358neiges@", internet: "Tetris Assurance" },
  { compagnie: "Uniced", identifiant: "133184 / futur h913581@agents.allianz.fr", password: "H91358AZ", internet: "https://espaces.uniced.fr/uniced/conseiller/menu.php" },
  { compagnie: "Unim", identifiant: "h913581@agents.allianz.fr", password: "H91358h92083@", internet: "Auth Assurances Médicales" },
  { compagnie: "Zephir", identifiant: "I15997", password: "H91358az@@@", internet: "https://www.zephiralize.fr/" },
  { compagnie: "Declarassur", identifiant: "340234962 / infodsn", password: "|AZ-dsn-2025|", internet: "Declarassur Extranet V12.6.0" },
  { compagnie: "Maxance", identifiant: "corniche13007@allianz.fr", password: "H91358H92083@", internet: "https://extranet.maxance.com/Maxance/Login" },
  { compagnie: "Jeresilie.com", identifiant: "jm.nogaro@allianz.fr", password: "H91358AZ", internet: "" },
  { compagnie: "Yousign", identifiant: "corniche13007@allianz.fr", password: "H91358AZ", internet: "" },
  { compagnie: "Slack", identifiant: "agenceallianznogaro", password: "", internet: "" },
  { compagnie: "Infogreffe", identifiant: "jm.nogaro@allianz.fr", password: "ALLIANZh91358@", internet: "" },
  { compagnie: "Allianz Travel (EN)", identifiant: "corniche13007@allianz.fr", password: "@H91358az", internet: "AgentMax" },
  { compagnie: "Cba Assurances", identifiant: "7021584", password: "tbfy4f65", internet: "https://extranet.cba-groupe.fr/" },
  { compagnie: "Plussimple / Aksam", identifiant: "rouviere13009@allianz.fr", password: "AKSAMallianz2025", internet: "Simplifieurs" },
  { compagnie: "April Connexion Julien", identifiant: "BOETTJU", password: "H91358h92083@", internet: "" },
] as const;

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 403 });
  }

  try {
    // Récupérer les compagnies déjà existantes
    const existing = await adminDb.collection("courtage").get();
    const existingNames = new Set(
      existing.docs.map((d) => (d.data().compagnie as string)?.toLowerCase().trim())
    );

    const batch = adminDb.batch();
    let inserted = 0;
    let skipped = 0;

    for (const row of SEED_DATA) {
      const normalizedCompagnie = normalizeCompanyName(row.compagnie);
      const key = normalizedCompagnie.toLowerCase().trim();
      if (existingNames.has(key)) {
        skipped++;
        continue;
      }
      const ref = adminDb.collection("courtage").doc();
      batch.set(ref, {
        compagnie: normalizedCompagnie,
        identifiant: row.identifiant,
        password: row.password,
        internet: sanitizeInternetLink(row.internet),
        qui: null,
        dateModification: null,
        createdAt: Timestamp.now(),
      });
      inserted++;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      message: `${inserted} entrées importées, ${skipped} ignorées (déjà existantes).`,
    });
  } catch (err) {
    console.error("POST /api/courtage/import:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
