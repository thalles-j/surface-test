# Surface — Relatório QA (Backend)

## Resumo Executivo

| Métrica               | Valor                                          |
| --------------------- | ---------------------------------------------- |
| **Arquivos de teste** | 8                                              |
| **Total de testes**   | 150                                            |
| **Testes passando**   | 150 ✅                                         |
| **Testes falhando**   | 0                                              |
| **Cobertura**         | Business rules, services, middlewares, helpers |
| **Framework**         | Vitest 4.1.2                                   |
| **Tempo de execução** | ~1.25s                                         |

---

## Estrutura de Testes

```
tests/
├── helpers/
│   └── prismaMock.js          # Factory de mock do Prisma Client
├── unit/
│   ├── orderStatus.test.js    # 40 testes — transições de status
│   ├── couponService.test.js  # 13 testes — applyCoupon (porcentagem, fixo, edge cases)
│   ├── apiResponseAndErrors.test.js  # 16 testes — sucesso(), erro(), error classes
│   └── emailService.test.js   # 12 testes — templates + sendMail preview mode
├── integration/
│   ├── orderAndCoupon.test.js  # 26 testes — validateStock, validateCoupon, shipping, getOrderById
│   ├── auth.test.js            # 16 testes — login, register, JWT middleware, admin/owner checks
│   ├── salesService.test.js    # 20 testes — updateOrderStatus, createInPersonSale, bulk, items, address
│   └── storeStatus.test.js    # 7 testes — checkStoreActive, early access, cache
└── FRONTEND_CHECKLIST.md       # Checklist manual com 90+ cenários
```

---

## O Que Cada Suite Testa

### Unit Tests

#### `orderStatus.test.js` (40 testes)

- ✅ Constantes ORDER_STATUS (8 status, incluindo legados)
- ✅ STATUS_LABELS para cada status
- ✅ `isValidTransition()` — 10 transições válidas, 15 inválidas, edge cases
- ✅ `getAllStatuses()` — array completo
- ✅ `getNextStatuses()` — cada status retorna próximos corretos
- ✅ Status legados: processando → [enviado, finalizado, cancelado], concluido → []

#### `couponService.test.js` (13 testes)

- ✅ Cupom porcentagem: 10%, 50%, 100%, >100% (capped)
- ✅ Cupom fixo: menor que subtotal, maior que subtotal, igual
- ✅ Arredondamento para 2 casas decimais
- ✅ Tipo desconhecido retorna 0
- ✅ Subtotal 0 retorna 0
- ✅ Aceita strings numéricas (coerção)

#### `apiResponseAndErrors.test.js` (16 testes)

- ✅ `sucesso()` — status 200 default, status custom, spread de data
- ✅ `erro()` — status 400 default, status custom
- ✅ `ErroBase` — defaults, custom, instanceof Error, enviarResposta()
- ✅ `ErroValidation` — status 400, herança de ErroBase
- ✅ `ErroAuth`, `ErroTokenExpirado`, `ErroTokenInvalido`, `ErroSemToken` — status 401
- ✅ `ErroRole` — status 403, herança de ErroBase

#### `emailService.test.js` (12 testes)

- ✅ Template `orderConfirmation` — HTML válido, dados inseridos
- ✅ Template `orderStatusUpdate` — labels corretos, mensagens por status
- ✅ Template `welcome` — nome e email no HTML
- ✅ Template `passwordReset` — URL de reset no HTML
- ✅ `sendMail` preview mode (sem provider) → retorna { status: 'preview' }
- ✅ `sendMail` sem destinatário → retorna { status: 'skipped' }
- ✅ `safeSend` wrapper nunca lança exceção

### Integration Tests

#### `orderAndCoupon.test.js` (26 testes)

- ✅ `validateStock` — estoque suficiente, produto inexistente, variação inexistente, estoque insuficiente, produto sem variações, múltiplos erros acumulados
- ✅ `validateCoupon` — cupom válido, código vazio/null, não encontrado, inativo, expirado, limite atingido, sem validade, sem limite, normalização uppercase/trim
- ✅ `calculateShipping` — frete padrão, frete grátis (threshold atingido/excedido), sem configurações, frete null, sem threshold
- ✅ `getOrderById` — dono acessa, admin acessa outro, não-dono rejeitado, pedido inexistente

#### `auth.test.js` (16 testes)

- ✅ `loginService` — credenciais válidas retorna token+usuario, JWT contém claims corretas, email inexistente, senha incorreta
- ✅ `registerService` — registro com sucesso (token, role 2, hash), sem telefone, email duplicado
- ✅ `authMiddleware` — token válido atribui req.user, sem token, token inválido, token expirado
- ✅ `adminMiddleware` — permite admin (role 1), rejeita role 2, rejeita sem user
- ✅ `isOwnerOrAdmin` — admin acessa tudo, dono acessa seu recurso, não-dono rejeitado

#### `salesService.test.js` (20 testes)

- ✅ `updateOrderStatus` — transição válida, status inválido, transição inválida (pendente→enviado), pedido não encontrado
- ✅ `createInPersonSale` — sem nome, sem items, items vazio, produto inexistente, estoque insuficiente, variação inexistente, venda com sucesso (status=finalizado, origem=presencial)
- ✅ `bulkUpdateOrderStatus` — sem IDs, status inválido, atualiza/ignora corretamente
- ✅ `updateOrderItems` — sem items, item incompleto, pedido inexistente
- ✅ `updateOrderAddress` — sem endereço, pedido inexistente, sucesso

#### `storeStatus.test.js` (7 testes)

- ✅ Loja ativa permite acesso
- ✅ Loja desativada retorna 503
- ✅ Early access liberado permite acesso
- ✅ Early access não liberado bloqueia
- ✅ Config null (fallback seguro) permite acesso
- ✅ Erro do Prisma (catch) permite acesso
- ✅ `invalidateStoreStatusCache` limpa e recarrega do DB

---

## Regras de Negócio Validadas

| Regra                                                    | Testes | Status |
| -------------------------------------------------------- | ------ | ------ |
| Status só transiciona conforme mapa definido             | 25+    | ✅     |
| Status legados (processando, concluido) funcionam        | 4      | ✅     |
| Cupom: porcentagem calculada corretamente                | 6      | ✅     |
| Cupom: fixo limitado ao subtotal                         | 3      | ✅     |
| Cupom: validação (ativo, não expirado, limite de uso)    | 8      | ✅     |
| Frete grátis acima do threshold configurado              | 3      | ✅     |
| Estoque validado antes de criar pedido                   | 5      | ✅     |
| Acesso baseado em role (admin/customer/owner)            | 6      | ✅     |
| JWT: geração, verificação, expiração                     | 4      | ✅     |
| Email fire-and-forget nunca quebra fluxo principal       | 2      | ✅     |
| Venda presencial: status finalizado, origem presencial   | 1      | ✅     |
| Early access: bypass de manutenção para emails liberados | 2      | ✅     |
| Cache do middleware de status (30s TTL)                  | 1      | ✅     |

---

## Bugs Encontrados Durante os Testes

Nenhum bug funcional foi encontrado no código de produção. Os 4 erros iniciais na execução dos testes eram todos problemas na escrita dos testes, não no código:

1. **Template passwordReset** — subject usa "senha" minúsculo (correto no código, teste corrigido)
2. **sendMail mock** — vi.mock bloqueava importação real, corrigido com `vi.importActual`
3. **createInPersonSale mock** — transaction precisava de mock explícito para `movimentacoes_estoque`

---

## Recomendações para Próximas Fases

1. **Testes E2E** — Considerar Playwright/Cypress para fluxos completos (cadastro → compra → admin)
2. **Coverage report** — Rodar `npx vitest run --coverage` para métricas de cobertura
3. **Testes de pagamento** — Quando integrar gateway (Stripe/Mercado Pago)
4. **Load testing** — Validar transações atômicas sob concorrência
5. **Testes de upload** — Multer + foto management (requer filesystem mock)

---

## Como Rodar

```bash
cd backend
npm test          # executa uma vez
npm run test:watch # modo watch (reexecuta ao salvar)
```
