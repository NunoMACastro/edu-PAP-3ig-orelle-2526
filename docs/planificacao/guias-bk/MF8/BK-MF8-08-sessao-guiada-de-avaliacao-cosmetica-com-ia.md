# BK-MF8-08 - Sessão guiada de avaliação cosmética com IA

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
- `last_updated`: `2026-07-02`

#### Objetivo

Neste BK vais implementar uma sessão guiada de avaliação cosmética com perguntas estruturadas, associada ao utilizador autenticado e ligada a análise facial e relatório já existentes.

No fim, o cliente consegue iniciar a consulta, responder a perguntas controladas, guardar progresso, concluir apenas quando as obrigatórias estiverem válidas e deixar dados prontos para o histórico seguro do `BK-MF8-09`.

#### Importância

Uma fotografia e uma análise automática não explicam tudo sobre uma rotina cosmética. A sessão guiada recolhe contexto que o cliente sabe melhor do que a app: objetivo principal, conforto da pele, rotina atual, ingredientes a evitar e preferências de utilização.

O valor deste BK está em recolher esse contexto sem abrir uma conversa livre. Perguntas fechadas, texto com limite, ownership no backend e DTO público reduzem risco de privacidade, tornam a feature testável e preparam os BKs seguintes sem obrigar cada equipa a inventar contratos diferentes.

#### Scope-in

- Criar o modelo `AiConsultationSession` em `apps/api/src/models/ai-consultation-session.model.js`.
- Criar um script versionado de perguntas em `apps/api/src/validators/ai-consultation.validator.js`.
- Validar respostas no backend antes de as guardar.
- Criar service, controller e routes autenticadas para iniciar, ler, atualizar e submeter a sessão.
- Montar a route em `apps/api/src/app.js`.
- Criar a página `GuidedConsultationPage.jsx` em `apps/web/src/pages`.
- Ligar a página em `apps/web/src/App.jsx`.
- Criar testes focais com unitário, HTTP, negativos e smoke do fluxo principal.

#### Scope-out

- Não criar conversa livre com IA.
- Não criar nova análise facial, upload de imagens ou provider de IA.
- Não guardar fotografias, prompts internos, dados clínicos ou campos que não pertencem a `RF42`.
- Não implementar histórico seguro, revisão humana ou recomendações enriquecidas. Esses pontos pertencem a `BK-MF8-09`, `BK-MF8-10` e `BK-MF8-11`.
- Não confiar em IDs enviados pelo frontend para definir o dono da sessão.

#### Estado antes e depois

- Antes: a app já tem autenticação, consentimento facial, análise facial e relatório personalizado.
- Antes: não existe módulo `ai-consultation`, nem endpoint de sessão guiada, nem página de wizard.
- Depois: a API cria uma sessão guiada para o utilizador autenticado a partir da análise e do relatório mais recentes.
- Depois: o frontend mostra perguntas controladas, guarda cada resposta e bloqueia conclusão quando falta informação obrigatória.
- Depois: os BKs seguintes podem consumir uma sessão submetida, sem recriar contratos de perguntas ou ownership.

#### Pre-requisitos

- `BK-MF1-06`: análise facial concluída em `FaceAnalysis`.
- `BK-MF1-07`: relatório ativo em `FaceReport`.
- `BK-MF7-01`: consentimento facial e sessão autenticada.
- Conhecer o padrão atual de `createApp`, routes Express, `requireAuth`, `AppError` e `apiRequest`.
- Ter a suite de testes da API a correr com Vitest e Supertest.

#### Glossário

- Sessão guiada: registo de avaliação com perguntas predefinidas e respostas validadas.
- Script versionado: lista de perguntas identificada por versão estável, para preservar significado histórico das respostas.
- Resposta minimizada: valor necessário para a feature, sem texto excessivo nem dados fora do requisito.
- DTO público: objeto devolvido ao frontend sem `userId`, `analysisId`, `reportId` ou campos internos.
- Ownership: regra em que o backend usa `req.user.id` para limitar leitura e escrita ao dono autenticado.
- Pergunta obrigatória: pergunta que tem de estar respondida antes da conclusão.
- Wizard: interface passo a passo que orienta a resposta do cliente.

#### Conceitos teóricos essenciais

- Uma sessão guiada é diferente de chat livre: as perguntas, tipos e opções são controlados pela app.
- O frontend ajuda a experiência, mas a segurança vive no backend. O cliente não escolhe `userId`, `analysisId` ou `reportId`.
- Versionar o script evita perder contexto quando uma pergunta mudar no futuro.
- Texto livre deve ter limite baixo, porque a feature é cosmética e não precisa de narrativas longas.
- Submissão é diferente de rascunho: uma sessão em `draft` pode ser editada, uma sessão em `submitted` fica pronta para histórico e recomendações futuras.
- Cada endpoint deve devolver apenas DTO público. IDs internos de análise e relatório ficam no backend.
- Testes negativos são obrigatórios porque esta feature toca dados pessoais e resultados de IA.

#### Arquitetura do BK

- `CANÓNICO`: `RF42` pede avaliação guiada com perguntas cosméticas estruturadas.
- `CANÓNICO`: o BK é `P0`, depende de `BK-MF1-06`, `BK-MF1-07` e `BK-MF7-01`, e entrega handoff para `BK-MF8-09`.
- `DERIVADO`: o módulo chama-se `ai-consultation` para distinguir consulta guiada de relatórios faciais, histórico e recomendações.
- `DERIVADO`: a versão inicial do script é `guided-consultation-v1`.
- `DERIVADO`: os endpoints ficam sob `/api/ai-consultation/sessions`, seguindo o padrão das routes já montadas em `/api`.

Fluxo principal:

1. Cliente autenticado chama `POST /api/ai-consultation/sessions`.
2. Service confirma análise facial concluída e relatório ativo do mesmo utilizador.
3. API cria ou reutiliza rascunho de sessão guiada.
4. Frontend mostra perguntas do script versionado.
5. Cliente grava cada resposta por `PATCH /api/ai-consultation/sessions/:sessionId/answers`.
6. Cliente conclui por `POST /api/ai-consultation/sessions/:sessionId/submit`.
7. Backend bloqueia conclusão se faltar pergunta obrigatória.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/src/models/ai-consultation-session.model.js`
- CRIAR: `apps/api/src/validators/ai-consultation.validator.js`
- CRIAR: `apps/api/src/services/ai-consultation.service.js`
- CRIAR: `apps/api/src/controllers/ai-consultation.controller.js`
- CRIAR: `apps/api/src/routes/ai-consultation.routes.js`
- EDITAR: `apps/api/src/app.js`
- CRIAR: `apps/web/src/pages/GuidedConsultationPage.jsx`
- EDITAR: `apps/web/src/App.jsx`
- CRIAR: `apps/api/tests/mf8.ai-consultation.test.js`
- REVER: `apps/api/src/models/face-analysis.model.js`
- REVER: `apps/api/src/models/face-report.model.js`
- REVER: `apps/api/src/middlewares/auth.middleware.js`
- REVER: `apps/web/src/services/apiClient.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato funcional e fronteiras

1. Objetivo funcional do passo no contexto da app.

Confirmar que a sessão guiada implementa apenas `RF42`, sem absorver histórico, revisão humana ou recomendações enriquecidas.

2. Ficheiros envolvidos:
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/BACKLOG-MVP.md`
    - REVER: `docs/planificacao/backlogs/MF-VIEWS.md`
    - LOCALIZAÇÃO: entradas de `RF42`, `BK-MF8-08`, dependências e próximo BK.

3. Instruções do que fazer.

Confirma que `RF42` fala de perguntas cosméticas estruturadas e que `BK-MF8-09` vem a seguir para histórico seguro. Regista no teu bloco de trabalho que o backend decide ownership e que o frontend só envia respostas.

4. Código completo, correto e integrado com a app final.

Este passo não altera código. A validação inicial evita programar endpoints ou campos fora do requisito.

5. Explicação do código.

Como ainda não há código neste passo, a explicação importante é a fronteira: este BK cria uma sessão estruturada, não uma conversa livre e não uma feature de recomendações.

6. Validação do passo.

Executa:

```bash
rg -n "RF42|BK-MF8-08|BK-MF8-09" docs/RF.md docs/planificacao/backlogs docs/planificacao/sprints
```

7. Cenário negativo/erro esperado.

Se `RF42` ou `BK-MF8-08` não aparecerem nos documentos canónicos, para o BK e corrige primeiro a planificação. Implementar com contrato ausente cria drift para todos os BKs seguintes.

### Passo 2 - Criar o modelo da sessão guiada

1. Objetivo funcional do passo no contexto da app.

Criar a persistência da sessão guiada com dono autenticado, ligação a análise/relatório, versão de script, respostas, estado e timestamps.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/models/ai-consultation-session.model.js`
    - REVER: `apps/api/src/models/face-analysis.model.js`
    - REVER: `apps/api/src/models/face-report.model.js`
    - LOCALIZAÇÃO: ficheiro completo do novo modelo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. O modelo guarda apenas respostas estruturadas e referências internas. O frontend nunca recebe `userId`, `analysisId` ou `reportId`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/ai-consultation-session.model.js
/**
 * Modelo de sessão guiada de avaliação cosmética.
 *
 * A sessão liga respostas estruturadas ao utilizador autenticado, a uma análise
 * facial concluída e a um relatório ativo. Os IDs internos ficam no backend.
 */
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const AI_CONSULTATION_SCRIPT_VERSION = "guided-consultation-v1";

export const AI_CONSULTATION_STATUS = {
    DRAFT: "draft",
    SUBMITTED: "submitted",
};

const answerSchema = new Schema(
    {
        questionId: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["single_choice", "multi_choice", "scale", "text"],
        },
        value: {
            type: Schema.Types.Mixed,
            required: true,
        },
        answeredAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { _id: false },
);

const aiConsultationSessionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        analysisId: {
            type: Schema.Types.ObjectId,
            ref: "FaceAnalysis",
            required: true,
            index: true,
        },
        reportId: {
            type: Schema.Types.ObjectId,
            ref: "FaceReport",
            required: true,
            index: true,
        },
        scriptVersion: {
            type: String,
            required: true,
            default: AI_CONSULTATION_SCRIPT_VERSION,
            trim: true,
        },
        answers: {
            type: [answerSchema],
            default: [],
        },
        status: {
            type: String,
            enum: Object.values(AI_CONSULTATION_STATUS),
            default: AI_CONSULTATION_STATUS.DRAFT,
            index: true,
        },
        submittedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

// Este índice acelera a procura do rascunho mais recente do cliente autenticado.
aiConsultationSessionSchema.index({
    userId: 1,
    status: 1,
    updatedAt: -1,
});

export const AiConsultationSession =
    models.AiConsultationSession ??
    model("AiConsultationSession", aiConsultationSessionSchema);
```

5. Explicação do código.

O modelo separa referências internas das respostas. `scriptVersion` preserva o significado histórico das respostas, mesmo que no futuro a equipa altere uma label ou uma opção. O índice por `userId`, `status` e `updatedAt` suporta a operação mais comum: recuperar o rascunho mais recente do cliente.

6. Validação do passo.

Executa:

```bash
node --check apps/api/src/models/ai-consultation-session.model.js
```

Confirma também que o ficheiro exporta `AiConsultationSession`, `AI_CONSULTATION_STATUS` e `AI_CONSULTATION_SCRIPT_VERSION`.

7. Cenário negativo/erro esperado.

Se tentares criar uma sessão sem `userId`, `analysisId` ou `reportId`, o Mongoose deve recusar o documento. Isso impede sessões soltas sem dono ou sem contexto facial.

### Passo 3 - Criar o script de perguntas e a validação de respostas

1. Objetivo funcional do passo no contexto da app.

Definir as perguntas permitidas e validar cada resposta antes de chegar ao service.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/validators/ai-consultation.validator.js`
    - REVER: `apps/api/src/middlewares/error.middleware.js`
    - LOCALIZAÇÃO: ficheiro completo do validator.

3. Instruções do que fazer.

Cria um script fixo, versionado no modelo, com tipos simples. O validator deve rejeitar pergunta inexistente, opção inválida, texto demasiado longo e escala fora do intervalo.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/ai-consultation.validator.js
/**
 * Script e validadores da sessão guiada de avaliação cosmética.
 *
 * As perguntas ficam no backend para evitar que o frontend invente campos ou
 * envie respostas fora do contrato de RF42.
 */
import { isValidObjectId } from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

export const GUIDED_CONSULTATION_SCRIPT = [
    {
        id: "main_goal",
        label: "Qual é a tua prioridade cosmética neste momento?",
        type: "single_choice",
        required: true,
        options: [
            { value: "hidratar", label: "Mais conforto e hidratação" },
            { value: "reduzir_oleosidade", label: "Reduzir oleosidade" },
            { value: "acalmar_sensibilidade", label: "Acalmar sensibilidade" },
            { value: "equilibrar_rotina", label: "Equilibrar a rotina" },
        ],
    },
    {
        id: "skin_comfort",
        label: "Como classificas o conforto da tua pele hoje?",
        type: "scale",
        required: true,
        min: 1,
        max: 5,
    },
    {
        id: "current_routine",
        label: "Que produtos usas normalmente de manhã ou à noite?",
        type: "text",
        required: false,
        maxLength: 280,
    },
    {
        id: "avoid_ingredients",
        label: "Há ingredientes, texturas ou fragrâncias que preferes evitar?",
        type: "text",
        required: false,
        maxLength: 180,
    },
    {
        id: "usage_preferences",
        label: "Que preferências queres que a Orélle considere?",
        type: "multi_choice",
        required: false,
        options: [
            { value: "textura_leve", label: "Textura leve" },
            { value: "sem_perfume", label: "Sem perfume" },
            { value: "rotina_curta", label: "Rotina curta" },
            { value: "produto_pratico", label: "Produto prático" },
        ],
    },
];

const QUESTION_BY_ID = new Map(
    GUIDED_CONSULTATION_SCRIPT.map((question) => [question.id, question]),
);

/**
 * Devolve uma cópia pública do script de perguntas.
 *
 * @function getGuidedConsultationScript
 * @returns {Array<object>} Perguntas que podem ser mostradas no frontend.
 */
export function getGuidedConsultationScript() {
    return GUIDED_CONSULTATION_SCRIPT.map((question) => ({
        ...question,
        options: question.options?.map((option) => ({ ...option })),
    }));
}

/**
 * Valida o parâmetro `sessionId` recebido nas routes.
 *
 * @function validateSessionIdParam
 * @param {{sessionId?: string}} params - Parâmetros Express.
 * @returns {string} ID validado.
 */
export function validateSessionIdParam(params) {
    const sessionId = params?.sessionId;

    if (!isValidObjectId(sessionId)) {
        throw new AppError(400, "Identificador de sessão guiada inválido.");
    }

    return sessionId;
}

/**
 * Normaliza uma resposta textual com limite de caracteres.
 *
 * @function normalizeTextAnswer
 * @param {object} question - Pergunta do script.
 * @param {string} value - Valor recebido.
 * @returns {string} Texto seguro para guardar.
 */
function normalizeTextAnswer(question, value) {
    const text = typeof value === "string" ? value.trim() : "";

    if (question.required && text.length === 0) {
        throw new AppError(400, "Resposta obrigatória em falta.");
    }

    if (text.length > question.maxLength) {
        throw new AppError(400, "Resposta demasiado longa.");
    }

    return text;
}

/**
 * Normaliza uma escolha simples ou múltipla.
 *
 * @function normalizeChoiceAnswer
 * @param {object} question - Pergunta do script.
 * @param {string|string[]} value - Valor recebido.
 * @returns {string|string[]} Valor validado contra as opções da pergunta.
 */
function normalizeChoiceAnswer(question, value) {
    const allowedValues = new Set(question.options.map((option) => option.value));
    const selectedValues =
        question.type === "multi_choice"
            ? Array.isArray(value)
                ? value
                : []
            : [value];

    if (question.required && selectedValues.length === 0) {
        throw new AppError(400, "Resposta obrigatória em falta.");
    }

    if (!selectedValues.every((item) => allowedValues.has(item))) {
        throw new AppError(400, "Opção de resposta inválida.");
    }

    return question.type === "multi_choice" ? selectedValues : selectedValues[0];
}

/**
 * Normaliza uma resposta numérica de escala.
 *
 * @function normalizeScaleAnswer
 * @param {object} question - Pergunta do script.
 * @param {number|string} value - Valor recebido.
 * @returns {number} Número validado.
 */
function normalizeScaleAnswer(question, value) {
    const numberValue = Number(value);

    if (!Number.isInteger(numberValue)) {
        throw new AppError(400, "Resposta numérica inválida.");
    }

    if (numberValue < question.min || numberValue > question.max) {
        throw new AppError(400, "Resposta fora da escala permitida.");
    }

    return numberValue;
}

/**
 * Valida e normaliza uma resposta enviada pelo frontend.
 *
 * @function validateAnswerInput
 * @param {{questionId?: string, value?: object|string|string[]|number}} body - Corpo JSON do pedido.
 * @returns {{questionId: string, type: string, value: object|string|string[]|number}} Resposta pronta para o service.
 */
export function validateAnswerInput(body) {
    const questionId = typeof body?.questionId === "string" ? body.questionId.trim() : "";
    const question = QUESTION_BY_ID.get(questionId);

    if (!question) {
        throw new AppError(400, "Pergunta da consulta guiada inválida.");
    }

    const normalizers = {
        single_choice: normalizeChoiceAnswer,
        multi_choice: normalizeChoiceAnswer,
        scale: normalizeScaleAnswer,
        text: normalizeTextAnswer,
    };
    const normalizeAnswer = normalizers[question.type];

    return {
        questionId: question.id,
        type: question.type,
        value: normalizeAnswer(question, body?.value),
    };
}
```

5. Explicação do código.

O script define o que o frontend pode mostrar, mas a validação final acontece no backend. `QUESTION_BY_ID` impede guardar uma pergunta inventada. Cada tipo tem uma função própria porque escolher uma opção, escrever texto curto e responder a uma escala são validações diferentes.

6. Validação do passo.

Executa:

```bash
node --check apps/api/src/validators/ai-consultation.validator.js
```

Depois confirma manualmente que existem pelo menos duas perguntas obrigatórias e que todos os valores de opções são strings estáveis.

7. Cenário negativo/erro esperado.

Enviar `{ "questionId": "skin_secret", "value": "x" }` deve devolver `400`. Perguntas inexistentes não podem entrar na base de dados.

### Passo 4 - Implementar o service da consulta guiada

1. Objetivo funcional do passo no contexto da app.

Criar a regra de negócio: iniciar sessão, recuperar sessão atual, guardar respostas e submeter apenas quando as obrigatórias estiverem respondidas.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/services/ai-consultation.service.js`
    - REVER: `apps/api/src/models/face-analysis.model.js`
    - REVER: `apps/api/src/models/face-report.model.js`
    - LOCALIZAÇÃO: ficheiro completo do service.

3. Instruções do que fazer.

O service recebe sempre `userId` vindo de `req.user.id`. Nunca aceites `userId` do corpo do pedido. Ao devolver sessão para o frontend, usa DTO público.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/ai-consultation.service.js
/**
 * Service da sessão guiada de avaliação cosmética.
 *
 * Centraliza ownership, ligação a análise/relatório e regras de submissão.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { AiConsultationSession, AI_CONSULTATION_SCRIPT_VERSION, AI_CONSULTATION_STATUS } from "../models/ai-consultation-session.model.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";
import { getGuidedConsultationScript } from "../validators/ai-consultation.validator.js";

const GUIDED_SCRIPT = getGuidedConsultationScript();
const REQUIRED_QUESTION_IDS = GUIDED_SCRIPT.filter((question) => question.required).map(
    (question) => question.id,
);

/**
 * Converte IDs Mongoose em string sem expor detalhes internos.
 *
 * @function toIdString
 * @param {object|string} value - ID recebido de documento ou string.
 * @returns {string} ID normalizado.
 */
function toIdString(value) {
    return value?.toString?.() ?? String(value);
}

/**
 * Cria o DTO público da sessão guiada.
 *
 * @function toPublicAiConsultationSession
 * @param {object} session - Documento Mongoose da sessão guiada.
 * @returns {object} Objeto seguro para o frontend.
 */
export function toPublicAiConsultationSession(session) {
    return {
        id: toIdString(session._id),
        scriptVersion: session.scriptVersion,
        status: session.status,
        questions: GUIDED_SCRIPT,
        answers: session.answers.map((answer) => ({
            questionId: answer.questionId,
            type: answer.type,
            value: answer.value,
            answeredAt: answer.answeredAt,
        })),
        submittedAt: session.submittedAt,
        updatedAt: session.updatedAt,
    };
}

/**
 * Procura a análise facial concluída mais recente do cliente.
 *
 * @async
 * @function findLatestCompletedAnalysis
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} Análise facial concluída.
 */
async function findLatestCompletedAnalysis(userId) {
    const analysis = await FaceAnalysis.findOne({
        userId,
        status: "completed",
    })
        .sort({ createdAt: -1 })
        .select("_id createdAt status");

    if (!analysis) {
        throw new AppError(400, "É necessário concluir uma análise facial antes da consulta guiada.");
    }

    return analysis;
}

/**
 * Procura o relatório facial ativo mais recente do cliente.
 *
 * @async
 * @function findLatestActiveReport
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} Relatório facial ativo.
 */
async function findLatestActiveReport(userId) {
    const report = await FaceReport.findOne({
        userId,
        privacyStatus: "active",
    })
        .sort({ createdAt: -1 })
        .select("_id createdAt privacyStatus");

    if (!report) {
        throw new AppError(400, "É necessário gerar um relatório facial antes da consulta guiada.");
    }

    return report;
}

/**
 * Inicia ou devolve o rascunho atual da sessão guiada.
 *
 * @async
 * @function startGuidedConsultation
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} DTO público da sessão.
 */
export async function startGuidedConsultation(userId) {
    const existingDraft = await AiConsultationSession.findOne({
        userId,
        status: AI_CONSULTATION_STATUS.DRAFT,
    }).sort({ updatedAt: -1 });

    if (existingDraft) {
        return toPublicAiConsultationSession(existingDraft);
    }

    const [analysis, report] = await Promise.all([
        findLatestCompletedAnalysis(userId),
        findLatestActiveReport(userId),
    ]);

    const session = await AiConsultationSession.create({
        userId,
        analysisId: analysis._id,
        reportId: report._id,
        scriptVersion: AI_CONSULTATION_SCRIPT_VERSION,
        answers: [],
    });

    return toPublicAiConsultationSession(session);
}

/**
 * Devolve a sessão guiada mais recente do cliente.
 *
 * @async
 * @function getCurrentGuidedConsultation
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} DTO público da sessão.
 */
export async function getCurrentGuidedConsultation(userId) {
    const session = await AiConsultationSession.findOne({ userId }).sort({
        updatedAt: -1,
    });

    if (!session) {
        throw new AppError(404, "Sessão guiada ainda não existe.");
    }

    return toPublicAiConsultationSession(session);
}

/**
 * Procura uma sessão em rascunho pertencente ao utilizador autenticado.
 *
 * @async
 * @function findOwnedDraftSession
 * @param {string} userId - Utilizador autenticado.
 * @param {string} sessionId - Sessão recebida na route.
 * @returns {Promise<object>} Documento de sessão editável.
 */
async function findOwnedDraftSession(userId, sessionId) {
    const session = await AiConsultationSession.findOne({
        _id: sessionId,
        userId,
        status: AI_CONSULTATION_STATUS.DRAFT,
    });

    if (!session) {
        throw new AppError(404, "Sessão guiada editável não encontrada.");
    }

    return session;
}

/**
 * Guarda ou substitui uma resposta da sessão guiada.
 *
 * @async
 * @function saveGuidedConsultationAnswer
 * @param {string} userId - Utilizador autenticado.
 * @param {string} sessionId - Sessão recebida na route.
 * @param {{questionId: string, type: string, value: object|string|string[]|number}} input - Resposta validada.
 * @returns {Promise<object>} DTO público atualizado.
 */
export async function saveGuidedConsultationAnswer(userId, sessionId, input) {
    const session = await findOwnedDraftSession(userId, sessionId);
    const previousAnswers = session.answers.filter(
        (answer) => answer.questionId !== input.questionId,
    );

    session.answers = [
        ...previousAnswers,
        {
            questionId: input.questionId,
            type: input.type,
            value: input.value,
            answeredAt: new Date(),
        },
    ];

    await session.save();

    return toPublicAiConsultationSession(session);
}

/**
 * Submete a sessão guiada quando todas as obrigatórias existem.
 *
 * @async
 * @function submitGuidedConsultation
 * @param {string} userId - Utilizador autenticado.
 * @param {string} sessionId - Sessão recebida na route.
 * @returns {Promise<object>} DTO público submetido.
 */
export async function submitGuidedConsultation(userId, sessionId) {
    const session = await findOwnedDraftSession(userId, sessionId);
    const answeredQuestionIds = new Set(
        session.answers.map((answer) => answer.questionId),
    );
    const missingQuestionIds = REQUIRED_QUESTION_IDS.filter(
        (questionId) => !answeredQuestionIds.has(questionId),
    );

    // A submissão fica bloqueada até existirem respostas obrigatórias válidas.
    if (missingQuestionIds.length > 0) {
        throw new AppError(400, "Responde às perguntas obrigatórias antes de concluir.", {
            missingQuestionIds,
        });
    }

    session.status = AI_CONSULTATION_STATUS.SUBMITTED;
    session.submittedAt = new Date();

    await session.save();

    return toPublicAiConsultationSession(session);
}
```

5. Explicação do código.

`startGuidedConsultation` reutiliza um rascunho existente para evitar várias sessões incompletas. Se não houver rascunho, confirma primeiro as dependências reais: análise concluída e relatório ativo. `findOwnedDraftSession` é o ponto de segurança mais importante: a query inclui `_id`, `userId` e `status`, por isso uma sessão submetida ou de outro utilizador não é editável.

6. Validação do passo.

Executa:

```bash
node --check apps/api/src/services/ai-consultation.service.js
```

Depois faz uma revisão manual: nenhuma função recebe `userId` do corpo JSON, e o DTO público não devolve `analysisId`, `reportId` ou `userId`.

7. Cenário negativo/erro esperado.

Um cliente autenticado que tente atualizar uma sessão de outro cliente deve receber `404`. A API não deve revelar se a sessão existe para outra pessoa.

### Passo 5 - Criar controller, routes e montagem na API

1. Objetivo funcional do passo no contexto da app.

Expor o service por endpoints Express protegidos por `requireAuth`.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/controllers/ai-consultation.controller.js`
    - CRIAR: `apps/api/src/routes/ai-consultation.routes.js`
    - EDITAR: `apps/api/src/app.js`
    - REVER: `apps/api/src/middlewares/auth.middleware.js`
    - LOCALIZAÇÃO: ficheiros completos e imports em `app.js`.

3. Instruções do que fazer.

Cria controller e routes. Depois importa `aiConsultationRoutes` em `app.js` e monta em `/api`, junto das restantes routes funcionais.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/controllers/ai-consultation.controller.js
/**
 * Controllers da sessão guiada de avaliação cosmética.
 */
import {
    getCurrentGuidedConsultation,
    saveGuidedConsultationAnswer,
    startGuidedConsultation,
    submitGuidedConsultation,
} from "../services/ai-consultation.service.js";
import {
    validateAnswerInput,
    validateSessionIdParam,
} from "../validators/ai-consultation.validator.js";

/**
 * Inicia ou devolve rascunho de sessão guiada para o utilizador autenticado.
 *
 * @async
 * @function startAiConsultationSessionController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201.
 */
export async function startAiConsultationSessionController(req, res, next) {
    try {
        const session = await startGuidedConsultation(req.user.id);
        return res.status(201).json({ session });
    } catch (err) {
        return next(err);
    }
}

/**
 * Devolve a sessão guiada mais recente do utilizador autenticado.
 *
 * @async
 * @function getCurrentAiConsultationSessionController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function getCurrentAiConsultationSessionController(req, res, next) {
    try {
        const session = await getCurrentGuidedConsultation(req.user.id);
        return res.status(200).json({ session });
    } catch (err) {
        return next(err);
    }
}

/**
 * Guarda uma resposta validada da sessão guiada.
 *
 * @async
 * @function saveAiConsultationAnswerController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function saveAiConsultationAnswerController(req, res, next) {
    try {
        const sessionId = validateSessionIdParam(req.params);
        const input = validateAnswerInput(req.body);
        const session = await saveGuidedConsultationAnswer(
            req.user.id,
            sessionId,
            input,
        );

        return res.status(200).json({ session });
    } catch (err) {
        return next(err);
    }
}

/**
 * Submete a sessão guiada quando está completa.
 *
 * @async
 * @function submitAiConsultationSessionController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function submitAiConsultationSessionController(req, res, next) {
    try {
        const sessionId = validateSessionIdParam(req.params);
        const session = await submitGuidedConsultation(req.user.id, sessionId);

        return res.status(200).json({ session });
    } catch (err) {
        return next(err);
    }
}
```

```js
// apps/api/src/routes/ai-consultation.routes.js
/**
 * Routes da sessão guiada de avaliação cosmética.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import {
    getCurrentAiConsultationSessionController,
    saveAiConsultationAnswerController,
    startAiConsultationSessionController,
    submitAiConsultationSessionController,
} from "../controllers/ai-consultation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const aiConsultationRoutes = Router();

aiConsultationRoutes.post(
    "/ai-consultation/sessions",
    requireAuth,
    startAiConsultationSessionController,
);

aiConsultationRoutes.get(
    "/ai-consultation/sessions/current",
    requireAuth,
    getCurrentAiConsultationSessionController,
);

aiConsultationRoutes.patch(
    "/ai-consultation/sessions/:sessionId/answers",
    requireAuth,
    saveAiConsultationAnswerController,
);

aiConsultationRoutes.post(
    "/ai-consultation/sessions/:sessionId/submit",
    requireAuth,
    submitAiConsultationSessionController,
);
```

Em `apps/api/src/app.js`, adiciona o import:

```js
import { aiConsultationRoutes } from "./routes/ai-consultation.routes.js";
```

E monta a route junto dos módulos de análise, relatório e recomendações:

```js
app.use("/api", faceAnalysisRoutes);
app.use("/api", faceReportRoutes);
app.use("/api", aiConsultationRoutes);
app.use("/api", skinHistoryRoutes);
```

5. Explicação do código.

O controller valida parâmetros e corpo antes de chamar o service. A route usa `requireAuth` em todos os endpoints porque a sessão guiada pertence a uma conta. A montagem em `/api` segue o padrão já usado por `faceAnalysisRoutes`, `faceReportRoutes` e `recommendationRoutes`.

6. Validação do passo.

Executa:

```bash
node --check apps/api/src/controllers/ai-consultation.controller.js
node --check apps/api/src/routes/ai-consultation.routes.js
rg -n "aiConsultationRoutes|ai-consultation.routes" apps/api/src/app.js
```

7. Cenário negativo/erro esperado.

Um pedido sem cookie de sessão para `POST /api/ai-consultation/sessions` deve devolver erro de autenticação e não deve criar documento.

### Passo 6 - Criar a página React e integrar no App

1. Objetivo funcional do passo no contexto da app.

Dar ao cliente uma interface passo a passo para iniciar, responder, guardar e concluir a consulta guiada.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/pages/GuidedConsultationPage.jsx`
    - EDITAR: `apps/web/src/App.jsx`
    - REVER: `apps/web/src/services/apiClient.js`
    - LOCALIZAÇÃO: componente completo e import em `App.jsx`.

3. Instruções do que fazer.

Cria a página abaixo. Usa `apiRequest`, que já envia cookies com `credentials: "include"`. Mantém estado local apenas em memória React. A API continua a ser a fonte da verdade.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/GuidedConsultationPage.jsx
/**
 * Página de sessão guiada de avaliação cosmética.
 */
import { useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Cria um mapa de respostas a partir do DTO público da API.
 *
 * @function buildAnswerState
 * @param {{answers?: Array<{questionId: string, value: string|string[]|number}>}|null} session - Sessão da API.
 * @returns {Record<string, string|string[]|number>} Estado inicial por pergunta.
 */
function buildAnswerState(session) {
    return Object.fromEntries(
        (session?.answers ?? []).map((answer) => [answer.questionId, answer.value]),
    );
}

/**
 * Renderiza a consulta guiada de RF42.
 *
 * @function GuidedConsultationPage
 * @returns {import("react").JSX.Element} Wizard de consulta guiada.
 */
export function GuidedConsultationPage() {
    const [session, setSession] = useState(null);
    const [answers, setAnswers] = useState({});
    const [activeIndex, setActiveIndex] = useState(0);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    const questions = session?.questions ?? [];
    const currentQuestion = questions[activeIndex] ?? null;
    const progressLabel = useMemo(() => {
        if (questions.length === 0) return "0/0";

        return `${Math.min(activeIndex + 1, questions.length)}/${questions.length}`;
    }, [activeIndex, questions.length]);

    /**
     * Atualiza uma resposta no estado local da página.
     *
     * @function updateAnswerValue
     * @param {string} questionId - Identificador da pergunta.
     * @param {string|string[]|number} value - Valor selecionado ou escrito.
     * @returns {void}
     */
    function updateAnswerValue(questionId, value) {
        setAnswers((current) => ({
            ...current,
            [questionId]: value,
        }));
    }

    /**
     * Inicia a sessão guiada ou recupera rascunho existente.
     *
     * @async
     * @function startSession
     * @returns {Promise<void>}
     */
    async function startSession() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/ai-consultation/sessions", {
                method: "POST",
            });

            setSession(data.session);
            setAnswers(buildAnswerState(data.session));
            setActiveIndex(0);
            setStatus("editing");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Carrega a sessão guiada mais recente do cliente.
     *
     * @async
     * @function loadCurrentSession
     * @returns {Promise<void>}
     */
    async function loadCurrentSession() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/ai-consultation/sessions/current");

            setSession(data.session);
            setAnswers(buildAnswerState(data.session));
            setActiveIndex(0);
            setStatus(data.session.status === "submitted" ? "submitted" : "editing");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Guarda a resposta atual no backend.
     *
     * @async
     * @function saveCurrentAnswer
     * @returns {Promise<boolean>} Verdadeiro quando a resposta foi guardada.
     */
    async function saveCurrentAnswer() {
        if (!session || !currentQuestion) return false;

        try {
            const data = await apiRequest(
                `/ai-consultation/sessions/${session.id}/answers`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        questionId: currentQuestion.id,
                        value: answers[currentQuestion.id],
                    }),
                },
            );

            setSession(data.session);
            setAnswers(buildAnswerState(data.session));
            return true;
        } catch (err) {
            setError(err.message);
            setStatus("error");
            return false;
        }
    }

    /**
     * Guarda a resposta atual e avança no wizard.
     *
     * @async
     * @function goToNextQuestion
     * @returns {Promise<void>}
     */
    async function goToNextQuestion() {
        const saved = await saveCurrentAnswer();

        if (saved) {
            setStatus("editing");
            setActiveIndex((index) => Math.min(index + 1, questions.length - 1));
        }
    }

    /**
     * Submete a sessão guiada depois de guardar a resposta atual.
     *
     * @async
     * @function submitSession
     * @returns {Promise<void>}
     */
    async function submitSession() {
        const saved = await saveCurrentAnswer();

        if (!saved || !session) return;

        try {
            const data = await apiRequest(
                `/ai-consultation/sessions/${session.id}/submit`,
                { method: "POST" },
            );

            setSession(data.session);
            setAnswers(buildAnswerState(data.session));
            setStatus("submitted");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Renderiza o controlo certo para o tipo de pergunta atual.
     *
     * @function renderQuestionControl
     * @param {object} question - Pergunta enviada pela API.
     * @returns {import("react").JSX.Element|null} Controlo de resposta.
     */
    function renderQuestionControl(question) {
        const value = answers[question.id] ?? (question.type === "multi_choice" ? [] : "");

        if (question.type === "scale") {
            return (
                <label>
                    Valor: {value || question.min}
                    <input
                        type="range"
                        min={question.min}
                        max={question.max}
                        value={value || question.min}
                        onChange={(event) =>
                            updateAnswerValue(question.id, Number(event.target.value))
                        }
                    />
                </label>
            );
        }

        if (question.type === "text") {
            return (
                <textarea
                    value={value}
                    maxLength={question.maxLength}
                    onChange={(event) => updateAnswerValue(question.id, event.target.value)}
                />
            );
        }

        if (question.type === "multi_choice") {
            const selectedValues = Array.isArray(value) ? value : [];

            return (
                <fieldset>
                    {question.options.map((option) => (
                        <label key={option.value}>
                            <input
                                type="checkbox"
                                checked={selectedValues.includes(option.value)}
                                onChange={(event) => {
                                    const nextValues = event.target.checked
                                        ? [...selectedValues, option.value]
                                        : selectedValues.filter((item) => item !== option.value);

                                    updateAnswerValue(question.id, nextValues);
                                }}
                            />
                            {option.label}
                        </label>
                    ))}
                </fieldset>
            );
        }

        return (
            <fieldset>
                {question.options.map((option) => (
                    <label key={option.value}>
                        <input
                            type="radio"
                            name={question.id}
                            value={option.value}
                            checked={value === option.value}
                            onChange={(event) =>
                                updateAnswerValue(question.id, event.target.value)
                            }
                        />
                        {option.label}
                    </label>
                ))}
            </fieldset>
        );
    }

    return (
        <section>
            <h1>Sessão guiada de avaliação cosmética</h1>
            <p>Progresso: {progressLabel}</p>
            <button onClick={startSession} disabled={status === "loading"}>
                Iniciar consulta
            </button>
            <button onClick={loadCurrentSession} disabled={status === "loading"}>
                Retomar consulta
            </button>
            {status === "error" && <p role="alert">{error}</p>}
            {currentQuestion && status !== "submitted" && (
                <article>
                    <h2>{currentQuestion.label}</h2>
                    {renderQuestionControl(currentQuestion)}
                    <button onClick={saveCurrentAnswer}>Guardar resposta</button>
                    <button
                        onClick={goToNextQuestion}
                        disabled={activeIndex >= questions.length - 1}
                    >
                        Seguinte
                    </button>
                    <button onClick={submitSession}>Concluir consulta</button>
                </article>
            )}
            {status === "submitted" && (
                <p>Consulta concluída. O histórico seguro será tratado no próximo BK.</p>
            )}
        </section>
    );
}
```

Em `apps/web/src/App.jsx`, adiciona o import:

```jsx
import { GuidedConsultationPage } from "./pages/GuidedConsultationPage.jsx";
```

E coloca a página no grupo do cliente depois do relatório facial:

```jsx
<MeasuredPageSection pageKey="guided-consultation" label="Consulta guiada">
    <GuidedConsultationPage />
</MeasuredPageSection>
```

5. Explicação do código.

A página usa `apiRequest`, por isso os cookies HttpOnly seguem o contrato já existente. O estado local serve apenas para a experiência do wizard; a resposta só conta quando o backend a valida e devolve a sessão atualizada. A conclusão chama o endpoint próprio, porque o backend é quem sabe se as perguntas obrigatórias estão completas.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/web run build
```

Depois abre a app e confirma manualmente: iniciar consulta, guardar uma resposta, avançar, tentar concluir sem obrigatórias e concluir quando tudo estiver completo.

7. Cenário negativo/erro esperado.

Se o cliente tentar concluir sem responder a perguntas obrigatórias, o backend deve devolver erro e o frontend deve mostrar a mensagem em `role="alert"`.

### Passo 7 - Criar testes focais e executar validação final

1. Objetivo funcional do passo no contexto da app.

Provar que a sessão guiada funciona no contrato principal e bloqueia os erros mais importantes.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.ai-consultation.test.js`
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - LOCALIZAÇÃO: ficheiro completo de testes.

3. Instruções do que fazer.

Cria testes para validator, início de sessão, DTO público, resposta, submissão incompleta e autenticação. Usa Supertest como nos testes atuais da API.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.ai-consultation.test.js
/**
 * Testes da MF8 para sessão guiada de avaliação cosmética.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import {
    createSessionToken,
    SESSION_COOKIE_NAME,
} from "../src/services/session.service.js";
import { validateAnswerInput } from "../src/validators/ai-consultation.validator.js";

vi.mock("../src/models/ai-consultation-session.model.js", () => ({
    AI_CONSULTATION_SCRIPT_VERSION: "guided-consultation-v1",
    AI_CONSULTATION_STATUS: {
        DRAFT: "draft",
        SUBMITTED: "submitted",
    },
    AiConsultationSession: {
        create: vi.fn(),
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/face-analysis.model.js", () => ({
    FaceAnalysis: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: {
        findOne: vi.fn(),
    },
}));

const userId = "66a000000000000000000001";
const sessionId = "66b000000000000000000001";
const analysisId = "66c000000000000000000001";
const reportId = "66d000000000000000000001";

/**
 * Cria um objeto com interface mínima de ObjectId.
 *
 * @function objectId
 * @param {string} id - Valor textual.
 * @returns {{toString: Function}} ID compatível com DTOs.
 */
function objectId(id) {
    return {
        toString() {
            return id;
        },
    };
}

/**
 * Cria token de cliente autenticado para Supertest.
 *
 * @function makeToken
 * @returns {string} Token de sessão.
 */
function makeToken() {
    return createSessionToken({
        id: userId,
        email: "cliente@orelle.test",
        role: ROLES.CLIENTE,
    });
}

/**
 * Cria header Cookie com o mesmo nome usado pela autenticação real.
 *
 * @function makeCookie
 * @returns {string[]} Header Cookie para Supertest.
 */
function makeCookie() {
    return [`${SESSION_COOKIE_NAME}=${makeToken()}`];
}

/**
 * Simula query Mongoose com `sort()`.
 *
 * @function querySort
 * @param {object|null} result - Resultado da query.
 * @returns {{sort: Function}} Query encadeável.
 */
function querySort(result) {
    return {
        sort: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula query Mongoose com `sort().select()`.
 *
 * @function querySortSelect
 * @param {object|null} result - Resultado da query.
 * @returns {{sort: Function, select: Function}} Query encadeável.
 */
function querySortSelect(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Cria documento de sessão guiada editável.
 *
 * @function makeSession
 * @param {object} [overrides={}] - Campos a alterar.
 * @returns {object} Sessão simulada.
 */
function makeSession(overrides = {}) {
    return {
        _id: objectId(sessionId),
        userId: objectId(userId),
        analysisId: objectId(analysisId),
        reportId: objectId(reportId),
        scriptVersion: "guided-consultation-v1",
        answers: [],
        status: "draft",
        submittedAt: null,
        updatedAt: new Date("2026-07-02T10:00:00.000Z"),
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

describe("BK-MF8-08 - sessão guiada de avaliação cosmética", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("valida resposta de escolha simples", () => {
        const input = validateAnswerInput({
            questionId: "main_goal",
            value: "hidratar",
        });

        expect(input).toEqual({
            questionId: "main_goal",
            type: "single_choice",
            value: "hidratar",
        });
    });

    it("recusa pergunta inexistente", () => {
        expect(() =>
            validateAnswerInput({ questionId: "skin_secret", value: "x" }),
        ).toThrow("Pergunta da consulta guiada inválida.");
    });

    it("inicia sessão com análise e relatório do utilizador autenticado", async () => {
        const analysisObjectId = objectId(analysisId);
        const reportObjectId = objectId(reportId);

        AiConsultationSession.findOne.mockReturnValueOnce(querySort(null));
        FaceAnalysis.findOne.mockReturnValueOnce(
            querySortSelect({ _id: analysisObjectId, status: "completed" }),
        );
        FaceReport.findOne.mockReturnValueOnce(
            querySortSelect({ _id: reportObjectId, privacyStatus: "active" }),
        );
        AiConsultationSession.create.mockResolvedValueOnce(makeSession());

        const response = await request(createApp())
            .post("/api/ai-consultation/sessions")
            .set("Cookie", makeCookie());

        expect(response.status).toBe(201);
        expect(response.body.session.id).toBe(sessionId);
        expect(response.body.session.userId).toBeUndefined();
        expect(response.body.session.questions.length).toBeGreaterThan(0);
        expect(AiConsultationSession.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId,
                analysisId: analysisObjectId,
                reportId: reportObjectId,
            }),
        );
    });

    it("guarda resposta numa sessão editável do próprio utilizador", async () => {
        const session = makeSession();
        AiConsultationSession.findOne.mockResolvedValueOnce(session);

        const response = await request(createApp())
            .patch(`/api/ai-consultation/sessions/${sessionId}/answers`)
            .set("Cookie", makeCookie())
            .send({ questionId: "skin_comfort", value: 4 });

        expect(response.status).toBe(200);
        expect(session.answers[0]).toMatchObject({
            questionId: "skin_comfort",
            type: "scale",
            value: 4,
        });
        expect(session.save).toHaveBeenCalledTimes(1);
    });

    it("bloqueia acesso sem autenticação", async () => {
        const response = await request(createApp()).post(
            "/api/ai-consultation/sessions",
        );

        expect(response.status).toBe(401);
        expect(AiConsultationSession.create).not.toHaveBeenCalled();
    });

    it("não permite editar sessão inexistente ou de outro utilizador", async () => {
        AiConsultationSession.findOne.mockResolvedValueOnce(null);

        const response = await request(createApp())
            .patch(`/api/ai-consultation/sessions/${sessionId}/answers`)
            .set("Cookie", makeCookie())
            .send({ questionId: "skin_comfort", value: 3 });

        expect(response.status).toBe(404);
    });

    it("bloqueia conclusão sem perguntas obrigatórias", async () => {
        const session = makeSession({
            answers: [
                {
                    questionId: "main_goal",
                    type: "single_choice",
                    value: "hidratar",
                    answeredAt: new Date("2026-07-02T10:00:00.000Z"),
                },
            ],
        });
        AiConsultationSession.findOne.mockResolvedValueOnce(session);

        const response = await request(createApp())
            .post(`/api/ai-consultation/sessions/${sessionId}/submit`)
            .set("Cookie", makeCookie());

        expect(response.status).toBe(400);
        expect(response.body.error.details.missingQuestionIds).toContain(
            "skin_comfort",
        );
    });
});
```

5. Explicação do código.

Os testes cobrem validator, HTTP autenticado, DTO sem campos internos, escrita de resposta, falta de autenticação, sessão fora do ownership e submissão incompleta. O teste de criação reutiliza as mesmas referências `analysisObjectId` e `reportObjectId` nos mocks e no `expect`, para provar que o service usa os IDs devolvidos pelas queries sem criar uma falha artificial de igualdade. Isto dá evidência funcional e de segurança sem depender de uma base de dados real durante a suite.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- mf8.ai-consultation.test.js
npm --prefix apps/api test
npm --prefix apps/web run build
git diff --check
```

7. Cenário negativo/erro esperado.

Se removeres `requireAuth` da route, o teste de acesso sem autenticação deve falhar. Se removeres `userId` da query do service, o teste de sessão inexistente ou de outro utilizador deixa de provar ownership.

#### Expected results

- `POST /api/ai-consultation/sessions` cria ou devolve rascunho do utilizador autenticado.
- `GET /api/ai-consultation/sessions/current` devolve a sessão mais recente do utilizador autenticado.
- `PATCH /api/ai-consultation/sessions/:sessionId/answers` guarda uma resposta validada.
- `POST /api/ai-consultation/sessions/:sessionId/submit` conclui apenas quando as perguntas obrigatórias estão respondidas.
- A página `GuidedConsultationPage` permite iniciar, retomar, responder, guardar e concluir a consulta.
- O DTO público não expõe `userId`, `analysisId` nem `reportId`.
- O `BK-MF8-09` consegue partir de sessões submetidas sem inventar outro contrato.

#### Critérios de aceite

- O script de perguntas existe no backend e é devolvido ao frontend como DTO público.
- O backend usa sempre `req.user.id` para criar, ler, editar e submeter sessões.
- Uma sessão só pode ser editada em estado `draft`.
- A submissão exige todas as perguntas obrigatórias.
- Pergunta inexistente, opção inválida, escala fora do intervalo e texto longo são recusados.
- Todos os endpoints usam `requireAuth`.
- A página web usa `apiRequest` e não guarda dados em storage do browser.
- Os testes incluem pelo menos 1 unitário, 1 HTTP principal e 3 negativos.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).

### Matriz mínima de testes por prioridade

| Prioridade | Obrigatório neste BK | Evidence esperada |
| --- | --- | --- |
| `P0` | Unitário de validator | Rejeita pergunta inexistente e aceita resposta válida |
| `P0` | Integração HTTP | Cria sessão autenticada com análise e relatório existentes |
| `P0` | Negativo de segurança | Pedido sem autenticação não cria sessão |
| `P0` | Negativo de ownership | Sessão inexistente ou de outro utilizador devolve `404` |
| `P0` | Negativo de completude | Submissão sem obrigatórias devolve `400` |
| `P0` | Build web | Página compila no Vite |

- Testes por prioridade respeitados: `P0` exige unit + integration + e2e + 3 negativos; `P1` exige unit/integration + 2 negativos; `P2` exige teste focal + 1 negativo.

#### Validação final

Executa os comandos pela ordem abaixo:

```bash
rg -n "ai-consultation|GuidedConsultationPage|RF42" apps/api/src apps/web/src apps/api/tests docs/planificacao/guias-bk/MF8/BK-MF8-08-sessao-guiada-de-avaliacao-cosmetica-com-ia.md
npm --prefix apps/api test -- mf8.ai-consultation.test.js
npm --prefix apps/api test
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
git diff --check
```

- [ ] Negativos: mínimo `3` cenários com resultado controlado; sem autenticação, sessão de outro utilizador, pergunta inexistente e submissão incompleta.
- Executar cenários negativos obrigatórios (mínimo 3) com resultado controlado.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagógico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensão`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validação`, `### Handoff`, `## Critérios de aceite`, `## Evidence para PR/defesa`.

Executa também a pesquisa estatica obrigatória definida pela prompt de auditoria contra este guia. A pesquisa deve terminar sem ocorrencias proibidas no ficheiro do aluno.

#### Evidence para PR/defesa

- Screenshot ou log de `POST /api/ai-consultation/sessions` com status `201`.
- Screenshot ou log de `PATCH /api/ai-consultation/sessions/:sessionId/answers` com status `200`.
- Screenshot ou log de `POST /api/ai-consultation/sessions/:sessionId/submit` com status `200` após respostas obrigatórias.
- Log do negativo sem autenticação com status `401`.
- Log do negativo de pergunta inexistente com status `400`.
- Log do negativo de submissão incompleta com status `400`.
- Output de `npm --prefix apps/api test -- mf8.ai-consultation.test.js`.
- Output de `npm --prefix apps/web run build`.
- Confirmação manual de que o DTO público não inclui IDs internos.

#### Handoff

Entrega para `BK-MF8-09`:

- Modelo `AiConsultationSession` com `status`, `answers`, `scriptVersion` e `submittedAt`.
- Endpoints de sessão autenticada.
- Regra de ownership centralizada no service.
- Respostas validadas e minimizadas.
- Contrato de que apenas sessões `submitted` devem entrar no histórico seguro.

O `BK-MF8-09` deve consumir sessões submetidas e criar histórico seguro sem alterar o script de perguntas deste BK.

#### Changelog

- `2026-07-02`: guia reescrito com modelo, validator, service, controller, routes, montagem em `app.js`, página React, testes focais, negativos obrigatórios e handoff para `BK-MF8-09`.
