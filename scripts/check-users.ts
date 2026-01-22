#!/usr/bin/env ts-node

/**
 * Script pour vérifier la cohérence entre Firebase Auth et Firestore
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkUsers() {
  try {
    console.log('🔄 Initialisation...');

    let app;
    if (getApps().length === 0) {
      const serviceAccount = require('../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      app = getApps()[0];
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('✅ Firebase Admin initialisé\n');

    // Lister les utilisateurs Auth
    const authUsers = await auth.listUsers();
    
    console.log('📋 Vérification de la cohérence Auth <-> Firestore:\n');

    for (const authUser of authUsers.users) {
      const email = authUser.email || 'no-email';
      console.log(`\n👤 ${email}`);
      console.log(`   Auth UID: ${authUser.uid}`);
      
      // Vérifier si le document Firestore existe
      const userDoc = await db.collection('users').doc(authUser.uid).get();
      
      if (userDoc.exists) {
        const data = userDoc.data();
        console.log(`   ✅ Document Firestore existe`);
        console.log(`   📄 Role: ${data?.role}`);
        console.log(`   📄 Active: ${data?.active}`);
        console.log(`   📄 Email dans Firestore: ${data?.email}`);
      } else {
        console.log(`   ❌ Document Firestore MANQUANT !`);
      }
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkUsers();

