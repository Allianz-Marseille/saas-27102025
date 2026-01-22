/**
 * Script d'import des commissions 2023 vers Firestore
 * Usage: npm run import:commissions-2023
 */

import * as admin from 'firebase-admin';

// Initialiser Firebase Admin
const serviceAccount = require('../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Données 2023 (12 mois)
const data2023 = [
  { month: 1, commissionsIARD: 50747, commissionsVie: 4298, commissionsCourtage: 3523, profitsExceptionnels: 0, chargesAgence: 31442, prelevementsJulien: 22000, prelevementsJeanMichel: 22000 },
  { month: 2, commissionsIARD: 62205, commissionsVie: 27998, commissionsCourtage: 5412, profitsExceptionnels: 0, chargesAgence: 45490, prelevementsJulien: 22000, prelevementsJeanMichel: 22000 },
  { month: 3, commissionsIARD: 52309, commissionsVie: 2533, commissionsCourtage: 5444, profitsExceptionnels: 0, chargesAgence: 41445, prelevementsJulien: 12000, prelevementsJeanMichel: 12000 },
  { month: 4, commissionsIARD: 55232, commissionsVie: 12705, commissionsCourtage: 7049, profitsExceptionnels: 0, chargesAgence: 38560, prelevementsJulien: 10000, prelevementsJeanMichel: 10000 },
  { month: 5, commissionsIARD: 52594, commissionsVie: 9904, commissionsCourtage: 4007, profitsExceptionnels: 0, chargesAgence: 49492, prelevementsJulien: 12500, prelevementsJeanMichel: 12500 },
  { month: 6, commissionsIARD: 52029, commissionsVie: 4588, commissionsCourtage: 6717, profitsExceptionnels: 0, chargesAgence: 37779, prelevementsJulien: 10000, prelevementsJeanMichel: 10000 },
  { month: 7, commissionsIARD: 75777, commissionsVie: 4519, commissionsCourtage: 5964, profitsExceptionnels: 0, chargesAgence: 51224, prelevementsJulien: 12500, prelevementsJeanMichel: 12500 },
  { month: 8, commissionsIARD: 55400, commissionsVie: 8401, commissionsCourtage: 6168, profitsExceptionnels: 0, chargesAgence: 49519, prelevementsJulien: 20000, prelevementsJeanMichel: 20000 },
  { month: 9, commissionsIARD: 56408, commissionsVie: 3146, commissionsCourtage: 5569, profitsExceptionnels: 0, chargesAgence: 41293, prelevementsJulien: 10000, prelevementsJeanMichel: 10000 },
  { month: 10, commissionsIARD: 55409, commissionsVie: 3371, commissionsCourtage: 4727, profitsExceptionnels: 0, chargesAgence: 44010, prelevementsJulien: 14000, prelevementsJeanMichel: 14000 },
  { month: 11, commissionsIARD: 59763, commissionsVie: 9642, commissionsCourtage: 4963, profitsExceptionnels: 0, chargesAgence: 34293, prelevementsJulien: 14000, prelevementsJeanMichel: 14000 },
  { month: 12, commissionsIARD: 52203, commissionsVie: 2885, commissionsCourtage: 5558, profitsExceptionnels: 0, chargesAgence: 62724, prelevementsJulien: 14000, prelevementsJeanMichel: 14000 },
].map((m) => ({ year: 2023, ...m }));

// Fonction de calcul des totaux
function calculateTotals(record: any) {
  const totalCommissions = 
    record.commissionsIARD +
    record.commissionsVie +
    record.commissionsCourtage +
    record.profitsExceptionnels;
  
  const resultat = totalCommissions - record.chargesAgence;

  return {
    totalCommissions,
    resultat,
  };
}

async function importData() {
  console.log('🚀 Début de l\'import des commissions 2023...\n');

  const adminUserId = 'IMPORT_SCRIPT_2023';

  let importedCount = 0;
  let skippedCount = 0;

  for (const record of data2023) {
    const { totalCommissions, resultat } = calculateTotals(record);

    try {
      // Vérifier si le document existe déjà
      const existingQuery = await db
        .collection('agency_commissions')
        .where('year', '==', record.year)
        .where('month', '==', record.month)
        .get();

      if (!existingQuery.empty) {
        console.log(`⏭️  ${record.year}-${String(record.month).padStart(2, '0')} existe déjà, ignoré`);
        skippedCount++;
        continue;
      }

      // Créer le document
      await db.collection('agency_commissions').add({
        year: record.year,
        month: record.month,
        commissionsIARD: record.commissionsIARD,
        commissionsVie: record.commissionsVie,
        commissionsCourtage: record.commissionsCourtage,
        profitsExceptionnels: record.profitsExceptionnels,
        totalCommissions,
        chargesAgence: record.chargesAgence,
        resultat,
        prelevementsJulien: record.prelevementsJulien,
        prelevementsJeanMichel: record.prelevementsJeanMichel,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: adminUserId,
        lastUpdatedBy: adminUserId,
      });

      console.log(`✅ ${record.year}-${String(record.month).padStart(2, '0')} importé - Résultat: ${resultat.toLocaleString('fr-FR')} €`);
      importedCount++;
    } catch (error) {
      console.error(`❌ Erreur pour ${record.year}-${record.month}:`, error);
    }
  }

  console.log('\n📊 Résumé de l\'import:');
  console.log(`   ✅ Importés: ${importedCount}`);
  console.log(`   ⏭️  Ignorés (déjà existants): ${skippedCount}`);
  console.log(`   📦 Total traité: ${importedCount + skippedCount}`);
  console.log('\n✨ Import terminé!\n');

  process.exit(0);
}

importData().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

