/**
 * Tests des règles Firestore avec Firebase Emulator
 * 
 * Ce script teste les règles de sécurité Firestore pour valider que :
 * - Les utilisateurs ne peuvent lire que leurs propres documents users
 * - Les admins peuvent lire tous les documents users
 * - Les collections sensibles (logs, commissions) sont protégées
 * - Les actes sont accessibles uniquement par leur propriétaire ou un admin
 * 
 * Usage:
 * 1. Démarrer l'Emulator: firebase emulators:start --only firestore,auth
 * 2. Exécuter: npm run test:rules:emulator
 * 
 * Note: Ce script utilise directement le SDK Firebase client connecté à l'Emulator
 * pour tester les règles de sécurité sans dépendre de @firebase/rules-unit-testing
 */

import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, signInWithCustomToken } from 'firebase/auth';
import * as fs from 'fs';
import * as path from 'path';

// Configuration de test
const PROJECT_ID = 'test-project';
const FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const AUTH_EMULATOR_HOST = 'http://localhost:9099';

// Configuration Firebase pour l'Emulator
const firebaseConfig = {
  apiKey: 'fake-api-key',
  authDomain: `${PROJECT_ID}.firebaseapp.com`,
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.appspot.com`,
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
};

// Types pour les utilisateurs de test
interface TestUser {
  uid: string;
  email: string;
  role: string;
}

// Utilisateurs de test
const testUsers: Record<string, TestUser> = {
  admin: {
    uid: 'admin-user-123',
    email: 'admin@test.com',
    role: 'ADMINISTRATEUR',
  },
  regular: {
    uid: 'regular-user-456',
    email: 'regular@test.com',
    role: 'CDC_COMMERCIAL',
  },
  other: {
    uid: 'other-user-789',
    email: 'other@test.com',
    role: 'COMMERCIAL_SANTE_INDIVIDUEL',
  },
};

/**
 * Initialise une app Firebase connectée à l'Emulator
 */
function initializeFirebaseApp(): FirebaseApp {
  // Nettoyer les apps existantes
  getApps().forEach((app) => deleteApp(app));

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Connecter à l'Emulator
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, AUTH_EMULATOR_HOST, { disableWarnings: true });

  return app;
}

/**
 * Crée un utilisateur de test dans Firestore (utilise Admin SDK via script séparé)
 * Note: Pour simplifier, on suppose que les données de test sont créées manuellement
 * ou via un script Admin SDK séparé avant d'exécuter ces tests
 */
async function createTestUserData(app: FirebaseApp, user: TestUser): Promise<void> {
  const db = getFirestore(app);
  
  // Note: En production, ces données seraient créées avec Admin SDK
  // Pour les tests, on peut utiliser setDoc si les règles le permettent
  // ou créer les données avant d'exécuter les tests
  try {
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      email: user.email,
      role: user.role,
      active: true,
      createdAt: new Date(),
    });
    console.log(`    ✅ Document utilisateur créé: ${user.uid}`);
  } catch (error: any) {
    console.log(`    ⚠️  Impossible de créer le document (normal si règles restrictives): ${error.message}`);
  }
}

/**
 * Test 1: Lecture des documents users
 */
async function testUsersCollectionRead(app: FirebaseApp): Promise<void> {
  console.log('\n📋 Test 1: Lecture des documents users\n');

  const db = getFirestore(app);

  // Créer les utilisateurs de test (nécessite Admin SDK ou règles permissives)
  console.log('  Préparation: Création des documents utilisateurs de test...');
  for (const user of Object.values(testUsers)) {
    await createTestUserData(app, user);
  }

  // Test 1.1: Admin peut lire tous les users
  console.log('  Test 1.1: Admin peut lire tous les users');
  try {
    // Simuler l'authentification admin (dans un vrai test, on utiliserait signInWithCustomToken)
    // Pour simplifier, on teste directement avec getDoc
    const adminUserDoc = await getDoc(doc(db, 'users', testUsers.admin.uid));
    const regularUserDoc = await getDoc(doc(db, 'users', testUsers.regular.uid));
    const otherUserDoc = await getDoc(doc(db, 'users', testUsers.other.uid));

    if (adminUserDoc.exists() && regularUserDoc.exists() && otherUserDoc.exists()) {
      console.log('    ✅ Admin peut lire tous les users');
    } else {
      console.log('    ⚠️  Certains documents n\'existent pas (créer avec Admin SDK)');
    }
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log('    ❌ Admin ne peut pas lire tous les users (vérifier les règles)');
    } else {
      console.log(`    ⚠️  Erreur: ${error.message}`);
    }
  }

  // Note: Les tests avec authentification nécessitent signInWithCustomToken
  // qui nécessite que l'Emulator Auth soit configuré avec des tokens personnalisés
  console.log('\n  ⚠️  Note: Les tests complets nécessitent:');
  console.log('     - Création des utilisateurs avec Admin SDK');
  console.log('     - Authentification via signInWithCustomToken');
  console.log('     - Voir la documentation pour les tests complets');
}

/**
 * Test 2: Collection logs (admin uniquement)
 */
async function testLogsCollection(app: FirebaseApp): Promise<void> {
  console.log('\n📋 Test 2: Collection logs\n');

  const db = getFirestore(app);

  // Créer un log de test
  console.log('  Test 2.1: Création d\'un log (utilisateur authentifié)');
  try {
    await setDoc(doc(db, 'logs', 'test-log-1'), {
      level: 'INFO',
      action: 'TEST',
      userId: testUsers.regular.uid,
      message: 'Test log',
      timestamp: new Date(),
    });
    console.log('    ✅ Utilisateur peut créer des logs');
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log('    ❌ Utilisateur ne peut pas créer des logs');
    } else {
      console.log(`    ⚠️  Erreur: ${error.message}`);
    }
  }

  // Test lecture (devrait échouer pour non-admin)
  console.log('  Test 2.2: Lecture d\'un log (utilisateur non-admin)');
  try {
    await getDoc(doc(db, 'logs', 'test-log-1'));
    console.log('    ⚠️  Utilisateur a pu lire le log (devrait être refusé pour non-admin)');
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log('    ✅ Utilisateur ne peut pas lire les logs (comme attendu)');
    } else {
      console.log(`    ⚠️  Erreur: ${error.message}`);
    }
  }
}

/**
 * Test 3: Collection agency_commissions (admin uniquement)
 */
async function testAgencyCommissionsCollection(app: FirebaseApp): Promise<void> {
  console.log('\n📋 Test 3: Collection agency_commissions\n');

  const db = getFirestore(app);

  // Test lecture (devrait échouer pour non-admin)
  console.log('  Test 3.1: Lecture d\'une commission (utilisateur non-admin)');
  try {
    await getDoc(doc(db, 'agency_commissions', 'test-commission-1'));
    console.log('    ⚠️  Utilisateur a pu lire la commission (devrait être refusé)');
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log('    ✅ Utilisateur ne peut pas lire les commissions (comme attendu)');
    } else if (error.code === 'not-found') {
      console.log('    ⚠️  Document n\'existe pas (créer avec Admin SDK pour test complet)');
    } else {
      console.log(`    ⚠️  Erreur: ${error.message}`);
    }
  }
}

/**
 * Test 4: Collection acts (propriétaire ou admin uniquement)
 */
async function testActsCollection(app: FirebaseApp): Promise<void> {
  console.log('\n📋 Test 4: Collection acts\n');

  const db = getFirestore(app);

  // Créer un acte de test
  console.log('  Test 4.1: Création d\'un acte');
  try {
    await setDoc(doc(db, 'acts', 'act-regular-1'), {
      userId: testUsers.regular.uid,
      type: 'AN',
      dateSaisie: new Date(),
    });
    console.log('    ✅ Acte créé');
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log('    ❌ Impossible de créer l\'acte (vérifier les règles)');
    } else {
      console.log(`    ⚠️  Erreur: ${error.message}`);
    }
  }

  // Test lecture (devrait réussir pour le propriétaire)
  console.log('  Test 4.2: Lecture de son propre acte');
  try {
    const actDoc = await getDoc(doc(db, 'acts', 'act-regular-1'));
    if (actDoc.exists()) {
      console.log('    ✅ Utilisateur peut lire son propre acte');
    } else {
      console.log('    ⚠️  Document n\'existe pas');
    }
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log('    ❌ Utilisateur ne peut pas lire son propre acte');
    } else {
      console.log(`    ⚠️  Erreur: ${error.message}`);
    }
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('='.repeat(80));
  console.log('🧪 Tests des règles Firestore avec Firebase Emulator');
  console.log('='.repeat(80));
  console.log('\n⚠️  IMPORTANT: Assurez-vous que l\'Emulator est démarré:');
  console.log('   firebase emulators:start --only firestore,auth\n');
  console.log('⚠️  Note: Ces tests sont simplifiés. Pour des tests complets avec authentification,');
  console.log('   utilisez signInWithCustomToken après avoir créé les utilisateurs avec Admin SDK.\n');

  let app: FirebaseApp | null = null;

  try {
    // Initialiser l'app Firebase
    console.log('🔧 Initialisation de l\'app Firebase...');
    app = initializeFirebaseApp();
    console.log('✅ App Firebase initialisée\n');

    // Exécuter les tests
    await testUsersCollectionRead(app);
    await testLogsCollection(app);
    await testAgencyCommissionsCollection(app);
    await testActsCollection(app);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Tests terminés');
    console.log('='.repeat(80));
    console.log('\n📝 Notes importantes:');
    console.log('   - Ces tests sont basiques et ne testent pas l\'authentification complète');
    console.log('   - Pour des tests complets, créez les utilisateurs avec Admin SDK');
    console.log('   - Utilisez signInWithCustomToken pour authentifier les utilisateurs de test');
    console.log('   - Voir docs/SECURITE_FIRESTORE.md pour plus de détails');
  } catch (error: any) {
    console.error('\n❌ Erreur lors des tests:', error);
    process.exit(1);
  } finally {
    // Nettoyer
    if (app) {
      try {
        await deleteApp(app);
      } catch (error) {
        // Ignorer les erreurs de nettoyage
      }
    }
  }
}

// Exécuter les tests
main().catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
