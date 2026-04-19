# PLANIFICACAO-ORELLE

## Header
- `doc_id`: `PLANIFICACAO-ORELLE`
- `path`: `docs/planificacao/README.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-18`

## Objetivo
Centralizar a planificacao executavel da Orelle com contrato canónico comum entre as 4 PAPs, sem drift estrutural, de governanca ou pedagogico.

## Hierarquia de verdade (obrigatoria)
`MATRIZ-CANONICA-BK` > `BACKLOG-MVP` > `PLANO-SPRINTS` > `SCORECARD-SPRINTS` > `GUIAO-DOCENTE-SEMANAL` > `GATES-S4-S8-S12` > `guias-bk/*`.

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
- Total RF: **39**
- Total RNF: **25**
- Total BK: **64**
- Total guias BK: **64**
- Cobertura BK<->guia: **100% (1:1)**

## Validacao
- Comando oficial: `bash scripts/validate-planificacao.sh`.
- Gate de fecho (`S4/S8/S12`): exige `overall_pass: true` + evidencias.

## Changelog
- `2026-04-18`: README de planificacao normalizado para contrato canónico v2 cross-PAP.
- `2026-04-19`: incorporado contrato core dual e corrigidos totais RF/RNF.
