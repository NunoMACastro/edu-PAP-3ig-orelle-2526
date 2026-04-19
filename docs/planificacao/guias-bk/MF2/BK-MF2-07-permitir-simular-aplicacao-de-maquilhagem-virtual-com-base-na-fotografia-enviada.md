# BK-MF2-07 - Permitir simular aplicação de maquilhagem virtual com base na fotografia enviada

## Header
- `doc_id`: `GUIA-BK-MF2-07`
- `bk_id`: `BK-MF2-07`
- `macro`: `MF2`
- `owner`: `Daniel Bulica`
- `apoio`: `Aline`
- `prioridade`: `P2`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF1-05`
- `rf_rnf`: `RF23`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-08`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-07-permitir-simular-aplicacao-de-maquilhagem-virtual-com-base-na-fotografia-enviada.md`
- `last_updated`: `2026-04-14`

## Contexto do BK
- Entrega alvo: implementar `Permitir simular aplicação de maquilhagem virtual com base na fotografia enviada` com rastreabilidade direta ao requisito `RF23`.
- Foco tecnico da macro: `Nucleo funcional II`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Executar `Permitir simular aplicação de maquilhagem virtual com base na fotografia enviada` com evidência tecnica objetiva e fecho documental alinhado ao contrato canónico.

### Pre-requisitos
- Rever `RF23` em `docs/RF.md` ou `docs/RNF.md`.
- Validar linha do BK no `BACKLOG-MVP.md` e na `MATRIZ-CANONICA-BK.md`.
- Confirmar dependencias declaradas: `BK-MF1-05`.

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
- BK: `BK-MF2-07`
- Requisito: `RF23`
- Dependencias: `BK-MF1-05`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md`, `PLANO-SPRINTS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF2-07` e do requisito `RF23`.
2. Validar pre-condicoes e dependencias declaradas (BK-MF1-05).
3. Definir contrato de entrada/saida para `Permitir simular aplicação de maquilhagem virtual com base na fotografia enviada`.
4. Implementar ou consolidar o fluxo principal com registo tecnico objetivo.
5. Executar smoke test do caminho principal e validar integracao com BKs adjacentes.
6. Executar cenarios negativos obrigatorios (minimo 1) e registar o resultado.

### Cenarios negativos recomendados
- entrada obrigatoria em falta

### Validacao
- [ ] Smoke: fluxo principal executa sem erro bloqueante.
- [ ] Negativos: minimo `1` cenarios com resultado controlado.
- [ ] Tecnico: metadados alinhados entre guia, backlog, matriz e anexos.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF2-08`
- Registar no handoff estado de dependencias, riscos e decisao tecnica tomada.
- Se houver bloqueio >48h, escalar no scorecard da sprint.

## Snippet tecnico aplicavel
**Snippet orientado ao BK `BK-MF2-07`**

```ts
const BK_ID = 'BK-MF2-07';
const requisito = 'RF23';

export function executarFluxoBK(entrada: object) {
  if (!entrada) throw new Error(`${BK_ID}: entrada obrigatoria`);
  const resultado = { bk: BK_ID, requisito, concluido: true };
  return resultado;
}

export function validarNegativos(negativosExecutados: number) {
  return negativosExecutados >= 2;
}
```


## Criterios de aceite
- Entrega funcional especifica de `Permitir simular aplicação de maquilhagem virtual com base na fotografia enviada` validada contra `RF23`.
- Cenarios negativos concluidos: minimo `1` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P2`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: referencia de commit/PR e resumo da alteracao.
- `proof`: 2-3 evidencias objetivas (output, log, screenshot, teste).
- `neg`: cenarios negativos executados e resultados observados.

## Proximo BK recomendado
`BK-MF2-08`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum (header v2 + blocos pedagogico/operacional + naming semantico).
