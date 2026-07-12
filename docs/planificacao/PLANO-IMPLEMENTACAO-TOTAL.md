# PLANO-IMPLEMENTACAO-TOTAL

## Header
- `doc_id`: `PLANO-IMPLEMENTACAO-TOTAL`
- `path`: `docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-07-11`

## Objetivo
Definir o plano macro executavel da Orelle com rastreabilidade RF/RNF -> BK -> Guia e governanca alinhada ao contrato canónico v2.

## Assuncoes
- IDs RF/RNF/BK sao imutaveis nesta vaga.
- Escopo funcional aprovado mantem-se sem cortes adicionais.
- IA de runtime exclusivamente OpenAI, sem modos alternativos de produto nem fallback sintético. Sem chave, a aplicação arranca degradada e apenas novas operações IA ficam indisponíveis.
- A consulta usa um objetivo principal e até dois secundários entre sete objetivos, frontal + perfil com qualidade controlada, análise OpenAI, 5–8 perguntas estruturadas, catálogo filtrado e relatório único.
- A revisão humana é opcional antes do congelamento. O consultor só acede a fotografias mediante grant explícito, revogável e temporário por relatório.
- Produtos sem stock podem ser explicados no relatório, mas não entram no valor elegível nem têm CTA de compra.
- Pagamento do MVP: método único `Pagamento simulado`, executado localmente, sem integração financeira externa, credenciais de cobrança, redirecionamento ou movimentação de dinheiro.
- Contrato HTTP: checkout com body vazio cria `mode=simulated/status=awaiting_simulation`; a confirmação usa `POST /api/orders/:orderId/payments/simulate` com `Idempotency-Key` e termina em `simulated_paid` ou `simulated_failed`.
- Relatório: existe uma segunda simulação separada em `POST /api/face-reports/:reportId/unlock/simulate-payment`; `recommendedTotalCents` soma uma unidade de cada recomendação disponível no congelamento e `depositCents = ceil(recommendedTotalCents × 1000 / 10000)`. Unlock + voucher do mesmo valor são idempotentes/transacionais, não afetam stock/carrinho e nunca representam cobrança. Zero produtos disponíveis desbloqueia sem simulação nem voucher zero.
- A edição OpenAI de maquilhagem é opcional e apenas posterior ao desbloqueio, com consentimento generativo próprio, fotografia frontal e variantes da versão congelada. Outros objetivos não geram uma pele futura.
- Operação, backup, restore, release e rollback referem-se apenas ao ambiente académico/local da PAP; não são alegações de produção ou cloud.
- RNF21 usa snapshots integrais Extended JSON cifrados com AES-256-GCM, chave dedicada, AAD, checksums e índices; mantém sete cópias e só aceita restore para bases `_restore`. O scheduler é opt-in `dev:local`, não uma alegação de automação em produção.
- A árvore `mockup/` está disponível e a aproximação visual está pronta para comparação manual; não se assume que o artefacto esteja aprovado nem que a interface já esteja alinhada.
- Normalizacao desta vaga e estrutural/governanca/pedagogia documental.
- Fecho documental exige score consolidado `>=97/100`.
- Core dual por sprint deve manter `>=70%` de esforco em `CORE-*`.

## Contrato técnico OpenAI da vaga

### Configuração

- `OPENAI_API_KEY` + `DATA_ENCRYPTION_KEY` com pelo menos 32 caracteres fora de teste — ativam novas operações OpenAI com storage sensível; ausência de chave produz `AI_NOT_CONFIGURED` e ausência de cifra segura produz `AI_STORAGE_NOT_CONFIGURED`.
- `OPENAI_ANALYSIS_MODEL=gpt-5.4-mini`, `OPENAI_FALLBACK_MODEL=gpt-5.4` e `OPENAI_IMAGE_MODEL=gpt-image-2` — defaults configuráveis.
- `OPENAI_NOTICE_VERSION`, `OPENAI_PROMPT_VERSION`, `OPENAI_SCHEMA_VERSION`, `OPENAI_IMAGE_PROMPT_VERSION` e `OPENAI_IMAGE_SCHEMA_VERSION` — versões persistidas na provenance.
- `OPENAI_QUESTION_TIMEOUT_MS=30000`, `OPENAI_ANALYSIS_TIMEOUT_MS=60000`, `OPENAI_REPORT_TIMEOUT_MS=60000` e `OPENAI_IMAGE_TIMEOUT_MS=150000` — deadlines por operação.
- Fallback significa repetir uma vez o modelo primário numa falha transitória e tentar uma vez o modelo OpenAI de fallback; esgotar as tentativas produz `failed_retryable` para análise/relatório/imagem, nunca um resultado cosmético inventado. Só a escolha da pergunta seguinte pode recorrer ao banco canónico validado.

### Rotas canónicas

- Frontend cliente: `/consulta`, `/consulta/nova`, `/consulta/ativa`, `/consulta/relatorios/:reportId`, `/consulta/historico`.
- Frontend consultor: `/consultoria/revisoes`.
- Capacidades/objetivos/sessões: `GET /api/ai-consultation/capabilities`, `GET /api/ai-consultation/goals`, `POST /api/ai-consultation/sessions`, `GET /api/ai-consultation/sessions`, `GET /api/ai-consultation/sessions/current`, `GET|DELETE /api/ai-consultation/sessions/:sessionId` e `POST /api/ai-consultation/sessions/:sessionId/{analysis|answers|submit|retry}`.
- Relatório: `GET /api/face-reports/:reportId`, `POST /api/face-reports/:reportId/finalize`, `POST|DELETE /api/face-reports/:reportId/review-request`, `DELETE /api/face-reports/:reportId/review-photo-access` e `POST /api/face-reports/:reportId/unlock/simulate-payment`. O `POST .../review-request` pode criar o grant opcional através de `grantPhotoAccess` e `photoAccessNoticeVersion`; o `DELETE .../review-photo-access` revoga apenas esse grant.
- Consultor: `GET /api/consultant/ai-consultation-reviews`, `GET /api/consultant/ai-consultation-reviews/:reviewId`, `POST /api/consultant/ai-consultation-reviews/:reviewId/decision` e `GET /api/consultant/ai-consultation-reviews/:reviewId/photos/:view`.
- Imagem: `POST /api/face-reports/:reportId/makeup-simulations`, `GET /api/makeup-simulations/:simulationId`, `DELETE /api/makeup-simulations/:simulationId/consent` e `GET /api/makeup-simulations/:simulationId/image`.

## Tabela MF0..MF8
| Macro | Janela | Total BK | Owner stream P0 |
| --- | --- | --- | --- |
| MF0 | Janela canónica S01-S12 | 8 | Bruna |
| MF1 | Janela canónica S01-S12 | 8 | Bruna |
| MF2 | Janela canónica S01-S12 | 8 | Izelicks |
| MF3 | Janela canónica S01-S12 | 7 | Bruna/Izelicks |
| MF4 | Janela canónica S01-S12 | 6 | Izelicks |
| MF5 | Janela canónica S01-S12 | 6 | Aline |
| MF6 | Janela canónica S01-S12 | 7 | Izelicks |
| MF7 | Janela canónica S01-S12 | 7 | Bruna |
| MF8 | Janela canónica S01-S12 | 17 | Partilhado (Bruna/Aline/Izelicks/Daniel Bulica) |

## Fases
1. Fase 1 (`S01-S04`): fundações, identidade, perfil, catálogo e comércio simulado.
2. Fase 2 (`S05-S08`): objetivos/consentimento/fotografias, qualidade, jobs e conversa OpenAI retomável.
3. Fase 3 (`S09-S12`): relatório/recomendações, revisão/freeze, 10% + voucher, preview OpenAI, privacidade, qualidade final, evidências e defesa.

## Regras transversais por macro
1. Owner unico por BK com apoio explicito.
2. BK fecha apenas com `Smoke`, `Negativos`, `Tecnico` e `Evidence` completos.
3. BK `P0` em modo `Reforco`; BK `P1/P2` em modo `Core`.
4. Qualquer drift entre matriz/backlog/guias/sprints bloqueia fecho da sprint.

## Gates S4/S8/S12
- Fonte oficial: `docs/planificacao/sprints/GATES-S4-S8-S12.md`.
- `S4`: cobertura inicial + consistencia estrutural.
- `S8`: coerencia documental + score parcial `>=97/100`.
- `S12`: fecho integral com validacao automatica em `PASS` + core dual `>=70%`; browser, mockup ou teste OpenAI live não executados permanecem `BLOQUEADO`/`SKIP`, nunca sucesso inventado.

## Criterios de saida
- `bash scripts/validate-planificacao.sh` com `overall_pass: true`.
- Score consolidado no scorecard `>=97/100`.
- Evidencias de gate publicadas (`S4`, `S8`, `S12`).

## Contrato funcional reconciliado em 2026-07-11

- Privacidade usa endpoints canónicos `privacy-requests`, retry idempotente, ausência física antes de `completed` e eliminação terminal da própria conta. O `DELETE /api/admin/users/:id` é apenas “Desativar”: preserva email/dados, grava `suspended`, revoga sessões atomicamente e pode ser revertido; não substitui `DELETE /api/me/account`.
- A consulta é conduzida pelo `flowState` do backend: sete objetivos, consentimento v2, frontal/perfil, qualidade local/backend/OpenAI, 5–8 perguntas e jobs duráveis com idempotência/retry/recovery. Não existe geração direta fora deste fluxo.
- O backend filtra o catálogo e entrega no máximo 15 candidatos minimizados à OpenAI; IDs/variantes são revalidados. `FaceReport` e `machineResult` são versionados/imutáveis; o teaser bloqueado não transporta conteúdo integral.
- Revisão separa `machineResult` de `humanOverride`, permite aprovação/ajuste/esclarecimento/retirada, audita listagem/detalhe/fotografia/decisão e usa CAS com `409` concorrente. O congelamento fixa `contentHash`, IDs, preços e disponibilidade.
- Registry local 001–015: `001`–`009` permanecem imutáveis; a vaga acrescenta `010_openai_only_and_consent_v2`, `011_goal_consultation_and_ai_jobs`, `012_product_ai_metadata_and_variants`, `013_report_v2_and_recommendation_snapshots`, `014_report_review_and_unlock_snapshot` e `015_photo_quality_and_openai_simulation`. Dados antigos ficam legacy/archived e nunca são promovidos a OpenAI.
- Comparação histórica escolhe momentos por data/`selectionKey`, entrega imagem própria autenticada/no-store e mostra tabela acessível. A edição de maquilhagem é OpenAI, owner-only, cifrada, expira em sete dias e não substitui a comparação real da pele.
- Fairness usa pré-filtro/allowlist, exclui atributos protegidos do ranking, aplica alergias/restrições como barreira e documenta limitações sem prometer ausência total de viés.
- RNF26/BK-MF8-14 ficam em `ACEITE_RISCO`: a validação manual/Figma foi dispensada no contexto académico/local. Não existe alegação de que o mockup esteja aprovado nem de equivalência visual.
- Backup local publica apenas `backup:create|restore|verify|prune`; o scheduler recuperável só pode iniciar em `dev:local` com `ORELLE_LOCAL_BACKUP_ENABLED=true`, `ORELLE_BACKUP_KEY` dedicada e `ORELLE_BACKUP_ROOT` privado opcional. `npm run dev` nunca o ativa; execuções sobrepostas partilham o job em curso e o shutdown limpa o timer e aguarda esse job.
- O manifest web atual publica 13 scripts `smoke:*`; `verify:all` enumera-os dinamicamente e o contrato anti-órfão exige cada um exatamente uma vez. A contagem é inventário do snapshot, não configuração fixa nem prova de execução.

## Snapshot de evidência de 2026-07-09 (histórico)

- `G2 / pagamento simulado`: contrato HTTP, provider local e mutações transacionais principais estão alinhados; os 14 testes unitários/de contrato passaram. O hash da `Idempotency-Key` é persistido mas ainda não é comparado, pelo que uma tentativa `simulated_failed` pode voltar a executar com a mesma chave. O gate não fecha enquanto faltarem esta correção, a UI de dois passos e a prova de rollback, replay e 25 pedidos concorrentes num replica set.
- `CSV Formula Injection`: células controladas iniciadas por `=`, `+`, `-`, `@`, TAB ou CR são prefixadas com apóstrofo antes do escape RFC 4180; a suite de exportação passou 13/13 fora da sandbox.
- `RNF21 / backup local`: core, CLIs de create/restore/verify/prune, checksums, índices, retenção sete e guardas locais estão implementados; os testes unitários passaram 7/7. A prova real `create -> restore _restore -> verify` em replica set continua pendente.
- `Integração operacional`: enquanto `backup:daily` apontar para o export redigido legado e o scheduler não estiver ligado por opt-in explícito, esses elementos não podem ser usados como prova de backup recuperável diário.

## Changelog
- `2026-07-11`: plano macro sincronizado com OpenAI-only, sete objetivos, qualidade/jobs/conversa, rotas e configuração, relatório/revisão/freeze, cálculo inteiro dos 10%, voucher, edição de maquilhagem e migrações 010–015.
- `2026-07-10`: contagens voláteis de suites foram removidas deste plano macro; o estado e os retestes atuais ficam apenas no plano mestre da auditoria.
- `2026-07-10`: contratos de privacidade, consulta/revisão, comparação, fairness e estado do mockup reconciliados com o runtime atual; snapshot anterior marcado como histórico.
- `2026-07-10`: registry/documentação reconciliados com a migração 008 e com a apresentação de correções humanas sem sobrescrever o snapshot automático.
- `2026-07-10`: estado corrente sobrepõe a linha anterior: registry 001–009, migration 009/barreiras de privacidade, RNF26 em `ACEITE_RISCO` e prova runtime de staging de backup ainda pendente.
- `2026-07-10`: estado corrente posterior: staging/rename do backup passou `10/10` core e `3/3` replica-set com snapshot consistente, cleanup e parciais ignorados; registry 001–009 e RNF26 `ACEITE_RISCO` mantêm-se.
- `2026-07-09`: contrato transversal alinhado ao método único `Pagamento simulado`, CSV neutralizado, RNF21 concretizado como backup recuperável local com prova replica-set ainda pendente, scope operacional académico/local e bloqueio externo do mockup aprovado.
- `2026-06-30`: MF8 expandida para 17 BKs, incluindo consulta IA guiada, revisão humana e testes finais em BK-MF8-15..17.
- `2026-06-29`: MF8 expandida na primeira versão de fecho técnico, UI, QA final e estabilização.
- `2026-04-18`: plano macro normalizado para contrato canónico v2 cross-PAP.
- `2026-04-19`: incorporado contrato de core dual, rebalanceamento e politica de pagamentos MVP.
