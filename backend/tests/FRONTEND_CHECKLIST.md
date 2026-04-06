# Surface — Checklist de Testes Manuais (Frontend)

> Execute cada cenário marcando ✅ ou ❌. Documente bugs encontrados no final.

---

## 1. Cadastro & Login

| #    | Cenário                                                   | Resultado |
| ---- | --------------------------------------------------------- | --------- |
| 1.1  | Criar conta com nome, email, senha e telefone válidos     | ☐         |
| 1.2  | Verificar redirecionamento após cadastro                  | ☐         |
| 1.3  | Login com credenciais válidas                             | ☐         |
| 1.4  | Login com email inexistente → mensagem de erro            | ☐         |
| 1.5  | Login com senha incorreta → mensagem de erro              | ☐         |
| 1.6  | Cadastro com email já existente → mensagem de erro        | ☐         |
| 1.7  | Cadastro sem telefone → mensagem de erro                  | ☐         |
| 1.8  | Logout → limpa token e redireciona                        | ☐         |
| 1.9  | Acessar rota protegida sem login → redireciona para login | ☐         |
| 1.10 | Token expirado → redireciona para login                   | ☐         |

---

## 2. Loja / Shop

| #   | Cenário                                      | Resultado |
| --- | -------------------------------------------- | --------- |
| 2.1 | Página de produtos carrega sem erros         | ☐         |
| 2.2 | Produtos "ocultos" NÃO aparecem na listagem  | ☐         |
| 2.3 | Filtro por categoria funciona corretamente   | ☐         |
| 2.4 | Busca por nome de produto retorna resultados | ☐         |
| 2.5 | Ordenação (preço, nome, recentes) funciona   | ☐         |
| 2.6 | Clicar no produto abre página de detalhe     | ☐         |
| 2.7 | Imagem principal aparece na listagem         | ☐         |
| 2.8 | Preço exibido corretamente (formatação R$)   | ☐         |

---

## 3. Detalhe do Produto

| #   | Cenário                                                  | Resultado |
| --- | -------------------------------------------------------- | --------- |
| 3.1 | Informações do produto carregam (nome, preço, descrição) | ☐         |
| 3.2 | Galeria de fotos funciona (clique p/ ampliar)            | ☐         |
| 3.3 | Seleção de tamanho habilita o botão de compra            | ☐         |
| 3.4 | Tamanho sem estoque aparece desabilitado                 | ☐         |
| 3.5 | Botão "Adicionar ao carrinho" funciona                   | ☐         |
| 3.6 | Quantidade pode ser alterada (1 até estoque)             | ☐         |

---

## 4. Carrinho

| #   | Cenário                                             | Resultado |
| --- | --------------------------------------------------- | --------- |
| 4.1 | Drawer do carrinho abre ao adicionar item           | ☐         |
| 4.2 | Itens listados com nome, tamanho, quantidade, preço | ☐         |
| 4.3 | Alterar quantidade atualiza subtotal                | ☐         |
| 4.4 | Remover item funciona                               | ☐         |
| 4.5 | Carrinho vazio exibe mensagem adequada              | ☐         |
| 4.6 | Subtotal calculado corretamente                     | ☐         |
| 4.7 | Carrinho persiste após reload (localStorage)        | ☐         |

---

## 5. Checkout

| #    | Cenário                                            | Resultado |
| ---- | -------------------------------------------------- | --------- |
| 5.1  | Página de checkout carrega com itens do carrinho   | ☐         |
| 5.2  | Campos de endereço são exibidos                    | ☐         |
| 5.3  | Aplicar cupom válido → desconto aparece            | ☐         |
| 5.4  | Aplicar cupom inválido → mensagem de erro          | ☐         |
| 5.5  | Aplicar cupom expirado → mensagem de erro          | ☐         |
| 5.6  | Frete calculado corretamente                       | ☐         |
| 5.7  | Frete grátis quando acima do threshold             | ☐         |
| 5.8  | Total = subtotal - desconto + frete                | ☐         |
| 5.9  | Finalizar pedido com dados válidos → sucesso       | ☐         |
| 5.10 | Redirect para WhatsApp após pedido (se aplicável)  | ☐         |
| 5.11 | Checkout sem login → redireciona para login        | ☐         |
| 5.12 | Checkout com carrinho vazio → mensagem             | ☐         |
| 5.13 | Estoque insuficiente no momento do checkout → erro | ☐         |

---

## 6. Perfil do Usuário

| #   | Cenário                                           | Resultado |
| --- | ------------------------------------------------- | --------- |
| 6.1 | Dados do perfil carregam corretamente             | ☐         |
| 6.2 | Editar nome/telefone funciona                     | ☐         |
| 6.3 | Histórico de pedidos lista todos os pedidos       | ☐         |
| 6.4 | Status dos pedidos exibidos corretamente          | ☐         |
| 6.5 | Detalhe do pedido abre com itens, subtotal, total | ☐         |

---

## 7. Early Access

| #   | Cenário                                          | Resultado |
| --- | ------------------------------------------------ | --------- |
| 7.1 | Com loja desativada, exibe página de manutenção  | ☐         |
| 7.2 | Data de abertura exibida (se configurada)        | ☐         |
| 7.3 | Email liberado para early access → acessa a loja | ☐         |
| 7.4 | Email não liberado → bloqueado                   | ☐         |

---

## 8. Admin — Dashboard

| #   | Cenário                                        | Resultado |
| --- | ---------------------------------------------- | --------- |
| 8.1 | Dashboard carrega sem erros                    | ☐         |
| 8.2 | KPIs exibidos (receita, pedidos, ticket médio) | ☐         |
| 8.3 | Gráfico de tendência de receita                | ☐         |
| 8.4 | Top produtos vendidos                          | ☐         |
| 8.5 | Acesso negado para usuário não-admin           | ☐         |

---

## 9. Admin — Produtos

| #    | Cenário                                             | Resultado |
| ---- | --------------------------------------------------- | --------- |
| 9.1  | Listar todos os produtos (incluindo ocultos)        | ☐         |
| 9.2  | Criar produto com nome, preço, categoria, descrição | ☐         |
| 9.3  | Upload de foto funciona (drag & drop)               | ☐         |
| 9.4  | Marcar foto como principal                          | ☐         |
| 9.5  | Deletar foto                                        | ☐         |
| 9.6  | Adicionar variação (tamanho + estoque)              | ☐         |
| 9.7  | Produto com estoque 0 → status muda para inativo    | ☐         |
| 9.8  | Editar produto existente                            | ☐         |
| 9.9  | Slug gerado automaticamente                         | ☐         |
| 9.10 | Nome duplicado → mensagem de erro                   | ☐         |
| 9.11 | Ações em massa: ativar/desativar/ocultar/destacar   | ☐         |

---

## 10. Admin — Vendas / Pedidos

| #     | Cenário                                               | Resultado |
| ----- | ----------------------------------------------------- | --------- |
| 10.1  | Listar pedidos com paginação                          | ☐         |
| 10.2  | Filtrar pedidos por status                            | ☐         |
| 10.3  | Filtrar por período (data início/fim)                 | ☐         |
| 10.4  | Buscar por nome do cliente                            | ☐         |
| 10.5  | Alterar status com transição válida → sucesso         | ☐         |
| 10.6  | Alterar status com transição inválida → mensagem      | ☐         |
| 10.7  | Editar itens do pedido → recalcula total              | ☐         |
| 10.8  | Editar endereço de entrega                            | ☐         |
| 10.9  | Histórico do pedido mostra mudanças                   | ☐         |
| 10.10 | Criar venda presencial → status "finalizado"          | ☐         |
| 10.11 | Venda presencial reduz estoque                        | ☐         |
| 10.12 | Aggregates (receita total, ticket médio, finalizados) | ☐         |
| 10.13 | Atualização em massa de status                        | ☐         |

---

## 11. Admin — Clientes

| #    | Cenário                                        | Resultado |
| ---- | ---------------------------------------------- | --------- |
| 11.1 | Listar clientes                                | ☐         |
| 11.2 | Detalhe do cliente (avatar, métricas, pedidos) | ☐         |
| 11.3 | Criar cupom para cliente                       | ☐         |

---

## 12. Admin — Marketing / Cupons

| #    | Cenário                  | Resultado |
| ---- | ------------------------ | --------- |
| 12.1 | Listar cupons existentes | ☐         |
| 12.2 | Criar cupom porcentagem  | ☐         |
| 12.3 | Criar cupom fixo         | ☐         |
| 12.4 | Cupom com validade       | ☐         |
| 12.5 | Cupom com limite de usos | ☐         |
| 12.6 | Ativar/desativar cupom   | ☐         |

---

## 13. Admin — Configurações

| #    | Cenário                           | Resultado |
| ---- | --------------------------------- | --------- |
| 13.1 | Configurações da loja carregam    | ☐         |
| 13.2 | Alterar valor do frete            | ☐         |
| 13.3 | Alterar threshold de frete grátis | ☐         |
| 13.4 | Ativar/desativar loja             | ☐         |
| 13.5 | Ativar/desativar early access     | ☐         |
| 13.6 | Definir data de abertura          | ☐         |

---

## 14. Responsividade & UX

| #    | Cenário                                        | Resultado |
| ---- | ---------------------------------------------- | --------- |
| 14.1 | Layout mobile (< 768px) — header, menu, footer | ☐         |
| 14.2 | Layout tablet (768–1024px)                     | ☐         |
| 14.3 | Layout desktop (> 1024px)                      | ☐         |
| 14.4 | Dark mode consistente em todas as páginas      | ☐         |
| 14.5 | Animações não quebram em mobile                | ☐         |
| 14.6 | Loading states visíveis durante requisições    | ☐         |
| 14.7 | Toast/alert para ações com feedback            | ☐         |

---

## Bugs Encontrados

| #   | Descrição | Severidade | Status |
| --- | --------- | ---------- | ------ |
|     |           |            |        |

---

_Gerado automaticamente. Última atualização: <!-- data -->_
