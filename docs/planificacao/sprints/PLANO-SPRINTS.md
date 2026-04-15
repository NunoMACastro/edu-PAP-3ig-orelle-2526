# PLANO-SPRINTS

## Header
- `doc_id`: `PLANO-SPRINTS`
- `path`: `docs/planificacao/sprints/PLANO-SPRINTS.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-14`

## Conversao S/M/L
- `S`: 1 unidade de esforco.
- `M`: 2 unidades de esforco.
- `L`: 3 unidades de esforco.

## Capacidade semanal por aluno
| Pessoa | Capacidade alvo (u/semana) |
| --- | --- |
| Bruna | 4 |
| Izelicks | 4 |
| Aline | 3 |
| Daniel Bulica | 3 |
| Total equipa | 14 |

## Carga global planeada
- BK totais: `69`
- Esforco total: `105` unidades
- Janela de execucao: `12` sprints (`2026-04-13` a `2026-07-05`)
- Capacidade total da janela: `168` unidades
- Margem operacional global: `63` unidades (~`37.5%`) para bloqueios, revisoes e defesa

## Rebalanceamento de carga por sprint (12 sprints)
| Sprint | Periodo | Foco macro | Carga planeada (u) | Buffer semanal (u) | KPI alvo |
| --- | --- | --- | --- | --- | --- |
| S01 | 2026-04-13 a 2026-04-19 | MF0 (base) | 8 | 6 | >=90% BK planeados com Core + evidence minima |
| S02 | 2026-04-20 a 2026-04-26 | MF0 (fecho) | 8 | 6 | >=90% BK planeados com Core + evidence minima |
| S03 | 2026-04-27 a 2026-05-03 | MF1 (base) | 9 | 5 | >=90% BK planeados com Core + evidence minima |
| S04 | 2026-05-04 a 2026-05-10 | MF1 (fecho) | 9 | 5 | >=90% BK planeados com Core + evidence minima |
| S05 | 2026-05-11 a 2026-05-17 | MF2 (base) | 8 | 6 | >=90% BK planeados com Core + evidence minima |
| S06 | 2026-05-18 a 2026-05-24 | MF2 (fecho) + arranque MF3 | 8 | 6 | >=90% BK planeados com Core + evidence minima |
| S07 | 2026-05-25 a 2026-05-31 | MF3 (base) | 9 | 5 | >=90% BK planeados com Core + evidence minima |
| S08 | 2026-06-01 a 2026-06-07 | MF3 (fecho) + arranque MF4 | 9 | 5 | >=90% BK planeados com Core + evidence minima |
| S09 | 2026-06-08 a 2026-06-14 | MF4 + MF5 | 9 | 5 | >=90% BK planeados com Core + evidence minima |
| S10 | 2026-06-15 a 2026-06-21 | MF5 + MF6 | 9 | 5 | >=90% BK planeados com Core + evidence minima |
| S11 | 2026-06-22 a 2026-06-28 | MF6 + MF7 | 10 | 4 | >=90% BK planeados com Core + evidence minima |
| S12 | 2026-06-29 a 2026-07-05 | MF7 + MF8 + fecho | 9 | 5 | >=90% BK planeados com Core + evidence minima |

## Janela oficial por macro
- `MF0`: `S01-S02`
- `MF1`: `S03-S04`
- `MF2`: `S05-S06`
- `MF3`: `S07-S08`
- `MF4`: `S08-S09`
- `MF5`: `S09-S10`
- `MF6`: `S10-S11`
- `MF7`: `S11-S12`
- `MF8`: `S12`

## Gates de qualidade por sprint
1. Nenhum BK fecha sem `Smoke`, `Negativos`, `Tecnico` e `Evidence` completos.
2. BK `P0` seguem `Reforco`: `>=8 passos` e `>=3 negativos`.
3. BK `P1/P2` seguem `Core`: `>=6 passos` e `>=2 negativos`.
4. Drift de metadados entre backlog/matriz/guia bloqueia fecho de sprint se afetar BK `P0`.

## Regras de replaneamento
1. Replaneamento apenas no fecho da sprint, salvo bloqueio critico.
2. Prioridade operacional: `P0 > P1 > P2`.
3. Qualquer desvio deve refletir-se em backlog, matriz, anexos e guias no mesmo ciclo.
4. Em sobrecarga, adiar reforco nao critico antes de reduzir cobertura RF/RNF.

## KPI por sprint
- `% BK planeados concluidos`
- `% BK com guia canónico conforme`
- `% BK com snippet tecnico aplicavel`
- `N de bloqueios >48h`
- `desvio_u (planeado - real)`

## Artefactos obrigatorios de governanca
- `SCORECARD-SPRINTS.md`
- `GUIAO-DOCENTE-SEMANAL.md`

## Changelog
- `2026-04-12`: plano de sprints inicial da Orelle.
- `2026-04-14`: alinhamento para 12 sprints com gates S4/S8/S12 e contrato comum de avaliacao.
