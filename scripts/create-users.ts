#!/usr/bin/env ts-node

/**
 * Script pour créer les utilisateurs dans Firebase Auth et Firestore
 * 
 * Ce script :
 * 1. Crée les utilisateurs dans Firebase Authentication (si ils n'existent pas)
 * 2. Crée automatiquement leurs documents dans Firestore
 * 
 * Usage: npm run create-users
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
};

// Liste des utilisateurs à créer avec leurs mots de passe et rôles
const USERS_TO_CREATE = [
  {
    email: 'jeanmichel@allianz-nogaro.fr',
    password: 'PaulEmma2025@',
    role: 'ADMINISTRATEUR' as const,
  },
  {
    email: 'julien@allianz-nogaro.fr',
    password: 'Allianz2025@',
    role: 'ADMINISTRATEUR' as const,
  },
  {
    email: 'julien.boetti@allianz-nogaro.fr',
    password: 'Allianz2025@',
    role: 'ADMINISTRATEUR' as const,
  },
  {
    email: 'gwendal.clouet@allianz-nogaro.fr',
    password: 'Allianz2025@',
    role: 'CDC_COMMERCIAL' as const,
  },
  {
    email: 'emma@allianz-nogaro.fr',
    password: 'Allianz2025@',
    role: 'CDC_COMMERCIAL' as const,
  },
  {
    email: 'joelle.abikaram@allianz-nogaro.fr',
    password: 'Allianz2025@',
    role: 'CDC_COMMERCIAL' as const,
  },
  {
    email: 'astrid.ulrich@allianz-nogaro.fr',
    password: 'Allianz2025@',
    role: 'CDC_COMMERCIAL' as const,
  },
  {
    email: 'corentin.ulrich@allianz-nogaro.fr',
    password: 'Allianz2025@',
    role: 'CDC_COMMERCIAL' as const,
  },
  {
    email: 'donia.sahraoui@allianz-nogaro.fr',
    password: 'Allianz2025@',
    role: 'CDC_COMMERCIAL' as const,
  },
];

async function createUsers() {
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

    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('✅ Firebase Admin initialisé\n');
    console.log('📝 Création/Synchronisation des utilisateurs...\n');

    let created = 0;
    let alreadyExists = 0;
    let errors = 0;

    for (const userData of USERS_TO_CREATE) {
      try {
        // Vérifier si l'utilisateur existe déjà
        let user;
        try {
          user = await auth.getUserByEmail(userData.email);
          console.log(`ℹ️  L'utilisateur ${userData.email} existe déjà dans Auth`);
          alreadyExists++;
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            // Créer l'utilisateur dans Firebase Auth
            user = await auth.createUser({
              email: userData.email,
              password: userData.password,
              emailVerified: false,
            });
            console.log(`✅ Utilisateur créé dans Auth: ${userData.email}`);
            created++;
          } else {
            throw error;
          }
        }

        // Créer ou mettre à jour le document dans Firestore
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
          // Mettre à jour
          await userRef.update({
            email: userData.email,
            role: userData.role,
            active: true,
          });
          console.log(`   ✏️  Document Firestore mis à jour (${userData.role})`);
        } else {
          // Créer
          await userRef.set({
            id: user.uid,
            email: userData.email,
            role: userData.role,
            active: true,
            createdAt: Timestamp.now(),
          });
          console.log(`   📄 Document Firestore créé (${userData.role})`);
        }

      } catch (error: any) {
        console.error(`❌ Erreur pour ${userData.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Résumé:');
    console.log(`   ✅ Créés dans Auth: ${created}`);
    console.log(`   ℹ️  Existaient déjà dans Auth: ${alreadyExists}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log('='.repeat(60) + '\n');

    if (created > 0) {
      console.log('⚠️  IMPORTANT: Mots de passe par défaut utilisés !');
      console.log('   Changez vos mots de passe après la première connexion.\n');
    }

    console.log('🎉 Synchronisation terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error);
    process.exit(1);
  }
}

// Exécuter le script
createUsers();

