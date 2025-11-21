#!/usr/bin/env ts-node

/**
 * Script de migration pour recalculer les commissions IRD_PRO avec la nouvelle formule
 * 
 * Ce script :
 * 1. Récupère tous les actes de type IRD_PRO
 * 2. Recalcule leur commission avec la nouvelle formule (20 € + 10 €/tranche de 1000 € > 999 €)
 * 3. Met à jour les documents dans Firestore
 * 
 * Usage: npm run migrate-ird-pro-commissions
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// Configuration Firebase Admin SDK
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

/**
 * Calcule la commission IRD_PRO avec la nouvelle formule
 * 20 € + 10 € par tranche de 1000 € au-delà de 999 €
 */
function calculateIRDProCommission(primeAnnuelle: number): number {
  if (primeAnnuelle <= 999) return 20;
  const montantExcedent = primeAnnuelle - 999;
  const tranches = Math.ceil(montantExcedent / 1000);
  return 20 + tranches * 10;
}

async function migrateIRDProCommissions() {
  try {
    console.log('🔄 Initialisation de Firebase Admin...');

    // Initialiser Firebase Admin
    let app;
    if (getApps().length === 0) {
      // Utiliser la clé de service
      const serviceAccount = require('../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
    } else {
      app = getApps()[0];
    }

    const db = getFirestore(app);

    console.log('✅ Firebase Admin initialisé\n');

    // Récupérer tous les actes IRD_PRO
    console.log('📋 Récupération des actes IRD_PRO...');
    const actsSnapshot = await db.collection('acts')
      .where('contratType', '==', 'IRD_PRO')
      .get();

    console.log(`📊 ${actsSnapshot.size} acte(s) IRD_PRO trouvé(s)\n`);

    if (actsSnapshot.size === 0) {
      console.log('ℹ️  Aucun acte IRD_PRO à migrer.');
      return;
    }

    console.log('🔄 Recalcul des commissions...\n');

    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    for (const doc of actsSnapshot.docs) {
      try {
        const actData = doc.data();
        const actId = doc.id;
        const primeAnnuelle = actData.primeAnnuelle || 0;
        const ancienneCommission = actData.commissionPotentielle || 0;

        // Calculer la nouvelle commission
        const nouvelleCommission = calculateIRDProCommission(primeAnnuelle);

        // Comparer avec l'ancienne commission (tolérance de 0.01 € pour les arrondis)
        if (Math.abs(nouvelleCommission - ancienneCommission) < 0.01) {
          console.log(`⚪ ${actId}: Commission inchangée (${ancienneCommission.toFixed(2)} €)`);
          unchanged++;
          continue;
        }

        // Mettre à jour la commission
        await doc.ref.update({
          commissionPotentielle: nouvelleCommission,
        });

        console.log(`✅ ${actId}: ${ancienneCommission.toFixed(2)} € → ${nouvelleCommission.toFixed(2)} € (Prime: ${primeAnnuelle} €)`);
        updated++;

      } catch (error) {
        console.error(`❌ Erreur pour l'acte ${doc.id}:`, error);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Résumé de la migration:');
    console.log(`   ✅ Mis à jour: ${updated}`);
    console.log(`   ⚪ Inchangés: ${unchanged}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log('='.repeat(50) + '\n');

    if (errors === 0) {
      console.log('🎉 Migration terminée avec succès !');
    } else {
      console.log(`⚠️  Migration terminée avec ${errors} erreur(s).`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter le script
migrateIRDProCommissions();

