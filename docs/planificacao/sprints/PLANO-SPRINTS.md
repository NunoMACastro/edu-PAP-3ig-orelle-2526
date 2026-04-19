# PLANO-SPRINTS

## Header
- `doc_id`: `PLANO-SPRINTS`
- `path`: `docs/planificacao/sprints/PLANO-SPRINTS.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-19`

## Conversao S/M/L
- `S`: 1 unidade
- `M`: 2 unidades
- `L`: 3 unidades

## Capacidade semanal por aluno
| Pessoa | Capacidade alvo (u/semana) |
| --- | --- |
| Aline | 4 |
| Bruna | 4 |
| Daniel Bulica | 4 |
| Izelicks | 4 |
| Total equipa | 16 |

## Carga global planeada (modelo normalizado)
- BK totais: `64`
- `esforco_unico_total_u`: `100` (cada BK conta 1x com `S=1`, `M=2`, `L=3`)
- `carga_planeada_sprint_u`: distribuicao do esforco pelas janelas declaradas (`Sxx-Syy`)
- Janela de execucao: `12` sprints (`2026-04-13` a `2026-07-05`)
- Capacidade total da janela: `192` unidades
- Margem operacional global (capacidade - esforco_unico_total_u): `92` unidades

## Linha temporal oficial (12 sprints)
| sprint | periodo | foco_macro | objetivo_operacional | carga_planeada_u | gate |
| --- | --- | --- | --- | --- | --- |
| S01 | 2026-04-13 a 2026-04-19 | MF0 | Carga planeada e entrega com evidence completa | 7 | NAO |
| S02 | 2026-04-20 a 2026-04-26 | MF0 | Carga planeada e entrega com evidence completa | 7 | NAO |
| S03 | 2026-04-27 a 2026-05-03 | MF1 | Carga planeada e entrega com evidence completa | 6.5 | NAO |
| S04 | 2026-05-04 a 2026-05-10 | MF1 | Carga planeada e entrega com evidence completa | 6.5 | SIM |
| S05 | 2026-05-11 a 2026-05-17 | MF2 | Carga planeada e entrega com evidence completa | 4.5 | NAO |
| S06 | 2026-05-18 a 2026-05-24 | MF2 | Carga planeada e entrega com evidence completa | 4.5 | NAO |
| S07 | 2026-05-25 a 2026-05-31 | MF3 | Carga planeada e entrega com evidence completa | 5.5 | NAO |
| S08 | 2026-06-01 a 2026-06-07 | MF3/MF4 | Carga planeada e entrega com evidence completa | 10 | SIM |
| S09 | 2026-06-08 a 2026-06-14 | MF4/MF5 | Carga planeada e entrega com evidence completa | 9 | NAO |
| S10 | 2026-06-15 a 2026-06-21 | MF6/MF5 | Carga planeada e entrega com evidence completa | 10.5 | NAO |
| S11 | 2026-06-22 a 2026-06-28 | MF6/MF7/MF8 | Carga planeada e entrega com evidence completa | 13 | NAO |
| S12 | 2026-06-29 a 2026-07-05 | MF7/MF8 | Carga planeada e entrega com evidence completa | 16 | SIM |

## Regra de replaneamento
1. Replaneamento apenas no fecho da sprint, salvo bloqueio critico.
2. Prioridade operacional: `P0 > P1 > P2`.
3. Qualquer desvio exige sincronizacao de matriz/backlog/guias/sprints no mesmo ciclo.
4. Em sobrecarga, reduzir primeiro paralelismo `P1/P2` sem perder cobertura RF/RNF.


## Matriz minima de testes por prioridade
- `P0`: evidencias obrigatorias de `unit + integration + e2e` e minimo `3` negativos.
- `P1`: evidencias obrigatorias de `unit/integration` e minimo `2` negativos.
- `P2`: teste focal do fluxo alterado e minimo `1` negativo.
- Aplicacao canónica: BK em `Sxx-Syy` distribui carga `50/50` por sprint para auditoria.

## KPI minimos por sprint
- `% BK planeados concluidos >= 85%`.
- `% BK com smoke/negativos/evidence completos >= 90%`.
- `% BK com snippet coerente com `bk_id` e `rf_rnf` = 100%`.
- `% esforço em core dual (CORE-IA + CORE-COM + CORE-HIBRIDO) >= 70%`.

## Artefactos obrigatorios
- `SCORECARD-SPRINTS.md`
- `GUIAO-DOCENTE-SEMANAL.md`
- `GATES-S4-S8-S12.md`
- `OPERACAO-DEPLOY-ROLLBACK.md`
- `ANEXO-CORE-DUAL-BK.md`

## Changelog
- `2026-04-18`: plano de sprints normalizado para contrato canónico v2 cross-PAP.
- `2026-04-19`: carga normalizada (`esforco_unico_total_u` vs `carga_planeada_sprint_u`) + regra core dual >=70%.
