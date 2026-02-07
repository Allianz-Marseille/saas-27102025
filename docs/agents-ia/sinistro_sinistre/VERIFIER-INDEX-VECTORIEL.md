# Vérifier que l’index vectoriel Sinistro est créé

L’index est défini dans **firestore.indexes.json** (racine du projet). Déploiement :

```bash
firebase deploy --only firestore
```

(Projet : `gcloud config set project saas-27102025`.)

## 1. Via gcloud CLI

À exécuter dans un terminal (projet Firebase déjà sélectionné) :

```bash
# Lister tous les index composites (dont vectoriels)
gcloud firestore indexes composite list --database="(default)"
```

Si tu n’as pas encore choisi le projet :

```bash
gcloud config set project VOTRE_PROJECT_ID
gcloud firestore indexes composite list --database="(default)"
```

**Ce qu’il faut voir :** un index dont :
- `collectionGroup` = **sinistro_knowledge**
- un champ de type **vector** avec `dimension` = **1536** (pour `text-embedding-3-small`).

Exemple de sortie (extrait) :
```text
collectionGroup: sinistro_knowledge
queryScope: COLLECTION
fields:
  - fieldPath: embedding
    vectorConfig:
      dimension: 1536
      flat: {}
```

---

## 2. Via la console Firebase

1. Ouvre [Firebase Console](https://console.firebase.google.com/) → ton projet.
2. **Firestore Database** → onglet **Indexes** (ou **Index**).
3. Dans la liste des index, cherche un index sur la collection **sinistro_knowledge** avec un champ **embedding** de type **Vector** (dimension 1536).

Sur certaines interfaces, les index vectoriels sont dans une section dédiée (ex. « Vector indexes »).

---

## 3. Via un test dans l’app

Une fois la migration exécutée (`npm run migrate:sinistro-firestore`) et l’index créé :

- Envoyer un message à l’agent **Sinistro** (ex. « Quel est le seuil IRSA ? »).
- Si le RAG fonctionne : la réponse s’appuie sur les 3 documents les plus proches et cite des sources du type `sinistro/irsa-auto.md`.
- Si l’index n’existe pas ou que `findNearest` échoue : le code fait un **fallback** sur la base statique (sans erreur visible), ou une erreur peut apparaître dans les logs serveur.

Vérifier les logs de l’API (terminal `next dev` ou logs Vercel) en cas de message du type « findNearest non disponible » ou erreur Firestore.
