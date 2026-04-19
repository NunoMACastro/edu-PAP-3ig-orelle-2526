# PLANO-IMPLEMENTACAO-TOTAL

## Header
- `doc_id`: `PLANO-IMPLEMENTACAO-TOTAL`
- `path`: `docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-19`

## Objetivo
Definir o plano macro executavel da Orelle com rastreabilidade RF/RNF -> BK -> Guia e governanca alinhada ao contrato canónico v2.

## Assuncoes
- IDs RF/RNF/BK sao imutaveis nesta vaga.
- Escopo funcional aprovado mantem-se sem cortes adicionais.
- MVP de pagamentos: `Stripe` real controlado + `PayPal/MBWay` em stub funcional.
- Normalizacao desta vaga e estrutural/governanca/pedagogia documental.
- Fecho documental exige score consolidado `>=97/100`.
- Core dual por sprint deve manter `>=70%` de esforco em `CORE-*`.

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
| MF8 | Janela canónica S01-S12 | 7 | Partilhado (Bruna/Aline/Izelicks) |

## Fases
1. Fase 1 (`S01-S04`): fundacoes + consolidacao do nucleo inicial.
2. Fase 2 (`S05-S08`): capacidades de produto + coerencia cross-artefactos.
3. Fase 3 (`S09-S12`): qualidade final, evidencias e defesa.

## Regras transversais por macro
1. Owner unico por BK com apoio explicito.
2. BK fecha apenas com `Smoke`, `Negativos`, `Tecnico` e `Evidence` completos.
3. BK `P0` em modo `Reforco`; BK `P1/P2` em modo `Core`.
4. Qualquer drift entre matriz/backlog/guias/sprints bloqueia fecho da sprint.

## Gates S4/S8/S12
- Fonte oficial: `docs/planificacao/sprints/GATES-S4-S8-S12.md`.
- `S4`: cobertura inicial + consistencia estrutural.
- `S8`: coerencia documental + score parcial `>=97/100`.
- `S12`: fecho integral com validacao automatica em `PASS` + core dual `>=70%`.

## Criterios de saida
- `bash scripts/validate-planificacao.sh` com `overall_pass: true`.
- Score consolidado no scorecard `>=97/100`.
- Evidencias de gate publicadas (`S4`, `S8`, `S12`).

## Changelog
- `2026-04-18`: plano macro normalizado para contrato canónico v2 cross-PAP.
- `2026-04-19`: incorporado contrato de core dual, rebalanceamento e politica de pagamentos MVP.
