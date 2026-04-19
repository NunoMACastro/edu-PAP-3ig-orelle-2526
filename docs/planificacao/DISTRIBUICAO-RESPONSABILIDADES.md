# DISTRIBUICAO-RESPONSABILIDADES

## Header
- `doc_id`: `DISTRIBUICAO-RESPONSABILIDADES`
- `path`: `docs/planificacao/DISTRIBUICAO-RESPONSABILIDADES.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-19`

## Objetivo
Formalizar ownership da Orelle no contrato comum das 4 PAPs, com carga, risco e governanca pedagógica alinhados.

## Equipa e carga alvo
| Pessoa | Papel principal | Total BK | P0 | P1 | P2 |
| --- | --- | --- | --- | --- | --- |
| Bruna | Execucao tecnica e handoff | 20 | 18 | 2 | 0 |
| Izelicks | Execucao tecnica e handoff | 19 | 13 | 6 | 0 |
| Aline | Execucao tecnica e handoff | 16 | 5 | 8 | 3 |
| Daniel Bulica | Execucao tecnica e handoff | 9 | 0 | 6 | 3 |


## Regra explicita de carga diferencial
- Bruna deve manter carga superior ao Izelicks em `+6u` (38u vs 32u), com excecao pedagógica aprovada pelo orientador.
- Picos semanais da Bruna sao permitidos quando houver apoio direto do orientador e registo no scorecard.

## Regras principais
1. Owner unico por BK com apoio obrigatorio.
2. BK so fecha com criterios de aceite e evidence (`pr/proof/neg`).
3. BK `P0` com prioridade de suporte docente em caso de bloqueio >48h.
4. Em sobrecarga, reduzir primeiro paralelismo de `P1/P2`.

## Matriz por artefacto
| Artefacto | Owner |
| --- | --- |
| PLANO-IMPLEMENTACAO-TOTAL.md | Nuno |
| MATRIZ-CANONICA-BK.md | Nuno |
| BACKLOG-MVP.md | Owner operacional da macro ativa |
| PLANO-SPRINTS.md | Owner operacional da sprint ativa |
| guias-bk/MF0..MF8/*.md | Owner do BK |

## Cerimonias
- Planeamento semanal: alinhamento de BK por prioridade e capacidade real.
- Checkpoint intermadio: revisao de risco, bloqueios e handoff.
- Fecho semanal: validacao de evidence e scorecard.

## Papel do orientador
- Validar coerencia cross-artefactos.
- Aprovar excecoes de carga e remediacao.
- Fechar gates `S4/S8/S12` com parecer GO/NO-GO.

## Changelog
- `2026-04-18`: distribuicao normalizada para contrato canónico v2 cross-PAP.
- `2026-04-19`: rebalanceamento profundo aplicado com Daniel sem BK `P0` tecnico.
