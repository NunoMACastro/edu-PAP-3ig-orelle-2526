# Plano de Implementação Total (MF0..MF8)

## Header
- `doc_id`: `PLANO-IMPLEMENTACAO-TOTAL`
- `path`: `docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-12`

## Objetivo
Definir um plano macro executável e auditável, com gates de saída por macrofase e sequência de entrega coerente com RF/RNF e backlog BK.

## Assunções
- O backlog BK é a fonte operacional única para execução.
- O estado operacional dos BK permanece em `TODO` até pedido explícito para alteração.
- Decisões técnicas em aberto ficam registadas como `a definir no BK dependente` quando faltar detalhe.
- A prioridade de implementação segue `P0 > P1 > P2`.

## Tabela macro MF0..MF8
| Macro | Nome | Objetivo de saída | Fase documental | RF/RNF foco |
| :-- | :-- | :-- | :-- | :-- |
| MF0 | Governança e fundações técnicas | Entrega validada pelos BK da macro | Fase 1 | RNF19-RNF22, RF01-RF02 |
| MF1 | Identidade, autenticação e perfis | Entrega validada pelos BK da macro | Fase 1 | RF01-RF06, RF33, RF40 |
| MF2 | Catálogo e experiência de produto | Entrega validada pelos BK da macro | Fase 1 | RF07-RF12, RF34 |
| MF3 | Análise facial e relatório com IA | Entrega validada pelos BK da macro | Fase 1 | RF13-RF17, RNF05, RNF11, RNF12, RNF23 |
| MF4 | Recomendação personalizada e consultoria | Entrega validada pelos BK da macro | Fase 2 | RF18-RF22, RF37, RNF24 |
| MF5 | Commerce, checkout e pós-compra | Entrega validada pelos BK da macro | Fase 2 | RF26-RF30, RNF17 |
| MF6 | Operação administrativa e campanhas | Entrega validada pelos BK da macro | Fase 2 | RF31-RF35, RF42-RF43, RNF16 |
| MF7 | Comunicação, privacidade e simulação | Entrega validada pelos BK da macro | Fase 3 | RF23-RF24, RF36, RF38-RF39, RF41, RF44, RNF25 |
| MF8 | Qualidade final, performance e defesa | Entrega validada pelos BK da macro | Fase 3 | RNF01-RNF08, RNF15, RNF20-RNF22 |

## MF0 - Governança e fundações técnicas
### Owners por stream
- Produto/Processo: `Aline`
- Backend e dados: `Bruna`, `Izelicks`
- Frontend/UX: `Aline`, `Izelicks`
- QA e evidência: `Daniel Bulica` com apoio de `Aline` e `Bruna`
### Step-by-step macro
1. Validar dependências dos BK da macro no backlog e nos guias BK.
2. Decompor BK em tarefas técnicas e confirmar owner único por BK.
3. Executar incrementos curtos com smoke local e evidência mínima.
4. Fechar critérios de aceite por BK e sincronizar estado documental.
5. Preparar handoff para a macro seguinte com riscos e pendências.
### Gate de saída
- Todos os BK da macro têm guia 1:1 e critérios de aceite validados.
- Sem dependências pendentes para BK marcado como pronto.
- Evidence de PR/defesa preparada para cada BK da macro.
- Próxima macro desbloqueada sem ambiguidades de sequência.
### BK desta macro
- [BK-MF0-01 - Governança documental e standards de execução](guias-bk/MF0/BK-MF0-01-governanca-documental-e-standards.md)
- [BK-MF0-02 - Setup de repositório, ambientes e pipelines base](guias-bk/MF0/BK-MF0-02-setup-repositorio-ambientes-pipelines.md)
- [BK-MF0-03 - Modelo de dados base e convenções de API](guias-bk/MF0/BK-MF0-03-modelo-dados-base-convencoes-api.md)
- [BK-MF0-04 - Baseline de segurança técnica (auth, sessão e HTTPS)](guias-bk/MF0/BK-MF0-04-baseline-seguranca-auth-sessao-https.md)

## MF1 - Identidade, autenticação e perfis
### Owners por stream
- Produto/Processo: `Aline`
- Backend e dados: `Bruna`, `Izelicks`
- Frontend/UX: `Aline`, `Izelicks`
- QA e evidência: `Daniel Bulica` com apoio de `Aline` e `Bruna`
### Step-by-step macro
1. Validar dependências dos BK da macro no backlog e nos guias BK.
2. Decompor BK em tarefas técnicas e confirmar owner único por BK.
3. Executar incrementos curtos com smoke local e evidência mínima.
4. Fechar critérios de aceite por BK e sincronizar estado documental.
5. Preparar handoff para a macro seguinte com riscos e pendências.
### Gate de saída
- Todos os BK da macro têm guia 1:1 e critérios de aceite validados.
- Sem dependências pendentes para BK marcado como pronto.
- Evidence de PR/defesa preparada para cada BK da macro.
- Próxima macro desbloqueada sem ambiguidades de sequência.
### BK desta macro
- [BK-MF1-01 - Registo, login, logout e roles iniciais](guias-bk/MF1/BK-MF1-01-registo-login-logout-roles-iniciais.md)
- [BK-MF1-02 - Perfil personalizado com edição e preferências base](guias-bk/MF1/BK-MF1-02-perfil-personalizado-edicao-preferencias.md)
- [BK-MF1-03 - Alergias, restrições e regras de segurança de recomendação](guias-bk/MF1/BK-MF1-03-alergias-restricoes-regras-recomendacao.md)
- [BK-MF1-04 - Gestão administrativa de contas (ativar, suspender, eliminar)](guias-bk/MF1/BK-MF1-04-gestao-admin-contas.md)

## MF2 - Catálogo e experiência de produto
### Owners por stream
- Produto/Processo: `Aline`
- Backend e dados: `Bruna`, `Izelicks`
- Frontend/UX: `Aline`, `Izelicks`
- QA e evidência: `Daniel Bulica` com apoio de `Aline` e `Bruna`
### Step-by-step macro
1. Validar dependências dos BK da macro no backlog e nos guias BK.
2. Decompor BK em tarefas técnicas e confirmar owner único por BK.
3. Executar incrementos curtos com smoke local e evidência mínima.
4. Fechar critérios de aceite por BK e sincronizar estado documental.
5. Preparar handoff para a macro seguinte com riscos e pendências.
### Gate de saída
- Todos os BK da macro têm guia 1:1 e critérios de aceite validados.
- Sem dependências pendentes para BK marcado como pronto.
- Evidence de PR/defesa preparada para cada BK da macro.
- Próxima macro desbloqueada sem ambiguidades de sequência.
### BK desta macro
- [BK-MF2-01 - Catálogo: CRUD de produtos, categorias e stock inicial](guias-bk/MF2/BK-MF2-01-catalogo-crud-produtos-categorias-stock.md)
- [BK-MF2-02 - Pesquisa, filtros e página de detalhe de produto](guias-bk/MF2/BK-MF2-02-pesquisa-filtros-detalhe-produto.md)
- [BK-MF2-03 - Avaliações de produto e moderação de conteúdo](guias-bk/MF2/BK-MF2-03-avaliacoes-produto-moderacao.md)
- [BK-MF2-04 - Produtos semelhantes e complementares no catálogo](guias-bk/MF2/BK-MF2-04-produtos-semelhantes-complementares.md)

## MF3 - Análise facial e relatório com IA
### Owners por stream
- Produto/Processo: `Aline`
- Backend e dados: `Bruna`, `Izelicks`
- Frontend/UX: `Aline`, `Izelicks`
- QA e evidência: `Daniel Bulica` com apoio de `Aline` e `Bruna`
### Step-by-step macro
1. Validar dependências dos BK da macro no backlog e nos guias BK.
2. Decompor BK em tarefas técnicas e confirmar owner único por BK.
3. Executar incrementos curtos com smoke local e evidência mínima.
4. Fechar critérios de aceite por BK e sincronizar estado documental.
5. Preparar handoff para a macro seguinte com riscos e pendências.
### Gate de saída
- Todos os BK da macro têm guia 1:1 e critérios de aceite validados.
- Sem dependências pendentes para BK marcado como pronto.
- Evidence de PR/defesa preparada para cada BK da macro.
- Próxima macro desbloqueada sem ambiguidades de sequência.
### BK desta macro
- [BK-MF3-01 - Upload de fotografia com consentimento e armazenamento seguro](guias-bk/MF3/BK-MF3-01-upload-fotografia-consentimento-seguro.md)
- [BK-MF3-02 - Pipeline de análise IA e integração com serviço externo](guias-bk/MF3/BK-MF3-02-pipeline-analise-ia-integracao-externa.md)
- [BK-MF3-03 - Relatório personalizado com explicabilidade de recomendações](guias-bk/MF3/BK-MF3-03-relatorio-personalizado-explicabilidade.md)
- [BK-MF3-04 - Histórico de análises e evolução temporal](guias-bk/MF3/BK-MF3-04-historico-analises-evolucao-temporal.md)

## MF4 - Recomendação personalizada e consultoria
### Owners por stream
- Produto/Processo: `Aline`
- Backend e dados: `Bruna`, `Izelicks`
- Frontend/UX: `Aline`, `Izelicks`
- QA e evidência: `Daniel Bulica` com apoio de `Aline` e `Bruna`
### Step-by-step macro
1. Validar dependências dos BK da macro no backlog e nos guias BK.
2. Decompor BK em tarefas técnicas e confirmar owner único por BK.
3. Executar incrementos curtos com smoke local e evidência mínima.
4. Fechar critérios de aceite por BK e sincronizar estado documental.
5. Preparar handoff para a macro seguinte com riscos e pendências.
### Gate de saída
- Todos os BK da macro têm guia 1:1 e critérios de aceite validados.
- Sem dependências pendentes para BK marcado como pronto.
- Evidence de PR/defesa preparada para cada BK da macro.
- Próxima macro desbloqueada sem ambiguidades de sequência.
### BK desta macro
- [BK-MF4-01 - Motor de recomendação personalizada com motivo de sugestão](guias-bk/MF4/BK-MF4-01-motor-recomendacao-personalizada-motivo.md)
- [BK-MF4-02 - Feedback útil/não relevante para refinar recomendações](guias-bk/MF4/BK-MF4-02-feedback-util-nao-relevante.md)
- [BK-MF4-03 - Rotinas diárias e alertas personalizados](guias-bk/MF4/BK-MF4-03-rotinas-diarias-alertas-personalizados.md)
- [BK-MF4-04 - Revisão manual das recomendações por consultor](guias-bk/MF4/BK-MF4-04-revisao-manual-recomendacoes-consultor.md)

## MF5 - Commerce, checkout e pós-compra
### Owners por stream
- Produto/Processo: `Aline`
- Backend e dados: `Bruna`, `Izelicks`
- Frontend/UX: `Aline`, `Izelicks`
- QA e evidência: `Daniel Bulica` com apoio de `Aline` e `Bruna`
### Step-by-step macro
1. Validar dependências dos BK da macro no backlog e nos guias BK.
2. Decompor BK em tarefas técnicas e confirmar owner único por BK.
3. Executar incrementos curtos com smoke local e evidência mínima.
4. Fechar critérios de aceite por BK e sincronizar estado documental.
5. Preparar handoff para a macro seguinte com riscos e pendências.
### Gate de saída
- Todos os BK da macro têm guia 1:1 e critérios de aceite validados.
- Sem dependências pendentes para BK marcado como pronto.
- Evidence de PR/defesa preparada para cada BK da macro.
- Próxima macro desbloqueada sem ambiguidades de sequência.
### BK desta macro
- [BK-MF5-01 - Carrinho de compras e gestão de itens](guias-bk/MF5/BK-MF5-01-carrinho-compras-gestao-itens.md)
- [BK-MF5-02 - Checkout, encomendas e integração de pagamentos](guias-bk/MF5/BK-MF5-02-checkout-encomendas-integracao-pagamentos.md)
- [BK-MF5-03 - Histórico de compras e recompra rápida](guias-bk/MF5/BK-MF5-03-historico-compras-recompra-rapida.md)
- [BK-MF5-04 - Devoluções e trocas com rastreio do motivo](guias-bk/MF5/BK-MF5-04-devolucoes-trocas-rastreio-motivo.md)

## MF6 - Operação administrativa e campanhas
### Owners por stream
- Produto/Processo: `Aline`
- Backend e dados: `Bruna`, `Izelicks`
- Frontend/UX: `Aline`, `Izelicks`
- QA e evidência: `Daniel Bulica` com apoio de `Aline` e `Bruna`
### Step-by-step macro
1. Validar dependências dos BK da macro no backlog e nos guias BK.
2. Decompor BK em tarefas técnicas e confirmar owner único por BK.
3. Executar incrementos curtos com smoke local e evidência mínima.
4. Fechar critérios de aceite por BK e sincronizar estado documental.
5. Preparar handoff para a macro seguinte com riscos e pendências.
### Gate de saída
- Todos os BK da macro têm guia 1:1 e critérios de aceite validados.
- Sem dependências pendentes para BK marcado como pronto.
- Evidence de PR/defesa preparada para cada BK da macro.
- Próxima macro desbloqueada sem ambiguidades de sequência.
### BK desta macro
- [BK-MF6-01 - Dashboard administrativo com métricas operacionais](guias-bk/MF6/BK-MF6-01-dashboard-admin-metricas-operacionais.md)
- [BK-MF6-02 - Gestão de stock com alertas automáticos](guias-bk/MF6/BK-MF6-02-gestao-stock-alertas-automaticos.md)
- [BK-MF6-03 - Exportação de dados e relatórios em PDF/Excel](guias-bk/MF6/BK-MF6-03-exportacao-dados-relatorios-pdf-excel.md)
- [BK-MF6-04 - Campanhas e códigos promocionais](guias-bk/MF6/BK-MF6-04-campanhas-codigos-promocionais.md)

## MF7 - Comunicação, privacidade e simulação
### Owners por stream
- Produto/Processo: `Aline`
- Backend e dados: `Bruna`, `Izelicks`
- Frontend/UX: `Aline`, `Izelicks`
- QA e evidência: `Daniel Bulica` com apoio de `Aline` e `Bruna`
### Step-by-step macro
1. Validar dependências dos BK da macro no backlog e nos guias BK.
2. Decompor BK em tarefas técnicas e confirmar owner único por BK.
3. Executar incrementos curtos com smoke local e evidência mínima.
4. Fechar critérios de aceite por BK e sincronizar estado documental.
5. Preparar handoff para a macro seguinte com riscos e pendências.
### Gate de saída
- Todos os BK da macro têm guia 1:1 e critérios de aceite validados.
- Sem dependências pendentes para BK marcado como pronto.
- Evidence de PR/defesa preparada para cada BK da macro.
- Próxima macro desbloqueada sem ambiguidades de sequência.
### BK desta macro
- [BK-MF7-01 - Notificações transacionais e preferências de comunicação](guias-bk/MF7/BK-MF7-01-notificacoes-transacionais-preferencias.md)
- [BK-MF7-02 - Chat interno cliente-consultor](guias-bk/MF7/BK-MF7-02-chat-interno-cliente-consultor.md)
- [BK-MF7-03 - Simulação virtual antes/depois](guias-bk/MF7/BK-MF7-03-simulacao-virtual-antes-depois.md)
- [BK-MF7-04 - Privacidade operacional e auditoria biométrica](guias-bk/MF7/BK-MF7-04-privacidade-operacional-auditoria-biometrica.md)

## MF8 - Qualidade final, performance e defesa
### Owners por stream
- Produto/Processo: `Aline`
- Backend e dados: `Bruna`, `Izelicks`
- Frontend/UX: `Aline`, `Izelicks`
- QA e evidência: `Daniel Bulica` com apoio de `Aline` e `Bruna`
### Step-by-step macro
1. Validar dependências dos BK da macro no backlog e nos guias BK.
2. Decompor BK em tarefas técnicas e confirmar owner único por BK.
3. Executar incrementos curtos com smoke local e evidência mínima.
4. Fechar critérios de aceite por BK e sincronizar estado documental.
5. Preparar handoff para a macro seguinte com riscos e pendências.
### Gate de saída
- Todos os BK da macro têm guia 1:1 e critérios de aceite validados.
- Sem dependências pendentes para BK marcado como pronto.
- Evidence de PR/defesa preparada para cada BK da macro.
- Próxima macro desbloqueada sem ambiguidades de sequência.
### BK desta macro
- [BK-MF8-01 - Performance, otimização de imagens e testes de carga](guias-bk/MF8/BK-MF8-01-performance-otimizacao-imagens-carga.md)
- [BK-MF8-02 - Compatibilidade cross-browser e acessibilidade visual](guias-bk/MF8/BK-MF8-02-compatibilidade-cross-browser-acessibilidade.md)
- [BK-MF8-03 - Observabilidade, backups e separação de ambientes](guias-bk/MF8/BK-MF8-03-observabilidade-backups-ambientes.md)
- [BK-MF8-04 - Hardening final, testes negativos e preparação da defesa](guias-bk/MF8/BK-MF8-04-hardening-final-testes-negativos-defesa.md)

## Changelog
- **2026-04-12** - Plano macro criado com MF0..MF8, gates e links para BK.
