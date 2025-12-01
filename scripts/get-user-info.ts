#!/usr/bin/env ts-node

/**
 * Script pour récupérer toutes les informations sur un utilisateur spécifique
 * Usage: npx ts-node scripts/get-user-info.ts <userId>
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const USER_ID = process.argv[2] || 'GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2';

async function getUserInfo() {
  try {
    console.log('🔄 Initialisation Firebase Admin...\n');

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
    console.log('='.repeat(80));
    console.log(`📋 INFORMATIONS UTILISATEUR: ${USER_ID}`);
    console.log('='.repeat(80) + '\n');

    // 1. Informations Firebase Auth
    console.log('🔐 FIREBASE AUTH:');
    console.log('-'.repeat(80));
    try {
      const authUser = await auth.getUser(USER_ID);
      console.log(`   UID: ${authUser.uid}`);
      console.log(`   Email: ${authUser.email || 'N/A'}`);
      console.log(`   Email vérifié: ${authUser.emailVerified ? 'Oui' : 'Non'}`);
      console.log(`   Créé le: ${authUser.metadata.creationTime}`);
      console.log(`   Dernière connexion: ${authUser.metadata.lastSignInTime || 'Jamais'}`);
      console.log(`   Désactivé: ${authUser.disabled ? 'Oui' : 'Non'}`);
    } catch (error: any) {
      console.log(`   ❌ Utilisateur non trouvé dans Firebase Auth: ${error.message}`);
    }
    console.log('');

    // 2. Informations Firestore (users collection)
    console.log('📄 FIRESTORE (users):');
    console.log('-'.repeat(80));
    const userDoc = await db.collection('users').doc(USER_ID).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`   ✅ Document existe`);
      console.log(`   Email: ${userData?.email || 'N/A'}`);
      console.log(`   Role: ${userData?.role || 'N/A'}`);
      console.log(`   Active: ${userData?.active ? 'Oui' : 'Non'}`);
      console.log(`   ID: ${userData?.id || 'N/A'}`);
      if (userData?.createdAt) {
        const createdAt = userData.createdAt.toDate ? userData.createdAt.toDate() : userData.createdAt;
        console.log(`   Créé le: ${createdAt}`);
      }
    } else {
      console.log(`   ❌ Document Firestore n'existe pas`);
    }
    console.log('');

    // 3. Actes créés par cet utilisateur
    console.log('📝 ACTES (acts collection):');
    console.log('-'.repeat(80));
    const actsSnapshot = await db.collection('acts')
      .where('userId', '==', USER_ID)
      .get();
    
    // Trier en mémoire par dateSaisie (desc)
    const actsArray = actsSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
      };
    }).sort((a: any, b: any) => {
      const dateA = a.dateSaisie?.toDate ? a.dateSaisie.toDate().getTime() : 0;
      const dateB = b.dateSaisie?.toDate ? b.dateSaisie.toDate().getTime() : 0;
      return dateB - dateA;
    });
    
    console.log(`   Total actes trouvés: ${actsArray.length}`);
    
    if (actsArray.length > 0) {
      const actsByKind: Record<string, number> = {};
      const actsByMonth: Record<string, number> = {};
      
      actsArray.forEach((act) => {
        const kind = act.kind || 'N/A';
        const monthKey = act.moisKey || 'N/A';
        
        actsByKind[kind] = (actsByKind[kind] || 0) + 1;
        actsByMonth[monthKey] = (actsByMonth[monthKey] || 0) + 1;
      });
      
      console.log(`   Répartition par type:`);
      Object.entries(actsByKind).forEach(([kind, count]) => {
        console.log(`     - ${kind}: ${count}`);
      });
      
      console.log(`   Répartition par mois (5 derniers):`);
      Object.entries(actsByMonth)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 5)
        .forEach(([month, count]) => {
          console.log(`     - ${month}: ${count} acte(s)`);
        });
      
      // Afficher les 5 derniers actes
      console.log(`   \n   5 derniers actes:`);
      actsArray.slice(0, 5).forEach((act, index) => {
        const dateSaisie = act.dateSaisie?.toDate ? act.dateSaisie.toDate() : act.dateSaisie;
        console.log(`     ${index + 1}. [${act.kind}] ${act.clientNom || 'N/A'} - ${dateSaisie ? dateSaisie.toLocaleDateString('fr-FR') : 'N/A'}`);
      });
    }
    console.log('');

    // 4. Actes santé créés par cet utilisateur
    console.log('🏥 ACTES SANTÉ (health_acts collection):');
    console.log('-'.repeat(80));
    const healthActsSnapshot = await db.collection('health_acts')
      .where('userId', '==', USER_ID)
      .get();
    
    // Trier en mémoire par dateSaisie (desc)
    const healthActsArray = healthActsSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
      };
    }).sort((a: any, b: any) => {
      const dateA = a.dateSaisie?.toDate ? a.dateSaisie.toDate().getTime() : 0;
      const dateB = b.dateSaisie?.toDate ? b.dateSaisie.toDate().getTime() : 0;
      return dateB - dateA;
    });
    
    console.log(`   Total actes santé trouvés: ${healthActsArray.length}`);
    
    if (healthActsArray.length > 0) {
      const actsByKind: Record<string, number> = {};
      
      healthActsArray.forEach((act) => {
        const kind = act.kind || 'N/A';
        actsByKind[kind] = (actsByKind[kind] || 0) + 1;
      });
      
      console.log(`   Répartition par type:`);
      Object.entries(actsByKind).forEach(([kind, count]) => {
        console.log(`     - ${kind}: ${count}`);
      });
    }
    console.log('');

    // 5. Logs de cet utilisateur
    console.log('📊 LOGS (logs collection):');
    console.log('-'.repeat(80));
    const logsSnapshot = await db.collection('logs')
      .where('userId', '==', USER_ID)
      .get();
    
    // Trier en mémoire par timestamp (desc) et limiter à 20
    const logsArray = logsSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
      };
    }).sort((a: any, b: any) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
      return timeB - timeA;
    }).slice(0, 20);
    
    console.log(`   Total logs trouvés: ${logsSnapshot.size} (affichage des 20 plus récents)`);
    
    if (logsArray.length > 0) {
      const logsByAction: Record<string, number> = {};
      
      logsArray.forEach((log) => {
        const action = log.action || 'N/A';
        logsByAction[action] = (logsByAction[action] || 0) + 1;
      });
      
      console.log(`   Répartition par action (sur les 20 plus récents):`);
      Object.entries(logsByAction).forEach(([action, count]) => {
        console.log(`     - ${action}: ${count}`);
      });
      
      // Afficher les 5 derniers logs
      console.log(`   \n   5 derniers logs:`);
      logsArray.slice(0, 5).forEach((log, index) => {
        const timestamp = log.timestamp?.toDate ? log.timestamp.toDate() : log.timestamp;
        console.log(`     ${index + 1}. [${log.action}] ${log.message || 'N/A'} - ${timestamp ? timestamp.toLocaleString('fr-FR') : 'N/A'}`);
      });
    }
    console.log('');

    // 6. Leaderboard stats
    console.log('🏆 LEADERBOARD (leaderboard collection):');
    console.log('-'.repeat(80));
    const leaderboardSnapshot = await db.collection('leaderboard')
      .where('userId', '==', USER_ID)
      .get();
    
    // Trier en mémoire par monthKey (desc) et limiter à 12
    const leaderboardArray = leaderboardSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
      };
    }).sort((a: any, b: any) => {
      return (b.monthKey || '').localeCompare(a.monthKey || '');
    }).slice(0, 12);
    
    console.log(`   Total entrées leaderboard: ${leaderboardSnapshot.size} (affichage des 12 derniers mois)`);
    
    if (leaderboardArray.length > 0) {
      console.log(`   Stats par mois (12 derniers):`);
      leaderboardArray.forEach((data) => {
        console.log(`     - ${data.monthKey}:`);
        console.log(`       CA: ${data.ca || 0} €`);
        console.log(`       Commissions: ${data.commissions || 0} €`);
        console.log(`       Actes: ${data.actsCount || 0}`);
        console.log(`       Process: ${data.process || 0}`);
      });
    }
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ Analyse terminée');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

getUserInfo();

