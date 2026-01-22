/**
 * Script de nettoyage des collections Firestore RAG
 * 
 * Ce script supprime toutes les données des collections RAG :
 * - rag_documents
 * - rag_chunks
 * - rag_source_usage
 * 
 * ATTENTION : Cette opération est irréversible !
 * Exécuter uniquement après avoir vérifié qu'aucun code n'utilise plus ces collections.
 */

import { adminDb } from "../lib/firebase/admin-config";

async function cleanupRAGCollections() {
  const collections = ['rag_documents', 'rag_chunks', 'rag_source_usage'];
  
  console.log("🧹 Début du nettoyage des collections RAG...\n");
  
  for (const collectionName of collections) {
    try {
      console.log(`📦 Traitement de la collection ${collectionName}...`);
      
      // Récupérer tous les documents
      const snapshot = await adminDb.collection(collectionName).get();
      const totalDocs = snapshot.size;
      
      if (totalDocs === 0) {
        console.log(`   ✅ Aucun document à supprimer dans ${collectionName}\n`);
        continue;
      }
      
      console.log(`   📄 ${totalDocs} document(s) trouvé(s)`);
      
      // Supprimer par batch (max 500 documents par batch)
      const batchSize = 500;
      let deletedCount = 0;
      
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = adminDb.batch();
        const docsBatch = snapshot.docs.slice(i, i + batchSize);
        
        docsBatch.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        deletedCount += docsBatch.length;
        
        console.log(`   ⏳ ${deletedCount}/${totalDocs} documents supprimés...`);
      }
      
      console.log(`   ✅ ${totalDocs} document(s) supprimé(s) de ${collectionName}\n`);
    } catch (error) {
      console.error(`   ❌ Erreur lors de la suppression de ${collectionName}:`, error);
      throw error;
    }
  }
  
  console.log("✨ Nettoyage terminé avec succès !");
}

// Exécuter le script
if (require.main === module) {
  cleanupRAGCollections()
    .then(() => {
      console.log("\n✅ Script terminé");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Erreur lors de l'exécution du script:", error);
      process.exit(1);
    });
}

export { cleanupRAGCollections };

