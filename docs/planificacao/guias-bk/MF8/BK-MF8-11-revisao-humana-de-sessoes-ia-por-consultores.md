# BK-MF8-11 - Revisão humana de sessões IA por consultores.

## Header
- `doc_id`: `GUIA-BK-MF8-11`
- `bk_id`: `BK-MF8-11`
- `macro`: `MF8`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF2-06, BK-MF8-09, BK-MF8-10`
- `rf_rnf`: `RF45, RNF31`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-12`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-11-revisao-humana-de-sessoes-ia-por-consultores.md`
- `last_updated`: `2026-06-30`

## Contexto do BK
- Entrega alvo: criar fila/painel de revisão para `consultor`/`administrador`, permitindo aprovar, ajustar ou adicionar insight a sessões IA submetidas.
- Foco tecnico da macro: revisão humana auditável, autorização por role e DTO seguro sem fotografias nem storage interno.
- Regra de governanca: consultores veem resumo, respostas minimizadas, recomendações e motivos; não veem fotos nem relatórios completos.

## Bloco pedagogico
### Objetivo
O aluno deve criar o workflow de revisão humana das sessões IA. O resultado observável é um consultor autenticado conseguir rever uma sessão submetida, registar decisão/insight e deixar a sessão pronta para comunicação ao cliente.

### Pre-requisitos
- Rever `RF45` em `docs/RF.md` e `RNF31` em `docs/RNF.md`.
- Confirmar revisão manual base de `BK-MF2-06`.
- Confirmar histórico seguro `BK-MF8-09` e recomendações enriquecidas `BK-MF8-10`.

### Erros comuns
- Expor fotografias, storage keys, consent IDs ou prompts internos ao consultor.
- Permitir revisão por cliente sem role adequada.
- Não auditar quem reviu, quando reviu e que decisão tomou.

### Check de compreensao
- [ ] Sei explicar o DTO seguro do consultor.
- [ ] Sei distinguir aprovar, ajustar e adicionar insight.
- [ ] Sei testar autorização por role e audit trail.

### Tempo estimado
- `Core`: `60-90 min`.
- `Reforco`: `+20-40 min` para BK `P0`.

## Bloco operacional
### Entrada
- BK: `BK-MF8-11`
- Requisito: `RF45, RNF31`
- Dependencias: `BK-MF2-06, BK-MF8-09, BK-MF8-10`
- Endpoints alvo: `GET /api/consultor/ai-consultations/review-queue`, `GET /api/consultor/ai-consultations/:id/review`, `POST /api/consultor/ai-consultations/:id/review`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `ANEXO-RF-PARA-BKS.md`, `ANEXO-RNF-PARA-BKS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF8-11` e dos requisitos `RF45, RNF31`.
2. Definir estados de revisão: `pending_review`, `approved`, `adjusted`, `needs_attention`.
3. Criar DTO seguro para consultor com resumo, respostas minimizadas, recomendações, motivos e estado.
4. Implementar fila de revisão apenas para role `consultor` ou `administrador`.
5. Implementar detalhe de sessão com autorização, auditoria e ausência de campos sensíveis.
6. Implementar ação de revisão com decisão, insight/correção e recomendações afetadas.
7. Persistir audit trail com `reviewedBy`, `reviewedAt`, decisão e versão do DTO revisto.
8. Construir painel consultor com lista, detalhe, decisão e feedback de sucesso/erro.
9. Executar cenarios negativos obrigatorios (minimo 3) e registar o resultado.
10. Reexecutar testes de role gate, DTO seguro e auditabilidade.

### Cenarios negativos recomendados
- cliente tenta aceder à fila de revisão
- consultor recebe DTO com campo sensível e o teste deve falhar
- revisão sem decisão válida é recusada

### Validacao
- [ ] Smoke: consultor revê sessão e guarda decisão.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Segurança: role gate e audit trail validados.
- [ ] Evidence: DTO seguro e ação de revisão registados.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF8-12`
- Entrega decisão/insight do consultor para ficar visível ao cliente de forma segura.

## Snippet tecnico aplicavel
**Contrato de revisão humana (`BK-MF8-11` / `RF45, RNF31`)**

```js
const BK_ID = 'BK-MF8-11';
const REQUIRED_REQS = ['RF45', 'RNF31'];
const ALLOWED_ROLES = ['consultor', 'administrador'];

export function validarRevisaoHumana(evidence) {
  const requisitos = Array.isArray(evidence?.requisitos) ? evidence.requisitos : [];
  const roles = Array.isArray(evidence?.rolesAutorizadas) ? evidence.rolesAutorizadas : [];
  const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;

  if (evidence?.bkId !== BK_ID || !REQUIRED_REQS.every((req) => requisitos.includes(req))) {
    throw new Error('Revisao humana sem rastreabilidade obrigatoria');
  }

  if (!ALLOWED_ROLES.every((role) => roles.includes(role)) || roles.includes('cliente')) {
    throw new Error('Role gate de consultor invalido');
  }

  if (negativos < 3) {
    throw new Error('Cenarios negativos abaixo do minimo P0');
  }

  return { bkId: BK_ID, estado: 'validado', dominio: 'revisao humana auditavel' };
}
```

## Checklist tecnico especifico
- fila visível apenas a `consultor`/`administrador`
- DTO seguro sem imagens nem storage interno
- decisão de revisão auditada
- painel com loading, vazio, erro e sucesso

## Criterios de aceite
- Consultores autorizados revêem sessões IA submetidas e adicionam insight/correção.
- Acesso é autenticado, autorizado, auditável e limitado a DTO seguro.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Evidence pronta para revisão técnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: referência de commit/PR e resumo técnico.
- `proof_tecnico`: fila, detalhe e submissão de revisão.
- `proof_negativos`: cliente bloqueado, DTO sensível rejeitado e decisão inválida.
- `proof_privacidade`: prova de ausência de fotos, storage keys, consent IDs e prompts internos.

## Proximo BK recomendado
`BK-MF8-12`

## Changelog
- `2026-06-30`: guia criado para revisão humana de sessões IA.
