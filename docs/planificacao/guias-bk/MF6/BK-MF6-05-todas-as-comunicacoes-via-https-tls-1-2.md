# BK-MF6-05 - Todas as comunicações via HTTPS (TLS 1.2+)

## Header
- `doc_id`: `GUIA-BK-MF6-05`
- `bk_id`: `BK-MF6-05`
- `macro`: `MF6`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF09`
- `fase_documental`: `Fase 3`
- `sprint`: `S10-S11`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF6-06`
- `guia_path`: `docs/planificacao/guias-bk/MF6/BK-MF6-05-todas-as-comunicacoes-via-https-tls-1-2.md`
- `last_updated`: `2026-04-14`

## Contexto do BK
- Entrega alvo: implementar `Todas as comunicações via HTTPS (TLS 1.2+)` com rastreabilidade direta ao requisito `RNF09`.
- Foco tecnico da macro: `Qualidade e robustez`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Executar `Todas as comunicações via HTTPS (TLS 1.2+)` com evidência tecnica objetiva e fecho documental alinhado ao contrato canónico.

### Pre-requisitos
- Rever `RNF09` em `docs/RF.md` ou `docs/RNF.md`.
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
- BK: `BK-MF6-05`
- Requisito: `RNF09`
- Dependencias: `-`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md`, `PLANO-SPRINTS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF6-05` e do requisito `RNF09`.
2. Validar pre-condicoes e dependencias declaradas (-).
3. Definir contrato de entrada/saida para `Todas as comunicações via HTTPS (TLS 1.2+)`.
4. Implementar ou consolidar o fluxo principal com registo tecnico objetivo.
5. Executar smoke test do caminho principal e validar integracao com BKs adjacentes.
6. Executar cenarios negativos obrigatorios (minimo 3) e registar o resultado.
7. Aplicar reforco tecnico associado ao risco dominante (seguranca, performance, dados ou UX).
8. Atualizar evidence (`pr`, `proof`, `neg`) com artefactos verificaveis.

### Cenarios negativos recomendados
- pedido sem contexto obrigatorio (ex.: `userId`, `perfilId` ou `carrinhoId`)
- tentativa com estado de negocio invalido (transicao nao permitida)
- falha de integracao externa (timeout/erro) com fallback controlado

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
- Proximo BK recomendado: `BK-MF6-06`
- Registar no handoff estado de dependencias, riscos e decisao tecnica tomada.
- Se houver bloqueio >48h, escalar no scorecard da sprint.

## Snippet tecnico aplicavel
**Snippet tecnico orientado ao dominio de consultoria inteligente (`BK-MF6-05` / `RNF09`)**

```ts
const BK_ID = 'BK-MF6-05';
const REQ_ID = 'RNF09';

type AnaliseInput = { userId: string; imagemId?: string; perfilId?: string };

export function executar_bk_mf6_05(input: AnaliseInput) {
  if (!input.userId) throw new Error(`${BK_ID}: userId obrigatorio`);
  const startedAt = Date.now();
  const resultado = { bkId: BK_ID, reqId: REQ_ID, status: 'OK', explainability: true };
  const duracaoMs = Date.now() - startedAt;
  if (duracaoMs > 10_000) throw new Error(`${BK_ID}: violacao de latencia p95`);
  return resultado;
}
```

## Criterios de aceite
- Entrega funcional especifica de `Todas as comunicações via HTTPS (TLS 1.2+)` validada contra `RNF09`.
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
`BK-MF6-06`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum (header v2 + blocos pedagogico/operacional + naming semantico).
