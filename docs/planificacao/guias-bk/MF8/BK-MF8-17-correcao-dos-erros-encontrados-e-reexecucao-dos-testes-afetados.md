# BK-MF8-17 - Correção dos erros encontrados e reexecução dos testes afetados.

## Header
- `doc_id`: `GUIA-BK-MF8-17`
- `bk_id`: `BK-MF8-17`
- `macro`: `MF8`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF8-16`
- `rf_rnf`: `RNF29`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `-`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-17-correcao-dos-erros-encontrados-e-reexecucao-dos-testes-afetados.md`
- `last_updated`: `2026-06-30`

## Contexto do BK
- Entrega alvo: implementar `Correção dos erros encontrados e reexecução dos testes afetados.` com rastreabilidade direta ao requisito `RNF29`.
- Foco tecnico da macro: `Fecho visual, qualidade, testes finais e estabilizacao`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
O aluno deve corrigir os erros encontrados na execução final e reexecutar os testes afetados para provar que a estabilização ficou validada.

### Pre-requisitos
- Rever `RNF29` em `docs/RNF.md`.
- Validar linha do BK no `BACKLOG-MVP.md` e na `MATRIZ-CANONICA-BK.md`.
- Confirmar dependencias declaradas: `BK-MF8-16`.

### Erros comuns
- Fechar o BK sem negativos minimos por prioridade.
- Atualizar o guia sem alinhar metadados no backlog/matriz.
- Registar evidence sem provas objetivas (log, output, screenshot ou teste).

### Check de compreensao
- [ ] Sei explicar o objetivo do BK em menos de 30 segundos.
- [ ] Sei quais sao entradas, saidas e criterio de sucesso.
- [ ] Sei justificar o handoff e o risco principal do BK.

### Tempo estimado
- `Core`: `60-90 min`.
- `Reforco`: `+20-40 min` para BK `P0`.

## Bloco operacional
### Entrada
- BK: `BK-MF8-17`
- Requisito: `RNF29`
- Dependencias: `BK-MF8-16`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md`, `PLANO-SPRINTS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF8-17` e do requisito `RNF29`.
2. Validar pre-condicoes e dependencias declaradas (BK-MF8-16).
3. Definir contrato de entrada/saida para `Correção dos erros encontrados e reexecução dos testes afetados.`.
4. Implementar ou consolidar o fluxo principal com registo tecnico objetivo.
5. Executar smoke test do caminho principal e validar integracao com BKs adjacentes.
6. Executar cenarios negativos obrigatorios (minimo 3) e registar o resultado.
7. Aplicar reforco tecnico associado ao risco dominante (seguranca, performance, dados, UX ou QA).
8. Reexecutar validacao afetada e guardar evidence final para defesa/PR.

### Cenarios negativos recomendados
- entrada obrigatoria em falta com erro validado
- tentativa em estado de negocio invalido com resposta controlada
- falha de integracao/configuracao com fallback ou bloqueio seguro

### Validacao
- [ ] Smoke: fluxo principal executa sem erro bloqueante.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: metadados alinhados entre guia, backlog, matriz e anexos.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `-`
- Registar no handoff estado de dependencias, riscos e decisao tecnica tomada.
- Se houver bloqueio >48h, escalar no scorecard da sprint.

## Snippet tecnico aplicavel
**Snippet tecnico orientado a qa/correcao (`BK-MF8-17` / `RNF29`)**

```js
const BK_ID = 'BK-MF8-17';
const REQ_ID = 'RNF29';
const MIN_NEGATIVOS = 3;

export function validarFechoMf8(evidence) {
  if (!evidence || evidence.bkId !== BK_ID || evidence.requisito !== REQ_ID) {
    throw new Error('Evidence fora do contrato do BK');
  }

  if (!Array.isArray(evidence.provas) || evidence.provas.length < 2) {
    throw new Error('Evidence tecnica insuficiente para defesa');
  }

  if (!Array.isArray(evidence.negativos) || evidence.negativos.length < MIN_NEGATIVOS) {
    throw new Error('Cenarios negativos abaixo do minimo exigido');
  }

  return {
    bkId: BK_ID,
    requisito: REQ_ID,
    estado: 'validado',
    dominio: 'estabilização final',
  };
}
```

## Checklist tecnico especifico
- cada erro corrigido tem causa provável, alteração e evidência
- testes afetados são reexecutados depois da correção
- o estado final distingue corrigido, aceite com ressalva e bloqueado

## Criterios de aceite
- Entrega funcional especifica de `Correção dos erros encontrados e reexecução dos testes afetados.` validada contra `RNF29`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: referencia de commit/PR e resumo tecnico da alteracao.
- `proof_tecnico`: 2-3 evidencias objetivas (output, log, screenshot, teste).
- `proof_negativos`: cenarios negativos executados e resultados observados.
- `proof_negocio`: indicador operacional (incidentes, disponibilidade, conformidade de gate).

## Proximo BK recomendado
`-`

## Changelog
- `2026-06-30`: guia renumerado para `BK-MF8-17`, mantendo-o como terminal da MF8.
- `2026-06-29`: guia MF8 atualizado para a sequencia de fecho visual, QA final e estabilizacao.
