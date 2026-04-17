# PLANO-IMPLEMENTACAO-TOTAL

## Header
- `doc_id`: `PLANO-IMPLEMENTACAO-TOTAL`
- `path`: `docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-17`

## Objetivo
Traduzir os requisitos funcionais e não funcionais ativos da Orelle num plano executavel para a equipa com rastreabilidade 1:1 e governanca documental alinhada ao contrato comum.

## Assuncoes
- IDs BK mantidos preservam a semântica original; itens fora de escopo são removidos fisicamente.
- Ajustes permitidos: metadados (`sprint`, `core_or_reforco`, `guia_path`, `proximo_bk`, `dependencias`) e alinhamentos de RF ativos após corte.
- Fecho documental requer score `>=93/100` e auditoria automatica em `PASS`.

## Tabela MF0..MF8
| Macro | Nome | Total BK | Owner stream P0 | Gate de saida |
| --- | --- | --- | --- | --- |
| MF0 | Fundamentos e governance | 8 | Bruna | Cobertura integral da macro MF0 com evidence valida. |
| MF1 | Nucleo funcional I | 8 | Bruna | Cobertura integral da macro MF1 com evidence valida. |
| MF2 | Nucleo funcional II | 8 | Izelicks | Cobertura integral da macro MF2 com evidence valida. |
| MF3 | Capacidades de produto I | 7 | Bruna | Cobertura integral da macro MF3 com evidence valida. |
| MF4 | Capacidades de produto II | 6 | Bruna | Cobertura integral da macro MF4 com evidence valida. |
| MF5 | Operacao e fluxos transversais | 6 | Izelicks | Cobertura integral da macro MF5 com evidence valida. |
| MF6 | Qualidade e robustez | 7 | Izelicks | Cobertura integral da macro MF6 com evidence valida. |
| MF7 | Privacidade, seguranca e controlo | 7 | Bruna | Cobertura integral da macro MF7 com evidence valida. |
| MF8 | Integracoes, compatibilidade e fecho | 7 | Izelicks | Cobertura integral da macro MF8 com evidence valida. |

## Regras transversais por macro
1. Cada BK fecha com `Smoke`, `Negativos`, `Tecnico` e `Evidence` completos.
2. Regra de negativos: `P0 >= 3`; `P1/P2 >= 2`.
3. Handoff obrigatorio para BK nao-terminal.
4. Qualquer drift de metadados entre matriz/backlog/guia bloqueia o fecho da sprint.

## Gates S4/S8/S12
- `S4`: cobertura inicial, consistencia de metadados e qualidade minima dos guias da janela.
- `S8`: reauditoria de coerencia backlog/matriz/guias/sprints e acao corretiva fechada.
- `S12`: fecho integral e emissao de parecer final GO/NO-GO documental.

## Changelog
- `2026-04-12`: versao inicial da planificacao macro.
- `2026-04-14`: plano consolidado para 12 sprints e contrato canónico comum.
- `2026-04-17`: plano recalibrado para 64 BK após remoção de escopo fora do MVP PAP.
