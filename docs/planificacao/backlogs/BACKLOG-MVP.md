# Backlog MVP Canónico (BK)

## Header
- `doc_id`: `BACKLOG-MVP`
- `path`: `docs/planificacao/backlogs/BACKLOG-MVP.md`
- `area`: `project`
- `owner`: `Aline`
- `status`: `ativo`
- `last_updated`: `2026-04-12`

## Legenda
- Prioridade: `P0` (crítico), `P1` (importante), `P2` (melhoria).
- Estado: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Esforço: `S` (1-2 dias), `M` (3-5 dias), `L` (6-8 dias).
- Política de estados: não alterar estado operacional sem pedido explícito.

## Matriz canónica única (fonte base)
| bk_id | macro | título | owner | apoio | prioridade | estado | esforço | dependências | rf_rnf | slug_alvo | fase_documental | próximo_bk_recomendado |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BK-MF0-01 | MF0 | Governança documental e standards de execução | Aline | Bruna | P0 | TODO | M | - | RF01-RF44, RNF19, RNF22 | governanca-documental-e-standards | Fase 1 | BK-MF0-02 |
| BK-MF0-02 | MF0 | Setup de repositório, ambientes e pipelines base | Izelicks | Bruna | P0 | TODO | M | BK-MF0-01 | RNF19-RNF22 | setup-repositorio-ambientes-pipelines | Fase 1 | BK-MF0-03 |
| BK-MF0-03 | MF0 | Modelo de dados base e convenções de API | Bruna | Izelicks | P0 | TODO | M | BK-MF0-02 | RF03, RF07, RF13, RF27, RNF19 | modelo-dados-base-convencoes-api | Fase 1 | BK-MF0-04 |
| BK-MF0-04 | MF0 | Baseline de segurança técnica (auth, sessão e HTTPS) | Bruna | Izelicks | P0 | TODO | M | BK-MF0-02 | RF01, RF02, RNF09, RNF10, RNF14 | baseline-seguranca-auth-sessao-https | Fase 1 | BK-MF1-01 |
| BK-MF1-01 | MF1 | Registo, login, logout e roles iniciais | Bruna | Izelicks | P0 | TODO | M | BK-MF0-04 | RF01, RF02, RF05, RNF10, RNF14 | registo-login-logout-roles-iniciais | Fase 1 | BK-MF1-02 |
| BK-MF1-02 | MF1 | Perfil personalizado com edição e preferências base | Izelicks | Aline | P0 | TODO | M | BK-MF1-01 | RF03, RF04, RF06, RNF01, RNF03 | perfil-personalizado-edicao-preferencias | Fase 1 | BK-MF1-03 |
| BK-MF1-03 | MF1 | Alergias, restrições e regras de segurança de recomendação | Izelicks | Bruna | P0 | TODO | S | BK-MF1-02 | RF40, RNF24 | alergias-restricoes-regras-recomendacao | Fase 1 | BK-MF1-04 |
| BK-MF1-04 | MF1 | Gestão administrativa de contas (ativar, suspender, eliminar) | Daniel Bulica | Bruna | P1 | TODO | M | BK-MF1-01 | RF33, RNF13 | gestao-admin-contas | Fase 1 | BK-MF2-01 |
| BK-MF2-01 | MF2 | Catálogo: CRUD de produtos, categorias e stock inicial | Bruna | Daniel Bulica | P0 | TODO | M | BK-MF0-03, BK-MF1-04 | RF07, RF08, RNF19 | catalogo-crud-produtos-categorias-stock | Fase 1 | BK-MF2-02 |
| BK-MF2-02 | MF2 | Pesquisa, filtros e página de detalhe de produto | Izelicks | Aline | P0 | TODO | M | BK-MF2-01 | RF09, RF10, RNF01, RNF06 | pesquisa-filtros-detalhe-produto | Fase 1 | BK-MF2-03 |
| BK-MF2-03 | MF2 | Avaliações de produto e moderação de conteúdo | Daniel Bulica | Aline | P1 | TODO | S | BK-MF2-02, BK-MF1-04 | RF11, RF34, RNF03 | avaliacoes-produto-moderacao | Fase 1 | BK-MF2-04 |
| BK-MF2-04 | MF2 | Produtos semelhantes e complementares no catálogo | Izelicks | Bruna | P1 | TODO | S | BK-MF2-02 | RF12, RNF23 | produtos-semelhantes-complementares | Fase 1 | BK-MF3-01 |
| BK-MF3-01 | MF3 | Upload de fotografia com consentimento e armazenamento seguro | Izelicks | Bruna | P0 | TODO | M | BK-MF1-02 | RF13, RNF11, RNF12 | upload-fotografia-consentimento-seguro | Fase 1 | BK-MF3-02 |
| BK-MF3-02 | MF3 | Pipeline de análise IA e integração com serviço externo | Bruna | Izelicks | P0 | TODO | L | BK-MF3-01, BK-MF0-02 | RF14, RNF05, RNF18 | pipeline-analise-ia-integracao-externa | Fase 1 | BK-MF3-03 |
| BK-MF3-03 | MF3 | Relatório personalizado com explicabilidade de recomendações | Bruna | Aline | P0 | TODO | M | BK-MF3-02 | RF15, RNF23 | relatorio-personalizado-explicabilidade | Fase 1 | BK-MF3-04 |
| BK-MF3-04 | MF3 | Histórico de análises e evolução temporal | Izelicks | Daniel Bulica | P1 | TODO | M | BK-MF3-03 | RF16, RF17, RF25 | historico-analises-evolucao-temporal | Fase 1 | BK-MF4-01 |
| BK-MF4-01 | MF4 | Motor de recomendação personalizada com motivo de sugestão | Bruna | Izelicks | P0 | TODO | L | BK-MF3-03, BK-MF2-02 | RF18, RF19, RNF24 | motor-recomendacao-personalizada-motivo | Fase 2 | BK-MF4-02 |
| BK-MF4-02 | MF4 | Feedback útil/não relevante para refinar recomendações | Daniel Bulica | Bruna | P2 | TODO | S | BK-MF4-01 | RF20, RNF23 | feedback-util-nao-relevante | Fase 2 | BK-MF4-03 |
| BK-MF4-03 | MF4 | Rotinas diárias e alertas personalizados | Izelicks | Aline | P1 | TODO | M | BK-MF4-01 | RF21, RF37, RNF03 | rotinas-diarias-alertas-personalizados | Fase 2 | BK-MF4-04 |
| BK-MF4-04 | MF4 | Revisão manual das recomendações por consultor | Aline | Bruna | P2 | TODO | S | BK-MF4-01, BK-MF1-01 | RF22, RNF23 | revisao-manual-recomendacoes-consultor | Fase 2 | BK-MF5-01 |
| BK-MF5-01 | MF5 | Carrinho de compras e gestão de itens | Daniel Bulica | Izelicks | P0 | TODO | S | BK-MF2-02, BK-MF1-01 | RF26, RNF06 | carrinho-compras-gestao-itens | Fase 2 | BK-MF5-02 |
| BK-MF5-02 | MF5 | Checkout, encomendas e integração de pagamentos | Bruna | Izelicks | P0 | TODO | L | BK-MF5-01 | RF27, RNF09, RNF17 | checkout-encomendas-integracao-pagamentos | Fase 2 | BK-MF5-03 |
| BK-MF5-03 | MF5 | Histórico de compras e recompra rápida | Izelicks | Daniel Bulica | P1 | TODO | M | BK-MF5-02 | RF28, RF30, RNF01 | historico-compras-recompra-rapida | Fase 2 | BK-MF5-04 |
| BK-MF5-04 | MF5 | Devoluções e trocas com rastreio do motivo | Daniel Bulica | Aline | P2 | TODO | S | BK-MF5-03 | RF29, RNF03 | devolucoes-trocas-rastreio-motivo | Fase 2 | BK-MF6-01 |
| BK-MF6-01 | MF6 | Dashboard administrativo com métricas operacionais | Aline | Bruna | P1 | TODO | M | BK-MF5-02, BK-MF3-03 | RF31, RNF20 | dashboard-admin-metricas-operacionais | Fase 2 | BK-MF6-02 |
| BK-MF6-02 | MF6 | Gestão de stock com alertas automáticos | Izelicks | Daniel Bulica | P0 | TODO | M | BK-MF2-01, BK-MF5-02 | RF32, RNF20 | gestao-stock-alertas-automaticos | Fase 2 | BK-MF6-03 |
| BK-MF6-03 | MF6 | Exportação de dados e relatórios em PDF/Excel | Aline | Izelicks | P1 | TODO | S | BK-MF6-01 | RF35, RNF16 | exportacao-dados-relatorios-pdf-excel | Fase 2 | BK-MF6-04 |
| BK-MF6-04 | MF6 | Campanhas e códigos promocionais | Aline | Izelicks | P1 | TODO | M | BK-MF2-01, BK-MF5-02 | RF42, RF43, RNF01 | campanhas-codigos-promocionais | Fase 2 | BK-MF7-01 |
| BK-MF7-01 | MF7 | Notificações transacionais e preferências de comunicação | Izelicks | Aline | P0 | TODO | M | BK-MF5-02, BK-MF1-02 | RF36, RF39, RNF03 | notificacoes-transacionais-preferencias | Fase 3 | BK-MF7-02 |
| BK-MF7-02 | MF7 | Chat interno cliente-consultor | Daniel Bulica | Aline | P2 | TODO | M | BK-MF1-01 | RF38, RNF06 | chat-interno-cliente-consultor | Fase 3 | BK-MF7-03 |
| BK-MF7-03 | MF7 | Simulação virtual antes/depois | Bruna | Aline | P1 | TODO | M | BK-MF3-01, BK-MF2-02 | RF23, RF24, RNF05 | simulacao-virtual-antes-depois | Fase 3 | BK-MF7-04 |
| BK-MF7-04 | MF7 | Privacidade operacional e auditoria biométrica | Bruna | Aline | P0 | TODO | M | BK-MF3-01, BK-MF1-04 | RF41, RF44, RNF13, RNF25 | privacidade-operacional-auditoria-biometrica | Fase 3 | BK-MF8-01 |
| BK-MF8-01 | MF8 | Performance, otimização de imagens e testes de carga | Bruna | Izelicks | P0 | TODO | M | BK-MF3-02, BK-MF5-02 | RNF05, RNF06, RNF07, RNF08 | performance-otimizacao-imagens-carga | Fase 3 | BK-MF8-02 |
| BK-MF8-02 | MF8 | Compatibilidade cross-browser e acessibilidade visual | Aline | Daniel Bulica | P1 | TODO | M | BK-MF2-02, BK-MF7-03 | RNF01, RNF02, RNF03, RNF04, RNF15 | compatibilidade-cross-browser-acessibilidade | Fase 3 | BK-MF8-03 |
| BK-MF8-03 | MF8 | Observabilidade, backups e separação de ambientes | Daniel Bulica | Izelicks | P1 | TODO | M | BK-MF0-02 | RNF20, RNF21, RNF22 | observabilidade-backups-ambientes | Fase 3 | BK-MF8-04 |
| BK-MF8-04 | MF8 | Hardening final, testes negativos e preparação da defesa | Aline | Bruna | P0 | TODO | M | BK-MF8-01, BK-MF8-02, BK-MF8-03, BK-MF7-04 | RF01-RF44, RNF09-RNF25 | hardening-final-testes-negativos-defesa | Fase 3 | - |

## Snapshot por macro
| Macro | Total BK | P0 | P1 | P2 |
| :-- | --: | --: | --: | --: |
| MF0 | 4 | 4 | 0 | 0 |
| MF1 | 4 | 3 | 1 | 0 |
| MF2 | 4 | 2 | 2 | 0 |
| MF3 | 4 | 3 | 1 | 0 |
| MF4 | 4 | 1 | 1 | 2 |
| MF5 | 4 | 2 | 1 | 1 |
| MF6 | 4 | 1 | 3 | 0 |
| MF7 | 4 | 2 | 1 | 1 |
| MF8 | 4 | 2 | 2 | 0 |

## Ligação BK -> guia -> estado documental
| BK | Guia BK | Estado documental |
| :-- | :-- | :-- |
| BK-MF0-01 | [BK-MF0-01 - Governança documental e standards de execução](../guias-bk/MF0/BK-MF0-01-governanca-documental-e-standards.md) | `ativo` |
| BK-MF0-02 | [BK-MF0-02 - Setup de repositório, ambientes e pipelines base](../guias-bk/MF0/BK-MF0-02-setup-repositorio-ambientes-pipelines.md) | `ativo` |
| BK-MF0-03 | [BK-MF0-03 - Modelo de dados base e convenções de API](../guias-bk/MF0/BK-MF0-03-modelo-dados-base-convencoes-api.md) | `ativo` |
| BK-MF0-04 | [BK-MF0-04 - Baseline de segurança técnica (auth, sessão e HTTPS)](../guias-bk/MF0/BK-MF0-04-baseline-seguranca-auth-sessao-https.md) | `ativo` |
| BK-MF1-01 | [BK-MF1-01 - Registo, login, logout e roles iniciais](../guias-bk/MF1/BK-MF1-01-registo-login-logout-roles-iniciais.md) | `ativo` |
| BK-MF1-02 | [BK-MF1-02 - Perfil personalizado com edição e preferências base](../guias-bk/MF1/BK-MF1-02-perfil-personalizado-edicao-preferencias.md) | `ativo` |
| BK-MF1-03 | [BK-MF1-03 - Alergias, restrições e regras de segurança de recomendação](../guias-bk/MF1/BK-MF1-03-alergias-restricoes-regras-recomendacao.md) | `ativo` |
| BK-MF1-04 | [BK-MF1-04 - Gestão administrativa de contas (ativar, suspender, eliminar)](../guias-bk/MF1/BK-MF1-04-gestao-admin-contas.md) | `ativo` |
| BK-MF2-01 | [BK-MF2-01 - Catálogo: CRUD de produtos, categorias e stock inicial](../guias-bk/MF2/BK-MF2-01-catalogo-crud-produtos-categorias-stock.md) | `ativo` |
| BK-MF2-02 | [BK-MF2-02 - Pesquisa, filtros e página de detalhe de produto](../guias-bk/MF2/BK-MF2-02-pesquisa-filtros-detalhe-produto.md) | `ativo` |
| BK-MF2-03 | [BK-MF2-03 - Avaliações de produto e moderação de conteúdo](../guias-bk/MF2/BK-MF2-03-avaliacoes-produto-moderacao.md) | `ativo` |
| BK-MF2-04 | [BK-MF2-04 - Produtos semelhantes e complementares no catálogo](../guias-bk/MF2/BK-MF2-04-produtos-semelhantes-complementares.md) | `ativo` |
| BK-MF3-01 | [BK-MF3-01 - Upload de fotografia com consentimento e armazenamento seguro](../guias-bk/MF3/BK-MF3-01-upload-fotografia-consentimento-seguro.md) | `ativo` |
| BK-MF3-02 | [BK-MF3-02 - Pipeline de análise IA e integração com serviço externo](../guias-bk/MF3/BK-MF3-02-pipeline-analise-ia-integracao-externa.md) | `ativo` |
| BK-MF3-03 | [BK-MF3-03 - Relatório personalizado com explicabilidade de recomendações](../guias-bk/MF3/BK-MF3-03-relatorio-personalizado-explicabilidade.md) | `ativo` |
| BK-MF3-04 | [BK-MF3-04 - Histórico de análises e evolução temporal](../guias-bk/MF3/BK-MF3-04-historico-analises-evolucao-temporal.md) | `ativo` |
| BK-MF4-01 | [BK-MF4-01 - Motor de recomendação personalizada com motivo de sugestão](../guias-bk/MF4/BK-MF4-01-motor-recomendacao-personalizada-motivo.md) | `ativo` |
| BK-MF4-02 | [BK-MF4-02 - Feedback útil/não relevante para refinar recomendações](../guias-bk/MF4/BK-MF4-02-feedback-util-nao-relevante.md) | `ativo` |
| BK-MF4-03 | [BK-MF4-03 - Rotinas diárias e alertas personalizados](../guias-bk/MF4/BK-MF4-03-rotinas-diarias-alertas-personalizados.md) | `ativo` |
| BK-MF4-04 | [BK-MF4-04 - Revisão manual das recomendações por consultor](../guias-bk/MF4/BK-MF4-04-revisao-manual-recomendacoes-consultor.md) | `ativo` |
| BK-MF5-01 | [BK-MF5-01 - Carrinho de compras e gestão de itens](../guias-bk/MF5/BK-MF5-01-carrinho-compras-gestao-itens.md) | `ativo` |
| BK-MF5-02 | [BK-MF5-02 - Checkout, encomendas e integração de pagamentos](../guias-bk/MF5/BK-MF5-02-checkout-encomendas-integracao-pagamentos.md) | `ativo` |
| BK-MF5-03 | [BK-MF5-03 - Histórico de compras e recompra rápida](../guias-bk/MF5/BK-MF5-03-historico-compras-recompra-rapida.md) | `ativo` |
| BK-MF5-04 | [BK-MF5-04 - Devoluções e trocas com rastreio do motivo](../guias-bk/MF5/BK-MF5-04-devolucoes-trocas-rastreio-motivo.md) | `ativo` |
| BK-MF6-01 | [BK-MF6-01 - Dashboard administrativo com métricas operacionais](../guias-bk/MF6/BK-MF6-01-dashboard-admin-metricas-operacionais.md) | `ativo` |
| BK-MF6-02 | [BK-MF6-02 - Gestão de stock com alertas automáticos](../guias-bk/MF6/BK-MF6-02-gestao-stock-alertas-automaticos.md) | `ativo` |
| BK-MF6-03 | [BK-MF6-03 - Exportação de dados e relatórios em PDF/Excel](../guias-bk/MF6/BK-MF6-03-exportacao-dados-relatorios-pdf-excel.md) | `ativo` |
| BK-MF6-04 | [BK-MF6-04 - Campanhas e códigos promocionais](../guias-bk/MF6/BK-MF6-04-campanhas-codigos-promocionais.md) | `ativo` |
| BK-MF7-01 | [BK-MF7-01 - Notificações transacionais e preferências de comunicação](../guias-bk/MF7/BK-MF7-01-notificacoes-transacionais-preferencias.md) | `ativo` |
| BK-MF7-02 | [BK-MF7-02 - Chat interno cliente-consultor](../guias-bk/MF7/BK-MF7-02-chat-interno-cliente-consultor.md) | `ativo` |
| BK-MF7-03 | [BK-MF7-03 - Simulação virtual antes/depois](../guias-bk/MF7/BK-MF7-03-simulacao-virtual-antes-depois.md) | `ativo` |
| BK-MF7-04 | [BK-MF7-04 - Privacidade operacional e auditoria biométrica](../guias-bk/MF7/BK-MF7-04-privacidade-operacional-auditoria-biometrica.md) | `ativo` |
| BK-MF8-01 | [BK-MF8-01 - Performance, otimização de imagens e testes de carga](../guias-bk/MF8/BK-MF8-01-performance-otimizacao-imagens-carga.md) | `ativo` |
| BK-MF8-02 | [BK-MF8-02 - Compatibilidade cross-browser e acessibilidade visual](../guias-bk/MF8/BK-MF8-02-compatibilidade-cross-browser-acessibilidade.md) | `ativo` |
| BK-MF8-03 | [BK-MF8-03 - Observabilidade, backups e separação de ambientes](../guias-bk/MF8/BK-MF8-03-observabilidade-backups-ambientes.md) | `ativo` |
| BK-MF8-04 | [BK-MF8-04 - Hardening final, testes negativos e preparação da defesa](../guias-bk/MF8/BK-MF8-04-hardening-final-testes-negativos-defesa.md) | `ativo` |

## MF0 - Governança e fundações técnicas
| bk_id | título | owner | apoio | prioridade | estado | esforço | dependências | rf_rnf | próximo BK |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BK-MF0-01 | Governança documental e standards de execução | Aline | Bruna | P0 | TODO | M | - | RF01-RF44, RNF19, RNF22 | BK-MF0-02 |
| BK-MF0-02 | Setup de repositório, ambientes e pipelines base | Izelicks | Bruna | P0 | TODO | M | BK-MF0-01 | RNF19-RNF22 | BK-MF0-03 |
| BK-MF0-03 | Modelo de dados base e convenções de API | Bruna | Izelicks | P0 | TODO | M | BK-MF0-02 | RF03, RF07, RF13, RF27, RNF19 | BK-MF0-04 |
| BK-MF0-04 | Baseline de segurança técnica (auth, sessão e HTTPS) | Bruna | Izelicks | P0 | TODO | M | BK-MF0-02 | RF01, RF02, RNF09, RNF10, RNF14 | BK-MF1-01 |

## MF1 - Identidade, autenticação e perfis
| bk_id | título | owner | apoio | prioridade | estado | esforço | dependências | rf_rnf | próximo BK |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BK-MF1-01 | Registo, login, logout e roles iniciais | Bruna | Izelicks | P0 | TODO | M | BK-MF0-04 | RF01, RF02, RF05, RNF10, RNF14 | BK-MF1-02 |
| BK-MF1-02 | Perfil personalizado com edição e preferências base | Izelicks | Aline | P0 | TODO | M | BK-MF1-01 | RF03, RF04, RF06, RNF01, RNF03 | BK-MF1-03 |
| BK-MF1-03 | Alergias, restrições e regras de segurança de recomendação | Izelicks | Bruna | P0 | TODO | S | BK-MF1-02 | RF40, RNF24 | BK-MF1-04 |
| BK-MF1-04 | Gestão administrativa de contas (ativar, suspender, eliminar) | Daniel Bulica | Bruna | P1 | TODO | M | BK-MF1-01 | RF33, RNF13 | BK-MF2-01 |

## MF2 - Catálogo e experiência de produto
| bk_id | título | owner | apoio | prioridade | estado | esforço | dependências | rf_rnf | próximo BK |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BK-MF2-01 | Catálogo: CRUD de produtos, categorias e stock inicial | Bruna | Daniel Bulica | P0 | TODO | M | BK-MF0-03, BK-MF1-04 | RF07, RF08, RNF19 | BK-MF2-02 |
| BK-MF2-02 | Pesquisa, filtros e página de detalhe de produto | Izelicks | Aline | P0 | TODO | M | BK-MF2-01 | RF09, RF10, RNF01, RNF06 | BK-MF2-03 |
| BK-MF2-03 | Avaliações de produto e moderação de conteúdo | Daniel Bulica | Aline | P1 | TODO | S | BK-MF2-02, BK-MF1-04 | RF11, RF34, RNF03 | BK-MF2-04 |
| BK-MF2-04 | Produtos semelhantes e complementares no catálogo | Izelicks | Bruna | P1 | TODO | S | BK-MF2-02 | RF12, RNF23 | BK-MF3-01 |

## MF3 - Análise facial e relatório com IA
| bk_id | título | owner | apoio | prioridade | estado | esforço | dependências | rf_rnf | próximo BK |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BK-MF3-01 | Upload de fotografia com consentimento e armazenamento seguro | Izelicks | Bruna | P0 | TODO | M | BK-MF1-02 | RF13, RNF11, RNF12 | BK-MF3-02 |
| BK-MF3-02 | Pipeline de análise IA e integração com serviço externo | Bruna | Izelicks | P0 | TODO | L | BK-MF3-01, BK-MF0-02 | RF14, RNF05, RNF18 | BK-MF3-03 |
| BK-MF3-03 | Relatório personalizado com explicabilidade de recomendações | Bruna | Aline | P0 | TODO | M | BK-MF3-02 | RF15, RNF23 | BK-MF3-04 |
| BK-MF3-04 | Histórico de análises e evolução temporal | Izelicks | Daniel Bulica | P1 | TODO | M | BK-MF3-03 | RF16, RF17, RF25 | BK-MF4-01 |

## MF4 - Recomendação personalizada e consultoria
| bk_id | título | owner | apoio | prioridade | estado | esforço | dependências | rf_rnf | próximo BK |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BK-MF4-01 | Motor de recomendação personalizada com motivo de sugestão | Bruna | Izelicks | P0 | TODO | L | BK-MF3-03, BK-MF2-02 | RF18, RF19, RNF24 | BK-MF4-02 |
| BK-MF4-02 | Feedback útil/não relevante para refinar recomendações | Daniel Bulica | Bruna | P2 | TODO | S | BK-MF4-01 | RF20, RNF23 | BK-MF4-03 |
| BK-MF4-03 | Rotinas diárias e alertas personalizados | Izelicks | Aline | P1 | TODO | M | BK-MF4-01 | RF21, RF37, RNF03 | BK-MF4-04 |
| BK-MF4-04 | Revisão manual das recomendações por consultor | Aline | Bruna | P2 | TODO | S | BK-MF4-01, BK-MF1-01 | RF22, RNF23 | BK-MF5-01 |

## MF5 - Commerce, checkout e pós-compra
| bk_id | título | owner | apoio | prioridade | estado | esforço | dependências | rf_rnf | próximo BK |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BK-MF5-01 | Carrinho de compras e gestão de itens | Daniel Bulica | Izelicks | P0 | TODO | S | BK-MF2-02, BK-MF1-01 | RF26, RNF06 | BK-MF5-02 |
| BK-MF5-02 | Checkout, encomendas e integração de pagamentos | Bruna | Izelicks | P0 | TODO | L | BK-MF5-01 | RF27, RNF09, RNF17 | BK-MF5-03 |
| BK-MF5-03 | Histórico de compras e recompra rápida | Izelicks | Daniel Bulica | P1 | TODO | M | BK-MF5-02 | RF28, RF30, RNF01 | BK-MF5-04 |
| BK-MF5-04 | Devoluções e trocas com rastreio do motivo | Daniel Bulica | Aline | P2 | TODO | S | BK-MF5-03 | RF29, RNF03 | BK-MF6-01 |

## MF6 - Operação administrativa e campanhas
| bk_id | título | owner | apoio | prioridade | estado | esforço | dependências | rf_rnf | próximo BK |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BK-MF6-01 | Dashboard administrativo com métricas operacionais | Aline | Bruna | P1 | TODO | M | BK-MF5-02, BK-MF3-03 | RF31, RNF20 | BK-MF6-02 |
| BK-MF6-02 | Gestão de stock com alertas automáticos | Izelicks | Daniel Bulica | P0 | TODO | M | BK-MF2-01, BK-MF5-02 | RF32, RNF20 | BK-MF6-03 |
| BK-MF6-03 | Exportação de dados e relatórios em PDF/Excel | Aline | Izelicks | P1 | TODO | S | BK-MF6-01 | RF35, RNF16 | BK-MF6-04 |
| BK-MF6-04 | Campanhas e códigos promocionais | Aline | Izelicks | P1 | TODO | M | BK-MF2-01, BK-MF5-02 | RF42, RF43, RNF01 | BK-MF7-01 |

## MF7 - Comunicação, privacidade e simulação
| bk_id | título | owner | apoio | prioridade | estado | esforço | dependências | rf_rnf | próximo BK |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BK-MF7-01 | Notificações transacionais e preferências de comunicação | Izelicks | Aline | P0 | TODO | M | BK-MF5-02, BK-MF1-02 | RF36, RF39, RNF03 | BK-MF7-02 |
| BK-MF7-02 | Chat interno cliente-consultor | Daniel Bulica | Aline | P2 | TODO | M | BK-MF1-01 | RF38, RNF06 | BK-MF7-03 |
| BK-MF7-03 | Simulação virtual antes/depois | Bruna | Aline | P1 | TODO | M | BK-MF3-01, BK-MF2-02 | RF23, RF24, RNF05 | BK-MF7-04 |
| BK-MF7-04 | Privacidade operacional e auditoria biométrica | Bruna | Aline | P0 | TODO | M | BK-MF3-01, BK-MF1-04 | RF41, RF44, RNF13, RNF25 | BK-MF8-01 |

## MF8 - Qualidade final, performance e defesa
| bk_id | título | owner | apoio | prioridade | estado | esforço | dependências | rf_rnf | próximo BK |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BK-MF8-01 | Performance, otimização de imagens e testes de carga | Bruna | Izelicks | P0 | TODO | M | BK-MF3-02, BK-MF5-02 | RNF05, RNF06, RNF07, RNF08 | BK-MF8-02 |
| BK-MF8-02 | Compatibilidade cross-browser e acessibilidade visual | Aline | Daniel Bulica | P1 | TODO | M | BK-MF2-02, BK-MF7-03 | RNF01, RNF02, RNF03, RNF04, RNF15 | BK-MF8-03 |
| BK-MF8-03 | Observabilidade, backups e separação de ambientes | Daniel Bulica | Izelicks | P1 | TODO | M | BK-MF0-02 | RNF20, RNF21, RNF22 | BK-MF8-04 |
| BK-MF8-04 | Hardening final, testes negativos e preparação da defesa | Aline | Bruna | P0 | TODO | M | BK-MF8-01, BK-MF8-02, BK-MF8-03, BK-MF7-04 | RF01-RF44, RNF09-RNF25 | - |

## Integridade do backlog (pass/fail)
- `PASS`: cada `bk_id` aparece uma única vez.
- `PASS`: cada `bk_id` tem owner único.
- `PASS`: todas as dependências apontam para BK existente.

## Changelog
- **2026-04-12** - Backlog canónico criado com 36 BK e links 1:1 para guias.
