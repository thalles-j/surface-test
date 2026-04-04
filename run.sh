#!/bin/bash

# 🚀 Script para iniciar a Dashboard Admin
# Uso: ./run.sh

echo "🎨 Surface Streetwear - Dashboard Administrativa"
echo "================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se estamos na pasta correta
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${YELLOW}❌ Execute este script na raiz do projeto${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Instalando dependências...${NC}"
echo ""

# Backend
echo -e "${YELLOW}⚙️ Backend...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
    echo -e "${GREEN}✅ Backend instalado${NC}"
else
    echo -e "${GREEN}✅ Backend já instalado${NC}"
fi
cd ..

# Frontend  
echo -e "${YELLOW}⚙️ Frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
    echo -e "${GREEN}✅ Frontend instalado${NC}"
else
    echo -e "${GREEN}✅ Frontend já instalado${NC}"
fi
cd ..

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✨ Pronto para iniciar!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Abra 2 terminais:"
echo ""
echo -e "${BLUE}Terminal 1 - Backend:${NC}"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo -e "${BLUE}Terminal 2 - Frontend:${NC}"
echo "  cd frontend" 
echo "  npm run dev"
echo ""
echo "Depois acesse: ${BLUE}http://localhost:5173${NC}"
echo "Login com seu account admin (role = 1)"
echo "Acesse: ${BLUE}http://localhost:5173/admin${NC}"
echo ""
echo -e "${YELLOW}Documentação:${NC}"
echo "  - QUICK_START.md (Comece aqui!)"
echo "  - DASHBOARD_ADMIN.md (Completo)"
echo "  - IMPLEMENTACAO_ADMIN.md (Técnico)"
echo ""
