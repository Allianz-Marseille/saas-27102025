/**
 * Script d'import des commissions depuis docs/commissions.md vers Firestore
 * Usage: npm run import:commissions
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

// Helper pour parser les montants (ex: "83 717" -> 83717)
function parseAmount(str: string): number {
  if (!str || str === '-' || str === '—') return 0;
  const cleaned = str.replace(/\s+/g, '').replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

// Données 2025 (10 mois)
const data2025 = [
  // Janvier
  {
    year: 2025,
    month: 1,
    commissionsIARD: 83717,
    commissionsVie: 5815,
    commissionsCourtage: 6928,
    profitsExceptionnels: 0,
    chargesAgence: 54376,
    prelevementsJulien: 18000,
    prelevementsJeanMichel: 18000,
  },
  // Février
  {
    year: 2025,
    month: 2,
    commissionsIARD: 75088,
    commissionsVie: 31813,
    commissionsCourtage: 6851,
    profitsExceptionnels: 0,
    chargesAgence: 63488,
    prelevementsJulien: 13000,
    prelevementsJeanMichel: 13000,
  },
  // Mars
  {
    year: 2025,
    month: 3,
    commissionsIARD: 76902,
    commissionsVie: 3461,
    commissionsCourtage: 4476,
    profitsExceptionnels: 0,
    chargesAgence: 64301,
    prelevementsJulien: 13000,
    prelevementsJeanMichel: 13000,
  },
  // Avril
  {
    year: 2025,
    month: 4,
    commissionsIARD: 76694,
    commissionsVie: 5565,
    commissionsCourtage: 4548,
    profitsExceptionnels: 628,
    chargesAgence: 57102,
    prelevementsJulien: 14400,
    prelevementsJeanMichel: 14400,
  },
  // Mai
  {
    year: 2025,
    month: 5,
    commissionsIARD: 71661,
    commissionsVie: 10027,
    commissionsCourtage: 5941,
    profitsExceptionnels: 0,
    chargesAgence: 57209,
    prelevementsJulien: 12000,
    prelevementsJeanMichel: 12000,
  },
  // Juin
  {
    year: 2025,
    month: 6,
    commissionsIARD: 76841,
    commissionsVie: 3409,
    commissionsCourtage: 4001,
    profitsExceptionnels: 0,
    chargesAgence: 67596,
    prelevementsJulien: 18000,
    prelevementsJeanMichel: 18000,
  },
  // Juillet
  {
    year: 2025,
    month: 7,
    commissionsIARD: 98375,
    commissionsVie: 7062,
    commissionsCourtage: 4744,
    profitsExceptionnels: 0,
    chargesAgence: 61143,
    prelevementsJulien: 15500,
    prelevementsJeanMichel: 15500,
  },
  // Août
  {
    year: 2025,
    month: 8,
    commissionsIARD: 80991,
    commissionsVie: 9824,
    commissionsCourtage: 11074,
    profitsExceptionnels: 0,
    chargesAgence: 66702,
    prelevementsJulien: 17000,
    prelevementsJeanMichel: 17000,
  },
  // Septembre
  {
    year: 2025,
    month: 9,
    commissionsIARD: 88208,
    commissionsVie: 7036,
    commissionsCourtage: 4375,
    profitsExceptionnels: 0,
    chargesAgence: 69611,
    prelevementsJulien: 20500,
    prelevementsJeanMichel: 20500,
  },
  // Octobre
  {
    year: 2025,
    month: 10,
    commissionsIARD: 85104,
    commissionsVie: 5243,
    commissionsCourtage: 4452,
    profitsExceptionnels: 0,
    chargesAgence: 67483,
    prelevementsJulien: 17000,
    prelevementsJeanMichel: 17000,
  },
];

// Données 2024 (12 mois)
const data2024 = [
  { month: 1, commissionsIARD: 69096, commissionsVie: 4594, commissionsCourtage: 3480, profitsExceptionnels: 0, chargesAgence: 51946, prelevementsJulien: 11000, prelevementsJeanMichel: 11000 },
  { month: 2, commissionsIARD: 65309, commissionsVie: 29334, commissionsCourtage: 5260, profitsExceptionnels: 0, chargesAgence: 56200, prelevementsJulien: 20000, prelevementsJeanMichel: 20000 },
  { month: 3, commissionsIARD: 61564, commissionsVie: 2857, commissionsCourtage: 4446, profitsExceptionnels: 0, chargesAgence: 40711, prelevementsJulien: 12500, prelevementsJeanMichel: 12500 },
  { month: 4, commissionsIARD: 58206, commissionsVie: 16836, commissionsCourtage: 8321, profitsExceptionnels: 0, chargesAgence: 54384, prelevementsJulien: 12000, prelevementsJeanMichel: 12000 },
  { month: 5, commissionsIARD: 58536, commissionsVie: 14167, commissionsCourtage: 7013, profitsExceptionnels: 0, chargesAgence: 54350, prelevementsJulien: 12000, prelevementsJeanMichel: 12000 },
  { month: 6, commissionsIARD: 63747, commissionsVie: 2103, commissionsCourtage: 3765, profitsExceptionnels: 0, chargesAgence: 51219, prelevementsJulien: 17000, prelevementsJeanMichel: 17000 },
  { month: 7, commissionsIARD: 78374, commissionsVie: 7997, commissionsCourtage: 4468, profitsExceptionnels: 0, chargesAgence: 56893, prelevementsJulien: 12000, prelevementsJeanMichel: 12000 },
  { month: 8, commissionsIARD: 61693, commissionsVie: 9373, commissionsCourtage: 10340, profitsExceptionnels: 0, chargesAgence: 50871, prelevementsJulien: 12000, prelevementsJeanMichel: 12000 },
  { month: 9, commissionsIARD: 66719, commissionsVie: 2656, commissionsCourtage: 3685, profitsExceptionnels: 0, chargesAgence: 56607, prelevementsJulien: 12000, prelevementsJeanMichel: 12000 },
  { month: 10, commissionsIARD: 61674, commissionsVie: 5594, commissionsCourtage: 4908, profitsExceptionnels: 0, chargesAgence: 55565, prelevementsJulien: 5000, prelevementsJeanMichel: 5000 },
  { month: 11, commissionsIARD: 64675, commissionsVie: 3857, commissionsCourtage: 6469, profitsExceptionnels: 0, chargesAgence: 73049, prelevementsJulien: 17000, prelevementsJeanMichel: 17000 },
  { month: 12, commissionsIARD: 68915, commissionsVie: 8546, commissionsCourtage: 3919, profitsExceptionnels: 0, chargesAgence: 52004, prelevementsJulien: 13000, prelevementsJeanMichel: 13000 },
].map((m) => ({ year: 2024, ...m }));

// Données 2022 (12 mois)
const data2022 = [
  { month: 1, commissionsIARD: 58546, commissionsVie: 4680, commissionsCourtage: 2707, profitsExceptionnels: 0, chargesAgence: 27391, prelevementsJulien: 13000, prelevementsJeanMichel: 13000 },
  { month: 2, commissionsIARD: 52371, commissionsVie: 29497, commissionsCourtage: 3844, profitsExceptionnels: 0, chargesAgence: 35936, prelevementsJulien: 25000, prelevementsJeanMichel: 25000 },
  { month: 3, commissionsIARD: 50389, commissionsVie: 2359, commissionsCourtage: 2403, profitsExceptionnels: 0, chargesAgence: 27295, prelevementsJulien: 13000, prelevementsJeanMichel: 13000 },
  { month: 4, commissionsIARD: 45942, commissionsVie: 9783, commissionsCourtage: 3713, profitsExceptionnels: 0, chargesAgence: 43619, prelevementsJulien: 13000, prelevementsJeanMichel: 13000 },
  { month: 5, commissionsIARD: 43853, commissionsVie: 7802, commissionsCourtage: 4406, profitsExceptionnels: 0, chargesAgence: 34926, prelevementsJulien: 12500, prelevementsJeanMichel: 12500 },
  { month: 6, commissionsIARD: 44665, commissionsVie: 3805, commissionsCourtage: 3628, profitsExceptionnels: 0, chargesAgence: 40174, prelevementsJulien: 13500, prelevementsJeanMichel: 13500 },
  { month: 7, commissionsIARD: 83728, commissionsVie: 4297, commissionsCourtage: 2758, profitsExceptionnels: 0, chargesAgence: 32446, prelevementsJulien: 23000, prelevementsJeanMichel: 23000 },
  { month: 8, commissionsIARD: 44814, commissionsVie: 8046, commissionsCourtage: 7553, profitsExceptionnels: 0, chargesAgence: 37051, prelevementsJulien: 12000, prelevementsJeanMichel: 12000 },
  { month: 9, commissionsIARD: 46798, commissionsVie: 2705, commissionsCourtage: 2998, profitsExceptionnels: 0, chargesAgence: 32880, prelevementsJulien: 13500, prelevementsJeanMichel: 13500 },
  { month: 10, commissionsIARD: 47574, commissionsVie: 3135, commissionsCourtage: 3602, profitsExceptionnels: 0, chargesAgence: 42554, prelevementsJulien: 13500, prelevementsJeanMichel: 13500 },
  { month: 11, commissionsIARD: 43729, commissionsVie: 8372, commissionsCourtage: 5390, profitsExceptionnels: 0, chargesAgence: 35522, prelevementsJulien: 6500, prelevementsJeanMichel: 6500 },
  { month: 12, commissionsIARD: 47409, commissionsVie: 2730, commissionsCourtage: 5043, profitsExceptionnels: 0, chargesAgence: 39196, prelevementsJulien: 12500, prelevementsJeanMichel: 12500 },
].map((m) => ({ year: 2022, ...m }));

const allData = [...data2025, ...data2024, ...data2022];

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
  console.log('🚀 Début de l\'import des commissions agence...\n');

  // ID admin pour le createdBy (à remplacer par un vrai ID si nécessaire)
  const adminUserId = 'IMPORT_SCRIPT';

  let importedCount = 0;
  let skippedCount = 0;

  for (const record of allData) {
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

