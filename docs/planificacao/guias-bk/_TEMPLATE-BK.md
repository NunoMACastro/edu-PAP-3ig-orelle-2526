# BK-MF*-** - Titulo do BK

## Header
- `doc_id`: `GUIA-BK-MF*-**`
- `bk_id`: `BK-MF*-**`
- `macro`: `MF*`
- `owner`: `...`
- `apoio`: `...`
- `prioridade`: `P0|P1|P2`
- `estado`: `TODO|IN_PROGRESS|DONE|BLOCKED`
- `esforco`: `S|M|L`
- `dependencias`: `BK-...|-`
- `rf_rnf`: `RFxx|RNFxx|RFxx,RNFyy`
- `fase_documental`: `Fase 1|Fase 2|Fase 3`
- `sprint`: `Sxx|Sxx-Syy`
- `core_or_reforco`: `Core|Reforco`
- `proximo_bk`: `BK-...|-`
- `guia_path`: `docs/planificacao/guias-bk/MF*/BK-MF*-**-slug-semantico.md`
- `last_updated`: `2026-04-14`

## Contexto do BK
- Entrega alvo e requisito.
- Foco tecnico da macro.
- Regra de governanca de metadados.

## Bloco pedagogico
### Objetivo
### Pre-requisitos
### Erros comuns
### Check de compreensao
### Tempo estimado

## Bloco operacional
### Entrada
### Passos
### Cenarios negativos recomendados
### Validacao
### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos
- `P1`: unit/integration + 2 negativos
- `P2`: teste focal + 1 negativo
### Handoff

## Snippet tecnico aplicavel
```ts
// snippet obrigatoriamente ligado a `bk_id` e `rf_rnf`
// deve refletir o dominio (CORE-IA, CORE-COM, CORE-HIBRIDO ou SUPORTE)
```

## Criterios de aceite
- incluir thresholds mensuraveis (latencia, consistencia de estado, cobertura de negativos, etc.)
- `P0`: minimo 3 cenarios negativos concretos
- `P1`: minimo 2 cenarios negativos concretos
- `P2`: minimo 1 cenario negativo concreto
## Evidence para PR/defesa
- `proof_tecnico`: evidencias tecnicas verificaveis
- `proof_negativos`: resultado dos cenarios negativos
- `proof_negocio`: evidencia de impacto no eixo core dual quando `classe_core_dual != SUPORTE`; para `SUPORTE`, usar evidencia operacional.
## Proximo BK recomendado
## Changelog
