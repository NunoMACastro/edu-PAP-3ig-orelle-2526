# BK-MF8-01 - Código modular (MVC) com documentação e _docstrings_.

## Header
- `doc_id`: `GUIA-BK-MF8-01`
- `bk_id`: `BK-MF8-01`
- `macro`: `MF8`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF19`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-02`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-01-codigo-modular-mvc-com-documentacao-e-docstrings.md`
- `last_updated`: `2026-06-29`

## Contexto do BK
- Entrega alvo: implementar `Código modular (MVC) com documentação e _docstrings_.` com rastreabilidade direta ao requisito `RNF19`.
- Foco tecnico da macro: `Fecho visual, qualidade, testes finais e estabilizacao`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
O aluno deve consolidar a organização MVC, a documentação técnica e as docstrings dos módulos principais para facilitar manutenção, revisão e defesa.

### Pre-requisitos
- Rever `RNF19` em `docs/RNF.md`.
- Validar linha do BK no `BACKLOG-MVP.md` e na `MATRIZ-CANONICA-BK.md`.
- Confirmar dependencias declaradas: `-`.

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
- BK: `BK-MF8-01`
- Requisito: `RNF19`
- Dependencias: `-`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md`, `PLANO-SPRINTS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF8-01` e do requisito `RNF19`.
2. Validar pre-condicoes e dependencias declaradas (-).
3. Definir contrato de entrada/saida para `Código modular (MVC) com documentação e _docstrings_.`.
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
- Proximo BK recomendado: `BK-MF8-02`
- Registar no handoff estado de dependencias, riscos e decisao tecnica tomada.
- Se houver bloqueio >48h, escalar no scorecard da sprint.

## Snippet tecnico aplicavel
**Snippet tecnico orientado a qualidade/manutencao (`BK-MF8-01` / `RNF19`)**

```js
const BK_ID = 'BK-MF8-01';
const REQ_ID = 'RNF19';
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
    dominio: 'manutencao modular',
  };
}
```

## Checklist tecnico especifico
- models, validators, services, controllers e routes mantêm responsabilidades separadas
- funções públicas relevantes têm docstrings ou comentários técnicos úteis
- a documentação indica onde cada módulo entra no fluxo principal

## Criterios de aceite
- Entrega funcional especifica de `Código modular (MVC) com documentação e _docstrings_.` validada contra `RNF19`.
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
`BK-MF8-02`

## Changelog
- `2026-06-29`: guia MF8 atualizado para a sequencia de fecho visual, QA final e estabilizacao.
