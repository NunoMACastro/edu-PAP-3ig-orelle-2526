# BK-MF3-06 - O cliente pode recomprar produtos anteriores com um clique

## Header
- `doc_id`: `GUIA-BK-MF3-06`
- `bk_id`: `BK-MF3-06`
- `macro`: `MF3`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF3-04`
- `rf_rnf`: `RF30`
- `fase_documental`: `Fase 2`
- `sprint`: `S07-S08`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF3-07`
- `guia_path`: `docs/planificacao/guias-bk/MF3/BK-MF3-06-o-cliente-pode-recomprar-produtos-anteriores-com-um-clique.md`
- `last_updated`: `2026-04-14`

## Contexto do BK
- Entrega alvo: implementar `O cliente pode recomprar produtos anteriores com um clique` com rastreabilidade direta ao requisito `RF30`.
- Foco tecnico da macro: `Capacidades de produto I`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Executar `O cliente pode recomprar produtos anteriores com um clique` com evidência tecnica objetiva e fecho documental alinhado ao contrato canónico.

### Pre-requisitos
- Rever `RF30` em `docs/RF.md` ou `docs/RNF.md`.
- Validar linha do BK no `BACKLOG-MVP.md` e na `MATRIZ-CANONICA-BK.md`.
- Confirmar dependencias declaradas: `BK-MF3-04`.

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
- BK: `BK-MF3-06`
- Requisito: `RF30`
- Dependencias: `BK-MF3-04`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md`, `PLANO-SPRINTS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF3-06` e do requisito `RF30`.
2. Validar pre-condicoes e dependencias declaradas (BK-MF3-04).
3. Definir contrato de entrada/saida para `O cliente pode recomprar produtos anteriores com um clique`.
4. Implementar ou consolidar o fluxo principal com registo tecnico objetivo.
5. Executar smoke test do caminho principal e validar integracao com BKs adjacentes.
6. Executar cenarios negativos obrigatorios (minimo 2) e registar o resultado.

### Cenarios negativos recomendados
- entrada obrigatoria em falta com erro validado
- tentativa em estado de negocio invalido com resposta controlada

### Validacao
- [ ] Smoke: fluxo principal executa sem erro bloqueante.
- [ ] Negativos: minimo `2` cenarios com resultado controlado.
- [ ] Tecnico: metadados alinhados entre guia, backlog, matriz e anexos.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF3-07`
- Registar no handoff estado de dependencias, riscos e decisao tecnica tomada.
- Se houver bloqueio >48h, escalar no scorecard da sprint.

## Snippet tecnico aplicavel
**Snippet tecnico orientado ao dominio de monetizacao (`BK-MF3-06` / `RF30`)**

```ts
const BK_ID = 'BK-MF3-06';
const REQ_ID = 'RF30';

type CheckoutInput = { userId: string; carrinhoId: string; valorTotal: number };

export function executar_bk_mf3_06(input: CheckoutInput) {
  if (!input.userId || !input.carrinhoId) throw new Error(`${BK_ID}: contexto de checkout invalido`);
  if (input.valorTotal <= 0) throw new Error(`${BK_ID}: total invalido`);
  return { bkId: BK_ID, reqId: REQ_ID, pagamento: 'PENDENTE', contabilizado: true };
}
```

## Criterios de aceite
- Entrega funcional especifica de `O cliente pode recomprar produtos anteriores com um clique` validada contra `RF30`.
- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: referencia de commit/PR e resumo tecnico da alteracao.
- `proof_tecnico`: 2-3 evidencias objetivas (output, log, screenshot, teste).
- `proof_negativos`: cenarios negativos executados e resultados observados.
- `proof_negocio`: indicador de conversao comercial (checkout/recompra/carrinho).

## Proximo BK recomendado
`BK-MF3-07`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum (header v2 + blocos pedagogico/operacional + naming semantico).
