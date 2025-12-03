<!-- 465a8fc2-5900-40db-b60e-c037b2e9cd07 7581939d-79d4-4e6f-86c3-450e9cafd253 -->
# Intégration Google Cloud AI pour PDFs et Images

## Distinction des cas d'usage

### Cas 1 : Admin - Vectorisation PDF (Page Outils)

**Objectif :** Extraire le texte d'un PDF pour l'indexer dans Qdrant (base de connaissances RAG)

**Solution :** Google Document AI - Document OCR Processor

- **API :** `documentai.googleapis.com`
- **Tarif :** $1.50 / 1000 pages
- **Features :** OCR avancé, extraction de texte structuré, supporte PDFs natifs et scannés

### Cas 2 : Tous utilisateurs - Lecture ponctuelle (Chatbot)

**Objectif :** Analyser un PDF/image collé dans la conversation

**Solution :** Google Vision AI - Document Text Detection

- **API :** `vision.googleapis.com`
- **Tarif :** $1.50 / 1000 images
- **Features :** OCR rapide, détection de texte, analyse d'image

## Configuration Google Cloud

### Étape 1 : Créer un projet Google Cloud

**Lien :** https://console.cloud.google.com/

1. Créer un projet (ex: "allianz-rag")
2. Activer la facturation (carte requise, mais $300 de crédit gratuit)

### Étape 2 : Activer les APIs

**Document AI (pour admin) :**

- https://console.cloud.google.com/apis/library/documentai.googleapis.com
- Cliquer sur "Activer"

**Vision AI (pour chatbot) :**

- https://console.cloud.google.com/apis/library/vision.googleapis.com
- Cliquer sur "Activer"

### Étape 3 : Créer un compte de service

**Lien :** https://console.cloud.google.com/iam-admin/serviceaccounts

1. "Créer un compte de service"
2. Nom : "allianz-rag-service"
3. Rôles nécessaires :

   - `Document AI API User`
   - `Cloud Vision API User`

4. Créer une clé JSON
5. Télécharger le fichier JSON

### Étape 4 : Configuration environnement

Ajouter dans `.env.local` et Vercel :

```bash
# Google Cloud Service Account (contenu du fichier JSON en base64)
GOOGLE_APPLICATION_CREDENTIALS_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...

# Ou chemin vers le fichier (local uniquement)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Project ID
GOOGLE_CLOUD_PROJECT=allianz-rag

# Document AI Processor (pour admin)
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=abc123def456
GOOGLE_DOCUMENT_AI_LOCATION=eu
```

### Étape 5 : Créer un processeur Document AI

**Lien :** https://console.cloud.google.com/ai/document-ai/processors

1. "Créer un processeur"
2. Type : "Document OCR"
3. Région : "EU" (Europe)
4. Copier le "Processor ID"

## Implémentation

### Fichier 1 : Installation dépendances

**Fichier :** [`package.json`](package.json)

```bash
npm install @google-cloud/documentai @google-cloud/vision
```

### Fichier 2 : Configuration Google

**Nouveau fichier :** `lib/google-cloud/config.ts`

```typescript
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Initialisation des clients
export function getDocumentAIClient() {
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64
    ? JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString())
    : undefined;

  return new DocumentProcessorServiceClient({ credentials });
}

export function getVisionClient() {
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64
    ? JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString())
    : undefined;

  return new ImageAnnotatorClient({ credentials });
}

export const googleConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
  documentAI: {
    processorId: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID || '',
    location: process.env.GOOGLE_DOCUMENT_AI_LOCATION || 'eu',
  },
};
```

### Fichier 3 : Extraction PDF avec Document AI (Admin)

**Fichier :** [`lib/rag/pdf-processor.ts`](lib/rag/pdf-processor.ts)

```typescript
import { getDocumentAIClient, googleConfig } from '@/lib/google-cloud/config';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const client = getDocumentAIClient();
    
    const name = `projects/${googleConfig.projectId}/locations/${googleConfig.documentAI.location}/processors/${googleConfig.documentAI.processorId}`;
    
    const request = {
      name,
      rawDocument: {
        content: buffer.toString('base64'),
        mimeType: 'application/pdf',
      },
    };

    const [result] = await client.processDocument(request);
    const { document } = result;

    if (!document || !document.text) {
      throw new Error('Aucun texte extrait du PDF');
    }

    return document.text;
  } catch (error) {
    throw new Error(`Erreur Google Document AI: ${error.message}`);
  }
}
```

### Fichier 4 : Analyse ponctuelle dans chatbot

**Nouveau fichier :** `app/api/chat/analyze-document/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getVisionClient } from '@/lib/google-cloud/config';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const client = getVisionClient();

    const [result] = await client.documentTextDetection({
      image: { content: buffer.toString('base64') },
    });

    const text = result.fullTextAnnotation?.text || '';

    return NextResponse.json({
      text,
      confidence: result.fullTextAnnotation?.pages?.[0]?.confidence || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## Coûts estimés

### Document AI (Admin - Vectorisation)

- **Tarif :** $1.50 / 1000 pages
- **Usage typique :** 100 documents/mois × 10 pages = 1000 pages
- **Coût mensuel :** ~$1.50/mois

### Vision AI (Chatbot - Analyse ponctuelle)

- **Tarif :** $1.50 / 1000 images
- **Usage typique :** 50 analyses/mois
- **Coût mensuel :** ~$0.08/mois

**Total estimé : ~$2/mois** (très raisonnable)

## Liens utiles

- **Console Google Cloud :** https://console.cloud.google.com/
- **Document AI Docs :** https://cloud.google.com/document-ai/docs
- **Vision AI Docs :** https://cloud.google.com/vision/docs
- **Pricing Calculator :** https://cloud.google.com/products/calculator
- **Free Tier :** $300 crédit gratuit (3 mois)

## Timeline d'implémentation

1. Configuration Google Cloud : 10 minutes
2. Installation dépendances : 2 minutes
3. Code Document AI : 15 minutes
4. Code Vision AI : 10 minutes
5. Tests : 10 minutes

**Total : ~45 minutes pour une solution production-ready**

### To-dos

- [x] Améliorer la fonctionnalité de copie - ajouter bouton pour copier toute la conversation
- [x] Améliorer le feedback utilisateur pour le collage d'image - ajouter toast et meilleure UX
- [x] Ajouter fonctionnalité pour exporter/télécharger la conversation en format texte
- [ ] Corriger l'import de pdf-parse dans pdf-processor.ts - utiliser import statique et ajouter validation PDF
- [ ] Améliorer la gestion d'erreurs dans pdf-processor.ts - distinguer erreurs récupérables/fatales, messages spécifiques
- [ ] Ajouter validation préalable dans upload route - vérifier config Qdrant/OpenAI/Storage avant traitement
- [ ] Améliorer gestion erreurs upload route - rollback complet, messages spécifiques, retry mechanism
- [ ] Ajouter logs structurés dans upload route - ID trace, métriques, contexte erreurs
- [ ] Améliorer robustesse suppression - vérifications préalables, rollback si erreur partielle
- [ ] Améliorer client Qdrant - vérification santé, retry avec backoff, logs détaillés
- [ ] Créer script diagnose-rag-system.ts pour vérifier toute la chaîne RAG
- [ ] Améliorer UI upload dialog - messages erreurs spécifiques, progression détaillée, métriques
- [ ] Nettoyer package.json - supprimer pdf-parse complètement
- [ ] Nettoyer pdf-processor.ts - supprimer code pdf-parse obsolète
- [ ] Corriger configuration pdfjs-dist pour serverless
- [ ] Vérifier fonctionnement Tesseract.js
- [ ] Créer script test-rag-upload.ts
- [ ] Créer documentation SETUP_RAG_COMPLETE.md
- [ ] Tester upload PDF et image en local
- [ ] Déployer et tester en production
- [ ] Corriger l'import de pdf-parse dans pdf-processor.ts - utiliser import statique et ajouter validation PDF
- [ ] Améliorer la gestion d'erreurs dans pdf-processor.ts - distinguer erreurs récupérables/fatales, messages spécifiques
- [ ] Ajouter validation préalable dans upload route - vérifier config Qdrant/OpenAI/Storage avant traitement
- [ ] Améliorer gestion erreurs upload route - rollback complet, messages spécifiques, retry mechanism
- [ ] Ajouter logs structurés dans upload route - ID trace, métriques, contexte erreurs
- [ ] Améliorer robustesse suppression - vérifications préalables, rollback si erreur partielle
- [ ] Améliorer client Qdrant - vérification santé, retry avec backoff, logs détaillés
- [ ] Créer script diagnose-rag-system.ts pour vérifier toute la chaîne RAG
- [ ] Améliorer UI upload dialog - messages erreurs spécifiques, progression détaillée, métriques
- [ ] Nettoyer package.json - supprimer pdf-parse complètement
- [ ] Nettoyer pdf-processor.ts - supprimer code pdf-parse obsolète
- [ ] Corriger configuration pdfjs-dist pour serverless
- [ ] Vérifier fonctionnement Tesseract.js
- [ ] Créer script test-rag-upload.ts
- [ ] Créer documentation SETUP_RAG_COMPLETE.md
- [ ] Tester upload PDF et image en local
- [ ] Déployer et tester en production