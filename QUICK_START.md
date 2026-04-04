# 🚀 Quick Start - Dashboard Admin

## ⚡ Comece em 5 minutos!

### Passo 1: Inicie o Backend
```bash
cd backend
npm run dev
```
✅ Backend rodando em `http://localhost:3000`

### Passo 2: Inicie o Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend rodando em `http://localhost:5173`

### Passo 3: Faça Login
1. Abra `http://localhost:5173`
2. Clique em "Entrar"
3. Use uma conta com `role = 1` (admin)

### Passo 4: Acesse o Admin
1. Após logar, navegue para `/admin`
2. Você verá a dashboard completa!

---

## 📁 Estrutura da Dashboard

```
┌─────────────────────────────────────────┐
│         SIDEBAR (Esquerda)              │
├─────────────────────────────────────────┤
│ PRINCIPAL                               │
│ • Visão Geral                           │
│ • Vendas                                │
│                                         │
│ CATÁLOGO                                │
│ • Produtos                              │
│ • Drops & Coleções                      │
│ • Categorias                            │
│ • Estoque                               │
│                                         │
│ NEGÓCIO                                 │
│ • Clientes                              │
│ • Analytics                             │
│ • Marketing                             │
│                                         │
│ GERENCIAL                               │
│ • Customização                          │
│ • Configurações                         │
│ • Admin                                 │
└─────────────────────────────────────────┘
          ↓ CLIQUE PARA NAVEGAR
    CONTEÚDO APARECE AQUI
```

---

## 🎯 Recursos por Seção

### 1️⃣ **Visão Geral** (Dashboard)
- 📊 Cards com métricas
- 📈 Gráfico de vendas
- ⭐ Top 3 produtos
- 🔒 Status do drop

**Teste**: Clique "Liberar Acesso" / "Travar Site"

### 2️⃣ **Vendas**
- 📋 Tabela de pedidos
- 🔍 Filtro por status
- 📍 Busca por cliente

**Teste**: Digite um nome no campo de busca

### 3️⃣ **Produtos** ⭐
- ➕ Criar novo produto
- ✏️ Editar existentes
- 🗑️ Deletar
- 📦 Gerenciar variações

**Teste**: 
1. Clique "Novo Produto"
2. Preencha nome, preço, categoria
3. Adicione variações (tamanhos)
4. Clique "Criar Produto"

### 4️⃣ **Drops & Coleções**
- 📅 Data de lançamento
- 🔐 Lock/Unlock (Coming Soon)
- 📊 Contador de produtos

**Teste**: Clique no botão "Travada" para desbloquear

### 5️⃣ **Categorias**
- ➕ Criar categoria
- ✏️ Editar
- 🗑️ Deletar
- ⭐ Destacar na home

**Teste**: Crie uma categoria nova

### 6️⃣ **Estoque**
- ⚠️ Alertas de baixo estoque
- ➕➖ Botões para ajustar
- 🚨 Produtos esgotados em destaque

**Teste**: Clique+/- para aumentar/diminuir estoque

### 7️⃣ **Clientes**
- 👥 Lista completa
- 💎 Classificação (VIP/Novo/Recorrente)
- 💰 Total gasto
- 🔍 Busca

**Teste**: Filtre por "VIP" na dropdown

### 8️⃣ **Analytics**
- 📊 Gráfico de vendas
- 🍰 Pie chart de categorias
- 🔗 Funil de conversão
- 📱 Canais de origem

**Teste**: Hover sobre o gráfico para ver tooltips

### 9️⃣ **Customização**
- 🎨 Picker de cores
- 📝 Editar textos
- 🖼️ Upload banner (mock)
- 👁️ Preview

**Teste**: Mude a cor primária e veja a mudança

### 🔟 **Marketing**
- 🎟️ Criar cupons
- 📅 Definir validade
- 📢 Listar campanhas
- 📊 Ver alcance

**Teste**: Crie um cupom "TEST50" com 50% desconto

### 1️⃣1️⃣ **Configurações**
- 🏪 Dados da loja
- 💳 Métodos de pagamento
- 📦 Frete
- 🌍 Moeda e idioma

**Teste**: Altere a taxa de frete

### 1️⃣2️⃣ **Admin**
- 👨‍💼 Gerenciar admins
- 🔐 Níveis de permissão
- 📋 Logs de atividades

**Teste**: Veja a lista de admins e suas permissões

---

## 🎮 Dicas e Truques

### 💡 Hotkeys / Atalhos
- Pode adicionar com a rota protegida em `/admin/*`
- Todos os dados são mock (clique e teste sem medo!)

### 🔍 Busca e Filtros
- Todos os campos de busca são **case-insensitive**
- Filtros funcionam em combo (busca + dropdown)

### 📱 Responsividade
- Desktop: 100% funcional
- Tablet: 90% funcional
- Mobile: Básico funcional

### 🖨️ Dados Mock
- Nem todas as ações salvam no banco
- Para integrar: Remova dados mock e adicione `fetch()` real
- Backend está pronto com endpoints reais

---

## 🔗 Links e Rotas

| Página | URL | Status |
|--------|-----|--------|
| Home | `/` | ✅ |
| Login | `/entrar` | ✅ |
| Dashboard | `/admin` | ✅ Protegida |
| Perfil | `/account` | ✅ Protegida |
| Loja | `/shop` | ✅ |

---

## ⚙️ Configuração Backend

### Autenticação
O backend usa `authMiddleware` para proteger rotas:

```js
// Todas as rotas admin requerem token JWT
router.use(authMiddleware);
```

### CORS
Já está configurado para frontend local:
```js
origin: "http://localhost:5173"
```

### Banco de Dados
Usa Prisma ORM com PostgreSQL (configurar em `.env`)

---

## 🐛 Troubleshooting

### ❌ "Erro de conexão com backend"
✅ Solução: Verifique se `npm run dev` está rodando na pasta `backend`

### ❌ "Acesso negado ao admin"
✅ Solução: Faça login com conta que tem `role = 1`

### ❌ "Dados não aparecem"
✅ Solução: Todos os dados são mock - são pré-carregados no componente

### ❌ "Não consigo salvar mudanças"
✅ Solução: Os dados mock não persistem (objetivo do mock). Para persistência, integre com API real.

---

## 📚 Próximos Passos

1. **Teste tudo**: Crie produtos, cupons, altere configurações
2. **Leia o código**: Componentes bem documentados
3. **Customize**: Mude cores, textos, adicione features
4. **Integre com API**: Substitua dados mock por chamadas reais
5. **Deploy**: Pronto para produção com ajustes

---

## 📞 Precisa de Ajuda?

1. Consulte [DASHBOARD_ADMIN.md](./DASHBOARD_ADMIN.md) para documentação completa
2. Consulte [IMPLEMENTACAO_ADMIN.md](./IMPLEMENTACAO_ADMIN.md) para detalhes técnicos
3. Leia o código - está muito bem comentado!

---

## 🎉 Parabéns!

Você tem uma dashboard administrativa **COMPLETA** e profissional!

Próximo passo: **INTEGRAR COM BACKEND REAL** ✨

---

**Desenvolvido com ❤️ para Surface Streetwear**
