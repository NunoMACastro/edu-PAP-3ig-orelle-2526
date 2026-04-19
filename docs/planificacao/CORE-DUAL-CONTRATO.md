# CORE-DUAL-CONTRATO

## Header
- `doc_id`: `CORE-DUAL-CONTRATO`
- `path`: `docs/planificacao/CORE-DUAL-CONTRATO.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-19`

## Definicao oficial
A Orelle opera em core dual:
1. `Consultoria inteligente` (analise facial, recomendacao personalizada e evolucao).
2. `Monetizacao orientada` (catalogo, compra e recompra suportadas pela recomendacao).

## Regras canónicas
- Regra de equilibrio: por sprint, `>=70%` do esforco deve estar em `CORE-IA`, `CORE-COM` ou `CORE-HIBRIDO`.
- Regra de entrada BK (GO/NO-GO): um BK novo so entra no MVP se melhorar aconselhamento, monetizacao, ou ambos.
- Regra anti-desvio: BK sem contribuicao clara para os eixos core deve ser classificado como `SUPORTE`.
- Regra de evidencias: BK `CORE-*` exige evidencia tecnica e evidencia de negocio.

## Classes e significado
- `CORE-IA`: entrega direta no eixo de consultoria inteligente.
- `CORE-COM`: entrega direta no eixo de monetizacao.
- `CORE-HIBRIDO`: entrega com impacto simultaneo em consultoria e monetizacao.
- `SUPORTE`: habilitador transversal de operacao, qualidade ou governance.

## KPIs minimos de acompanhamento
- `CORE-IA`: `taxa_recomendacao_util`, `tempo_analise_p95`.
- `CORE-COM`: `taxa_conversao_checkout`, `taxa_recompra_30d`.
- `CORE-HIBRIDO`: `add_to_cart_recomendado`, `retencao_fluxo_ia_30d`.
- `SUPORTE`: `taxa_incidentes_criticos`, `taxa_conformidade_gates`.

## Fonte de verdade
- Classificacao por BK: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`.
- Planeamento de sprint: `docs/planificacao/sprints/PLANO-SPRINTS.md`.
- Governanca de gate: `docs/planificacao/sprints/GATES-S4-S8-S12.md`.

## Changelog
- `2026-04-19`: contrato criado para institucionalizar o core dual e controlar desvio de conceito.
