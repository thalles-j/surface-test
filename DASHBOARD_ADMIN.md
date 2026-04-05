# 🎨 Dashboard Administrativa - Surface Streetwear

Uma dashboard administrativa **COMPLETA** para gerenciar uma loja de roupas streetwear, desenvolvida com React, Tailwind CSS e design minimalista (preto e branco).

## 📋 Funcionalidades

### 🎯 1. **Dashboard (Visão Geral)**
- Cards com KPIs: Faturamento, Pedidos, Ticket Médio, Taxa de Conversão
- Gráfico de vendas mensal
- Produtos mais vendidos
- Status do próximo drop (Coming Soon)

### 💰 2. **Vendas / Analytics Avançado**
- Lista completa de pedidos com filtros
- Status de pedidos (Pago, Pendente, Enviado, Entregue)
- Busca por cliente, email ou ID
- Métricas de receita
- Comparação de períodos

### 📦 3. **Produtos (CRUD Completo)**
- ✅ **Criar** produtos com form intuitivo
- ✅ **Editar** produtos existentes
- ✅ **Deletar** com confirmação
- **Campos**: Nome, Preço, Descrição, Categoria
- **Variações**: Tamanho, Cor, SKU, Quantidade
- Status (Ativo/Inativo)
- Marca de "Produto Destaque"
- Tabela com filtro por SKU

### 🧩 4. **Coleções (Drops)**
- Criar/editar coleções
- Data de lançamento
- **Sistema de Travamento**: Ativar "Coming Soon" e bloquear acesso
- Grid visual das coleções
- Status (Planejado/Ativo/Finalizado)

### 🗂️ 5. **Categorias**
- CRUD de categorias
- Descrição de categorias
- Opção de destacar na home
- Contador de produtos por categoria

### 📊 6. **Estoque**
- Visualização em tempo real
- Alertas de estoque baixo
- Status: Em estoque / Baixo / Esgotado
- Botões +/- para ajustar quantidade
- Gerenciador de mínimo de estoque

### 👥 7. **Clientes**
- Lista completa com filtros
- Classificação: VIP, Novo, Recorrente
- Dados: Nome, Email, Telefone, Total Gasto
- Indicador de cliente VIP (coroa 👑)
- Histórico de compras

### 📈 8. **Analytics (Comportamento)**
- Gráfico de vendas por mês
- Gráfico de pizza por categoria
- Funil de conversão
- Canais de origem (Instagram, Tráfego Pago, Google)
- Insights de IA (mock)

### 🎨 9. **Customização**
- Editor de banner
- Mudança de cores (Primária/Secundária)
- Upload de imagem hero
- Edição de texto da home
- Preview em tempo real

### 10. **Marketing**
- **Cupons**: Criar, deletar, listar
  - Código, Desconto, Tipo (Porcentagem/Valor/Frete)
  - Data de validade
  - Contador de usos
- **Campanhas**: Black Friday, Natal, Carrinho Abandonado
- Status das campanhas
- Alcance estimado

### ⚙️ 11. **Configurações**
- Nome e contato da loja
- Métodos de pagamento (Cartão, PIX, Boleto)
- Provedor de frete
- Taxa de frete e frete grátis acima de X
- Moeda, Fuso Horário, Idioma

### 🔐 12. **Admin Panel**
- Gerenciar usuários admin
- Níveis de permissão:
  - Super Admin (Tudo)
  - Gerente (CRUD)
  - Editor (Criar/Editar)
  - Viewer (Apenas visualizar)
- Logs de atividades
- Último acesso de cada admin

## 🚀 Como Usar

### Instalação e Setup

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

O frontend rodará em `http://localhost:5173`

#### Backend
```bash
cd backend
npm install
npm run dev
```

O backend rodará em `http://localhost:3000` (ou a porta configurada)

### Acessar a Dashboard

1. Faça login na aplicação com uma conta de admin
2. Navegue para `/admin`
3. Você verá a sidebar com todas as opções

**Rota Protegida**: Apenas usuários com `role = 1` (admin) conseguem acessar.

## 📁 Estrutura de Pastas

```
frontend/src/
├── pages/
│   └── Admin/
│       └── index.jsx              # Página principal do admin
├── components/
│   └── Admin/
│       ├── Sidebar.jsx            # Navegação lateral
│       ├── Dashboard.jsx          # Visão geral
│       ├── Sales.jsx              # Vendas
│       ├── Products.jsx           # Produtos CRUD
│       ├── Collections.jsx        # Drops
│       ├── Categories.jsx         # Categorias
│       ├── Inventory.jsx          # Estoque
│       ├── Customers.jsx          # Clientes
│       ├── Analytics.jsx          # Gráficos
│       ├── Customization.jsx      # Personalização
│       ├── Marketing.jsx          # Marketing
│       ├── AdminSettings.jsx      # Configurações
│       └── AdminPanel.jsx         # Controle de admins

backend/src/
├── routes/
│   └── adminRoutes.js             # Rotas do admin
├── controllers/
│   └── adminController.js         # Controllers
├── services/
│   └── adminService.js            # Lógica de negócio
```

## 🎯 Funcionalidades Principais

### Sidebar Inteligente
```
PRINCIPAL
├── Visão Geral
└── Vendas

CATÁLOGO
├── Produtos
├── Drops & Coleções
├── Categorias
└── Estoque

NEGÓCIO
├── Clientes
├── Analytics
└── Marketing

GERENCIAL
├── Customização
├── Configurações
└── Admin
```

### Design System

- **Cores**: Preto (#000000), Branco, Cinzas
- **Tipografia**: Moderna, clean (font-bold, uppercase em destaques)
- **Componentes**: Cards, Tabelas, Forms, Modais (simples)
- **Animações**: Fade-in, Hover effects, Transitions suaves
- **Responsividade**: Mobile-first com Tailwind

## 🔌 API Endpoints

### Autenticação
```
POST /api/auth/login
```

### Admin
```
GET    /api/admin/dashboard/stats
GET    /api/admin/sales
GET    /api/admin/analytics/overview
GET    /api/admin/customers
GET    /api/admin/collections
GET    /api/admin/categories
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
DELETE /api/admin/categories/:id
GET    /api/admin/inventory/status
PATCH  /api/admin/inventory/:productId
GET    /api/admin/settings
PATCH  /api/admin/settings
GET    /api/admin/admins
POST   /api/admin/admins
```

## 💡 Dados Mock

Todos os dados são mockados (sem requisições reais ao backend ainda). Para integrar com o backend:

1. Substitua os dados mock pelas chamadas `fetch()` ou `axios`
2. Use os endpoints definidos acima
3. Trate erros apropriadamente

## 🎨 Customização

### Cores
Editar em `Customization` → Mudar cores primária/secundária

### Textos da Home
Editar em `Customization` → Alterar banners e textos

### Métodos de Pagamento
Editar em `Configurações` → Selecionar métodos aceitos

## 🔒 Segurança

- Autenticação via JWT (Backend)
- Role-based access control (Admin only)
- CORS configurado
- Validação de inputs
- Proteção de rotas

## 📱 Responsividade

A dashboard é responsiva e funciona bem em:
- ✅ Desktop (1920px+)
- ✅ Tablet (768px+)
- ✅ Mobile (320px+) - com ajustes

## ✨ Próximas Melhorias Opcionais

- [ ] Export de relatórios (PDF/CSV)
- [ ] Gráficos interativos com Recharts
- [ ] Upload real de imagens
- [ ] Notificações em tempo real
- [ ] Dark mode
- [ ] Histórico de alterações (audit log)
- [ ] Backup automático

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Tailwind CSS
- Lucide Icons
- React Router

**Backend:**
- Node.js / Express
- Prisma ORM
- Middleware de autenticação
- Validação de dados

## 📞 Suporte

Para dúvidas sobre a dashboard, consulte a documentação do código ou adicione comentários explicativos.

---

**Desenvolvido com ❤️ para Surface Streetwear**
