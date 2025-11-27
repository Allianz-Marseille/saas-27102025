import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialiser Firebase Admin
const serviceAccount = require('../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

interface ActInfo {
  id: string;
  client: string;
  date: Date;
  userId: string;
}

async function checkDuplicateContracts() {
  console.log('🔍 Vérification des doublons dans les AN...\n');

  try {
    // Récupérer uniquement les actes de type "AN"
    const actsSnapshot = await db.collection('acts').where('kind', '==', 'AN').get();
    
    console.log(`📊 Total actes AN trouvés : ${actsSnapshot.size}\n`);
    
    // Map pour grouper par numéro de contrat (insensible à la casse)
    const contractMap = new Map<string, ActInfo[]>();
    
    actsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      // Normaliser le numéro de contrat (minuscules, trim)
      const numero = data.numeroContrat?.trim().toLowerCase();
      
      // Ignorer les valeurs vides ou "-"
      if (!numero || numero === '-') {
        return;
      }
      
      const actInfo: ActInfo = {
        id: doc.id,
        client: data.clientNom,
        date: data.dateSaisie.toDate(),
        userId: data.userId,
      };
      
      if (!contractMap.has(numero)) {
        contractMap.set(numero, []);
      }
      contractMap.get(numero)!.push(actInfo);
    });
    
    // Trouver les doublons
    const duplicates = Array.from(contractMap.entries()).filter(([_, acts]) => acts.length > 1);
    
    // Afficher les résultats
    if (duplicates.length === 0) {
      console.log('✅ Aucun doublon trouvé ! Tous les numéros de contrat AN sont uniques.\n');
    } else {
      console.log(`❌ ${duplicates.length} numéro(s) de contrat en doublon trouvé(s) :\n`);
      
      duplicates.forEach(([numero, acts], index) => {
        console.log(`${index + 1}. 📄 Contrat "${numero.toUpperCase()}" (${acts.length} occurrences)`);
        acts.forEach((act, i) => {
          const date = act.date.toLocaleDateString('fr-FR');
          console.log(`   ${i + 1}) ID: ${act.id}`);
          console.log(`      Client: ${act.client}`);
          console.log(`      Date: ${date}`);
        });
        console.log('');
      });
      
      console.log(`\n📊 Statistiques:`);
      console.log(`   Total actes AN: ${actsSnapshot.size}`);
      console.log(`   Numéros uniques: ${contractMap.size}`);
      console.log(`   Numéros en doublon: ${duplicates.length}`);
      console.log(`   Total actes dupliqués: ${duplicates.reduce((sum, d) => sum + d[1].length, 0)}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    throw error;
  }
}

// Exécuter
checkDuplicateContracts()
  .then(() => {
    console.log('\n✅ Vérification terminée.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });






