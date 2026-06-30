# BK-MF8-09 - Histórico seguro da interação cliente-IA.

## Header
- `doc_id`: `GUIA-BK-MF8-09`
- `bk_id`: `BK-MF8-09`
- `macro`: `MF8`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF8-08, BK-MF6-07`
- `rf_rnf`: `RF47, RNF30`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-10`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-09-historico-seguro-da-interacao-cliente-ia.md`
- `last_updated`: `2026-06-30`

## Contexto do BK
- Entrega alvo: persistir histórico seguro da interação cliente-IA, consultável pelo próprio cliente e preparado para filtros de privacidade.
- Foco tecnico da macro: minimização, ownership, privacidade operacional e rastreabilidade sem exposição de dados sensíveis.
- Regra de governanca: histórico guarda sessão, respostas minimizadas, resumo seguro e estados, nunca fotografias, storage keys, consent IDs ou prompts internos completos.

## Bloco pedagogico
### Objetivo
O aluno deve transformar a sessão guiada num histórico seguro e consultável. O resultado observável é o cliente conseguir ver as suas consultas anteriores, estado e resumo sem exposição de dados internos.

### Pre-requisitos
- Rever `RF47` em `docs/RF.md` e `RNF30` em `docs/RNF.md`.
- Confirmar a sessão guiada de `BK-MF8-08`.
- Confirmar encriptação/privacidade base de `BK-MF6-07`.

### Erros comuns
- Reutilizar o relatório completo da IA como histórico sem minimização.
- Permitir listagem de sessões sem filtrar por `userId`.
- Guardar identificadores internos sensíveis em DTOs de cliente.

### Check de compreensao
- [ ] Sei distinguir histórico seguro de logs técnicos.
- [ ] Sei explicar porque o DTO não expõe fotografias, storage keys, consent IDs ou prompts internos.
- [ ] Sei testar filtros `privacyStatus` e acesso cruzado.

### Tempo estimado
- `Core`: `60-90 min`.
- `Reforco`: `+20-40 min` para BK `P0`.

## Bloco operacional
### Entrada
- BK: `BK-MF8-09`
- Requisito: `RF47, RNF30`
- Dependencias: `BK-MF8-08, BK-MF6-07`
- Endpoints alvo: `GET /api/me/ai-consultations`, `GET /api/me/ai-consultations/:id`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `ANEXO-RF-PARA-BKS.md`, `ANEXO-RNF-PARA-BKS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF8-09` e dos requisitos `RF47, RNF30`.
2. Criar DTO de histórico com `id`, `createdAt`, `status`, `privacyStatus`, resumo seguro e contagem de respostas.
3. Implementar persistência de resumo minimizado a partir da sessão fechada do `BK-MF8-08`.
4. Implementar listagem `GET /api/me/ai-consultations` com filtro por `userId` e `privacyStatus`.
5. Implementar detalhe `GET /api/me/ai-consultations/:id` com ownership obrigatório.
6. Garantir que fotografias, storage keys, consent IDs e prompts internos ficam fora do DTO e dos logs.
7. Criar UI cliente de histórico com estados vazio, loading, erro, filtragem e detalhe.
8. Executar cenarios negativos obrigatorios (minimo 3) e registar o resultado.
9. Validar encriptação/privacidade aplicável e evidence do payload seguro.

### Cenarios negativos recomendados
- cliente tenta abrir histórico de outro utilizador
- pedido com `privacyStatus` inválido é recusado
- DTO auditado contém campo sensível e o teste deve falhar

### Validacao
- [ ] Smoke: cliente vê lista e detalhe das próprias sessões.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Privacidade: DTO seguro e minimizado validado por teste.
- [ ] Evidence: payloads demonstram ausência de campos sensíveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF8-10`
- Entrega histórico seguro e `consultationSessionId` para enriquecer recomendações.

## Snippet tecnico aplicavel
**Contrato de DTO seguro (`BK-MF8-09` / `RF47, RNF30`)**

```js
const BK_ID = 'BK-MF8-09';
const REQUIRED_REQS = ['RF47', 'RNF30'];
const FORBIDDEN_FIELDS = ['photoUrl', 'storageKey', 'consentId', 'internalPrompt'];

export function validarHistoricoSeguro(evidence) {
  const requisitos = Array.isArray(evidence?.requisitos) ? evidence.requisitos : [];
  const payload = evidence?.payload ?? {};
  const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;

  if (evidence?.bkId !== BK_ID || !REQUIRED_REQS.every((req) => requisitos.includes(req))) {
    throw new Error('Historico sem rastreabilidade RF/RNF obrigatoria');
  }

  if (FORBIDDEN_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(payload, field))) {
    throw new Error('DTO de historico expoe campo sensivel');
  }

  if (negativos < 3) {
    throw new Error('Cenarios negativos abaixo do minimo P0');
  }

  return { bkId: BK_ID, estado: 'validado', dominio: 'historico IA minimizado' };
}
```

## Checklist tecnico especifico
- histórico filtrado por `userId`
- `privacyStatus` validado e testado
- payload seguro sem campos sensíveis
- logs sem prompts internos completos

## Criterios de aceite
- Cliente consulta apenas o próprio histórico cliente-IA.
- Histórico persistido é minimizado e compatível com privacidade/encriptação.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Evidence pronta para revisão técnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: referência de commit/PR e resumo técnico.
- `proof_tecnico`: listagem/detalhe e testes de ownership.
- `proof_negativos`: acesso cruzado, filtro inválido e campo sensível bloqueado.
- `proof_privacidade`: payload seguro com ausência explícita de imagens e identificadores internos.

## Proximo BK recomendado
`BK-MF8-10`

## Changelog
- `2026-06-30`: guia criado para histórico seguro cliente-IA.
