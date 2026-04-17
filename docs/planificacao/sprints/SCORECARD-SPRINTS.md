# SCORECARD-SPRINTS

## Header
- `doc_id`: `SCORECARD-SPRINTS`
- `path`: `docs/planificacao/sprints/SCORECARD-SPRINTS.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-17`

## Objetivo
Padronizar avaliacao por sprint com criterios fixos de qualidade e controlo de carga real, alinhado ao contrato canónico comum.

## Contrato do scorecard
Campos obrigatorios por sprint:
`cobertura`, `coerencia`, `pedagogia_guidance_step_by_step`, `adequacao_12o`, `governanca`, `carga_planeada_u`, `carga_real_u`, `desvio_u`, `risco_semaforo`, `acao_corretiva`.

## Pesos oficiais (0-100)
| Criterio | Peso |
| --- | --- |
| Cobertura/rastreabilidade | 25 |
| Coerencia documental | 20 |
| Pedagogia/guidance/step-by-step | 25 |
| Adequacao ao 12o | 20 |
| Governanca/avaliacao | 10 |
| Total | 100 |

## Scorecard por sprint
| sprint | cobertura | coerencia | pedagogia_guidance_step_by_step | adequacao_12o | governanca | carga_planeada_u | carga_real_u | desvio_u | risco_semaforo | acao_corretiva |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | - | - | - | - | - | 8 | - | - | Verde | - |
| S02 | - | - | - | - | - | 8 | - | - | Verde | - |
| S03 | - | - | - | - | - | 9 | - | - | Verde | - |
| S04 | - | - | - | - | - | 9 | - | - | Verde | - |
| S05 | - | - | - | - | - | 8 | - | - | Verde | - |
| S06 | - | - | - | - | - | 8 | - | - | Verde | - |
| S07 | - | - | - | - | - | 8 | - | - | Verde | - |
| S08 | - | - | - | - | - | 8 | - | - | Verde | - |
| S09 | - | - | - | - | - | 8 | - | - | Verde | - |
| S10 | - | - | - | - | - | 8 | - | - | Verde | - |
| S11 | - | - | - | - | - | 10 | - | - | Verde | - |
| S12 | - | - | - | - | - | 8 | - | - | Verde | - |

## Regras de semaforo
- `Verde`: desvio absoluto <= 2 unidades e sem bloqueio critico.
- `Amarelo`: desvio entre 3 e 4 unidades ou bloqueio >48h em BK `P1/P2`.
- `Vermelho`: desvio >= 5 unidades, bloqueio em BK `P0` ou quebra de rastreabilidade.

## Acao automatica
- `Verde`: manter plano.
- `Amarelo`: replanear dentro da sprint e reforcar checkpoint docente.
- `Vermelho`: congelar `Reforco`, priorizar `Core` e abrir decisao do orientador.

## Changelog
- `2026-04-14`: scorecard criado e alinhado ao contrato comum de avaliacao (25/20/25/20/10).
- `2026-04-17`: cargas planeadas por sprint recalibradas para o novo escopo de 64 BK.
