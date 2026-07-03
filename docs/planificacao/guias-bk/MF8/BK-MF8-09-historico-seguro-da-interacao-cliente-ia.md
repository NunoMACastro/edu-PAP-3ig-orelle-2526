# BK-MF8-09 - Histórico seguro da interação cliente-IA

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
- `classe_core_dual`: `CORE-IA`
- `eixo_primario`: `ConsultoriaInteligente`
- `kpi_primario`: `retencao_fluxo_ia_30d`
- `kpi_secundario`: `taxa_conformidade_gates`
- `proximo_bk`: `BK-MF8-10`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-09-historico-seguro-da-interacao-cliente-ia.md`
- `last_updated`: `2026-07-02`

#### Objetivo

Neste BK vais implementar o histórico seguro da interação cliente-IA: a API guarda eventos minimizados da sessão guiada e o cliente autenticado consegue consultar esses eventos sem receber dados internos, fotografias, consentimentos, prompts ou chaves técnicas.

No fim, o `BK-MF8-10` pode reutilizar este contrato para enriquecer recomendações com contexto permitido, sem recriar ownership, privacidade ou DTOs paralelos.

#### Importância

O histórico dá continuidade à consulta IA. Sem ele, o cliente tem de repetir contexto e o sistema perde sinais úteis sobre objetivos cosméticos, conforto da pele e preferências já declaradas.

Ao mesmo tempo, esta é uma zona sensível: histórico IA junta dados pessoais, respostas guiadas e decisões de recomendação. Por isso, o backend tem de guardar apenas um resumo seguro, cifrar campos pessoais, filtrar sempre pelo utilizador autenticado e devolver um DTO público pequeno.

#### Scope-in

- Criar o modelo `AiInteractionHistory` em `apps/api/src/models/ai-interaction-history.model.js`.
- Cifrar os campos pessoais do histórico com o service de encriptação já existente.
- Criar o service `ai-interaction-history.service.js` com validação, minimização, DTO público e listagem por ownership.
- Criar controller e route autenticada para `GET /api/me/ai-interactions`.
- Montar a route em `apps/api/src/app.js`.
- Criar cliente frontend `aiInteractionHistoryApi.js`.
- Criar a página `AiHistoryPage.jsx` e ligá-la em `apps/web/src/App.jsx`.
- Criar testes focais com unitário, integração HTTP, negativos e smoke de interface.

#### Scope-out

- Não criar uma conversa livre com IA.
- Não alterar o contrato da sessão guiada do `BK-MF8-08`.
- Não implementar recomendações enriquecidas; isso pertence ao `BK-MF8-10`.
- Não expor `userId`, `sessionId`, `analysisId`, `reportId` ou campos internos no DTO público.
- Não guardar fotografias, texto integral de prompts, consentimentos, paths privados, tokens, cookies ou segredos.
- Não permitir que o frontend escolha o dono do histórico.

#### Estado antes e depois

- Antes: o `BK-MF8-08` entrega sessão guiada e respostas estruturadas.
- Antes: não existe módulo `ai-interaction-history`, endpoint público nem página cliente para histórico IA.
- Depois: services internos conseguem registar eventos minimizados e cifrados.
- Depois: o cliente autenticado lista apenas o próprio histórico por `GET /api/me/ai-interactions`.
- Depois: o frontend mostra uma linha temporal segura e o próximo BK recebe um contrato reutilizável.

#### Pre-requisitos

- `BK-MF8-08`: sessão guiada de avaliação cosmética submetida.
- `BK-MF6-07`: encriptação em repouso e regras de proteção de fotografias/relatórios.
- Conhecer `createApp`, `requireAuth`, `AppError`, routes Express e `apiRequest`.
- Ter a suite Vitest/Supertest da API e o build Vite do frontend a correr.

#### Glossário

- Histórico IA: sequência de eventos seguros derivados da interação cliente-IA.
- Evento minimizado: registo curto com tipo, finalidade, resumo e sinais permitidos.
- Sinal seguro: par `chave/valor` sem dados biométricos crus, ficheiros, segredos ou texto de prompt.
- DTO público: objeto devolvido à UI sem IDs internos nem campos operacionais.
- Ownership: regra em que o backend usa `req.user.id` para filtrar dados do próprio cliente.
- Cifra em repouso: proteção dos campos pessoais antes de serem persistidos na base de dados.

#### Conceitos teóricos essenciais

- Histórico não é um dump da sessão. Deve guardar apenas o necessário para continuidade, recomendação futura e defesa técnica.
- O frontend nunca decide `userId`; o backend usa a sessão autenticada para ownership.
- Cifra não substitui minimização. Primeiro reduzimos os dados, depois protegemos o que continua pessoal.
- DTO público deve ser construído campo a campo. Nunca devolver documentos Mongoose completos nesta feature.
- Eventos devem ter tipos fechados para evitar texto livre a definir comportamento crítico.
- Testes negativos são obrigatórios porque a feature toca dados pessoais e IA.

#### Arquitetura do BK

- `CANÓNICO`: `RF47` pede histórico da interação cliente-IA guardado de forma minimizada e consultável pelo próprio cliente.
- `CANÓNICO`: `RNF30` exige minimização, privacidade e ausência de fotografias, chaves técnicas, consentimentos ou prompts internos no histórico público.
- `CANÓNICO`: o BK é `P0`, depende de `BK-MF8-08` e `BK-MF6-07`, e entrega handoff para `BK-MF8-10`.
- `DERIVADO`: o módulo chama-se `ai-interaction-history` para separar histórico IA de sessão guiada e de recomendações.
- `DERIVADO`: a route pública é `GET /api/me/ai-interactions`, seguindo o padrão de endpoints do próprio cliente.
- `DERIVADO`: o registo de eventos fica num service exportado para ser chamado pelo `BK-MF8-08`, pelo `BK-MF8-10` ou por jobs internos autorizados.

Fluxo principal:

1. Um service interno chama `recordAiInteractionHistoryEvent(...)` depois de existir uma sessão IA válida.
2. O service valida tipo de evento, finalidade, resumo e sinais permitidos.
3. O modelo cifra `safeSummary` e `safeSignals` antes de persistir.
4. O cliente autenticado chama `GET /api/me/ai-interactions`.
5. O controller passa `req.user.id` ao service.
6. O service pesquisa apenas `{ userId: req.user.id }`, ordena por data e devolve DTO público.
7. A página React mostra a linha temporal sem IDs internos.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/src/models/ai-interaction-history.model.js`
- CRIAR: `apps/api/src/services/ai-interaction-history.service.js`
- CRIAR: `apps/api/src/controllers/ai-interaction-history.controller.js`
- CRIAR: `apps/api/src/routes/ai-interaction-history.routes.js`
- EDITAR: `apps/api/src/app.js`
- CRIAR: `apps/web/src/services/aiInteractionHistoryApi.js`
- CRIAR: `apps/web/src/pages/AiHistoryPage.jsx`
- EDITAR: `apps/web/src/App.jsx`
- CRIAR: `apps/api/tests/mf8.ai-interaction-history.test.js`
- CRIAR: `apps/web/scripts/check-mf8-ai-history-page.mjs`
- REVER: `apps/api/src/services/encryption.service.js`
- REVER: `apps/api/src/middlewares/auth.middleware.js`
- REVER: `apps/web/src/services/apiClient.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato funcional e fronteiras

1. Objetivo funcional do passo no contexto da app.

Confirmar que o `BK-MF8-09` implementa apenas `RF47` e `RNF30`: histórico minimizado da interação cliente-IA, consultável pelo próprio cliente, com privacidade forte.

2. Ficheiros envolvidos:
    - REVER: `docs/RF.md`
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
    - LOCALIZAÇÃO: entradas de `RF47`, `RNF30`, `BK-MF8-09` e `BK-MF8-10`.

3. Instruções do que fazer.

Confirma que o requisito pede histórico, não conversa livre nem recomendação. Regista que o histórico público tem de ser consultado apenas pelo dono autenticado e que o `BK-MF8-10` vai consumir este contrato mais tarde.

4. Código completo, correto e integrado com a app final.

Este passo não altera código. A decisão técnica é travar o scope antes de criar ficheiros.

5. Explicação do código.

Como ainda não há código, a explicação importante é a fronteira: este BK persiste eventos seguros e devolve uma timeline pública, mas não cria IA nova nem altera ranking de produtos.

6. Validação do passo.

Executa:

```bash
rg -n "RF47|RNF30|BK-MF8-09|BK-MF8-10" docs/RF.md docs/RNF.md docs/planificacao/backlogs
```

O resultado deve mostrar `RF47`, `RNF30`, a linha canónica do `BK-MF8-09` e o handoff para `BK-MF8-10`.

7. Cenário negativo/erro esperado.

Se algum contrato não aparecer nos documentos canónicos, para a implementação. Corrigir código sem contrato confirmado cria drift e pode contradizer a defesa da PAP.

### Passo 2 - Criar o modelo cifrado do histórico IA

1. Objetivo funcional do passo no contexto da app.

Criar a persistência do histórico com dono autenticado, ligação à sessão guiada, tipo de evento fechado, finalidade, resumo seguro, sinais permitidos e cifra em repouso nos campos pessoais.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/models/ai-interaction-history.model.js`
    - REVER: `apps/api/src/services/encryption.service.js`
    - LOCALIZAÇÃO: ficheiro completo do novo modelo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Repara que o modelo guarda `userId` e `sessionId` para ownership interno, mas o DTO público criado no service nunca devolve esses campos.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/ai-interaction-history.model.js
/**
 * Modelo de histórico seguro da interação cliente-IA.
 *
 * O histórico guarda apenas eventos minimizados. Os campos pessoais ficam
 * cifrados em repouso e os IDs internos nunca devem ser enviados no DTO público.
 */
import mongoose from "mongoose";
import { decryptJson, encryptJson } from "../services/encryption.service.js";

const { Schema, model, models } = mongoose;

export const AI_HISTORY_EVENT_TYPES = Object.freeze([
    "consultation_submitted",
    "answer_summary_ready",
    "recommendation_context_ready",
]);

const aiInteractionHistorySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        sessionId: {
            type: Schema.Types.ObjectId,
            ref: "AiConsultationSession",
            required: true,
            index: true,
        },
        eventType: {
            type: String,
            enum: AI_HISTORY_EVENT_TYPES,
            required: true,
            index: true,
        },
        purpose: {
            type: String,
            required: true,
            trim: true,
            minlength: 8,
            maxlength: 120,
        },
        safeSummary: {
            // Este resumo fica cifrado porque pode revelar sinais da avaliação cosmética do cliente.
            type: Schema.Types.Mixed,
            required: true,
            get: decryptJson,
            set: encryptJson,
        },
        safeSignals: {
            // Os sinais públicos também são cifrados para cumprir a minimização exigida pelo RNF30.
            type: Schema.Types.Mixed,
            required: true,
            get: decryptJson,
            set: encryptJson,
        },
        source: {
            type: String,
            enum: ["guided_consultation", "recommendation_engine"],
            required: true,
            default: "guided_consultation",
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

// Este índice suporta a timeline do próprio cliente sem pesquisar histórico de outros utilizadores.
aiInteractionHistorySchema.index({ userId: 1, createdAt: -1 });
aiInteractionHistorySchema.index(
    { userId: 1, sessionId: 1, eventType: 1 },
    // A unicidade evita repetir o mesmo evento IA para a mesma sessão guiada.
    { unique: true },
);

/**
 * Modelo Mongoose do histórico IA minimizado.
 *
 * @type {import("mongoose").Model}
 */
export const AiInteractionHistory =
    models.AiInteractionHistory ??
    model("AiInteractionHistory", aiInteractionHistorySchema);
```

5. Explicação do código.

O modelo separa dados internos e dados públicos. `userId` e `sessionId` servem para ownership e ligação técnica, mas não pertencem à UI. `safeSummary` e `safeSignals` usam `encryptJson` e `decryptJson`, reutilizando a infraestrutura do `BK-MF6-07`. O índice por utilizador e data torna a timeline eficiente, e o índice único evita duplicar o mesmo tipo de evento para a mesma sessão.

6. Validação do passo.

Executa:

```bash
rg -n "AiInteractionHistory|AI_HISTORY_EVENT_TYPES|encryptJson" apps/api/src/models/ai-interaction-history.model.js
```

Confirma que o ficheiro importa `encryptJson`/`decryptJson`, exporta o modelo e não contém campos públicos desnecessários.

7. Cenário negativo/erro esperado.

Se alguém tentar criar histórico sem `userId`, `sessionId`, `eventType`, `purpose`, `safeSummary` ou `safeSignals`, o Mongoose deve rejeitar o documento por validação.

### Passo 3 - Criar o service de minimização, validação e DTO público

1. Objetivo funcional do passo no contexto da app.

Centralizar as regras de segurança: validar eventos, rejeitar termos sensíveis, limitar sinais, criar o registo cifrado e listar apenas histórico do utilizador autenticado.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/services/ai-interaction-history.service.js`
    - REVER: `apps/api/src/middlewares/error.middleware.js`
    - LOCALIZAÇÃO: ficheiro completo do novo service.

3. Instruções do que fazer.

Cria o service abaixo. Ele exporta duas funções públicas: uma para registo interno de eventos e outra para listagem do próprio histórico.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/ai-interaction-history.service.js
/**
 * Service do histórico seguro da interação cliente-IA.
 *
 * Todas as leituras são filtradas por utilizador autenticado e todos os eventos
 * são minimizados antes de chegarem ao modelo.
 */
import { AppError } from "../middlewares/error.middleware.js";
import {
    AI_HISTORY_EVENT_TYPES,
    AiInteractionHistory,
} from "../models/ai-interaction-history.model.js";

const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 50;
const MAX_SIGNAL_COUNT = 12;
const SENSITIVE_TERMS = Object.freeze([
    "fotografia",
    "imagem facial",
    "ficheiro privado",
    "prompt interno",
    "segredo",
    "cookie",
    "token",
    "chave privada",
    "consentimento",
]);

/**
 * Garante que um valor textual existe e respeita tamanho máximo.
 *
 * @function normalizeText
 * @param {string} value - Texto recebido.
 * @param {string} fieldName - Nome do campo para mensagem de erro.
 * @param {number} maxLength - Tamanho máximo permitido.
 * @returns {string} Texto normalizado.
 * @throws {AppError} Quando o texto é inválido.
 */
function normalizeText(value, fieldName, maxLength) {
    if (typeof value !== "string") {
        throw new AppError(400, `${fieldName} obrigatório.`);
    }

    const text = value.trim();

    if (text.length < 3 || text.length > maxLength) {
        throw new AppError(400, `${fieldName} fora do tamanho permitido.`);
    }

    return text;
}

/**
 * Rejeita termos que indicam dados privados ou técnicos no histórico público.
 *
 * @function assertNoSensitiveContent
 * @param {object|string} value - Valor já minimizado pelo caller.
 * @returns {void}
 * @throws {AppError} Quando existe indício de dado sensível.
 */
function assertNoSensitiveContent(value) {
    // A verificação é textual para apanhar dados sensíveis mesmo quando chegam dentro de objetos.
    const text = JSON.stringify(value).toLowerCase();
    const foundTerm = SENSITIVE_TERMS.find((term) => text.includes(term));

    if (foundTerm) {
        throw new AppError(400, "Histórico IA contém dado sensível.", {
            term: foundTerm,
        });
    }
}

/**
 * Valida um tipo de evento permitido.
 *
 * @function normalizeEventType
 * @param {string} eventType - Tipo recebido.
 * @returns {string} Tipo validado.
 * @throws {AppError} Quando o tipo não pertence ao contrato do BK.
 */
function normalizeEventType(eventType) {
    if (!AI_HISTORY_EVENT_TYPES.includes(eventType)) {
        throw new AppError(400, "Tipo de evento IA inválido.");
    }

    return eventType;
}

/**
 * Normaliza sinais públicos para a timeline IA.
 *
 * @function normalizeSafeSignals
 * @param {{key: string, label: string, value: string}[]} signals - Sinais candidatos.
 * @returns {{key: string, label: string, value: string}[]} Sinais seguros.
 * @throws {AppError} Quando há sinais inválidos ou excessivos.
 */
function normalizeSafeSignals(signals) {
    if (!Array.isArray(signals)) {
        throw new AppError(400, "Sinais do histórico obrigatórios.");
    }

    if (signals.length === 0 || signals.length > MAX_SIGNAL_COUNT) {
        throw new AppError(400, "Número de sinais do histórico inválido.");
    }

    const normalizedSignals = signals.map((signal) => {
        // Cada sinal é normalizado campo a campo para não aceitar payloads livres vindos de IA ou UI.
        const key = normalizeText(signal?.key, "Chave do sinal", 40);
        const label = normalizeText(signal?.label, "Etiqueta do sinal", 80);
        const value = normalizeText(signal?.value, "Valor do sinal", 120);
        const normalizedSignal = { key, label, value };

        assertNoSensitiveContent(normalizedSignal);

        return normalizedSignal;
    });

    return normalizedSignals;
}

/**
 * Converte um limite de query para intervalo seguro.
 *
 * @function normalizeLimit
 * @param {string|number|undefined} limit - Valor recebido da query.
 * @returns {number} Limite final.
 */
function normalizeLimit(limit) {
    const parsed = Number.parseInt(String(limit ?? DEFAULT_HISTORY_LIMIT), 10);

    if (Number.isNaN(parsed) || parsed < 1) {
        return DEFAULT_HISTORY_LIMIT;
    }

    return Math.min(parsed, MAX_HISTORY_LIMIT);
}

/**
 * Converte documento interno em DTO público.
 *
 * @function toPublicHistoryItem
 * @param {object} historyItem - Documento Mongoose ou mock equivalente.
 * @returns {object} Item público da timeline IA.
 */
function toPublicHistoryItem(historyItem) {
    return {
        id: historyItem._id.toString(),
        eventType: historyItem.eventType,
        purpose: historyItem.purpose,
        safeSummary: historyItem.safeSummary,
        safeSignals: historyItem.safeSignals,
        source: historyItem.source,
        createdAt: historyItem.createdAt,
        updatedAt: historyItem.updatedAt,
    };
}

/**
 * Regista um evento minimizado da interação cliente-IA.
 *
 * @async
 * @function recordAiInteractionHistoryEvent
 * @param {{userId: string, sessionId: string, eventType: string, purpose: string, safeSummary: string, safeSignals: {key: string, label: string, value: string}[], source?: string}} input - Evento interno.
 * @returns {Promise<object>} DTO público do evento criado.
 * @throws {AppError} Quando o evento tem dados inválidos ou sensíveis.
 */
export async function recordAiInteractionHistoryEvent(input) {
    const eventType = normalizeEventType(input?.eventType);
    const purpose = normalizeText(input?.purpose, "Finalidade do histórico", 120);
    const safeSummary = normalizeText(input?.safeSummary, "Resumo do histórico", 700);
    const safeSignals = normalizeSafeSignals(input?.safeSignals);

    assertNoSensitiveContent({ purpose, safeSummary, safeSignals });

    // A escrita fica centralizada no service para impedir que controllers ou providers ignorem a minimização.
    const historyItem = await AiInteractionHistory.create({
        userId: input.userId,
        sessionId: input.sessionId,
        eventType,
        purpose,
        safeSummary,
        safeSignals,
        source: input.source ?? "guided_consultation",
    });

    return toPublicHistoryItem(historyItem);
}

/**
 * Lista histórico IA do próprio utilizador autenticado.
 *
 * @async
 * @function listMyAiInteractionHistory
 * @param {string} userId - Utilizador autenticado.
 * @param {{limit?: string|number}} [options={}] - Opções de paginação simples.
 * @returns {Promise<object[]>} Timeline pública ordenada por data decrescente.
 */
export async function listMyAiInteractionHistory(userId, options = {}) {
    const limit = normalizeLimit(options.limit);
    // O filtro usa sempre o userId autenticado recebido do controller, nunca um ID enviado pelo browser.
    const historyItems = await AiInteractionHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);

    return historyItems.map(toPublicHistoryItem);
}
```

5. Explicação do código.

`recordAiInteractionHistoryEvent` é a porta interna para criar histórico. O caller envia apenas dados já resumidos; o service volta a validar para impedir que campos sensíveis entrem por engano. `listMyAiInteractionHistory` nunca aceita `userId` por query ou body; recebe sempre o ID da sessão autenticada através do controller. O DTO é montado manualmente para impedir exposição de `sessionId` e `userId`.

6. Validação do passo.

Executa:

```bash
rg -n "recordAiInteractionHistoryEvent|listMyAiInteractionHistory|Histórico IA contém dado sensível" apps/api/src/services/ai-interaction-history.service.js
```

Confirma também que não existe nenhum `return historyItem` direto no service.

7. Cenário negativo/erro esperado.

Se `safeSummary` ou `safeSignals` contiverem texto como `prompt interno`, `token` ou `fotografia`, o service deve devolver erro `400` antes de criar documento.

### Passo 4 - Criar controller e route autenticada

1. Objetivo funcional do passo no contexto da app.

Expor o histórico seguro ao cliente autenticado por `GET /api/me/ai-interactions`, usando `req.user.id` como única fonte de ownership.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/controllers/ai-interaction-history.controller.js`
    - CRIAR: `apps/api/src/routes/ai-interaction-history.routes.js`
    - REVER: `apps/api/src/middlewares/auth.middleware.js`
    - LOCALIZAÇÃO: ficheiros completos.

3. Instruções do que fazer.

Cria controller e route abaixo. Não cries endpoint público de escrita: o registo de eventos deve continuar interno para impedir que o browser fabrique histórico.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/controllers/ai-interaction-history.controller.js
/**
 * Controller do histórico seguro da interação cliente-IA.
 */
import { listMyAiInteractionHistory } from "../services/ai-interaction-history.service.js";

/**
 * Lista o histórico IA do utilizador autenticado.
 *
 * @async
 * @function getMyAiInteractionHistoryController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com timeline pública.
 */
export async function getMyAiInteractionHistoryController(req, res, next) {
    try {
        // O ownership vem da sessão autenticada para impedir consulta de histórico de outro cliente.
        const history = await listMyAiInteractionHistory(req.user.id, {
            limit: req.query.limit,
        });

        // A resposta devolve apenas o DTO público montado no service, sem IDs internos da sessão IA.
        return res.status(200).json({ history });
    } catch (err) {
        return next(err);
    }
}
```

```js
// apps/api/src/routes/ai-interaction-history.routes.js
/**
 * Rotas do histórico seguro da interação cliente-IA.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import { getMyAiInteractionHistoryController } from "../controllers/ai-interaction-history.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express do histórico IA.
 *
 * @type {import("express").Router}
 */
export const aiInteractionHistoryRoutes = Router();

// Só existe leitura pública: a escrita do histórico continua interna aos services da app.
aiInteractionHistoryRoutes.get(
    "/me/ai-interactions",
    // A autenticação é o gate obrigatório antes de qualquer acesso ao histórico IA minimizado.
    requireAuth,
    getMyAiInteractionHistoryController,
);
```

5. Explicação do código.

A route só tem `GET`, porque o frontend não deve criar histórico. O controller chama o service com `req.user.id`, preservando ownership. A query `limit` é opcional e normalizada no service, não no controller, para manter a regra num só sítio.

6. Validação do passo.

Executa:

```bash
rg -n "aiInteractionHistoryRoutes|/me/ai-interactions|requireAuth" apps/api/src/controllers apps/api/src/routes
```

Confirma que a route usa `requireAuth` antes do controller.

7. Cenário negativo/erro esperado.

Um pedido sem cookie de sessão para `GET /api/me/ai-interactions` deve devolver `401` e nunca consultar o modelo de histórico.

### Passo 5 - Montar a route na aplicação Express

1. Objetivo funcional do passo no contexto da app.

Ligar a route ao `createApp` real para que o endpoint exista na API.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/app.js`
    - REVER: `apps/api/src/routes/skin-history.routes.js`
    - LOCALIZAÇÃO: imports e mounts dentro de `createApp`.

3. Instruções do que fazer.

Adiciona o import perto das restantes routes e monta `aiInteractionHistoryRoutes` no prefixo `/api`, como acontece com `skinHistoryRoutes`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/app.js
// 1) Junta este import aos restantes imports de routes.
import { aiInteractionHistoryRoutes } from "./routes/ai-interaction-history.routes.js";

// 2) Dentro de createApp(), junta este mount ao bloco de routes com prefixo /api.
app.use("/api", aiInteractionHistoryRoutes);
```

Exemplo de localização dentro de `createApp`:

```js
app.use("/api", faceReportRoutes);
app.use("/api", skinHistoryRoutes);
app.use("/api", aiInteractionHistoryRoutes);
app.use("/api", skinEvolutionRoutes);
```

5. Explicação do código.

O endpoint final fica `GET /api/me/ai-interactions`, porque a route define `/me/ai-interactions` e o `app.js` acrescenta o prefixo `/api`. Esta montagem evita criar um segundo prefixo como `/api/ai-history`, mantendo o padrão das páginas do próprio cliente.

6. Validação do passo.

Executa:

```bash
rg -n "aiInteractionHistoryRoutes|me/ai-interactions" apps/api/src/app.js apps/api/src/routes/ai-interaction-history.routes.js
```

Depois confirma que não existem dois mounts para o mesmo router.

7. Cenário negativo/erro esperado.

Se a route for montada em `/api/ai-interaction-history`, a página vai chamar `/api/me/ai-interactions` e receber `404`. Corrige o mount antes de avançar.

### Passo 6 - Criar o cliente HTTP do frontend

1. Objetivo funcional do passo no contexto da app.

Criar uma função pequena para a UI carregar a timeline IA sem duplicar detalhes de `apiRequest`.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/services/aiInteractionHistoryApi.js`
    - REVER: `apps/web/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo do novo cliente.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Ele devolve sempre um array para simplificar estados da página.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/src/services/aiInteractionHistoryApi.js
/**
 * Cliente HTTP do histórico seguro da interação cliente-IA.
 */
import { apiRequest } from "./apiClient.js";

/**
 * Lista a timeline IA do cliente autenticado.
 *
 * @async
 * @function listMyAiInteractionHistory
 * @returns {Promise<object[]>} Histórico público do próprio cliente.
 */
export async function listMyAiInteractionHistory() {
    // A UI não envia userId: o backend identifica o cliente pelo cookie HttpOnly da sessão.
    const data = await apiRequest("/me/ai-interactions");

    // Devolver sempre array evita estados React ambíguos quando a API responde sem histórico.
    return Array.isArray(data?.history) ? data.history : [];
}
```

5. Explicação do código.

O cliente usa `apiRequest`, que já envia cookies HttpOnly com `credentials: "include"`. A função não aceita `userId`, porque a API decide ownership pelo cookie de sessão.

6. Validação do passo.

Executa:

```bash
rg -n "listMyAiInteractionHistory|/me/ai-interactions" apps/web/src/services/aiInteractionHistoryApi.js
```

Confirma que não há `userId` como argumento.

7. Cenário negativo/erro esperado.

Se a sessão expirar, `apiRequest` deve lançar erro e a página deve mostrar a mensagem em `role="alert"`.

### Passo 7 - Criar a página de histórico IA

1. Objetivo funcional do passo no contexto da app.

Mostrar ao cliente uma timeline clara dos eventos IA minimizados, com estados de carregamento, vazio, erro e sucesso.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/pages/AiHistoryPage.jsx`
    - REVER: `apps/web/src/pages/SkinHistoryPage.jsx`
    - LOCALIZAÇÃO: ficheiro completo da nova página.

3. Instruções do que fazer.

Cria a página abaixo. Ela carrega o histórico no primeiro render e permite atualizar manualmente.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/AiHistoryPage.jsx
/**
 * Página de histórico seguro da interação cliente-IA.
 */
import { useEffect, useState } from "react";
import { listMyAiInteractionHistory } from "../services/aiInteractionHistoryApi.js";

/**
 * Formata data para apresentação em PT-PT.
 *
 * @function formatDateTime
 * @param {string|Date} value - Data do evento.
 * @returns {string} Data legível.
 */
function formatDateTime(value) {
    return new Intl.DateTimeFormat("pt-PT", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
}

/**
 * Renderiza sinais seguros de um evento IA.
 *
 * @function SafeSignalList
 * @param {{signals: {key: string, label: string, value: string}[]}} props - Sinais públicos.
 * @returns {JSX.Element|null} Lista de sinais ou null.
 */
function SafeSignalList({ signals }) {
    if (!Array.isArray(signals) || signals.length === 0) return null;

    return (
        <ul>
            {signals.map((signal) => (
                <li key={signal.key}>
                    <strong>{signal.label}:</strong> {signal.value}
                </li>
            ))}
        </ul>
    );
}

/**
 * Mostra a timeline IA do cliente autenticado.
 *
 * @function AiHistoryPage
 * @returns {JSX.Element} Secção de histórico IA minimizado.
 */
export function AiHistoryPage() {
    // A página mantém uma pequena máquina de estados para distinguir loading, vazio, erro e sucesso.
    const [history, setHistory] = useState([]);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    /**
     * Carrega a timeline IA do próprio cliente.
     *
     * @async
     * @function loadHistory
     * @returns {Promise<void>}
     */
    async function loadHistory() {
        setStatus("loading");
        setError("");

        try {
            // A chamada não envia userId; o backend decide ownership pela sessão HttpOnly.
            const nextHistory = await listMyAiInteractionHistory();
            setHistory(nextHistory);
            setStatus(nextHistory.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    useEffect(() => {
        // O carregamento inicial usa a mesma função do botão para evitar dois fluxos de API diferentes.
        void loadHistory();
    }, []);

    return (
        <section aria-labelledby="ai-history-title">
            <header>
                <p>Consulta IA</p>
                <h1 id="ai-history-title">Histórico seguro da interação IA</h1>
                <p>
                    Consulta os eventos guardados de forma minimizada para dar
                    continuidade à tua avaliação cosmética.
                </p>
                <button type="button" onClick={loadHistory} disabled={status === "loading"}>
                    {status === "loading" ? "A carregar..." : "Atualizar histórico"}
                </button>
            </header>

            {status === "error" && <p role="alert">{error}</p>}

            {status === "empty" && (
                <p>Ainda não existe histórico IA associado à tua conta.</p>
            )}

            {status === "success" && (
                <ol>
                    {history.map((item) => (
                        <li key={item.id}>
                            <article>
                                <header>
                                    <strong>{item.purpose}</strong>
                                    <time dateTime={item.createdAt}>
                                        {formatDateTime(item.createdAt)}
                                    </time>
                                </header>
                                <p>{item.safeSummary}</p>
                                <SafeSignalList signals={item.safeSignals} />
                            </article>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}
```

5. Explicação do código.

A página tem quatro estados: `loading`, `empty`, `error` e `success`. A chamada ao backend não recebe IDs. A UI mostra apenas `purpose`, `safeSummary`, `safeSignals` e datas públicas, que vêm do DTO do service.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/web run build
```

Depois confirma manualmente que a página mostra erro quando não há sessão e mostra vazio quando a API devolve `{ "history": [] }`.

7. Cenário negativo/erro esperado.

Se a API devolver `401`, a página deve mostrar a mensagem no parágrafo com `role="alert"` e não deve tentar construir histórico local.

### Passo 8 - Ligar a página ao App principal

1. Objetivo funcional do passo no contexto da app.

Tornar a nova página acessível no frontend atual, que ainda compõe as páginas diretamente no `App.jsx`.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/App.jsx`
    - REVER: `apps/web/src/pages/SkinHistoryPage.jsx`
    - LOCALIZAÇÃO: lista de imports e grupo "Conta e experiencia do cliente".

3. Instruções do que fazer.

Adiciona o import e coloca `<AiHistoryPage />` depois de `<SkinHistoryPage />`, porque o histórico IA complementa o histórico de pele e fica antes de evolução/recomendações.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/App.jsx
// 1) Junta o import aos restantes imports de páginas.
import { AiHistoryPage } from "./pages/AiHistoryPage.jsx";

// 2) Dentro do grupo "Conta e experiencia do cliente", junta a página.
<SkinHistoryPage />
<AiHistoryPage />
<SkinEvolutionPage />
```

5. Explicação do código.

A aplicação atual ainda não usa routing final. Por isso, o ponto correto é a composição direta no `App.jsx`. A página fica perto dos restantes fluxos de consulta e não depende de role especial; a API continua a proteger dados com autenticação.

6. Validação do passo.

Executa:

```bash
rg -n "AiHistoryPage" apps/web/src/App.jsx apps/web/src/pages/AiHistoryPage.jsx
npm --prefix apps/web run build
```

7. Cenário negativo/erro esperado.

Se o import existir mas o componente não for renderizado no grupo principal, o build pode passar, mas o smoke visual falha porque a página não aparece na app.

### Passo 9 - Criar testes unitários e de integração HTTP

1. Objetivo funcional do passo no contexto da app.

Provar que o service rejeita dados sensíveis, cria DTO público, lista histórico por ownership e bloqueia pedidos sem autenticação.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.ai-interaction-history.test.js`
    - REVER: `apps/api/package.json`
    - LOCALIZAÇÃO: ficheiro completo de testes.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Os testes usam mocks de Mongoose como a suite atual e Supertest para validar o contrato HTTP.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.ai-interaction-history.test.js
/**
 * Testes da MF8 para histórico seguro da interação cliente-IA.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { AiInteractionHistory } from "../src/models/ai-interaction-history.model.js";
import {
    createSessionToken,
    SESSION_COOKIE_NAME,
} from "../src/services/session.service.js";
import {
    listMyAiInteractionHistory,
    recordAiInteractionHistoryEvent,
} from "../src/services/ai-interaction-history.service.js";

// O mock substitui apenas a persistência; o service real continua a validar minimização e DTO público.
vi.mock("../src/models/ai-interaction-history.model.js", () => ({
    AI_HISTORY_EVENT_TYPES: [
        "consultation_submitted",
        "answer_summary_ready",
        "recommendation_context_ready",
    ],
    AiInteractionHistory: {
        create: vi.fn(),
        find: vi.fn(),
    },
}));

const userId = "66a000000000000000000001";
const sessionId = "66b000000000000000000001";
const historyId = "66c000000000000000000001";

/**
 * Cria um identificador mínimo com interface de ObjectId.
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
 * Cria cookie autenticado para Supertest.
 *
 * @function makeCookie
 * @returns {string[]} Header Cookie.
 */
function makeCookie() {
    // O cookie reproduz a autenticação real da app para testar o endpoint como o browser o usa.
    const token = createSessionToken({
        id: userId,
        email: "cliente@orelle.test",
        role: ROLES.CLIENTE,
    });

    return [`${SESSION_COOKIE_NAME}=${token}`];
}

/**
 * Cria evento de histórico mock.
 *
 * @function makeHistoryItem
 * @param {object} [overrides={}] - Campos a alterar.
 * @returns {object} Documento simulado.
 */
function makeHistoryItem(overrides = {}) {
    return {
        _id: objectId(historyId),
        userId: objectId(userId),
        sessionId: objectId(sessionId),
        eventType: "consultation_submitted",
        purpose: "Continuidade da avaliação cosmética",
        safeSummary: "Sessão guiada submetida com objetivo de luminosidade.",
        safeSignals: [
            {
                key: "main_goal",
                label: "Objetivo principal",
                value: "Luminosidade",
            },
        ],
        source: "guided_consultation",
        createdAt: new Date("2026-07-02T10:00:00.000Z"),
        updatedAt: new Date("2026-07-02T10:00:00.000Z"),
        ...overrides,
    };
}

/**
 * Simula query Mongoose com `sort().limit()`.
 *
 * @function querySortLimit
 * @param {object[]} result - Resultado final.
 * @returns {{sort: Function, limit: Function}} Query encadeável.
 */
function querySortLimit(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

describe("BK-MF8-09 - histórico seguro da interação cliente-IA", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("regista evento minimizado e devolve DTO público", async () => {
        AiInteractionHistory.create.mockResolvedValueOnce(makeHistoryItem());

        // O evento usa apenas resumo e sinais seguros; fotografias, prompts e IDs internos ficam fora.
        const event = await recordAiInteractionHistoryEvent({
            userId,
            sessionId,
            eventType: "consultation_submitted",
            purpose: "Continuidade da avaliação cosmética",
            safeSummary: "Sessão guiada submetida com objetivo de luminosidade.",
            safeSignals: [
                {
                    key: "main_goal",
                    label: "Objetivo principal",
                    value: "Luminosidade",
                },
            ],
        });

        expect(AiInteractionHistory.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId,
                sessionId,
                eventType: "consultation_submitted",
            }),
        );
        expect(event.id).toBe(historyId);
        // Estes asserts protegem o contrato público: a UI não precisa nem deve receber IDs internos.
        expect(event.userId).toBeUndefined();
        expect(event.sessionId).toBeUndefined();
    });

    it("recusa conteúdo sensível antes de criar documento", async () => {
        await expect(
            recordAiInteractionHistoryEvent({
                userId,
                sessionId,
                eventType: "answer_summary_ready",
                purpose: "Continuidade da avaliação cosmética",
                safeSummary: "Resumo com prompt interno copiado.",
                safeSignals: [
                    {
                        key: "main_goal",
                        label: "Objetivo principal",
                        value: "Luminosidade",
                    },
                ],
            }),
        ).rejects.toThrow("Histórico IA contém dado sensível.");

        expect(AiInteractionHistory.create).not.toHaveBeenCalled();
    });

    it("lista apenas histórico do utilizador autenticado pelo filtro do backend", async () => {
        AiInteractionHistory.find.mockReturnValueOnce(
            querySortLimit([makeHistoryItem()]),
        );

        const history = await listMyAiInteractionHistory(userId, { limit: 5 });

        // O filtro por userId é a prova de ownership no backend, não uma escolha do frontend.
        expect(AiInteractionHistory.find).toHaveBeenCalledWith({ userId });
        expect(history).toHaveLength(1);
        expect(history[0].safeSignals[0].key).toBe("main_goal");
        expect(history[0].userId).toBeUndefined();
        expect(history[0].sessionId).toBeUndefined();
    });

    it("expõe endpoint autenticado sem IDs internos", async () => {
        AiInteractionHistory.find.mockReturnValueOnce(
            querySortLimit([makeHistoryItem()]),
        );

        const response = await request(createApp())
            .get("/api/me/ai-interactions?limit=5")
            .set("Cookie", makeCookie());

        expect(response.status).toBe(200);
        expect(response.body.history).toHaveLength(1);
        expect(response.body.history[0].safeSummary).toContain("Sessão guiada");
        expect(JSON.stringify(response.body)).not.toContain("sessionId");
        expect(JSON.stringify(response.body)).not.toContain("userId");
    });

    it("bloqueia pedido sem autenticação", async () => {
        const response = await request(createApp()).get("/api/me/ai-interactions");

        expect(response.status).toBe(401);
        expect(AiInteractionHistory.find).not.toHaveBeenCalled();
    });
});
```

5. Explicação do código.

Os testes cobrem duas camadas. A camada unitária valida o service: criação minimizada, recusa de conteúdo sensível e DTO público. A camada HTTP valida autenticação e endpoint real. Os negativos mínimos são: conteúdo sensível recusado, pedido sem autenticação bloqueado e impossibilidade de listar outro utilizador porque o filtro é sempre `{ userId: req.user.id }`.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test
```

Se a tua equipa tiver scripts separados, executa também o teste focal:

```bash
npm --prefix apps/api exec vitest run tests/mf8.ai-interaction-history.test.js
```

7. Cenário negativo/erro esperado.

Se o DTO público incluir `userId` ou `sessionId`, o teste HTTP falha ao serializar a resposta e procurar esses campos.

### Passo 10 - Criar smoke de interface e fechar evidência P0

1. Objetivo funcional do passo no contexto da app.

Garantir que a UI está ligada à app, usa o cliente correto e contém estados mínimos para uma validação E2E leve antes da demonstração manual.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/scripts/check-mf8-ai-history-page.mjs`
    - REVER: `apps/web/src/App.jsx`
    - REVER: `apps/web/src/pages/AiHistoryPage.jsx`
    - REVER: `apps/web/src/services/aiInteractionHistoryApi.js`
    - LOCALIZAÇÃO: ficheiro completo do script.

3. Instruções do que fazer.

Cria o script abaixo e executa-o depois do build. Ele não substitui a demonstração manual, mas impede entregar uma página esquecida fora do `App.jsx`.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/scripts/check-mf8-ai-history-page.mjs
/**
 * Smoke E2E leve do BK-MF8-09.
 *
 * Valida que a página de histórico IA está ligada ao App, usa o cliente HTTP
 * correto e apresenta estados essenciais para a demonstração manual.
 */
import { readFile } from "node:fs/promises";

const FILES = {
    // Os caminhos partem do script para o smoke funcionar em qualquer diretoria de execução.
    app: new URL("../src/App.jsx", import.meta.url),
    page: new URL("../src/pages/AiHistoryPage.jsx", import.meta.url),
    api: new URL("../src/services/aiInteractionHistoryApi.js", import.meta.url),
};

/**
 * Confirma que um ficheiro contém uma lista de contratos textuais.
 *
 * @function assertContains
 * @param {string} label - Nome lógico do ficheiro.
 * @param {string} content - Conteúdo lido.
 * @param {string[]} expectedValues - Valores obrigatórios.
 * @returns {void}
 * @throws {Error} Quando algum contrato está ausente.
 */
function assertContains(label, content, expectedValues) {
    const missingValues = expectedValues.filter((value) => !content.includes(value));

    if (missingValues.length > 0) {
        throw new Error(`${label} sem contratos: ${missingValues.join(", ")}`);
    }
}

const [app, page, api] = await Promise.all([
    // A leitura em paralelo acelera o smoke sem alterar o resultado das validações.
    readFile(FILES.app, "utf8"),
    readFile(FILES.page, "utf8"),
    readFile(FILES.api, "utf8"),
]);

// Estes contratos garantem que a página ficou ligada ao App, ao endpoint e aos estados de UI essenciais.
assertContains("App.jsx", app, ["AiHistoryPage", "<AiHistoryPage />"]);
assertContains("AiHistoryPage.jsx", page, [
    "Histórico seguro da interação IA",
    "role=\"alert\"",
    "safeSignals",
    "loadHistory",
]);
assertContains("aiInteractionHistoryApi.js", api, [
    "apiRequest",
    "/me/ai-interactions",
]);

console.log("BK-MF8-09 frontend smoke OK");
```

5. Explicação do código.

O script lê os três pontos de integração da UI e falha se a página não estiver ligada, se não usar o endpoint correto ou se não tiver estado de erro acessível. Isto dá evidência automatizada para o lado frontend sem adicionar dependências novas.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/web run build
node apps/web/scripts/check-mf8-ai-history-page.mjs
```

Depois faz smoke manual com a API ligada: autentica um cliente, abre a app, confirma que a secção de histórico aparece e que o botão "Atualizar histórico" não rebenta a página.

7. Cenário negativo/erro esperado.

Se `<AiHistoryPage />` não estiver no `App.jsx`, o script falha com mensagem sobre contrato ausente.

### Passo 11 - Validar contrato completo e preparar handoff

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com evidência objetiva de unitário, integração, build, smoke E2E leve, negativos e handoff para `BK-MF8-10`.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - REVER: ficheiros criados neste BK
    - LOCALIZAÇÃO: terminal, PR/defesa e relatório técnico da equipa.

3. Instruções do que fazer.

Executa os comandos abaixo a partir da raiz do repo e guarda resultado, diretoria e impacto. Executar cenarios negativos obrigatorios (minimo 3). Se algum comando falhar por ambiente, regista o motivo e não marques como sucesso.

4. Código completo, correto e integrado com a app final.

```bash
rg -n "AiInteractionHistory|aiInteractionHistoryRoutes|AiHistoryPage|/me/ai-interactions" apps/api/src apps/web/src apps/api/tests
npm --prefix apps/api test
npm --prefix apps/web run build
node apps/web/scripts/check-mf8-ai-history-page.mjs
git diff --check
```

5. Explicação do código.

Os comandos provam o BK em camadas. O `rg` confirma presença dos contratos, a suite da API cobre service e endpoint, o build valida frontend, o smoke leve confirma ligação da UI e `git diff --check` evita entregar whitespace problemático.

6. Validação do passo.

A evidência P0 deve conter:

- Unitário: service rejeita conteúdo sensível e devolve DTO público.
- Integração: `GET /api/me/ai-interactions` autentica e filtra por ownership.
- E2E leve: página ligada ao `App.jsx`, cliente HTTP correto e build frontend válido.
- Negativos: conteúdo sensível recusado, pedido sem sessão bloqueado, DTO sem IDs internos.

7. Cenário negativo/erro esperado.

Se os testes passarem mas o build falhar, o BK não está fechado. A feature precisa de API e UI funcionais para ser defensável.

#### Expected results

- O histórico IA fica persistido em `AiInteractionHistory` com campos pessoais cifrados.
- `GET /api/me/ai-interactions` devolve apenas histórico do cliente autenticado.
- O DTO público não expõe `userId`, `sessionId`, `analysisId`, `reportId`, fotografias, consentimentos, prompts, tokens, cookies ou segredos.
- A página `AiHistoryPage` mostra histórico, vazio, loading e erro.
- O `BK-MF8-10` recebe contrato reutilizável para recomendações enriquecidas.

#### Critérios de aceite

- Entrega funcional específica de `Histórico seguro da interação cliente-IA` validada contra `RF47, RNF30`.
- `AiInteractionHistory` existe, cifra campos pessoais e tem índices por ownership/data.
- `recordAiInteractionHistoryEvent` valida tipos fechados, finalidade, resumo, sinais e conteúdo sensível.
- `GET /api/me/ai-interactions` usa `requireAuth` e filtra por `req.user.id`.
- `AiHistoryPage` está ligada ao `App.jsx` e usa `aiInteractionHistoryApi.js`.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).

### Matriz minima de testes por prioridade

- `P0`: unitário + integração + E2E leve/manual + mínimo 3 negativos.
- `P1`: unitário ou integração + smoke principal + mínimo 2 negativos.
- `P2`: teste focal + mínimo 1 negativo.
- `P3`: revisão estrutural + evidência de não regressão quando tocar código.

#### Validação final

- [ ] `rg -n "RF47|RNF30|BK-MF8-09" docs/RF.md docs/RNF.md docs/planificacao/backlogs` confirma contrato canónico.
- [ ] `npm --prefix apps/api test` passa com o teste `mf8.ai-interaction-history`.
- [ ] `npm --prefix apps/web run build` passa.
- [ ] `node apps/web/scripts/check-mf8-ai-history-page.mjs` passa.
- [ ] `git diff --check` passa.
- [ ] O endpoint sem sessão devolve `401`.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] O DTO público não inclui IDs internos.
- [ ] O handoff para `BK-MF8-10` está documentado.

#### Evidence para PR/defesa

- `proof_tecnico`: modelo, service, route, página e testes criados nos caminhos `apps/api` e `apps/web`.
- `proof_unit`: teste de `recordAiInteractionHistoryEvent` com conteúdo válido e conteúdo sensível recusado.
- `proof_integration`: Supertest de `GET /api/me/ai-interactions` autenticado e sem autenticação.
- `proof_e2e`: build Vite, script `check-mf8-ai-history-page.mjs` e smoke manual da secção na app.
- `proof_privacidade`: DTO sem `userId`, `sessionId`, `analysisId` e `reportId`; service com denylist de conteúdo sensível; campos pessoais cifrados.
- `proof_handoff`: `BK-MF8-10` pode usar `listMyAiInteractionHistory(userId)` ou os eventos persistidos para enriquecer recomendações sem criar novo contrato.

#### Handoff

- Próximo BK recomendado: `BK-MF8-10`.
- O `BK-MF8-10` deve reutilizar `listMyAiInteractionHistory(userId)` para ler sinais seguros e cruzá-los com produtos, stock, restrições e explicabilidade.
- O `BK-MF8-10` não deve ler documentos Mongoose completos nem usar IDs internos no frontend.
- Risco a vigiar: qualquer novo evento IA deve passar por `recordAiInteractionHistoryEvent` para manter minimização, cifra e DTO público.

## Bloco pedagogico

Esta secção resume o tutorial linear acima para compatibilidade com o validador documental. A implementação principal continua nos passos técnicos `1..11`.

### Objetivo

Implementar histórico IA minimizado, cifrado e consultável apenas pelo próprio cliente autenticado.

### Pre-requisitos

- `BK-MF8-08` concluído para existir sessão guiada.
- `BK-MF6-07` concluído para reutilizar encriptação em repouso.
- API e frontend a correr com os scripts já existentes em `apps/api` e `apps/web`.

### Erros comuns

- Criar endpoint de escrita público para o browser fabricar histórico.
- Devolver documentos Mongoose completos em vez de DTO público.
- Guardar texto integral de prompts, fotografias, consentimentos ou segredos no histórico.
- Filtrar por `userId` recebido do cliente em vez de `req.user.id`.

### Check de compreensao

- Porque é que `sessionId` fica no modelo mas não aparece no DTO público?
- Porque é que `recordAiInteractionHistoryEvent` é service interno e não route pública?
- Que três negativos provam a segurança mínima deste BK P0?

## Bloco operacional

### Entrada

- Sessão IA submetida pelo `BK-MF8-08`.
- Utilizador autenticado por cookie HttpOnly.
- Eventos minimizados criados por services internos autorizados.

### Passos

1. Confirmar `RF47`, `RNF30` e `BK-MF8-09` nos documentos canónicos.
2. Criar modelo `AiInteractionHistory` com campos cifrados.
3. Criar service de validação, minimização e DTO público.
4. Criar controller e route autenticada.
5. Montar router no `app.js`.
6. Criar cliente HTTP e página React.
7. Ligar página ao `App.jsx`.
8. Criar testes unitários, integração HTTP e smoke de UI.
9. Executar cenarios negativos obrigatorios (minimo 3).

### Validacao

- [ ] `npm --prefix apps/api test` passa ou fica bloqueado por ambiente documentado.
- [ ] `npm --prefix apps/web run build` passa.
- [ ] `node apps/web/scripts/check-mf8-ai-history-page.mjs` passa depois de o aluno criar o ficheiro.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.

### Handoff

`BK-MF8-10` deve consumir apenas sinais seguros do histórico IA e não deve criar contrato paralelo de ownership ou DTO.

## Criterios de aceite

- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada: unitário, integração HTTP e E2E leve/manual para `P0`.
- DTO público sem IDs internos nem dados sensíveis.
- Histórico filtrado por `req.user.id`.
- Handoff para `BK-MF8-10` documentado.

## Evidence para PR/defesa

- Print ou output de `npm --prefix apps/api test`.
- Output de `npm --prefix apps/web run build`.
- Output de `node apps/web/scripts/check-mf8-ai-history-page.mjs`.
- Pedido autenticado `GET /api/me/ai-interactions` com DTO público.
- Negativos documentados: sem sessão, conteúdo sensível recusado e DTO sem IDs internos.

#### Changelog

- `2026-07-02`: guia corrigido para fechar os findings críticos do `BK-MF8-09`, com tutorial executável, modelo cifrado, service, controller, route, frontend, testes P0, negativos e handoff concreto para `BK-MF8-10`.
