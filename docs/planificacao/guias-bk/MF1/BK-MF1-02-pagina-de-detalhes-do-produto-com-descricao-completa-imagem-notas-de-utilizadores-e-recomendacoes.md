# BK-MF1-02 - Página de detalhes do produto com descrição completa, imagem, notas de utilizadores e recomendações

## Header
- `doc_id`: `GUIA-BK-MF1-02`
- `bk_id`: `BK-MF1-02`
- `macro`: `MF1`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF0-07`
- `rf_rnf`: `RF10`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF1-03`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-02-pagina-de-detalhes-do-produto-com-descricao-completa-imagem-notas-de-utilizadores-e-recomendacoes.md`
- `last_updated`: `2026-04-14`

## Contexto do BK
- Entrega alvo: implementar `Página de detalhes do produto com descrição completa, imagem, notas de utilizadores e recomendações` com rastreabilidade direta ao requisito `RF10`.
- Foco tecnico da macro: `Nucleo funcional I`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Executar `Página de detalhes do produto com descrição completa, imagem, notas de utilizadores e recomendações` com evidência tecnica objetiva e fecho documental alinhado ao contrato canónico.

### Pre-requisitos
- Rever `RF10` em `docs/RF.md` ou `docs/RNF.md`.
- Validar linha do BK no `BACKLOG-MVP.md` e na `MATRIZ-CANONICA-BK.md`.
- Confirmar dependencias declaradas: `BK-MF0-07`.

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
- BK: `BK-MF1-02`
- Requisito: `RF10`
- Dependencias: `BK-MF0-07`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md`, `PLANO-SPRINTS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF1-02` e do requisito `RF10`.
2. Validar pre-condicoes e dependencias declaradas (BK-MF0-07).
3. Definir contrato de entrada/saida para `Página de detalhes do produto com descrição completa, imagem, notas de utilizadores e recomendações`.
4. Implementar ou consolidar o fluxo principal com registo tecnico objetivo.
5. Executar smoke test do caminho principal e validar integracao com BKs adjacentes.
6. Executar cenarios negativos obrigatorios (minimo 3) e registar o resultado.
7. Aplicar reforco tecnico associado ao risco dominante (seguranca, performance, dados ou UX).
8. Atualizar evidence (`pr`, `proof`, `neg`) com artefactos verificaveis.

### Validacao
- [ ] Smoke: fluxo principal executa sem erro bloqueante.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: metadados alinhados entre guia, backlog, matriz e anexos.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Handoff
- Proximo BK recomendado: `BK-MF1-03`
- Registar no handoff estado de dependencias, riscos e decisao tecnica tomada.
- Se houver bloqueio >48h, escalar no scorecard da sprint.

## Snippet tecnico aplicavel
**Snippet orientado ao BK `BK-MF1-02`**

```ts
const BK_ID = 'BK-MF1-02';
const requisito = 'RF10';

export function executarFluxoBK(entrada: object) {
  if (!entrada) throw new Error(`${BK_ID}: entrada obrigatoria`);
  const resultado = { bk: BK_ID, requisito, concluido: true };
  return resultado;
}

export function validarNegativos(negativosExecutados: number) {
  return negativosExecutados >= 3;
}
```


## Criterios de aceite
- BK entregue no scope definido, sem quebrar dependencias.
- Validacao de smoke e negativos concluida com registo verificavel.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: referencia de commit/PR e resumo da alteracao.
- `proof`: 2-3 evidencias objetivas (output, log, screenshot, teste).
- `neg`: cenarios negativos executados e resultados observados.

## Proximo BK recomendado
`BK-MF1-03`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum (header v2 + blocos pedagogico/operacional + naming semantico).
