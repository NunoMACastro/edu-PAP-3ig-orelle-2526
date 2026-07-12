# BK-MF8-08 - Consulta OpenAI dinâmica de 5–8 perguntas

## Header
- `doc_id`: `GUIA-BK-MF8-08`
- `bk_id`: `BK-MF8-08`
- `macro`: `MF8`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF1-06, BK-MF1-07, BK-MF7-01`
- `rf_rnf`: `RF42`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-09`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-08-sessao-guiada-de-avaliacao-cosmetica-com-ia.md`
- `last_updated`: `2026-07-11`

#### Objetivo

Construir a consulta conversacional controlada da Orélle: o cliente escolhe um objetivo principal e até dois secundários, dá consentimento, envia frontal + perfil, passa o quality gate e responde a 5–8 perguntas escolhidas dinamicamente pela OpenAI.

A conversa não é um chat livre nem um formulário fixo. O backend define os factos mínimos por objetivo; a OpenAI só escolhe um `slotCode` permitido e um tipo de resposta fechado. Cada resposta fica persistida antes de preparar a pergunta seguinte, permitindo reload, retry e recuperação após restart.

#### Importância

As fotografias sozinhas não revelam orçamento, rotina, alergias, preferências ou objetivo. Uma consulta limitada junta esse contexto sem entregar à IA controlo sobre autorização, catálogo, preços ou decisões médicas.

#### Scope-in

- Sete objetivos canónicos, um principal e até dois secundários.
- Consentimento v2 e par frontal/perfil com qualidade controlada.
- Sessão própria, única aberta por utilizador, snapshot versionado e `flowState` autoritativo.
- Análise OpenAI assíncrona e qualidade `pass|warning|inconclusive`.
- 5–8 perguntas dinâmicas com tipos/slots/opções fechados.
- Persistência cifrada de pergunta, resposta e factos derivados.
- Compare-and-set para respostas concorrentes.
- Jobs/retry/recovery e frontend retomável sem estado duplicado.

#### Scope-out

- Não criar chat livre, agent autónomo ou prompt editável.
- Não aceitar IDs técnicos de análise/report no browser.
- Não gerar relatório falso quando a OpenAI falha.
- Não diagnosticar doença; sinais potencialmente clínicos produzem cautela.
- Não selecionar produtos neste BK; o submit prepara o job do relatório.

#### Estado antes e depois

- Antes: fotografias e perguntas podem existir em fluxos separados ou fixos.
- Depois: `/consulta/nova` e `/consulta/ativa` seguem o `flowState` persistido e retomam a mesma operação/sessão.

#### Pre-requisitos

- `BK-MF7-01`: consentimento v2.
- `BK-MF7-07`: OpenAI-only/jobs/degraded mode.
- `BK-MF8-07`: minimização de dados.
- Upload seguro, sessão opaca, CSRF e MongoDB replica set.

#### Glossário

- Goal definition: regras/factos mínimos de um objetivo.
- Slot: facto canónico que ainda falta, como orçamento ou rotina atual.
- Turn: pergunta + resposta + revision/provenance.
- CAS: resposta validada contra a revisão/pergunta pública e atualização condicionada ao `__v` relido da sessão.
- `flowState`: estado do backend que conduz a UI.
- `inconclusive`: qualidade que obriga novo par e não cria findings.

#### Conceitos teóricos essenciais

A IA escolhe a próxima pergunta, mas não inventa o universo de perguntas. O backend entrega slots permitidos e valida tipo/opções/limites. Depois de cinco respostas, a sessão pode terminar se todos os factos obrigatórios estiverem completos; ao atingir oito, termina e regista o que falta como limitação.

#### Arquitetura do BK

- Goals: `GET /api/ai-consultation/goals`.
- Sessão: `POST /api/ai-consultation/sessions`, `GET .../current`, `GET|DELETE .../:sessionId`.
- Operações: `POST .../:sessionId/analysis|answers|submit|retry`.
- Model: `apps/api/src/models/ai-consultation-session.model.js`.
- Jobs: `AiJob` para análise, pergunta seguinte e relatório.
- Frontend: `/consulta`, `/consulta/nova`, `/consulta/ativa`.
- Testes: sete objetivos, 5–8, CAS, injection, reload, jobs e qualidade.

#### Ficheiros a criar/editar/rever

- CRIAR/EDITAR: `apps/api/src/constants/ai-consultation-goals.js`
- CRIAR/EDITAR: `apps/api/src/models/ai-consultation-session.model.js`
- CRIAR/EDITAR: `apps/api/src/validators/ai-consultation.validator.js`
- CRIAR/EDITAR: `apps/api/src/services/ai-consultation.service.js`
- CRIAR/EDITAR: `apps/api/src/controllers/ai-consultation.controller.js`
- CRIAR/EDITAR: `apps/api/src/routes/ai-consultation.routes.js`
- CRIAR/EDITAR: `apps/web/src/features/consultation/NewConsultationPage.jsx`
- CRIAR/EDITAR: `apps/web/src/features/consultation/ActiveConsultationPage.jsx`
- CRIAR/EDITAR: `apps/api/tests/mf8.ai-consultation.test.js`

#### Tutorial técnico linear

### Passo 1 - Definir os sete objetivos

1. Objetivo: criar definições versionadas e não texto livre.
2. Ficheiro: `apps/api/src/constants/ai-consultation-goals.js`.
3. Código:

```js
/** Códigos estáveis; as definições completas mantêm slots e regras. */
export const AI_CONSULTATION_GOAL_CODES = Object.freeze({
    ACNE: "acne_imperfections",
    HYDRATION: "hydration_barrier",
    OIL_CONTROL: "oil_control",
    SENSITIVITY: "sensitivity_redness",
    TONE: "spots_tone_luminosity",
    SUN_PROTECTION: "sun_protection",
    MAKEUP: "makeup",
});
export const AI_CONSULTATION_MIN_QUESTIONS = 5;
export const AI_CONSULTATION_MAX_QUESTIONS = 8;

// Cada item real inclui code, label, description, supportsMakeupPreview e slots.
export const AI_CONSULTATION_GOALS = Object.freeze(
    definitions.map(freezeDefinition),
);

export function getAiConsultationGoal(code) {
    return AI_CONSULTATION_GOALS.find((goal) => goal.code === code) ?? null;
}
```

Explicação do código: cada definição acrescenta slots específicos; orçamento, rotina, alergias/restrições e preferências são factos comuns.

Validação: `GET /api/ai-consultation/goals` devolve labels e regras seguras.

Cenário negativo: objetivo desconhecido ou mais de dois secundários devolve `422`.

### Passo 2 - Modelar a sessão e o snapshot

1. Objetivo: persistir progresso, versões e referências ao par exato.
2. Ficheiro: model da sessão.
3. Campos principais: `userId`, `schemaVersion`, `scriptVersion`, `goalSelection` cifrado, `photoIds`, `analysisId`, `facts` cifrados, `conversation` cifrada com `turns/currentQuestion`, `revision`, `logicalOperations`, `flowState`, `currentJobId`, `isOpen` e timestamps.

```js
const consultationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    schemaVersion: { type: Number, required: true, default: 2 },
    scriptVersion: {
        type: String,
        required: true,
        default: AI_CONSULTATION_GOALS_VERSION,
    },
    goalSelection: contextualEncryptedField({
        collection: "aiconsultationsessions",
        field: "goalSelection",
        required: true,
    }),
    conversation: contextualEncryptedField({
        collection: "aiconsultationsessions",
        field: "conversation",
        defaultValue: () => ({ turns: [], currentQuestion: null }),
    }),
    flowState: { type: String, required: true, default: "collecting_photos" },
    revision: { type: Number, required: true, default: 0 },
    logicalOperations: { type: Number, required: true, default: 0 },
    isOpen: { type: Boolean, required: true, default: true },
    currentJobId: { type: Schema.Types.ObjectId, default: null },
}, { timestamps: true });
```

Explicação do código: os campos sensíveis usam AES-GCM contextual/AAD em services/getters, não plaintext. Índice parcial garante uma única sessão aberta.

Validação: reload devolve o mesmo transcript/flowState do titular.

Cenário negativo: outro utilizador não lê nem altera a sessão.

### Passo 3 - Criar sessão com objetivos válidos

1. Objetivo: iniciar/reutilizar uma sessão própria sem corrida.
2. Endpoint: `POST /api/ai-consultation/sessions`.
3. Regra: uma principal, secundárias distintas e no máximo duas; máximo três novas consultas/24h; uma aberta por utilizador.

```js
/** Normaliza objetivos antes de os cifrar no snapshot. */
export function validateGoalSelection({ primaryGoal, secondaryGoals = [] }) {
    if (!getAiConsultationGoal(primaryGoal)) {
        throw new AppError(400, "Objetivo principal inválido");
    }
    if (
        secondaryGoals.length > 2 ||
        secondaryGoals.some((code) => !getAiConsultationGoal(code)) ||
        new Set([primaryGoal, ...secondaryGoals]).size !== secondaryGoals.length + 1
    ) {
        throw new AppError(400, "Objetivos secundários inválidos");
    }
    return { primaryGoal, secondaryGoals };
}
```

Explicação do código: `userId` vem da sessão autenticada. Uma corrida `E11000` deve reler e devolver a sessão aberta existente.

Validação: 25 pedidos concorrentes criam uma sessão lógica.

Cenário negativo: quota diária excedida devolve `429` sem apagar a sessão atual.

### Passo 4 - Iniciar análise por job

1. Objetivo: revalidar consentimento, fotos e qualidade antes da OpenAI.
2. Endpoint: `POST /api/ai-consultation/sessions/:sessionId/analysis`.
3. Fluxo: ownership → consentimento atual → par frontal/perfil → hard gates → warning acknowledgement → job idempotente.

```js
const job = await enqueueAiJob({
    type: "analyze_photos",
    ownerId: userId,
    resourceId: session._id,
    deduplicationKey: `analyze:${session.id}:${photoFingerprint}`,
});
```

Explicação do código: o job guarda referências/fingerprint, não os bytes. `inconclusive` pede novo par; warning remoto exige confirmação antes da primeira pergunta.

Validação: duplo clique devolve o mesmo job.

Cenário negativo: hard failure ou consentimento revogado produz zero chamadas OpenAI.

### Passo 5 - Escolher a próxima pergunta

1. Objetivo: permitir decisão dinâmica dentro de slots fechados.
2. Job: `select_next_question`.
3. Input: objetivos, factos presentes, slots candidatos e transcript minimizado. Output: `slotCode`, tipo permitido, texto curto/opções e provenance.

```js
const ALLOWED_QUESTION_TYPES = new Set([
    "single_select", "multi_select", "scale", "number", "short_text",
]);
export function assertAllowedQuestion(question, candidateSlots) {
    if (!candidateSlots.includes(question.slotCode)) throw new AppError(502, "INVALID_AI_SLOT");
    if (!ALLOWED_QUESTION_TYPES.has(question.type)) throw new AppError(502, "INVALID_AI_QUESTION_TYPE");
    return question;
}
```

Explicação do código: se primário/retry/fallback OpenAI falharem, apenas esta operação pode escolher uma pergunta canónica do mesmo slot. Não cria análise cosmética.

Validação: a pergunta respeita objetivo, opções e revision.

Cenário negativo: slot inventado ou texto excessivo percorre retry/fallback e não é persistido.

### Passo 6 - Guardar resposta com CAS

1. Objetivo: uma resposta aceite para a pergunta/revisão ativa e para uma única versão concorrente da sessão.
2. Endpoint: `POST /api/ai-consultation/sessions/:sessionId/answers`.
3. Valida tipo, opção, escala/número, limite de texto e prompt injection; cifra resposta/facto antes de persistir.

```js
const updated = await AiConsultationSession.updateOne(
    { _id: session._id, userId, __v: session.__v, isOpen: true },
    {
        $set: {
            facts,
            conversation: {
                ...conversation,
                turns,
                currentQuestion: null,
                missingSlotCodes,
            },
            revision: session.revision + 1,
            currentJobId: queued?._id ?? null,
        },
        $inc: { logicalOperations: queued ? 1 : 0, __v: 1 },
    },
    { session: mongoSession },
);
if (updated.modifiedCount !== 1) {
    throw new AppError(409, "A consulta mudou noutro pedido");
}
```

Explicação do código: persistir acontece antes de enfileirar a pergunta seguinte na mesma transação/outbox idempotente.

Validação: 25 respostas concorrentes aceitam uma e mantêm uma revisão.

Cenário negativo: resposta repetida/fora das opções recebe `409`/`422` sem alterar transcript.

### Passo 7 - Decidir completude entre 5 e 8

1. Objetivo: terminar quando há dados suficientes, sem alongar a conversa.
2. Ficheiro: service da consulta.
3. Regra:

```js
export function shouldFinish({ answerCount, requiredFactsComplete }) {
    if (answerCount >= AI_CONSULTATION_MAX_QUESTIONS) return true;
    return answerCount >= AI_CONSULTATION_MIN_QUESTIONS && requiredFactsComplete;
}
```

Explicação do código: aos oito, factos em falta tornam-se limitações do relatório; antes de cinco nunca termina.

Validação: cenários para todos os objetivos e combinações 1+2.

Cenário negativo: submit aos quatro turnos devolve `409 CONSULTATION_INCOMPLETE`.

### Passo 8 - Submeter, repetir e cancelar

1. Objetivo: criar/reutilizar o job `generate_report` e projetar falhas na sessão.
2. Endpoints: `submit`, `retry` e `DELETE`.
3. Submissão usa transação para transitar `ready_for_report → generating_report`; retry só repete a etapa conhecida `failed_retryable`; DELETE cancela apenas sessão aberta própria.

```js
// O controller valida o ID e delega no único service transacional.
const session = await submitAiConsultationSession(req.user.id, sessionId);
return res.status(202).json({ session });
```

Explicação do código: `submitAiConsultationSession` trata replay, valida `ready_for_report`, enfileira `generate_report` na transação, faz CAS por `__v` e incrementa `logicalOperations`. Lease expirada recupera; falha terminal/retryable aparece no DTO para evitar polling infinito.

Validação: restart entre job/transition não deixa job órfão.

Cenário negativo: retry de uma etapa desconhecida ou sessão fechada devolve `409`.

### Passo 9 - Construir a conversa React retomável

1. Objetivo: renderizar um log acessível e um único formulário ativo.
2. Ficheiros: páginas de nova/ativa e adapter API.
3. Regras: `flowState` vem do backend; mostrar “Pergunta 3 de até 8”; polling 2→10 s; foco na pergunta; input não enviado apenas em state React; nada sensível em storage.

```jsx
<ol aria-label="Conversa da consulta">
    {turns.map((turn) => <ConsultationTurn key={turn.revision} turn={turn} />)}
</ol>
{activeQuestion && <AnswerForm question={activeQuestion} onSubmit={submitAnswer} />}
```

Explicação do código: 401/409/timeout preservam conteúdo carregado e apresentam ação de retoma. Não existe máquina de estados paralela no frontend.

Validação: reload em `analyzing`, `asking_questions` e `generating_report` retoma o job.

Cenário negativo: duplo submit desativa a ação e trata o `409` sem apagar transcript.

### Passo 10 - Executar testes focais

1. Objetivo: provar dinâmica, concorrência, durabilidade e UI.
2. Comandos:

```bash
npm --prefix apps/api test -- tests/mf8.ai-consultation.test.js
npm --prefix apps/api test -- tests/guided-consultation-concurrency.replset.integration.test.js
npm --prefix apps/web test -- ConsultationFlowV2.test.jsx
```

Explicação do código: fixtures OpenAI são transport de teste, sem internet nem modo alternativo de produto.

Validação: sete objetivos, 5–8, resume/reload, jobs e acessibilidade.

Cenário negativo: prompt injection, resposta concorrente e provider esgotado preservam a sessão.

Executar cenarios negativos obrigatorios (minimo 3): objetivo inválido; resposta concorrente; hard failure fotográfico. Acrescenta injection, quota e retry inválido.

#### Expected results

- Consulta dinâmica, controlada e retomável para sete objetivos.
- Entre cinco e oito respostas, nunca uma sequência rígida e ilimitada igual para todos.
- Uma resposta por revision e jobs idempotentes.
- Falhas não fabricam análise/report nem apagam progresso.

#### Critérios de aceite

- [ ] Um objetivo principal + até dois secundários válidos.
- [ ] Qualidade/consentimento anteriores à OpenAI.
- [ ] 5–8 perguntas de slots/tipos fechados com provenance.
- [ ] CAS, cifra, jobs/retry/restart e `flowState` autoritativo.
- [ ] Evidencia de testes por camada: unit goals/validators + integração transacional/jobs + HTTP/frontend.
- [ ] Cenarios negativos concluidos: minimo `3`.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P0 | unit | sete goals, slots, tipos e completude 5–8 |
| P0 | integração | 25 concorrentes, rollback e restart |
| P0 | HTTP | ownership, quota, retry e estados |
| P0 | frontend | reload, foco, 320 px e conteúdo preservado |

#### Validação final

- [ ] Negativos: minimo `3` cenarios executados e registados.
- [ ] Zero endpoints de geração direta ou formulário rígido paralelo no fluxo ativo.
- [ ] Testes determinísticos não usam internet/chave.
- [ ] Live OpenAI não executado fica `SKIP`/`BLOQUEADO`.

#### Evidence para PR/defesa

- Transcript sanitizado de uma consulta 5–8.
- Prova CAS/rollback/restart sem conteúdo sensível.
- Screenshot da conversa sem fotografia, PII ou IDs técnicos.

#### Handoff

O `BK-MF8-09` recebe sessão/transcript cifrados e metadata segura para histórico/retoma. O relatório posterior recebe factos validados e limitações.

## Bloco pedagogico

### Objetivo

Perceber como limitar uma experiência conversacional sem retirar utilidade à IA.

### Pre-requisitos

- Express, Mongoose/transações, React state, JSON Schema e jobs.

### Erros comuns

- Guardar tudo apenas no browser.
- Permitir que a IA invente slot/tipo/opções.
- Terminar antes de cinco ou continuar depois de oito.

### Check de compreensao

- [ ] Sei explicar quem decide factos mínimos e quem escolhe a pergunta.
- [ ] Sei provar que uma resposta concorrente não duplica o turno.

## Bloco operacional

### Entrada

Objetivos válidos, consentimento v2 e par de fotos aceite.

### Passos

Criar → analisar → perguntar/responder 5–8 → submeter → gerar relatório.

### Validacao

Testar estados, CAS, jobs, reload e negativos no replica set local.

### Handoff

Sessão concluída, factos/transcript cifrados e job de relatório retomável.

## Criterios de aceite

- Conversa dinâmica limitada e dirigida pelo backend.
- Evidencia de testes por camada presente.
- Cenarios negativos concluidos: minimo `3`.

## Evidence para PR/defesa

Não incluir respostas reais, fotografias, prompts, cookies ou URI MongoDB.

#### Changelog

- `2026-07-11`: formulário rígido substituído pela consulta OpenAI dinâmica de sete objetivos, 5–8 perguntas, CAS e jobs retomáveis.
