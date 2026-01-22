#!/bin/bash

# Script de vérification TypeScript avant commit
# Usage: ./scripts/check-typescript.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Vérification TypeScript...${NC}"

# Vérifier que nous sommes dans un repo Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Erreur: Ce répertoire n'est pas un dépôt Git${NC}"
    exit 1
fi

# Vérifier que node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules non trouvé, installation des dépendances...${NC}"
    npm install
fi

# Exécuter la vérification TypeScript
echo -e "${YELLOW}Exécution de la vérification TypeScript...${NC}"
if npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt | grep -q "error TS"; then
    echo ""
    echo -e "${RED}❌ Erreurs TypeScript détectées !${NC}"
    echo ""
    echo "Résumé des erreurs :"
    grep "error TS" /tmp/tsc-output.txt | head -10
    echo ""
    echo -e "${YELLOW}Pour voir toutes les erreurs :${NC}"
    echo "  npx tsc --noEmit"
    echo ""
    echo -e "${RED}Commit annulé. Corrigez les erreurs TypeScript avant de continuer.${NC}"
    rm -f /tmp/tsc-output.txt
    exit 1
fi

echo -e "${GREEN}✅ Aucune erreur TypeScript${NC}"
rm -f /tmp/tsc-output.txt
exit 0
