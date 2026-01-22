#!/usr/bin/env ts-node

/**
 * Script pour importer les actes de santé individuelle de Kheira pour novembre 2025
 * 
 * Ce script :
 * 1. Récupère l'ID utilisateur de Kheira via son email
 * 2. Importe les actes dans la collection health_acts avec dateSaisie = 01/11/2025
 * 3. Respecte les dates d'effet réelles de chaque acte
 * 
 * Usage: npm run import:kheira-nov
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// Configuration Firebase Admin SDK
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// ============================================================================
// CONFIGURATION - Modifier ces valeurs pour les autres mois
// ============================================================================

const KHEIRA_EMAIL = 'kheira.bagnasco@allianz-nogaro.fr';
const DATE_SAISIE = new Date('2025-11-01T00:00:00'); // 1er novembre 2025
const MOIS_KEY = '2025-11'; // Novembre 2025

// Données des actes à importer
const ACTES_TO_IMPORT = [
  {
    kind: 'AFFAIRE_NOUVELLE',
    clientNom: 'Molina',
    numeroContrat: '168731909',
    dateEffet: new Date('2025-12-01T00:00:00'),
    caAnnuel: 1832.36,
    compagnie: 'Allianz',
  },
  {
    kind: 'REVISION',
    clientNom: 'M Theret P.Henri',
    numeroContrat: '168598915',
    dateEffet: new Date('2025-12-01T00:00:00'),
    caAnnuel: 725.62,
    compagnie: 'Allianz',
  },
  {
    kind: 'REVISION',
    clientNom: 'Felgueiras Mickael',
    numeroContrat: '106095992',
    dateEffet: new Date('2025-12-01T00:00:00'),
    caAnnuel: 6340.20,
    compagnie: 'Allianz',
  },
  {
    kind: 'REVISION',
    clientNom: 'Hayoun Ambrine',
    numeroContrat: '168529683',
    dateEffet: new Date('2025-12-01T00:00:00'),
    caAnnuel: 859.12,
    compagnie: 'Allianz',
  },
  {
    kind: 'REVISION',
    clientNom: 'Camille Malliopoulos',
    numeroContrat: '168670936',
    dateEffet: new Date('2025-12-01T00:00:00'),
    caAnnuel: 609.51,
    compagnie: 'Allianz',
  },
  {
    kind: 'AFFAIRE_NOUVELLE',
    clientNom: 'Lombardo Beatrice',
    numeroContrat: '????',
    dateEffet: new Date('2025-12-19T00:00:00'),
    caAnnuel: 1102.68,
    compagnie: 'Allianz',
  },
  {
    kind: 'REVISION',
    clientNom: 'Duc Sebastien',
    numeroContrat: '168187734',
    dateEffet: new Date('2025-12-01T00:00:00'),
    caAnnuel: 1232.93,
    compagnie: 'Allianz',
  },
];

// ============================================================================
// COEFFICIENTS (Ne pas modifier - correspond à la logique métier)
// ============================================================================

const HEALTH_ACT_COEFFICIENTS: Record<string, number> = {
  AFFAIRE_NOUVELLE: 1.0,
  REVISION: 0.5,
  ADHESION_SALARIE: 0.5,
  COURT_TO_AZ: 0.75,
  AZ_TO_COURTAGE: 0.5,
};

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

async function importKheiraActs() {
  try {
    console.log('🔄 Initialisation de Firebase Admin...');

    // Initialiser Firebase Admin
    let app;
    if (getApps().length === 0) {
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

    // 1. Récupérer l'ID de Kheira
    console.log(`🔍 Recherche de l'utilisateur: ${KHEIRA_EMAIL}...`);
    const usersSnapshot = await db.collection('users').where('email', '==', KHEIRA_EMAIL).get();
    
    if (usersSnapshot.empty) {
      throw new Error(`❌ Utilisateur ${KHEIRA_EMAIL} non trouvé dans la base de données`);
    }

    const kheiraUser = usersSnapshot.docs[0];
    const kheiraId = kheiraUser.id;
    const kheiraData = kheiraUser.data();
    
    console.log(`✅ Utilisateur trouvé: ${kheiraData.email} (${kheiraData.role})`);
    console.log(`   ID: ${kheiraId}\n`);

    // 2. Importer les actes
    console.log(`📝 Import de ${ACTES_TO_IMPORT.length} actes pour ${MOIS_KEY}...\n`);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const acte of ACTES_TO_IMPORT) {
      try {
        // Vérifier si le numéro de contrat existe déjà (uniquement pour AFFAIRE_NOUVELLE)
        if (acte.kind === 'AFFAIRE_NOUVELLE' && acte.numeroContrat !== '????') {
          const existingActs = await db.collection('health_acts')
            .where('numeroContrat', '==', acte.numeroContrat)
            .get();
          
          if (!existingActs.empty) {
            console.log(`⚠️  SAUTÉ: ${acte.clientNom} - Numéro ${acte.numeroContrat} déjà existant`);
            skipped++;
            continue;
          }
        }

        // Calculer le CA pondéré
        const coefficient = HEALTH_ACT_COEFFICIENTS[acte.kind] || 1.0;
        const caPondere = Math.round(acte.caAnnuel * coefficient);

        // Créer l'acte
        const actData = {
          userId: kheiraId,
          kind: acte.kind,
          clientNom: acte.clientNom,
          numeroContrat: acte.numeroContrat,
          compagnie: acte.compagnie,
          dateEffet: Timestamp.fromDate(acte.dateEffet),
          dateSaisie: Timestamp.fromDate(DATE_SAISIE),
          caAnnuel: acte.caAnnuel,
          coefficient,
          caPondere,
          moisKey: MOIS_KEY,
        };

        await db.collection('health_acts').add(actData);

        const kindLabel = acte.kind === 'AFFAIRE_NOUVELLE' ? 'AN' : 'RÉV';
        console.log(`✅ [${kindLabel}] ${acte.clientNom.padEnd(25)} | ${acte.numeroContrat.padEnd(12)} | ${acte.caAnnuel.toFixed(2).padStart(10)}€ → ${caPondere.toFixed(2).padStart(10)}€`);
        imported++;

      } catch (error: any) {
        console.error(`❌ Erreur pour ${acte.clientNom}:`, error.message);
        errors++;
      }
    }

    // 3. Résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 Résumé de l\'import:');
    console.log(`   ✅ Actes importés: ${imported}`);
    console.log(`   ⚠️  Actes sautés (doublons): ${skipped}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log(`   📅 Date de saisie: ${DATE_SAISIE.toLocaleDateString('fr-FR')}`);
    console.log(`   📆 Mois clé: ${MOIS_KEY}`);
    console.log('='.repeat(80) + '\n');

    if (imported > 0) {
      const totalCA = ACTES_TO_IMPORT.reduce((sum, acte) => sum + acte.caAnnuel, 0);
      const totalCAPondere = ACTES_TO_IMPORT.reduce((sum, acte) => {
        const coeff = HEALTH_ACT_COEFFICIENTS[acte.kind] || 1.0;
        return sum + Math.round(acte.caAnnuel * coeff);
      }, 0);
      
      console.log('💰 Totaux:');
      console.log(`   CA Total: ${totalCA.toFixed(2)}€`);
      console.log(`   CA Pondéré: ${totalCAPondere.toFixed(2)}€\n`);
    }

    console.log('🎉 Import terminé !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import des actes:', error);
    process.exit(1);
  }
}

// Exécuter le script
importKheiraActs();

