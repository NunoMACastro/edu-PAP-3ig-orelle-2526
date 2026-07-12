# PLANIFICACAO-ORELLE

## Header
- `doc_id`: `PLANIFICACAO-ORELLE`
- `path`: `docs/planificacao/README.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-07-11`

## Objetivo
Centralizar a planificacao executavel da Orelle com contrato canónico comum entre as 4 PAPs, sem drift estrutural, de governanca ou pedagogico.

## Hierarquia de verdade (obrigatoria)
`MATRIZ-CANONICA-BK` > `BACKLOG-MVP` > `PLANO-SPRINTS` > `SCORECARD-SPRINTS` > `GUIAO-DOCENTE-SEMANAL` > `GATES-S4-S8-S12` > `guias-bk/*`.

O [plano vivo da consulta cosmética OpenAI](PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md) regista estado, evidência e blockers da implementação de referência. Complementa esta hierarquia pedagógica, mas não substitui matriz, backlog ou guias. O [plano de correção da auditoria completa](PLANO-CORRECAO-AUDITORIA-COMPLETA-real_dev.md) permanece como histórico da vaga anterior.

## Contrato canonico comum
- Scorecard fixo: `25/20/25/20/10`.
- Sprint IDs obrigatorios: `S01..S12`.
- Meta documental oficial: `>=97/100`.
- Regra de semaforo: com `carga_real_u = -`, obrigatorio `desvio_u = -` e `risco_semaforo = N/A`.
- Politica pedagogica BK: `P0 >= 8 passos e >=3 negativos`, `P1/P2 >= 6 passos e >=2/1 negativos`.
- Snippet tecnico deve estar ligado a `bk_id` e `rf_rnf`.

## Estrutura obrigatoria
1. `PLANO-IMPLEMENTACAO-TOTAL.md`
2. `DISTRIBUICAO-RESPONSABILIDADES.md`
3. `CORE-DUAL-CONTRATO.md`
4. `backlogs/BACKLOG-MVP.md`
5. `backlogs/MATRIZ-CANONICA-BK.md`
6. `backlogs/ANEXO-CORE-DUAL-BK.md`
7. `sprints/PLANO-SPRINTS.md`
8. `sprints/SCORECARD-SPRINTS.md`
9. `sprints/GUIAO-DOCENTE-SEMANAL.md`
10. `sprints/GATES-S4-S8-S12.md`
11. `sprints/OPERACAO-DEPLOY-ROLLBACK.md`
12. `guias-bk/README.md`

## Regra de atualizacao em cadeia
1. Atualizar matriz.
2. Atualizar backlog e anexos de rastreabilidade.
3. Atualizar guias BK impactados.
4. Atualizar plano/scorecard/guiao/gates.
5. Executar `bash scripts/validate-planificacao.sh`.

## Resumo de cobertura
- Total RF: **44**
- Total RNF: **31**
- Total BK: **74**
- Total guias BK: **74**
- Cobertura BK<->guia: **100% (1:1)**

## Contrato de referência da consulta OpenAI

- Runtime exclusivamente OpenAI: não existem modos de produto alternativos nem fallback sintético. Sem `OPENAI_API_KEY`, autenticação, conta, catálogo e loja continuam disponíveis; novas operações IA ficam indisponíveis com motivo sanitizado.
- A consulta aceita um objetivo principal e até dois secundários entre sete objetivos, exige consentimento v2 + frontal/perfil com qualidade controlada, executa análise OpenAI e apresenta 5–8 perguntas estruturadas.
- As operações de análise, pergunta seguinte, relatório e imagem usam jobs duráveis/idempotentes; fallback significa retry do modelo primário e uma tentativa noutro modelo OpenAI. Apenas a escolha da pergunta seguinte pode recorrer ao banco canónico depois de ambas falharem.
- Rotas de cliente canónicas: `/consulta`, `/consulta/nova`, `/consulta/ativa`, `/consulta/relatorios/:reportId` e `/consulta/historico`; a fila do consultor usa `/consultoria/revisoes`.
- API canónica: `/api/ai-consultation/capabilities|goals|sessions`, `/api/face-reports/:reportId`, `/api/consultant/ai-consultation-reviews` e `/api/makeup-simulations` nos métodos definidos em RF/RNF e no plano vivo.
- O relatório pode incluir produtos indisponíveis, devidamente marcados; apenas uma unidade de cada recomendação disponível no snapshot entra em `recommendedTotalCents`. O depósito usa `ceil(total × 1000 / 10000)` e origina um voucher do mesmo valor após pagamento exclusivamente simulado.
- A revisão humana é opcional e anterior ao congelamento. A edição OpenAI de maquilhagem é posterior ao desbloqueio, exige consentimento próprio e variantes congeladas; outros objetivos nunca geram uma pele futura.

## Validacao
- Comando oficial: `bash scripts/validate-planificacao.sh`.
- Gate de fecho (`S4/S8/S12`): exige `overall_pass: true` + evidencias.
- RNF21 tem evidence atual do fluxo completo: `10/10` testes do core e `3/3` integrações em `MongoMemoryReplSet` passaram snapshot consistente, staging privada 0700, ficheiros 0600, verificação, rename atómico, restore `_restore`, índices/checksums e cleanup. Falhas injetadas deixam zero snapshot final parcial/staging órfã e snapshots anteriores intactos; escrita concorrente conserva um único ponto temporal.
- RNF16 tem evidence validada na implementação de referência: `pdf-lib@1.17.1`, `13/13` testes focais e `pdfinfo` com exit code `0` e sem warnings numa amostra PDF 1.7/A4 de duas páginas.
- RNF26 está em `ACEITE_RISCO` no alvo académico/local: a comparação manual/Figma foi dispensada por decisão explícita de scope. Isto não prova que `mockup/` seja uma versão aprovada, não valida paridade visual e não autoriza apresentar screenshots inventados.
- A sincronização dos guias, matriz e backlog com o contrato OpenAI-only é acompanhada no plano vivo; durante esta vaga, um documento ainda não revisto não constitui evidência do runtime atual.
- O contrato canónico tem duas ações separadas de `Pagamento simulado`: encomenda e desbloqueio de relatório; ambas sem cobrança/gateway e com idempotência. O unlock + voucher ocorre numa transação; sem recomendações disponíveis não há pagamento nem voucher zero.
- A referência usa o registry append-only 001–015. `001`–`009` permanecem imutáveis; a vaga OpenAI acrescenta `010_openai_only_and_consent_v2`, `011_goal_consultation_and_ai_jobs`, `012_product_ai_metadata_and_variants`, `013_report_v2_and_recommendation_snapshots`, `014_report_review_and_unlock_snapshot` e `015_photo_quality_and_openai_simulation`. Dry-run, checksum, lock, validação, replay e invariantes de IDs/contagem/stock do catálogo pertencem ao gate de migrações do plano vivo.
- `test:ai:live` é opt-in e depende de credenciais/imagens consentidas; se não for executado, fica `SKIP`/`BLOQUEADO` e nunca é convertido em `PASS`. A validação determinística normal não depende de internet nem de créditos OpenAI.

## Changelog
- `2026-07-11`: topo da planificação sincronizado com o contrato OpenAI-only, sete objetivos, qualidade/consulta de 5–8 perguntas, rotas canónicas, relatório/revisão/freeze, fórmula dos 10%, voucher, edição de maquilhagem e migrações 010–015.
- `2026-07-10`: evidence da referência atualizada para PDF estruturalmente validado e ciclo local recuperável de backup/restore/verify; mantido o alvo académico/local.
- `2026-07-10`: contratos ativos reconciliados para privacidade/conta, consulta/revisão, comparação conceptual, fairness allowlist e mockup disponível para validação manual.
- `2026-07-10`: documentação da cifra/revisão alinhada à migração 008, explicação efetiva e referência de overrides por `reviewId`.
- `2026-07-10`: estado corrente sobrepõe a linha anterior: registry alargado à 009, staging de backup marcada como alvo ainda sem prova runtime e RNF26 registado como `ACEITE_RISCO` sem alegação de aprovação visual.
- `2026-07-10`: estado corrente posterior sobrepõe apenas a componente staging da linha anterior: o boundary passou `10/10` core + `3/3` replica-set; RNF26 mantém-se `ACEITE_RISCO` sem aprovação visual.
- `2026-07-09`: totais reconciliados para 44 RF, 31 RNF e 74 BK/guias; adicionada a prova operacional obrigatória de RNF21.
- `2026-04-18`: README de planificacao normalizado para contrato canónico v2 cross-PAP.
- `2026-04-19`: incorporado contrato core dual e corrigidos totais RF/RNF.
