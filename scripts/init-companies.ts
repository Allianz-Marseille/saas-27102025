/**
 * Script d'initialisation des compagnies
 * 
 * Ce script ajoute les compagnies initiales (Allianz et Courtage) dans Firestore
 * si elles n'existent pas déjà.
 * 
 * Usage: npm run init-companies
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Initialiser Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require('../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const COMPANIES = [
  { name: "Allianz", active: true },
  { name: "Courtage", active: true },
];

async function initCompanies() {
  console.log("🔧 Initialisation des compagnies...");

  try {
    const companiesRef = db.collection("companies");
    
    // Vérifier si des compagnies existent déjà
    const existingCompanies = await companiesRef.get();
    
    if (existingCompanies.empty) {
      console.log("📝 Aucune compagnie trouvée, création des compagnies initiales...");
      
      for (const company of COMPANIES) {
        await companiesRef.add({
          name: company.name,
          active: company.active,
          createdAt: admin.firestore.Timestamp.now(),
        });
        console.log(`✅ Compagnie "${company.name}" créée`);
      }
      
      console.log("\n✨ Initialisation terminée avec succès !");
    } else {
      console.log("ℹ️  Des compagnies existent déjà dans la base de données.");
      console.log(`   Compagnies existantes:`);
      existingCompanies.docs.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.name} (${data.active ? "Active" : "Inactive"})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    process.exit(1);
  }
}

// Exécuter le script
initCompanies();

