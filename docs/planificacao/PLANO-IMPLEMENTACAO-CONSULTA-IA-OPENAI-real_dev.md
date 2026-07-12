# Plano vivo de implementação — Consulta cosmética OpenAI (`real_dev`)

## 1. Metadados e regras de execução

- **Início:** 2026-07-11 (Europe/Lisbon)
- **Agente coordenador:** Codex `/root`
- **Estado global:** `CONCLUIDO_COM_BLOCKERS_EXTERNOS`
- **Scope de runtime:** `real_dev/api` e `real_dev/web`
- **Scope documental final:** `README.md` e `docs`
- **Fora de scope:** `apps/`
- **Node:** `v24.11.1`
- **npm:** `11.6.2`
- **Lock API (SHA-256):** `043baf15c773fbc61859a975a16ce56848f7bf75df80e7b947f6bba087c85b73`
- **Lock web (SHA-256):** `f39eb47b1eac5bcf26b81d2441bb237ee007f6ce73f27a573ba567ee134c5a03`
- **Pagamento:** exclusivamente simulado; nunca existe cobrança, gateway ou chamada financeira externa.
- **MongoDB:** testes e migrações usam apenas replica set efémero/local; o `.env` remoto não é carregado.
- **Git:** não criar commits sem autorização explícita.

### Regras obrigatórias de acompanhamento

1. Ler este report no início de cada turno e após compactação de contexto.
2. Atualizar a fase para `EM_IMPLEMENTACAO` antes de alterar o respetivo código.
3. Acrescentar evidência depois de cada alteração material e validação; não substituir falhas anteriores.
4. Registar data, CWD, comando, exit code e resumo sanitizado, sem segredos, cookies, PII, fotografias ou URI MongoDB.
5. Apenas o coordenador edita este ficheiro; subagentes devolvem evidência ao coordenador.
6. Preservar alterações preexistentes e nunca tocar em `apps/`.
7. Não marcar validações ambientais como `PASS`.
8. Não concluir sem reauditoria integral no mesmo estado do código.

Estados usados: `ABERTO`, `EM_ANALISE`, `PLANEADO`, `EM_IMPLEMENTACAO`, `PRONTO_PARA_RETESTE`, `VALIDADO`, `FECHADO`, `BLOQUEADO_EXTERNO`, `REABERTO`, `ACEITE_RISCO`.

## 2. Contrato funcional fechado

Fluxo canónico:

`objetivos → consentimento → fotografias → qualidade → análise OpenAI → 5–8 perguntas → catálogo filtrado → relatório → revisão humana opcional → versão congelada → pagamento simulado de 10% → voucher → simulação de maquilhagem a pedido`

Decisões:

- IA de runtime exclusivamente OpenAI, sem modos `demo` ou `external`.
- Modelos configuráveis com defaults `gpt-5.4-mini`, `gpt-5.4` e `gpt-image-2`.
- Sete objetivos: acne, hidratação/barreira, oleosidade, sensibilidade/vermelhidão, manchas/tom/luminosidade, proteção solar e maquilhagem.
- Um objetivo principal e até dois secundários.
- Cinco a oito perguntas estruturadas e persistidas.
- Revisão humana opcional antes do congelamento; fotografias só com grant explícito por relatório.
- Simulação de maquilhagem apenas após desbloqueio, a pedido e através da OpenAI.
- Objetivos não-maquilhagem nunca fabricam uma pele futura.
- Produtos sem stock podem ser explicados no relatório, mas não entram na base dos 10%.
- Sem produtos disponíveis: relatório desbloqueado sem pagamento e sem voucher de valor zero.

## 3. Baseline e proteção de dados

### 3.1 Baseline conhecido

- Árvore combinada `src/tests` inspecionada: 437 ficheiros API/web.
- Suite anterior documentada: 42 ficheiros / 311 testes API; deve ser medida novamente antes do fecho.
- Frontend anterior documentado: build de 95 módulos; deve ser medido novamente antes do fecho.
- Catálogo seed atual: 25 produtos definidos de forma idempotente.
- Migrações existentes: `001`–`009`, imutáveis e append-only.
- O worktree documental contém alterações preexistentes extensas; serão preservadas e integradas sem reset.

### 3.2 Invariantes do catálogo

- Proibido usar `deleteMany(Product)`, limpar a coleção ou repor stock como parte desta implementação.
- Migrações `010`–`015` registam contagem, IDs e stock agregado antes/depois.
- Metadata de IA é acrescentada por update/upsert conhecido; produtos desconhecidos ficam `aiEligible=false`.
- A distribuição de stock por variante preserva exatamente o stock agregado do produto.
- Seeds locais são idempotentes e nunca removem produtos que não constem do seed.

### 3.3 Snapshot

- O snapshot recuperável só será criado contra uma base explicitamente local e não será executado se a URI não passar o guard de localidade.
- Em testes, o baseline de proteção é provado através de `MongoMemoryReplSet` e checksums de catálogo antes/depois das migrações.

## 4. Dashboard de implementação

| ID | Área | Estado | Gate |
|---|---|---|---|
| `AI-E2E-00` | Report, baseline e proteção do catálogo | `FECHADO` | G0 |
| `AI-E2E-01` | OpenAI-only, configuração, goals e fallback | `FECHADO` | G1 |
| `AI-E2E-02` | Jobs MongoDB, idempotência e recuperação | `FECHADO` | G1 |
| `AI-E2E-03` | Consentimento v2, fotografia e qualidade | `FECHADO` | G2 |
| `AI-E2E-04` | Conversa de 5–8 perguntas | `FECHADO` | G2 |
| `AI-E2E-05` | Catálogo IA, INCI e variantes | `FECHADO` | G3 |
| `AI-E2E-06` | Relatório, recomendações e allowlist | `FECHADO` | G3 |
| `AI-E2E-07` | Revisão humana e grants de fotografia | `FECHADO` | G4 |
| `AI-E2E-08` | Congelamento, 10%, pagamento simulado e voucher | `FECHADO` | G4 |
| `AI-E2E-09` | Edição OpenAI de maquilhagem | `FECHADO` | G4 |
| `AI-E2E-10` | Fluxo frontend e compatibilidade de rotas | `FECHADO` | G5 |
| `AI-E2E-11` | Privacidade, exports, backup e eliminação | `FECHADO` | G6 |
| `AI-E2E-12` | Testes completos e reauditoria | `FECHADO` | G7 |
| `AI-E2E-13` | Documentação canónica final | `FECHADO` | G7 |

## 5. Plano técnico e critérios por área

### `AI-E2E-01` — OpenAI-only

- Remover configuração/provider/runtime e UI de `demo`/`external`.
- Preservar `fetch`, `AbortSignal`, limite de resposta e validação JSON Schema.
- Capability degradada: a aplicação arranca sem chave e apenas endpoints novos de IA devolvem `503 AI_NOT_CONFIGURED`.
- Retry: uma repetição transitória do modelo primário e uma tentativa do fallback; nenhum resultado sintético.
- Critérios: configuração negativa, fallback, provenance, timeout e pesquisa estática.

### `AI-E2E-02` — Jobs

- Criar jobs `analyze_photos`, `select_next_question`, `generate_report` e `generate_makeup_preview`.
- Claim/lease atómicos, payload apenas por referências, retry conhecido e recuperação após restart.
- Critérios: replay, concorrência, lease expirada, crash e cancelamento por revogação.

### `AI-E2E-03/04` — Fotos e consulta

- Consentimento v2 sem promoção automática.
- Upload atual preservado e endurecido com resolução/luz/blur; preflight browser com MediaPipe local.
- Goal definitions versionadas, uma pergunta por turno, schemas de resposta fechados e CAS.
- Critérios: 5–8 perguntas, retoma, injection, invalidez, `inconclusive` e zero provider call em rejeição técnica.

### `AI-E2E-05/06` — Catálogo e relatório

- Curar os 25 produtos seedados; outros permanecem não elegíveis até revisão admin.
- OpenAI recebe no máximo 15 candidatos e só pode devolver IDs/variantes da allowlist.
- Relatório v2 imutável, recomendações por report/revision/product/variant e teaser sem conteúdo secreto.
- Critérios: alergia, stock, preço, variante, IDs inventados, cobertura limitada e regeneração sem overwrite.

### `AI-E2E-07/08` — Humano e desbloqueio

- Revisão do relatório exato, CAS, clarificação reabrível, retirada antes de decisão e auditoria de leituras.
- Grant fotográfico com expiração máxima de sete dias.
- Snapshot de preços/stock ao congelar; `ceil(total_disponível * 10%)`.
- Pagamento/voucher atómicos e idempotentes; zero disponível não cria voucher zero.

### `AI-E2E-09` — Imagem

- Sem prompt livre; usar apenas o `simulationSpec` congelado.
- Job assíncrono, owner-only/no-store, output WebP cifrado e TTL de sete dias.
- Falha não invalida relatório, desbloqueio ou voucher.

### `AI-E2E-10` — Frontend

- Rotas canónicas `/consulta`, `/consulta/nova`, `/consulta/ativa`, `/consulta/relatorios/:reportId`, `/consulta/historico`, `/consultoria/revisoes`.
- Estado dirigido pelo backend; redirects antigos temporários.
- Chat acessível, preflight, polling retomável, report bloqueado sem payload escondido, revisão, voucher e preview.

### `AI-E2E-11/12/13` — Operação, qualidade e docs

- Novas coleções/bytes entram em privacy requests, account erasure, exports e backup.
- Testes determinísticos usam transport apenas de teste, nunca modo demo de runtime.
- `test:ai:live` é opt-in e não faz parte de `verify:all`.
- Documentação canónica só é sincronizada depois do runtime estabilizar; história é preservada.

## 6. Migrações e compatibilidade

1. `010_openai_only_and_consent_v2`
2. `011_goal_consultation_and_ai_jobs`
3. `012_product_ai_metadata_and_variants`
4. `013_report_v2_and_recommendation_snapshots`
5. `014_report_review_and_unlock_snapshot`
6. `015_photo_quality_and_openai_simulation`

Regras:

- `001`–`009` não são editadas.
- Cada migração suporta dry-run, up e validação pós-migração.
- Dados antigos ficam `legacy/archived`; nunca são apresentados como OpenAI real.
- Unlocks, vouchers e orders antigos não são recalculados.
- Campos cifrados com AAD são decifrados/re-cifrados ao mover; nunca recebem `$rename` cru.
- Endpoints de geração antigos foram desmontados e devolvem `404`; não existe boundary paralelo de compatibilidade.

## 7. Gates

- **G0:** report, baseline e invariantes do catálogo.
- **G1:** OpenAI-only, capability degradada, jobs/retry/fallback.
- **G2:** consentimento, qualidade e conversa retomável.
- **G3:** catálogo/variantes, allowlist e relatório imutável.
- **G4:** revisão, freeze, 10%, voucher e preview.
- **G5:** frontend completo, acessível e responsive.
- **G6:** privacidade, export, backup e eliminação.
- **G7:** API/web/integration/E2E/build/a11y/audit/docs verdes e reauditoria independente.

## 8. Registo cronológico append-only

### 2026-07-11 — Arranque

- **CWD:** raiz do projeto.
- **Comando:** inspeção de `git status`, Node/npm, hashes dos lockfiles e inventário `src/tests`.
- **Exit code:** `0`.
- **Resultado:** baseline registado; alterações documentais anteriores identificadas e preservadas; nenhum código alterado antes deste report.
- **Nota:** a contagem real da BD não foi consultada porque a URI remota é proibida; a preservação será provada em MongoDB efémero/local.

### 2026-07-11 — Início das frentes de implementação

- **CWD:** raiz do projeto.
- **Ação:** fases `AI-E2E-01` a `AI-E2E-11` passaram para `EM_IMPLEMENTACAO`; trabalho dividido entre núcleo OpenAI/consulta, report-commerce e frontend, mantendo este report sob edição exclusiva do coordenador.
- **Exit code:** n/a.
- **Resultado:** scopes de ficheiros separados para reduzir conflitos; `apps/` e documentação canónica continuam intocados nesta fase.

### 2026-07-11 — Pesquisa estática inicial de IA legacy

- **CWD:** raiz do projeto.
- **Comando:** `rg` sobre `real_dev/api` e `real_dev/web`, excluindo dependências/build, para `AI_PROVIDER_MODE`, `demo`, `external`, `safe_svg_preview` e before/after legacy.
- **Exit code:** `0`.
- **Resultado:** 208 ocorrências iniciais, incluindo runtime local/E2E, provider, copy e testes antigos. Esta contagem é baseline de remoção/compatibilidade e não é apresentada como finding final.

### 2026-07-11 — Fonte oficial OpenAI

- **CWD:** raiz do projeto.
- **Comando:** instalação do MCP oficial `openaiDeveloperDocs` após a tentativa sandboxed falhar por permissão.
- **Exit codes:** primeira tentativa `1`; repetição autorizada `0`.
- **Resultado:** conector instalado globalmente e disponível após reinício; a implementação corrente mantém como referência as páginas oficiais já verificadas de Responses API, vision, Structured Outputs e image edits.

### 2026-07-11 — Checkpoint G1: fundação OpenAI/jobs

- **CWD:** `real_dev/api`.
- **Comando:** `node --check` sobre os nove ficheiros do primeiro slice.
- **Exit code:** `0`.
- **Resultado:** configuração OpenAI-only degradada, sete goal definitions, provider Responses primary/retry/fallback e modelo/service de jobs duráveis implementados; o enfileiramento trata corrida `E11000`, leases expirados e TTL de 30 dias para estados terminais.
- **Estado:** `AI-E2E-01/02` permanecem `EM_IMPLEMENTACAO` até handlers, routes, migrações e testes focados.

### 2026-07-11 — Checkpoint G3: catálogo e variantes

- **CWD:** `real_dev/api`.
- **Comandos:** testes focados `mf3.integration`, `cart-concurrency` e `catalog-variants.replset.integration`.
- **Exit codes:** `0` nos resultados comunicados.
- **Resultado:** 25/25 testes de comércio/concorrência e 1/1 caso inicial de variantes passaram. Catálogo, carrinho, order, stock e reorder distinguem `productId + variantId`; pagamento reduz stock agregado e da variante; seed usa `$setOnInsert.stock`, preserva IDs/stock e mantém variantes quando a soma é válida.
- **Reteste pendente:** segundo cenário acrescentado para recusar carrinho legacy sem variante ainda precisa ser reexecutado; `AI-E2E-05` não fecha antes desse reteste e das migrações.

### 2026-07-11 — Reteste catálogo/variantes

- **CWD:** `real_dev/api`.
- **Comando:** `npm test -- tests/catalog-variants.replset.integration.test.js`.
- **Exit code:** `0`.
- **Resultado:** 1 ficheiro, 2/2 testes passaram, incluindo recusa de carrinho legacy sem variante e decremento coerente de stock agregado/variante.
- **Observação:** o script npm ainda continha a variável legacy `AI_PROVIDER_MODE=demo`; a configuração nova já a ignora, mas o script permanece pendente de limpeza no slice OpenAI.

### 2026-07-11 — Privacidade de jobs IA

- **CWD:** `real_dev/api`.
- **Alteração:** `AiJob` foi acrescentado à lista transacional de modelos integralmente pertencentes ao titular em `account-erasure.service.js`.
- **Validação imediata:** pendente de teste de eliminação após os restantes modelos/grants estabilizarem.
- **Risco coberto:** uma eliminação de conta não deixa metadata operacional de jobs ligada ao utilizador.

### 2026-07-11 — Reteste de eliminação de conta

- **CWD:** `real_dev/api`.
- **Comando:** `npm test -- tests/account-erasure.replset.integration.test.js tests/account-erasure.validator.test.js`.
- **Exit code:** `0`.
- **Resultado:** 2 ficheiros, 11/11 testes passaram depois de integrar `AiJob` na eliminação transacional.

### 2026-07-11 — Prova explícita de eliminação de `AiJob`

- **CWD:** `real_dev/api`.
- **Alteração:** a fixture transversal `seedEveryOwnedCollection` passou a inserir também um documento `AiJob` pertencente ao titular.
- **Comando:** `npm test -- tests/account-erasure.replset.integration.test.js`.
- **Exit code:** `0`.
- **Resultado:** 1 ficheiro, 8/8 testes passaram; a cascata agora prova realmente a ausência de jobs IA após eliminação, em vez de depender apenas da lista de código.

### 2026-07-11 — Syntax gate intermédio

- **CWD:** `real_dev/api`.
- **Comando:** `npm run check:syntax`.
- **Exit code:** `0`.
- **Resultado:** 409 ficheiros JS/MJS/CJS passaram durante a integração dos primeiros slices; este resultado é intermédio e será repetido no estado final.

### 2026-07-11 — Transport determinístico de testes

- **CWD:** `real_dev/api`.
- **Alteração:** `OPENAI_TEST_FIXTURE_MODE=true` foi criado exclusivamente para `NODE_ENV=test`; fora de teste provoca erro de configuração e nunca constitui modo de produto ou provenance demo.
- **Resultado:** runtime E2E consegue cobrir análise e próxima pergunta sem internet/chave/créditos; fixtures de relatório e imagem permanecem pendentes de ligação ao respetivo handler.

### 2026-07-11 — Migrações 010/011 implementadas

- **CWD:** `real_dev/api`.
- **Alteração:** `010_openai_only_and_consent_v2` mapeia modos antigos para `legacy_demo`/`legacy_external`, arquiva OpenAI v1 sem o promover a v2 e não promove consentimentos; `011_goal_consultation_and_ai_jobs` arquiva sessões v1, exige reavaliação de qualidade para fotos legacy e prepara índices de sessão/job/fingerprint.
- **Resultado:** ficheiros criados sem alterar `001`–`009` nem o registo canónico, que será composto pelo coordenador quando `012`–`015` existirem.
- **Validação pendente:** dry-run/up/validate conjunto em replica set e invariantes de catálogo.

### 2026-07-11 — Checkpoint relatório/freeze

- **CWD:** `real_dev/api`.
- **Alteração:** handler `generateConsultationReportForJob`, fixture de Structured Output, modelos v2 de relatório/recomendação/unlock, leitura por ID, finalização e freeze imutável foram implementados.
- **Contrato:** 10% calcula apenas recomendações disponíveis; zero produtos disponíveis auto-desbloqueia e o service de voucher não cria voucher de valor zero.
- **Estado:** `AI-E2E-06/08` permanecem `EM_IMPLEMENTACAO` até revalidação transacional de consentimento/perfil, concorrência do freeze, review/grants, worker e testes focados.

### 2026-07-11 — Checkpoint frontend do fluxo canónico

- **CWD:** `real_dev/web`.
- **Alteração:** adapter/model/preflight, dashboard, nova consulta, consulta ativa, relatório, rotas/redirects, navegação por role e títulos foram integrados.
- **Correções durante revisão:** sessão é criada antes de substituir/uploadar fotos; `OPEN_CONSULTATION_EXISTS` retoma `/consulta/ativa`; preflight alinha 5 MiB e lado mínimo de 720 px.
- **Estado:** `AI-E2E-10` permanece `EM_IMPLEMENTACAO`; CSS, histórico/consultor, DTO final, MediaPipe, testes, lint e build continuam pendentes.

### 2026-07-11 — Reteste focado OpenAI, jobs e migração legacy

- **CWD:** `real_dev/api`.
- **Comando:** `npm test -- tests/openai-consultation-core-v2.test.js tests/ai-job-v2.test.js tests/migration-010-openai-only.test.js`.
- **Exit code:** `0`.
- **Resultado:** 3 ficheiros, 14/14 testes passaram. Ficaram provados o provider OpenAI-only com Structured Outputs/retry/fallback, claim/lease/replay dos jobs e o arquivamento explícito de dados `demo`/`external` como legacy sem promoção para OpenAI.
- **Revisão de código:** `FaceAnalysis` passou a usar fingerprint único por sessão/consentimento/fotografias/objetivos e os handlers verificam o `currentJobId`, evitando repetir provider ou transições depois de um replay do worker.
- **Estado:** resultado intermédio; o registo `010`–`015`, worker do servidor e fluxo completo ainda não estão validados.

### 2026-07-11 — Handoff final do núcleo de consulta

- **CWD:** `real_dev/api`.
- **Comandos:** suite focada do núcleo após integrar clarificação e `npm run check:syntax`.
- **Exit codes:** `0` e `0`.
- **Resultado:** 4 ficheiros/15 testes passaram; 425 ficheiros passaram o syntax gate. A resposta a `needs_clarification` fecha a clarificação anterior e cria idempotentemente uma nova revisão de relatório.
- **Risco residual identificado:** o antigo provider `external-skin-analysis.provider.js` deixou de ter import no runtime, mas continua fisicamente presente para testes legacy. Será removido, com substituição dos testes antigos, antes da pesquisa estática final.

### 2026-07-11 — Integração do worker e correção de dependência SVG legacy

- **CWD:** `real_dev/api`.
- **Alteração:** criado um único compositor para os quatro handlers `AiJob`; o servidor inicia-o depois do listener e inclui `worker.stop()` no shutdown idempotente antes de desligar MongoDB.
- **Primeiro comando:** `npm test -- tests/ai-worker-runtime.test.js tests/openai-consultation-core-v2.test.js tests/ai-job-v2.test.js`.
- **Primeiro exit code:** `1`.
- **Falha observada:** o antigo módulo de “antes/depois” ainda importava o provider SVG já removido. A falha não foi apagada nem tratada como ambiental.
- **Correção:** o endpoint legacy `/api/before-after-visualizations` passou a devolver `409 CONSULTATION_REQUIRED`; não foi restaurada qualquer simulação conceptual.
- **Reteste:** o mesmo comando terminou com exit code `0`; 3 ficheiros e 15/15 testes passaram.
- **Estado:** integração do worker permanece `EM_IMPLEMENTACAO` até provar restart/lease com MongoDB e fechar todos os handlers.

### 2026-07-11 — Não regressão do ciclo de vida HTTP/MongoDB

- **CWD:** `real_dev/api`.
- **Comando:** `npm test -- tests/mf6.robustness-security.test.js`.
- **Exit code:** `0`.
- **Resultado:** 1 ficheiro, 20/20 testes passaram depois de integrar o worker, incluindo bind assíncrono, shutdown idempotente, timeout, readiness e segurança de transporte.

### 2026-07-11 — Reauditoria independente do núcleo e hardening imediato

- **CWD:** `real_dev/api`.
- **Findings confirmados:** lease sem heartbeat inferior ao pior tempo da operação; resposta OpenAI apenas desserializada sem validação local do JSON Schema; endpoints de geração legacy ainda ativos; schema visual sem avaliação própria dos sete objetivos; `safetyFlags` não persistidas; chave OpenAI real moderna podia ser herdada pela suite; replays sequenciais de análise/relatório devolviam 409.
- **Alterações:** heartbeat renova o lease opaco; validador JSON Schema local fechado foi acrescentado; endpoints legacy de relatório/recomendação/revisão devolvem `409 CONSULTATION_REQUIRED`; a análise inclui `objectiveAssessments` exatamente para os objetivos selecionados e persiste `safetyFlags`; testes normais limpam `OPENAI_API_KEY` e recusam qualquer chave não marcada como fixture, salvo o smoke live opt-in; análise/submissão reutilizam a operação ou resultado já criado.
- **Primeiro syntax gate:** `npm run check:syntax`, exit code `1`, por import/listagem duplicados de `AiJob` resultantes da integração concorrente da privacidade.
- **Correção e reteste syntax:** duplicação removida; exit code `0`, 436 ficheiros JS/MJS/CJS válidos.
- **Suite focada:** `npm test -- tests/openai-consultation-core-v2.test.js tests/ai-job-v2.test.js tests/ai-worker-runtime.test.js tests/mf8.test-env.contract.test.js`.
- **Exit code:** `0`.
- **Resultado:** 4 ficheiros, 32/32 testes passaram, incluindo os sete objetivos, mismatch de schema, lease, ciclo do worker e isolamento de credenciais.
- **P1 ainda em correção:** consentimento imediatamente antes/depois da geração de relatório e imagem, snapshot da fotografia da simulação e propagação não removível de alertas clínicos foram devolvidos à frente de relatório/comércio.

### 2026-07-11 — Segunda ronda de hardening e remoção do provider legacy

- **CWD:** `real_dev/api`.
- **Alterações:** o provider externo antigo foi eliminado e os respetivos testes foram convertidos para OpenAI-only; Structured Output inválido passa pelas duas tentativas primary e pelo fallback OpenAI; o worker fica em no-op degradado sem configuração, aborta a operação se perder/cancelar o lease e mantém falhas transitórias esgotadas em `failed_retryable` com janelas manuais limitadas; runtime Mongo ligado sem transações falha fechado.
- **Consulta:** tiers explícitos obrigam factos comuns e do objetivo principal antes dos secundários; warnings técnicos das fotos exigem confirmação persistida e ligada ao hash do par; consentimento exige a versão atual do aviso; dados faciais/IA em desenvolvimento exigem uma chave de cifra forte.
- **Operação local:** `.env.example` passou a documentar apenas OpenAI e os quatro timeouts; `seed:local` substituiu o bootstrap com nome ambíguo e o ficheiro `seed-demo.js` foi removido.
- **Comando:** `npm test -- tests/openai-consultation-core-v2.test.js tests/ai-job-v2.test.js tests/ai-worker-runtime.test.js tests/mf8.test-env.contract.test.js tests/mf7.external-ai-provider.test.js tests/mf8.image-purpose-limit.test.js tests/local-dev-runtime.test.js tests/e2e-runtime.core.test.js tests/seed-safety.test.js`.
- **Exit code:** `0`.
- **Resultado:** 9 ficheiros, 73/73 testes passaram; não ocorreu qualquer chamada de rede ou leitura do `.env` remoto.
- **Migrações:** `010`–`015` foram acrescentadas ao registry append-only e à lista E2E; a prova conjunta em replica set está em execução separada.

### 2026-07-11 — Retestes focados de relatório, revisão, imagem e erasure

- **CWD:** `real_dev/api`.
- **Comando 1:** suite focada de consentimento do relatório, consentimento generativo, grant fotográfico, revalidação da revisão, freeze/zero fee, storage da imagem, clarificação e variantes.
- **Exit code:** `0`.
- **Resultado:** 8 ficheiros, 14/14 testes passaram em replica set/isolamento local. A evidência inclui revogação antes/durante provider, `safetyFlags` não descartáveis, fotografia exata da análise, grant revogado com GET 403 auditado, snapshot dos 10%, ausência de voucher zero e output cifrado.
- **Comando 2:** `npm test -- tests/account-erasure.replset.integration.test.js tests/account-erasure.validator.test.js tests/biometric-data-request.replset.integration.test.js`.
- **Exit code:** `0`.
- **Resultado:** os 2 ficheiros existentes selecionados executaram 11/11 testes com sucesso; jobs, grants e outputs de imagem entram na cascata/outbox de eliminação. O terceiro nome não correspondia a um ficheiro publicado e, por isso, não é contado como evidência.

### 2026-07-11 — Primeira suite API integral após o contrato v2

- **CWD:** `real_dev/api`.
- **Comando:** `npm test`.
- **Exit code:** `1`.
- **Resultado:** 96 ficheiros: 73 passaram, 22 falharam e 1 ficou ignorado; 579 testes: 491 passaram, 78 falharam e 10 ficaram ignorados; foram ainda reportados 3 erros não tratados.
- **Classificação:** o resultado é uma falha real e não foi convertido em sucesso. A maioria das falhas pertence a fixtures/testes do contrato substituído (geração direta, provenance `demo`, consentimento v1 e imagens abaixo dos novos 720 px), mas existem também contratos de modularidade/docstrings e uma expectativa de rate limit a reconciliar. A atualização dos testes preservará as garantias de segurança e concorrência em vez de simplesmente os remover.
- **Estado:** `AI-E2E-12` permanece `EM_IMPLEMENTACAO`; a suite integral será repetida depois de cada slice de reconciliação material.

### 2026-07-11 — Correção dos contratos de camadas e quota IA

- **CWD:** `real_dev/api`.
- **Alterações:** constantes de catálogo foram movidas do model para os contratos de domínio; a normalização de `variantId` passou para um utilitário partilhável sem validators importarem services; as unidades públicas v2 receberam JSDoc; a expectativa HTTP foi alinhada com o limite efetivo de 30 pedidos IA por dia, sem alterar a quota funcional de 12 operações por consulta.
- **Primeiro comando:** `npm test -- tests/g1.http-security-rate-limits.test.js tests/mf8.modularidade.contract.test.js`.
- **Primeiro exit code:** `1`; 19 exports v2 sem JSDoc foram enumerados pelo teste e corrigidos.
- **Reteste:** o mesmo comando terminou com exit code `0`; 2 ficheiros e 15/15 testes passaram.

### 2026-07-11 — Remoção dos contratos unitários de preview conceptual

- **CWD:** `real_dev/api`.
- **Alteração:** os testes MF2 deixaram de importar providers removidos de SVG/preview conceptual e passaram a validar o contrato atual: relatório desbloqueado identificado e consentimento generativo pontual/versionado para a edição OpenAI.
- **Comando:** `npm test -- tests/mf2.contracts.test.js`.
- **Exit code:** `0`.
- **Resultado:** 1 ficheiro e 5/5 testes passaram; não foi reintroduzido qualquer fallback visual sintético.

### 2026-07-11 — Reconciliação de concorrência de report e revisão

- **CWD:** `real_dev/api`.
- **Primeiro comando:** suite de `report-payment`, `ai-consultation-review` e `recommendation-review` em replica set.
- **Primeiro exit code:** `1`; 11 testes falharam e 4 foram ignorados porque as fixtures ainda tentavam persistir `analysisMode=demo` e análises sem `photoQuality`/provenance v2.
- **Alteração:** as mesmas provas de 25 replays, rollback e CAS foram preservadas, mas passaram a criar apenas provenance OpenAI e qualidade fotográfica explícita.
- **Reteste:** o mesmo conjunto terminou com exit code `0`; 3 ficheiros e 15/15 testes passaram.

### 2026-07-11 — Reconciliação de fotografias, consentimento e dados sensíveis

- **CWD:** `real_dev/api`.
- **Alterações:** oito suites antigas passaram para consentimento v2, notice/purposes atuais, `FacePhoto.quality` v1, imagens válidas de 960×720, provenance OpenAI e resposta `409 CONSULTATION_REQUIRED` nos endpoints diretos substituídos.
- **Comando 1:** suite focada de upload, lifecycle de consentimento e MF7 consent.
- **Exit code:** `0`; 3 ficheiros e 30/30 testes passaram.
- **Comando 2:** suite focada de substituição, abort, privacy requests, visual privacy e sensitive models.
- **Exit code:** `0`; 5 ficheiros e 21/21 testes passaram.
- **Resultado:** os testes continuam a provar remoção física, abort/rollback, cifra e isolamento; não contêm `face-analysis-v1`, `demo`, `external` ou `aiProviderMode`.

### 2026-07-11 — Contratos unitários da conversa v2

- **CWD:** `real_dev/api`.
- **Primeiro comando:** suite conjunta MF8 antiga e duas integrações de guided consultation.
- **Primeiro exit code:** `1`; 11 testes falharam porque ainda modelavam o wizard v1 e persistiam análises `demo`. A falha das duas integrações permanece aberta para reconciliação separada.
- **Alteração neste slice:** a suite unitária MF8 foi substituída por oito contratos v2 equivalentes: sete objetivos, 1+2 seleção, prioridade common/primary/secondary, pergunta+revision, tipos fechados, prompt injection, warning acknowledgement e superfície HTTP autenticada/degradada.
- **Reteste:** `npm test -- tests/mf8.ai-consultation.test.js`, exit code `0`; 1 ficheiro e 8/8 testes passaram.

### 2026-07-11 — Concorrência real da consulta v2

- **CWD:** `real_dev/api`.
- **Alteração:** a integração do wizard v1 foi substituída por uma prova em `MongoMemoryReplSet` do contrato atual, sem rede: 25 criações preservam uma sessão, 25 arranques reutilizam um job de análise, 25 respostas aceitam apenas um CAS e 25 submissões reutilizam um job de relatório.
- **Comando:** `npm test -- tests/guided-consultation-concurrency.replset.integration.test.js`.
- **Exit code:** `0`.
- **Resultado:** 1 ficheiro e 3/3 testes passaram; contagens de jobs, factos, turnos, `logicalOperations` e `flowState` foram verificadas na base efémera.

### 2026-07-11 — Rollback transacional da consulta v2

- **CWD:** `real_dev/api`.
- **Alteração:** a integração de durabilidade v1 foi substituída por falhas injetadas no contrato v2, depois de criar cada job e antes de transitar a sessão: análise, resposta/pergunta seguinte e submissão de relatório.
- **Comando:** `npm test -- tests/guided-consultation-durability.replset.integration.test.js`.
- **Exit code:** `0`.
- **Resultado:** 1 ficheiro e 3/3 testes passaram; cada transação removeu o job órfão, preservou sessão/factos/turnos e permitiu retry único bem-sucedido.

### 2026-07-11 — Deadline total e limite incremental das respostas OpenAI

- **CWD:** `real_dev/api`.
- **Alterações:** Responses e Image Edit passaram a usar um deadline único para todas as tentativas/sleeps; `Retry-After` é limitado pelo tempo restante; corpos externos são lidos incrementalmente e o stream é cancelado antes de ultrapassar o budget de memória.
- **Primeiro comando focado:** provider/report-image/storage, exit code `1` por `listen EPERM` do MongoDB efémero dentro do sandbox; 19 testes sem porta já tinham passado e a falha foi classificada como ambiental, não como sucesso.
- **Reteste fora do sandbox:** o mesmo conjunto terminou com exit code `0`; 3 ficheiros e 21/21 testes passaram.
- **Teste adicional:** `npm test -- tests/openai-consultation-core-v2.test.js`, exit code `0`; 20/20 testes passaram, incluindo cancelamento real do reader ao exceder 1 MB e prova de que um `Retry-After: 30` não ultrapassa um deadline total de 1 s.
- **Syntax gate:** `npm run check:syntax`, exit code `0`; 439 ficheiros JS/MJS/CJS válidos.

### 2026-07-11 — Reconciliação das integrações MF com endpoints substituídos

- **CWD:** `real_dev/api`.
- **Baseline focado:** 5 ficheiros falharam, com 26 testes falhados, 31 passados e 1 erro não tratado; as expectativas ainda aceitavam generation direta, consentimento v1, imagens 2×2 e provenance demo.
- **Alteração:** análise/relatório/recomendações/revisão individual/before-after passaram a provar `409 CONSULTATION_REQUIRED`; autorização 403 continua anterior ao boundary; a rota direta removida de maquilhagem prova 404 sem efeitos; consentimento e fotografias usam v2/960×720; timeout/abort continuam testados com provider OpenAI injetado.
- **Reteste:** `npm test -- tests/mf1.face.test.js tests/mf2.integration.test.js tests/mf4.integration.test.js tests/mf6.face-analysis-performance.test.js tests/mf8.enriched-recommendations.test.js`, exit code `0`; 5 ficheiros e 56/56 testes passaram.
- **Syntax focal:** `node --check` nos cinco ficheiros, exit code `0`.

### 2026-07-11 — Segunda suite API integral

- **CWD:** `real_dev/api`.
- **Comando:** `npm test`, executado fora do sandbox para permitir portas loopback dos replica sets efémeros.
- **Exit code:** `0`.
- **Resultado:** 97 ficheiros: 96 passaram e 1 ficou explicitamente ignorado; 590 testes: 589 passaram e 1 ficou ignorado. Duração 45,60 s, sem erros não tratados.
- **Comparação:** as 22 suites/78 testes falhados da primeira execução foram reconciliados sem retirar as provas materiais de concorrência, rollback, autorização, privacidade ou cifra.
- **Estado:** é evidência atual do gate API, mas será repetida se migrações ou runtime API sofrerem alterações posteriores.

### 2026-07-11 — Auditoria de dependências API

- **CWD:** `real_dev/api`.
- **Comando:** `npm audit --audit-level=high` com acesso ao advisory database.
- **Exit code:** `0`.
- **Resultado:** `found 0 vulnerabilities`; não existem findings npm conhecidos no lockfile atual.

### 2026-07-11 — Histórico próprio da consulta

- **CWD:** `real_dev/api`.
- **Alteração:** acrescentado `GET /api/ai-consultation/sessions`, autenticado e `no-store`, com paginação limitada e apenas metadata própria; transcript, factos, respostas, fotografias e conteúdo bloqueado nunca entram no DTO.
- **Primeiro reteste:** 3 ficheiros/17 testes, exit code `1`; o getter cifrado de `goalSelection` recusou corretamente uma query que não selecionava internamente o `userId` usado no AAD.
- **Correção:** o owner passou a ser selecionado apenas para decifra no servidor e continua omitido do DTO.
- **Reteste final:** o mesmo comando terminou com exit code `0`; 3 ficheiros e 17/17 testes passaram, incluindo isolamento entre titulares e contrato de modularidade.

### 2026-07-11 — Cálculo inteiro dos 10%

- **CWD:** `real_dev/api`.
- **Alteração:** o depósito deixou de depender de `0.1` em floating point e passou a calcular exatamente `ceil(total × 1000 / 10000)` com inteiros seguros e validação de overflow.
- **Comando:** suite focada de freeze, paywall e modularidade.
- **Exit code:** `0`.
- **Resultado:** 3 ficheiros e 14/14 testes passaram, incluindo `1001 cêntimos → 101 cêntimos`, zero produtos disponíveis e contrato público documentado.

### 2026-07-11 — Migrações 010–015 e proteção do catálogo

- **CWD:** `real_dev/api`.
- **Primeiro run isolado:** 2/4 cenários passaram; aplicação/replay revelaram que as validações 010 e 012 liam fora da própria transação. Foi ainda encontrado um erro sequencial em 013 que degradava `legacy_external` para `legacy_demo`.
- **Correções:** 010/012 recebem a `session` no validate; 013 preserva a provenance legacy já normalizada. `001`–`009` permaneceram inalteradas.
- **Cobertura:** registry/checksums/sourcePath, dry-run sem escrita/lock, aplicação integral e replay `skipped` idempotente.
- **Evidência persistente:** os quatro cenários passaram dentro da suite API integral verde. A fixture prova 3 IDs de produto, `idsHash`, 61 unidades agregadas, variantes `2+4+5+7=18`, variante administrativa com 7, consentimento v1 não promovido e dados demo/external apenas arquivados.

### 2026-07-11 — Runtime MediaPipe totalmente local

- **CWD:** `real_dev/web`.
- **Tentativa offline:** `npm install --offline --save-exact @mediapipe/tasks-vision@0.10.35` falhou com `ENOTCACHED`; a falha não foi apresentada como sucesso.
- **Instalação autorizada:** `npm install --save-exact @mediapipe/tasks-vision@0.10.35`, exit code `0`; 1 package acrescentado e auditoria npm reportou zero vulnerabilidades nesse estado.
- **Assets:** os seis ficheiros WASM do package foram copiados para `public/mediapipe/wasm`; o bundle FaceLandmarker oficial foi guardado em `public/mediapipe/models/face_landmarker.task` com SHA-256 `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`.
- **Contrato:** nenhum CDN é necessário em runtime; a integração dinâmica e os testes frontend continuam em execução.

### 2026-07-11 — Checkpoint de privacy/export/backup v2

- **CWD:** `real_dev/api`.
- **Findings confirmados:** pedidos report/photo deixavam metadata IA v2; account erasure podia deixar audit logs ligados às reviews; export `ai-reports` representava apenas o shape v1; o backup dinâmico não tinha fixture explícita das coleções v2.
- **Alterações intermédias:** privacy report cancela jobs e elimina transacionalmente sessão, histórico, análise, relatório, recomendações, reviews/grants/unlock/simulações/rotinas/comparações e audits, colocando fotos/outputs no mesmo outbox; erasure remove audits por review; export passa a metadata v2 minimizada; backup prova coleções/índices/cifra/restore.
- **Validação intermédia:** um conjunto de 5 ficheiros/49 testes, um conjunto MF5/MF7 de 2 ficheiros/18 testes e um conjunto privacy/storage/grants/migrations de 7 ficheiros/17 testes passaram; syntax gate passou.
- **Estado:** permanece `EM_IMPLEMENTACAO` até integrar o ledger de quota de maquilhagem e concluir a revisão de edge cases.

### 2026-07-11 — `Retry-After` da edição de imagem

- **CWD:** `real_dev/api`.
- **Alteração:** Image Edit passou a interpretar `Retry-After` tanto em segundos como em data HTTP, com máximo de 30 s e sempre limitado pelo deadline total de 150 s/configurado.
- **Comando:** `npm test -- tests/openai-makeup-storage.test.js`.
- **Exit code:** `0`.
- **Resultado:** 1 ficheiro e 2/2 testes passaram; uma resposta 429 com data a +60 s consumiu apenas o 1 s restante do cenário e não iniciou uma segunda chamada fora do deadline.

### 2026-07-11 — Integridade dos assets MediaPipe

- **CWD:** `real_dev/web`.
- **Alteração:** acrescentado contrato que fixa package 0.10.35, existência dos seis assets WASM, paths same-origin, import dinâmico, ausência de URL HTTP no source e checksum do modelo oficial.
- **Comando:** `node --test tests/mediapipeAssets.test.mjs`.
- **Exit code:** `0`.
- **Resultado:** 1/1 teste passou; a aplicação falhará o gate local se package/modelo/WASM forem alterados sem revisão explícita.

### 2026-07-11 — Fecho de privacy/export/backup v2

- **CWD:** `real_dev/api`.
- **Alterações:** account erasure elimina audit logs ligados às reviews do titular; privacy report remove o grafo v2 transacional completo e preserva fotos fonte num pedido exclusivamente de relatório; jobs são cancelados e writes faciais bloqueadas; quota/grants/outputs entram na cascata e outbox; conclusão exige ausência física. Export `ai-reports` contém apenas metadata v2 minimizada de lifecycle/review/unlock/pagamento simulado.
- **Backup:** o runtime genérico já cobria todas as coleções; a integração passou a provar 11 coleções IA, incluindo quota, índices, ciphertext exterior, restore e verify.
- **Falha ambiental preservada:** um rerun sandboxed terminou com exit code `1`, `listen EPERM 0.0.0.0`; o reteste autorizado em loopback não converteu a falha, mas passou os cenários de produto.
- **Evidência:** 5 ficheiros/50 testes; batch de compatibilidade 10 ficheiros/72 testes; backup/modularidade 3 ficheiros/21 testes; export 2 ficheiros/30 testes — todos com exit code `0`. `node --check` dos ficheiros alterados passou.
- **Decisões residuais:** snapshots incluem metadata/envelopes cifrados, não bytes privados de fotos/WebP; um voucher já emitido é preservado como entitlement comercial mesmo quando o unlock fonte é apagado, ficando a ligação histórica minimizada.

### 2026-07-11 — Remoção dos assets conceptuais antigos

- **CWD:** raiz do projeto.
- **Comando:** pesquisa de referências e remoção explícita de `orelle-skin-analysis-before.png` e `orelle-skin-analysis-after.png` depois de as páginas conceptuais deixarem de os importar.
- **Exit code:** `0`.
- **Resultado:** os dois PNG antigos, usados para um antes/depois conceptual que o contrato OpenAI v2 proíbe, deixaram de existir em `real_dev/web/src/assets`; a validação estática e o build finais confirmarão que não subsistem referências.

### 2026-07-11 — Reauditoria independente: findings P1 reabertos

- **CWD:** `real_dev/api` e `real_dev/web`.
- **Ação:** revisão read-only independente dos contratos de paywall, jobs, validação OpenAI, outbox e backup.
- **Exit code:** n/a.
- **Findings:** (1) histórico de pele, detalhe da revisão e listagem de recomendações podiam expor conteúdo de relatórios v2 ainda bloqueados; (2) uma lease expirada na última tentativa podia deixar um job eternamente em `processing` e a falha do job não projetava `failed_retryable` na sessão; (3) respostas OpenAI válidas no JSON Schema mas semanticamente inválidas podiam tornar-se falha terminal sem percorrer retry/fallback; (4) o outbox de eliminação de ficheiros não tinha ciclo de worker/scheduler garantido e a expiração das imagens dependia de uma nova geração; (5) o snapshot de MongoDB não incluía os bytes privados referenciados por `storageKey`.
- **Finding P0 adicional:** o desbloqueio da primeira consulta não fechava `AiConsultationSession.isOpen`; como existe um índice/guard de uma única consulta aberta, o titular ficava impedido de iniciar qualquer consulta futura. O fecho terminal terá de ser atómico com o desbloqueio/auto-desbloqueio, preservando o histórico.
- **Finding P1 de autorização:** a fila destrutiva de pedidos de privacidade aceitava o role `consultor`, permitindo que um consultor cosmético aprovasse/rejeitasse/repetisse eliminação ou anonimização de qualquer cliente. A gestão de privacidade será exclusiva de `admin`; o domínio do consultor permanece limitado à revisão cosmética.
- **Findings P1 de domínio/consentimento:** restrições ou alergias declaradas na conversa ainda não eram reconciliadas com o perfil usado pelo filtro autoritativo; uma resposta a `needs_clarification` não criava/ligava corretamente a nova revisão nem revogava o grant anterior; uma análise `inconclusive` podia ser repetida com o mesmo par por fingerprint; e a UI de consentimento não enumerava explicitamente respostas/factos, perfil mínimo e catálogo filtrado enviados à OpenAI.
- **Finding P2 de integridade:** um ajuste humano podia substituir `finalRecommendationIds` sem reconstruir o array de recomendações dentro de `humanOverride`; a leitura do relatório usava status mutável em vez dos IDs congelados, pelo que feedback posterior podia alterar visualmente uma versão já congelada.
- **Finding P1 de paywall derivado:** evolução e comparação de pele ainda liam findings/deltas/imagens de análises ligadas a relatórios v2 bloqueados. Estes endpoints também terão de filtrar exclusivamente versões desbloqueadas e responder sem cache.
- **Findings P1/P2 de retoma/DTO:** falhas terminais de jobs deixavam a sessão em polling infinito; o DTO completo não incluía fontes, voucher correlacionado nem a última simulação para retoma; e o teaser pré-finalização não calculava ainda o total/10% read-only. Estes contratos passam a ser projetados pelo backend, sem persistência no browser.
- **Finding P1 de qualidade remota:** warnings descobertos apenas pela OpenAI avançavam diretamente para perguntas sem confirmação e o prompt remoto não enumerava os hard thresholds técnicos usados quando MediaPipe fica indisponível. O estado de confirmação terá de abranger warnings pós-análise; hard failures remotas tornam a qualidade `inconclusive` e exigem novo par.
- **Findings de catálogo:** com orçamento baixo o mínimo rígido de três recomendações podia tornar impossível qualquer relatório apesar de existirem um ou dois produtos válidos; e a administração ainda não expunha um workflow para completar metadata/variantes e promover produtos novos de `aiEligible=false`. A cobertura passa a considerar combinações realmente comportáveis e a UI/API admin terá curadoria explícita.
- **Estado:** `AI-E2E-02`, `AI-E2E-06`, `AI-E2E-11` e `AI-E2E-12` permanecem/reabrem em `EM_IMPLEMENTACAO`; nenhum destes pontos será aceite como risco silencioso.

### 2026-07-11 — Correção intermédia dos findings da reauditoria

- **CWD:** `real_dev/api`.
- **Alterações:** o unlock/zero-fee fecha agora a sessão v2 com `isOpen=false`, `status=completed` e `completedAt` na mesma transação; histórico, insights, recomendações, evolução e comparação aplicam o gate do `ReportUnlock`; privacidade destrutiva ficou exclusiva de `admin`; jobs recuperam a última lease, projetam falhas para a sessão e permitem retry manual limitado também de falhas terminais; validação semântica de análise, pergunta e relatório ocorre dentro do ciclo primary/retry/fallback OpenAI.
- **Contratos de relatório:** leitura congelada usa `finalRecommendationIds` independentemente de feedback mutável; `humanOverride.recommendations` é reconstruído apenas com o subset humano; GET do report inclui fontes, voucher correlacionado, última simulação e total/10% read-only no teaser, sem conteúdo completo antes do unlock.
- **Consulta:** restrições livres novas bloqueiam geração até serem reconciliadas no perfil; resposta a esclarecimento cancela/revoga review/grant antigos e a geração cria uma revisão sucessora pendente; resultado inconclusivo exige IDs de fotografias novos; warning remoto exige confirmação explícita antes da primeira pergunta; o prompt remoto recebeu os hard thresholds do perfil fotográfico v1.
- **Catálogo:** a cobertura mínima do relatório passou a considerar o número de produtos realmente comportável pelo orçamento, incluindo indisponíveis fora do total, em vez de impor sempre três.
- **Comando:** `node --check` em 14 módulos source alterados nesta ronda.
- **Exit code:** `0`.
- **Estado:** correções permanecem `EM_IMPLEMENTACAO` até os testes focados/integração confirmarem os contratos e os trabalhos paralelos de storage/frontend terminarem.

### 2026-07-11 — Primeiro reteste focado após a retoma

- **CWD:** `real_dev/api`.
- **Comando:** `npm test -- tests/openai-consultation-core-v2.test.js tests/ai-job-v2.test.js tests/mf5.biometric-data-requests.test.js`.
- **Exit code:** `1`.
- **Resultado:** 2 ficheiros passaram; a suite de privacidade teve 1 falha em 11 porque a fixture do alias histórico ainda esperava que um consultor listasse a fila administrativa. O runtime devolveu corretamente `403`; a falha de contrato será corrigida e mantida no histórico, não convertida em sucesso.
- **Reteste:** a fixture do alias passou a usar `admin`; o mesmo comando terminou com exit code `0`, 3 ficheiros e 42/42 testes verdes. Ficaram cobertos fallback semântico, recovery/retry de jobs e autorização administrativa sem reabrir autoridade ao consultor.

### 2026-07-11 — Primeiro lote transacional após a retoma

- **CWD:** `real_dev/api`.
- **Comando:** lote de `ai-job-recovery`, `report-paywall-boundaries`, `report-v2.freeze` e `report-payment` em replica set efémero.
- **Exit code:** `1`.
- **Resultado:** 3 ficheiros passaram; 5/10 casos de pagamento falharam porque uma fixture histórica sem `schemaVersion` herdou agora o default v2, mas não tinha `consultationSessionId`. O guard do runtime recusou corretamente fechar uma sessão inexistente; a fixture legacy será marcada explicitamente como v1 antes do reteste.
- **Reteste:** `npm test -- tests/report-payment.replset.integration.test.js`, exit code `0`; 1 ficheiro e 10/10 testes passaram depois de tornar o contrato legacy explícito, mantendo a nova prova de fecho terminal da sessão v2.

### 2026-07-11 — Fecho focado de lifecycle privado e backup

- **CWD:** `real_dev/api`.
- **Alterações confirmadas:** worker de `FileDeletionJob` com claim/lease/retry/recovery e shutdown; sweep periódico de previews expirados sem depender de HTTP; backup cifrado inclui bytes privados referenciados e checksums; restore `_restore` escreve storage isolado e reescreve referências; provenance da imagem inclui prompt/schema version configuráveis e persistidos; migração 015 reconcilia o contrato.
- **Evidência:** lote de 6 ficheiros/26 testes, migrações 010–015 com 4/4 e unit do runtime com 4/4, todos exit code `0`; `node --check` dos módulos críticos também terminou com `0`.
- **Nota:** foi acrescentada prova determinística de sweeps `true → false → true` apenas pelo relógio, sem tráfego. A suite API integral continua pendente no estado consolidado.

### 2026-07-11 — Regressões dos findings reabertos

- **CWD:** `real_dev/api`.
- **Comando:** lote focado de 7 ficheiros de consulta, jobs, clarification, paywall e relatório em replica set local.
- **Exit code:** `0`.
- **Resultado:** 49/49 testes passaram. A cobertura prova: novo par/fingerprint após `inconclusive`; confirmação de warning OpenAI antes da primeira pergunta; cancelamento/revogação e review/report sucessores após clarification; projeção e retry manual de job terminal; cobertura de 1–2 produtos com orçamento baixo; gates em history/evolution/comparison/insights/recommendations; retoma de voucher/makeup/sources no DTO; e imutabilidade dos `finalRecommendationIds` após feedback.
- **Validação adicional:** `node --check` passou nos cinco ficheiros de testes alterados. Não foi encontrado novo bug de runtime neste lote.

### 2026-07-11 — Reauditoria API final: findings adicionais

- **CWD:** `real_dev/api`.
- **Ação:** revisão read-only após as correções e regressões.
- **Findings P1:** substituir o par de fotografias depois de uma análise concluída não invalidava a sessão/análise antiga, podendo misturar respostas/report/preview com bytes novos; e um ajuste humano de rotina aceitava apenas `period/title/reason`, descartando `instructions/cautions` do machine result.
- **Estado:** findings abertos em `EM_IMPLEMENTACAO`; aguardam correção e regressão focada antes da suite integral.

### 2026-07-11 — Correção dos findings finais da API

- **CWD:** `real_dev/api`.
- **Alterações:** a quota HTTP IA foi elevada para 60 pedidos/dia, permitindo três consultas de 11 pedidos mais retries sem substituir as quotas de domínio; cada pergunta escolhida pela OpenAI passa a persistir provider, modelos pedido/efetivo, request ID, versões de prompt/schema e número de tentativas dentro do transcript cifrado; uma simulação ativa exige pelo menos uma recomendação com variante, incluindo após ajuste humano.
- **Revisão humana:** `instructions` e `cautions` tornaram-se obrigatórios em cada passo de rotina ajustada; campos de ajuste são recusados fora da decisão `adjusted`; decisões `approved`/`needs_clarification` deixaram de alterar o estado das recomendações; remover todas as variantes numa revisão desativa o preview.
- **Consentimento e retenção:** revogar o consentimento generativo cancela o job de imagem na mesma transação; jobs de eliminação física concluídos removem owner/origem/path, recebem `terminalAt` e TTL de sete dias, com backfill/índice na migração 015.
- **Compatibilidade:** os endpoints diretos legacy de análise, geração de relatório/recomendações, revisão por recomendação e before/after deixaram de estar montados; as rotas canónicas v2 permanecem.
- **Fotografias:** a substituição fica bloqueada após a consulta avançar para análise; enquanto ainda recolhe fotografias, troca o par e reinicia de forma transacional jobs, referências e conversa.
- **Validação:** pendente de syntax gate e regressões focadas; nenhum finding é dado como validado nesta entrada.

### 2026-07-11 — Syntax gate dos findings finais

- **CWD:** `real_dev/api`.
- **Comando:** `node --check` nos 14 módulos de middleware, consulta, providers, relatório, revisão, imagem, outbox, migração, fotografias, app e routers alterados.
- **Exit code:** `0`.
- **Resultado:** todos os módulos alterados são sintaticamente válidos; as garantias funcionais continuam pendentes dos testes focados e integrais.

### 2026-07-11 — Checkpoint frontend consolidado

- **CWD:** `real_dev/web` e `real_dev/api` para o endpoint de curadoria.
- **Alterações confirmadas:** retoma de relatório/voucher/preview; consentimento v2 detalhado; novos pares após qualidade inconclusiva; confirmação de warnings; grant fotográfico explícito; revisão `adjusted` com instruções/cautelas; curadoria administrativa de elegibilidade, sete concerns, rotina, INCI, atributos e variantes. As páginas/services/testes legacy foram retirados e os redirects antigos apontam apenas para o fluxo canónico.
- **Evidência intermédia comunicada:** endpoint administrativo 11/11; web lint; unit 46/46; contracts 92/92; build; smokes MF2/MF5/MF6/MF8 verdes.
- **Estado:** permanece `EM_IMPLEMENTACAO` até ao último rerun no mesmo estado da API e à validação E2E/browser.

### 2026-07-11 — Syntax gate API integral após correções finais

- **CWD:** `real_dev/api`.
- **Comando:** `npm run check:syntax`.
- **Exit code:** `0`.
- **Resultado:** 442 ficheiros JS/MJS/CJS válidos; JSX fica deliberadamente delegado a ESLint/Vite.

### 2026-07-11 — Preservação integral da rotina da máquina

- **CWD:** `real_dev/api`.
- **Finding adicional:** embora `machineResult` já guardasse a rotina completa, o campo de compatibilidade usado pelo DTO reduzia cada passo a `period/title/reason`, omitindo instruções e cautelas no campo público `routine`.
- **Correção:** relatórios v2 novos preservam o passo completo; a leitura prefere a rotina completa de `humanOverride`, depois `machineResult`, usando o campo legacy apenas como último fallback.
- **Validação:** pendente de regressão funcional junto dos contratos de revisão e relatório; este finding permanece aberto até esse reteste.

### 2026-07-11 — Identificador canónico da migração 015

- **CWD:** `real_dev/api`.
- **Alteração:** o identificador persistido da última migração foi alinhado com o contrato aprovado, `015_photo_quality_and_openai_simulation`; o source file interno mantém o nome técnico anterior, sem impacto no identificador/checksum registado pelo runner.
- **Compatibilidade:** apenas as migrações `001`–`009` eram imutáveis; a série `010`–`015` ainda está nesta implementação local e será revalidada integralmente antes de fecho.
- **Validação:** pendente do lote de migrações e do smoke E2E.

### 2026-07-11 — Retificação do source path da migração 015

- **CWD:** `real_dev/api`.
- **Alteração posterior:** depois de alinhar o identificador persistido, o próprio ficheiro e `sourcePath` do registry foram também renomeados para `015_photo_quality_and_openai_simulation.js`. Esta entrada supersede apenas a frase anterior que dizia manter o nome técnico antigo; a evidência histórica não foi apagada.
- **Validação:** syntax, registry/checksum, dry-run/up/validate e replay continuam pendentes no estado novo.

### 2026-07-11 — Syntax focal da migração canónica

- **CWD:** `real_dev/api`.
- **Comando:** `node --check` na migração 015, registry, smoke E2E e integração 010–015, seguido da confirmação de ausência do source path antigo.
- **Exit code:** `0`.
- **Resultado:** imports e fixtures usam o source path canónico; ainda não constitui prova de aplicação na base efémera.

### 2026-07-11 — Reteste 010–015 após retenção e renomeação

- **CWD:** `real_dev/api`.
- **Comando:** `npm test -- tests/migrations-010-015.replset.integration.test.js`.
- **Exit code:** `0`.
- **Resultado:** 1 ficheiro e 4/4 cenários passaram: registry/checksum, dry-run, aplicação/validação e replay idempotente. A prova inclui a migração canónica 015, TTL/minimização do outbox e invariantes dos IDs/contagem/stock do catálogo.

### 2026-07-11 — Fecho técnico do slice frontend

- **CWD:** `real_dev/web` e endpoint de curadoria em `real_dev/api`.
- **Resultado implementado:** fluxo/retoma do relatório e imagem, consentimento v2 explícito, qualidade inconclusiva/warnings, grant pós-clarificação, rotina humana completa, atalhos por role, curadoria administrativa sem IDs técnicos e E2E atualizado para restrições/metadata.
- **Comandos/resultados comunicados:** API products 11/11; API syntax 442 ficheiros; web lint; unit 46/46; contracts 94/94; build de 90 módulos; `npm audit` web com zero vulnerabilidades; smokes MF2/MF5/MF6/MF8 verdes; pesquisa estática sem chamadas legacy, IA demo/external, copy conceptual ou localhost no bundle.
- **Estado:** `AI-E2E-10` fica `PRONTO_PARA_RETESTE`; a evidência E2E multi-browser e o gate integral continuam sob responsabilidade do coordenador.

### 2026-07-11 — Remoção definitiva dos boundaries API legacy

- **CWD:** `real_dev/api`.
- **Alteração:** além de desmontar as cinco superfícies HTTP antigas, foram eliminados os routers/controllers mortos e as funções legacy nos controllers partilhados. Permanecem apenas modelos/limpeza de dados antigos necessários a migração, privacidade e erasure; não existe endpoint que os crie.
- **Validação:** pendente de reconciliação das expectativas históricas para 404 e da suite API integral.

### 2026-07-11 — Syntax após remoção legacy

- **CWD:** `real_dev/api`.
- **Comando:** `npm run check:syntax`.
- **Exit code:** `0`.
- **Resultado:** 439 ficheiros JS/MJS/CJS válidos; a redução face aos 442 anteriores corresponde aos três controllers legacy eliminados.

### 2026-07-11 — Quota HTTP também na edição de imagem

- **CWD:** `real_dev/api`.
- **Alteração:** a criação de preview OpenAI passou a usar a política HTTP IA além do ledger funcional de três imagens/24 h. Retries internos continuam sem consumir quota funcional; o endpoint permanece idempotente.
- **Validação:** pendente do teste estrutural/rate-limit e do E2E.

### 2026-07-11 — Auditoria documental antes da sincronização

- **CWD:** raiz, `README.md` e `docs` em modo read-only.
- **Resultado:** foi confirmado drift material em README, RF/RNF, plano/matriz/backlog, guias MF1/MF2/MF7/MF8, cábula técnica e ficheiros gerados. Os contratos antigos incluem IA dual, endpoints diretos, wizard fixo e preview conceptual; a fórmula dos 10%, sete objetivos, jobs, consentimentos separados, variantes e configuração OpenAI não estavam ainda propagados.
- **Decisão:** fontes canónicas serão corrigidas por slices; relatórios históricos recebem apenas banner/link de supersessão e ficheiros AST/estatísticos são regenerados ou marcados como snapshot, nunca editados como se fossem evidência atual.
- **Estado:** `AI-E2E-13` passa para `EM_IMPLEMENTACAO`; a primeira frente cobre README, RF, RNF e planos de topo.

### 2026-07-11 — Regressões finais dos findings API

- **CWD:** `real_dev/api`.
- **Comando principal:** `npm test -- --run` sobre 10 suites de substituição fotográfica, consulta, review/revalidation, consentimento, grants, outbox, paywall, G1, provider e revisão UI/validator.
- **Exit code:** `0`.
- **Resultado:** 10 ficheiros e 77/77 testes passaram em 15,71 s. Foram provados bloqueio/reset transacional das fotografias; rotinas machine/human com `instructions`/`cautions`; quota 60 para 3×11; provenance da pergunta; variante obrigatória para preview e desativação após ajuste; revogação que cancela queued/processing; tombstone minimizado com TTL de sete dias; e quota IA no POST de imagem.
- **Compatibilidade removida:** lote MF1/MF2/MF4/consent/MF8/MF7/MF6 terminou com exit code `0`, 7 ficheiros e 74/74 testes, agora esperando 404 nas rotas eliminadas. G1 isolado passou 11/11; pesquisa estática não encontrou imports das rotas eliminadas nem expectativas `CONSULTATION_REQUIRED`.
- **Estado:** findings adicionais da reauditoria ficam `PRONTO_PARA_RETESTE` integral; não são ainda fechados antes da suite API completa e da reauditoria independente.

### 2026-07-11 — Terceira suite API integral

- **CWD:** `real_dev/api`.
- **Comando:** `npm test`.
- **Exit code:** `1`.
- **Resultado:** 102 ficheiros: 92 passaram, 9 falharam e 1 ficou ignorado; 637 testes: 618 passaram, 16 falharam e 3 ficaram ignorados. Duração 63,28 s.
- **Falhas observadas:** fixtures de account erasure/privacy ainda procuravam jobs concluídos por `sourceId` depois da minimização deliberada; testes de evolução/comparação/insights não criavam ou mockavam o novo `ReportUnlock`; a expectation de finalidade da imagem não incluía order/thresholds do perfil fotográfico; uma suite de clarification excedeu o hook de 10 s sob paralelismo. Esta classificação é preliminar e cada caso será retestado isoladamente; a execução não é tratada como sucesso.
- **Estado:** `AI-E2E-12` permanece `EM_IMPLEMENTACAO` e os findings API não avançam de estado.

### 2026-07-11 — Fixture E2E sem resultados IA sintéticos

- **CWD:** `real_dev/api`.
- **Finding:** o bootstrap E2E ainda persistia uma análise/report `demo` apenas para o cenário de retry de privacidade; os enums OpenAI-only atuais já a recusariam e a fixture violava a regra de não persistir modo demo.
- **Correção:** a fixture foi convertida para análise/report v2 OpenAI marcados inequivocamente como dados determinísticos E2E, com qualidade, provenance, rotina completa, report desbloqueado sem produtos e `not_required`; não existe chamada externa nem alegação de análise real do utilizador.
- **Validação:** `node --check scripts/e2e-runtime.core.mjs`, exit code `0`; execução E2E integral ainda pendente.

### 2026-07-11 — Reauditoria independente após findings finais

- **CWD:** `real_dev/api`, revisão read-only.
- **Resultado:** nenhum P0/P1; as correções de fotografias, quota, provenance, rotina, variante, revogação, TTL, endpoints, paywall, jobs, pagamento/voucher, privacidade e backup foram confirmadas. O lote focal independente passou 8 ficheiros e 48/48 testes.
- **P2 reaberto — export:** `ai-reports` ainda incluía titular, analysis ID e conteúdo cosmético, apesar do contrato metadata-only, e a resposta de export não tinha `no-store`.
- **P2 reaberto — retirada de revisão:** uma review `cancelled` saía da fila e perdia o grant fotográfico, mas permanecia legível diretamente por ID, incluindo conteúdo do report.
- **Estado:** ambos passam a `EM_IMPLEMENTACAO`; exigem testes negativos próprios e nova reauditoria antes de fechar.

### 2026-07-11 — Correção dos dois P2 da reauditoria independente

- **CWD:** `real_dev/api`.
- **Export metadata-only:** `ai-reports` passou a selecionar/exportar apenas ID do report, schema/lifecycle, contagem de recomendações, estados de revisão/unlock/pagamento simulado, depósito e data. Titular, analysis ID, objetivos, modelo, resumo, fontes e limitações não entram no dataset. Todos os exports administrativos recebem `Cache-Control: private, no-store, max-age=0` e `Pragma: no-cache`.
- **Retirada da revisão:** o detalhe do consultor aplica allowlist de estados `pending`, `needs_clarification`, `approved` e `adjusted`; uma review `cancelled` pelo titular deixa de ser recuperável pelo URL/ID guardado.
- **Validação:** pendente de testes negativos focados; os findings mantêm-se `EM_IMPLEMENTACAO` nesta entrada.

### 2026-07-11 — Syntax dos P2 e fixture E2E

- **CWD:** `real_dev/api`.
- **Comando:** `node --check` nos services/controller de export/review, bootstrap E2E e teste MF4 alterado.
- **Exit code:** `0`.
- **Resultado:** sources sintaticamente válidos; a validação comportamental continua pendente.

### 2026-07-11 — Estado legível de review centralizado

- **CWD:** `real_dev/api`.
- **Alteração:** a allowlist de detalhe deixou de repetir literais e é derivada dos estados de fila e finais já canónicos; `cancelled` continua deliberadamente excluído.
- **Validação:** incluída no reteste negativo dos P2 em curso.

### 2026-07-11 — Sincronização das cinco fontes documentais de topo

- **CWD:** raiz do projeto.
- **Ficheiros:** `README.md`, `docs/RF.md`, `docs/RNF.md`, `docs/planificacao/README.md` e `docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`.
- **Resultado:** OpenAI-only, sete objetivos, consentimentos/qualidade, 5–8 perguntas, jobs/retry/fallback OpenAI, report/review/freeze, allowlist/variantes/stock, fórmula inteira dos 10%, voucher/zero case, preview OpenAI, modo degradado, configuração/timeouts, rotas e migrações 010–015 ficaram documentados; RF41 ficou admin-only conforme runtime.
- **Validação:** `git diff --check` nos cinco ficheiros, exit code `0`; checker focal de links/fences, exit code `0`; pesquisa ativa, excluindo changelog, sem `AI_PROVIDER_MODE`, modos demo/external, conceptual, gateways financeiros ou SLO síncrono antigo. Não foram alegados browser/OpenAI live.

### 2026-07-11 — Reteste dos dois P2 independentes

- **CWD:** `real_dev/api`.
- **Comando:** lote de `mf7.admin-export-pdf`, `mf4.integration`, `report-photo-grant` e `ai-consultation-review`.
- **Exit code:** `0`.
- **Resultado:** 4 ficheiros e 39/39 testes passaram em 5,38 s. CSV/PDF provam dataset `ai-reports` metadata-only, ausência explícita de identificadores/conteúdo e headers `no-store`; review cancelada devolve 404 antes de carregar o report, sem leak, enquanto `approved`/`adjusted` continuam legíveis. `node --check` dos dois testes alterados também passou.
- **Estado:** os dois P2 ficam `PRONTO_PARA_RETESTE` e aguardam apenas suite integral/revisão final para fechar.

### 2026-07-11 — Sincronização inicial da matriz e backlog MVP

- **CWD:** raiz do projeto.
- **Alteração:** títulos/contratos de MF1, MF2, MF6 e MF7 em `MATRIZ-CANONICA-BK.md` e `BACKLOG-MVP.md` foram alinhados a qualidade/consulta OpenAI, report v2/10%, recomendações/rotina/review por relatório, preview OpenAI, jobs assíncronos e consentimento/provider OpenAI-only, preservando IDs e slugs.
- **Validação:** pendente de propagação aos índices/anexos/guias e do validator canónico; estes dois ficheiros não são ainda dados como sincronizados isoladamente.

### 2026-07-11 — Quarta suite API integral com quatro workers

- **CWD:** `real_dev/api`.
- **Comando:** `npm test -- --maxWorkers=4`.
- **Exit code:** `1`.
- **Resultado:** 102 ficheiros: 100 passaram, 1 falhou e 1 ficou ignorado; 640 testes: 638 passaram, 1 falhou e 1 ficou ignorado. Duração 77,87 s. A única falha era um mock unitário de detalhe que ainda implementava `findById` depois do novo filtro seguro usar `findOne`; o runtime devolveu 500 no teste por ausência do método mockado.
- **Correção:** a fixture passou a mockar/espiar `findOne`, preservando o mesmo contrato de DTO/audit. A falha não é convertida em sucesso sem reteste.

### 2026-07-11 — Reteste do último mock unitário

- **CWD:** `real_dev/api`.
- **Comando:** `npm test -- tests/mf8.ai-consultation-review.test.js`.
- **Exit code:** `0`.
- **Resultado:** 1 ficheiro e 14/14 testes passaram; o filtro de estados e o audit de detalhe funcionam com o boundary mockado correto. A suite integral será ainda repetida.

### 2026-07-11 — Paralelismo reproduzível da suite API

- **CWD:** `real_dev/api`.
- **Alteração:** o script `npm test` fixa `--maxWorkers=4`. Doze workers simultâneos criavam demasiados replica sets efémeros e provocavam timeouts ambientais/interações de fixtures; quatro workers executaram 639 casos úteis sem esse ruído.
- **Validação:** pendente de um `npm test` integral já através do script canónico atualizado.

### 2026-07-11 — Quinta suite API integral, estado consolidado

- **CWD:** `real_dev/api`.
- **Comando:** `npm test` (script canónico com quatro workers).
- **Exit code:** `0`.
- **Resultado:** 102 ficheiros: 101 passaram e 1 live test ficou explicitamente ignorado; 640 testes: 639 passaram e 1 ficou ignorado. Duração 78,62 s, sem falhas ou erros não tratados.
- **Interpretação:** todos os findings API corrigidos têm cobertura no mesmo estado do código; o teste OpenAI live continua opt-in e a ausência de credenciais não é convertida em PASS. `AI-E2E-01` a `AI-E2E-09`, `AI-E2E-11` e o gate API de `AI-E2E-12` passam a `PRONTO_PARA_RETESTE` pela reauditoria/final gate.

### 2026-07-11 — Primeira bateria E2E consolidada

- **CWD:** `real_dev/api` com frontend isolado.
- **Primeira tentativa:** `npm run test:e2e` no sandbox, exit code `1`, `listen EPERM 127.0.0.1`; falha ambiental preservada.
- **Reteste autorizado:** build Vite de 90 módulos e Playwright Chromium/Firefox/WebKit. Resultado: 35 passaram, 12 ficaram ignorados por desenho (viagens destrutivas executam apenas no browser de referência) e 1 falhou; exit code `1` em cerca de 1 min.
- **Falha:** na viagem Chromium, a UI permaneceu em `analyzing` por mais de 20 s depois do upload e não apresentou pergunta nem botão de relatório. Os restantes testes de browsers, Axe, responsive, performance, privacidade e segurança passaram.
- **Estado:** falha real em investigação; G5/G7 permanecem abertos e não é alegado E2E verde.

### 2026-07-11 — Causa raiz do E2E preso em `analyzing`

- **CWD:** `real_dev/api`.
- **Causa:** o orquestrador E2E criava apenas a app Express diretamente, ao contrário de `server.js`; por isso nunca iniciava os workers `AiJob`/ficheiros. O POST enfileirava corretamente a análise, mas nenhum processo reclamava o job, deixando a UI legitimamente em polling.
- **Correção:** `startE2eApiServer` inicia os dois workers depois do bind, valida os handles de shutdown e faz cleanup compensatório; o teardown fecha gateway/API, workers, Mongoose e replica set pela ordem explícita.
- **Validação:** pendente de syntax/unit e repetição da viagem/bateria E2E; o finding continua aberto.

### 2026-07-11 — Reteste focal do runtime E2E com workers

- **CWD:** `real_dev/api`.
- **Comando:** `node --check` dos dois scripts e `npm test -- tests/e2e-runtime.core.test.js tests/ai-worker-runtime.test.js`.
- **Exit code:** `0`.
- **Resultado:** syntax verde; 2 ficheiros e 17/17 testes de ambiente isolado, scrub de secrets, worker e shutdown passaram. Falta ainda a prova browser da consulta completa.

### 2026-07-11 — Segunda bateria E2E após iniciar os workers

- **CWD:** `real_dev/api` com frontend isolado.
- **Comando:** `npm run test:e2e`, autorizado para portas loopback e browsers locais.
- **Exit code:** `1`.
- **Resultado:** build Vite de 90 módulos; 35 testes passaram, 12 ficaram ignorados por desenho e 1 falhou em cerca de 1,5 min.
- **Progresso confirmado:** a análise deixou de ficar presa, as fotografias foram processadas, a consulta apresentou e persistiu seis perguntas e chegou à ação de criar o relatório.
- **Falha real:** o job `generate_report` terminou em `failed_retryable`; a UI preservou a sessão e apresentou retry, mas não navegou para o relatório. A causa interna continua em diagnóstico sanitizado e este run não é convertido em sucesso.
- **Estado:** G5/G7 permanecem abertos.

### 2026-07-11 — Diagnóstico sanitizado de falha E2E

- **CWD:** `real_dev/web`.
- **Alteração:** a viagem da consulta passa a distinguir redirect bem-sucedido de `failed_retryable` e, neste último caso, inclui apenas o `operation.error.code` público no erro Playwright. Transcript, fotografias, respostas, cookies e configuração nunca são impressos.
- **Validação:** será usada no reteste seguinte se a geração continuar a falhar.

### 2026-07-11 — Terceira bateria E2E com código público de erro

- **CWD:** `real_dev/api` com frontend isolado.
- **Comando:** `npm run test:e2e`, autorizado para portas loopback e browsers locais.
- **Exit code:** `1`.
- **Resultado:** build Vite de 90 módulos; 35 testes passaram, 12 ficaram ignorados por desenho e 1 falhou em cerca de 1 min.
- **Diagnóstico:** o código sanitizado foi `OPENAI_HTTP_401`. A análise e as perguntas usaram corretamente o transport determinístico de `NODE_ENV=test`, mas o handler do relatório tentou o transporte HTTP real. Não foram registadas respostas, fotografias, cookies, chave ou corpo externo.
- **Causa em investigação:** wiring inconsistente do transport de teste entre a análise/pergunta e `generate_report`; a correção deve manter o fixture inacessível fora de teste e preservar o runtime OpenAI-only.
- **Estado:** `AI-E2E-06`, `AI-E2E-10` e `AI-E2E-12` ficam `REABERTO` até reteste focal e browser verde.

### 2026-07-11 — Guias canónicos MF1/MF2 sincronizados

- **CWD:** raiz do projeto e `docs/planificacao`.
- **Âmbito:** BK MF1-05 a MF1-08 e MF2-02, MF2-03, MF2-05 a MF2-08; caminhos pedagógicos `apps/...` e IDs/slugs preservados.
- **Resultado:** os dez tutoriais cobrem OpenAI-only, consentimento v2, MediaPipe/Sharp, jobs, sete objetivos, 5–8 perguntas, report v2/allowlist/variantes, teaser/freeze, revisão opcional, 10% simulado/voucher e edição `gpt-image-2` cifrada com TTL. Contratos legacy foram retirados dos passos ativos.
- **Comandos:** `python3 docs/planificacao/scripts/auditar_planificacao.py`, `bash scripts/validate-planificacao.sh`, `git diff --check` scoped e pesquisa focal de contratos antigos.
- **Exit codes:** `0`.
- **Resultado de validação:** auditor e validator globais verdes; links/fences/blocos pedagógicos sem finding; zero ocorrência focal ativa dos contratos substituídos. Não foram alegados browser ou OpenAI live.

### 2026-07-11 — Primeiro slice canónico MF7/MF8 sincronizado

- **CWD:** raiz do projeto e `docs/planificacao`.
- **Âmbito:** MF7-01, MF7-07, MF8 `00-ARRANQUE-LOCAL` e MF8-05 a MF8-09; caminhos `apps/...`, IDs/slugs e headers preservados.
- **Resultado:** consentimentos separados, provider OpenAI-only, qualidade/consulta dinâmica, provenance, invariância, minimização e histórico retomável ficaram documentados. O arranque local expõe capability degradada e `test:ai:live` opt-in; sem chave é `SKIP/BLOQUEADO`, nunca `PASS`.
- **Comandos:** `git diff --check` scoped, checker de links/fences, pesquisa semântica e `python3 docs/planificacao/scripts/auditar_planificacao.py`.
- **Exit codes:** `0`.
- **Resultado de validação:** oito guias verdes, `overall_pass=true`, sem paths privados, chaves ou contratos IA antigos ativos. Não foram executados nem alegados browsers/OpenAI live.

### 2026-07-11 — Correção do transport determinístico do relatório

- **CWD:** `real_dev/api`.
- **Causa raiz:** `openai-report.provider.js` criava um segundo Responses client com `globalThis.fetch`; análise e perguntas usavam o transport isolado, mas `generate_report` escapava para HTTP real no E2E e recebia `OPENAI_HTTP_401`.
- **Correção:** o cliente do relatório seleciona o mesmo transport determinístico exclusivamente quando `NODE_ENV=test` e `OPENAI_TEST_FIXTURE_MODE=true`; qualquer outro ambiente continua a usar OpenAI real e não recebe fallback sintético.
- **Teste:** regressão dedicada recusa acesso ao `fetch` global e cobre catálogo vazio; lote focal de quatro ficheiros, 23/23 testes, exit code `0`.
- **Estado:** correção ainda requer a bateria E2E multi-browser no estado novo antes de voltar a `PRONTO_PARA_RETESTE`.

### 2026-07-11 — Quarta bateria E2E: fluxo funcional completo, contraste pendente

- **CWD:** `real_dev/api` com frontend isolado.
- **Comando:** `npm run test:e2e`, autorizado para portas loopback e browsers locais.
- **Exit code:** `1`.
- **Resultado:** build Vite de 90 módulos; 35 testes passaram, 12 ficaram ignorados por desenho e 1 falhou em cerca de 1,1 min.
- **Progresso confirmado:** relatório estruturado foi criado sem rede real, a viagem chegou ao pedido de revisão humana e o estado `review_pending` ficou visível. O erro `OPENAI_HTTP_401` deixou de ocorrer.
- **Finding de acessibilidade:** Axe encontrou um único `color-contrast`, impacto `serious`, na página do relatório após pedir revisão. O token visual do estado sobre o fundo de destaque não cumpre o contraste AA no tema claro.
- **Estado:** `AI-E2E-10/12` continuam `REABERTO`; correção CSS e reteste focal/browser obrigatórios.

### 2026-07-11 — Correção do contraste do estado do relatório

- **CWD:** `real_dev/web`.
- **Causa:** `.consultation-status-pill` fixava texto branco sobre `--mockup-highlight`; o dourado do tema claro não atingia 4,5:1.
- **Correção:** o componente usa agora o token temático `--highlight-foreground`, que já define tinta escura nos temas claro/escuro e branca no tema de alto contraste.
- **Comando:** `npm run lint`.
- **Exit code:** `0`.
- **Estado:** a correção continua `REABERTO` até o scan Axe na viagem real passar.

### 2026-07-11 — Quinta bateria E2E integral verde

- **CWD:** `real_dev/api` com frontend isolado.
- **Comando:** `npm run test:e2e`, autorizado para portas loopback e browsers locais.
- **Exit code:** `0`.
- **Resultado:** build Vite de 90 módulos; 36 testes passaram e 12 ficaram ignorados por desenho em cerca de 1,1 min. O resumo isolado confirmou base `orelle_e2e_test`, 15 migrações, cinco utilizadores, três produtos e três imagens de fixture.
- **Cobertura material:** a viagem Chromium completou perfil, catálogo/carrinho, pagamento simulado, consentimento/fotografias, análise, seis perguntas, relatório com produtos curados dentro do orçamento, revisão humana, freeze, pagamento simulado de 10%, voucher, privacidade e autorização. Firefox/WebKit cobriram as rotas não destrutivas, Axe, teclado e viewports; todos os scans ficaram sem violações serious/critical.
- **Garantias:** zero rede OpenAI no E2E; o transport determinístico continua restrito a teste. Nenhuma URI remota ou segredo foi carregado ou impresso.
- **Estado:** `AI-E2E-06` e `AI-E2E-10` passam a `VALIDADO`; `AI-E2E-12` continua `EM_IMPLEMENTACAO` até suites finais, audits, docs e reauditoria independente.

### 2026-07-11 — Sexta suite API integral, estado pós-E2E

- **CWD:** `real_dev/api`.
- **Comando:** `npm test`, autorizado para os replica sets efémeros locais; o script limpa chave OpenAI e `.env` antes do Vitest.
- **Exit code:** `0`.
- **Resultado:** 103 ficheiros: 102 passaram e 1 teste live ficou explicitamente ignorado; 642 testes: 641 passaram e 1 ficou ignorado. Duração 80,91 s, quatro workers, sem falhas ou erros não tratados.
- **Cobertura nova:** inclui transport de relatório restrito a teste, catálogo E2E curado, orçamento, worker e consentimento. O live test continua opt-in e não é contado como PASS sem credenciais.
- **Estado:** `AI-E2E-01` a `AI-E2E-11` passam a `VALIDADO`; o fecho depende ainda do gate documental, audits e reauditoria independente.

### 2026-07-11 — Regressão frontend e dois smokes MF6 reabertos

- **CWD:** `real_dev/web`.
- **Comandos verdes:** `npm test` (14 ficheiros/46 unitários e 94 contratos), checks de configuração/image budgets e smokes MF2, MF5, MF6 imagens/unit, MF7 e MF8; exit code `0` em cada resultado registado.
- **Falha 1:** `npm run smoke:mf6-page-budget`, exit code `1`; o checker somava 1 548 649 bytes de todos os chunks lazy JS/CSS contra um limite de 1 500 000. Esta métrica não representa transferência de uma página e não pertence aos budgets aprovados, que já são medidos por rota no Playwright.
- **Falha 2:** `npm run smoke:mf6-runtime`, exit code `1`; o checker e `MAIN_PAGE_DEFINITIONS` ainda procuravam `face-analysis`, `face-report` e `recommendations`, enquanto o router atual mede `guided-consultation`/`ai-history` e ainda não envolvia o relatório canónico no wrapper de métricas.
- **Decisão:** remover o total global enganador sem elevar budgets e alinhar definições/wrappers/checkers às rotas canónicas. O limite inicial JS gzip de 200 KiB e os limites de imagem permanecem; a transferência real por página continua limitada a 2 MiB no E2E.
- **Estado:** `AI-E2E-10/12` ficam `REABERTO` até lint/unit/smokes/build/E2E relevantes verdes.

### 2026-07-11 — Alinhamento dos budgets e rotas medidas MF6

- **CWD:** `real_dev/web`.
- **Alterações:** `MAIN_PAGE_DEFINITIONS`, unit e smoke passaram de `face-analysis`/`face-report`/`recommendations` para `guided-consultation`/`consultation-report`/`ai-history`; o relatório canónico ficou envolvido por `MeasuredRoute`. O checker estático deixou de somar todos os chunks lazy como uma única página e conserva inalterados JS inicial gzip ≤200 KiB, thumbnails ≤120 KiB e imagens ≤300 KiB; a transferência real ≤2 MiB continua no Playwright.
- **Comandos:** `npm run lint`, `npm run smoke:mf6-performance-unit`, `npm run smoke:mf6-runtime`, `npm run smoke:mf6-page-budget` e `npm run test:contracts`.
- **Exit codes:** `0` em todos.
- **Resultado:** JS inicial 65 342 bytes gzip, 175 imagens dentro do limite e 1 548 649 bytes/53 chunks lazy reportados apenas como inventário; 94/94 contratos frontend verdes.
- **Estado:** `AI-E2E-10` passa a `PRONTO_PARA_RETESTE`; build e browser final no estado novo continuam obrigatórios.

### 2026-07-11 — Guias MF8-10 a MF8-17 sincronizados

- **CWD:** raiz do projeto e `docs/planificacao`.
- **Âmbito:** oito guias BK10–BK17, com IDs/slugs/headers e caminhos pedagógicos `apps/...` preservados.
- **Resultado:** consulta OpenAI-only, sessões/jobs, allowlist/report v2, revisão opcional/CAS/grant, versão efetiva/paywall, rotas server-driven, preview OpenAI, 10% simulado/voucher, privacidade/auditoria/backup e gates finais ficaram propagados. Cada guia mantém sete passos pedagógicos.
- **Comandos:** `./scripts/validate-planificacao.sh`, `git diff --check` scoped, contagem de fences/passos e pesquisa semântica dos contratos substituídos.
- **Exit codes:** `0` nos validadores; o `rg` sem matches terminou com `1`, como esperado e não como falha de produto.
- **Resultado de validação:** 44 RF, 31 RNF e matriz 74/74/74, `overall_pass=true`; sem contratos ativos demo/external/wizard/endpoints diretos/gateways ou paths privados no slice.

### 2026-07-11 — Documentação auxiliar, sprints e cábulas sincronizados

- **CWD:** raiz do projeto e `docs/planificacao`.
- **Âmbito:** `MF-VIEWS`, anexos RF/RNF/sprint-owner, plano de sprints/operação local, índice de guias e três cábulas.
- **Resultado:** OpenAI-only/degradado, sete objetivos, consentimento v2, qualidade, 5–8 perguntas, jobs, allowlist/report/review/freeze, 10% simulado/voucher e `gpt-image-2` ficaram propagados. As cábulas de funções/estatísticas foram preservadas como snapshots históricos superseded, sem recontagens inventadas.
- **Comandos finais:** `git diff --check` scoped, checker de links/fences, `bash scripts/validate-planificacao.sh` e pesquisa semântica.
- **Exit codes:** `0` nos validadores; pesquisa sem matches terminou `1` como esperado.
- **Resultado de validação:** 44 RF, 31 RNF, matriz/backlog/guias 74/74/74, coverage/consistency/guides/naming/overall todos `true`. Uma execução intermédia durante edição concorrente dos BK MF8-10…17 falhou apenas por code blocks temporariamente ausentes; o reteste final verde não apaga esse histórico.

### 2026-07-11 — Sexta bateria E2E no estado final de performance

- **CWD:** `real_dev/api` com frontend isolado.
- **Comando:** `npm run test:e2e`, autorizado para portas loopback e browsers locais.
- **Exit code:** `0`.
- **Resultado:** build Vite de 90 módulos; 36 testes passaram e 12 ficaram ignorados por desenho em cerca de 1,1 min. A viagem completa, Axe, performance, teclado, responsive e os três engines permaneceram verdes depois de envolver o relatório por `MeasuredRoute`.
- **Estado:** `AI-E2E-10` volta a `VALIDADO`; `AI-E2E-12` aguarda apenas audits, verificação documental coordenada e reauditoria independente.

### 2026-07-11 — Primeira execução do agregador `verify:all`

- **CWD:** `real_dev/api`.
- **Comando:** `npm run verify:all`, autorizado para replica sets, browsers e advisory database.
- **Exit code:** `1`; o agregador parou no gate API antes de build/E2E/audits/docs posteriores.
- **Resultado API:** 103 ficheiros: 101 passaram, 1 falhou e 1 live ficou ignorado; 642 testes: 640 passaram, 1 falhou e 1 ficou ignorado. A única falha foi `ai-worker-runtime`: esperava arranque degradado, mas recebeu worker ativo.
- **Causa:** `verify:all` reutilizava `buildScrubbedE2eEnvironment` para a suite geral e herdava `OPENAI_TEST_FIXTURE_MODE=true`. O transport E2E ficava assim ativo fora do passo E2E dedicado, invalidando o teste negativo e a separação ambiental declarada pelo próprio agregador.
- **Decisão:** o ambiente API geral deve fixar fixture mode a `false`; apenas `run-e2e` a ativa no seu processo isolado. A falha permanece no histórico e não é convertida em sucesso.
- **Estado:** `AI-E2E-02/12` passam a `REABERTO` até contrato focal, suite/agregador integral e reauditoria.

### 2026-07-11 — Isolamento entre gates gerais e transport E2E

- **CWD:** `real_dev/api`.
- **Alteração:** `buildVerificationTestEnvironment` mantém o scrub de credenciais e segredos efémeros, mas fixa `OPENAI_TEST_FIXTURE_MODE=false`; apenas o processo dedicado `run-e2e` volta a construir um ambiente com fixture ativa.
- **Regressão:** o teste do orquestrador exige `NODE_ENV=test`, `.env` desativado, zero chave/URI herdadas e fixture `false` nos gates gerais.
- **Comando:** syntax dos dois ficheiros e `npm test -- tests/ai-worker-runtime.test.js tests/e2e-runtime.core.test.js`.
- **Exit code:** `0`.
- **Resultado:** 2 ficheiros e 18/18 testes passaram, incluindo arranque degradado do worker e separação ambiental.
- **Estado:** `AI-E2E-02` fica `PRONTO_PARA_RETESTE`; `AI-E2E-12` regressa a `EM_IMPLEMENTACAO` até `verify:all` integral verde.

### 2026-07-11 — Segunda execução do agregador `verify:all`

- **CWD:** `real_dev/api`.
- **Comando:** `npm run verify:all`, autorizado para recursos locais.
- **Exit code:** `1`; o agregador avançou por syntax, lint, API integral, frontend unitário/contratos e build, mas parou no primeiro smoke publicado.
- **Resultados verdes antes da falha:** API 103 ficheiros, 102 pass/1 live skip e 643 testes, 642 pass/1 skip; frontend 46 unitários e 94 contratos; build 90 módulos.
- **Falha:** `smoke:g2-checkout` encontrou o aviso académico permanente em falta. O componente mostrava “Pagamento simulado — não será efetuada qualquer cobrança.”, mas o contrato fechado exige a indicação inequívoca “Demonstração académica — não será efetuada qualquer cobrança.”.
- **Decisão:** corrigir a constante pública e as expectations; nenhuma lógica financeira é alterada. A execução falhada permanece no histórico.
- **Estado:** `AI-E2E-08/10/12` ficam `REABERTO` até smoke, contratos, E2E e agregador integral verdes.

### 2026-07-11 — Aviso permanente do pagamento académico

- **CWD:** `real_dev/web`.
- **Alteração:** a constante apresentada no topo do checkout passou para a copy fechada “Demonstração académica — não será efetuada qualquer cobrança.”; o título e todos os estados continuam “Pagamento simulado”. Não foi acrescentado método, gateway ou dado financeiro.
- **Comandos:** `npm run smoke:g2-checkout`, contrato `simulatedCheckout.test.mjs` e `npm run lint`.
- **Exit codes:** `0`.
- **Resultado:** smoke de dois passos/idempotência, 8/8 contratos e lint passaram.
- **Estado:** `AI-E2E-08/10` ficam `PRONTO_PARA_RETESTE`; a prova integral continua no próximo `verify:all`.

### 2026-07-11 — Terceira execução do agregador `verify:all`, integralmente verde

- **CWD:** `real_dev/api`.
- **Comando:** `npm run verify:all`, autorizado para replica sets efémeros, browsers loopback e advisory database; `.env` e credenciais herdadas foram removidos pelo orquestrador.
- **Exit code:** `0`.
- **Resultado:** 25 gates passaram no mesmo estado: syntax (440 ficheiros), lint, API combinada (103 ficheiros: 102 pass/1 live skip; 643 testes: 642 pass/1 skip), frontend (46 unitários e 94 contratos), build de 90 módulos, todos os smokes publicados, E2E (36 pass/12 skip intencional), Axe, performance, dois audits com zero vulnerabilidades e planificação 44 RF/31 RNF/74 BK com `overall_pass=true`.
- **Persistência:** a suite incluiu migrações 001–015, backup create/restore/verify com documentos/índices/checksums/bytes privados, concorrência, rollback e invariantes de catálogo.
- **Budgets:** JS inicial 65 333 bytes gzip; 175 imagens dentro do limite; inventário de 53 chunks lazy não é tratado como transferência de uma página; Playwright validou transferência/LCP/CLS por rota.
- **Estado:** `AI-E2E-02/08/10` passam a `VALIDADO`; `AI-E2E-12` fica `PRONTO_PARA_RETESTE` para a reauditoria independente; `AI-E2E-13` fica `VALIDADO` pelo gate canónico.

### 2026-07-11 — OpenAI live explicitamente não validada

- **CWD:** `real_dev/api`.
- **Pré-condição sanitizada:** `OPENAI_API_KEY` ausente no ambiente; nenhum valor foi impresso.
- **Comando:** `npm run test:ai:live`, com `DOTENV_CONFIG_PATH=/dev/null` e sem carregar o `.env` do projeto.
- **Exit code:** `0`, mas com 1 ficheiro/1 teste `skipped` e zero testes executados.
- **Classificação:** `BLOQUEADO_EXTERNO`, não `PASS`. Qualidade/latência/custo reais de `gpt-5.4-mini`, fallback `gpt-5.4` e edição `gpt-image-2` exigem credencial/créditos e fotografias expressamente consentidas.

### 2026-07-11 — Reconfirmação da documentação oficial OpenAI

- **Fonte:** MCP oficial `openaiDeveloperDocs`, sem alterar modelos explicitamente aprovados.
- **Resultado:** as páginas atuais confirmam imagens como input da Responses API, Structured Outputs por JSON Schema e edição com imagem de referência no GPT Image; a documentação oficial também mantém limitações de latência/consistência que a UI e os RNF apresentam como risco, não garantia.
- **Decisão:** conservar os targets pedidos `gpt-5.4-mini`, `gpt-5.4` e `gpt-image-2`; uma recomendação oficial mais recente não substitui silenciosamente modelos explicitamente fechados pelo utilizador.

### 2026-07-11 — Banners históricos e scans estáticos finais

- **CWD:** raiz do projeto.
- **Alteração documental:** `RELATORIO-IMPLEMENTACAO-IA-real_dev.md` e `PLANO-CORRECAO-AUDITORIA-COMPLETA-real_dev.md` receberam apenas banner de supersessão/link para este report; o conteúdo histórico permaneceu intacto.
- **Scans:** zero `AI_PROVIDER_MODE`, provider demo/external, SVG conceptual, Stripe/PayPal/MBWay/`checkoutUrl` no runtime ativo; zero `fetch`/URL externa no módulo de pagamento; zero localhost/MongoDB no bundle; zero segredo/URI no report; zero alteração observável em `apps/`; `real_dev/` continua ignorado por `.gitignore:2`.
- **Exit codes:** `rg` sem matches terminou `1` como esperado; `git status --short -- apps` e `git check-ignore` terminaram `0`.
- **Hashes finais:** API lock `043baf15c773fbc61859a975a16ce56848f7bf75df80e7b947f6bba087c85b73`; web lock `f39eb47b1eac5bcf26b81d2441bb237ee007f6ce73f27a573ba567ee134c5a03`; Node `v24.11.1`, npm `11.6.2`.

### 2026-07-11 — Reauditoria independente de fecho: itens reabertos

- **CWD:** raiz do projeto, `real_dev/api`, `real_dev/web` e `docs/planificacao`.
- **Ação:** três revisões read-only independentes de runtime, testes/escopo e documentação, seguidas de reconfirmação no guia e OpenAPI oficiais da OpenAI.
- **Exit code:** n/a para inspeção; os comandos read-only comunicados terminaram conforme cada evidência individual.
- **Finding runtime P2:** duas transações executavam leituras em `Promise.all` sobre a mesma `ClientSession` MongoDB; essas operações devem ser sequenciais para evitar comportamento não suportado/intermitente.
- **Finding runtime P2:** a decisão humana `adjusted` exigia pelo menos um produto mesmo quando o relatório podia legitimamente ter zero recomendações; deve aceitar qualquer alteração material de texto, rotina ou produtos, revalidando produtos quando existirem.
- **Finding OpenAI:** o provider enviava `input_fidelity=high` a `gpt-image-2`. A documentação oficial atual determina omitir esse parâmetro porque o modelo já processa todos os inputs com alta fidelidade e não permite configurá-lo.
- **Findings documentais P1/P2:** MF6-01, MF6-07 e MF8-03 ainda ensinavam análise síncrona/modo demo/endpoints eliminados; outros guias MF2/MF4/MF5/MF6/MF7 mantinham páginas, consentimento ou revisão legacy; relatórios históricos selecionados apontavam para vigência anterior.
- **Sem finding de escopo:** `apps/` permanece sem alterações observáveis, `real_dev/` continua ignorado, hashes/runtime correspondem ao report, não existem gateways financeiros ou providers IA de runtime alternativos e o catálogo/migrações preservam as invariantes.
- **Estado:** `AI-E2E-02/06/07/09/12/13` passam a `REABERTO`. Nenhum resultado verde anterior é apagado; as correções exigem testes focados, `verify:all` e nova reauditoria no estado posterior.

### 2026-07-11 — Compatibilidade do edit request com `gpt-image-2`

- **CWD:** `real_dev/api`.
- **Fonte:** guia oficial OpenAI “Image generation”, secções “Edit Images” e “Image input fidelity”; o OpenAPI oficial do endpoint `/v1/images/edits` foi também inspecionado, mas a descrição de modelos dessa especificação ainda não enumera `gpt-image-2`, pelo que o comportamento específico do modelo segue o guia atual e não é inferido do schema desatualizado.
- **Alteração:** pedidos `gpt-image-2` e variantes versionadas deixam de enviar `input_fidelity`; o modelo já processa cada imagem em alta fidelidade e rejeita a configuração explícita. Modelos GPT Image anteriores configurados mantêm `input_fidelity=high`. `quality=medium`, `output_format=webp`, `size=auto`, imagem de referência e prompt controlado permanecem inalterados.
- **Comando:** `npm test -- tests/openai-makeup-storage.test.js`.
- **Exit code:** `0`.
- **Resultado:** 1 ficheiro e 4/4 testes passaram; a regressão inspeciona o `FormData`, prova ausência do parâmetro em `gpt-image-2`, presença em `gpt-image-1.5`, output/provenance e storage cifrado.
- **Estado:** `AI-E2E-09` fica `PRONTO_PARA_RETESTE` até `verify:all` e revisão independente no estado final.

### 2026-07-11 — Correção semântica dos guias core reabertos

- **CWD:** raiz do projeto e `docs/planificacao`.
- **Ficheiros:** MF6-01, MF6-07, MF8-03 e MF7-04.
- **Alteração:** os guias foram reescritos nos passos, comandos, snippets, checklists e matrizes ativas para jobs assíncronos retomáveis, consentimento v2, OpenAI-only/provenance, migrações 010–015, `MongoMemoryReplSet`, transport determinístico apenas em testes e Playwright Chromium/Firefox/WebKit sobre as rotas `/consulta/*`. IDs, slugs, headers e paths pedagógicos `apps/...` foram preservados.
- **Comandos:** `./scripts/validate-planificacao.sh`; `git diff --check` nos quatro guias; validação de fences; scans negativos por `demo`, `external`, `AI_PROVIDER_MODE`, `isDemo`, endpoints/páginas legacy e paths privados.
- **Exit codes:** `0` nos validadores; os scans sem ocorrências terminaram `1` como esperado.
- **Resultado:** 44 RF, 31 RNF e 74 BK com `overall_pass=true`; zero contrato legacy ativo nos quatro guias; diff do slice com 614 inserções e 3449 remoções.
- **Estado:** `AI-E2E-13` permanece `REABERTO` apenas até terminar o slice documental residual e a reauditoria semântica posterior.

### 2026-07-11 — Guias residuais e banners históricos reconciliados

- **CWD:** raiz do projeto e `docs/planificacao`.
- **Guias:** MF2-04, MF4-08, MF5-01/05/07/08 e MF6-02/04.
- **Relatórios:** 27 artefactos `AUDITORIA-*`, `CORRECAO-*` e `IMPLEMENTACAO-*` de MF0–MF8 receberam ligação direta ao plano OpenAI atual; o corpo datado permaneceu histórico.
- **Alteração:** contratos ativos apontam apenas para `NewConsultationPage`, `ActiveConsultationPage`, `ConsultationReportPage`, `ConsultationHistoryPage`, `ConsultationReviewsPage`, report service, allowlist/revalidação, consentimento v2 e rotas `/consulta/*`/`/consultoria/revisoes`. O tutorial antigo foi encapsulado como anexo histórico fechado e inequivocamente “não executar”; MF5-01 recebeu a extensão v2 sem arquivo artificial.
- **Comandos:** checker read-only de links/fences/encapsulamento; `bash scripts/validate-planificacao.sh`; `git diff --check -- docs/planificacao/guias-bk`; scans por plano antigo/novo; `git status --short -- apps real_dev`.
- **Exit codes:** `0` nos validadores e scope check; scan sem plano antigo terminou `1` como esperado.
- **Resultado:** oito guias sem referência legacy ativa, zero links quebrados, 72 menções legacy confinadas aos anexos históricos, 27 banners canónicos, 44 RF/31 RNF/74 BK e `overall_pass=true`; `apps/` e `real_dev/` não receberam alterações desta frente.
- **Estado:** `AI-E2E-13` fica `PRONTO_PARA_RETESTE` até reauditoria documental posterior às últimas alterações.

### 2026-07-11 — Sessões transacionais sequenciais e ajuste humano material

- **CWD:** `real_dev/api` e `real_dev/web`.
- **Alteração transacional:** consentimento/fotografias no arranque da análise e consentimento/perfil na publicação do relatório deixaram de executar queries concorrentes na mesma `ClientSession`; cada leitura termina sequencialmente dentro da transação MongoDB.
- **Alteração de revisão:** `adjusted` exige uma diferença efetiva em avaliação, rotina ou produtos. Um relatório sem recomendações pode ser corrigido apenas por texto/rotina; um payload idêntico é recusado com `MATERIAL_ADJUSTMENT_REQUIRED`; remover todos os produtos é uma alteração válida e marca os anteriores como `dismissed`; produtos mantidos continuam a passar pela revalidação de catálogo, perfil, restrições, variante, preço e stock.
- **Frontend:** o editor compara contra o relatório original, explica o caso sem produtos e só permite submeter um ajuste material com conteúdo válido.
- **Comandos/resultados:** API integral 103 ficheiros passados + 1 live skip, 651 testes passados + 1 skip; focais transacionais 15/15, revisão/clarificação/paywall/freeze 9/9, validators/contratos 18/18; frontend 47 unitários + 94 contratos; ESLint, build Vite de 90 módulos e syntax API de 441 ficheiros.
- **Exit codes:** `0` em todas as validações comunicadas.
- **Estado:** `AI-E2E-02/06/07` ficam `PRONTO_PARA_RETESTE`; exigem `verify:all` e revisão read-only posterior no mesmo estado.

### 2026-07-11 — Quarta execução do agregador integral, verde mas não final

- **CWD:** `real_dev/api`.
- **Comando:** `npm run verify:all`, autorizado apenas para replica sets efémeros, browsers loopback e advisory database; o orquestrador remove `.env`, chave e URI herdadas.
- **Exit code:** `0`.
- **Resultado:** 25 gates passaram: syntax 441 ficheiros; API 103 ficheiros passados + 1 live skip, 651 testes passados + 1 skip; frontend 47 unitários e 94 contratos; build 90 módulos; smokes; E2E 36 pass/12 skip intencional em Chromium/Firefox/WebKit; Axe; budgets; audits API/web com zero vulnerabilidades; planificação 44 RF/31 RNF/74 BK e `overall_pass=true`.
- **Budgets/isolamento:** JS inicial 65 324 bytes gzip; 175 imagens dentro do limite; E2E usou `orelle_e2e_test`, 15 migrações e fixtures locais, sem OpenAI ou MongoDB remotos.
- **Decisão:** este run não fecha G7 porque duas reauditorias read-only paralelas devolveram novos findings P1/P2 durante a execução. A evidência é preservada, mas será supersedida por novo `verify:all` depois das correções.

### 2026-07-11 — Reauditorias posteriores: findings adicionais reabertos

- **CWD:** `real_dev/api`, `real_dev/web`, `README.md` e `docs`.
- **Runtime P2:** a revalidação de produtos mantidos num ajuste humano cobria elegibilidade geral, restrições, variante, preço e stock, mas não voltava a exigir `concernTags` compatíveis com os objetivos congelados do relatório. Faltavam ainda negativos explícitos para tag, `aiEligible`, variante e preço.
- **Evidência P2:** o teste do edit request confirmava fidelity/quality/output/size e quantidade de imagens, mas não provava MIME/nome/bytes, prompt fechado, regiões/produtos/variantes, invariantes de identidade nem o alias versionado `gpt-image-2-*`.
- **Documentação P1:** matriz/backlog/views/guias ainda atribuíam decisões destrutivas de privacidade a consultores; dois guias de export reintroduziam IDs/conteúdo cosmético; snippets ativos em MF6-03/MF8-02 e MF5-01 montavam routers/página legacy.
- **Documentação P2/P3:** eliminação de conta não enumerava/provava o domínio OpenAI; MF5-01 ainda referia migrações 001–009; dois relatórios chamavam “vigente” ao estado histórico; cinco evidências apontavam apenas para o plano anterior.
- **Estado:** G7 permanece aberto. Os findings serão corrigidos individualmente e sujeitos a testes/scans focados, novo agregador e nova reauditoria.

### 2026-07-11 — Prova completa do request de edição OpenAI

- **CWD:** `real_dev/api`.
- **Alteração de teste:** a regressão do provider passou a executar `gpt-image-2` e um alias versionado `gpt-image-2-*`; em ambos inspeciona o `FormData` e prova ausência de `input_fidelity`, `quality=medium`, WebP, `size=auto`, um ficheiro `frontal.webp` com MIME/bytes exatos, regiões e snapshot de produto/variante no prompt, instruções de preservação de identidade/estrutura/pele/cabelo/fundo e rejeição de qualquer campo de prompt livre acrescentado pelo chamador.
- **Comando:** `npm test -- tests/openai-makeup-storage.test.js`.
- **Exit code:** `0`.
- **Resultado:** 1 ficheiro e 5/5 testes passaram, incluindo modelo anterior com `input_fidelity=high`, deadline/`Retry-After` e storage cifrado.
- **Estado:** `AI-E2E-09` fica `PRONTO_PARA_RETESTE` até agregador e reauditoria finais.

### 2026-07-11 — Routers canónicos, snapshots históricos e evidências

- **CWD:** raiz do projeto e `docs/planificacao`.
- **Alteração:** snippets ativos de MF6-03/MF8-02 montam `aiConsultationRoutes`, `aiConsultationReviewRoutes`, `faceReportRoutes` e `makeupSimulationRoutes`, sem routers eliminados. Os snapshots MF7/MF8 passaram a rotular o corpo como histórico, declarar OpenAI-only e RNF26 `ACEITE_RISCO`. Cinco evidências MF7/MF8 apontam diretamente para este plano, preservando o corpo datado.
- **Comandos:** validator, auditor de planificação, checker de fences, `git diff --check` e scan semântico dos nove ficheiros.
- **Exit codes:** `0`.
- **Resultado:** 44 RF, 31 RNF, 74/74/74 BK e links verdes; zero router legacy ativo, rótulo “Estado vigente” contraditório ou ligação indireta ao plano anterior; cada router canónico tem import e mount explícitos.
- **Estado:** `AI-E2E-13` continua `REABERTO` até terminar e reauditar o slice de privacidade/export/eliminação.

### 2026-07-11 — Revalidação humana por objetivos congelados

- **CWD:** `real_dev/api`.
- **Alteração:** `revalidateAdjustedRecommendations` recebe o `FaceReport` autoritativo relido na transação, confirma report/titular/versão, extrai os objetivos congelados e exige interseção com `Product.concernTags`, em paridade com o `$in` da allowlist inicial. Ausência/mismatch falha com `REPORT_OBJECTIVES_REQUIRED`; incompatibilidade do produto falha com `PRODUCT_CONCERN_MISMATCH` antes do CAS.
- **Regressões:** concern tags incompatíveis com rollback integral de review/report/recomendação/audit; objetivos ausentes; `aiEligible=false`; variante removida; preço alterado; stock/alergia; ajuste textual sem produtos.
- **Primeiro run focado:** exit code `1` por `listen EPERM` no sandbox; preservado como falha ambiental.
- **Reteste local autorizado:** 31/31 testes, exit code `0`; integração reforçada 11/11; syntax 441 ficheiros; suite API integral 103 ficheiros passados + 1 live skip, 657 testes passados + 1 live skip; `node --check` e whitespace verdes.
- **Garantias:** replica set efémero/local, sem ligação remota.
- **Estado:** `AI-E2E-06/07` ficam `PRONTO_PARA_RETESTE` até agregador e reauditoria finais.

### 2026-07-11 — Autorização RGPD, exports minimizados e erasure OpenAI

- **CWD:** raiz do projeto, `docs/planificacao` e testes focados em `real_dev/api`.
- **Alteração documental:** matriz, backlog, MF-VIEWS, índice e MF5-01/MF7-02 reservam privacidade destrutiva a `ADMIN`; consultor recebe 403 e permanece apenas na revisão cosmética separada. A página legacy de revisão por recomendação foi removida. MF4-03/MF7-05 ensinam `ai-reports` metadata-only, sem titular, analysis ID ou conteúdo. MF7-02 enumera sessões, jobs, reviews/audits, grants, previews/quota, unlocks, recomendações e restantes recursos no erasure/outbox, com registry 001–015.
- **Ficheiros:** oito artefactos canónicos; o slug histórico de MF5-01 é preservado, mas não autoriza consultores no conteúdo.
- **Validações docs:** `bash scripts/validate-planificacao.sh`, `git diff --check`, fences e scans negativos de autorização/export.
- **Validações runtime relacionadas:** export + account erasure 24/24; privacy requests + migrações gerais + 010–015 20/20.
- **Exit codes:** `0`; scans sem matches terminaram `1` como esperado.
- **Resultado:** 44 RF/31 RNF/74 BK, `overall_pass=true`, links verdes; referências a conteúdo sensível só em proibições/fixtures hostis/asserts negativos e história marcada; checksums 001–009 continuam imutáveis dentro do registry 001–015.
- **Estado:** `AI-E2E-11/13` ficam `PRONTO_PARA_RETESTE` até reauditoria cruzada e agregador finais.

### 2026-07-11 — Reauditoria runtime profunda: três P2 reabertos

- **CWD:** `real_dev/api` e `real_dev/web`, inspeção/probes read-only.
- **P2 revisão:** seleção vazia retornava antes de validar identidade/versão/objetivos do report; queries/CAS não fixavam de forma uniforme `reportVersion`, permitindo que ajuste textual/remoção total escapasse ao fail-closed de versão num estado inconsistente.
- **P2 imagem:** um `TimeoutError` real de `AbortSignal.timeout` não era normalizado como transitório, perdia `OPENAI_IMAGE_TIMEOUT`, fazia só uma tentativa e projetava falha terminal sem retry durável.
- **P2 simulação:** `simulationSpec.enabled=true` aceitava `regions=[]`; o prompt podia ficar sem zona autorizada. O schema/semântica devem exigir pelo menos uma região canónica apenas quando a simulação está ativa.
- **Evidência read-only:** probes reproduziram seleção vazia com report incompatível, timeout com uma única chamada/retryable false e simulação ativa sem regiões; suites existentes permaneciam verdes, confirmando lacunas de boundary/cobertura e não regressões já detetadas.
- **Estado:** `AI-E2E-06/07/09` passam a `REABERTO`; cada finding exige correção e negativos próprios antes do próximo agregador.

### 2026-07-11 — Reauditoria documental cruzada: evidence browser reaberta

- **CWD:** `docs/evidence/MF7` e manifests web, inspeção read-only.
- **Finding P2:** a evidência de compatibilidade browser apresentava como comando atual `npm --prefix apps/web run test:e2e`, mas o package público não publica esse script. O runtime/evidence desta implementação real usa o harness Playwright isolado de `real_dev/web`/orquestrador API.
- **Decisão:** como é evidência operacional de `real_dev` e não um guia pedagógico, o comando deve apontar para a implementação real e ser executável; `AI-E2E-13` passa a `REABERTO` até correção e validação.

### 2026-07-11 — Fail-closed de versão na revisão humana

- **CWD:** `real_dev/api`.
- **Alteração:** revisão schema v2 valida sempre report/titular/versão/objetivos, mesmo com zero produtos; recomendações exigem `reportVersion`; leitura autoritativa e CAS de `FaceReport` fixam `schemaVersion: 2` e `version: review.reportVersion`. Schema v1 mantém compatibilidade explícita; ajuste textual sem produtos e remoção total continuam válidos.
- **Regressões:** mismatch de ID/user/version com seleção vazia e não vazia; objetivos ausentes sem produtos; recomendação de outra versão; rollback quando a versão persistida muda; legacy v1.
- **Resultados focados:** replica set 18/18; CAS/concorrência/unit/sequenciamento 22/22; probe pós-correção devolve `409 REPORT_OBJECTIVES_REQUIRED`; syntax 441 e `git diff --check` verdes.
- **Suite API integral:** 102 ficheiros/663 testes passaram e 1 live ficou ignorado, mas `private-file-runtime.replset.integration.test.js:105` falhou com `claimed:false`, reproduzível isoladamente. A falha não é atribuída a esta correção nem aceite como verde.
- **Estado:** `AI-E2E-07` fica `PRONTO_PARA_RETESTE`; `AI-E2E-11/12` permanecem/reabrem até diagnosticar o worker de ficheiros e repetir a suite.

### 2026-07-11 — Comandos executáveis da evidence browser

- **CWD:** raiz do projeto e `docs/evidence/MF7`.
- **Alteração:** a evidence operacional usa agora `npm --prefix real_dev/api run test:e2e` para o orquestrador isolado e `npm --prefix real_dev/web` para smoke/build. Os paths públicos `apps/...` continuam reservados aos guias pedagógicos, não a esta prova da implementação real.
- **Comandos:** `npm pkg get` dos três scripts; `git diff --check` do Markdown; scan por comando antigo e paths atuais.
- **Exit code:** `0`; os scripts existem e o comando inexequível `apps/web run test:e2e` deixou de ocorrer.
- **Estado:** `AI-E2E-13` fica `PRONTO_PARA_RETESTE` até reauditoria documental final.

### 2026-07-11 — Relógio determinístico do worker de ficheiros

- **CWD:** `real_dev/api`.
- **Causa raiz:** o teste enfileirava com `availableAt=new Date()` real, mas processava com o instante fixo `2026-07-11T12:00:00Z`. Ao relógio da execução atravessar esse instante, o job ficava legitimamente futuro e `claimed:false`; a falha reproduzível era do fixture temporal, não do claim/lease do produto.
- **Alteração:** o relógio injetado do processamento é capturado depois do enqueue, garantindo `now >= availableAt` sem fake timers nem mudança do runtime. Backoff de 500/1001 ms, retry, minimização do tombstone e ausência física continuam iguais.
- **Comando:** `npm test -- tests/private-file-runtime.replset.integration.test.js`, com replica set efémero loopback.
- **Exit code:** `0`.
- **Resultado:** 1 ficheiro e 4/4 testes passaram às 13:20 locais, depois do instante que tornava a fixture anterior invariavelmente vermelha.
- **Estado:** `AI-E2E-11` fica `PRONTO_PARA_RETESTE`; a suite integral será repetida no estado final.

### 2026-07-11 — Timeout repetível e regiões canónicas da simulação

- **CWD:** `real_dev/api`.
- **Timeout:** o provider normaliza timeout interno para `OPENAI_IMAGE_TIMEOUT`, transient/retryable; reparte o deadline total por duas tentativas e repete sem backoff artificial. Cancelamento do caller mantém a razão e nunca é repetido. A integração projeta `failed_retryable` e código sanitizado para retry durável.
- **Regiões:** Structured Output separa ramo ativo (1–4 regiões `complexion|cheeks|eyes|lips`) do inativo (`[]`). A barreira semântica rejeita vazio ativo, região desconhecida/repetida e regiões num preview inativo.
- **Regressões:** fetch realmente abortado seguido de sucesso; dois timeouts; aborto externo; persistência retryable; schema/semântica active/disabled/unknown/duplicate.
- **Validação:** suite API integral 103 ficheiros e 669 testes passaram, com 1 live opt-in ignorado; focais adicionais, syntax 441 e `git diff --check` verdes; exit codes `0`.
- **Estado:** `AI-E2E-06/09` ficam `PRONTO_PARA_RETESTE`; aguardam agregador/revisão final.

### 2026-07-11 — Tentativa final interrompida por finding documental

- **CWD:** `real_dev/api` e reauditoria read-only de `docs` em paralelo.
- **Comando:** `npm run verify:all`.
- **Resultado antes da interrupção:** syntax 441 e lint passaram; a suite API tinha iniciado.
- **Interrupção:** `SIGINT`, exit code `130`, deliberadamente, porque a reauditoria encontrou um P1 ativo em MF5-04. O run parcial não é `PASS` nem evidência final.
- **Finding P1:** MF5-04 ainda atribuía a consultores listagem/decisão de privacy requests e geração desses eventos, em contradição com runtime e restantes guias ADMIN-only. Consultor só pode gerar auditoria no domínio separado de revisão cosmética/grant fotográfico.
- **Estado:** `AI-E2E-13` passa a `REABERTO`; corrigir antes de gastar novo run integral.

### 2026-07-11 — Auditoria biométrica coerente com ADMIN-only

- **CWD:** raiz do projeto e MF5-04.
- **Alteração:** MF5-04 reserva listagem, decisão e retry de privacy requests a administradores. A auditoria global continua ADMIN-only. Consultores surgem apenas como negativo 403 ou no domínio separado de revisão cosmética/grant fotográfico, sem autoridade destrutiva.
- **Comandos:** `bash scripts/validate-planificacao.sh`; `git diff --check` de MF5-04/evidence browser; scan pelas formulações contraditórias e comando browser antigo.
- **Exit codes:** validator/diff `0`; scan sem matches `1` esperado.
- **Resultado:** 44 RF, 31 RNF, 74/74/74 BK, links e `overall_pass=true`; zero instrução ativa `consultor/admin` para pedidos destrutivos.
- **Estado:** `AI-E2E-13` fica `PRONTO_PARA_RETESTE` para o último passe read-only e agregador.

### 2026-07-11 — Agregador verde antes de finding de consentimento documental

- **CWD:** `real_dev/api`.
- **Comando:** `npm run verify:all`.
- **Exit code:** `0`.
- **Resultado:** 25 gates verdes no mesmo código: 441 syntax; API 103 ficheiros/669 testes + 1 live skip; frontend 47 unitários/94 contratos; build 90 módulos; smokes; E2E 36 pass/12 skip intencional nos três engines; Axe; budgets; audits zero; planificação `overall_pass=true`.
- **Não fecho:** durante o E2E, a reauditoria semântica encontrou P1 em dois guias de consentimento. Embora o validator estrutural tenha passado, esta execução não é tomada como decisão final e será repetida após correção.

### 2026-07-11 — Contrato documental de consentimento v2 reaberto

- **Finding P1:** MF7-01/MF8-07 ensinavam `openAiConsultation`/`openai_consultation`; o runtime canónico usa `FACE_ANALYSIS_CONSENT_PURPOSE="analise_facial_cosmetica"` e `purposes.openAiAnalysis`. Seguir os snippets causaria `OPENAI_CONSENT_REQUIRED` apesar do consentimento aparente.
- **Estado:** `AI-E2E-03/13` passam a `REABERTO`; corrigir constantes/campos ativos preservando `generativeEdit` e `consultantPhotoAccess` separados.

### 2026-07-11 — Ampliação da reauditoria documental de contratos públicos

- **P1 consent payload:** MF7-01 omitia `version`, `providerConsentAccepted`, `provider="openai"` e notice atual, apesar do validator/service os exigirem para construir `externalProviderConsent`.
- **P1 grant:** plano total/MF7-01 publicavam `POST .../review-photo-access`, que não existe. O grant opcional nasce em `POST .../review-request` com `grantPhotoAccess`/notice; apenas a revogação usa `DELETE .../review-photo-access`.
- **P1 goals:** MF8-08 redefinia o catálogo de goals como strings e usava `.includes(primary)`, destruindo definições/slots versionados. Deve reutilizar `AI_CONSULTATION_GOAL_CODES`, `AI_CONSULTATION_GOALS`, `getAiConsultationGoal` e os nomes reais dos limites.
- **Estado:** `AI-E2E-03/04/13` permanecem/reabrem; o próximo agregador só arranca depois do passe documental completo.

### 2026-07-11 — Reauditoria documental final: sessão, histórico, erasure e cache

- **P1 consentimento adicional:** MF1-05 também reduzia `POST /api/face-consent` a aviso/aceitação, omitindo `version`, `providerConsentAccepted=true` e `provider="openai"`; seguir o guia não satisfaria o validator v2.
- **P1 sessão/conversa:** MF8-08 publicava campos e CAS inexistentes (`questionPlanVersion`, `turns` top-level, `revision`), enquanto o runtime usa `scriptVersion`, `conversation` cifrada e compare-and-set por `__v` com `logicalOperations`.
- **P1 histórico:** MF8-09 documentava paginação e DTOs inexistentes (`page`, `publicId`, `goalLabels`, `reviewStatus`, `unlockStatus`), AAD/coleção errados e um evento `answer_accepted` que o schema de `AiInteractionHistory` rejeita.
- **P1 eliminação:** a mini-lista de ownership de MF8-09 excluía reviews/audits, análises, reports, recomendações, unlocks, grants, previews/quota e bytes derivados, podendo reintroduzir erasure incompleto.
- **P2 export:** MF4-03/MF7-05 ensinavam exports metadata-only sem os headers `Cache-Control: private, no-store, max-age=0` e `Pragma: no-cache` aplicados pelo runtime.
- **P2 allowlist de variantes:** MF8-10 construía a chave base como `productId:`; o runtime canónico usa `buildProductVariantKey(...)=productId:base`, pelo que o snippet rejeitaria produtos sem variante ou criaria uma convenção incompatível.
- **P1 jobs:** MF7-07 ensinava claim por `nextAttemptAt`, `workerId` e `leaseUntil`, campos que não existem; o modelo/runtime usa `availableAt`, lease aninhada com token opaco e compare-and-set na conclusão.
- **P1 auditoria:** MF8-07 chamava `recordBiometricAudit` com uma ação não permitida; o runtime só expõe `recordBiometricAccess` para o enum fechado de acessos biométricos e guarda a provenance OpenAI nos recursos próprios, não num evento inventado.
- **P1 rotas RGPD:** MF5-01/MF7-02 usavam controllers não importados, omitiam `GET /me/privacy-requests` e não aplicavam `ROLES.CLIENTE` ao POST próprio; o snippet não compilava e divergia da autorização real.
- **P1 símbolo de revogação:** MF7-01 chamava `cancelPendingAiJobs`, inexistente; o service público é `cancelAiJobsForUser(userId, { session, now })`.
- **P2 histórico adicional:** MF1-08 prometia cursor/paginação, mas a listagem atual aceita deliberadamente apenas `limit` (1–50), sem cursor nem `page`.
- **P2 capability:** MF7-07 anunciava disponibilidade só por `Boolean(apiKey)`, omitindo modelos/versões/storage sensível e podendo produzir falso-ready; o contrato deve reutilizar `getOpenAiCapabilities` e os seus motivos degradados.
- **P1 polling:** MF8-13 não fazia polling em `asking_questions`/`needs_clarification` sem pergunta ativa nem por operação pendente; o chat ficaria parado depois de uma resposta enquanto `select_next_question` corria.
- **P1 revogação completa:** o snippet de MF7-01 limitava-se a marcar o consentimento e cancelar jobs, omitindo write barrier, provider consent, grants e previews; deve delegar em `revokeFaceConsentForUser` e no seu ciclo transacional idempotente.
- **P2 minimização:** MF8-07 proibia todos os ObjectIds apesar de o relatório precisar dos IDs opacos de produto/variante da allowlist; a proibição correta abrange identificadores pessoais/operacionais, com a exceção comercial explícita.
- **P2 idempotência do unlock:** MF1-07 omitia o header obrigatório `Idempotency-Key`, a sua reutilização em retry e os negativos; o exemplo não satisfaria o controller nem provaria replay.
- **P2 RNF30:** a proibição absoluta de identificadores MongoDB contradizia as referências opacas owner-only necessárias às rotas (`session.id`, `reportId`, etc.); deve proibir IDs pessoais/operacionais desnecessários e qualquer envio desses IDs à OpenAI, não a navegação própria.
- **P2 RNF25:** a proibição absoluta de IDs enviados à OpenAI contradizia a allowlist de `productId`/`variantId`; apenas estas referências comerciais opacas são permitidas, nunca IDs pessoais/operacionais.
- **P1 submit da consulta:** MF8-08 chamava `transitionSessionWithJob`, símbolo inexistente; o endpoint deve delegar no `submitAiConsultationSession` canónico, que trata replay/transação/CAS/job.
- **P1 execução local OpenAI:** o launcher canónico `dev:local` removia sempre `OPENAI_API_KEY`, impossibilitando demonstrar o fluxo real mesmo com opt-in explícito, apesar de manter corretamente a base efémera isolada.
- **P1 catálogo local:** `dev:local` aplicava migrações mas não executava o seed idempotente; cada replica set novo arrancava sem produtos/candidatos. Isto explica o catálogo vazio no ambiente efémero sem implicar eliminação da base remota.
- **P1 bootstrap de demonstração:** a mesma base efémera ficava sem categorias e sem contas locais de consultor/admin; o runner deve chamar o `seedLocalData()` idempotente no próprio processo, sem imprimir passwords, para permitir catálogo, revisão humana e administração.
- **P2 classificação da allowlist:** MF8-10 tratava IDs inventados pela OpenAI como `422`; o runtime classifica output upstream inválido como `502`, sem culpar o pedido do utilizador.
- **P2 configuração transversal:** README/RNF/plano total sugeriam que a chave OpenAI bastava; fora de teste, capability exige também `DATA_ENCRYPTION_KEY` forte e devolve `AI_STORAGE_NOT_CONFIGURED` quando falta.
- **P2 minimização transversal:** README mantinha a proibição absoluta de IDs apesar da allowlist comercial; deve aplicar a mesma exceção estrita de `productId`/`variantId`.
- **P2 rota do consultor:** MF8-13 declarava `/consultoria/revisoes` mas o snippet de guards montava apenas rotas cliente; faltava `ConsultationReviewsPage` protegida por `CONSULTOR`.
- **P2 boundary de análise:** MF1-06 chamava símbolos inexistentes (`requestStructured`, `faceAnalysisSchema`, `validateFaceAnalysisSemantics`); deve usar o client/schema/validador reais da análise OpenAI v2.
- **P2 teaser/freeze:** MF1-07 publicava um DTO bloqueado incompatível (`access` string e campos achatados) e sugeria revisão pós-freeze; o runtime usa `locked`, `access`/`review` aninhados e só revê antes do congelamento.
- **P2 preview MF2-07:** o guia chamava `buildFrozenMakeupEditPrompt` inexistente e omitia os campos obrigatórios de consentimento generativo no POST.
- **P2 report vivo:** a regra normativa ainda dizia `409 CONSULTATION_REQUIRED` para endpoints antigos, embora o runtime final os tenha desmontado e os testes exijam `404`; o histórico cronológico de transição permanece preservado.
- **Estado runtime:** `AI-E2E-01/05/12` passam a `REABERTO`; o runner deve preservar OpenAI apenas por opt-in, nunca carregar `.env`/Mongo remoto, e popular o catálogo local sem delete/reset antes do novo gate.
- **Estado:** `AI-E2E-03/04/11/13` ficam `REABERTO`; cada contrato será alinhado e sujeito a scan/validator antes do agregador final.

### 2026-07-11 — Bootstrap efémero e opt-in OpenAI do runtime local

- **CWD:** `real_dev/api`.
- **Alteração:** `dev:local` mantém o scrub integral por defeito, mas aceita OpenAI real apenas com `ORELLE_LOCAL_OPENAI_ENABLED=true` e chave explícita. Só copia a allowlist de chave/modelos/versões/timeouts; `.env`, URI MongoDB, fixture mode e restantes segredos continuam excluídos. Depois das migrações, o mesmo processo executa `seedLocalData()` idempotente para contas, categorias e catálogo.
- **Regressões:** o contrato prova opt-in desligado por defeito, flag inválido, chave em falta, allowlist, `DATA_ENCRYPTION_KEY` local e ausência de Mongo/fixture herdados; o seed estático prova os três datasets e ausência de `deleteMany`.
- **Primeiro arranque real:** `npm run dev:local`, fora do sandbox por necessidade de loopback, falhou com erro sanitizado `Produto invalido`. A falha não foi convertida em sucesso.
- **Causa raiz:** `Oleo de Limpeza Desmaquilhante` ficava `aiEligible=true` mas sem `concernTags`, porque a curadoria procurava `squalane` apenas em nome/descrição e ignorava INCI.
- **Correção:** a classificação determinística inclui `ingredientNames`; teste puro valida os 25 produtos, metadata obrigatória, variantes e preservação do stock.
- **Validação focal:** `node --check` e `npm test -- tests/local-dev-runtime.test.js tests/seed-safety.test.js`, exit code `0`; 2 ficheiros e 12/12 testes passaram.
- **Reteste real:** `npm run dev:local` arrancou com sucesso; o log sanitizado confirmou `orelle_local_dev`, replica set local, 8 utilizadores, 4 categorias, 25 produtos e OpenAI degradada por defeito. `GET /api/catalog/products`, por loopback, devolveu `200` e os 25 produtos curados; o processo foi encerrado por `SIGINT` depois da prova.
- **Garantias:** nenhuma URI/chave foi impressa ou herdada; a base remota não foi consultada; o bootstrap não elimina produtos nem repõe stock existente.
- **Estado:** `AI-E2E-01/05` ficam `PRONTO_PARA_RETESTE`; `AI-E2E-12` continua `REABERTO` até agregador e reauditoria finais.

### 2026-07-11 — Contratos documentais executáveis e live smoke multimodal

- **CWD:** raiz do projeto, `real_dev/api` e documentação canónica.
- **Alterações documentais:** consentimento v2/payload/grant/revogação; goals/model/CAS/submit; histórico `limit`/DTO/AAD/erasure; jobs/capability; allowlist/502; exports `no-store`; routes RGPD; polling/guard consultor; teaser/freeze/idempotency; preview e quality gate foram alinhados aos símbolos e shapes reais. RNF25/RNF30 distinguem referências comerciais/owner-only estritamente necessárias de IDs pessoais/operacionais proibidos.
- **Arranque:** README e MF8/00 explicam base descartável, ausência de acesso remoto, seed 8/4/25, contas locais, opt-in OpenAI allowlist-only, `DATA_ENCRYPTION_KEY` e possível Organization Verification do GPT Image.
- **Live smoke:** `openai.live.test.js` passou de uma pergunta textual para um percurso opt-in com dois retratos vetoriais sintéticos em memória, vision, relatório estruturado com allowlist e edição `gpt-image-2`; valida provenance e output WebP sem usar PII/fotografias reais.
- **Comando live sem credencial:** `node --check tests/openai.live.test.js && npm run test:ai:live`, exit code `0`, mas 1 ficheiro/1 teste `skipped`. Continua `BLOQUEADO_EXTERNO`, não `PASS`; uma execução real consome créditos e pode exigir verificação da organização.
- **Validação docs:** `bash scripts/validate-planificacao.sh`, auditor Python e `git diff --check` scoped, exit code `0`; 44 RF, 31 RNF, 74/74/74 BK, links/coverage/consistency/guides/naming e `overall_pass=true`.
- **Estado:** `AI-E2E-03/04/11/13` ficam `PRONTO_PARA_RETESTE`; aguardam reauditoria independente posterior e `verify:all` no mesmo estado.

### 2026-07-11 — Último alinhamento do snippet de configuração/provider OpenAI

- **CWD:** raiz do projeto e guia MF7-07.
- **Alteração:** o excerto de `env` passou a reproduzir `readOptionalEnvValue` e as constantes `DEFAULT_OPENAI_*` do runtime; o exemplo de `createOpenAiResponsesClient().requestStructured(...)` foi formatado com o fecho correto. Não foi criado um leitor/provider paralelo nem alterado qualquer contrato de produto.
- **Fonte oficial:** o MCP `openaiDeveloperDocs` reconfirmou input multimodal na Responses API, Structured Outputs com `json_schema`/`strict`, edição de imagens e a regra de omitir `input_fidelity` em `gpt-image-2`; Organization Verification continua documentada apenas como possível pré-requisito.
- **Validação:** pendente do checker de fences, validator canónico, auditor e scan semântico no estado posterior.
- **Estado:** `AI-E2E-13` permanece `EM_IMPLEMENTACAO` até esse reteste e à reauditoria independente.

### 2026-07-11 — Reteste documental após o alinhamento OpenAI

- **CWD:** raiz do projeto.
- **Comandos:** `bash scripts/validate-planificacao.sh`; `python3 docs/planificacao/scripts/auditar_planificacao.py`; `git diff --check -- README.md docs`; checker de fences em todos os Markdown de `README.md`/`docs`.
- **Exit codes:** `0` em todos.
- **Resultado:** 44 RF, 31 RNF e 74/74/74 BK; coverage, consistency, guides, naming, links e `overall_pass=true`; nenhum fence ímpar ou whitespace inválido.
- **Estado:** `AI-E2E-13` fica `PRONTO_PARA_RETESTE`; a decisão final continua dependente da reauditoria independente e do agregador integral posterior.

### 2026-07-11 — Agregador final interrompido por dois P2 independentes

- **CWD:** `real_dev/api` e reauditorias read-only paralelas.
- **Comando:** `npm run verify:all`.
- **Resultado:** execução terminada deliberadamente antes do fecho; não é `PASS` nem evidência final.
- **P2 lifecycle:** a substituição autorizada do par de fotografias removia os bytes fonte, mas não cancelava `generate_makeup_preview`, não eliminava previews concluídos derivados e não repetia o CAS de fotografia ativa depois da chamada OpenAI. Uma corrida podia publicar output derivado de fotografia entretanto eliminada.
- **P2 bootstrap:** o arranque real 8/4/25 já tinha sido observado manualmente e os seeds tinham testes estáticos, mas faltava uma integração persistente que provasse no mesmo replica set as contagens, idempotência e preservação de stock.
- **Estado:** `AI-E2E-03/05/09/12` passam a `EM_IMPLEMENTACAO`; ambos exigem regressões positivas/negativas/concorrentes antes de novo agregador.

### 2026-07-11 — Contradição residual na minimização documental

- **CWD:** guia MF8-07, reauditoria independente read-only.
- **P2:** duas frases proibiam genericamente todos os IDs apesar de o próprio guia permitir, de forma correta e estrita, `productId`/`variantId` comerciais da allowlist. O contrato real proíbe identificadores pessoais/operacionais, cookies, paths e segredos; as duas referências comerciais opacas são necessárias à validação autoritativa do catálogo.
- **Estado:** `AI-E2E-13` passa a `EM_IMPLEMENTACAO` antes da correção textual e do novo scan/validator.

### 2026-07-11 — Reteste da minimização documental

- **CWD:** raiz do projeto e guia MF8-07.
- **Alteração:** as duas frases residuais distinguem agora IDs pessoais/operacionais proibidos da exceção estrita de `productId`/`variantId` comerciais opacos da allowlist.
- **Comandos:** validator canónico, auditor Python, `git diff --check`, checker de fences e scan pelas duas formulações absolutas anteriores.
- **Exit codes:** validadores/diff/fences `0`; scan sem matches `1` esperado.
- **Resultado:** 44 RF, 31 RNF, 74/74/74 BK e `overall_pass=true`; zero contradição ativa conhecida no contrato de minimização.
- **Estado:** `AI-E2E-13` fica `PRONTO_PARA_RETESTE` até o passe final posterior aos dois P2 de runtime/teste.

### 2026-07-11 — Integração persistente do bootstrap local 8/4/25

- **CWD:** `real_dev/api`.
- **Alteração:** a integração `local-dev-runtime.replset.integration.test.js` executa `seedLocalData()` no replica set isolado e prova 8 utilizadores, 4 categorias e 25 produtos; o replay preserva IDs, stock agregado e stock das variantes. O teste fixa `DOTENV_CONFIG_PATH=/dev/null` e recusa topologia não-loopback.
- **Primeira execução:** sandbox bloqueou o bind com `listen EPERM`; não foi convertida em sucesso.
- **Reteste autorizado:** focal 2/2 e regressão runtime/seed de 3 ficheiros/14 testes, exit code `0`.
- **Garantias:** não houve alteração no seed/runtime, leitura de `.env`, MongoDB remoto, reset ou eliminação de catálogo.
- **Estado:** `AI-E2E-05` fica `PRONTO_PARA_RETESTE`; `AI-E2E-12` permanece `EM_IMPLEMENTACAO` até corrigir o lifecycle de previews e repetir o gate integral.

### 2026-07-11 — Lifecycle transacional de previews derivados na substituição fotográfica

- **CWD:** `real_dev/api`.
- **Alteração:** a substituição identifica simulações derivadas do par anterior, coloca outputs concluídos no mesmo outbox, cancela jobs `generate_makeup_preview`, marca as simulações `cancelled` e remove referências/cifra do output no mesmo commit. A publicação pós-provider usa `claimFaceDataWrite` e relê consentimento, fotografia ativa e estado `processing`; a ordem entre publicação/substituição fica linearizável. Um ficheiro escrito antes de conflito final entra no outbox `makeup_failed_publish`.
- **Testes novos:** preview concluído é removido física e logicamente; corrida `provider em curso × substituição` cancela job/simulação, devolve `MAKEUP_SOURCE_PHOTO_REPLACED` e não chama o storage writer.
- **Falha de comando preservada:** uma tentativa usou o script inexistente `npm run test:syntax`; não foi classificada como validação. O comando canónico posterior foi `npm run check:syntax`.
- **Evidência do implementador:** 9 ficheiros/54 testes focais e syntax de 441 ficheiros, exit code `0`.
- **Reteste coordenado:** `node --check` nos quatro ficheiros críticos e lote combinado de lifecycle/bootstrap/runtime/seed com 5 ficheiros/27 testes, exit code `0` em replica sets efémeros.
- **Garantias:** output de fotografia substituída deixa de ser servível; consentimento/revogação, idempotência, outbox e eliminação de conta mantêm as regressões anteriores.
- **Estado:** `AI-E2E-03/09` ficam `PRONTO_PARA_RETESTE`; `AI-E2E-12` permanece `EM_IMPLEMENTACAO` até reauditoria posterior e `verify:all` integral.

### 2026-07-11 — Reauditoria da prova do bootstrap: duas lacunas P2

- **CWD:** `real_dev/api`, passe read-only posterior ao novo teste.
- **P2 preservação:** o replay ocorria sem perturbar previamente o stock; um seed regressivo que repusesse sempre os valores iniciais ainda passaria. O teste deve alterar stock agregado e uma variante de forma coerente antes do replay.
- **P2 orquestração:** a integração provava replica set/migrations/seed por componentes, mas não arrancava o processo fresco `run-local-dev.mjs` com ambiente hostil. Faltava uma prova conjunta de scrub de URI/`.env`/secrets, health, capability degradada e bootstrap 8/4/25 através do runner real.
- **Estado do runtime:** a inspeção confirmou `$setOnInsert.stock`/preservação e a execução manual anterior do runner 8/4/25; os findings são de cobertura, não regressões atualmente reproduzidas.
- **Estado:** `AI-E2E-01/05/12` ficam `EM_IMPLEMENTACAO` até reforço dos testes, reteste e reauditoria.

### 2026-07-11 — Reauditoria independente do lifecycle de previews

- **CWD:** `real_dev/api`, revisão read-only por agente diferente do implementador.
- **Resultado:** zero P0/P1/P2. Foram reconfirmados outbox/remoção física, invalidação lógica, corrida linearizada provider×substituição, CAS que impede conclusão/reclassificação sem lease e job terminal `cancelled` sem lease.
- **Evidência:** syntax dos dois services e 3 ficheiros/16 testes focais, exit code `0`; nenhum ficheiro alterado pelo auditor.
- **Estado:** `AI-E2E-03/09` passam a `VALIDADO`; o gate global continua aberto apenas pelas duas lacunas de prova do runner/stock e pelo agregador final.

### 2026-07-11 — Reauditoria independente final da minimização documental

- **CWD:** README, RNF25/RNF30 e guia MF8-07, inspeção read-only.
- **Resultado:** zero P0/P1/P2. Identificadores pessoais/operacionais continuam proibidos; apenas `productId`/`variantId` comerciais opacos entram na allowlist OpenAI e referências owner-only estritamente necessárias ficam limitadas à navegação/retoma própria.
- **Estado:** `AI-E2E-13` passa a `VALIDADO`; nenhum ficheiro foi alterado pelo auditor.

### 2026-07-11 — Prova hostil do runner real e preservação de stock perturbado

- **CWD:** `real_dev/api`.
- **Alteração de replay:** depois do primeiro seed, o teste reduz coerentemente o stock agregado e o stock de uma variante; o segundo `seedLocalData()` deve preservar exatamente o snapshot perturbado, IDs e contagens. Um reset regressivo aos valores seed deixa agora o teste vermelho.
- **Alteração de orquestração:** novo processo Node fresco executa `run-local-dev.mjs --runtime-mode=dev:local` com URI remota reservada, path `.env`, chave OpenAI, fixture mode e segredos sentinela herdados. O runner arranca noutra porta loopback, anuncia 8/4/25, responde readiness, catálogo 25/categorias 4 e capability OpenAI degradada; nenhum sentinela aparece no output e o processo termina por `SIGINT` com fallback limitado.
- **Validação:** syntax dos dois testes; integração isolada 1/1; lote runtime/runner/seed 4 ficheiros/15 testes, exit code `0`, sem acesso à URI sentinela.
- **Estado:** `AI-E2E-01/05` ficam `PRONTO_PARA_RETESTE`; `AI-E2E-12` continua `EM_IMPLEMENTACAO` até reauditoria independente e agregador final.

### 2026-07-11 — Hardening residual da prova `.env` hostil

- **CWD:** novo teste do orquestrador, reauditoria read-only.
- **Resultado:** preservação do stock perturbado e execução do CLI/health/seed/capability/teardown ficaram confirmadas. Restou P2 apenas na hermeticidade do teste: o path `.env` não existia, o child espalhava `process.env` e a URI sentinela era não-loopback.
- **Correção planeada:** criar `.env` temporário real com opt-in/chaves sentinela, omitir opt-in do ambiente direto, transmitir apenas as variáveis mínimas e usar URI impossível `127.0.0.1:1`; capability degradada provará que o ficheiro não foi carregado sem permitir tráfego remoto.
- **Estado:** `AI-E2E-01/12` permanecem `EM_IMPLEMENTACAO`; não existe finding confirmado no runner de produto.

### 2026-07-11 — Reteste hermético do `.env` e ambiente hostis

- **CWD:** `real_dev/api`.
- **Alteração:** o teste cria um `.env` temporário 0600 com opt-in OpenAI/chave/URI/sessão sentinela, mas o child recebe apenas um ambiente mínimo sem opt-in direto. A URI hostil usa `127.0.0.1:1`, pelo que até uma regressão não produziria tráfego remoto. O cleanup remove processo e diretório temporário em `finally`.
- **Critério:** o runner só passa se ignorar o ficheiro e os secrets herdados, criar o seu replica set loopback, manter OpenAI degradada e publicar 8/4/25; qualquer dotenv carregado tornaria a capability ativa ou o arranque inválido.
- **Comando:** syntax e lote do orquestrador + seed perturbado, 2 ficheiros/3 testes, exit code `0`.
- **Estado:** `AI-E2E-01/05` ficam `PRONTO_PARA_RETESTE`; `AI-E2E-12` permanece `EM_IMPLEMENTACAO` até reauditoria e `verify:all`.

### 2026-07-11 — Reauditoria independente final do runner/seed

- **CWD:** dois testes de runtime local, inspeção read-only posterior.
- **Resultado:** zero P0/P1/P2. O auditor confirmou `.env` real 0600, ausência de opt-in direto, ambiente mínimo, URI `127.0.0.1:1`, CLI/health/8-4-25/capability, verificação de logs, SIGINT/SIGKILL e cleanup; confirmou também a preservação do stock perturbado e IDs.
- **Estado:** `AI-E2E-01/05` passam a `VALIDADO`. A reauditoria global paralela devolveu igualmente zero novos P0–P2; resta apenas `verify:all` e o fecho formal.

### 2026-07-11 — `verify:all` final falhou no worker de ficheiros

- **CWD:** `real_dev/api`.
- **Comando:** `npm run verify:all`.
- **Exit code:** `1`; o agregador parou no gate API.
- **Resultado:** syntax 442 e lint passaram; API terminou com 105 ficheiros (103 pass, 1 fail, 1 live skip) e 676 testes (674 pass, 1 fail, 1 skip). Falhou apenas `private-file-runtime.replset.integration.test.js` no cenário de expiração: `expiredOutputs=1`, mas o job recém-criado devolveu `claimed=0/completed=0`.
- **Decisão:** a falha não é ambiental nem `PASS`. O comportamento/relógio do enqueue/claim será diagnosticado, retestado isoladamente e depois no agregador completo.
- **Estado:** `AI-E2E-11/12` ficam `EM_IMPLEMENTACAO`; nenhuma decisão de fecho é emitida.

### 2026-07-11 — Relógio transacional comum no sweep/outbox

- **CWD:** `real_dev/api`.
- **Causa raiz:** `runPrivateFileMaintenanceOnce({ now })` fazia o sweep com o relógio injetado, mas `enqueueFileDeletionJobs` atribuía `availableAt=new Date()` internamente. O job criado durante o próprio tick podia ficar alguns milissegundos no futuro — ou permanentemente futuro num teste com relógio fixo — e só seria reclamado no tick seguinte.
- **Alteração:** `enqueueFileDeletionJobs` aceita/valida `availableAt`; a expiração de `MakeupSimulation` transmite o mesmo `now` da transação. Restantes callers conservam o default real atual.
- **Reteste:** syntax dos dois services e 3 ficheiros/11 testes de worker, expiração, idempotência e runtime privado, exit code `0`; o cenário anteriormente vermelho reclama e conclui o job no mesmo tick.
- **Estado:** `AI-E2E-11` fica `PRONTO_PARA_RETESTE`; `AI-E2E-12` continua `EM_IMPLEMENTACAO` até reauditoria e repetição integral.

### 2026-07-11 — Reauditoria independente do relógio do outbox

- **CWD:** services do outbox/expiração, inspeção read-only.
- **Resultado:** zero P0/P1/P2. O auditor confirmou validação de `Date`, mesmo `now`, claim `$lte`, idempotência por deduplication/`$setOnInsert` e atomicidade entre estado `expired`, remoção de referências e enqueue.
- **Estado:** `AI-E2E-11` passa a `VALIDADO`; `AI-E2E-12` mantém-se aberto apenas para o novo `verify:all`.

### 2026-07-11 — `verify:all` final no estado consolidado

- **CWD:** `real_dev/api`.
- **Comando:** `npm run verify:all`, com replica sets efémeros, serviços loopback, browsers locais e advisory database; o orquestrador remove `.env`, URI MongoDB e credenciais herdadas.
- **Exit code:** `0`.
- **Resultado:** os 25 gates passaram no mesmo estado do código. Syntax validou 442 ficheiros; API executou 105 ficheiros, com 104 passados e 1 live skip, e 676 testes, com 675 passados e 1 live skip; frontend executou 14 ficheiros/47 testes unitários e 94 contratos; build Vite processou 90 módulos; E2E terminou com 36 passados e 12 skips intencionais em Chromium, Firefox e WebKit; Axe não encontrou violações serious/critical; audits API/web reportaram zero vulnerabilidades.
- **Performance:** JS inicial 65 324 bytes gzip; 175 imagens dentro dos budgets; catálogo publicado com 25 produtos, 150 variantes e 8 018 679 bytes de imagens; os 53 chunks lazy são inventário, enquanto o Playwright mede transferência, LCP e CLS por rota.
- **Persistência e isolamento:** foram aplicadas 15 migrações na base isolada `orelle_e2e_test`; concorrência, rollback, backup/restore/verify, ficheiros privados e invariantes de catálogo passaram sem OpenAI ou MongoDB remotos.
- **Classificação:** esta é a evidência integral final. O único teste omitido é `test:ai:live`, que permanece corretamente `BLOQUEADO_EXTERNO` por ausência de credencial/créditos.

### 2026-07-11 — Tentativas iniciais dos scans finais

- **CWD:** raiz do projeto.
- **Comando IA:** primeira composição de `rg` com quoting inválido.
- **Exit code:** `1`.
- **Resultado:** o shell devolveu `unmatched '`; não houve scan válido nem foi alegado sucesso.
- **Comando pagamento:** primeira lista de paths incluiu `payment-simulation.provider.js`, ficheiro inexistente.
- **Exit code:** `2`.
- **Resultado:** a seleção de ficheiros estava errada; o comando foi corrigido para os módulos reais antes de produzir evidência.

### 2026-07-11 — Scans estáticos finais corrigidos

- **CWD:** raiz do projeto.
- **Comandos:** scans `rg` separados sobre runtime, bundle, módulos de pagamento e report; `git status --short -- apps`; `git check-ignore real_dev`; Node/npm e SHA-256 dos lockfiles; validator/auditor de planificação, fences e `git diff --check -- README.md docs`.
- **Exit codes:** `0` nos validadores/checks; `1` apenas nos scans negativos sem ocorrências, como esperado.
- **Resultado:** zero modo/provider runtime `demo`/`external` ou `AI_PROVIDER_MODE` fora das migrações históricas; zero Stripe/PayPal/MBWay/gateway/`checkoutUrl`, `fetch`, HTTP, axios ou XHR nos módulos de pagamento; zero localhost, URI MongoDB ou segredo utilizável no bundle/report; zero alterações observáveis em `apps/`; `real_dev/` continua ignorado por `.gitignore:2`.
- **Ambiente:** Node `v24.11.1`, npm `11.6.2`; hashes finais dos locks iguais ao baseline: API `043baf15c773fbc61859a975a16ce56848f7bf75df80e7b947f6bba087c85b73`, web `f39eb47b1eac5bcf26b81d2441bb237ee007f6ce73f27a573ba567ee134c5a03`.
- **Documentação:** validator/auditor verdes com 44 RF, 31 RNF e 74/74/74 BK; links, fences, coverage, consistency, naming e `overall_pass=true`; diff documental sem whitespace inválido.

### 2026-07-11 — Reauditoria integral independente de fecho

- **CWD:** raiz do projeto, `real_dev/api`, `real_dev/web`, `README.md` e `docs`.
- **Ação:** revisões read-only independentes dos últimos contratos de lifecycle de previews, runner/seed, relógio do outbox, minimização documental e scope, posteriores às respetivas correções e ao `verify:all` final.
- **Exit code:** n/a para inspeção; as regressões focais citadas em cada finding e o agregador final terminaram com `0`.
- **Resultado:** zero P0, zero P1 e zero P2 aberto. Não foram editados ficheiros pelos auditores; não existe finding aceite por mera alegação ou por falha ambiental.
- **Decisão:** todos os findings `AI-E2E-00`–`AI-E2E-13` cumprem os critérios de aceitação e passam individualmente a `FECHADO`. O estado global é `CONCLUIDO_COM_BLOCKERS_EXTERNOS` apenas pelos itens externos enumerados na secção 9.6.

### 2026-07-11 — Validação documental posterior ao fecho formal

- **CWD:** raiz do projeto.
- **Comandos:** `bash scripts/validate-planificacao.sh`; `python3 docs/planificacao/scripts/auditar_planificacao.py`; `git diff --check -- README.md docs`; checker de fences Markdown; scan de URI/chave/segredo no report; `git status --short -- apps`.
- **Exit codes:** validator, auditor, diff, fences e scope `0`; scan de segredos `1` por não encontrar qualquer ocorrência, resultado esperado.
- **Resultado:** 44 RF, 31 RNF e 74/74/74 BK; coverage, consistency, guides, naming e `overall_pass=true`; fences pares, diff limpo, report sem URI/chave/segredo e `apps/` sem alterações observáveis.
- **Decisão:** o próprio ato de fechar o report não introduziu regressão documental, exposição de segredo ou scope creep.

### 2026-07-11 — Reabertura pós-fecho: comunicação visual da Home

- **CWD:** raiz do projeto e `real_dev/web`.
- **Pedido:** restaurar uma imagem editorial no hero e acrescentar, entre o hero e “Porque escolher a Orélle?”, uma secção promocional em duas colunas para explicar a consulta OpenAI através de um exemplo publicitário, não de um resultado real.
- **Inspeção:** o JSX já não continha a imagem nem a secção; os estilos `.mockup-hero__image`, `.mockup-ai-section`, `.mockup-ai-grid` e `.mockup-chat-card` permaneciam no CSS. Não existe asset de hero reutilizável no runtime atual.
- **Decisão de design:** gerar um retrato próprio da marca; usar no segundo bloco uma conversa e mini-relatório explicitamente marcados como “Exemplo ilustrativo”, sem antes/depois de pele e sem apresentar recomendações fictícias como resultados reais.
- **Estado:** `AI-E2E-10` passa para `EM_IMPLEMENTACAO` e `AI-E2E-12` para `REABERTO` antes de editar código; G5/G7 exigem regressão frontend, build, budgets, acessibilidade e inspeção visual posterior.

### 2026-07-11 — Hero editorial e secção promocional implementados

- **CWD:** `real_dev/web`.
- **Asset:** retrato editorial próprio gerado para a Home, sem texto/logos/watermark, com pele natural, pessoa no terço direito e espaço negativo para a copy. O output selecionado foi convertido por Sharp para seis variantes responsivas AVIF/WebP de 640/960/1536 px; a maior variante ocupa 38 KiB em WebP e 27 KiB em AVIF.
- **Código:** o hero usa `OptimizedImage`, `picture`, dimensões explícitas, `srcset`, `sizes`, eager e `fetchpriority=high`. Entre hero e features foi acrescentada a secção “Uma consulta que começa por te ouvir”, com três benefícios, CTA real e mock de conversa/relatório explicitamente marcado como exemplo publicitário não real.
- **Segurança de produto:** não existe antes/depois de pele, diagnóstico, percentagem falsa, typing artificial, recomendação de produto inventada ou conteúdo completo escondido; o CTA respeita autenticação/role existentes.
- **Comandos:** `npm run lint`; `npm run test:unit`; `npm run test:contracts`; `npm run build`; image/page budgets; smokes MF6 images/runtime, MF7 compatibilidade e MF8 consulta.
- **Exit codes:** `0` em todos.
- **Resultados:** 14 ficheiros/48 testes unitários, 94 contratos, build de 90 módulos, JS inicial 65 343 bytes gzip, 181 imagens dentro do budget e todos os smokes selecionados verdes.
- **Estado:** `AI-E2E-10` fica `PRONTO_PARA_RETESTE`; `AI-E2E-12` permanece `EM_IMPLEMENTACAO` até inspeção visual, responsive/Axe no browser e fecho posterior.

### 2026-07-11 — Inspeção visual e primeira tentativa Axe pós-Home

- **CWD:** `real_dev/web`, aplicação local em `127.0.0.1`.
- **Browser:** inspeção read-only da Home a 1280×720, 375×812 e 320×800. O hero carregou AVIF responsivo com a pessoa no lado direito; a copy/CTAs mantiveram legibilidade; a secção promocional antecede “Porque escolher a Orélle?”, o mock permanece rotulado como ilustrativo e não existe overflow horizontal a 375/320 px.
- **Comando:** Playwright público/Axe direto contra o servidor de desenvolvimento já aberto.
- **Exit code:** `1`.
- **Resultado:** 2/4 casos passaram, incluindo “home utilizável a 320 píxeis”; dois casos pararam antes do Axe porque a suite esperava a fixture E2E isolada de 3 produtos e encontrou a base local com 25 produtos/6 destaques. Não é classificado como `PASS` nem como regressão visual; o catálogo não será alterado para satisfazer uma fixture errada.
- **Próximo passo:** repetir acessibilidade/E2E através do orquestrador canónico, que cria a sua própria base efémera e fixtures, mantendo `AI-E2E-12` aberto.

### 2026-07-11 — E2E isolado e QA visual final da nova Home

- **CWD:** `real_dev/api` e `real_dev/web`.
- **Comando canónico:** `npm run test:e2e` através do orquestrador API, com MongoDB efémero, gateway same-origin e build novo.
- **Exit code:** `0`.
- **Resultado:** 36 testes passaram e 12 skips intencionais permaneceram em Chromium, Firefox e WebKit. A Home passou Axe sem violações bloqueantes, performance, teclado, 320/375/768/1280 sem overflow e viagem integrada; base `orelle_e2e_test`, 15 migrações, 5 utilizadores, 3 produtos e 3 imagens de fixture.
- **Inspeção adicional:** browser local confirmou a composição e hierarquia a 1280, 375 e 320 px, `640.avif` em mobile, `1536.avif` em desktop, tema claro/escuro, ausência de overflow e zero erro de consola. O tema e viewport temporários foram repostos no final.
- **Estado:** `AI-E2E-10` passa a `VALIDADO`; `AI-E2E-12` fica `PRONTO_PARA_RETESTE` apenas para a reauditoria read-only independente desta alteração.

### 2026-07-11 — Reauditoria independente da Home: contraste reaberto

- **CWD:** `real_dev/web`, inspeção read-only por agente diferente do implementador.
- **Resultado:** zero P0/P1 e um P2. O eyebrow “Consulta Orélle” e o label “Resumo final” usam texto de 0,72 rem com `var(--mockup-secondary)`; o contraste calculado é insuficiente nos temas claro e escuro, apesar de o Axe automatizado não o ter sinalizado neste run.
- **Decisão:** substituir por um token de texto AA sem aumentar artificialmente o tamanho; repetir lint/unit/contratos, build/budget, contraste calculado e reauditoria focal.
- **Estado:** `AI-E2E-10` regressa a `EM_IMPLEMENTACAO` e `AI-E2E-12` a `REABERTO`; o finding não é aceite como risco visual.

### 2026-07-11 — Contraste AA e semântica do exemplo corrigidos

- **CWD:** `real_dev/web`.
- **Alteração:** os dois labels pequenos usam agora `var(--muted)`; o contraste calculado é 5,74:1 no tema claro, 10,49:1 no escuro e 15,52:1 no alto contraste. As três etapas passaram para `ol/li` e cada mensagem do transcript recebeu origem acessível, fechando também os dois riscos P3 comunicados pelo auditor.
- **Comandos:** ESLint; 14 ficheiros/48 unitários; 95 contratos; build Vite de 90 módulos; smokes de imagens, runtime e page budget; cálculo independente dos três rácios.
- **Exit codes:** `0` em todos.
- **Budgets:** JS inicial 65 317 bytes gzip; 181 imagens no limite; seis variantes do hero continuam muito abaixo de 300 KiB.
- **Estado:** correção pronta para a reauditoria focal posterior; `AI-E2E-10/12` não fecham antes desse parecer.

### 2026-07-11 — Fecho independente da alteração visual pós-Home

- **CWD:** `real_dev/web`, revisão read-only posterior às correções.
- **Finding P3 intermédio:** o auditor observou que `aria-label` num `div` sem role podia ser ignorado por algumas tecnologias de apoio. As três mensagens passaram a `role="group"` e os testes exigem dois grupos “Mensagem da IA” e um “Mensagem do utilizador”.
- **Reteste:** ESLint, 5/5 unitários focais e 14/14 contratos focais passaram, exit code `0`.
- **Reauditoria final:** zero P0/P1/P2/P3. O auditor reconfirmou contraste AA nos três temas, lista ordenada das etapas, nomes acessíveis das mensagens, paths/variantes do hero, copy não enganosa, rotas e ausência de regressão responsive/performance.
- **Decisão:** `AI-E2E-10` e `AI-E2E-12` regressam individualmente a `FECHADO`; o estado global volta a `CONCLUIDO_COM_BLOCKERS_EXTERNOS`, mantendo apenas os blockers externos anteriores sem criar novos.

### 2026-07-11 — Reabertura por feedback visual da secção de IA

- **CWD:** `real_dev/web` e report vivo.
- **Feedback:** o cartão de chat parece operacional/genérico, repete demasiado a natureza publicitária, usa a marca “OpenAI” sem necessidade e não mostra a funcionalidade visual de maquilhagem.
- **Decisão de design:** retirar toda a marca OpenAI da Home; substituir copy de processo por benefícios; manter apenas uma conversa editorial mínima; tornar uma comparação original/pré-visualização de maquilhagem da mesma identidade no elemento dominante; apresentar uma única nota discreta “Imagem gerada por IA — o resultado real poderá variar”.
- **Asset:** editar de forma não destrutiva o retrato já aprovado, alterando apenas maquilhagem e preservando identidade, pele, pose, cabelo, roupa, luz, fundo e enquadramento.
- **Estado:** `AI-E2E-10` passa a `EM_IMPLEMENTACAO` e `AI-E2E-12` a `REABERTO` antes de editar runtime; G5/G7 exigem novos testes, budgets, Axe, responsive, browser e reauditoria independente.

## 9. Validação final e decisão

### 9.1 Gates finais

| Gate | Estado | Evidência atual |
|---|---|---|
| G0 | `PASS` | Report vivo completo; baseline/hashes fixos; migrações e seeds provam IDs, contagem e stock; runner hostil prova isolamento local. |
| G1 | `PASS` | OpenAI-only, capability degradada, fallback entre modelos OpenAI, jobs duráveis, leases/retry/restart e configuração negativa dentro da suite API final. |
| G2 | `PASS` | Consentimento v2, upload/qualidade, substituição transacional, 5–8 perguntas, retoma, CAS, injection e concorrência validados. |
| G3 | `PASS` | 25 produtos curados, variantes/INCI, allowlist, restrições, relatório v2 imutável e recomendações 3–5 ou cobertura limitada validados. |
| G4 | `PASS` | Revisão opcional, clarification, grant, freeze, cálculo inteiro de 10%, pagamento simulado/voucher atómicos e preview OpenAI validados. |
| G5 | `PASS` | Rotas e fluxo frontend, E2E nos três engines, Axe, teclado, responsive e budgets passaram. |
| G6 | `PASS` | Privacy requests, erasure, export metadata-only/no-store, outbox, TTL e backup/restore/verify cifrado passaram. |
| G7 | `PASS_COM_BLOCKERS_EXTERNOS` | `verify:all` 25/25, audits zero, planificação verde e reauditoria zero P0–P2; apenas validações externas da secção 9.6 não foram inventadas. |

### 9.2 Fecho individual dos findings

| ID | Evidência positiva | Negativo/concorrência material | Risco residual e decisão |
|---|---|---|---|
| `AI-E2E-00` | Report precedeu o código; hashes, versões, catálogo e migrações registados. | Runner hostil ignora `.env`/URI/segredos; replay preserva stock perturbado e IDs. | Nenhum finding local aberto; `FECHADO`. |
| `AI-E2E-01` | Sete goals e OpenAI Responses/Structured Outputs com provenance e fallback OpenAI passaram. | Sem chave/storage forte fica degradado; output/HTTP/timeout inválido percorre retry/fallback sem fabricar resultado. | Live OpenAI externo não executado; implementação local `FECHADO`. |
| `AI-E2E-02` | Claim, lease/heartbeat, retry, recovery, replay e workers no servidor/E2E passaram. | 25 pedidos reutilizam um job; lease perdida/cancelada impede publicação; restart e última lease recuperam. | Nenhum finding local aberto; `FECHADO`. |
| `AI-E2E-03` | Consentimento v2, par frontal/lateral, normalização/EXIF, quality profile e revogação passaram. | Foto inadequada não chama OpenAI; revogação/substituição cancela jobs e a corrida com provider não publica derivados. | Validação fotográfica OpenAI live bloqueada externamente; `FECHADO`. |
| `AI-E2E-04` | Sete objetivos, tiers e conversa persistida de 5–8 perguntas com retoma passaram. | Injection/opções/texto inválidos são rejeitados; 25 respostas concorrentes aceitam um único CAS; rollback não perde transcript. | Nenhum finding local aberto; `FECHADO`. |
| `AI-E2E-05` | Seed local publica 8 utilizadores, 4 categorias, 25 produtos e 150 variantes curadas. | Produto/tag/variante/metadata inválidos falham; replay após perturbar stock preserva stock e IDs; seed não elimina produtos. | Nenhum finding local aberto; `FECHADO`. |
| `AI-E2E-06` | Relatório v2 estruturado, teaser, snapshots, allowlist e cobertura 1–5 conforme catálogo/orçamento passaram. | IDs inventados, alergia, tag, preço, variante e stock divergentes são recusados; report congelado não muda. | Qualidade linguística real depende do live OpenAI; contrato autoritativo `FECHADO`. |
| `AI-E2E-07` | Review por relatório, approved/adjusted/clarification, grants temporários e audit de leituras passaram. | Segunda decisão concorrente recebe 409; review cancelada fica ilegível; ajuste sem mudança, versão errada ou produto inválido faz rollback. | Revisão humana depende de operador real, não de código externo; implementação `FECHADO`. |
| `AI-E2E-08` | Freeze com hash/snapshot, `ceil(total×1000/10000)`, pagamento simulado e voucher passaram. | 25 replays/concorrência produzem um unlock/voucher; falha faz rollback; zero stock desbloqueia sem voucher zero. | Nunca existe transação financeira; `FECHADO` pelo contrato académico. |
| `AI-E2E-09` | Edit request fechado, `gpt-image-2`, WebP cifrado, TTL, provenance e owner-only/no-store passaram. | Pré-unlock/sem consentimento/sem variante/região falha; timeouts são retryable; substituição concorrente impede output obsoleto. | Qualidade/custo e Organization Verification são externos; boundary local `FECHADO`. |
| `AI-E2E-10` | Rotas canónicas, retoma, polling, histórico, consultor/admin e Home com hero, maquilhagem e cuidados de pele passaram. | A Home omite provider/copy processual; comparação e conversa ≤700 px/≤125% da copy; ordem desktop/mobile, Axe, teclado, 320–1280 e três engines passaram. | Safari/Edge reais e dispositivos físicos ficam externos; `FECHADO`. |
| `AI-E2E-11` | Erasure/privacy/export/backup incluem sessões, jobs, grants, previews, quota e bytes privados. | Consultor recebe 403 em privacidade destrutiva; exports não expõem IDs/conteúdo; retry/outbox/mesmo relógio e restore `_restore` passaram. | Rotação de credenciais remotas é externa; implementação local `FECHADO`. |
| `AI-E2E-12` | `verify:all` base: 25/25 gates e API 675 pass/1 live skip; após a reformulação final da Home, web 48 unitários/99 contratos e E2E 36/12 passaram. | O orquestrador validou as duas vertentes, alturas, ordem responsiva, três engines e a reauditoria posterior terminou sem P0–P3. | Um live skip e validações manuais externas impedem conclusão absoluta; `FECHADO` com blockers externos. |
| `AI-E2E-13` | README/RF/RNF/matriz/backlog/sprints/guias/evidências sincronizados; validator 44/31/74 verde. | Scans eliminam contratos ativos legacy e links/headers inválidos; história permanece marcada, não reescrita como prova atual. | Mockup ausente/RNF26 não foi inventado; `FECHADO`. |

### 9.3 Matriz compacta RF/RNF → runtime → testes

| Contrato | Runtime principal | Evidência automática |
|---|---|---|
| RF14/RF15/RF45; RNF05/RNF23 | sessões, goals, consentimento, fotografias, OpenAI Responses e jobs | core v2, guided consultation, quality/consent, worker/recovery e E2E |
| RF18/RF19/RF42 | relatório v2, allowlist, variantes, snapshots e review humana | report freeze/paywall, review/revalidation, catálogo/variantes e viagem E2E |
| RF43/RF46/RF47 | freeze, 10%, pagamento simulado, voucher e preview OpenAI | payment concorrente/rollback, unlock, makeup storage/lifecycle e E2E |
| RNF11/RNF12/RNF24 | cifra/AAD, minimização, grants, privacy/erasure e no-store | sensitive models, privacy requests, erasure, export e photo grants |
| RNF18 | backup local cifrado e restore isolado | create/restore/verify de coleções, índices, bytes e checksums |
| RNF25/RNF30/RNF31 | IDs comerciais allowlisted, quotas, timeouts, provenance e audit | provider/schema/semântica, rate limits, consultant audit e scans estáticos |
| RNF26 | alinhamento visual/manual | Axe, responsive e engines automatizados verdes; mockup/validação manual externa explicitados |

### 9.4 Migrações e compatibilidade

- Migrações `001`–`009` mantiveram checksums; `010`–`015` aplicaram, validaram e fizeram replay idempotente no replica set efémero.
- Consentimentos antigos não foram promovidos; dados `demo`/`external` ficaram apenas `legacy/archived` e nunca são apresentados como OpenAI.
- Unlocks, vouchers e encomendas existentes não foram recalculados.
- A prova de catálogo conserva contagem, IDs, stock agregado e stock de variantes, incluindo depois de perturbar stock antes do replay.
- `dev:local` usa base descartável própria, executa seed idempotente 8/4/25 e nunca consulta nem limpa a base remota.

### 9.5 Validações finais consolidadas

- API: 105 ficheiros; 104 passados e 1 live skip. Testes: 675 passados e 1 live skip.
- Frontend: 14 ficheiros/48 testes unitários e 99 contratos; build de 90 módulos.
- Browser: 36 testes passados e 12 skips intencionais em Chromium, Firefox e WebKit; Axe sem serious/critical.
- Home: hero responsivo, par de maquilhagem com 12 variantes AVIF/WebP e nova faixa estática de cuidados de pele sem assets adicionais; JS inicial 65 342 bytes gzip e 193 imagens publicadas dentro do budget.
- Dependências: zero vulnerabilidades em API e web no advisory database consultado.
- Planificação: 44 RF, 31 RNF, 74/74/74 BK e `overall_pass=true`.
- Scope: nenhuma alteração observável em `apps/`; nenhum acesso à MongoDB remota; nenhum commit criado.
- Pagamento: apenas simulação local, sem gateway, cobrança ou I/O financeira.

### 9.6 Blockers externos e riscos residuais

1. `test:ai:live` ficou `BLOQUEADO_EXTERNO`: não existia `OPENAI_API_KEY`/crédito no ambiente isolado. O teste opt-in cobre vision, relatório estruturado e GPT Image com retratos sintéticos, mas foi `skip`, nunca `PASS`.
2. `gpt-image-2` pode exigir Organization Verification e o comportamento, custo, latência e qualidade reais dos modelos só podem ser avaliados com conta OpenAI autorizada.
3. Chromium, Firefox e WebKit automatizados passaram; Safari e Edge reais, dispositivos físicos e validação visual humana não foram executados nem alegados.
4. Não existe mockup aprovado no workspace. RNF26 permanece `ACEITE_RISCO` quanto à comparação visual externa; não foram inventados screenshots ou aprovação.
5. Eventual rotação das credenciais remotas é ação externa do utilizador. O `.env` existente não foi lido, alterado ou usado.
6. A solução é académica/local. Não se declara prontidão de produção, disaster recovery externo ou CI/CD cloud.

### 9.7 Decisão de fecho

- **P0 abertos:** `0`.
- **P1 abertos:** `0`.
- **P2 abertos:** `0`.
- **Findings fechados:** `AI-E2E-00`–`AI-E2E-13`, incluindo as reaberturas controladas de G5/G7 pela Home, copy e redesign final de proporção/qualidade.
- **Estado global:** `CONCLUIDO_COM_BLOCKERS_EXTERNOS`.
- **Fundamento:** a Home editorial, incluindo hero, faixa de maquilhagem, faixa invertida de cuidados de pele, cards sem siglas e copy comercial coerente, foi implementada, testada, inspecionada e reauditada com zero P0–P3. A decisão anterior mantém-se para OpenAI/comércio/privacidade e permanecem apenas os mesmos blockers externos já enumerados na secção 9.6.

## 10. Continuação append-only — reformulação editorial da Home

### 2026-07-11 — Copy comercial e comparação visual de maquilhagem

- **CWD:** `real_dev/web` e gerador de imagem isolado.
- **Alteração de interface:** a secção promocional abandonou o chat operacional, as etapas numeradas e as referências repetidas a exemplo/publicidade. A nova composição apresenta benefícios em linguagem de produto, usa apenas “IA”/“Inteligência Artificial” na Home e centra o cartão numa comparação “Original / Com IA”.
- **Copy:** heading “Beleza que parte de ti”, benefícios “Escuta / Personaliza / Visualiza” e CTA “Descobrir a minha consulta”; a única ressalva visual é “Imagem gerada por IA — o resultado real poderá variar”.
- **Asset original:** o mesmo retrato editorial foi recortado de forma determinística para `4:5` e convertido por Sharp em AVIF/WebP de 320 e 520 px; maior variante atual com 30 KiB.
- **Imagem editada:** primeira tentativa preservou identidade, pose, roupa, fundo e textura real, mas foi considerada demasiado subtil na inspeção do coordenador; foi pedido novo output com maquilhagem rose-gold mais legível. A tentativa inicial não é registada como validação final.
- **Comandos:** inspeção `view_image`; metadata Sharp; crop de controlo em `/tmp`; conversão das variantes `orelle-makeup-original-*`.
- **Exit codes:** `0` em todos os comandos locais.
- **Estado:** `AI-E2E-10` mantém-se `EM_IMPLEMENTACAO` e `AI-E2E-12` `REABERTO`; CSS, preview final e retestes continuam pendentes.

### 2026-07-11 — Asset final da pré-visualização de maquilhagem

- **CWD:** `real_dev/web` e gerador de imagem isolado.
- **Decisão:** a segunda edição foi selecionada por tornar o look rose-gold perceptível sem perder o registo natural da Orélle. A inspeção lado a lado confirmou preservação da identidade, geometria facial, expressão, cabelo, pele real, roupa, luz, fundo e enquadramento; apenas olhos, lábios e blush receberam maquilhagem mais definida.
- **Ficheiros:** `public/home/orelle-makeup-preview-{320,520}.{avif,webp}`, obtidos com o mesmo crop `4:5` e os mesmos tamanhos do retrato original.
- **Comandos:** `view_image` do output completo e crop; conversão Sharp AVIF/WebP; inspeção do WebP final; listagem de tamanhos.
- **Exit codes:** `0` em todos.
- **Budgets:** as oito variantes original/preview ocupam entre 8,7 KiB e 33 KiB cada, muito abaixo do limite de imagem crítica; a prova de dimensão/formato e o page budget permanecem pendentes do reteste automático.

### 2026-07-11 — Styling editorial e validação frontend coordenada

- **CWD:** `real_dev/web`.
- **CSS:** o cartão genérico de chat/relatório foi integralmente substituído por uma montra editorial com objetivo, comparação fotográfica, transição, insight e nota discreta. Os benefícios usam uma sequência visual leve; temas claro, escuro e alto contraste têm tratamento próprio; breakpoints de 920/620 px preservam a comparação em 320/375 px.
- **Limpeza:** pesquisa estática encontrou zero seletores antigos `mockup-chat-*`, `mockup-report-preview*`, `mockup-ai-steps` ou `mockup-photo-pair` no componente/CSS e zero “OpenAI”, “Exemplo ilustrativo” ou “Exemplo publicitário” na Home.
- **Testes atualizados:** unitário público e contratos de apresentação/imagens exigem a nova copy, três benefícios, CTA, aviso único, ausência de chat/branding provider, dois `OptimizedImage`, srcsets AVIF/WebP e metadata real dos oito assets.
- **Comandos:** `npm run lint`; `npm run test:unit`; `npm run test:contracts`; `npm run build`; `npm run check:g6-image-budgets`; smokes MF6 images/page-budget/runtime, MF7 compatibilidade e MF8 UI integrada.
- **Exit codes:** `0` em todos.
- **Resultados:** 14 ficheiros/48 unitários; 97/97 contratos; build de 90 módulos; JS inicial 65 340 bytes gzip; 189 imagens dentro do limite; 25 produtos/150 variantes e 8 018 679 bytes publicados dentro do budget.
- **Estado:** `AI-E2E-10` passa a `PRONTO_PARA_RETESTE`; `AI-E2E-12` mantém-se `REABERTO` até browser/Axe, E2E isolado e reauditoria independente deste estado.

### 2026-07-11 — Browser QA e primeiro E2E da reformulação

- **CWD:** `real_dev/web` no browser local e `real_dev/api` no orquestrador isolado.
- **Inspeção visual:** a composição desktop mostra benefícios e montra como duas colunas equilibradas; o original e a edição preservam a mesma identidade e tornam a maquilhagem percetível. Em 375/320 px a comparação mantém-se lado a lado, usa a variante AVIF de 320 px e não provoca overflow; a consola apresentou zero erros/warnings próprios.
- **Métricas do browser:** `scrollWidth === clientWidth` em 1280, 375 e 320 px; a largura individual das imagens no limite de 320 px é 107 px. A captura confirmou labels, transição, objetivo e diferença visual sem chat genérico.
- **Primeiro comando E2E:** `npm run test:e2e`, com MongoDB efémero e Chromium/Firefox/WebKit.
- **Exit code:** `1` — não convertido em sucesso.
- **Resultado:** 33 testes passaram, 12 tiveram skip intencional e três falharam, um por engine. Todas as falhas são a mesma expectativa E2E stale em `public-accessibility.spec.js`: procurava a copy removida “Consulta cosmética assistida” antes de executar Axe na Home. Os testes responsive 320/375/768/1280 e restantes jornadas passaram neste run.
- **Decisão:** atualizar o contrato E2E para a nova heading/montra e ausência do chat antigo; repetir o orquestrador completo. `AI-E2E-10/12` permanecem abertos.

### 2026-07-11 — Contrato E2E da Home sincronizado

- **CWD:** `real_dev/web`.
- **Alteração:** `public-accessibility.spec.js` deixou de procurar a copy removida e passou a exigir a heading “Beleza que parte de ti”, exatamente uma `.mockup-consultation-showcase`, as duas imagens com nomes acessíveis e zero `.mockup-chat-message`.
- **Âmbito:** apenas a expectativa stale foi substituída; Axe nos três temas, os três engines e o teste específico de 320 px continuam inalterados.
- **Validação:** pendente de lint e rerun E2E isolado; esta entrada não afirma sucesso antecipado.

### 2026-07-11 — Reteste E2E integral da montra editorial

- **CWD:** `real_dev/web` para lint e `real_dev/api` para o orquestrador isolado.
- **Comandos:** `npm run lint`; `npm run test:e2e`.
- **Exit codes:** `0` e `0`.
- **Resultado frontend:** ESLint passou depois de sincronizar a expectativa pública da Home.
- **Resultado browser:** 36 testes passaram e 12 skips intencionais permaneceram em Chromium, Firefox e WebKit. Axe nos temas publicados, teclado e viewports 320/375/768/1280 passaram; a execução confirmou base efémera `orelle_e2e_test`, 15 migrações, cinco utilizadores, três produtos e três imagens de fixture.
- **Interpretação:** a falha anterior de três engines ficou resolvida pela atualização do contrato stale, sem alterar comportamento para satisfazer o teste. A Home atual apresenta a montra de maquilhagem, não contém o chat antigo e mantém a comparação responsiva sem overflow.
- **Estado:** `AI-E2E-10` e `AI-E2E-12` ficam `PRONTO_PARA_RETESTE` até à reauditoria read-only independente posterior a este run.

### 2026-07-11 — Reauditoria editorial pós-E2E: P2 reaberto

- **CWD:** `real_dev/web`, inspeção read-only por agente diferente dos implementadores.
- **Resultado visual:** zero P0/P1/P2/P3 no par original/preview; identidade, pose, enquadramento, textura e tonalidade de pele mantêm-se, a maquilhagem rose-gold é percetível também a 320 px e não sugere evolução clínica. Os assets 520×650 estão em sRGB, sem EXIF/XMP, texto ou watermark.
- **Finding P2 de copy:** fora da nova montra, os cards “Porque escolher a Orélle?” ainda diziam “fluxo atual”, “limitações visíveis no fluxo”, “perfil de acesso” e “ligados à API”; o CTA inferior referia “estado confirmado pelo servidor”. O contrato `presentationSurfaces.test.mjs` ainda protegia parte dessa linguagem processual.
- **Evidência focal:** ESLint exit `0`; unitários 5/5; contratos 16/16; scan estático confirmou exatamente os termos processuais acima e zero marca OpenAI, exemplo/publicidade, chat ou seletores antigos no componente/CSS.
- **Decisão:** o finding não é aceite como detalhe menor porque contradiz diretamente o tom comercial pedido. `AI-E2E-10` regressa a `EM_IMPLEMENTACAO` e `AI-E2E-12` a `REABERTO` antes de alterar copy/testes.

### 2026-07-11 — Copy comercial aplicada a toda a Home

- **CWD:** `real_dev/web`.
- **Alteração:** os quatro cards de valor passaram a “Inteligência que cuida”, “Cuidado à tua medida”, “Olhar especializado” e “Escolhas com propósito”, com benefícios dirigidos ao cliente. O CTA inferior passou para “Descobre o que combina contigo” e o rodapé para “Beleza, cuidado e escolhas pensadas para ti”.
- **Remoção:** deixaram de existir na interface as frases “fluxo atual”, “limitações visíveis no fluxo”, “perfil de acesso”, “ligados à API” e “estado confirmado pelo servidor”.
- **Testes:** o contrato stale “A consulta apresenta” foi substituído por expectations da nova copy; unitário e contrato estático passam também a rejeitar explicitamente os cinco termos processuais.
- **Estado:** `AI-E2E-10` mantém-se `EM_IMPLEMENTACAO` e `AI-E2E-12` `REABERTO` até lint, unitários, contratos, build/budgets, E2E afetado e reauditoria focal posterior.

### 2026-07-11 — Primeira regressão da copy comercial

- **CWD:** `real_dev/web`.
- **Comandos:** `npm run lint`; `npm run test:unit`; `npm run test:contracts`.
- **Exit codes:** `0` em todos.
- **Resultado:** ESLint verde; 14 ficheiros/48 testes unitários; 97/97 contratos. A cobertura positiva encontra a nova copy comercial e os negativos recusam os cinco termos processuais, provider, exemplos antigos e chat.
- **Estado:** o P2 fica `PRONTO_PARA_RETESTE` focal, mas `AI-E2E-10/12` não fecham antes de build/budgets/smokes, E2E e reauditoria independente posterior.

### 2026-07-11 — Build, budgets e smokes após a copy final

- **CWD:** `real_dev/web`.
- **Comandos:** `npm run build`; `npm run check:g6-image-budgets`; smokes MF6 de imagens/page-budget/runtime, MF7 compatibilidade e MF8 consulta assistida.
- **Exit codes:** `0` em todos.
- **Resultado:** build Vite de 90 módulos; JS inicial 65 335 bytes gzip; 189 imagens dentro dos limites; inventário lazy 1 558 594 bytes/53 chunks; catálogo publicado com 25 produtos, 150 variantes e 8 018 679 bytes; todos os smokes selecionados verdes.
- **Estado:** `AI-E2E-10/12` aguardam apenas E2E isolado e reauditoria focal posterior no mesmo estado.

### 2026-07-11 — Primeira tentativa E2E após a copy final

- **CWD:** `real_dev/api`.
- **Comando:** `npm run test:e2e` no sandbox.
- **Exit code:** `1`.
- **Resultado:** o orquestrador falhou antes dos testes com `listen EPERM` em `127.0.0.1`. É uma limitação ambiental já conhecida do sandbox e não é classificada como sucesso nem como regressão de produto.
- **Próximo passo:** repetir o mesmo comando com autorização apenas para serviços loopback/browsers locais; a falha permanece preservada cronologicamente.

### 2026-07-11 — E2E isolado após a copy comercial final

- **CWD:** `real_dev/api` com frontend construído pelo orquestrador.
- **Comando:** `npm run test:e2e`, autorizado apenas para serviços loopback e browsers locais.
- **Exit code:** `0`.
- **Resultado:** build Vite de 90 módulos; 36 testes passaram e 12 skips intencionais permaneceram em Chromium, Firefox e WebKit, em 1,2 min. Axe, teclado, Home a 320 px, viewports 320/375/768/1280, performance e jornadas integradas ficaram verdes.
- **Isolamento:** base efémera `orelle_e2e_test`, 15 migrações, cinco utilizadores, três produtos e três imagens de fixture; nenhuma MongoDB/OpenAI remota foi usada.
- **Estado:** `AI-E2E-10/12` passam a `PRONTO_PARA_RETESTE`; falta apenas reauditoria independente posterior a esta última alteração de copy.

### 2026-07-11 — Reauditoria independente e fecho da Home editorial

- **CWD:** `real_dev/web`, inspeção read-only posterior à última alteração e ao E2E verde.
- **Resultado:** zero P0, zero P1, zero P2 e zero P3. Os cinco termos processuais desapareceram; o contrato stale foi substituído por positivos da nova CTA/rodapé e negativos explícitos; cards, heading, CTA e footer mantêm linguagem comercial sem overclaim médico.
- **Conteúdo e imagem:** zero marca OpenAI, linguagem repetida de exemplo/publicidade, chat ou seletores antigos; exatamente uma ressalva. Os oito assets ocupam 152 351 bytes no total, com máximo individual de 33 676 bytes e dimensões 320×400/520×650. Original e preview preservam identidade/pele e mostram maquilhagem visível sem sugerir evolução clínica.
- **Evidência independente:** ESLint focal exit `0`; Vitest 5/5; contratos 16/16; auditor estático/assets exit `0`. O auditor não editou ficheiros.
- **Decisão:** `AI-E2E-10` e `AI-E2E-12` passam individualmente a `FECHADO`; estado global `CONCLUIDO_COM_BLOCKERS_EXTERNOS`, apenas pelos blockers externos preexistentes da secção 9.6.

### 2026-07-11 — Validação documental posterior ao fecho editorial

- **CWD:** raiz do projeto.
- **Comandos:** `bash scripts/validate-planificacao.sh`; `git diff --check` do report; scans de whitespace, copy processual/provider/exemplos/chat na Home e scope `apps/`.
- **Exit codes:** validator/diff/scope `0`; os dois scans negativos terminaram `1` por ausência de ocorrências, como esperado.
- **Resultado:** 44 RF, 31 RNF e matriz/backlog/guias 74/74/74; coverage, consistency, guides, naming e `overall_pass=true`. O report não introduziu whitespace inválido, a Home permanece livre dos contratos removidos e `apps/` continua sem alterações observáveis.
- **Decisão:** o ato de fechar o report não reabre qualquer finding; mantém-se `CONCLUIDO_COM_BLOCKERS_EXTERNOS`.

### 2026-07-11 — Reabertura por proporção e qualidade da montra visual

- **CWD:** `real_dev/web`, screenshot do utilizador e report vivo.
- **Feedback confirmado:** a coluna direita fica desproporcionadamente alta no desktop; o par fotográfico publicado revela compressão/baixa definição no tamanho apresentado; a simulação atual acentua marcas e sombras, parecendo menos favorecedora do que o original e contrariando a intenção comercial.
- **Causa visual:** duas fotografias 4:5 ocupam quase toda a largura do cartão, levando a uma altura excessiva; cabeçalho, objetivo, comparação, insight e nota são empilhados. O source do par atual só publica até 520×650 e a edição introduz microvariações de textura/contraste pouco lisonjeiras.
- **Decisão de design:** criar outra mulher em retrato editorial de alta resolução, gerar a variante de maquilhagem a partir do mesmo source com preservação estrita de identidade e pele, e usar um crop horizontal/mais curto na comparação. Compactar objetivo e insight para que a coluna direita seja apenas moderadamente mais alta do que a esquerda.
- **Guardrails:** a versão com IA deve ser visualmente mais cuidada por maquilhagem, luminosidade e acabamento, sem apresentar rejuvenescimento, tratamento clínico ou alteração anatómica; mantém-se uma única nota de variação.
- **Estado:** `AI-E2E-10` passa a `EM_IMPLEMENTACAO` e `AI-E2E-12` a `REABERTO` antes de alterar assets, JSX ou CSS.

### 2026-07-11 — Novo par fotográfico de alta resolução

- **CWD:** gerador integrado e `real_dev/web`.
- **Modo:** geração `photorealistic-natural` para o original e edição `identity-preserve` para a variante; não foi usado CLI, chave do projeto ou provider do runtime.
- **Original:** nova mulher adulta, retrato beauty editorial quadrado, luz frontal suave e fundo marfim. Source 1254×1254 sRGB, sem alpha/perfil ou metadata sensível; aparência natural, luminosa e sem maquilhagem cromática relevante.
- **Preview selecionado:** maquilhagem rose-gold profissional claramente legível em olhos, blush e lábios, com acabamento mais cuidado e favorecedor. A edição mantém identidade, idade aparente, estrutura facial, expressão, cabelo, enquadramento, fundo e luz; não acrescenta rugas, marcas ou evolução clínica.
- **Variantes publicadas:** os ficheiros `orelle-makeup-{original,preview}-{320,520}.{avif,webp}` foram substituídos pelo novo par quadrado e foram acrescentadas variantes 960 px. Conversão Sharp em sRGB, AVIF quality 68 e WebP quality 86, sem EXIF/XMP.
- **Inspeção:** metadata dos sources e comparação visual dos WebP 960 px, exit code `0`. A diferença mantém-se percetível e a versão com IA é visualmente mais polida sem apagar a textura natural.
- **Estado:** assets prontos; `AI-E2E-10/12` mantêm-se abertos até atualizar JSX/CSS, contratos, budgets e browser.

### 2026-07-11 — Montra visual compactada

- **CWD:** `real_dev/web`.
- **JSX:** original e preview passam a fallback/metadata 960×960 e `srcset` 320/520/960 em AVIF/WebP. O objetivo foi encurtado para “O teu look — Luminosa, natural e elegante.” e o alt da variante descreve a maquilhagem rose-gold luminosa.
- **CSS:** cartão limitado a 34 rem; header, objetivo, comparação, insight e nota receberam espaçamento menor; objetivo usa composição inline no desktop; imagens passaram de `4:5` para `1:1`; o mobile mantém o objetivo empilhado e a comparação lado a lado.
- **Contratos:** unitários e testes estáticos/metadata exigem fallback 960, três larguras responsivas, 12 variantes válidas, dimensões quadradas e `aspect-ratio: 1 / 1`.
- **Objetivo de regressão:** reduzir materialmente a altura da coluna direita sem esconder conteúdo nem alterar rotas, consentimento, preview real ou copy de limitação.
- **Estado:** `AI-E2E-10/12` permanecem `EM_IMPLEMENTACAO`/`REABERTO` até lint, testes, build, budgets e inspeção browser.

### 2026-07-11 — Regressão de contratos do novo par quadrado

- **CWD:** `real_dev/web`.
- **Comandos:** `npm run lint`; `npm run test:unit`; `npm run test:contracts`.
- **Exit codes:** `0` em todos.
- **Resultado:** ESLint verde; 14 ficheiros/48 testes unitários; 97/97 contratos. Foram validados os novos alts, dimensões 960×960, `srcset` de três níveis, 12 ficheiros AVIF/WebP quadrados e ratio CSS `1:1`.
- **Estado:** alteração pronta para build/budgets/browser; `AI-E2E-10/12` permanecem abertos.

### 2026-07-11 — Build e budgets do redesign compacto

- **CWD:** `real_dev/web`.
- **Comandos:** `npm run build`; image budget; smokes MF6 de imagens/page-budget/runtime, MF7 compatibilidade e MF8 consulta assistida.
- **Exit codes:** `0` em todos.
- **Resultado:** build Vite de 90 módulos; JS inicial 65 317 bytes gzip; 193 imagens dentro do limite; inventário lazy 1 558 882 bytes/53 chunks; catálogo 25 produtos/150 variantes/8 018 679 bytes; todos os smokes selecionados verdes.
- **Estado:** `AI-E2E-10/12` aguardam browser QA dimensional/visual, E2E e reauditoria.

### 2026-07-11 — Gate E2E de proporção e nitidez

- **CWD:** `real_dev/web`.
- **Alteração de teste:** a Home passa a exigir no browser que o cartão direito tenha no máximo 700 px e não ultrapasse 125% da altura da coluna de copy; as duas imagens renderizadas devem ser quadradas, estar carregadas e ter source natural mínimo de 320 px. O alt E2E foi alinhado ao novo preview rose-gold.
- **Finalidade:** tornar o problema visual reportado numa regressão objetiva, além da inspeção humana; tolerâncias consideram pequenas diferenças entre Chromium, Firefox e WebKit.
- **Estado:** contrato ainda não validado em browser; `AI-E2E-10/12` permanecem abertos.

### 2026-07-11 — Primeiro E2E dimensional do redesign falhou

- **CWD:** `real_dev/api` com build/frontend isolados.
- **Comando:** `npm run test:e2e` em Chromium, Firefox e WebKit.
- **Exit code:** `1`.
- **Resultado:** 33 testes passaram, 12 mantiveram skip intencional e três falharam no mesmo novo gate da Home. O cartão mediu aproximadamente 1272 px nos três engines, acima do limite de 700 px; a execução foi terminada depois de confirmar a reprodução transversal.
- **Interpretação:** o source/CSS quadrado e os budgets estão corretos, mas a primeira compactação não reduziu a altura renderizada como previsto. O teste não será relaxado para esconder o problema.
- **Diagnóstico em curso:** a falha passou a anexar `copyBox`, `showcaseBox` e dimensões naturais/renderizadas das imagens, para identificar o elemento que mantém a altura excessiva sem imprimir dados privados.
- **Estado:** `AI-E2E-10/12` permanecem `EM_IMPLEMENTACAO`/`REABERTO`.

### 2026-07-11 — Causa raiz da altura excessiva corrigida

- **CWD:** `real_dev/web`.
- **Diagnóstico:** o reteste instrumental revelou imagens com aproximadamente 210 px de largura renderizada, mas 960 px de altura; o atributo HTML `height=960` continuava a determinar a altura porque a regra CSS definia `width: 100%` e `aspect-ratio: 1`, mas não `height: auto`.
- **Correção:** `.mockup-makeup-preview img` e o fallback passam a declarar `height: auto`; o contrato visual exige simultaneamente `height:auto` e `aspect-ratio:1/1`.
- **Resultado esperado:** cada fotografia passa de cerca de 210×960 para 210×210 no desktop, removendo aproximadamente 750 px da coluna direita sem crop artificial ou perda de resolução.
- **Estado:** correção `EM_IMPLEMENTACAO`; exige regressão frontend e repetição do gate browser nos três engines.

### 2026-07-11 — Regressão focal após `height:auto`

- **CWD:** `real_dev/web`.
- **Comandos:** ESLint, unitários e contratos frontend.
- **Exit codes:** `0` em todos.
- **Resultado:** 14 ficheiros/48 unitários e 97/97 contratos passaram; o contrato visual fixa agora a combinação que corrige a causa real.
- **Estado:** `AI-E2E-10/12` aguardam o reteste browser dimensional e Axe nos três engines.

### 2026-07-11 — Segundo E2E dimensional: altura corrigida, métrica de source revista

- **CWD:** `real_dev/api` e `real_dev/web`.
- **Comando:** `npm run test:e2e` nos três engines.
- **Exit code:** `1`; 33 passados, 12 skips intencionais e três falhas idênticas.
- **Progresso confirmado:** o gate absoluto de 700 px, o limite relativo de 125% e a forma quadrada passaram nos três browsers; portanto, a altura excessiva ficou efetivamente corrigida.
- **Falha residual do teste:** `naturalWidth >= 320` recebeu 239–240, porque browsers podem expor a largura intrínseca density-corrected do candidato `srcset`, não os píxeis físicos do ficheiro. As dimensões físicas 320/520/960 já são verificadas diretamente por Sharp.
- **Correção do contrato:** browser passa a exigir imagem `complete` e `currentSrc` pertencente à allowlist 320/520/960 AVIF/WebP; mantém forma e alturas. Não foi relaxado qualquer gate de proporção.
- **Estado:** `AI-E2E-10/12` permanecem abertos até o reteste E2E integral ficar verde.

### 2026-07-11 — E2E integral verde do novo layout compacto

- **CWD:** `real_dev/api` com frontend/build isolados.
- **Comando:** `npm run test:e2e`.
- **Exit code:** `0`.
- **Resultado:** 36 testes passaram e 12 skips intencionais permaneceram em Chromium, Firefox e WebKit. O cartão cumpre altura ≤700 px e ≤125% da copy, as imagens são quadradas e carregam apenas candidatos 320/520/960 AVIF/WebP. Axe, temas, teclado, performance e viewports 320/375/768/1280 ficaram verdes.
- **Isolamento:** base efémera `orelle_e2e_test`, 15 migrações, cinco utilizadores, três produtos e três imagens de fixture; nenhuma base ou IA remota foi usada.
- **Estado:** `AI-E2E-10/12` passam a `PRONTO_PARA_RETESTE`; falta a inspeção final de assets/scope e reauditoria coordenada.

### 2026-07-11 — Reauditoria coordenada e fecho do redesign final

- **CWD:** `real_dev/web` e raiz do projeto, passe read-only posterior ao E2E verde.
- **Falha de comando preservada:** a primeira inspeção Sharp foi lançada da raiz e terminou com exit `1` por `ERR_MODULE_NOT_FOUND`; não foi classificada como sucesso. O mesmo comando executado no package web terminou com exit `0`.
- **Assets:** 12 variantes exatas, 320/520/960 quadradas, sRGB, sem EXIF/ICC/XMP; 553 177 bytes no total e máximo individual de 108 442 bytes. Original e preview foram inspecionados a 960 px: identidade/idade/estrutura mantidas, preview claramente mais luminoso e cuidado por maquilhagem, sem marcas ou envelhecimento acrescentados.
- **Código/escopo:** `height:auto` + `aspect-ratio:1/1` presentes; zero `4:5` na montra; `srcset`/fallback 960 coerentes; scan de whitespace sem ocorrências; `apps/` sem alterações observáveis e `real_dev/` continua ignorado.
- **Validação consolidada:** ESLint, 48 unitários, 97 contratos, build de 90 módulos, budgets/smokes e E2E 36/12 nos três engines verdes. Axe, temas, teclado, 320/375/768/1280 e os novos limites dimensionais passaram.
- **Findings:** zero P0, zero P1, zero P2 e zero P3 nesta reabertura.
- **Decisão:** `AI-E2E-10` e `AI-E2E-12` regressam a `FECHADO`; estado global `CONCLUIDO_COM_BLOCKERS_EXTERNOS`, apenas pelos blockers preexistentes da secção 9.6.

### 2026-07-11 — Validação documental posterior ao redesign final

- **CWD:** raiz do projeto.
- **Comandos:** validator canónico; `git diff --check` do report; scans de whitespace e scope `apps/`.
- **Exit codes:** validator/diff/scope `0`; scan sem whitespace terminou `1` por ausência de ocorrências, como esperado.
- **Resultado:** 44 RF, 31 RNF e matriz/backlog/guias 74/74/74; coverage, consistency, guides, naming e `overall_pass=true`. O fecho não introduziu regressão documental ou scope creep.
- **Decisão:** mantém-se `CONCLUIDO_COM_BLOCKERS_EXTERNOS`.

## 11. Continuação append-only — duas vertentes editoriais da consulta

### 2026-07-11 — Reabertura para maquilhagem e cuidados de pele

- **CWD:** raiz do projeto e `real_dev/web`.
- **Pedido:** corrigir o sujeito ambíguo da sequência de maquilhagem, acrescentar uma segunda faixa invertida dedicada a cuidados de pele e remover as siglas não explicadas dos cards “Porque escolher a Orélle?”.
- **Decisão de interface:** a primeira faixa mantém a comparação fotográfica e passa a falar sempre com o utilizador; a segunda mostra copy de cuidados de pele e uma conversa editorial estática, sem formulário, typing, polling, provider, rótulo de exemplo ou resultado clínico. Em desktop a conversa fica à esquerda; em mobile a copy antecede a conversa por ordem semântica.
- **Cards:** `IA`, `SK`, `RH` e `PD` deixam de ser marcadores públicos e são substituídos pelos ícones existentes `sparkles`, `face`, `review` e `bag`, com títulos completos.
- **Scope:** apenas Home, CSS, testes frontend e este report; sem dependências, assets, API, base de dados, catálogo, pagamentos ou alterações em `apps/`.
- **Estado:** estado global `EM_IMPLEMENTACAO`; `AI-E2E-10` em `EM_IMPLEMENTACAO`; `AI-E2E-12` em `REABERTO` antes da primeira alteração de runtime.

### 2026-07-11 — Estrutura editorial das duas vertentes implementada

- **CWD:** `real_dev/web`.
- **Home:** a sequência da maquilhagem passou para “Conta-nos / Recebe / Visualiza”; a comparação fotográfica, CTA, aviso único e gates dimensionais permaneceram intactos.
- **Cuidados de pele:** foi acrescentada uma faixa imediatamente posterior, com copy primeiro no DOM, layout desktop conversa-esquerda/copy-direita e layout mobile copy-conversa. A conversa é uma `ol` estática com quatro intervenções, interlocutores visíveis e nomes acessíveis; não contém input, botão falso, typing, polling, provider, diagnóstico ou rótulo publicitário.
- **Cards:** os quatro markers de texto foram substituídos por `NavIcon` decorativos `sparkles`, `face`, `review` e `bag`, preservando os títulos completos.
- **CSS:** nova composição editorial compacta, responsiva e temática, incluindo alto contraste; nenhuma dependência ou imagem foi adicionada.
- **Validação:** pendente de atualização dos testes e primeira regressão; esta entrada não antecipa `PASS`.

### 2026-07-11 — Contratos automatizados da nova Home

- **CWD:** `real_dev/web`.
- **Unitários/estáticos:** acrescentadas expectativas para a sequência dirigida ao utilizador, faixa de cuidados, quatro mensagens ordenadas, dois interlocutores, resumo cosmético, CTA, nota não médica única, ausência de controlos falsos e quatro ícones sem siglas.
- **Browser:** o E2E passa a provar a ordem maquilhagem → pele → features, conversa à esquerda da copy no desktop, copy antes da conversa até 920 px, altura máxima/equilíbrio do cartão, quatro mensagens e ausência de textbox/botão. Os viewports 320/375/768/1280 continuam a verificar overflow.
- **Preservação:** os gates anteriores de altura, proporção, source responsivo e nitidez da comparação de maquilhagem não foram removidos nem relaxados.
- **Validação:** ainda não executada; `AI-E2E-10/12` mantêm-se abertos.

### 2026-07-11 — Primeira regressão frontend das duas faixas

- **CWD:** `real_dev/web`.
- **Comandos:** `npm run lint`; `npm run test:unit`; `npm run test:contracts`.
- **Exit codes:** `0` nos três comandos.
- **Resultado:** ESLint verde; 14 ficheiros/48 testes unitários; 99/99 contratos estáticos. A cobertura positiva encontra as duas vertentes, quatro mensagens, ordem semântica e ícones; os negativos recusam siglas, provider, linguagem de exemplo/publicidade e controlos falsos na conversa.
- **Estado:** alteração pronta para build/budgets/smokes; `AI-E2E-10/12` permanecem abertos até browser e reauditoria.

### 2026-07-11 — Build, budgets e smokes da reformulação editorial

- **CWD:** `real_dev/web`.
- **Comandos:** `npm run build`; budget de imagens; smokes MF6 de imagens, performance unitária, page budget e runtime; MF7 compatibilidade; MF8 consulta assistida.
- **Exit codes:** `0` em todos.
- **Resultado:** build Vite de 90 módulos; chunk inicial 66 110 bytes gzip e Home 4 560 bytes gzip; 193 imagens dentro do limite; catálogo publicado inalterado com 25 produtos, 150 variantes e 8 018 679 bytes; 53 chunks lazy registados apenas como inventário. Todos os smokes selecionados ficaram verdes.
- **Estado:** `AI-E2E-10/12` aguardam E2E Chromium/Firefox/WebKit e reauditoria posterior.

### 2026-07-11 — Primeira tentativa E2E das duas faixas

- **CWD:** `real_dev/api`.
- **Comando:** `npm run test:e2e` no sandbox.
- **Exit code:** `1`.
- **Resultado:** o orquestrador parou antes de iniciar os browsers com `listen EPERM` em `127.0.0.1`. A falha é ambiental, permanece registada e não é convertida em `PASS`.
- **Próximo passo:** repetir o mesmo comando com autorização limitada a serviços loopback e browsers locais; `AI-E2E-10/12` permanecem abertos.

### 2026-07-11 — E2E isolado verde da Home com duas vertentes

- **CWD:** `real_dev/api`, com build de `real_dev/web` pelo orquestrador.
- **Comando:** `npm run test:e2e`, autorizado apenas para serviços loopback e browsers locais.
- **Exit code:** `0`.
- **Resultado:** build Vite de 90 módulos; 36 testes passaram e 12 skips intencionais permaneceram em Chromium, Firefox e WebKit. A base efémera `orelle_e2e_test` aplicou 15 migrações e usou cinco utilizadores, três produtos e três imagens de fixture; não foi usada MongoDB ou OpenAI remota.
- **Home:** ordem maquilhagem → cuidados de pele → features confirmada; conversa à esquerda no desktop e copy antes da conversa a 320/375/768 px; 1280 px manteve a inversão; cartão ≤700 px e ≤125% da copy; quatro mensagens sem controlos; comparação de maquilhagem manteve os gates anteriores.
- **Acessibilidade/responsive:** Axe sem violações serious/critical nos três temas e engines; teclado, foco, touch surfaces existentes e zero overflow a 320/375/768/1280 px passaram.
- **Estado:** `AI-E2E-10/12` passam a `PRONTO_PARA_RETESTE`; falta a reauditoria read-only posterior no mesmo estado.

### 2026-07-11 — Reauditoria read-only e fecho das duas vertentes

- **CWD:** raiz do projeto e `real_dev/web`, posterior ao E2E verde.
- **Inspeção:** JSX/CSS, ordem das secções, DOM semântico, breakpoints 920/620, temas, ícones e testes foram revistos sem editar runtime. A conversa tem quatro mensagens ordenadas, interlocutores visíveis, zero controlo interativo e uma síntese cosmética não clínica.
- **Scans:** zero `OpenAI`, linguagem de exemplo/publicidade, markers `IA/SK/RH/PD`, siglas `SK/RH/PD`, seletores de chat antigo, typing ou timer na Home; zero whitespace inválido. O scan negativo terminou com exit `1` por ausência de ocorrências, como esperado.
- **Scope/integridade:** `git status --short -- apps` terminou com exit `0` e sem output; `real_dev/` permanece ignorado por `.gitignore:2`; o lock web conserva SHA-256 `f39eb47b1eac5bcf26b81d2441bb237ee007f6ce73f27a573ba567ee134c5a03`.
- **Findings:** zero P0, zero P1, zero P2 e zero P3 nesta reabertura.
- **Decisão:** `AI-E2E-10` e `AI-E2E-12` regressam a `FECHADO`; estado global `CONCLUIDO_COM_BLOCKERS_EXTERNOS`, apenas pelos blockers externos preexistentes da secção 9.6.

### 2026-07-11 — Validação documental posterior ao fecho das duas vertentes

- **CWD:** raiz do projeto.
- **Comandos:** `bash scripts/validate-planificacao.sh`; scan de whitespace nos oito ficheiros alterados e no report; confirmação de estados/dashboard e scope `apps/`.
- **Exit codes:** validator e scope `0`; scan de whitespace `1` por ausência de ocorrências, como esperado.
- **Resultado:** 44 RF, 31 RNF e matriz/backlog/guias 74/74/74; coverage, consistency, guides, naming e `overall_pass=true`. O report apresenta `AI-E2E-10/12` como `FECHADO` e o estado global como `CONCLUIDO_COM_BLOCKERS_EXTERNOS`.
- **Decisão:** o fecho não introduziu regressão documental, whitespace inválido ou scope creep.
