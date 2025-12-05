Quickstart
Get started with Pinecone manually, with AI assistance, or with no-code tools.


Copy page
Manual
Cursor
Claude Code
n8n
Use Cursor to build a Pinecone application with current best practices. Instead of copying code snippets, you’ll work with an agent that understands Pinecone APIs and implements production-ready patterns automatically.
Because this quickstart relies on AI, the exact implementation may vary each time.
​
1. Sign up
If you’re new to Pinecone, sign up at app.pinecone.io and choose a free plan:
Starter plan: Free access to most features, but you’re limited to one cloud region and need to stay under Starter plan limits.
Standard plan trial: 21 days and $300 in credits with access to Standard plan features and higher limits that let you test Pinecone at scale.
You cannot switch from the Starter plan to the Standard plan trial, so be sure to select the right plan for your needs.
After signing up, you’ll receive an API key in the console. Save this key. You’ll need it to authenticate your requests to Pinecone.
​
2. Download AGENTS.md
AI coding agents like Cursor learn from web searches and training data, which can include outdated patterns. To ensure Cursor uses current Pinecone APIs and best practices, you’ll use an AGENTS.md reference file that provides authoritative, up-to-date information about Pinecone’s 2025 APIs and CLI commands.
Create a new project folder:
mkdir pinecone-quickstart
cd pinecone-quickstart
Download the AGENTS.md reference file for your preferred programming language:

Python

JavaScript
curl -o AGENTS.md https://docs.pinecone.io/AGENTS-PYTHON.md
Open your project in Cursor and start a new agent chat (Cmd I).
If you don’t have Cursor installed, see the Cursor quickstart.
Verify that Cursor has access to the AGENTS.md file:
Confirm you can see the AGENTS.md file and understand the current Pinecone best practices it contains.

Summarize the key points about using Pinecone in 2025.

Just give me a concise summary - don't create any additional files or examples yet.
​
3. Prompt your agent
Now ask your agent to help you get started with Pinecone:
Help me get started with Pinecone.
Your agent will first ask you to choose an option: quick test, semantic search, RAG, or recommendations. Based on your choice, it will build and test a sample application using Pinecone best practices. Finally, it will provide a succinct summary of what it did.
Throughout and after the process, you can review the generated code in your IDE to understand the patterns and best practices applied. You can also ask your coding agent to explain the code to you.
​
4. Give us feedback
We’d love to hear your feedback on this quickstart. Please fill out this short survey.
​
Next steps
Use your coding agent to:
Learn more about the system you built.
Extend or modify it.
Plan and implement specific requirements related to your own use case.
Learn more about Pinecone:
Index data
Learn more about storing data in Pinecone
Search
Explore different forms of vector search.
Optimize
Find out how to improve performance
Was this page helpful?

---

## ⚠️ IMPORTANT : Différence entre Pinecone Vector DB et Pinecone MCP API

**Cette documentation (AGENTS.md) concerne :**
- ✅ Pinecone comme **base de données vectorielle** (index, recherche, RAG)
- ✅ Utilisation du **SDK Node.js** (`@pinecone-database/pinecone`)
- ✅ Opérations sur les **index** (upsert, search, fetch)

**Ce dont nous avons besoin pour le chatbot :**
- ❌ **Pinecone MCP API** (Model Context Protocol) pour les **assistants conversationnels**
- ❌ **API REST HTTP directe** (pas le SDK)
- ❌ Documentation de l'endpoint `/mcp/assistants/`

**Ces deux APIs sont différentes !**

---

## 📝 Documentation API MCP Pinecone (Assistants)

**Où chercher dans le dashboard Pinecone :**
1. Section **"Assistant"** (icône ampoule) dans la sidebar
2. Documentation spécifique à l'**API MCP** ou **Assistants API**
3. **Exemples de requêtes HTTP REST** (pas le SDK Node.js)

**Ce qui est CRITIQUE à copier ici :**
- ✅ Un exemple cURL complet qui fonctionne vers `/mcp/assistants/`
- ✅ La structure exacte du body de requête (JSON direct ou JSON-RPC ?)
- ✅ La structure exacte de la réponse
- ✅ La méthode JSON-RPC exacte (si applicable) - actuellement on a "Method not found"

**Exemple de format attendu :**
```bash
# Commande cURL qui fonctionne pour l'API MCP
curl -X POST "https://prod-1-data.ke.pinecone.io/mcp/assistants/saas-allianz" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer pcsk_..." \
  -d '{
    "message": "Quelles sont les offres du moment ?"
  }'
# OU format JSON-RPC ?
# -d '{
#   "jsonrpc": "2.0",
#   "method": "???",
#   "params": { "message": "..." },
#   "id": 1
# }'
```

**Note :** La documentation AGENTS.md fournie concerne les index vectoriels, pas l'API MCP pour les assistants. Il faut chercher la documentation spécifique à l'API MCP dans la section "Assistant" du dashboard Pinecone.

