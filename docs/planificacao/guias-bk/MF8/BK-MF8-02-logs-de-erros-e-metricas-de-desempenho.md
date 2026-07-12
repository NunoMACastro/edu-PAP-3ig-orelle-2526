# BK-MF8-02 - Logs de erros e métricas de desempenho

## Header
- `doc_id`: `GUIA-BK-MF8-02`
- `bk_id`: `BK-MF8-02`
- `macro`: `MF8`
- `owner`: `Daniel Bulica`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `-`
- `rf_rnf`: `RNF20`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF8-03`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-02-logs-de-erros-e-metricas-de-desempenho.md`
- `last_updated`: `2026-07-10`

> **Contrato vigente:** observabilidade mede liveness em `/api/health/live` e readiness em `/api/health/ready`. `trust proxy` usa apenas a allowlist validada `TRUSTED_PROXY_CIDRS`; nunca usa `1`, `true`, `*` nem confia diretamente em headers encaminhados pelo cliente.

#### Objetivo

Neste BK vais implementar observabilidade segura na API da Orélle: cada pedido recebe um identificador técnico, os erros são registados com campos permitidos, as respostas públicas deixam de expor detalhes sensíveis e os pedidos ficam medidos com métricas simples de duração e estado.

O objetivo não é criar uma plataforma externa de monitorização. O objetivo é deixar a aplicação preparada para investigar falhas de forma responsável, sem copiar pedidos completos, fotografias, relatórios, cookies, tokens, paths internos ou dados pessoais para logs ou respostas.

#### Importância

Na Orélle há fluxos com perfil cosmético, fotografias faciais, relatórios de análise, recomendações, carrinho, encomendas e pagamentos. Quando algo falha, a equipa precisa de saber onde falhou, quanto tempo demorou e se foi erro do cliente, erro interno ou timeout. Mas essa informação tem de ser minimizada.

Um log útil não é um despejo do `req.body`, dos headers ou dos ficheiros. Um log útil é um registo técnico com campos controlados: método HTTP, rota normalizada, estado, duração, nome do erro e `requestId`. Assim, a equipa consegue investigar sem expor dados sensíveis.

#### Scope-in

- Criar um service de observabilidade sem dependências novas.
- Atribuir um `requestId` técnico a cada pedido.
- Medir duração, método, rota normalizada, estado HTTP e estado operacional.
- Sanitizar detalhes públicos de erro antes de responder ao frontend.
- Registar logs de erro com lista fechada de campos permitidos.
- Persistir métricas HTTP minimizadas no modelo `PerformanceMetric` criado em MF6.
- Criar um teste Vitest/Supertest para provar logs seguros, resposta pública segura e métrica minimizada.

#### Scope-out

- Não introduzir Datadog, Sentry, OpenTelemetry, Winston, Pino ou outra dependência externa.
- Não criar dashboard administrativo de métricas.
- Não alterar regras de negócio dos endpoints.
- Não alterar autenticação, autorização, consentimento, ownership, checkout ou providers de IA.
- Não guardar conteúdo de fotografias, relatórios, cookies, headers, tokens, passwords, storage interno ou payloads completos.
- Não usar serviços pagos nem enviar logs para providers externos.

#### Estado antes e depois

- Antes: a API já tem `AppError`, `errorMiddleware`, `PerformanceMetric` e `runWithPerformanceBudget`, mas a resposta pública ainda pode devolver `details` sem sanitização centralizada e não existe um contrato de logs/métricas HTTP para a MF8.
- Depois: cada pedido tem `requestId`, cada erro usa resposta pública segura, os logs têm campos permitidos, as métricas HTTP ficam minimizadas e o teste `mf8.safe-logging.contract.test.js` prova que dados sensíveis não saem na resposta nem no log.

#### Pre-requisitos

- `BK-MF8-01` para mapa modular e disciplina MVC/JSDoc.
- `BK-MF6-01` para o modelo `PerformanceMetric` e o conceito de budget temporal.
- `BK-MF6-07` para a regra de não expor fotografias, relatórios ou storage interno.
- `BK-MF7-03` para sessão autenticada com cookie HttpOnly.
- `apps/api/src/app.js` existente.
- `apps/api/src/middlewares/error.middleware.js` existente.
- `apps/api/src/models/performance-metric.model.js` existente.
- `apps/api/src/services/performance-budget.service.js` existente.
- `apps/api/package.json` com script `test`.

#### Glossário

- Log seguro: registo técnico com campos permitidos, sem dados pessoais, cookies, tokens, imagens, relatórios ou paths internos.
- Métrica: valor mensurável sobre o comportamento do sistema, como duração, método, rota normalizada e estado.
- `requestId`: identificador técnico por pedido. Serve para correlacionar resposta, log e métrica sem expor identidade do utilizador.
- Rota normalizada: rota sem query string e sem IDs reais. Exemplo: `/api/orders/:id` em vez de `/api/orders/66a000000000000000000001`.
- Sanitização: processo de remover ou redigir campos sensíveis antes de responder ao frontend ou escrever logs.
- Estado operacional: classificação simples da resposta: `success`, `client_error`, `error` ou `timeout`.
- Observabilidade minimizada: capacidade de investigar falhas guardando apenas o mínimo necessário.

#### Conceitos teóricos essenciais

Um erro técnico não deve ser mostrado por inteiro ao utilizador. O frontend precisa de uma mensagem clara e de um `requestId`; a equipa técnica precisa do mesmo `requestId` para procurar o log correspondente. O utilizador não precisa de ver stack traces, paths internos, cookies, tokens, storage keys, fotografias, relatórios ou headers.

Um middleware Express é uma função que corre antes ou depois das routes. Neste BK vais usar dois middlewares: um cria o contexto do pedido (`requestId` e tempo inicial) e outro regista a métrica quando a resposta termina. Eles ficam antes das routes para conseguirem observar todos os endpoints.

Um service centraliza regras reutilizáveis. A sanitização de erro, a normalização de rota e o registo de métricas não devem ficar espalhados por controllers. Se cada controller inventar o seu próprio log, a aplicação fica inconsistente e aumenta o risco de fuga de dados.

Uma métrica HTTP deve ser útil sem ser invasiva. Guardar `method`, `route`, `statusCode`, `durationMs` e `status` chega para perceber falhas e lentidão. Guardar `userId`, email, headers, cookies, `req.body`, nomes de ficheiros ou relatório facial seria desnecessário e perigoso.

O backend decide o que pode ser exposto. Mesmo que o frontend esconda mensagens sensíveis, a API tem de sanitizar a resposta antes de a enviar. Esta regra protege todos os clientes da API, não apenas a UI React.

Um teste de observabilidade deve provar dois lados: que há informação suficiente para investigar e que não há dados sensíveis. Por isso, o teste deste BK força erros com detalhes perigosos e confirma que a resposta, o log e a métrica continuam minimizados.

`CANONICO`: `RNF20` pede logs de erros e métricas de desempenho.

`DERIVADO`: o `requestId`, a rota normalizada e o service `observability.service.js` são decisões técnicas mínimas para cumprir `RNF20` sem dependências novas.

#### Arquitetura do BK

- `bk_id`: `BK-MF8-02`
- `flow_id`: `FLOW-MF8-OBSERVABILIDADE`
- `requisitos`: `RNF20`
- `dependências`: `-`
- `tema técnico`: `observabilidade operacional segura`
- `destino dos alunos`: `apps/api`
- `decisão CANONICO`: logs e métricas pertencem à operação da aplicação e suportam o gate de qualidade final.
- `decisão DERIVADO`: os campos guardados na métrica HTTP são `method`, `route`, `statusCode`, `durationMs`, `status` e `budgetMs`, porque são suficientes para investigar sem guardar dados pessoais.

A integração fica assim:

1. `requestContextMiddleware` cria `req.requestId` e `req.requestStartedAt`.
2. `requestMetricsMiddleware` espera pelo fim da resposta e grava uma métrica minimizada.
3. `errorMiddleware` transforma erros em resposta pública segura.
4. `observability.service.js` concentra sanitização, log seguro, normalização de rota e persistência da métrica.
5. `mf8.safe-logging.contract.test.js` prova que o contrato funciona.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/models/performance-metric.model.js`
- CRIAR: `apps/api/src/services/observability.service.js`
- CRIAR: `apps/api/src/middlewares/request-observability.middleware.js`
- EDITAR: `apps/api/src/middlewares/error.middleware.js`
- EDITAR: `apps/api/src/app.js`
- CRIAR: `apps/api/tests/mf8.safe-logging.contract.test.js`
- REVER: `apps/api/src/services/performance-budget.service.js`
- REVER: `apps/api/package.json`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato RNF20 e fronteiras

1. Objetivo funcional do passo no contexto da app.

Confirmar que este BK resolve apenas observabilidade operacional: logs seguros, resposta pública segura e métricas simples. Este passo evita misturar observabilidade com dashboard, autenticação, IA, checkout ou providers externos.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-01-codigo-modular-mvc-com-documentacao-e-docstrings.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-03-ambiente-de-testes-separado-do-ambiente-de-producao.md`
    - LOCALIZAÇÃO: linhas de `RNF20`, linha canónica de `BK-MF8-02` e pré-requisito de `BK-MF8-03`.

3. Instruções do que fazer.

Executa:

```bash
rg -n "RNF20|BK-MF8-02|BK-MF8-03|logs|métricas" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md docs/planificacao/guias-bk/MF8
```

Confirma três factos antes de escrever código:

- `RNF20` é o requisito deste BK.
- `BK-MF8-02` tem prioridade `P1`, sprint `S12` e handoff para `BK-MF8-03`.
- `BK-MF8-03` depende destes logs para separar falhas de teste de falhas de produção.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. A confirmação documental vem primeiro para impedir que a equipa invente dashboard, provider externo ou campos de negócio que não fazem parte de `RNF20`.

6. Validação do passo.

A pesquisa deve mostrar `RNF20`, `BK-MF8-02` e a ligação para `BK-MF8-03`. Se algum destes elementos estiver ausente, regista o bloqueio antes de programar.

7. Cenário negativo/erro esperado.

Se alguém tentar transformar este BK num dashboard de administração ou numa integração externa de observabilidade, está fora do scope. O BK deve ficar limitado à API local, a logs seguros e a métricas minimizadas.

### Passo 2 - Alargar o modelo de métricas sem guardar dados pessoais

1. Objetivo funcional do passo no contexto da app.

Adaptar o modelo `PerformanceMetric`, criado em MF6, para também medir pedidos HTTP. O modelo continua minimizado: guarda rota normalizada, método, estado HTTP, duração e estado operacional, mas não guarda utilizador, headers, cookies, corpo do pedido, fotografias, relatórios nem storage keys.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/models/performance-metric.model.js`
    - REVER: `apps/api/src/services/performance-budget.service.js`
    - LOCALIZAÇÃO: ficheiro completo `apps/api/src/models/performance-metric.model.js`.

3. Instruções do que fazer.

Substitui o conteúdo de `apps/api/src/models/performance-metric.model.js` pelo código abaixo. Mantém o nome `PerformanceMetric`, porque `performance-budget.service.js` já o usa desde MF6.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/performance-metric.model.js
/**
 * Modelo de métricas de performance minimizadas para RNFs da Orélle.
 *
 * A MF6 criou métricas para análise facial. A MF8 reutiliza o mesmo modelo
 * para pedidos HTTP, mantendo fora da base de dados userId, cookies, headers,
 * paths internos, fotografias, relatórios e payloads completos.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const PERFORMANCE_OPERATIONS = Object.freeze({
    FACE_ANALYSIS: "face_analysis",
    HTTP_REQUEST: "http_request",
});

export const PERFORMANCE_STATUSES = Object.freeze({
    SUCCESS: "success",
    CLIENT_ERROR: "client_error",
    ERROR: "error",
    TIMEOUT: "timeout",
});

const performanceMetricSchema = new Schema(
    {
        operation: {
            type: String,
            enum: Object.values(PERFORMANCE_OPERATIONS),
            required: true,
            index: true,
        },
        route: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "system",
        },
        method: {
            type: String,
            enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "SYSTEM"],
            default: "SYSTEM",
        },
        statusCode: {
            type: Number,
            min: 100,
            max: 599,
            default: 200,
        },
        durationMs: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(PERFORMANCE_STATUSES),
            required: true,
            index: true,
        },
        budgetMs: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { timestamps: true },
);

/**
 * Modelo Mongoose de métricas operacionais minimizadas.
 *
 * @type {import("mongoose").Model}
 */
export const PerformanceMetric = model(
    "PerformanceMetric",
    performanceMetricSchema,
);
```

5. Explicação do código.

O ficheiro mantém o modelo existente, mas torna explícitas duas listas fechadas: `PERFORMANCE_OPERATIONS` e `PERFORMANCE_STATUSES`. Isto reduz erros de escrita e impede que cada service invente nomes diferentes para o mesmo tipo de métrica.

`FACE_ANALYSIS` preserva o contrato de MF6, por isso `performance-budget.service.js` continua a funcionar. `HTTP_REQUEST` é a nova operação deste BK. Os campos `route`, `method` e `statusCode` permitem saber que tipo de pedido falhou sem guardar o utilizador nem o payload.

A rota guardada será normalizada no service de observabilidade. Por isso, este modelo pode aceitar `route`, mas não deve receber query strings, ObjectIds reais, nomes de ficheiros nem paths internos. Esta separação evita colocar lógica de sanitização dentro do model.

6. Validação do passo.

Confirma que `apps/api/src/services/performance-budget.service.js` continua a importar `PerformanceMetric` e que nenhum import mudou de nome:

```bash
rg -n "PerformanceMetric|PERFORMANCE_OPERATIONS|PERFORMANCE_STATUSES" apps/api/src/models apps/api/src/services
```

7. Cenário negativo/erro esperado.

Se alguém tentar adicionar `userId`, `email`, `headers`, `cookie`, `body`, `storageKey`, `photoPath` ou `report` ao schema, rejeita a alteração. Esses dados não são necessários para `RNF20` e aumentam o risco de exposição.

### Passo 3 - Criar o service de observabilidade segura

1. Objetivo funcional do passo no contexto da app.

Centralizar as regras de observabilidade: criação de `requestId`, normalização de rota, sanitização de detalhes, construção da resposta pública, log seguro e persistência de métrica HTTP.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/services/observability.service.js`
    - REVER: `apps/api/src/models/performance-metric.model.js`
    - LOCALIZAÇÃO: ficheiro completo `apps/api/src/services/observability.service.js`.

3. Instruções do que fazer.

Cria `apps/api/src/services/observability.service.js` com o código completo abaixo. Não escrevas `req.body`, headers completos, cookies, tokens, paths internos, fotografias ou relatórios no log.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/observability.service.js
/**
 * Service de observabilidade segura para RNF20.
 *
 * Este ficheiro concentra logs e métricas para impedir que controllers e
 * middlewares espalhem regras diferentes ou exponham dados sensíveis.
 */
import { randomUUID } from "node:crypto";
import {
    PerformanceMetric,
    PERFORMANCE_OPERATIONS,
    PERFORMANCE_STATUSES,
} from "../models/performance-metric.model.js";

export const HTTP_REQUEST_BUDGET_MS = 3000;
const REDACTED_VALUE = "[redigido]";
const MAX_ROUTE_LENGTH = 120;
const MAX_DETAIL_DEPTH = 4;
const SENSITIVE_KEY_PATTERN =
    /authorization|cookie|password|token|secret|storage|path|file|photo|image|report|biometric|headers/i;
const SENSITIVE_VALUE_PATTERN =
    /Bearer\s+|orelle_session=|\/Users\/|\/private\/|\.enc|\.png|\.jpg|eyJ/i;

/**
 * Cria um identificador técnico para correlacionar resposta, log e métrica.
 *
 * @function createRequestId
 * @returns {string} UUID aleatório para o pedido atual.
 */
export function createRequestId() {
    return randomUUID();
}

/**
 * Remove IDs reais e query strings de uma rota antes de a guardar.
 *
 * @function getSafeRoute
 * @param {import("express").Request} req - Pedido Express observado.
 * @returns {string} Rota minimizada para logs e métricas.
 */
export function getSafeRoute(req) {
    const rawRoute =
        req.route?.path && req.baseUrl
            ? `${req.baseUrl}${req.route.path}`
            : req.originalUrl?.split("?")[0] ?? "unknown";

    const withoutObjectIds = rawRoute.replace(/[a-f0-9]{24}/gi, ":id");
    const withoutUuid = withoutObjectIds.replace(
        /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
        ":id",
    );
    const withoutNumbers = withoutUuid.replace(/\/\d+(?=\/|$)/g, "/:id");

    // A rota é cortada por defesa extra: logs longos tendem a carregar dados que não pertencem à observabilidade.
    return withoutNumbers.slice(0, MAX_ROUTE_LENGTH);
}

/**
 * Verifica se um valor textual parece conter dados sensíveis.
 *
 * @function isSensitiveText
 * @param {string} value - Texto a avaliar.
 * @returns {boolean} Verdadeiro quando o texto deve ser redigido.
 */
function isSensitiveText(value) {
    return SENSITIVE_VALUE_PATTERN.test(value);
}

/**
 * Sanitiza detalhes que podem ir para a resposta pública.
 *
 * @function sanitizePublicDetails
 * @param {unknown} details - Detalhes recebidos de validators ou services.
 * @param {number} [depth=0] - Profundidade atual da sanitização recursiva.
 * @returns {unknown} Detalhes sem campos sensíveis.
 */
export function sanitizePublicDetails(details, depth = 0) {
    if (details === undefined || details === null) return undefined;
    if (depth > MAX_DETAIL_DEPTH) return REDACTED_VALUE;

    if (typeof details === "string") {
        return isSensitiveText(details) ? REDACTED_VALUE : details;
    }

    if (typeof details === "number" || typeof details === "boolean") {
        return details;
    }

    if (Array.isArray(details)) {
        return details.map((item) => sanitizePublicDetails(item, depth + 1));
    }

    if (typeof details === "object") {
        return Object.fromEntries(
            Object.entries(details).map(([key, value]) => {
                // A chave é analisada antes do valor para bloquear cookies, tokens, paths e ficheiros mesmo que o valor pareça inocente.
                if (SENSITIVE_KEY_PATTERN.test(key)) {
                    return [key, REDACTED_VALUE];
                }

                return [key, sanitizePublicDetails(value, depth + 1)];
            }),
        );
    }

    return undefined;
}

/**
 * Constrói a resposta de erro que pode ser devolvida ao frontend.
 *
 * @function buildPublicErrorResponse
 * @param {{statusCode: number, message: string, details?: unknown, requestId?: string}} options - Dados do erro.
 * @returns {{error: {message: string, requestId: string, details?: unknown}}} Resposta pública minimizada.
 */
export function buildPublicErrorResponse({
    statusCode,
    message,
    details,
    requestId = "sem-request-id",
}) {
    const publicError = {
        message: statusCode >= 500 ? "Erro interno do servidor" : message,
        requestId,
    };
    const safeDetails =
        statusCode >= 500 ? undefined : sanitizePublicDetails(details);

    if (safeDetails !== undefined) {
        publicError.details = safeDetails;
    }

    return { error: publicError };
}

/**
 * Cria uma entrada de log com lista fechada de campos permitidos.
 *
 * @function buildSafeErrorLog
 * @param {{err: Error & {statusCode?: number}, req: import("express").Request, statusCode: number}} options - Erro e pedido.
 * @returns {Record<string, string|number>} Entrada segura para log.
 */
export function buildSafeErrorLog({ err, req, statusCode }) {
    return {
        level: statusCode >= 500 ? "error" : "warn",
        event: "api_error",
        requestId: req.requestId ?? "sem-request-id",
        method: req.method,
        route: getSafeRoute(req),
        statusCode,
        errorName: err.name ?? "Error",
        message: statusCode >= 500 ? "Erro interno do servidor" : err.message,
    };
}

/**
 * Escreve o log seguro.
 *
 * @function writeSafeErrorLog
 * @param {Record<string, string|number>} entry - Entrada já minimizada.
 * @param {{error: (message: string) => void}} [logger=console] - Logger injetável para testes.
 * @returns {void}
 */
export function writeSafeErrorLog(entry, logger = console) {
    logger.error(JSON.stringify(entry));
}

/**
 * Converte um código HTTP num estado operacional simples.
 *
 * @function getMetricStatus
 * @param {number} statusCode - Código HTTP observado.
 * @returns {string} Estado operacional da métrica.
 */
export function getMetricStatus(statusCode) {
    if (statusCode >= 500) return PERFORMANCE_STATUSES.ERROR;
    if (statusCode >= 400) return PERFORMANCE_STATUSES.CLIENT_ERROR;
    return PERFORMANCE_STATUSES.SUCCESS;
}

/**
 * Regista uma métrica HTTP minimizada sem interromper o pedido principal.
 *
 * @async
 * @function recordHttpRequestMetric
 * @param {{method: string, route: string, statusCode: number, durationMs: number}} metric - Métrica observada.
 * @returns {Promise<void>} Promessa resolvida mesmo que a escrita auxiliar falhe.
 */
export async function recordHttpRequestMetric({
    method,
    route,
    statusCode,
    durationMs,
}) {
    try {
        await PerformanceMetric.create({
            operation: PERFORMANCE_OPERATIONS.HTTP_REQUEST,
            method,
            route,
            statusCode,
            durationMs,
            status: getMetricStatus(statusCode),
            budgetMs: HTTP_REQUEST_BUDGET_MS,
        });
    } catch {
        // A observabilidade não pode transformar uma resposta funcional em erro; a falha da métrica fica silenciosa e minimizada.
    }
}
```

5. Explicação do código.

O service cria uma fronteira clara para `RNF20`. `createRequestId` gera um identificador técnico que aparece na resposta e no log. Isto permite investigar uma falha sem mostrar detalhes internos ao utilizador.

`getSafeRoute` remove query strings e substitui IDs por `:id`. Isto evita guardar identificadores reais de encomendas, utilizadores, fotografias ou análises. A rota continua útil para perceber onde a falha ocorreu, mas fica minimizada.

`sanitizePublicDetails` permite manter detalhes simples de validação, como `email: "Email inválido"`, mas redige chaves e valores perigosos. Esta função protege respostas públicas contra fuga de cookies, tokens, paths internos, storage keys, nomes de ficheiros, fotografias, relatórios e dados biométricos.

`buildPublicErrorResponse` impede que erros `500` revelem a mensagem técnica original. Para erros esperados `400`, `401`, `403`, `404` e `409`, a mensagem pode continuar a ser útil para o utilizador, mas os detalhes passam pela sanitização.

`buildSafeErrorLog` e `writeSafeErrorLog` só escrevem campos permitidos. Não há `req.body`, headers, cookies, ficheiros nem dados pessoais. `recordHttpRequestMetric` grava a métrica sem bloquear o pedido: se o MongoDB falhar, a app continua a responder.

6. Validação do passo.

Confirma que o ficheiro exporta as funções usadas pelos próximos passos:

```bash
rg -n "export function (createRequestId|getSafeRoute|sanitizePublicDetails|buildPublicErrorResponse|buildSafeErrorLog|writeSafeErrorLog|recordHttpRequestMetric)" apps/api/src/services/observability.service.js
```

7. Cenário negativo/erro esperado.

Se `sanitizePublicDetails` receber `{ cookie: "orelle_session=abc", imagePath: "/private/frontal.png" }`, a resposta pública deve conter `[redigido]` nesses campos. Se esses valores aparecerem em claro, o BK falhou.

### Passo 4 - Ligar contexto de pedido e métricas HTTP à app

1. Objetivo funcional do passo no contexto da app.

Adicionar middlewares que criam o `requestId`, medem a duração do pedido e gravam a métrica quando a resposta termina. Depois, montar esses middlewares em `createApp` antes das routes.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/middlewares/request-observability.middleware.js`
    - EDITAR: `apps/api/src/app.js`
    - REVER: `apps/api/src/services/observability.service.js`
    - LOCALIZAÇÃO: ficheiro completo `request-observability.middleware.js`, imports e zona inicial de middlewares em `app.js`.

3. Instruções do que fazer.

Cria o middleware abaixo. Depois edita `apps/api/src/app.js` para importar e usar `requestContextMiddleware` e `requestMetricsMiddleware`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/middlewares/request-observability.middleware.js
/**
 * Middlewares de contexto e métricas HTTP para RNF20.
 */
import { performance } from "node:perf_hooks";
import {
    createRequestId,
    getSafeRoute,
    recordHttpRequestMetric,
} from "../services/observability.service.js";

/**
 * Cria contexto mínimo de observabilidade para cada pedido.
 *
 * @function requestContextMiddleware
 * @param {import("express").Request & {requestId?: string, requestStartedAt?: number}} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {void}
 */
export function requestContextMiddleware(req, res, next) {
    req.requestId = createRequestId();
    req.requestStartedAt = performance.now();

    // O header permite ao frontend e à equipa técnica cruzar a resposta com o log sem expor dados pessoais.
    res.set("X-Request-Id", req.requestId);
    next();
}

/**
 * Regista uma métrica quando a resposta HTTP termina.
 *
 * @function requestMetricsMiddleware
 * @param {import("express").Request & {requestStartedAt?: number}} req - Pedido Express.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {void}
 */
export function requestMetricsMiddleware(req, res, next) {
    res.on("finish", () => {
        const startedAt = Number.isFinite(req.requestStartedAt)
            ? req.requestStartedAt
            : performance.now();
        const durationMs = Math.max(
            0,
            Math.round(performance.now() - startedAt),
        );

        // A escrita é auxiliar: o pedido já terminou e não deve voltar atrás por falha na métrica.
        void recordHttpRequestMetric({
            method: req.method,
            route: getSafeRoute(req),
            statusCode: res.statusCode,
            durationMs,
        });
    });

    next();
}
```

Agora substitui `apps/api/src/app.js` por esta versão completa:

```js
// apps/api/src/app.js
/**
 * Fábrica da aplicação Express da Orélle.
 *
 * `createApp` fica separado de `server.js` para permitir que os testes criem a
 * aplicação sem abrir porta TCP nem ligar diretamente ao MongoDB.
 */
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { env, parseTrustedProxyCidrs } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { adminDashboardRoutes } from "./routes/admin-dashboard.routes.js";
import { adminExportRoutes } from "./routes/admin-export.routes.js";
import { adminReviewRoutes } from "./routes/admin-review.routes.js";
import { adminUsersRoutes } from "./routes/admin-users.routes.js";
import { adminProductsRoutes } from "./routes/admin-products.routes.js";
import { adminCategoriesRoutes } from "./routes/admin-categories.routes.js";
import { aiConsultationRoutes } from "./routes/ai-consultation.routes.js";
import { aiConsultationReviewRoutes } from "./routes/ai-consultation-review.routes.js";
import { biometricAuditRoutes } from "./routes/biometric-audit.routes.js";
import { biometricDataRequestRoutes } from "./routes/biometric-data-request.routes.js";
import { cartRoutes } from "./routes/cart.routes.js";
import { catalogRoutes } from "./routes/catalog.routes.js";
import { dailyRoutineRoutes } from "./routes/daily-routine.routes.js";
import { facePhotoRoutes } from "./routes/face-photo.routes.js";
import { faceReportRoutes } from "./routes/face-report.routes.js";
import { makeupSimulationRoutes } from "./routes/makeup-simulation.routes.js";
import { preferencesRoutes } from "./routes/preferences.routes.js";
import { profileRoutes } from "./routes/profile.routes.js";
import { notificationRoutes } from "./routes/notification.routes.js";
import { recommendationRoutes } from "./routes/recommendation.routes.js";
import { orderRoutes } from "./routes/order.routes.js";
import { reorderRoutes } from "./routes/reorder.routes.js";
import { skinComparisonRoutes } from "./routes/skin-comparison.routes.js";
import { skinEvolutionRoutes } from "./routes/skin-evolution.routes.js";
import { skinHistoryRoutes } from "./routes/skin-history.routes.js";
import { stockRoutes } from "./routes/stock.routes.js";
import { routineAlertRoutes } from "./routes/routine-alert.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import {
    enforceHttpsTransport,
    securityTransportHeaders,
} from "./middlewares/security-transport.middleware.js";
import { requestTimeout } from "./middlewares/request-timeout.middleware.js";
import {
    requestContextMiddleware,
    requestMetricsMiddleware,
} from "./middlewares/request-observability.middleware.js";

/**
 * Cria e configura uma instância Express da API Orélle.
 *
 * @function createApp
 * @returns {import("express").Express} Aplicação Express pronta a usar.
 */
export function createApp({
    trustedProxies = env.trustedProxyCidrs,
    readinessCheck = () => mongoose.connection.readyState === 1,
} = {}) {
    const app = express();
    const validatedTrustedProxies = parseTrustedProxyCidrs(
        trustedProxies.join(","),
    );

    app.set(
        "trust proxy",
        validatedTrustedProxies.length > 0 ? validatedTrustedProxies : false,
    );

    app.use(requestContextMiddleware);
    app.use(securityTransportHeaders);
    app.use(enforceHttpsTransport);
    app.use(requestTimeout());
    app.use(requestMetricsMiddleware);
    app.use(cors({ origin: env.clientOrigins, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());

    // Liveness recebe requestId/métrica, mas não consulta dependências.
    app.get("/api/health/live", (req, res) => {
        res.json({ status: "ok", app: "orelle", checks: { http: "ok" } });
    });

    // Readiness pode ficar vermelho sem expor URI, host ou credenciais MongoDB.
    app.get("/api/health/ready", async (req, res) => {
        const mongoReady = await readinessCheck();
        res.status(mongoReady ? 200 : 503).json({
            status: mongoReady ? "ready" : "not_ready",
            app: "orelle",
            checks: { mongodb: mongoReady ? "ok" : "unavailable" },
        });
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/profile", profileRoutes);
    app.use("/api/preferences", preferencesRoutes);
    app.use("/api/catalog", catalogRoutes);
    app.use("/api", facePhotoRoutes);
    app.use("/api", faceReportRoutes);
    app.use("/api", aiConsultationRoutes);
    app.use("/api", skinHistoryRoutes);
    app.use("/api", skinEvolutionRoutes);
    app.use("/api", recommendationRoutes);
    app.use("/api", dailyRoutineRoutes);
    app.use("/api", aiConsultationReviewRoutes);
    app.use("/api", makeupSimulationRoutes);
    app.use("/api", skinComparisonRoutes);
    app.use("/api", biometricDataRequestRoutes);
    app.use("/api", cartRoutes);
    app.use("/api", orderRoutes);
    app.use("/api", reorderRoutes);
    app.use("/api", notificationRoutes);
    app.use("/api", routineAlertRoutes);
    app.use("/api/admin", adminUsersRoutes);
    app.use("/api/admin", adminReviewRoutes);
    app.use("/api/admin", adminExportRoutes);
    app.use("/api/admin", adminProductsRoutes);
    app.use("/api/admin", adminCategoriesRoutes);
    app.use("/api/admin", adminDashboardRoutes);
    app.use("/api/admin", stockRoutes);
    app.use("/api/admin", biometricAuditRoutes);

    app.use(errorMiddleware);

    return app;
}
```

5. Explicação do código.

`requestContextMiddleware` corre antes dos restantes middlewares para garantir que até erros de HTTPS, timeout, JSON inválido ou autorização têm `requestId`. Esse identificador vai no header `X-Request-Id`, que o frontend pode mostrar numa mensagem de suporte sem revelar dados internos.

`requestMetricsMiddleware` regista a métrica no evento `finish`, quando o Express já sabe o `statusCode`. A função usa `void recordHttpRequestMetric(...)` porque a gravação é auxiliar. Se a métrica falhar, o pedido não deve falhar depois de já estar respondido.

Em `app.js`, o contexto vem primeiro, depois segurança/HTTPS/timeout, depois a métrica, CORS, JSON, cookies e routes. Esta ordem preserva os contratos anteriores e acrescenta observabilidade sem duplicar endpoints.

6. Validação do passo.

Confirma que `app.js` importa e usa os dois middlewares:

```bash
rg -n "requestContextMiddleware|requestMetricsMiddleware" apps/api/src/app.js apps/api/src/middlewares/request-observability.middleware.js
```

7. Cenário negativo/erro esperado.

Se `requestMetricsMiddleware` for montado depois das routes, algumas respostas podem não gerar métrica. Se `requestContextMiddleware` for montado tarde demais, erros de segurança podem sair sem `requestId`.

### Passo 5 - Tornar o middleware de erro público e seguro

1. Objetivo funcional do passo no contexto da app.

Alterar `errorMiddleware` para usar a sanitização centralizada, escrever log seguro e devolver `requestId` ao frontend. Este passo fecha o risco de devolver `details` com dados sensíveis.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/middlewares/error.middleware.js`
    - REVER: `apps/api/src/services/observability.service.js`
    - LOCALIZAÇÃO: ficheiro completo `apps/api/src/middlewares/error.middleware.js`.

3. Instruções do que fazer.

Substitui `apps/api/src/middlewares/error.middleware.js` pelo código abaixo. Mantém `AppError`, porque os services e validators anteriores já dependem dele.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/middlewares/error.middleware.js
/**
 * Middleware de erros partilhado pela API Orélle.
 *
 * A API usa `AppError` para erros esperados, como dados inválidos, falta de
 * sessão ou permissões insuficientes. Erros inesperados devolvem mensagem
 * genérica e requestId, sem detalhes internos.
 */
import {
    buildPublicErrorResponse,
    buildSafeErrorLog,
    writeSafeErrorLog,
} from "../services/observability.service.js";

/**
 * Erro controlado da aplicação.
 *
 * @class
 * @extends Error
 */
export class AppError extends Error {
    /**
     * Cria um erro HTTP previsível para controllers e validators.
     *
     * @param {number} statusCode - Código HTTP a devolver ao cliente.
     * @param {string} message - Mensagem segura para o cliente.
     * @param {Record<string, unknown>|undefined} [details] - Detalhes de validação.
     */
    constructor(statusCode, message, details = undefined) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.details = details;
    }
}

/**
 * Converte erros da aplicação numa resposta JSON uniforme e segura.
 *
 * @function errorMiddleware
 * @param {Error & {statusCode?: number, details?: unknown, code?: string}} err - Erro recebido.
 * @param {import("express").Request & {requestId?: string}} req - Pedido Express original.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {import("express").Response|void} Resposta JSON ou delegação se headers já foram enviados.
 */
export function errorMiddleware(err, req, res, next) {
    if (res.headersSent) return next(err);

    const statusCode = err.statusCode ?? 500;
    const errorDetails = err.details;
    const message =
        statusCode === 500 ? "Erro interno do servidor" : err.message;

    // O log recebe apenas campos permitidos; nunca recebe req.body, headers, cookies, ficheiros ou dados biométricos.
    writeSafeErrorLog(buildSafeErrorLog({ err, req, statusCode }));

    return res.status(statusCode).json(
        buildPublicErrorResponse({
            statusCode,
            message,
            details: errorDetails,
            requestId: req.requestId,
        }),
    );
}
```

5. Explicação do código.

`AppError` continua igual no contrato público: services e validators podem lançar `new AppError(statusCode, message, details)`. A diferença é que `details` já não vai diretamente para o JSON. Primeiro passa por `buildPublicErrorResponse`, que redige campos sensíveis.

O boundary Busboy converte limites, campos inesperados, multipart inválido e aborts em `AppError(400, mensagemSegura)` antes de chegar aqui. O middleware global não depende do tipo de erro de uma biblioteca de upload e nunca inclui paths temporários ou detalhes do parser na resposta.

`writeSafeErrorLog(buildSafeErrorLog(...))` escreve só campos permitidos. O middleware não faz `console.error(err)`, porque isso poderia revelar stack trace, path interno ou dados sensíveis. Para erros `500`, a mensagem pública e a mensagem de log ficam genéricas.

6. Validação do passo.

Confirma que `errorMiddleware` deixou de devolver `details: err.details` diretamente:

```bash
rg -n "details: err\\.details|buildPublicErrorResponse|buildSafeErrorLog" apps/api/src/middlewares/error.middleware.js
```

O primeiro padrão (`details: err.details`) não deve aparecer. Os dois restantes devem aparecer.

7. Cenário negativo/erro esperado.

Se um validator lançar `new AppError(400, "Dados inválidos", { cookie: "orelle_session=abc" })`, a resposta pública deve devolver `cookie: "[redigido]"`. Se devolver o cookie real, o BK falhou.

### Passo 6 - Criar teste focal de logs seguros e métricas

1. Objetivo funcional do passo no contexto da app.

Criar um teste executável que prova o contrato de `RNF20`: resposta pública com `requestId`, logs sem dados sensíveis e métrica HTTP minimizada.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.safe-logging.contract.test.js`
    - REVER: `apps/api/src/services/observability.service.js`
    - REVER: `apps/api/src/middlewares/error.middleware.js`
    - REVER: `apps/api/src/middlewares/request-observability.middleware.js`
    - LOCALIZAÇÃO: ficheiro completo `apps/api/tests/mf8.safe-logging.contract.test.js`.

3. Instruções do que fazer.

Cria o teste abaixo. Ele usa Supertest para atravessar middlewares reais e usa `vi.mock` apenas para impedir escrita real na base de dados durante o teste.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.safe-logging.contract.test.js
/**
 * Testes MF8/BK-MF8-02 para logs seguros e métricas minimizadas.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { AppError, errorMiddleware } from "../src/middlewares/error.middleware.js";
import {
    requestContextMiddleware,
    requestMetricsMiddleware,
} from "../src/middlewares/request-observability.middleware.js";

const mocks = vi.hoisted(() => ({
    metricCreate: vi.fn(),
}));

vi.mock("../src/models/performance-metric.model.js", () => ({
    PERFORMANCE_OPERATIONS: Object.freeze({
        FACE_ANALYSIS: "face_analysis",
        HTTP_REQUEST: "http_request",
    }),
    PERFORMANCE_STATUSES: Object.freeze({
        SUCCESS: "success",
        CLIENT_ERROR: "client_error",
        ERROR: "error",
        TIMEOUT: "timeout",
    }),
    PerformanceMetric: {
        create: mocks.metricCreate,
    },
}));

/**
 * Cria uma app mínima para forçar erros controlados.
 *
 * @function createFailingApp
 * @param {Error} error - Erro a enviar para o middleware.
 * @returns {import("express").Express} App Express de teste.
 */
function createFailingApp(error) {
    const app = express();

    app.use(requestContextMiddleware);
    app.use(requestMetricsMiddleware);
    app.get("/api/mf8-error/:id", (req, res, next) => {
        // A rota contém um ID para provar que a métrica normaliza identificadores.
        next(error);
    });
    app.use(errorMiddleware);

    return app;
}

/**
 * Lê a última entrada escrita em console.error durante o teste.
 *
 * @function readLastLog
 * @param {ReturnType<typeof vi.spyOn>} spy - Espião de console.error.
 * @returns {Record<string, unknown>} Entrada de log convertida de JSON.
 */
function readLastLog(spy) {
    const lastCall = spy.mock.calls.at(-1)?.[0] ?? "{}";
    return JSON.parse(lastCall);
}

beforeEach(() => {
    mocks.metricCreate.mockReset();
});

describe("BK-MF8-02 - logs seguros e métricas", () => {
    it("sanitiza detalhes públicos e escreve log sem dados sensíveis", async () => {
        const logSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        const app = createFailingApp(
            new AppError(400, "Dados inválidos", {
                field: "nome",
                cookie: "orelle_session=abc",
                imagePath: "/private/uploads/frontal.png",
                token: "Bearer segredo",
            }),
        );

        const response = await request(app)
            .get("/api/mf8-error/66a000000000000000000001")
            .set("Cookie", "orelle_session=valor-sensivel");

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("Dados inválidos");
        expect(response.body.error.requestId).toEqual(expect.any(String));
        expect(response.body.error.details).toEqual({
            field: "nome",
            cookie: "[redigido]",
            imagePath: "[redigido]",
            token: "[redigido]",
        });

        const responseText = JSON.stringify(response.body);
        expect(responseText).not.toContain("orelle_session=abc");
        expect(responseText).not.toContain("/private/uploads/frontal.png");
        expect(responseText).not.toContain("Bearer segredo");

        const safeLog = readLastLog(logSpy);
        expect(safeLog).toMatchObject({
            event: "api_error",
            method: "GET",
            route: "/api/mf8-error/:id",
            statusCode: 400,
            message: "Dados inválidos",
        });
        expect(JSON.stringify(safeLog)).not.toContain("orelle_session");
        expect(JSON.stringify(safeLog)).not.toContain("/private");
        expect(JSON.stringify(safeLog)).not.toContain("Bearer");

        logSpy.mockRestore();
    });

    it("mantém erros internos genéricos para o frontend e para o log", async () => {
        const logSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        const app = createFailingApp(
            new Error("Falha em /srv/orelle/internal/token.txt"),
        );

        const response = await request(app).get(
            "/api/mf8-error/66a000000000000000000002",
        );

        expect(response.status).toBe(500);
        expect(response.body.error.message).toBe("Erro interno do servidor");
        expect(response.body.error.requestId).toEqual(expect.any(String));
        expect(response.body.error.details).toBeUndefined();
        expect(JSON.stringify(response.body)).not.toContain("/srv/orelle");
        expect(JSON.stringify(response.body)).not.toContain("token.txt");

        const safeLog = readLastLog(logSpy);
        expect(safeLog.message).toBe("Erro interno do servidor");
        expect(JSON.stringify(safeLog)).not.toContain("/srv/orelle");
        expect(JSON.stringify(safeLog)).not.toContain("token.txt");

        logSpy.mockRestore();
    });

    it("regista métrica HTTP minimizada sem guardar payload ou cookies", async () => {
        const response = await request(createApp()).get("/api/health/live");

        expect(response.status).toBe(200);
        expect(response.headers["x-request-id"]).toEqual(expect.any(String));
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "http_request",
                method: "GET",
                route: "/api/health/live",
                statusCode: 200,
                status: "success",
                budgetMs: 3000,
            }),
        );

        const metric = mocks.metricCreate.mock.calls.at(-1)?.[0];
        expect(metric.durationMs).toEqual(expect.any(Number));
        expect(JSON.stringify(metric)).not.toContain("orelle_session");
        expect(JSON.stringify(metric)).not.toContain("password");
        expect(JSON.stringify(metric)).not.toContain("storageKey");
    });
});
```

5. Explicação do código.

O teste cria uma app mínima para controlar o erro lançado. Assim, consegues testar o middleware de erro sem depender de um endpoint de negócio específico.

O primeiro teste força um `AppError` com detalhes perigosos: cookie, path de imagem e token. A resposta deve manter apenas `field: "nome"` e redigir os campos sensíveis. O log também é lido como JSON para confirmar que contém rota, método, status e mensagem segura, mas não contém valores sensíveis.

O segundo teste força um erro interno com path local no texto. O utilizador deve receber apenas `"Erro interno do servidor"`, sem detalhes. O log também fica genérico, porque logs de produção não devem copiar mensagens internas com paths ou nomes de ficheiros.

O terceiro teste atravessa `createApp()` e confirma que um pedido real a `/api/health/live` cria métrica `http_request`. Readiness deve ter um teste separado para `200/503`. As métricas guardam método, rota, status e duração, mas não guardam cookies, passwords, URI MongoDB ou storage keys.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- tests/mf8.safe-logging.contract.test.js
```

Depois executa a suíte completa:

```bash
npm --prefix apps/api test
```

7. Cenário negativo/erro esperado.

Se comentares a chamada a `sanitizePublicDetails`, o primeiro teste deve falhar porque a resposta pública volta a expor cookie, token ou path de imagem. Se comentares `requestMetricsMiddleware` em `app.js`, o terceiro teste deve falhar porque a métrica deixa de ser criada.

### Passo 7 - Validar comandos finais e preparar handoff

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com evidence executável e deixar `BK-MF8-03` preparado para usar logs e métricas ao separar ambiente de teste e produção.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - REVER: `apps/api/tests/mf8.safe-logging.contract.test.js`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-03-ambiente-de-testes-separado-do-ambiente-de-producao.md`
    - LOCALIZAÇÃO: scripts reais e evidence do PR/defesa.

3. Instruções do que fazer.

Executa os comandos reais existentes no projeto:

```bash
npm --prefix apps/api test -- tests/mf8.safe-logging.contract.test.js
npm --prefix apps/api test
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
git diff --check
```

Executar cenários negativos obrigatórios (mínimo 2): erro com dados sensíveis e erro interno com path local.

Regista na evidence:

- comando executado;
- diretoria;
- resultado observado;
- prints ou output relevante;
- dois negativos: erro com dados sensíveis e erro interno com path local;
- confirmação de que `BK-MF8-03` pode usar `requestId`, logs seguros e métricas para diagnosticar falhas.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. A validação final existe para provar que os ficheiros criados nos passos anteriores funcionam juntos e que o contrato de observabilidade não ficou apenas documental.

6. Validação do passo.

O BK só pode ser fechado quando:

- o teste focal `mf8.safe-logging.contract.test.js` passa;
- a suíte API passa ou fica com bloqueio ambiental documentado;
- o build web passa;
- a planificação continua válida;
- `git diff --check` não encontra erros de whitespace;
- a pesquisa estática não encontra caminhos privados nem linguagem proibida nos BKs.

7. Cenário negativo/erro esperado.

Se a suíte API falhar com `listen EPERM` dentro do sandbox, isso indica limitação ambiental de Supertest. Repete a execução fora do sandbox e regista os dois resultados. Se falhar fora do sandbox, trata como regressão real.

#### Expected results

- `GET /api/health/live` devolve `200` e header `X-Request-Id`.
- `GET /api/health/ready` devolve `200` quando MongoDB está pronta e `503` sanitizado quando indisponível.
- Erros `400` devolvem mensagem segura, `requestId` e detalhes sanitizados.
- Erros `500` devolvem `"Erro interno do servidor"` e `requestId`, sem detalhes internos.
- Logs de erro têm apenas `level`, `event`, `requestId`, `method`, `route`, `statusCode`, `errorName` e `message`.
- Métricas HTTP guardam `operation`, `method`, `route`, `statusCode`, `durationMs`, `status` e `budgetMs`.
- A rota da métrica fica normalizada, por exemplo `/api/mf8-error/:id`.
- Nenhum log, resposta ou métrica guarda password, token, cookie, header completo, fotografia, relatório, path interno, storage key ou payload completo.
- O `BK-MF8-03` pode usar `requestId` e métricas para distinguir falhas de teste, ambiente e produção.

#### Critérios de aceite

- `RNF20` fica implementável com código completo no guia.
- `apps/api/src/models/performance-metric.model.js` preserva `face_analysis` e acrescenta `http_request`.
- `apps/api/src/services/observability.service.js` centraliza sanitização, log seguro e métrica.
- `apps/api/src/middlewares/request-observability.middleware.js` cria `requestId` e regista métrica no fim da resposta.
- `apps/api/src/middlewares/error.middleware.js` deixa de devolver `details: err.details` diretamente.
- `apps/api/src/app.js` monta os middlewares de observabilidade antes das routes.
- `apps/api/tests/mf8.safe-logging.contract.test.js` prova os cenários positivos e negativos.
- Cenários negativos concluídos: mínimo `2` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P1`).
- ### Matriz minima de testes por prioridade
- Testes por prioridade respeitados: `P0` exige unit + integration + e2e + 3 negativos; `P1` exige unit/integration + 2 negativos; `P2` exige teste focal + 1 negativo.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisão técnica e defesa PAP.

#### Validação final

- [ ] `npm --prefix apps/api test -- tests/mf8.safe-logging.contract.test.js`
- [ ] `npm --prefix apps/api test`
- [ ] `npm --prefix apps/web run build`
- [ ] `bash scripts/validate-planificacao.sh`
- [ ] `git diff --check`
- [ ] Negativos: mínimo `2` cenários com resultado controlado.
- [ ] Pesquisa estática sem caminhos privados nos BKs MF8.
- [ ] Pesquisa estática sem linguagem interna, marcadores por preencher, storage inseguro ou claims proibidos nos BKs MF8.
- [ ] Resposta pública de erro não expõe cookies, tokens, paths, fotografias, relatórios ou storage keys.
- [ ] Métrica HTTP não guarda dados pessoais nem payloads completos.
- [ ] Handoff para `BK-MF8-03` documentado.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite`, `## Evidence para PR/defesa`.

#### Evidence para PR/defesa

- `pr`: referência de commit/PR e resumo técnico da alteração.
- `proof_tecnico`: output do teste `mf8.safe-logging.contract.test.js`.
- `proof_api`: output da suíte `npm --prefix apps/api test`.
- `proof_web`: output de `npm --prefix apps/web run build`.
- `proof_negativos`: erro com cookie/token/path redigido; erro interno com mensagem genérica.
- `proof_privacidade`: confirmação de que resposta, log e métrica não expõem dados sensíveis.
- `proof_handoff`: nota curta a explicar como `BK-MF8-03` usa `requestId`, logs e métricas para diagnosticar falhas em ambiente de teste.

#### Handoff

- Próximo BK recomendado: `BK-MF8-03`
- O `BK-MF8-03` deve usar o `requestId` e as métricas HTTP deste BK para provar que testes correm em ambiente separado e que falhas de teste não são confundidas com falhas de produção.
- O `BK-MF8-15` deve incluir o teste `mf8.safe-logging.contract.test.js` no inventário final de cobertura.
- O `BK-MF8-16` deve guardar evidence da execução completa, incluindo o teste focal de observabilidade.
- O `BK-MF8-17` deve usar `requestId` e logs seguros para documentar correções sem colar payloads ou dados sensíveis no relatório de erros.

#### Changelog

- `2026-07-10`: app do tutorial alinhada à allowlist CIDR de proxy e aos endpoints live/ready, com métricas separadas.
- `2026-07-01`: guia corrigido para `RNF20`, com código completo para observabilidade segura, métrica HTTP minimizada, resposta pública sanitizada, log seguro, teste Vitest/Supertest e handoff verificável para `BK-MF8-03`.
- `2026-06-30`: guia revisto para a estrutura tutorial MF8, com caminhos públicos `apps/...`, contrato de evidence, negativos mínimos e handoff explícito.
- `2026-07-10`: tratamento de erros de upload alinhado com o boundary Busboy, que normaliza limites e aborts para `AppError` seguro e garante cleanup dos temporários.
