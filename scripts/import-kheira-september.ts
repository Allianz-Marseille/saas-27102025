#!/usr/bin/env ts-node

/**
 * Script pour importer les actes de santé individuelle de Kheira pour septembre 2025
 * 
 * Ce script :
 * 1. Récupère l'ID utilisateur de Kheira via son email
 * 2. Importe les actes dans la collection health_acts avec dateSaisie = 01/09/2025
 * 3. Respecte les dates d'effet réelles de chaque acte
 * 
 * Usage: npm run import:kheira-sep
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
const DATE_SAISIE = new Date('2025-09-01T00:00:00'); // 1er septembre 2025
const MOIS_KEY = '2025-09'; // Septembre 2025

// Données des actes à importer
const ACTES_TO_IMPORT = [
  {
    kind: 'ADHESION_SALARIE',
    clientNom: 'Maurice Conjointe',
    numeroContrat: 'Pi13475ca020',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 894.96,
    compagnie: 'Allianz',
  },
  {
    kind: 'REVISION',
    clientNom: 'Verdollin',
    numeroContrat: '168460928',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 781.24,
    compagnie: 'Allianz',
  },
  {
    kind: 'REVISION',
    clientNom: 'Mme Yung Thavy',
    numeroContrat: '168179213',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 518.18,
    compagnie: 'Allianz',
  },
  {
    kind: 'AFFAIRE_NOUVELLE',
    clientNom: 'Du Cauze De Nazelle',
    numeroContrat: '168721806',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 2767.76,
    compagnie: 'Allianz',
  },
  {
    kind: 'REVISION',
    clientNom: 'Capasso',
    numeroContrat: '168525314',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 1852.72,
    compagnie: 'Allianz',
  },
  {
    kind: 'AFFAIRE_NOUVELLE',
    clientNom: 'Andre Theo',
    numeroContrat: '168722064',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 664.50,
    compagnie: 'Allianz',
  },
  {
    kind: 'REVISION',
    clientNom: 'Mme Puccini',
    numeroContrat: '168365531',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 1643.76,
    compagnie: 'Allianz',
  },
  {
    kind: 'REVISION',
    clientNom: 'Brouchery Florent',
    numeroContrat: '168425522',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 805.20,
    compagnie: 'Allianz',
  },
  {
    kind: 'AFFAIRE_NOUVELLE',
    clientNom: 'Guilabert Philippe',
    numeroContrat: '168722177',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 542.12,
    compagnie: 'Allianz',
  },
  {
    kind: 'ADHESION_SALARIE',
    clientNom: 'Gomtsyan',
    numeroContrat: 'Pia021lca001',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 1375.32,
    compagnie: 'Allianz',
  },
  {
    kind: 'AFFAIRE_NOUVELLE',
    clientNom: 'Sujet Francette',
    numeroContrat: '168725750',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 4530.84,
    compagnie: 'Allianz',
  },
  {
    kind: 'AFFAIRE_NOUVELLE',
    clientNom: 'Asseraf',
    numeroContrat: '168724425',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 1856.97,
    compagnie: 'Allianz',
  },
  {
    kind: 'AFFAIRE_NOUVELLE',
    clientNom: 'Faure Jaques',
    numeroContrat: '168723408',
    dateEffet: new Date('2025-10-01T00:00:00'),
    caAnnuel: 5188.52,
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
        if (acte.kind === 'AFFAIRE_NOUVELLE') {
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

        const kindLabel = acte.kind === 'AFFAIRE_NOUVELLE' ? 'AN' : acte.kind === 'REVISION' ? 'RÉV' : 'ADH';
        console.log(`✅ [${kindLabel}] ${acte.clientNom.padEnd(25)} | ${acte.numeroContrat.padEnd(13)} | ${acte.caAnnuel.toFixed(2).padStart(10)}€ → ${caPondere.toFixed(2).padStart(10)}€`);
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

