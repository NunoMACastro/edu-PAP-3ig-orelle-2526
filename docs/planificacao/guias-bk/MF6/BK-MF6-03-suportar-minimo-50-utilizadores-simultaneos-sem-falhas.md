# BK-MF6-03 - Suportar mínimo 50 utilizadores simultâneos sem falhas

## Header
- `doc_id`: `GUIA-BK-MF6-03`
- `bk_id`: `BK-MF6-03`
- `macro`: `MF6`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `-`
- `rf_rnf`: `RNF07`
- `fase_documental`: `Fase 3`
- `sprint`: `S10-S11`
- `core_or_reforco`: `Core`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF6-04`
- `guia_path`: `docs/planificacao/guias-bk/MF6/BK-MF6-03-suportar-minimo-50-utilizadores-simultaneos-sem-falhas.md`
- `last_updated`: `2026-06-23`

#### Objetivo

Neste BK vais preparar a API da Orélle para demonstrar que responde de forma estável a 50 pedidos simultâneos, cumprindo `RNF07`.

No fim, a API terá um timeout transversal por pedido, um `health check` leve e um script local que dispara 50 pedidos concorrentes contra `GET /api/health` sem criar dados, sem contornar autenticação e sem expor informação pessoal, biométrica ou comercial sensível.

#### Importância

Escalabilidade, numa PAP, não significa criar uma infraestrutura empresarial. Significa provar que a aplicação falha de forma controlada e continua previsível quando várias pessoas usam a loja, a análise facial, as recomendações e o checkout no mesmo período.

Este BK é `CORE-HIBRIDO` porque a estabilidade protege os dois eixos da Orélle: consultoria inteligente e conversão comercial. Se a API bloquear sob carga, o cliente perde confiança no relatório, nas recomendações e no carrinho.

#### Scope-in

- Criar middleware de timeout por pedido em `apps/api`.
- Aplicar o timeout antes das rotas funcionais.
- Reforçar `GET /api/health` com resposta técnica leve.
- Criar testes focados para health check, endpoint protegido sem sessão e rota lenta.
- Criar script local de 50 pedidos concorrentes.
- Definir evidence de sucesso e cenários negativos para `RNF07`.

#### Scope-out

- Não criar cluster Node, filas distribuídas, autoscaling ou cache distribuída.
- Não instalar ferramenta externa de carga.
- Não executar carga contra produção por defeito.
- Não remover autenticação, autorização, ownership, consentimento ou validação backend para o teste passar.
- Não chamar endpoints que criem encomendas, carrinhos, fotografias, relatórios ou recomendações reais durante o smoke.
- Não guardar cookies, tokens, imagens, relatórios, nomes de clientes, IDs reais ou detalhes de compra na evidence.

#### Estado antes e depois

- Antes: a API tem um `health check` simples, mas não existe timeout transversal nem evidence objetiva de 50 pedidos concorrentes.
- Depois: a API limita pedidos lentos, mantém resposta leve de saúde e permite executar um smoke local de 50 pedidos simultâneos com resumo minimizado.

#### Pre-requisitos

- `RNF07`: mínimo de 50 utilizadores simultâneos sem falhas.
- `BK-MF6-01`: disciplina de performance no backend.
- `BK-MF6-02`: lista de páginas principais usadas como referência de estabilidade.
- `apps/api/src/app.js`: fábrica Express onde as rotas são montadas.
- `apps/api/src/middlewares/error.middleware.js`: erro controlado e resposta segura.
- `apps/api/package.json`: script `test` com Vitest.

#### Glossário

- Concorrência: vários pedidos HTTP em curso ao mesmo tempo.
- Utilizador simultâneo: nesta validação, uma unidade simulada por um pedido concorrente leve.
- Timeout por pedido: limite de tempo para devolver resposta controlada quando uma rota fica demasiado lenta.
- Health check: endpoint simples que prova que a API está viva sem consultar dados sensíveis.
- Smoke de carga: verificação pequena e repetível que dá confiança, sem substituir testes profissionais de stress.
- Evidence minimizada: prova técnica que contém apenas contagens, tempos e estados, sem dados de utilizador.

#### Conceitos teóricos essenciais

`RNF07` é um requisito de escalabilidade. A decisão canónica é o número 50: a aplicação deve suportar pelo menos 50 utilizadores simultâneos sem falhas. Neste BK, isso é demonstrado com 50 pedidos concorrentes leves contra a API local.

Um teste de concorrência não deve criar dados reais nem enfraquecer segurança. Por isso, o smoke principal usa `GET /api/health`: é público, barato e não lê fotografias, relatórios, carrinho, encomendas, perfil cosmético nem recomendações. Endpoints protegidos continuam protegidos e são validados separadamente com cenário negativo.

Um timeout por pedido evita que uma rota lenta deixe o cliente à espera sem fim. Isto não resolve todos os problemas de escala nem cancela automaticamente trabalho assíncrono que já começou. Por isso, além da resposta `503`, as rotas ou services lentos devem verificar se o pedido já excedeu o orçamento antes de tentar enviar uma resposta tardia ou continuar trabalho sensível.

Backend, testes e evidence trabalham juntos:

- o middleware aplica a regra;
- o `app.js` liga a regra à API real;
- o teste confirma saúde, bloqueio sem sessão e timeout;
- o script prova 50 pedidos concorrentes;
- a evidence regista só dados técnicos.

`CANONICO`: `RNF07` define o alvo de 50 utilizadores simultâneos; `BK-MF6-03` é `P1`, `Core`, `CORE-HIBRIDO`, `S10-S11` e prepara `BK-MF6-04`.

`DERIVADO`: `DEFAULT_REQUEST_TIMEOUT_MS = 8_000`, `GET /api/health`, `check-mf6-concurrency.mjs` e a representação de 1 pedido concorrente como 1 utilizador simulado são decisões técnicas mínimas para validar o requisito na stack Express atual.

Erros comuns que este BK evita: testar carga apenas no browser, usar endpoints que criam dados, executar carga contra ambiente remoto por engano, considerar API desligada como sucesso, remover autenticação para facilitar o teste e guardar dados sensíveis em outputs de prova.

#### Arquitetura do BK

- `apps/api/src/middlewares/request-timeout.middleware.js`: cria middleware Express de timeout controlado.
- `apps/api/src/app.js`: aplica o middleware antes das rotas e reforça `GET /api/health`.
- `apps/api/tests/mf6.concurrency.test.js`: valida health check, endpoint protegido sem sessão e timeout.
- `apps/api/scripts/check-mf6-concurrency.mjs`: executa 50 pedidos concorrentes locais.
- `apps/api/src/server.js`: fica apenas como ponto de arranque HTTP.
- `apps/api/package.json`: mantém `npm --prefix apps/api test` como validação principal.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/src/middlewares/request-timeout.middleware.js`
- EDITAR: `apps/api/src/app.js`
- CRIAR: `apps/api/tests/mf6.concurrency.test.js`
- CRIAR: `apps/api/scripts/check-mf6-concurrency.mjs`
- REVER: `apps/api/src/server.js`
- REVER: `apps/api/package.json`
- REVER: `docs/RNF.md`

#### Tutorial técnico linear

### Passo 1 - Confirmar o contrato RNF07 e os limites do smoke

1. Objetivo funcional do passo no contexto da app.

Confirmar que este BK valida estabilidade mínima sob 50 pedidos simultâneos sem alterar contratos funcionais da Orélle.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
    - REVER: `docs/planificacao/guias-bk/MF6/BK-MF6-02-paginas-principais-devem-carregar-em-3-segundos.md`
    - LOCALIZAÇÃO: entradas `RNF07`, `BK-MF6-03` e handoff de `BK-MF6-02`.

3. Instruções do que fazer.

Regista no teu caderno técnico que o smoke principal usa `GET /api/health` porque é leve e não cria dados. Regista também que endpoints protegidos continuam a exigir sessão; o objetivo é provar estabilidade sem enfraquecer privacidade, consentimento, roles ou ownership.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Este passo não cria código porque fixa a fronteira do requisito. Antes de escrever middleware ou script, tens de saber que o teste de carga não pode comprar produtos, enviar fotografias, gerar relatórios nem consultar dados privados.

6. Validação do passo.

Confirma que consegues explicar estas duas frases:

- `RNF07` pede estabilidade com 50 utilizadores simultâneos.
- O smoke deste BK usa 50 pedidos técnicos leves para validar a base da API sem dados reais.

7. Cenário negativo/erro esperado.

Se escolheres um endpoint que cria encomendas ou processa fotografias para simular carga, a evidence fica insegura e deixa de ser adequada para uma PAP.

### Passo 2 - Criar middleware de timeout por pedido

1. Objetivo funcional do passo no contexto da app.

Impedir que pedidos lentos fiquem presos indefinidamente e consumam recursos da API.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/middlewares/request-timeout.middleware.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria um middleware pequeno, sem dependências novas. O middleware deve encaminhar um `AppError` para o tratamento central, assinalar no `req` que o pedido excedeu o tempo máximo e limpar sempre o temporizador quando a resposta termina.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/middlewares/request-timeout.middleware.js
import { AppError } from "./error.middleware.js";

export const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;

/**
 * Marca o pedido como expirado e permite que rotas lentas parem de responder tarde.
 *
 * @function markRequestTimedOut
 * @param {import("express").Request & {requestTimedOut?: boolean, hasRequestTimedOut?: () => boolean}} req - Pedido Express atual.
 * @returns {void}
 */
function markRequestTimedOut(req) {
    req.requestTimedOut = true;
}

/**
 * Cria middleware Express que limita a duração máxima de cada pedido.
 *
 * @function requestTimeout
 * @param {number} [timeoutMs=DEFAULT_REQUEST_TIMEOUT_MS] - Tempo máximo permitido por pedido HTTP.
 * @returns {import("express").RequestHandler} Middleware que encaminha erro 503 quando a rota demora demasiado.
 */
export function requestTimeout(timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
    return (req, res, next) => {
        req.requestTimedOut = false;
        req.hasRequestTimedOut = () => req.requestTimedOut === true;

        const timer = setTimeout(() => {
            markRequestTimedOut(req);

            if (!res.headersSent) {
                // A mensagem é genérica para não revelar rota interna, query, stack trace ou dados do utilizador.
                next(new AppError(503, "Pedido demorou demasiado. Tenta novamente."));
            }
        }, timeoutMs);

        // Limpar o temporizador evita trabalho pendente depois de respostas rápidas ou ligações fechadas.
        res.on("finish", () => clearTimeout(timer));
        res.on("close", () => clearTimeout(timer));

        next();
    };
}
```

5. Explicação do código.

O middleware cria um temporizador para cada pedido. Se a rota responder a tempo, `finish` ou `close` limpa o temporizador. Se a rota ultrapassar o limite, o middleware marca `req.requestTimedOut = true` e chama `next` com `AppError(503, ...)`, deixando o `errorMiddleware` gerar a resposta JSON segura.

O método `req.hasRequestTimedOut()` é uma guarda didática para rotas ou testes lentos. Ele não cancela automaticamente uma query, upload ou chamada externa já iniciada, mas dá ao código assíncrono uma forma simples de parar antes de tentar enviar uma segunda resposta.

Este ficheiro cumpre `RNF07` porque reduz o risco de pedidos pendurados sob concorrência. Também respeita segurança: não devolve stack trace, path interno, cookie, fotografia, relatório ou identificador real.

6. Validação do passo.

Confirma que o ficheiro exporta `requestTimeout` e `DEFAULT_REQUEST_TIMEOUT_MS`, que marca `req.requestTimedOut` quando o limite é excedido e que não chama `res.json` diretamente. O middleware deve delegar erros no tratamento central.

7. Cenário negativo/erro esperado.

Uma rota lenta deve devolver `503` com mensagem controlada. Se a rota tentar responder depois desse `503`, falta a guarda contra resposta tardia no código assíncrono.

### Passo 3 - Aplicar o timeout e reforçar o health check

1. Objetivo funcional do passo no contexto da app.

Garantir que todas as rotas funcionais passam pelo limite e que existe um endpoint leve para smoke local.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/app.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o ficheiro por esta versão, preservando todas as rotas existentes e adicionando apenas o import do timeout, `app.use(requestTimeout())` e o `health check` com `checks.http`.

4. Código completo, correto e integrado com a app final.

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
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { adminDashboardRoutes } from "./routes/admin-dashboard.routes.js";
import { adminExportRoutes } from "./routes/admin-export.routes.js";
import { adminReviewRoutes } from "./routes/admin-review.routes.js";
import { adminUsersRoutes } from "./routes/admin-users.routes.js";
import { adminProductsRoutes } from "./routes/admin-products.routes.js";
import { adminCategoriesRoutes } from "./routes/admin-categories.routes.js";
import { beforeAfterVisualizationRoutes } from "./routes/before-after-visualization.routes.js";
import { cartRoutes } from "./routes/cart.routes.js";
import { catalogRoutes } from "./routes/catalog.routes.js";
import { dailyRoutineRoutes } from "./routes/daily-routine.routes.js";
import { faceAnalysisRoutes } from "./routes/face-analysis.routes.js";
import { facePhotoRoutes } from "./routes/face-photo.routes.js";
import { faceReportRoutes } from "./routes/face-report.routes.js";
import { makeupSimulationRoutes } from "./routes/makeup-simulation.routes.js";
import { preferencesRoutes } from "./routes/preferences.routes.js";
import { profileRoutes } from "./routes/profile.routes.js";
import { notificationRoutes } from "./routes/notification.routes.js";
import { recommendationReviewRoutes } from "./routes/recommendation-review.routes.js";
import { recommendationRoutes } from "./routes/recommendation.routes.js";
import { orderRoutes } from "./routes/order.routes.js";
import { reorderRoutes } from "./routes/reorder.routes.js";
import { skinComparisonRoutes } from "./routes/skin-comparison.routes.js";
import { skinEvolutionRoutes } from "./routes/skin-evolution.routes.js";
import { skinHistoryRoutes } from "./routes/skin-history.routes.js";
import { stockRoutes } from "./routes/stock.routes.js";
import { routineAlertRoutes } from "./routes/routine-alert.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { requestTimeout } from "./middlewares/request-timeout.middleware.js";

/**
 * Cria e configura uma instância Express da API Orélle.
 *
 * @function createApp
 * @returns {import("express").Express} Aplicação Express pronta a usar.
 */
export function createApp() {
    const app = express();

    app.use(cors({ origin: env.clientOrigin, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());
    app.use(requestTimeout());

    app.get("/api/health", (req, res) => {
        // O health check não consulta base de dados nem devolve dados pessoais ou biométricos.
        res.json({
            status: "ok",
            app: "orelle",
            checks: { http: "ok" },
        });
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/profile", profileRoutes);
    app.use("/api/preferences", preferencesRoutes);
    app.use("/api/catalog", catalogRoutes);
    app.use("/api", facePhotoRoutes);
    app.use("/api", faceAnalysisRoutes);
    app.use("/api", faceReportRoutes);
    app.use("/api", skinHistoryRoutes);
    app.use("/api", skinEvolutionRoutes);
    app.use("/api", recommendationRoutes);
    app.use("/api", dailyRoutineRoutes);
    app.use("/api", recommendationReviewRoutes);
    app.use("/api", makeupSimulationRoutes);
    app.use("/api", beforeAfterVisualizationRoutes);
    app.use("/api", skinComparisonRoutes);
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

    app.use(errorMiddleware);

    return app;
}
```

5. Explicação do código.

O timeout fica depois dos parsers (`json` e cookies) e antes das rotas. Assim, catálogo, análise, relatórios, recomendações, carrinho, encomendas e administração herdam o mesmo limite sem duplicar código.

O `health check` devolve apenas estado técnico: `status`, nome da app e `checks.http`. Não devolve utilizadores ativos, dados de produtos, fotografias, relatórios, tokens, cookies, paths internos ou estado da base de dados. Isto permite usar o endpoint no smoke de 50 pedidos sem criar risco de privacidade.

6. Validação do passo.

Arranca a API e confirma que `GET /api/health` devolve `200` com `status: "ok"` e `checks.http: "ok"`.

7. Cenário negativo/erro esperado.

Se `app.use(requestTimeout())` ficar depois das rotas, as rotas montadas antes não terão proteção. O teste do passo seguinte ajuda a apanhar esse erro.

### Passo 4 - Criar testes focados de estabilidade e segurança

1. Objetivo funcional do passo no contexto da app.

Validar que o health check responde, que endpoints protegidos continuam bloqueados sem sessão e que uma rota lenta recebe `503`.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf6.concurrency.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria um teste novo. O teste usa `createApp()` para o caminho real e uma app pequena separada apenas para validar o middleware de timeout com uma rota lenta controlada.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf6.concurrency.test.js
/**
 * Testes do BK-MF6-03 / RNF07.
 *
 * Confirmam que a API tem endpoint leve de saúde, preserva endpoints protegidos
 * sem sessão e devolve erro controlado quando uma rota ultrapassa o timeout.
 */
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { errorMiddleware } from "../src/middlewares/error.middleware.js";
import { requestTimeout } from "../src/middlewares/request-timeout.middleware.js";

/**
 * Cria uma app isolada para testar timeout sem depender de rotas reais.
 *
 * @function createSlowTimeoutApp
 * @returns {import("express").Express} App Express com uma rota lenta controlada.
 */
function createSlowTimeoutApp() {
    const app = express();

    app.use(requestTimeout(20));
    app.get("/api/test/slow", async (req, res) => {
        // A espera simula uma rota degradada e ensina o aluno a validar o negativo.
        await new Promise((resolve) => setTimeout(resolve, 60));
        if (res.headersSent || req.hasRequestTimedOut?.()) {
            // Depois do timeout, a rota pára para não tentar enviar uma segunda resposta.
            return;
        }

        res.json({ status: "late" });
    });
    app.use(errorMiddleware);

    return app;
}

describe("BK-MF6-03 / RNF07 - concorrência e estabilidade", () => {
    it("responde ao health check com payload técnico minimizado", async () => {
        const response = await request(createApp()).get("/api/health");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: "ok",
            app: "orelle",
            checks: { http: "ok" },
        });
    });

    it("mantém endpoint protegido bloqueado sem sessão", async () => {
        const response = await request(createApp()).get("/api/auth/me");

        expect(response.status).toBe(401);
        expect(response.body.error.message).toBe("Autenticação obrigatória");
    });

    it("devolve 503 controlado quando uma rota excede o timeout", async () => {
        const response = await request(createSlowTimeoutApp()).get("/api/test/slow");

        expect(response.status).toBe(503);
        expect(response.body.error.message).toBe("Pedido demorou demasiado. Tenta novamente.");
    });
});
```

5. Explicação do código.

O primeiro teste confirma que o smoke público é barato e previsível. O segundo confirma que `RNF07` não justifica abrir endpoints privados sem sessão. O terceiro cria uma rota lenta dentro de uma app de teste, aplica `requestTimeout(20)` e espera erro `503`.

A guarda `res.headersSent || req.hasRequestTimedOut?.()` é a parte que evita a falha tardia. Sem ela, a rota podia acordar depois dos `60ms` e tentar executar `res.json({ status: "late" })` quando o `errorMiddleware` já enviou o `503`.

Este teste evita três falhas comuns: health check com dados demais, segurança enfraquecida para facilitar carga e timeout sem prova objetiva.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test
```

O teste novo deve aparecer na suite e passar com os testes existentes.

7. Cenário negativo/erro esperado.

Se removeres `errorMiddleware` da app lenta, o erro não será convertido no JSON esperado. Se removeres a guarda `req.hasRequestTimedOut`, a rota lenta pode tentar responder tarde e gerar erro de headers já enviados.

### Passo 5 - Criar script local de 50 pedidos concorrentes

1. Objetivo funcional do passo no contexto da app.

Gerar evidence de `RNF07` com 50 pedidos simultâneos contra a API local, sem dependências novas e sem dados de clientes.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/scripts/check-mf6-concurrency.mjs`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o script abaixo. Por defeito, ele só aceita alvo local (`localhost`, `127.0.0.1` ou `::1`). Para outro ambiente controlado, exige confirmação explícita por variável de ambiente.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/scripts/check-mf6-concurrency.mjs
import { performance } from "node:perf_hooks";

const DEFAULT_TOTAL_REQUESTS = 50;
const DEFAULT_TIMEOUT_MS = 5_000;

/**
 * Converte uma variável de ambiente num inteiro positivo.
 *
 * @function parsePositiveInteger
 * @param {string|undefined} value - Valor recebido por variável de ambiente.
 * @param {number} fallback - Valor usado quando a variável não existe.
 * @returns {number} Inteiro positivo validado.
 */
function parsePositiveInteger(value, fallback) {
    if (value === undefined) return fallback;

    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Valor numérico inválido: ${value}`);
    }

    return parsed;
}

/**
 * Resolve o endpoint final do smoke de concorrência.
 *
 * @function resolveEndpoint
 * @returns {URL} URL final para pedidos concorrentes.
 */
function resolveEndpoint() {
    const baseUrl = process.env.ORELLE_API_URL ?? "http://127.0.0.1:3001";
    const path = process.env.ORELLE_CONCURRENCY_PATH ?? "/api/health";
    const endpoint = new URL(path, baseUrl);

    const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    if (!localHosts.has(endpoint.hostname) && process.env.ORELLE_ALLOW_REMOTE_CONCURRENCY !== "true") {
        throw new Error("Carga remota bloqueada. Usa ORELLE_ALLOW_REMOTE_CONCURRENCY=true apenas em ambiente controlado.");
    }

    return endpoint;
}

/**
 * Normaliza erros de fetch para evidence técnica sem stack trace.
 *
 * @function normalizeFetchError
 * @param {unknown} error - Erro capturado durante o pedido.
 * @returns {string} Mensagem curta e segura.
 */
function normalizeFetchError(error) {
    if (error instanceof Error) return error.name === "AbortError" ? "timeout" : error.message;
    return "erro_desconhecido";
}

/**
 * Executa um pedido individual com timeout local.
 *
 * @async
 * @function runHealthRequest
 * @param {number} index - Número técnico do pedido concorrente.
 * @param {URL} endpoint - Endpoint validado.
 * @param {number} timeoutMs - Timeout local do script.
 * @returns {Promise<{index: number, ok: boolean, status: number, durationMs: number, error?: string}>} Resultado minimizado.
 */
async function runHealthRequest(index, endpoint, timeoutMs) {
    const startedAt = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(endpoint, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
        });

        return {
            index,
            ok: response.ok,
            status: response.status,
            durationMs: Math.round(performance.now() - startedAt),
        };
    } catch (error) {
        return {
            index,
            ok: false,
            status: 0,
            durationMs: Math.round(performance.now() - startedAt),
            error: normalizeFetchError(error),
        };
    } finally {
        // Cada pedido limpa o seu timer para evitar handles pendentes no Node.
        clearTimeout(timer);
    }
}

const endpoint = resolveEndpoint();
const totalRequests = parsePositiveInteger(process.env.ORELLE_CONCURRENCY_TARGET, DEFAULT_TOTAL_REQUESTS);
const timeoutMs = parsePositiveInteger(process.env.ORELLE_CONCURRENCY_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);

if (totalRequests < DEFAULT_TOTAL_REQUESTS) {
    throw new Error("RNF07 exige pelo menos 50 pedidos concorrentes.");
}

const results = await Promise.all(
    Array.from({ length: totalRequests }, (_, index) => runHealthRequest(index + 1, endpoint, timeoutMs)),
);

const failures = results.filter((result) => !result.ok);
const durations = results.map((result) => result.durationMs).sort((a, b) => a - b);
const p95Index = Math.max(0, Math.ceil(durations.length * 0.95) - 1);

const summary = {
    endpoint: endpoint.toString(),
    totalRequests,
    successes: totalRequests - failures.length,
    failures: failures.length,
    maxDurationMs: Math.max(...durations),
    p95DurationMs: durations[p95Index],
};

// O output é evidence técnica: não inclui cookies, utilizadores, fotografias, relatórios ou produtos.
console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
    console.error(JSON.stringify({ failures: failures.slice(0, 5) }, null, 2));
    throw new Error("RNF07 falhou: pelo menos um pedido concorrente não respondeu com sucesso.");
}
```

5. Explicação do código.

O script cria 50 promessas em paralelo e mede cada pedido. `resolveEndpoint` impede carga remota acidental. `runHealthRequest` usa `AbortController` para não deixar o script preso se a API estiver desligada ou lenta. O resumo final inclui apenas endpoint técnico, total, sucessos, falhas, máximo e p95.

Isto cumpre `RNF07` sem tocar em dados reais. O script não faz login, não envia cookies, não cria carrinho, não gera encomenda, não processa fotografia e não lê relatório facial.

6. Validação do passo.

Com a API ligada noutro terminal, executa:

```bash
node apps/api/scripts/check-mf6-concurrency.mjs
```

O output esperado tem `totalRequests: 50`, `successes: 50` e `failures: 0`.

7. Cenário negativo/erro esperado.

Com a API desligada, o script deve falhar com erro de ligação ou `timeout`. Com `ORELLE_CONCURRENCY_TARGET=20`, deve falhar porque `RNF07` exige pelo menos 50 pedidos.

### Passo 6 - Executar validação final e preparar evidence

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com provas técnicas suficientes para PR e defesa da PAP.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/api/src/server.js`
    - REVER: `apps/api/scripts/check-mf6-concurrency.mjs`
    - LOCALIZAÇÃO: scripts reais e output da consola.

3. Instruções do que fazer.

Executa primeiro a suite de testes. Depois arranca a API local e executa o script de concorrência. Guarda no PR ou caderno de defesa apenas o resumo técnico do output.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix apps/api test
npm --prefix apps/api run dev
node apps/api/scripts/check-mf6-concurrency.mjs
ORELLE_CONCURRENCY_TARGET=20 node apps/api/scripts/check-mf6-concurrency.mjs
```

5. Explicação do código.

O primeiro comando valida os testes automatizados. O segundo arranca a API. O terceiro executa o caminho positivo de 50 pedidos. O quarto é negativo: prova que o script não aceita uma meta inferior ao contrato de `RNF07`.

Para a defesa, regista o output positivo e os negativos controlados. Não guardes logs com cookies, headers sensíveis, fotografias, relatórios, dados pessoais ou detalhes de compra.

6. Validação do passo.

O BK fica fechado quando:

- a suite de testes passa;
- o script positivo mostra `failures: 0`;
- o script com alvo inferior a 50 falha;
- endpoint protegido sem sessão continua a devolver `401`;
- rota lenta devolve `503`.

7. Cenário negativo/erro esperado.

Se a API estiver desligada, o script deve falhar e essa falha deve ser registada como ambiente indisponível, não como sucesso de `RNF07`.

#### Expected results

- `GET /api/health` devolve `200` com `{ status: "ok", app: "orelle", checks: { http: "ok" } }`.
- `GET /api/auth/me` sem sessão devolve `401`.
- Rota lenta de teste devolve `503` com mensagem segura.
- `npm --prefix apps/api test` passa.
- `node apps/api/scripts/check-mf6-concurrency.mjs` mostra `totalRequests: 50`, `successes: 50` e `failures: 0` com a API local ligada.
- `ORELLE_CONCURRENCY_TARGET=20 node apps/api/scripts/check-mf6-concurrency.mjs` falha porque a meta fica abaixo de `RNF07`.

#### Critérios de aceite

- O guia tem pelo menos 6 passos técnicos e pelo menos 2 cenários negativos.
- O timeout é aplicado antes das rotas funcionais.
- O health check é leve e não expõe dados sensíveis.
- O teste automatizado cobre health check, endpoint protegido sem sessão e timeout.
- O script executa pelo menos 50 pedidos concorrentes.
- O script bloqueia carga remota acidental por defeito.
- A evidence não contém dados pessoais, dados biométricos, cookies, tokens, fotografias, relatórios, carrinho ou encomendas.
- A autenticação e a autorização dos endpoints protegidos continuam intactas.

#### Validação final

```bash
if rg -n "^## Bloco|^### Objetivo$|^### Entrada$" docs/planificacao/guias-bk/MF6/BK-MF6-03-suportar-minimo-50-utilizadores-simultaneos-sem-falhas.md; then
    echo "ERRO: foram encontrados blocos legacy no BK-MF6-03."
    exit 1
fi

npm --prefix apps/api test
node apps/api/scripts/check-mf6-concurrency.mjs
bash scripts/validate-planificacao.sh
git diff --check
```

O primeiro bloco usa `rg` para procurar estrutura antiga. Se não houver output, esse bloco passa; se aparecer alguma linha, a validação falha de propósito.

Se o script de concorrência não puder ser executado porque a API local não está ligada, regista isso como validação pendente de ambiente. Não marques `RNF07` como provado sem o output positivo de 50 pedidos.

#### Evidence para PR/defesa

- `proof_tecnico`: output do teste `npm --prefix apps/api test`.
- `proof_concorrencia`: output JSON do script com `totalRequests: 50`, `successes: 50` e `failures: 0`.
- `proof_negativos`: endpoint protegido sem sessão `401`, rota lenta `503`, meta inferior a 50 bloqueada.
- `proof_core_dual`: estabilidade do backend que suporta catálogo, análise, recomendação, carrinho e checkout.
- `proof_privacidade`: evidence minimizada sem dados pessoais, biométricos ou comerciais sensíveis.

#### Handoff

`BK-MF6-04` deve otimizar imagens sem introduzir processamento síncrono pesado que degrade os 50 pedidos concorrentes deste BK. Se a compressão de imagens for feita no browser, a API continua a validar tipo, tamanho, número de ficheiros, ownership e consentimento no backend.

`BK-MF6-05` deve garantir que esta estabilidade é publicada apenas em ambientes com comunicações HTTPS/TLS adequadas, sem transformar o smoke local em prova de produção.

#### Changelog

- `2026-06-23`: guia corrigido para a estrutura ativa, com 6 passos P1, timeout transversal, health check minimizado, teste Vitest/Supertest, script de 50 pedidos concorrentes e evidence segura para `RNF07`.
- `2026-06-23`: correção complementar para impedir resposta tardia depois de timeout e clarificar que a pesquisa `rg` sem output é validação positiva.
