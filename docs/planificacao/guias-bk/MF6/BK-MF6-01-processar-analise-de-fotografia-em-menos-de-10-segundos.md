# BK-MF6-01 - Executar operações OpenAI como jobs retomáveis com deadlines configurados

## Header
- `doc_id`: `GUIA-BK-MF6-01`
- `bk_id`: `BK-MF6-01`
- `macro`: `MF6`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF05`
- `fase_documental`: `Fase 3`
- `sprint`: `S10-S11`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-IA`
- `eixo_primario`: `ConsultoriaInteligente`
- `kpi_primario`: `taxa_recomendacao_util`
- `kpi_secundario`: `tempo_analise_p95`
- `proximo_bk`: `BK-MF6-02`
- `guia_path`: `docs/planificacao/guias-bk/MF6/BK-MF6-01-processar-analise-de-fotografia-em-menos-de-10-segundos.md`
- `last_updated`: `2026-07-11`

> **Contrato vigente:** `RNF05` já não exige manter o pedido HTTP aberto até a OpenAI terminar. Análise, pergunta seguinte, relatório e edição de imagem são jobs MongoDB retomáveis. Cada chamada ao provider respeita `AbortSignal` e o deadline da operação: 30 s para pergunta, 60 s para análise, 60 s para relatório e 150 s para imagem. O estado e a evidence atuais estão no [plano vivo OpenAI](../../PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md).

#### Objetivo

Implementar operações OpenAI assíncronas, idempotentes e recuperáveis após reload, duplo clique ou reinício do worker. O pedido HTTP apenas cria ou reutiliza o job; o frontend acompanha o `flowState` da sessão e pode repetir uma etapa conhecida em `failed_retryable`.

#### Importância

Uma operação multimodal pode ultrapassar o tempo aceitável de um pedido HTTP sem estar bloqueada. Jobs duráveis evitam perder progresso, permitem cancelar trabalho tardio e tornam retries auditáveis sem fabricar resultados cosméticos.

#### Scope-in

- Persistir os jobs `analyze_photos`, `select_next_question`, `generate_report` e `generate_makeup_preview`.
- Usar claim atómico, lease opaco, heartbeat, retry e chave de deduplicação.
- Propagar `AbortSignal` ao provider, codecs, storage e persistência.
- Projetar `queued`, `processing`, `completed` ou `failed_retryable` no estado público.
- Medir duração e resultado sem guardar fotografias, prompts, respostas ou PII nas métricas.
- Permitir retoma por `GET /api/ai-consultation/sessions/:sessionId` e retry pela rota canónica.

#### Scope-out

- Não executar análise cosmética dentro do controller HTTP.
- Não criar provider alternativo nem resultado local substitutivo.
- Não guardar chave OpenAI, prompts sensíveis ou conteúdo facial no job.
- Não converter timeout ou ausência de credenciais em sucesso.
- Não alterar pagamento, voucher ou catálogo neste BK.

#### Estado antes e depois

- Antes: uma chamada longa podia prender o pedido e perder o estado após restart.
- Depois: o endpoint enfileira uma operação idempotente, o worker mantém a lease enquanto trabalha e a sessão fica retomável.

#### Pre-requisitos

- `BK-MF1-05`: consentimento v2 e fotografias válidas.
- `BK-MF1-06`: sessão de consulta e provider OpenAI.
- `BK-MF1-07`: relatório v2.
- MongoDB replica set para claims, transações e recuperação.

#### Glossário

- **Job durável:** documento persistido que representa uma operação assíncrona.
- **Lease:** direito temporário e opaco de um worker processar um job.
- **Heartbeat:** renovação periódica da lease durante trabalho válido.
- **Deduplicação:** reutilização do mesmo job lógico em replays.
- **Deadline:** tempo máximo entregue à operação antes de abortar.
- **`failed_retryable`:** falha terminal da tentativa atual que o utilizador pode repetir.

#### Conceitos teóricos essenciais

O timeout deve cancelar o trabalho, não apenas deixar de esperar pela resposta. Quando a lease se perde ou o deadline termina, o `AbortSignal` impede que provider, ficheiros ou persistência façam um commit tardio.

Retries internos do provider pertencem a uma única operação lógica: repetir uma vez o modelo primário e, depois, tentar uma vez o modelo OpenAI de fallback não pode consumir nova quota funcional nem criar outro relatório.

#### Arquitetura do BK

- `apps/api/src/models/ai-job.model.js`: estado, tentativas, lease e referências minimizadas.
- `apps/api/src/services/ai-job.service.js`: enqueue, claim, heartbeat, conclusão, falha e retry.
- `apps/api/src/services/ai-consultation.service.js`: análise, perguntas e projeção de `flowState`.
- `apps/api/src/services/report-ai-job-handlers.service.js`: relatório e imagem.
- `apps/api/src/providers/openai-responses.provider.js`: deadlines, retry e fallback OpenAI.
- `apps/api/src/routes/ai-consultation.routes.js`: criação, leitura, resposta, submit e retry.
- `apps/web/src/features/consultation/ActiveConsultationPage.jsx`: polling progressivo e retoma.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/models/ai-job.model.js`
- EDITAR: `apps/api/src/services/ai-job.service.js`
- EDITAR: `apps/api/src/services/ai-consultation.service.js`
- EDITAR: `apps/api/src/services/report-ai-job-handlers.service.js`
- REVER: `apps/api/src/providers/openai-responses.provider.js`
- REVER: `apps/api/src/routes/ai-consultation.routes.js`
- EDITAR: `apps/web/src/features/consultation/ActiveConsultationPage.jsx`
- CRIAR/EDITAR: testes unitários, replica-set e frontend de retoma.

#### Tutorial técnico linear

### Passo 1 - Fixar tipos, estados e deadlines

Centraliza os quatro tipos de job e os estados públicos. Configura 30/60/60/150 s por operação e valida limites no arranque. A ausência de `OPENAI_API_KEY` deve manter a aplicação disponível, mas recusar novos jobs OpenAI com erro sanitizado.

### Passo 2 - Modelar um job minimizado

Guarda `type`, `userId`, `consultationSessionId`, `resourceType`, `resourceId`, `deduplicationKey`, tentativas, `availableAt` e lease. Não copies fotografias, transcript, prompt ou payload OpenAI para o documento.

### Passo 3 - Enfileirar de forma idempotente

O service deve fazer upsert pela chave de deduplicação e reler o vencedor perante `11000`. Assim, dois cliques produzem um job lógico.

```js
/**
 * Cria ou reutiliza o job de análise da revisão atual da sessão.
 *
 * @param {{userId: string, sessionId: string, revision: number}} input - Referências internas validadas.
 * @returns {Promise<object>} Job persistido e seguro para projeção pública.
 */
export async function enqueueAnalysisJob({ userId, sessionId, revision }) {
    return enqueueAiJob({
        type: "analyze_photos",
        userId,
        consultationSessionId: sessionId,
        deduplicationKey: `analysis:${sessionId}:${revision}`,
    });
}
```

### Passo 4 - Processar com claim, lease e heartbeat

O worker reclama atomicamente um job elegível, renova a lease enquanto o handler corre e entrega-lhe um `AbortSignal`. Só o worker que conserva o token da lease pode concluir ou falhar o documento.

### Passo 5 - Aplicar retry e fallback exclusivamente OpenAI

Numa falha transitória, respeita `Retry-After` até 30 s, repete uma vez o modelo primário e tenta uma vez o fallback OpenAI. Se todas as tentativas falharem, persiste `failed_retryable`; análise, relatório e imagem nunca recebem conteúdo inventado.

### Passo 6 - Projetar `flowState` e retoma

As rotas `POST /api/ai-consultation/sessions/:sessionId/analysis`, `POST .../submit` e `POST .../retry` criam ou reutilizam trabalho. `GET /api/ai-consultation/sessions/:sessionId` devolve transcript minimizado, pergunta ativa e operação pública. O frontend inicia polling em 2 s e aumenta até 10 s.

### Passo 7 - Registar métricas minimizadas

Mede tipo lógico, duração, resultado, tentativa e modelo efetivo quando aplicável. Aplica TTL e sampling; nunca registes chave, fotografia, resposta, prompt, cookie, email ou URI MongoDB.

### Passo 8 - Executar cenários negativos obrigatórios (mínimo 3)

1. Perder a lease durante a chamada e provar abort sem commit tardio.
2. Repetir análise/submit em concorrência e provar um único job/recurso.
3. Fazer o provider exceder o deadline e confirmar `failed_retryable` sem resultado cosmético.
4. Reiniciar o worker com lease expirada e confirmar recuperação limitada.
5. Arrancar sem chave e provar que catálogo, conta e loja continuam disponíveis.

#### Expected results

- Controllers respondem rapidamente com a operação atual.
- Jobs sobrevivem a reload e restart.
- Lease perdida ou timeout cancela trabalho cooperativamente.
- Replays reutilizam o mesmo job e o mesmo recurso final.
- Falha OpenAI total não produz análise, relatório ou imagem local.
- Métricas permanecem minimizadas.

#### Critérios de aceite

- Quatro tipos de job persistidos com deduplicação.
- Deadlines 30/60/60/150 s aplicados através de `AbortSignal`.
- Claim, lease, heartbeat, retry e recuperação testados.
- `failed_retryable` permite retomar apenas a etapa conhecida.
- Cenarios negativos concluídos: mínimo `3`.
- Evidencia de testes por camada: unit, integration replica-set, frontend e E2E.

### Matriz mínima de testes por prioridade

| Prioridade | Camada | Prova mínima |
|---|---|---|
| P0 | Unit | deduplicação, deadlines, retry/fallback e DTO público |
| P0 | Integration | claim concorrente, heartbeat, lease expirada e rollback |
| P0 | E2E | reload, polling, retry e conclusão do relatório |
| P0 | Negativos | pelo menos três cenários materiais |

#### Validação final

- [ ] `POST .../analysis` não espera pela OpenAI.
- [ ] Duplo clique não cria jobs duplicados.
- [ ] Restart recupera lease expirada sem duplicar o recurso.
- [ ] Timeout aborta provider/storage/persistência.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Logs e métricas não contêm dados sensíveis.

#### Evidence para PR/defesa

Regista comando, CWD, exit code, contagem de testes e resumo sanitizado. Inclui timeline de um job recuperado e prova de que a falha total termina em `failed_retryable`.

#### Handoff

O `BK-MF6-02` mede a experiência das rotas e estados assíncronos sem voltar a montar páginas antigas ou cronometrar o frame seguinte ao mount.

## Bloco pedagogico

### Objetivo

Compreender por que um job durável é mais robusto do que um pedido HTTP longo.

### Pre-requisitos

Rever async/await, MongoDB atomic updates, `AbortController`, idempotência e polling.

### Erros comuns

- Renovar a lease sem confirmar o token do worker.
- Fazer retry como uma nova operação funcional.
- Guardar o payload OpenAI no job.
- Mostrar percentagens de progresso que o backend não conhece.

### Check de compreensao

1. O que impede dois workers de concluir o mesmo job?
2. Por que o timeout precisa de `AbortSignal`?
3. Quando é permitido usar a pergunta canónica local?

## Bloco operacional

### Entrada

Sessão própria, consentimento v2 e fotografias tecnicamente aceites.

### Passos

Enfileirar, reclamar, renovar lease, executar, validar, persistir e projetar o estado.

### Validacao

```bash
npm --prefix apps/api test -- tests/ai-job-v2.test.js tests/ai-job-recovery.replset.integration.test.js
npm --prefix apps/api test -- tests/openai-consultation-core-v2.test.js
npm --prefix apps/web run test:unit
```

### Handoff

Entregar contratos públicos, testes de concorrência e evidence sanitizada ao `BK-MF6-02`.

## Criterios de aceite

- Jobs retomáveis substituem pedidos longos.
- Fallback significa outro modelo OpenAI, não resultado sintético.
- Cenarios negativos concluidos: minimo `3`.
- Evidencia de testes por camada registada.

## Evidence para PR/defesa

Apresentar o mesmo job antes/depois de reload e restart, sem expor IDs internos ou conteúdo sensível.

## Snippet tecnico aplicavel

```js
const BK_ID = "BK-MF6-01";
const MIN_NEGATIVOS = 3;

/** Valida a evidence mínima antes do handoff pedagógico. */
export function validarEvidenceBkMf601(evidence) {
    const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;
    if (evidence?.bkId !== BK_ID || negativos < MIN_NEGATIVOS) {
        throw new Error("Evidence incompleta para BK-MF6-01");
    }
    return true;
}
```

## Changelog

- `2026-07-11`: guia reescrito para jobs OpenAI retomáveis, deadlines por operação, lease/heartbeat, retoma e rotas canónicas.
- `2026-07-10`: instruções síncronas e metadata do contrato anterior foram supersedidas; permanecem apenas no histórico de auditoria.
