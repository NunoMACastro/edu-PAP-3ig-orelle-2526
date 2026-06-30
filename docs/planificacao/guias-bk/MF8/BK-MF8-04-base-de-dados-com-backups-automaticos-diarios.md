# BK-MF8-04 - Base de dados com backups automáticos diários.

## Header
- `doc_id`: `GUIA-BK-MF8-04`
- `bk_id`: `BK-MF8-04`
- `macro`: `MF8`
- `owner`: `Daniel Bulica`
- `apoio`: `Aline`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF8-03`
- `rf_rnf`: `RNF21`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF8-05`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-04-base-de-dados-com-backups-automaticos-diarios.md`
- `last_updated`: `2026-06-29`

## Contexto do BK
- Entrega alvo: implementar `Base de dados com backups automáticos diários.` com rastreabilidade direta ao requisito `RNF21`.
- Foco tecnico da macro: `Fecho visual, qualidade, testes finais e estabilizacao`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
O aluno deve documentar e validar um mecanismo de backup diário, mesmo que seja um script/stub controlado para o contexto PAP.

### Pre-requisitos
- Rever `RNF21` em `docs/RNF.md`.
- Validar linha do BK no `BACKLOG-MVP.md` e na `MATRIZ-CANONICA-BK.md`.
- Confirmar dependencias declaradas: `BK-MF8-03`.

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
- BK: `BK-MF8-04`
- Requisito: `RNF21`
- Dependencias: `BK-MF8-03`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md`, `PLANO-SPRINTS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF8-04` e do requisito `RNF21`.
2. Validar pre-condicoes e dependencias declaradas (BK-MF8-03).
3. Definir contrato de entrada/saida para `Base de dados com backups automáticos diários.`.
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
- Proximo BK recomendado: `BK-MF8-05`
- Registar no handoff estado de dependencias, riscos e decisao tecnica tomada.
- Se houver bloqueio >48h, escalar no scorecard da sprint.

## Snippet tecnico aplicavel
**Snippet tecnico orientado a backups/fiabilidade (`BK-MF8-04` / `RNF21`)**

```js
const BK_ID = 'BK-MF8-04';
const REQ_ID = 'RNF21';
const MIN_NEGATIVOS = 2;

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
    dominio: 'fiabilidade dos dados',
  };
}
```

## Checklist tecnico especifico
- existe comando, script ou procedimento claro de backup
- o destino do backup é separado da base principal
- há evidência de execução ou simulação controlada

## Criterios de aceite
- Entrega funcional especifica de `Base de dados com backups automáticos diários.` validada contra `RNF21`.
- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: referencia de commit/PR e resumo tecnico da alteracao.
- `proof_tecnico`: 2-3 evidencias objetivas (output, log, screenshot, teste).
- `proof_negativos`: cenarios negativos executados e resultados observados.
- `proof_negocio`: indicador operacional (incidentes, disponibilidade, conformidade de gate).

## Proximo BK recomendado
`BK-MF8-05`

## Changelog
- `2026-06-29`: guia MF8 atualizado para a sequencia de fecho visual, QA final e estabilizacao.
