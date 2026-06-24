# BK-MF6-01 - Processar análise de fotografia em menos de 10 segundos

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
- `last_updated`: `2026-06-23`

#### Objetivo

Neste BK vais transformar o requisito `RNF05` numa regra técnica verificável: a análise facial completa deve terminar em menos de 10 segundos.

O resultado final é uma API que mede a duração do fluxo, devolve a resposta normal se a análise ficar dentro do orçamento, devolve erro controlado em timeout e guarda uma métrica técnica minimizada sem expor fotografias, relatórios, cookies, tokens ou paths internos.

#### Importância

A análise facial é uma parte central da consultoria inteligente da Orélle. Se for lenta, o utilizador perde confiança no fluxo e tem menos probabilidade de aceitar recomendações. Ao mesmo tempo, a funcionalidade trabalha com fotografias faciais e relatórios sensíveis, por isso a solução de performance não pode remover consentimento, ownership, storage privado ou minimização de dados.

Este BK existe para juntares duas responsabilidades: rapidez real para o utilizador e segurança real para dados biométricos.

#### Scope-in

- Criar um orçamento backend de 10 segundos para a operação de análise facial.
- Criar um modelo de métrica de performance com dados minimizados.
- Medir a duração em `apps/api/src/services/face-analysis.service.js`.
- Preservar consentimento ativo, fotografias frontal/perfil e resposta pública segura.
- Devolver `503` controlado se a análise ultrapassar o orçamento.
- Criar testes para sucesso rápido, timeout, ausência de consentimento, ausência de fotografias e métrica sem dados sensíveis.
- Preparar evidence para o KPI `tempo_analise_p95`.

#### Scope-out

- Não trocar o provider de IA.
- Não criar integração externa nova.
- Não acelerar o fluxo à custa de consentimento, ownership ou validação das fotografias.
- Não guardar fotografias, relatórios completos, cookies, tokens, IP completo ou paths internos em métricas.
- Não apresentar promessas clínicas, diagnósticos médicos ou conclusões dermatológicas definitivas.
- Não alterar checkout, carrinho, recomendações comerciais ou gestão de produtos.

#### Estado antes e depois

- Antes: o fluxo de análise valida consentimento e fotografias, chama o provider facial e guarda a análise, mas não mede formalmente a duração nem fecha `RNF05`.
- Depois: o fluxo fica protegido por um orçamento de 10 segundos, grava métricas minimizadas e tem testes que demonstram sucesso, timeout e negativos de segurança.

#### Pre-requisitos

- `BK-MF0-02`: sessão autenticada por cookie HttpOnly.
- `BK-MF1-05`: fotografias frontal e de perfil em storage privado.
- `BK-MF1-06`: provider de análise facial isolado.
- `BK-MF1-07`: relatório facial gerado a partir da análise.
- `RNF05`: análise de fotografia em menos de 10 segundos.
- `RF13`: upload de fotografias frontal/perfil.
- `RF14`: análise automática das fotografias.
- `RF15`: relatório de análise facial.
- `CORE-DUAL-CONTRATO.md`: KPI `tempo_analise_p95`.

#### Glossário

- Orçamento de performance: limite máximo aceitável para uma operação.
- `p95`: percentil 95; em 100 medições, 95 devem ficar abaixo do limite.
- Métrica minimizada: registo técnico com duração e estado, sem copiar dados sensíveis.
- Timeout controlado: erro previsto quando uma operação demora demasiado.
- Provider de IA: módulo isolado que executa a análise facial.
- Ownership: garantia de que o utilizador só acede aos seus próprios dados.

#### Conceitos teóricos essenciais

Performance não se garante por intenção; mede-se no ponto certo. Para `RNF05`, o ponto certo é o backend, porque é aí que a API valida sessão, consentimento, fotografias, provider de IA e persistência da análise.

Um timeout controlado evita pedidos presos indefinidamente. A API deve falhar com uma mensagem previsível, status HTTP adequado e sem revelar detalhes internos. O utilizador percebe que a análise demorou demasiado; a equipa técnica recebe evidence suficiente para investigar.

Métricas de performance devem ser minimizadas. Para este BK, a métrica precisa de `operation`, `durationMs`, `status` e `budgetMs`. Não precisa de fotografia, relatório completo, cookie, token, `storageKey`, path interno ou dados pessoais.

O fluxo rápido continua obrigado a ser seguro. Otimizar não significa saltar consentimento ou aceitar fotografias incompletas. Os negativos deste BK provam que a API continua a bloquear análise sem consentimento, sem fotografia frontal/perfil e com provider lento.

`CANONICO`: o limite de 10 segundos vem de `RNF05`; a evidência P0 exige testes unitários, integração, E2E/smoke e pelo menos 3 negativos.

`DERIVADO`: os nomes `PerformanceMetric`, `runWithPerformanceBudget` e `FACE_ANALYSIS_BUDGET_MS` são decisões técnicas mínimas para aplicar o requisito na stack Express/Mongoose.

#### Arquitetura do BK

- `apps/api/src/models/performance-metric.model.js`: modelo Mongoose para métricas minimizadas.
- `apps/api/src/services/performance-budget.service.js`: helper que mede duração, aplica orçamento e regista estado.
- `apps/api/src/services/face-analysis.service.js`: service de análise facial que envolve validações, provider e persistência com orçamento de 10 segundos.
- `apps/api/src/controllers/face-analysis.controller.js`: controller existente que mantém `POST /api/face-analyses`.
- `apps/api/src/routes/face-analysis.routes.js`: rota protegida por `requireAuth`.
- `apps/api/tests/mf6.face-analysis-performance.test.js`: testes unitários e de integração do orçamento, negativos e privacidade da métrica.

O pedido entra em `POST /api/face-analyses`, passa por `requireAuth`, chega a `createFaceAnalysisController` e chama `createFaceAnalysisForUser(req.user.id)`. Este BK altera apenas a zona do service onde a operação é medida, sem mudar o contrato público da rota.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/src/models/performance-metric.model.js`
- CRIAR: `apps/api/src/services/performance-budget.service.js`
- EDITAR: `apps/api/src/services/face-analysis.service.js`
- CRIAR: `apps/api/tests/mf6.face-analysis-performance.test.js`
- REVER: `apps/api/src/controllers/face-analysis.controller.js`
- REVER: `apps/api/src/routes/face-analysis.routes.js`
- REVER: `apps/api/src/providers/skin-analysis.provider.js`
- REVER: `docs/RNF.md`
- REVER: `docs/RF.md`

#### Tutorial técnico linear

### Passo 1 - Confirmar a fronteira de medição do RNF05

1. Objetivo funcional do passo no contexto da app.

Confirmar que `RNF05` mede a análise facial completa e não apenas o upload, a chamada ao provider ou a renderização no browser.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
    - LOCALIZAÇÃO: entradas `RNF05`, `RF13`, `RF14` e `RF15`.

3. Instruções do que fazer.

Regista no teu raciocínio técnico que a medição começa antes de validar consentimento e fotografias, e termina antes de devolver a resposta pública ao cliente. Assim, o orçamento cobre o trabalho real da API.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Este passo não cria código porque fixa o contrato funcional. Antes de medir, tens de saber exatamente que operação vais medir.

6. Validação do passo.

Consegues explicar que consentimento, fotografias, provider e persistência participam no tempo total da análise.

7. Cenário negativo/erro esperado.

Se medires apenas o browser, podes ter uma página rápida e uma API lenta. Isso não fecha `RNF05`.

### Passo 2 - Criar o modelo de métrica minimizada

1. Objetivo funcional do passo no contexto da app.

Guardar evidence técnica da duração sem copiar dados biométricos para métricas.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/models/performance-metric.model.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o modelo abaixo. Não acrescentes campos de fotografia, relatório, cookie, token, IP completo, `storageKey` ou path interno.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/performance-metric.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Schema de métricas técnicas minimizadas.
 *
 * Guarda apenas o necessário para provar desempenho e investigar falhas sem
 * copiar fotografias, relatórios ou identificadores sensíveis para logs.
 */
const performanceMetricSchema = new Schema(
    {
        operation: {
            type: String,
            enum: ["face_analysis"],
            required: true,
            index: true,
        },
        durationMs: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["success", "timeout", "error"],
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

performanceMetricSchema.index({ operation: 1, createdAt: -1 });

/**
 * Modelo Mongoose de métricas de performance.
 *
 * @type {import("mongoose").Model}
 */
export const PerformanceMetric = model(
    "PerformanceMetric",
    performanceMetricSchema,
);
```

5. Explicação do código.

O campo `operation` identifica a operação medida, neste BK apenas `face_analysis`. `durationMs` guarda o tempo total. `status` separa sucesso, timeout e erro técnico. `budgetMs` guarda o limite usado na medição.

O schema não tem `userId`, fotografia, relatório, cookie, token nem `storageKey` porque a métrica serve para performance, não para reconstruir a análise facial.

6. Validação do passo.

Confirma que o ficheiro exporta `PerformanceMetric` e que nenhum campo sensível foi adicionado.

7. Cenário negativo/erro esperado.

Se adicionares `storageKey`, path interno ou relatório completo ao modelo, a métrica deixa de ser minimizada e cria risco desnecessário de privacidade.

### Passo 3 - Criar o orçamento de performance reutilizável

1. Objetivo funcional do passo no contexto da app.

Criar um helper que mede duração, aplica timeout de 10 segundos e grava a métrica técnica.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/services/performance-budget.service.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o service abaixo. O helper recebe uma função assíncrona, executa-a contra um timeout e regista o resultado final.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/performance-budget.service.js
import { performance } from "node:perf_hooks";
import { AppError } from "../middlewares/error.middleware.js";
import { PerformanceMetric } from "../models/performance-metric.model.js";

export const FACE_ANALYSIS_OPERATION = "face_analysis";
export const FACE_ANALYSIS_BUDGET_MS = 10_000;

/**
 * Executa uma tarefa assíncrona dentro de um orçamento de performance.
 *
 * @async
 * @function runWithPerformanceBudget
 * @param {object} params - Parâmetros do orçamento.
 * @param {"face_analysis"} params.operation - Operação medida.
 * @param {number} params.budgetMs - Limite máximo em milissegundos.
 * @param {() => Promise<unknown>} params.task - Tarefa protegida pelo orçamento.
 * @returns {Promise<unknown>} Resultado da tarefa original.
 */
export async function runWithPerformanceBudget({ operation, budgetMs, task }) {
    const startedAt = performance.now();
    let timeoutId;
    let status = "success";

    try {
        const timeoutPromise = new Promise((resolve, reject) => {
            timeoutId = setTimeout(() => {
                reject(
                    new AppError(
                        503,
                        "A análise facial demorou demasiado. Tenta novamente.",
                    ),
                );
            }, budgetMs);
        });

        // A task mantém a lógica real; o timeout apenas limita a espera da API.
        const result = await Promise.race([task(), timeoutPromise]);
        status = "success";
        return result;
    } catch (err) {
        status = err instanceof AppError && err.statusCode === 503
            ? "timeout"
            : "error";
        throw err;
    } finally {
        clearTimeout(timeoutId);

        const durationMs = Math.round(performance.now() - startedAt);

        // Falhas ao gravar métrica não devem mascarar a resposta principal.
        await PerformanceMetric.create({
            operation,
            durationMs,
            status,
            budgetMs,
        }).catch(() => undefined);
    }
}
```

5. Explicação do código.

`performance.now()` mede duração com precisão adequada para backend. `Promise.race` compara a tarefa real com o timeout. Se o timeout vencer, a API devolve `503` controlado.

O bloco `finally` corre tanto no sucesso como no erro. É aí que a métrica é gravada. A gravação é minimizada e não bloqueia a resposta principal se a collection de métricas falhar.

6. Validação do passo.

Confirma que `FACE_ANALYSIS_BUDGET_MS` é `10_000` e que `PerformanceMetric.create` recebe apenas `operation`, `durationMs`, `status` e `budgetMs`.

7. Cenário negativo/erro esperado.

Se o provider ficar lento, o helper deve devolver `503` e gravar `status: "timeout"` sem expor fotografias ou detalhes internos.

### Passo 4 - Rever a rota protegida de análise facial

1. Objetivo funcional do passo no contexto da app.

Confirmar que o orçamento vai ser aplicado no ponto certo sem alterar o contrato público do endpoint.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/app.js`
    - REVER: `apps/api/src/routes/face-analysis.routes.js`
    - REVER: `apps/api/src/controllers/face-analysis.controller.js`
    - LOCALIZAÇÃO: montagem de `/api` e rota `POST /face-analyses`.

3. Instruções do que fazer.

Confirma que `app.js` monta `faceAnalysisRoutes` em `/api`, que `face-analysis.routes.js` protege `POST /face-analyses` com `requireAuth`, e que o controller chama `createFaceAnalysisForUser(req.user.id)`.

4. Código completo, correto e integrado com a app final.

```text
Sem alteração de código neste passo.
```

5. Explicação do código.

O endpoint público continua `POST /api/face-analyses`. A medição deve entrar no service para cobrir consentimento, fotografias, provider e persistência sem duplicar lógica no controller.

6. Validação do passo.

Consegues seguir o caminho: `POST /api/face-analyses` -> `requireAuth` -> `createFaceAnalysisController` -> `createFaceAnalysisForUser`.

7. Cenário negativo/erro esperado.

Se aplicares o orçamento só no controller depois de o service terminar, medes tarde demais e perdes o tempo real da operação.

### Passo 5 - Integrar o orçamento no service de análise facial

1. Objetivo funcional do passo no contexto da app.

Envolver a análise facial completa com o orçamento de 10 segundos, preservando imports, helpers, consentimento, fotografias obrigatórias e resposta segura.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/face-analysis.service.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o conteúdo de `apps/api/src/services/face-analysis.service.js` pela versão completa abaixo. Ela mantém os imports e helpers existentes e acrescenta apenas a integração com `runWithPerformanceBudget`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/face-analysis.service.js
/**
 * Service de análise facial cosmética.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { analyzeSkinPhotos } from "../providers/skin-analysis.provider.js";
import {
    FACE_ANALYSIS_BUDGET_MS,
    FACE_ANALYSIS_OPERATION,
    runWithPerformanceBudget,
} from "./performance-budget.service.js";

/**
 * Encontra a fotografia ativa mais recente de um tipo.
 *
 * @function latestByKind
 * @param {object[]} photos - Fotografias ordenadas por data decrescente.
 * @param {"frontal"|"perfil"} kind - Tipo pretendido.
 * @returns {object|undefined} Fotografia mais recente.
 */
function latestByKind(photos, kind) {
    return photos.find((photo) => photo.kind === kind);
}

/**
 * Converte análise para resposta segura.
 *
 * @function toFaceAnalysisResponse
 * @param {object} analysis - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, providerName: string, findings: object, sources: string[], limitations: string[], status: string, createdAt: Date|undefined}} Análise pública.
 */
function toFaceAnalysisResponse(analysis) {
    return {
        id: analysis._id.toString(),
        providerName: analysis.providerName,
        findings: analysis.findings,
        sources: analysis.sources,
        limitations: analysis.limitations,
        status: analysis.status,
        createdAt: analysis.createdAt,
    };
}

/**
 * Cria uma análise para o utilizador autenticado.
 *
 * @async
 * @function createFaceAnalysisForUser
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} Análise criada.
 */
export async function createFaceAnalysisForUser(userId) {
    return runWithPerformanceBudget({
        operation: FACE_ANALYSIS_OPERATION,
        budgetMs: FACE_ANALYSIS_BUDGET_MS,
        task: async () => {
            const consent = await FaceConsent.findOne({
                userId,
                revokedAt: null,
            });

            if (!consent) {
                throw new AppError(403, "Consentimento facial em falta");
            }

            const photos = await FacePhoto.find({ userId, status: "active" })
                .sort({ createdAt: -1 })
                .select("+storageKey");

            const frontalPhoto = latestByKind(photos, "frontal");
            const perfilPhoto = latestByKind(photos, "perfil");

            if (!frontalPhoto || !perfilPhoto) {
                throw new AppError(
                    400,
                    "Fotografias frontal e de perfil obrigatórias",
                );
            }

            // O provider recebe documentos internos, mas a resposta pública
            // continua a ser minimizada por toFaceAnalysisResponse.
            const result = await analyzeSkinPhotos({
                frontalPhoto,
                perfilPhoto,
            });

            const analysis = await FaceAnalysis.create({
                userId,
                photoIds: [frontalPhoto._id, perfilPhoto._id],
                consentId: consent._id,
                providerName: result.providerName,
                findings: result.findings,
                sources: result.sources,
                limitations: result.limitations,
            });

            return toFaceAnalysisResponse(analysis);
        },
    });
}
```

5. Explicação do código.

A função pública continua a chamar-se `createFaceAnalysisForUser`, por isso o controller e a rota não mudam. A diferença é que toda a operação entra em `runWithPerformanceBudget`.

O filtro `{ userId, status: "active" }` preserva ownership: a API só procura fotografias do utilizador autenticado. O consentimento ativo continua a ser obrigatório antes de chamar o provider.

6. Validação do passo.

Confirma que a função ainda lança `403` sem consentimento, `400` sem fotografias frontal/perfil e que só chama `analyzeSkinPhotos` depois dessas validações.

7. Cenário negativo/erro esperado.

Se o import do helper substituir imports existentes, o service parte. Mantém `AppError`, `FaceAnalysis`, `FaceConsent`, `FacePhoto`, `analyzeSkinPhotos`, `latestByKind` e `toFaceAnalysisResponse`.

### Passo 6 - Criar testes unitários, integração e negativos P0

1. Objetivo funcional do passo no contexto da app.

Provar que o orçamento funciona, que a API mantém validações de segurança e que a métrica não guarda dados sensíveis.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf6.face-analysis-performance.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Os testes usam mocks para isolar o orçamento, o service e o provider sem depender de fotografias reais.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf6.face-analysis-performance.test.js
import { beforeEach, describe, expect, it, vi } from "vitest";

// Os mocks ficam hoisted para o Vitest substituir models e provider antes de carregar os imports reais do service.
const mocks = vi.hoisted(() => ({
    metricCreate: vi.fn(),
    consentFindOne: vi.fn(),
    photoFind: vi.fn(),
    analysisCreate: vi.fn(),
    analyzeSkinPhotos: vi.fn(),
}));

vi.mock("../src/models/performance-metric.model.js", () => ({
    PerformanceMetric: {
        create: mocks.metricCreate,
    },
}));

vi.mock("../src/models/face-consent.model.js", () => ({
    FaceConsent: {
        findOne: mocks.consentFindOne,
    },
}));

vi.mock("../src/models/face-photo.model.js", () => ({
    FacePhoto: {
        find: mocks.photoFind,
    },
}));

vi.mock("../src/models/face-analysis.model.js", () => ({
    FaceAnalysis: {
        create: mocks.analysisCreate,
    },
}));

vi.mock("../src/providers/skin-analysis.provider.js", () => ({
    analyzeSkinPhotos: mocks.analyzeSkinPhotos,
}));

import {
    FACE_ANALYSIS_BUDGET_MS,
    FACE_ANALYSIS_OPERATION,
    runWithPerformanceBudget,
} from "../src/services/performance-budget.service.js";
import { createFaceAnalysisForUser } from "../src/services/face-analysis.service.js";

function mockActivePhotos(photos) {
    // Replica o encadeamento sort().select() do model para testar o contrato sem tocar na base de dados.
    const select = vi.fn().mockResolvedValue(photos);
    const sort = vi.fn().mockReturnValue({ select });

    mocks.photoFind.mockReturnValue({ sort });
}

describe("BK-MF6-01 face analysis performance", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.metricCreate.mockResolvedValue({});
    });

    it("regista sucesso dentro do orçamento sem dados sensíveis", async () => {
        const result = await runWithPerformanceBudget({
            operation: FACE_ANALYSIS_OPERATION,
            budgetMs: FACE_ANALYSIS_BUDGET_MS,
            task: async () => "ok",
        });

        expect(result).toBe("ok");
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "face_analysis",
                status: "success",
                budgetMs: 10_000,
            }),
        );

        const metric = mocks.metricCreate.mock.calls[0][0];
        expect(metric).not.toHaveProperty("userId");
        expect(metric).not.toHaveProperty("storageKey");
        expect(metric).not.toHaveProperty("photo");
        expect(metric).not.toHaveProperty("report");
        expect(metric).not.toHaveProperty("token");
    });

    it("devolve timeout controlado quando o orçamento é ultrapassado", async () => {
        await expect(
            runWithPerformanceBudget({
                operation: FACE_ANALYSIS_OPERATION,
                budgetMs: 1,
                task: () => new Promise((resolve) => {
                    setTimeout(resolve, 20);
                }),
            }),
        ).rejects.toMatchObject({
            statusCode: 503,
            message: "A análise facial demorou demasiado. Tenta novamente.",
        });

        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                operation: "face_analysis",
                status: "timeout",
                budgetMs: 1,
            }),
        );
    });

    it("bloqueia análise sem consentimento ativo antes de chamar o provider", async () => {
        mocks.consentFindOne.mockResolvedValue(null);

        await expect(createFaceAnalysisForUser("user-1")).rejects.toMatchObject({
            statusCode: 403,
            message: "Consentimento facial em falta",
        });

        expect(mocks.analyzeSkinPhotos).not.toHaveBeenCalled();
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({ status: "error" }),
        );
    });

    it("bloqueia análise sem fotografias frontal e de perfil", async () => {
        // Este negativo prova que a otimização não pode contornar os requisitos biométricos mínimos.
        mocks.consentFindOne.mockResolvedValue({ _id: "consent-1" });
        mockActivePhotos([
            {
                _id: "front-1",
                kind: "frontal",
                storageKey: "private/front.jpg",
            },
        ]);

        await expect(createFaceAnalysisForUser("user-1")).rejects.toMatchObject({
            statusCode: 400,
            message: "Fotografias frontal e de perfil obrigatórias",
        });

        expect(mocks.analyzeSkinPhotos).not.toHaveBeenCalled();
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({ status: "error" }),
        );
    });

    it("cria análise válida e preserva resposta pública minimizada", async () => {
        const createdAt = new Date("2026-06-23T10:00:00.000Z");

        mocks.consentFindOne.mockResolvedValue({ _id: "consent-1" });
        mockActivePhotos([
            {
                _id: "front-1",
                kind: "frontal",
                storageKey: "private/front.jpg",
            },
            {
                _id: "side-1",
                kind: "perfil",
                storageKey: "private/side.jpg",
            },
        ]);
        mocks.analyzeSkinPhotos.mockResolvedValue({
            providerName: "local-skin-v1",
            findings: { hydration: "balanced" },
            sources: ["frontal", "perfil"],
            limitations: ["Luz ambiente variável"],
        });
        mocks.analysisCreate.mockResolvedValue({
            _id: { toString: () => "analysis-1" },
            providerName: "local-skin-v1",
            findings: { hydration: "balanced" },
            sources: ["frontal", "perfil"],
            limitations: ["Luz ambiente variável"],
            status: "completed",
            createdAt,
        });

        const result = await createFaceAnalysisForUser("user-1");

        expect(mocks.analysisCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "user-1",
                photoIds: ["front-1", "side-1"],
                consentId: "consent-1",
            }),
        );
        expect(result).toEqual({
            id: "analysis-1",
            providerName: "local-skin-v1",
            findings: { hydration: "balanced" },
            sources: ["frontal", "perfil"],
            limitations: ["Luz ambiente variável"],
            status: "completed",
            createdAt,
        });
        expect(result).not.toHaveProperty("storageKey");
        expect(mocks.metricCreate).toHaveBeenCalledWith(
            expect.objectContaining({ status: "success" }),
        );
    });
});
```

5. Explicação do código.

Os dois primeiros testes são unitários do orçamento: sucesso e timeout. Os três testes seguintes validam integração do service com consentimento, fotografias, provider, persistência e resposta pública.

Os negativos P0 ficam explícitos: sem consentimento, sem fotografias frontal/perfil e provider lento. A validação de privacidade confirma que a métrica não recebe dados sensíveis.

Executar cenarios negativos obrigatorios (minimo 3): sem consentimento, sem fotografias frontal/perfil e provider lento.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- mf6.face-analysis-performance.test.js
```

7. Cenário negativo/erro esperado.

Se o teste de ausência de consentimento chamar `analyzeSkinPhotos`, a otimização partiu uma regra de segurança e o BK não pode ser aceite.

### Passo 7 - Executar validação API e smoke de contrato

1. Objetivo funcional do passo no contexto da app.

Confirmar que os testes novos passam isolados e que a suite da API continua estável.

2. Ficheiros envolvidos:
    - EXECUTAR: `apps/api/tests/mf6.face-analysis-performance.test.js`
    - EXECUTAR: suite da API.

3. Instruções do que fazer.

Executa o teste novo primeiro. Depois executa a suite completa da API. Se o ambiente de testes tiver seed de sessão, consentimento e duas fotografias ativas, valida também o contrato `POST /api/face-analyses` com cookie HttpOnly de teste.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix apps/api test -- mf6.face-analysis-performance.test.js
npm --prefix apps/api test
```

5. Explicação do código.

O primeiro comando dá feedback rápido sobre o BK. O segundo confirma que a integração não estragou outros módulos da API.

O smoke do endpoint deve medir duração total, status HTTP e ausência de campos sensíveis na resposta. Usa fixtures de teste, nunca fotografias reais de utilizadores.

6. Validação do passo.

Regista no relatório de execução a duração observada, o status e os negativos executados.

7. Cenário negativo/erro esperado.

Se a suite só passar no teste isolado mas falhar na suite completa, existe conflito com mocks, modelos ou middlewares de autenticação.

### Passo 8 - Preparar evidence para PR e defesa

1. Objetivo funcional do passo no contexto da app.

Deixar evidence objetiva para demonstrar que `RNF05` foi implementado de forma mensurável e segura.

2. Ficheiros envolvidos:
    - REVER: output dos testes.
    - REVER: documentos de planificação.
    - REVER: registos minimizados em `PerformanceMetric`.

3. Instruções do que fazer.

Preenche a evidence com resultados reais da execução. Não inventes tempos. Se o teste foi executado em ambiente local, identifica-o como local.

4. Código completo, correto e integrado com a app final.

```text
Evidence esperada:
- Comando: npm --prefix apps/api test -- mf6.face-analysis-performance.test.js
- Resultado: PASS
- Negativos: sem consentimento -> 403; sem fotografias -> 400; provider lento -> 503
- Métrica: operation, durationMs, status, budgetMs
- Dados excluídos da métrica: fotografia, relatório completo, cookie, token, storageKey e path interno
- KPI: tempo_analise_p95 calculado a partir das métricas de face_analysis
```

5. Explicação do código.

Este bloco é texto operacional, não código executável. Ele define o formato mínimo de evidence para PR e defesa.

6. Validação do passo.

Confirma que a evidence tem comandos, resultados, negativos e menção explícita à minimização de dados.

7. Cenário negativo/erro esperado.

Se a evidence disser apenas "foi testado" sem comando, resultado e negativos, não prova `RNF05`.

#### Expected results

- `apps/api/src/models/performance-metric.model.js` criado com campos minimizados.
- `apps/api/src/services/performance-budget.service.js` criado com orçamento `FACE_ANALYSIS_BUDGET_MS = 10_000`.
- `apps/api/src/services/face-analysis.service.js` mede a operação completa de análise facial.
- `POST /api/face-analyses` continua protegido por `requireAuth`.
- Timeout do provider devolve `503` controlado.
- Ausência de consentimento devolve `403` antes do provider.
- Ausência de fotografia frontal ou de perfil devolve `400` antes do provider.
- Métricas não guardam fotografia, relatório completo, cookie, token, `storageKey` ou path interno.

#### Critérios de aceite

- O guia tem pelo menos 8 passos técnicos para um BK `P0`.
- O limite de análise facial é `10_000` ms.
- A medição cobre consentimento, fotografias, provider e persistência.
- O provider não é chamado sem consentimento ativo.
- O provider não é chamado sem fotografia frontal e de perfil.
- O erro de timeout é controlado e tem status `503`.
- O teste novo cobre unitário, integração e pelo menos 3 negativos.
- A suite API continua a passar.
- A evidence permite calcular ou justificar `tempo_analise_p95`.
- Nenhum dado biométrico sensível é copiado para métricas.
- `### Matriz minima de testes por prioridade`: `P0 = unit + integration + e2e/smoke + minimo 3 negativos`.
- Evidencia de testes por camada: output do teste focal, output da suite API e smoke do endpoint autenticado.
- Cenarios negativos concluidos: minimo `3`, com consentimento em falta, fotografias incompletas e timeout do provider.

#### Validação final

Executa:

```bash
npm --prefix apps/api test -- mf6.face-analysis-performance.test.js
npm --prefix apps/api test
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
```

Confirma manualmente:

- `PerformanceMetric` só guarda `operation`, `durationMs`, `status`, `budgetMs` e timestamps.
- `createFaceAnalysisForUser` mantém consentimento e fotografias obrigatórias antes do provider.
- A resposta pública não inclui `storageKey`.
- O relatório de execução contém pelo menos 3 negativos.
- Negativos: minimo `3` cenarios com resultado controlado, registados na evidence do BK.

#### Evidence para PR/defesa

Usa este formato, preenchido com resultados reais:

```md
Evidence BK-MF6-01

- RNF validado: RNF05
- Endpoint: POST /api/face-analyses
- Orçamento: 10_000 ms
- Comando unit/integration: npm --prefix apps/api test -- mf6.face-analysis-performance.test.js
- Resultado unit/integration: PASS/FAIL
- Comando suite API: npm --prefix apps/api test
- Resultado suite API: PASS/FAIL
- Negativo 1: sem consentimento -> 403
- Negativo 2: sem fotografia frontal/perfil -> 400
- Negativo 3: provider lento -> 503
- Métrica guardada: operation, durationMs, status, budgetMs
- Dados excluídos: fotografia, relatório completo, cookie, token, storageKey, path interno
- Observação p95: preencher com dados reais de PerformanceMetric
```

#### Handoff

`BK-MF6-02` deve medir carregamento das páginas principais sem desfazer a métrica backend criada aqui. `BK-MF6-07` deve reforçar proteção em repouso de fotografias e relatórios sem passar dados sensíveis para métricas. `BK-MF8-02` pode reutilizar o conceito de métrica minimizada para logs e métricas operacionais mais amplas.

#### Changelog

- `2026-06-24`: reforçados comentários didáticos no teste de performance/privacidade e removida checklist pendente da validação final.
- `2026-06-23`: removidos blocos estruturais antigos, tutorial expandido para 8 passos P0, teste completo com negativos e integração documentada com imports/helpers reais do service.
- `2026-06-22`: primeira versão com orçamento de performance, métrica minimizada e integração proposta em análise facial.
