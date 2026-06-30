# BK-MF8-12 - Insights/correções do consultor visíveis para o cliente.

## Header
- `doc_id`: `GUIA-BK-MF8-12`
- `bk_id`: `BK-MF8-12`
- `macro`: `MF8`
- `owner`: `Bruna`
- `apoio`: `Aline`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF8-11`
- `rf_rnf`: `RF46`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF8-13`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-12-insights-correcoes-do-consultor-visiveis-para-o-cliente.md`
- `last_updated`: `2026-06-30`

## Contexto do BK
- Entrega alvo: mostrar ao cliente o estado da revisão humana, nota do consultor, explicação ajustada e recomendações afetadas.
- Foco tecnico da macro: transparência do acompanhamento humano sem expor dados internos de auditoria ou informação de outros clientes.
- Regra de governanca: notificações podem ser internas/locais; não há envio externo por email neste BK.

## Bloco pedagogico
### Objetivo
O aluno deve fechar o ciclo cliente-consultor: depois da revisão humana, o cliente vê a decisão, a nota e os ajustes aplicáveis. O resultado observável é uma área de sessão/recomendações com estado de revisão e insight visível.

### Pre-requisitos
- Rever `RF46` em `docs/RF.md`.
- Confirmar decisão/insight persistido em `BK-MF8-11`.
- Confirmar ownership cliente da sessão.

### Erros comuns
- Mostrar notas internas ou audit trail técnico ao cliente.
- Mostrar insight de sessão pertencente a outro utilizador.
- Criar dependência em email externo sem contrato documental.

### Check de compreensao
- [ ] Sei explicar que parte da revisão é pública para o cliente.
- [ ] Sei testar estado pendente, aprovado, ajustado e erro.
- [ ] Sei garantir ownership no detalhe da sessão.

### Tempo estimado
- `Core`: `60-90 min`.

## Bloco operacional
### Entrada
- BK: `BK-MF8-12`
- Requisito: `RF46`
- Dependencias: `BK-MF8-11`
- Endpoints alvo: `GET /api/me/ai-consultations/:id/review-summary`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `ANEXO-RF-PARA-BKS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF8-12` e do requisito `RF46`.
2. Definir DTO cliente com estado da revisão, nota pública, explicação ajustada e recomendações afetadas.
3. Implementar endpoint de resumo com autenticação e ownership por `userId`.
4. Atualizar UI cliente para mostrar pendente, revisto, ajustado, vazio e erro.
5. Criar notificação interna/local simples quando a revisão fica disponível.
6. Executar cenarios negativos obrigatorios (minimo 2) e registar o resultado.

### Cenarios negativos recomendados
- cliente tenta ver insight de sessão de outro utilizador
- revisão ainda pendente devolve estado controlado sem nota falsa

### Validacao
- [ ] Smoke: cliente vê insight/correção após revisão.
- [ ] Negativos: minimo `2` cenarios com resultado controlado.
- [ ] Privacidade: DTO cliente não expõe audit trail interno.
- [ ] Evidence: screenshot e payload do resumo de revisão.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF8-13`
- Entrega estado/insight cliente para integrar na interface final cliente/consultor.

## Snippet tecnico aplicavel
**Contrato de insight visível ao cliente (`BK-MF8-12` / `RF46`)**

```js
const BK_ID = 'BK-MF8-12';
const REQ_ID = 'RF46';

export function validarInsightCliente(evidence) {
  const dto = evidence?.dto ?? {};
  const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;

  if (evidence?.bkId !== BK_ID || evidence?.requisito !== REQ_ID) {
    throw new Error('Insight cliente sem rastreabilidade RF46');
  }

  if ('auditTrail' in dto || 'internalNotes' in dto) {
    throw new Error('DTO cliente expoe dados internos de revisao');
  }

  if (negativos < 2) {
    throw new Error('Cenarios negativos abaixo do minimo P1');
  }

  return { bkId: BK_ID, requisito: REQ_ID, estado: 'validado', dominio: 'insight visivel ao cliente' };
}
```

## Checklist tecnico especifico
- DTO público separado do DTO consultor
- ownership por sessão
- estados de revisão claros
- notificação interna/local sem email externo

## Criterios de aceite
- Cliente vê estado da revisão, nota pública do consultor e recomendações afetadas.
- Dados internos de auditoria/revisão não aparecem no DTO cliente.
- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).
- Evidence pronta para revisão técnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: referência de commit/PR e resumo técnico.
- `proof_tecnico`: payload e screenshot do resumo.
- `proof_negativos`: sessão cruzada e revisão pendente.
- `proof_privacidade`: ausência de audit trail e notas internas.

## Proximo BK recomendado
`BK-MF8-13`

## Changelog
- `2026-06-30`: guia criado para insights/correções visíveis ao cliente.
