#!/usr/bin/env ts-node
/**
 * Script interactif pour créer une clé API Pinecone au format pckey_...
 * Guide étape par étape pour créer et tester une nouvelle clé API
 * 
 * Usage: npx ts-node scripts/create-pinecone-api-key.ts
 */

import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

/**
 * Liste les projets disponibles
 */
async function listProjects(accessToken: string): Promise<any[]> {
  try {
    const response = await fetch("https://api.pinecone.io/admin/projects", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-Pinecone-Api-Version": "2025-04",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.projects || [];
  } catch (error) {
    throw new Error(`Impossible de lister les projets: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Crée une nouvelle clé API
 */
async function createApiKey(
  accessToken: string,
  projectId: string,
  keyName: string,
  roles: string[] = ["ProjectEditor"]
): Promise<string> {
  try {
    const response = await fetch(
      `https://api.pinecone.io/admin/projects/${projectId}/api-keys`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "X-Pinecone-Api-Version": "2025-04",
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name: keyName,
          roles: roles,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.key;
  } catch (error) {
    throw new Error(`Impossible de créer la clé API: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Teste la clé API créée
 */
async function testApiKey(apiKey: string, projectId: string, assistantName: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.pinecone.io/assistant/assistants/${assistantName}/chat`,
      {
        method: "POST",
        headers: {
          "Api-Key": apiKey,
          "Content-Type": "application/json",
          "X-Pinecone-Api-Version": "2025-01",
          "x-project-id": projectId,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "test" }],
          stream: false,
        }),
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Met à jour le fichier .env.local
 */
async function updateEnvFile(apiKey: string, projectId: string): Promise<void> {
  const envPath = path.join(process.cwd(), ".env.local");
  
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  // Mettre à jour ou ajouter PINECONE_API_KEY
  if (envContent.includes("PINECONE_API_KEY=")) {
    envContent = envContent.replace(
      /PINECONE_API_KEY=.*/,
      `PINECONE_API_KEY=${apiKey}`
    );
  } else {
    envContent += `\n# Pinecone API Key for AI Assistant\nPINECONE_API_KEY=${apiKey}\n`;
  }

  // Mettre à jour ou ajouter PINECONE_PROJECT_ID
  if (envContent.includes("PINECONE_PROJECT_ID=")) {
    envContent = envContent.replace(
      /PINECONE_PROJECT_ID=.*/,
      `PINECONE_PROJECT_ID=${projectId}`
    );
  } else {
    envContent += `PINECONE_PROJECT_ID=${projectId}\n`;
  }

  fs.writeFileSync(envPath, envContent);
}

async function main() {
  console.log("🔑 Création d'une Clé API Pinecone\n");
  console.log("=".repeat(70));
  console.log("\nCe script vous guide pour créer une clé API au format pckey_...");
  console.log("nécessaire pour l'API Chat de Pinecone Assistant.\n");

  try {
    // Étape 1: Obtenir l'Access Token
    console.log("📋 Étape 1: Access Token\n");
    console.log("L'Access Token se trouve dans:");
    console.log("  - Pinecone Console → Settings → API Keys");
    console.log("  - Ou généré via OAuth/authentication\n");
    
    const accessToken = await question("Entrez votre Access Token: ");
    if (!accessToken || accessToken.trim().length === 0) {
      console.log("❌ Access Token requis. Arrêt du script.");
      rl.close();
      return;
    }

    // Étape 2: Lister les projets
    console.log("\n📋 Étape 2: Sélection du projet\n");
    console.log("Récupération de vos projets...");
    
    const projects = await listProjects(accessToken.trim());
    
    if (projects.length === 0) {
      console.log("❌ Aucun projet trouvé.");
      rl.close();
      return;
    }

    console.log("\nProjets disponibles:\n");
    projects.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.name} (ID: ${project.id})`);
    });

    const projectChoice = await question(`\nChoisissez un projet (1-${projects.length}) ou entrez un Project ID: `);
    
    let projectId: string;
    const choiceNum = parseInt(projectChoice);
    if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= projects.length) {
      projectId = projects[choiceNum - 1].id;
      console.log(`✅ Projet sélectionné: ${projects[choiceNum - 1].name} (${projectId})`);
    } else {
      projectId = projectChoice.trim();
      console.log(`✅ Project ID utilisé: ${projectId}`);
    }

    // Étape 3: Nom de la clé API
    console.log("\n📋 Étape 3: Nom de la clé API\n");
    const keyName = await question("Entrez un nom pour la clé API (par défaut: saas-allianz-chat-api-key): ") || "saas-allianz-chat-api-key";

    // Étape 4: Rôles
    console.log("\n📋 Étape 4: Rôles de la clé API\n");
    console.log("Rôles disponibles:");
    console.log("  1. ProjectEditor (recommandé - permet modifications)");
    console.log("  2. ProjectViewer (lecture seule)");
    
    const roleChoice = await question("Choisissez un rôle (1 ou 2, défaut: 1): ") || "1";
    const roles = roleChoice === "2" ? ["ProjectViewer"] : ["ProjectEditor"];

    // Étape 5: Créer la clé API
    console.log("\n📋 Étape 5: Création de la clé API\n");
    console.log("Création en cours...");
    
    const apiKey = await createApiKey(accessToken.trim(), projectId, keyName, roles);
    
    console.log("✅ Clé API créée avec succès!\n");
    console.log("=".repeat(70));
    console.log("\n🔑 VOTRE NOUVELLE CLÉ API:\n");
    console.log(apiKey);
    console.log("\n" + "=".repeat(70));
    console.log("\n⚠️  IMPORTANT: Copiez cette clé maintenant, elle ne sera plus visible!\n");

    // Étape 6: Tester la clé
    console.log("📋 Étape 6: Test de la clé API\n");
    const assistantName = await question("Nom de l'assistant à tester (défaut: saas-allianz): ") || "saas-allianz";
    
    console.log("Test de la connexion...");
    const testSuccess = await testApiKey(apiKey, projectId, assistantName);
    
    if (testSuccess) {
      console.log("✅ Test réussi! La clé fonctionne correctement.\n");
    } else {
      console.log("⚠️  Test échoué, mais la clé peut quand même fonctionner.");
      console.log("   Vérifiez que l'assistant existe et est actif.\n");
    }

    // Étape 7: Mettre à jour .env.local
    console.log("📋 Étape 7: Mise à jour de .env.local\n");
    const updateEnv = await question("Voulez-vous mettre à jour .env.local automatiquement? (o/N): ");
    
    if (updateEnv.toLowerCase() === "o" || updateEnv.toLowerCase() === "oui" || updateEnv.toLowerCase() === "y" || updateEnv.toLowerCase() === "yes") {
      try {
        await updateEnvFile(apiKey, projectId);
        console.log("✅ .env.local mis à jour avec succès!\n");
      } catch (error) {
        console.log("❌ Erreur lors de la mise à jour de .env.local:", error);
        console.log("   Mettez à jour manuellement:\n");
        console.log(`   PINECONE_API_KEY=${apiKey}`);
        console.log(`   PINECONE_PROJECT_ID=${projectId}\n`);
      }
    } else {
      console.log("\nMettez à jour manuellement .env.local avec:\n");
      console.log(`   PINECONE_API_KEY=${apiKey}`);
      console.log(`   PINECONE_PROJECT_ID=${projectId}\n`);
    }

    // Instructions finales
    console.log("=".repeat(70));
    console.log("\n📝 Prochaines étapes:\n");
    console.log("1. Mettez à jour la clé API dans Vercel (Settings → Environment Variables)");
    console.log("2. Redéployez l'application");
    console.log("3. Testez le chatbot en production\n");
    console.log("✅ Clé API créée et configurée avec succès!\n");

  } catch (error) {
    console.error("\n❌ Erreur:", error instanceof Error ? error.message : String(error));
    console.log("\n💡 Vérifiez:");
    console.log("   - Votre Access Token est correct et valide");
    console.log("   - Le Project ID existe dans votre compte");
    console.log("   - Vous avez les permissions nécessaires\n");
  } finally {
    rl.close();
  }
}

main();

