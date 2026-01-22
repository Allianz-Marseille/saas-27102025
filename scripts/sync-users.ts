#!/usr/bin/env ts-node

/**
 * Script pour synchroniser les utilisateurs Firebase Auth avec Firestore
 * 
 * Ce script :
 * 1. Liste tous les utilisateurs Firebase Auth
 * 2. Crée les documents correspondants dans Firestore (collection "users")
 * 3. Assigne les rôles selon l'email
 * 
 * Usage: npm run sync-users
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// Configuration Firebase Admin SDK
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // Pour utiliser l'authentification par service account
  // Vous devrez télécharger la clé de service depuis Firebase Console
};

// Mapping des utilisateurs et leurs rôles
const USER_ROLES: Record<string, 'ADMINISTRATEUR' | 'CDC_COMMERCIAL'> = {
  'jeanmichel@allianz-nogaro.fr': 'ADMINISTRATEUR',
  'julien@allianz-nogaro.fr': 'ADMINISTRATEUR', // Email réel dans Firebase Auth
  'julien.boetti@allianz-nogaro.fr': 'ADMINISTRATEUR',
  'gwendal.clouet@allianz-nogaro.fr': 'CDC_COMMERCIAL',
  'emma@allianz-nogaro.fr': 'CDC_COMMERCIAL',
  'joelle.abikaram@allianz-nogaro.fr': 'CDC_COMMERCIAL',
  'astrid.ulrich@allianz-nogaro.fr': 'CDC_COMMERCIAL',
  'corentin.ulrich@allianz-nogaro.fr': 'CDC_COMMERCIAL',
  'donia.sahraoui@allianz-nogaro.fr': 'CDC_COMMERCIAL',
};

async function syncUsers() {
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

    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('✅ Firebase Admin initialisé\n');

    // Lister tous les utilisateurs
    console.log('📋 Récupération de la liste des utilisateurs...');
    const listUsersResult = await auth.listUsers();
    const users = listUsersResult.users;

    console.log(`📊 ${users.length} utilisateur(s) trouvé(s)\n`);

    // Créer les documents dans Firestore
    console.log('📝 Création des documents dans Firestore...\n');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      const email = user.email || '';
      const role = USER_ROLES[email] || 'CDC_COMMERCIAL'; // Par défaut CDC

      if (!email) {
        console.log(`⚠️  Utilisateur sans email (UID: ${user.uid}) - Ignoré`);
        skipped++;
        continue;
      }

      const userRef = db.collection('users').doc(user.uid);
      const userDoc = await userRef.get();

      const userData = {
        id: user.uid,
        email: email,
        role: role,
        active: true,
        createdAt: user.metadata.creationTime ? Timestamp.fromDate(new Date(user.metadata.creationTime)) : Timestamp.now(),
      };

      if (userDoc.exists) {
        // Mettre à jour si existe déjà
        await userRef.update(userData);
        console.log(`✏️  Mis à jour: ${email} (${role})`);
        updated++;
      } else {
        // Créer nouveau document
        await userRef.set(userData);
        console.log(`✅ Créé: ${email} (${role})`);
        created++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Résumé:');
    console.log(`   ✅ Créés: ${created}`);
    console.log(`   ✏️  Mis à jour: ${updated}`);
    console.log(`   ⚠️  Ignorés: ${skipped}`);
    console.log('='.repeat(50) + '\n');

    console.log('🎉 Synchronisation terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    process.exit(1);
  }
}

// Exécuter le script
syncUsers();
