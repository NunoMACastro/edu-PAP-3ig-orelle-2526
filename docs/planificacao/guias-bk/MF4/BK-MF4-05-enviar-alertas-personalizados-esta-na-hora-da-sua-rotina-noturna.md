# BK-MF4-05 - Enviar alertas personalizados (“Está na hora da sua rotina noturna”)

## Header
- `doc_id`: `GUIA-BK-MF4-05`
- `bk_id`: `BK-MF4-05`
- `macro`: `MF4`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF2-05`
- `rf_rnf`: `RF37`
- `fase_documental`: `Fase 2`
- `sprint`: `S08-S09`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF4-08`
- `guia_path`: `docs/planificacao/guias-bk/MF4/BK-MF4-05-enviar-alertas-personalizados-esta-na-hora-da-sua-rotina-noturna.md`
- `last_updated`: `2026-04-14`

## Contexto do BK
- Entrega alvo: implementar `Enviar alertas personalizados (“Está na hora da sua rotina noturna”)` com rastreabilidade direta ao requisito `RF37`.
- Foco tecnico da macro: `Capacidades de produto II`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Executar `Enviar alertas personalizados (“Está na hora da sua rotina noturna”)` com evidência tecnica objetiva e fecho documental alinhado ao contrato canónico.

### Pre-requisitos
- Rever `RF37` em `docs/RF.md` ou `docs/RNF.md`.
- Validar linha do BK no `BACKLOG-MVP.md` e na `MATRIZ-CANONICA-BK.md`.
- Confirmar dependencias declaradas: `BK-MF2-05`.

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
- BK: `BK-MF4-05`
- Requisito: `RF37`
- Dependencias: `BK-MF2-05`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md`, `PLANO-SPRINTS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF4-05` e do requisito `RF37`.
2. Validar pre-condicoes e dependencias declaradas (BK-MF2-05).
3. Definir contrato de entrada/saida para `Enviar alertas personalizados (“Está na hora da sua rotina noturna”)`.
4. Implementar ou consolidar o fluxo principal com registo tecnico objetivo.
5. Executar smoke test do caminho principal e validar integracao com BKs adjacentes.
6. Executar cenarios negativos obrigatorios (minimo 2) e registar o resultado.

### Validacao
- [ ] Smoke: fluxo principal executa sem erro bloqueante.
- [ ] Negativos: minimo `2` cenarios com resultado controlado.
- [ ] Tecnico: metadados alinhados entre guia, backlog, matriz e anexos.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Handoff
- Proximo BK recomendado: `BK-MF4-08`
- Registar no handoff estado de dependencias, riscos e decisao tecnica tomada.
- Se houver bloqueio >48h, escalar no scorecard da sprint.

## Snippet tecnico aplicavel
**Snippet orientado ao BK `BK-MF4-05`**

```ts
const BK_ID = 'BK-MF4-05';
const requisito = 'RF37';

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
- BK entregue no scope definido, sem quebrar dependencias.
- Validacao de smoke e negativos concluida com registo verificavel.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: referencia de commit/PR e resumo da alteracao.
- `proof`: 2-3 evidencias objetivas (output, log, screenshot, teste).
- `neg`: cenarios negativos executados e resultados observados.

## Proximo BK recomendado
`BK-MF4-08`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum (header v2 + blocos pedagogico/operacional + naming semantico).
