# BK-MF8-11 - Revisão humana de sessões IA por consultores

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
- `last_updated`: `2026-07-11`

> **Contrato OpenAI-only vigente:** a revisão humana é opcional, pertence a um relatório v2 e acontece antes do congelamento. Não existe uma segunda revisão por recomendação nem uma revisão criada automaticamente. O utilizador pode aceitar a versão IA, pedir revisão ou retirar um pedido ainda pendente. A decisão humana ocupa `humanOverride`; `machineResult` permanece imutável.

#### Objetivo

Permitir que um consultor autorizado aprove, ajuste ou peça esclarecimentos sobre um relatório, com concorrência controlada, validação de catálogo e auditoria append-only. O pagamento simulado permanece desativado enquanto a revisão estiver pendente.

#### Importância

A intervenção humana acrescenta supervisão sem disfarçar a origem do conteúdo. Separar as versões permite demonstrar o que veio da OpenAI, o que foi alterado por uma pessoa e qual versão foi congelada.

#### Scope-in

- Pedir e retirar revisão por relatório.
- Listar e abrir apenas revisões `pending` ou `needs_clarification`.
- Aprovar, ajustar texto/rotina/produtos ou pedir esclarecimento.
- Revalidar produtos, variantes, alergias e stock em qualquer ajuste.
- Usar compare-and-set para uma única decisão concorrente.
- Auditar listagem, detalhe, fotografia e decisão.
- Autorizar fotografia apenas com grant explícito, revogável e temporário.

#### Scope-out

- Não permitir diagnóstico médico.
- Não carregar fotografias por defeito na fila.
- Não expor revisões canceladas pelo ID.
- Não editar o `machineResult`.
- Não bloquear permanentemente o cliente: o pedido pendente pode ser retirado.
- Não desbloquear ou emitir voucher dentro do service de revisão.

#### Estado antes e depois

- Antes: a revisão podia estar acoplada a recomendações individuais e apagar conteúdo automático.
- Depois: existe uma revisão única por versão de relatório, com decisão atómica, override separado e retorno claro à conversa quando falta informação.

#### Pre-requisitos

- Relatório em `draft_ready`.
- Cliente autenticado e dono do relatório.
- Consultor ou administrador autenticado para a fila.
- Replica set local para a decisão transacional.
- Grant fotográfico específico quando as imagens forem necessárias.

#### Glossário

- **CAS:** update condicional que só vence se a revisão ainda estiver pendente.
- **humanOverride:** versão humana validada, sem alterar o resultado automático.
- **needs_clarification:** decisão que reabre a conversa do cliente.
- **Grant:** autorização temporária para consultar frontal ou perfil.
- **Audit append-only:** eventos adicionados sem reescrever o histórico anterior.

#### Conceitos teóricos essenciais

Autorização de role não substitui ownership nem consentimento. O consultor pode trabalhar na fila, mas a fotografia só é servida se o relatório tiver grant ativo. O endpoint responde com `Cache-Control: no-store` e cada leitura cria um audit minimizado.

Uma decisão humana abrange revisão, relatório, recomendações e sessão. Por isso, todos os updates e o audit da decisão pertencem à mesma transação. Um segundo consultor que perca o CAS recebe `409`.

#### Arquitetura do BK

1. O cliente chama `POST /api/face-reports/:reportId/review-request`.
2. Opcionalmente concede fotografia para essa revisão, até sete dias.
3. O consultor usa a fila em `/api/consultant/ai-consultation-reviews`.
4. A decisão passa por validator, revalidação de catálogo e CAS.
5. `needs_clarification` muda o fluxo da sessão e cria nova iteração.
6. `approved` ou `adjusted` devolve o relatório a `draft_ready`.

#### Ficheiros a criar/editar/rever

- REVER: `apps/api/src/services/report-review.service.js`
- REVER: `apps/api/src/services/ai-consultation-review.service.js`
- REVER: `apps/api/src/models/ai-consultation-review.model.js`
- REVER: `apps/api/src/models/ai-consultation-audit-log.model.js`
- REVER: `apps/api/src/routes/face-report.routes.js`
- REVER: `apps/api/src/routes/ai-consultation-review.routes.js`
- REVER: `apps/web/src/features/consultation/ConsultationReportPage.jsx`
- REVER: `apps/web/src/features/consultation/ConsultationReviewsPage.jsx`
- CRIAR/REVER: testes de autorização, transação, CAS, auditoria e UI.

#### Tutorial técnico linear

### Passo 1 - Criar o pedido opcional

O relatório apresenta duas escolhas: continuar com relatório IA ou pedir revisão. O pedido é idempotente. Enquanto estiver pendente, `finalize` e pagamento devolvem conflito. Um `DELETE` permite retirar uma revisão ainda não decidida.

### Passo 2 - Controlar acesso às fotografias

Regista consentimento por relatório, propósito, versão do aviso e expiração. Não devolvas URLs permanentes. O consultor pede cada vista através do endpoint autenticado e o backend valida role, estado, grant e prazo.

### Passo 3 - Construir fila e detalhe minimizados

A listagem não contém bytes, respostas livres nem notas internas desnecessárias. O detalhe só carrega o conteúdo necessário quando o consultor o abre e cria um audit de leitura.

### Passo 4 - Validar ajustes humanos

Aceita apenas campos conhecidos. Qualquer produto ajustado passa pela mesma allowlist de domínio, variantes, alergias, INCI e stock. A rotina ajustada preserva instruções e cautelas obrigatórias.

### Passo 5 - Aplicar decisão com CAS

```js
/**
 * Fecha uma revisão apenas se ainda estiver pendente.
 * @param {string} reviewId
 * @param {string} consultantId
 * @param {object} session
 * @returns {Promise<object>}
 */
export async function closeReviewWithCas({
    reviewId,
    consultantId,
    decision,
    humanOverride,
    session,
}) {
    const review = await AiConsultationReview.findOneAndUpdate(
        {
            _id: reviewId,
            status: { $in: ["pending", "needs_clarification"] },
            humanOverride: null,
        },
        {
            $set: {
                status: decision,
                reviewedBy: consultantId,
                reviewedAt: new Date(),
                humanOverride,
            },
        },
        { new: true, session },
    );
    if (!review) throw new AppError(409, "A revisão já foi decidida");
    return review;
}
```

Na implementação final, o mesmo transaction callback escreve override, estado do relatório, estado da sessão e audit. Uma falha em qualquer passo reverte tudo.

### Passo 6 - Reabrir a conversa quando necessário

`needs_clarification` publica uma pergunta limitada e muda `flowState` para o mesmo estado. O cliente responde em `/consulta/ativa`; a resposta cria nova revisão do relatório e volta a colocar o pedido na fila.

### Passo 7 - Executar cenários negativos obrigatórios (mínimo 3)

1. Dois consultores decidem simultaneamente: um vence e o outro recebe `409`.
2. Um consultor tenta abrir fotografia sem grant ou após expiração: recebe `403`/404 e fica auditado sem bytes.
3. Um ajuste inclui produto fora da allowlist: a transação é revertida.
4. O cliente tenta pagar com revisão pendente: recebe conflito sem voucher.

#### Expected results

- Revisão humana é uma escolha, não um bloqueio obrigatório.
- O resultado automático permanece verificável.
- Fotografias só são lidas com consentimento específico.
- Decisões concorrentes não criam duas versões finais.
- Esclarecimentos regressam à mesma conversa e geram nova revisão.

#### Critérios de aceite

- Pedido e retirada são idempotentes.
- CAS e rollback transacional comprovados.
- Produtos ajustados usam validadores comuns.
- Todas as leituras e decisões relevantes são auditadas.
- Cenarios negativos concluídos: mínimo `3`.
- Evidencia de testes por camada: unitário, integração, segurança e E2E.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P0 | Integração | CAS, rollback e preservação de `machineResult` |
| P0 | Segurança | Role, grant, expiração, revogação e `no-store` |
| P1 | E2E | Pedir, retirar, esclarecer, aprovar e ajustar |

#### Validação final

- [ ] Testes de decisão concorrente verdes em replica set.
- [ ] Listagem, detalhe, fotografia e decisão deixam audit.
- [ ] Revisão cancelada não pode ser aberta por ID.
- [ ] Pagamento bloqueado apenas enquanto o pedido está ativo.
- [ ] Negativos: mínimo `3` cenários.

#### Evidence para PR/defesa

- Transição de estados sem dados pessoais.
- Um teste com `200` e outro `409` para o CAS.
- Prova de rollback quando a recomendação ajustada falha.
- Headers `no-store` e audit da fotografia, sem guardar a imagem na evidence.

#### Handoff

O `BK-MF8-12` recebe uma versão humana aprovada ou ajustada, ou uma sessão em `needs_clarification`, sempre com provenance e auditoria.

## Bloco pedagogico

### Objetivo

Compreender revisão opcional, separação de versões, consentimento por finalidade e concorrência otimista.

### Pre-requisitos

Rever transações, roles, ownership, `findOneAndUpdate` condicional e audit logs.

### Erros comuns

- Dar acesso permanente às fotografias.
- Atualizar `machineResult` com texto humano.
- Decidir fora de transação.
- Tratar um `409` concorrente como erro interno.

### Check de compreensao

1. Por que o consultor não vê fotografias na listagem?
2. O que distingue aprovação de ajuste?
3. Como `needs_clarification` evita criar uma conversa paralela?

## Bloco operacional

### Entrada

Relatório `draft_ready`, pedido opcional e, se necessário, grant fotográfico ativo.

### Passos

Pedir, listar, abrir, validar, decidir, auditar e refletir o estado na sessão.

### Validacao

Executar testes focados de services/routes, integração transacional e E2E por role.

### Handoff

Entregar a versão efetiva ao relatório do cliente, sem UI separada por recomendação.

## Criterios de aceite

- Revisão opcional e removível antes da decisão.
- Decisão única, transacional e auditável.
- Acesso fotográfico explícito, temporário e revogável.
- Cenarios negativos concluidos: minimo `3`.
- Evidencia de testes por camada registada.

## Evidence para PR/defesa

Demonstrar o percurso relatório IA → pedido → decisão humana → versão efetiva, incluindo o conflito concorrente e a revogação de fotografias.

## Snippet tecnico aplicavel

```sh
npm --prefix apps/api test -- ai-consultation-review report-review
npm --prefix apps/web run test:e2e
```

#### Changelog

- `2026-07-11`: revisão migrada para relatório v2 opcional, com CAS, grant fotográfico temporário, audit append-only e `humanOverride` separado.
