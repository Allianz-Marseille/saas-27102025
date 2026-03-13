/**
 * Script d'initialisation de la config Trello
 *
 * Pré-remplit Firestore (config/trello) avec les agences, CDC,
 * Board IDs et List IDs récupérés le 2026-03-13.
 *
 * ⚠️  Ce script écrase la config existante.
 *
 * Usage: npx ts-node -r tsconfig-paths/register scripts/init-trello-config.ts
 */

import * as admin from 'firebase-admin'
import * as dotenv from 'dotenv'

dotenv.config()

if (!admin.apps.length) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceAccount = require('../saas-27102025-firebase-adminsdk-fbsvc-b8594fd9de.json')
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

const db = admin.firestore()

const TRELLO_CONFIG = {
  agencies: [
    {
      id: 'kennedy',
      code: 'KEN',
      name: 'Kennedy',
      cdc: [
        {
          id: 'ken-corentin',
          firstName: 'Corentin',
          letters: ['A', 'B', 'C'],
          boardId: 'nfhDBmQg',
          lists: {
            processM3:    '67b5f1c185fe56bcbc836efa',
            pretermeAuto: '67b5f1c697b2440733fec2e6',
            pretermeIrd:  '67b5f1cc0a8afcaca6cd606f',
          },
        },
        {
          id: 'ken-emma',
          firstName: 'Emma',
          letters: ['D', 'E', 'F'],
          boardId: 'DkhXnVU8',
          lists: {
            processM3:    '676a80ed876c6ba57ce79e64',
            pretermeAuto: '687a58ffda5f06e009db8ad5',
            pretermeIrd:  '687a59067f1178246c263732',
          },
        },
        {
          id: 'ken-donia',
          firstName: 'Donia',
          letters: ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
          boardId: 'yYu4W7FJ',
          lists: {
            processM3:    '684830582071a3a26db4e6c1',
            pretermeAuto: '6848305df08bc5e50d5cabd4',
            pretermeIrd:  '6848306555a6640697bea7ef',
          },
        },
      ],
    },
    {
      id: 'rouviere',
      code: 'ROU',
      name: 'Rouvière',
      cdc: [
        {
          id: 'rou-joelle',
          firstName: 'Joelle',
          letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
          boardId: '3oWnNHUr',
          lists: {
            processM3:    '66f0f7ed9464370f143288e1',
            pretermeAuto: '66f0f7f5b5637967d3526f61',
            pretermeIrd:  '66f0f7fc15019fe80a3486a5',
          },
        },
        {
          id: 'rou-christelle',
          firstName: 'Christelle',
          letters: ['I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
          boardId: 'IexKz87i',
          lists: {
            processM3:    '696e08d17fb0c0bd53e42097',
            pretermeAuto: '696e08d97fb0c0bd53e4398a',
            pretermeIrd:  '696e08e102b522306fd1d710',
          },
        },
      ],
    },
  ],
}

async function initTrelloConfig() {
  console.log('🔧 Initialisation de la config Trello...')

  try {
    const ref = db.doc('config/trello')
    const snap = await ref.get()

    if (snap.exists) {
      const existing = snap.data()
      const agencyCount = existing?.agencies?.length ?? 0
      console.log(`⚠️  Un document config/trello existe déjà (${agencyCount} agence(s)).`)
      console.log('   Écrasement avec les données réelles...')
    }

    await ref.set(TRELLO_CONFIG)

    console.log('\n✅ config/trello écrit avec succès :')
    for (const agency of TRELLO_CONFIG.agencies) {
      console.log(`\n  🏢 ${agency.name} (${agency.code})`)
      for (const cdc of agency.cdc) {
        const trelloStatus = cdc.boardId ? `✅ Board ${cdc.boardId}` : '⚠️  Trello non configuré'
        console.log(`     - ${cdc.firstName} [${cdc.letters.join(', ')}] ${trelloStatus}`)
      }
    }

    console.log('\n✨ Terminé !')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur :', error)
    process.exit(1)
  }
}

initTrelloConfig()
