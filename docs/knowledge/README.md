# Base de Connaissances Métier - Assistant IA

Cette base de connaissances contient toute la logique métier et les spécificités de l'agence Allianz Marseille (Nogaro & Boetti) pour enrichir les réponses de l'assistant IA.

## Structure

```
docs/knowledge/
├── core/              # Connaissances fondamentales (identité, réglementation)
├── produits/          # Fiches produits par domaine (IARD, Santé, Prévoyance, Épargne)
└── process/           # Processus internes de l'agence (Leads, M+3, Préterme)
```

## Utilisation

Cette base de connaissances est utilisée de deux façons :

1. **System Prompt enrichi** : Les connaissances du dossier `core/` sont injectées directement dans le system prompt de l'assistant.

2. **Injection contextuelle** (future évolution) : Selon le sujet de la question, des fichiers pertinents peuvent être chargés dynamiquement pour enrichir le contexte.

## Principes

- ✅ **Simplicité** : Pas de vectorisation, pas d'embeddings
- ✅ **Maintenabilité** : Fichiers Markdown versionnés dans Git
- ✅ **Transparence** : Toute la connaissance est visible et auditable
- ✅ **Contrôle** : Maîtrise totale du contenu

## Contribution

Pour ajouter ou modifier des connaissances :

1. Éditer les fichiers Markdown dans les dossiers appropriés
2. Respecter la structure et le format existants
3. Valider les modifications avec l'équipe métier
4. Commiter les changements avec un message clair

## Format des fichiers

Chaque fichier doit contenir :
- Des sections clairement structurées avec des titres Markdown
- Des listes à puces pour les points clés
- Des exemples concrets quand c'est pertinent
- Un vocabulaire métier précis et cohérent

---

*Dernière mise à jour : 2025-01-21*

