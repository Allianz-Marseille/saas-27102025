#!/usr/bin/env ts-node

/**
 * Script pour vérifier et corriger le document utilisateur de Kheira dans Firestore
 * Assure que le document existe avec le bon rôle COMMERCIAL_SANTE_INDIVIDUEL
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const KHEIRA_EMAIL = 'kheira.bagnasco@allianz-nogaro.fr';
const CORRECT_ROLE = 'COMMERCIAL_SANTE_INDIVIDUEL';

async function fixKheiraUser() {
  try {
    console.log('🔄 Initialisation de Firebase Admin...');

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
    console.log(`🔍 Recherche de l'utilisateur: ${KHEIRA_EMAIL}\n`);

    // 1. Trouver l'utilisateur dans Firebase Auth
    let authUser;
    try {
      authUser = await auth.getUserByEmail(KHEIRA_EMAIL);
      console.log(`✅ Utilisateur trouvé dans Firebase Auth`);
      console.log(`   UID: ${authUser.uid}`);
      console.log(`   Email: ${authUser.email}`);
      console.log(`   Email vérifié: ${authUser.emailVerified ? 'Oui' : 'Non'}\n`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.error(`❌ ERREUR: L'utilisateur ${KHEIRA_EMAIL} n'existe pas dans Firebase Auth !`);
        console.error('   Vous devez d\'abord créer l\'utilisateur dans Firebase Auth.\n');
        process.exit(1);
      } else {
        throw error;
      }
    }

    // 2. Vérifier le document Firestore
    const userRef = db.collection('users').doc(authUser.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log('⚠️  Document Firestore MANQUANT !');
      console.log('   Création du document avec le bon rôle...\n');
      
      await userRef.set({
        id: authUser.uid,
        email: KHEIRA_EMAIL,
        role: CORRECT_ROLE,
        active: true,
        createdAt: Timestamp.now(),
      });

      console.log('✅ Document Firestore créé avec succès !');
      console.log(`   Role: ${CORRECT_ROLE}`);
      console.log(`   Active: true\n`);
    } else {
      const userData = userDoc.data();
      console.log('✅ Document Firestore existe');
      console.log(`   Role actuel: ${userData?.role || 'NON DÉFINI'}`);
      console.log(`   Active: ${userData?.active !== false ? 'true' : 'false'}`);
      console.log(`   Email: ${userData?.email || 'NON DÉFINI'}\n`);

      // Vérifier si le rôle est correct
      if (userData?.role !== CORRECT_ROLE) {
        console.log(`⚠️  Le rôle est incorrect (${userData?.role} au lieu de ${CORRECT_ROLE})`);
        console.log('   Mise à jour du rôle...\n');

        await userRef.update({
          role: CORRECT_ROLE,
          active: true, // S'assurer que active est true
        });

        console.log('✅ Rôle mis à jour avec succès !');
        console.log(`   Nouveau role: ${CORRECT_ROLE}\n`);
      } else {
        console.log('✅ Le rôle est déjà correct !');
        
        // Vérifier si active est true
        if (userData?.active === false) {
          console.log('⚠️  Le champ active est false, mise à jour...\n');
          await userRef.update({ active: true });
          console.log('✅ Champ active mis à jour à true\n');
        }
      }
    }

    // 3. Vérification finale
    console.log('🔍 Vérification finale...\n');
    const finalDoc = await userRef.get();
    const finalData = finalDoc.data();

    if (finalData?.role === CORRECT_ROLE && finalData?.active !== false) {
      console.log('✅ TOUT EST CORRECT !');
      console.log(`   ✅ Document existe: Oui`);
      console.log(`   ✅ Role: ${finalData.role}`);
      console.log(`   ✅ Active: ${finalData.active !== false ? 'true' : 'false'}`);
      console.log(`   ✅ Email: ${finalData.email}\n`);
      console.log('🎉 Kheira peut maintenant créer des actes santé individuelle !\n');
    } else {
      console.error('❌ ERREUR: La vérification finale a échoué !');
      console.error(`   Role: ${finalData?.role} (attendu: ${CORRECT_ROLE})`);
      console.error(`   Active: ${finalData?.active}\n`);
      process.exit(1);
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de la correction:', error);
    if (error.code) {
      console.error(`   Code d'erreur: ${error.code}`);
    }
    if (error.message) {
      console.error(`   Message: ${error.message}`);
    }
    process.exit(1);
  }
}

// Exécuter le script
fixKheiraUser();

