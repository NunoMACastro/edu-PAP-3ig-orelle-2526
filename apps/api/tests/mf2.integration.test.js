/**
 * Testes de integracao HTTP da MF2.
 *
 * Estes testes cobrem os endpoints reais criados na MF2, incluindo autenticacao,
 * ownership, roles, validacao de input e minimizacao de dados sensiveis nos DTOs.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { Product } from "../src/models/product.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { DailyRoutine } from "../src/models/daily-routine.model.js";
import { RecommendationReview } from "../src/models/recommendation-review.model.js";
import { MakeupSimulation } from "../src/models/makeup-simulation.model.js";
import { BeforeAfterVisualization } from "../src/models/before-after-visualization.model.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/face-analysis.model.js", () => ({
    FaceAnalysis: {
        find: vi.fn(),
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/product.model.js", () => ({
    Product: {
        find: vi.fn(),
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/product-recommendation.model.js", () => ({
    ProductRecommendation: {
        find: vi.fn(),
        findById: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/daily-routine.model.js", () => ({
    DailyRoutine: {
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/recommendation-review.model.js", () => ({
    RecommendationReview: {
        create: vi.fn(),
    },
}));

vi.mock("../src/models/face-consent.model.js", () => ({
    FaceConsent: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/face-photo.model.js", () => ({
    FacePhoto: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/makeup-simulation.model.js", () => ({
    MakeupSimulation: {
        create: vi.fn(),
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/before-after-visualization.model.js", () => ({
    BeforeAfterVisualization: {
        findOneAndUpdate: vi.fn(),
    },
}));

const userId = "66c000000000000000000010";
const otherUserId = "66c000000000000000000011";
const consultantId = "66c000000000000000000012";
const analysisId = "66c000000000000000000020";
const reportId = "66c000000000000000000030";
const productId = "66c000000000000000000040";
const secondProductId = "66c000000000000000000041";
const recommendationId = "66c000000000000000000050";
const secondRecommendationId = "66c000000000000000000051";
const consentId = "66c000000000000000000060";
const facePhotoId = "66c000000000000000000070";
const simulationId = "66c000000000000000000080";
const visualizationId = "66c000000000000000000090";

/**
 * Cria um identificador mínimo com a interface usada pelos DTOs.
 *
 * @function objectId
 * @param {string} id - Valor textual a devolver por `toString`.
 * @returns {{toString: Function}} Objeto que simula um ObjectId Mongoose.
 */
function objectId(id) {
    return {
        toString() {
            return id;
        },
    };
}

/**
 * Gera um token de sessão para os cenários HTTP da MF2.
 *
 * @function makeToken
 * @param {string} [role=ROLES.CLIENTE] - Role colocada no token.
 * @param {string} [id=userId] - ID do utilizador autenticado.
 * @returns {string} JWT de sessão válido para os testes.
 */
function makeToken(role = ROLES.CLIENTE, id = userId) {
    return createSessionToken({
        id,
        email: `${id}@orelle.test`,
        role,
    });
}

/**
 * Simula uma query Mongoose que termina em `sort()`.
 *
 * @function queryWithSort
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function queryWithSort(result) {
    return {
        sort: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula a cadeia de query Mongoose `select().sort().limit()`.
 *
 * @function queryFindWithSelectSortLimit
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function queryFindWithSelectSortLimit(result) {
    return {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula a cadeia de query Mongoose `select().limit()`.
 *
 * @function queryFindWithSelectLimit
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function queryFindWithSelectLimit(result) {
    return {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula a cadeia de query Mongoose `sort().limit().populate()`.
 *
 * @function queryFindPopulate
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function queryFindPopulate(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula uma query de update terminada em `populate()`.
 *
 * @function queryUpdatePopulate
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function queryUpdatePopulate(result) {
    return {
        populate: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula a cadeia de query Mongoose `select().populate()` para procura por ID.
 *
 * @function queryFindByIdPopulate
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function queryFindByIdPopulate(result) {
    return {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula uma query `findOne` terminada em `select()`.
 *
 * @function queryFindOneSelect
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function queryFindOneSelect(result) {
    return {
        select: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Cria um produto mock usado pelas recomendações e simulações.
 *
 * @function makeProduct
 * @param {object} [overrides={}] - Campos a sobrepor no produto base.
 * @returns {object} Produto mock.
 */
function makeProduct(overrides = {}) {
    return {
        _id: objectId(productId),
        name: "Gel controlo oleosidade",
        brandName: "Orelle",
        description: "Gel para pele mista com acne ligeira",
        ingredientNames: ["niacinamida", "zinco"],
        skinTypes: ["mista", "oleosa"],
        imageUrl: "https://example.test/produto.png",
        priceCents: 1299,
        stock: 8,
        ...overrides,
    };
}

/**
 * Cria uma análise facial mock com findings cosméticos.
 *
 * @function makeAnalysis
 * @param {object} [overrides={}] - Campos a sobrepor na análise base.
 * @returns {object} Análise facial mock.
 */
function makeAnalysis(overrides = {}) {
    return {
        _id: objectId(analysisId),
        findings: {
            skinType: { label: "mista" },
            acne: { label: "moderado" },
            manchas: { label: "baixo" },
            rugas: { label: "baixo" },
            oleosidade: { label: "moderada" },
        },
        status: "completed",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
        ...overrides,
    };
}

/**
 * Cria um relatório facial mock associado à análise.
 *
 * @function makeReport
 * @param {object} [overrides={}] - Campos a sobrepor no relatório base.
 * @returns {object} Relatório facial mock.
 */
function makeReport(overrides = {}) {
    return {
        _id: objectId(reportId),
        userId,
        analysisId: objectId(analysisId),
        limitations: ["Relatorio cosmetico sem finalidade medica."],
        ...overrides,
    };
}

/**
 * Cria uma recomendação mock com produto populado.
 *
 * @function makeRecommendation
 * @param {object} [overrides={}] - Campos a sobrepor na recomendação base.
 * @returns {object} Recomendação mock.
 */
function makeRecommendation(overrides = {}) {
    return {
        _id: objectId(recommendationId),
        userId,
        analysisId: objectId(analysisId),
        reportId: objectId(reportId),
        productId: makeProduct(),
        score: 0.7,
        reasonCodes: ["skin_type_match", "oiliness_support"],
        explanation:
            "Gel controlo oleosidade foi recomendado porque e compativel com a pele.",
        sourceSignals: ["skinType:mista", "oleosidade:moderada"],
        limitations: ["Recomendacao cosmetica."],
        status: "active",
        feedback: null,
        consultantNote: null,
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
        updatedAt: new Date("2026-06-01T10:00:00.000Z"),
        ...overrides,
    };
}

/**
 * Cria uma rotina diária mock com passos de manhã e noite.
 *
 * @function makeDailyRoutine
 * @param {object} [overrides={}] - Campos a sobrepor na rotina base.
 * @returns {object} Rotina diária mock.
 */
function makeDailyRoutine(overrides = {}) {
    return {
        _id: objectId("66c0000000000000000000a0"),
        source: "recommendations",
        steps: [
            {
                period: "manha",
                title: "Manhã: aplicar Gel controlo oleosidade",
                instructions: "Usar depois da limpeza.",
                recommendationId: objectId(recommendationId),
                productSnapshot: {
                    productId: objectId(productId),
                    name: "Gel controlo oleosidade",
                    brandName: "Orelle",
                    imageUrl: "https://example.test/produto.png",
                    priceCents: 1299,
                },
            },
            {
                period: "noite",
                title: "Noite: aplicar Serum calmante",
                instructions: "Usar depois de remover impurezas.",
                recommendationId: objectId(secondRecommendationId),
                productSnapshot: {
                    productId: objectId(secondProductId),
                    name: "Serum calmante",
                    brandName: "Orelle",
                    imageUrl: "https://example.test/serum.png",
                    priceCents: 1599,
                },
            },
        ],
        limitations: ["Rotina cosmetica."],
        updatedAt: new Date("2026-06-01T10:00:00.000Z"),
        ...overrides,
    };
}

/**
 * Cria um consentimento facial mock ativo.
 *
 * @function makeConsent
 * @param {object} [overrides={}] - Campos a sobrepor no consentimento base.
 * @returns {object} Consentimento mock.
 */
function makeConsent(overrides = {}) {
    return {
        _id: objectId(consentId),
        userId,
        revokedAt: null,
        ...overrides,
    };
}

/**
 * Cria uma fotografia facial mock frontal e ativa.
 *
 * @function makeFacePhoto
 * @param {object} [overrides={}] - Campos a sobrepor na fotografia base.
 * @returns {object} Fotografia facial mock.
 */
function makeFacePhoto(overrides = {}) {
    return {
        _id: objectId(facePhotoId),
        userId,
        kind: "frontal",
        status: "active",
        storageKey: "/private/facial-photo.png",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
        ...overrides,
    };
}

/**
 * Cria uma simulação de maquilhagem mock com preview seguro.
 *
 * @function makeSimulation
 * @param {object} [overrides={}] - Campos a sobrepor na simulação base.
 * @returns {object} Simulação mock.
 */
function makeSimulation(overrides = {}) {
    return {
        _id: objectId(simulationId),
        userId,
        facePhotoId: objectId(facePhotoId),
        consentId: objectId(consentId),
        productId: makeProduct(),
        providerName: "local-makeup-simulation-v1",
        preview: {
            beforePanel: {
                label: "Antes",
                description: "Fotografia frontal privada validada pelo backend.",
                accentColor: "#94a3b8",
            },
            afterPanel: {
                label: "Depois",
                description: "Pre-visualizacao baseline.",
                accentColor: "#123456",
            },
            overlay: {
                style: "baseline_visual_seguro",
                productName: "Gel controlo oleosidade",
                accentColor: "#123456",
            },
            visual: {
                type: "safe_svg_preview",
                beforeImageUrl:
                    "data:image/svg+xml;charset=utf-8,%3Csvg%3Eantes%3C%2Fsvg%3E",
                afterImageUrl:
                    "data:image/svg+xml;charset=utf-8,%3Csvg%3Edepois%3C%2Fsvg%3E",
                altText: "Preview visual seguro.",
            },
            limitations: ["A fotografia facial privada nao e devolvida pela API."],
        },
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
        ...overrides,
    };
}

describe("MF2 - integracao HTTP", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("devolve evolucao temporal apenas para utilizador autenticado", async () => {
        FaceAnalysis.find.mockReturnValueOnce(
            queryFindWithSelectSortLimit([makeAnalysis()]),
        );

        const response = await request(createApp())
            .get("/api/me/skin-evolution")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.body.evolution.points[0].analysisId).toBe(analysisId);
        expect(response.body.evolution.points[0].oleosidadeScore).toBe(2);
        expect(FaceAnalysis.find).toHaveBeenCalledWith({
            userId,
            status: "completed",
        });
    });

    it("bloqueia evolucao temporal sem sessao", async () => {
        const response = await request(createApp()).get("/api/me/skin-evolution");

        expect(response.status).toBe(401);
        expect(FaceAnalysis.find).not.toHaveBeenCalled();
    });

    it("gera recomendacoes com analise, relatorio e catalogo compativel sem expor dados sensiveis", async () => {
        FaceAnalysis.findOne.mockReturnValueOnce(queryWithSort(makeAnalysis()));
        FaceReport.findOne.mockReturnValueOnce(queryWithSort(makeReport()));
        Product.find.mockReturnValueOnce(
            queryFindWithSelectLimit([
                makeProduct(),
                makeProduct({
                    _id: objectId(secondProductId),
                    name: "Serum calmante",
                    description: "Serum para oleosidade moderada",
                }),
                makeProduct({
                    _id: objectId("66c000000000000000000042"),
                    name: "Creme leve",
                    description: "Creme para pele mista",
                }),
            ]),
        );
        ProductRecommendation.findOneAndUpdate.mockReturnValue(
            queryUpdatePopulate(makeRecommendation()),
        );

        const response = await request(createApp())
            .post("/api/recommendations/generate")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(201);
        expect(response.body.recommendations).toHaveLength(3);
        expect(response.body.recommendations[0].reasonCodes).toContain(
            "skin_type_match",
        );
        expect(JSON.stringify(response.body)).not.toContain("storageKey");
        expect(JSON.stringify(response.body)).not.toContain("consentId");
        expect(JSON.stringify(response.body)).not.toContain("facePhotoId");
    });

    it("rejeita geracao de recomendacoes quando falta relatorio da analise", async () => {
        FaceAnalysis.findOne.mockReturnValueOnce(queryWithSort(makeAnalysis()));
        FaceReport.findOne.mockReturnValueOnce(queryWithSort(null));

        const response = await request(createApp())
            .post("/api/recommendations/generate")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe(
            "Relatório da análise mais recente obrigatório",
        );
        expect(Product.find).not.toHaveBeenCalled();
    });

    it("lista recomendacoes e regista feedback com ownership pelo utilizador autenticado", async () => {
        ProductRecommendation.find.mockReturnValueOnce(
            queryFindPopulate([makeRecommendation()]),
        );
        ProductRecommendation.findOneAndUpdate.mockReturnValueOnce(
            queryUpdatePopulate(
                makeRecommendation({
                    status: "accepted",
                    feedback: {
                        value: "util",
                        submittedAt: new Date("2026-06-01T11:00:00.000Z"),
                    },
                }),
            ),
        );

        const app = createApp();
        const cookie = `orelle_session=${makeToken()}`;
        const list = await request(app).get("/api/recommendations").set("Cookie", [cookie]);
        const feedback = await request(app)
            .post(`/api/recommendations/${recommendationId}/feedback`)
            .set("Cookie", [cookie])
            .send({ value: "util" });

        expect(list.status).toBe(200);
        expect(feedback.status).toBe(200);
        expect(feedback.body.recommendation.status).toBe("accepted");
        expect(ProductRecommendation.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: recommendationId, userId },
            expect.any(Object),
            expect.any(Object),
        );
    });

    it("gera rotina diaria a partir de recomendacoes validas e bloqueia rotina incompleta", async () => {
        ProductRecommendation.find.mockReturnValueOnce(
            queryFindPopulate([
                makeRecommendation(),
                makeRecommendation({
                    _id: objectId(secondRecommendationId),
                    productId: makeProduct({
                        _id: objectId(secondProductId),
                        name: "Serum calmante",
                    }),
                }),
            ]),
        );
        DailyRoutine.findOneAndUpdate.mockResolvedValueOnce(makeDailyRoutine());
        ProductRecommendation.find.mockReturnValueOnce(queryFindPopulate([]));
        ProductRecommendation.find.mockReturnValueOnce(
            queryFindPopulate([
                makeRecommendation({
                    productId: makeProduct({ stock: 0 }),
                }),
                makeRecommendation({
                    _id: objectId(secondRecommendationId),
                    productId: makeProduct({
                        _id: objectId(secondProductId),
                        name: "Serum calmante",
                        stock: 4,
                    }),
                }),
            ]),
        );

        const app = createApp();
        const cookie = `orelle_session=${makeToken()}`;
        const success = await request(app)
            .post("/api/me/daily-routine/generate")
            .set("Cookie", [cookie]);
        const failure = await request(app)
            .post("/api/me/daily-routine/generate")
            .set("Cookie", [cookie]);
        const stockFailure = await request(app)
            .post("/api/me/daily-routine/generate")
            .set("Cookie", [cookie]);

        expect(success.status).toBe(201);
        expect(success.body.routine.steps.map((step) => step.period)).toEqual([
            "manha",
            "noite",
        ]);
        expect(failure.status).toBe(400);
        expect(stockFailure.status).toBe(400);
        expect(DailyRoutine.findOneAndUpdate).toHaveBeenCalledWith(
            { userId },
            expect.objectContaining({
                $set: expect.objectContaining({ source: "recommendations" }),
            }),
            expect.any(Object),
        );
        expect(DailyRoutine.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    it("protege revisao de recomendacoes por role e permite consultor ajustar", async () => {
        const recommendation = makeRecommendation({
            save: vi.fn().mockResolvedValue(undefined),
        });
        ProductRecommendation.findById.mockReturnValueOnce(
            queryFindByIdPopulate(recommendation),
        );
        RecommendationReview.create.mockResolvedValueOnce({
            _id: objectId("66c0000000000000000000b0"),
            status: "adjusted",
            note: "Ajuste validado.",
            adjustedExplanation: "Explicacao ajustada pelo consultor.",
            createdAt: new Date("2026-06-01T12:00:00.000Z"),
        });

        const app = createApp();
        const clientResponse = await request(app)
            .post(`/api/consultant/recommendations/${recommendationId}/reviews`)
            .set("Cookie", [`orelle_session=${makeToken(ROLES.CLIENTE)}`])
            .send({ status: "approved", note: "Recomendacao coerente." });
        const consultantResponse = await request(app)
            .post(`/api/consultant/recommendations/${recommendationId}/reviews`)
            .set("Cookie", [
                `orelle_session=${makeToken(ROLES.CONSULTOR, consultantId)}`,
            ])
            .send({
                status: "adjusted",
                note: "Ajuste validado.",
                adjustedExplanation: "Explicacao ajustada pelo consultor.",
            });

        expect(clientResponse.status).toBe(403);
        expect(consultantResponse.status).toBe(201);
        expect(recommendation.save).toHaveBeenCalled();
        expect(RecommendationReview.create).toHaveBeenCalledWith(
            expect.objectContaining({ consultantId, clientUserId: userId }),
        );
    });

    it("cria simulacao de maquilhagem com consentimento e sem devolver identificadores privados", async () => {
        FaceConsent.findOne.mockResolvedValueOnce(makeConsent());
        FacePhoto.findOne.mockReturnValueOnce(queryWithSort(makeFacePhoto()));
        Product.findOne.mockReturnValueOnce(queryFindOneSelect(makeProduct()));
        MakeupSimulation.create.mockResolvedValueOnce(makeSimulation());

        const response = await request(createApp())
            .post("/api/makeup-simulations")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ productId });

        expect(response.status).toBe(201);
        expect(response.body.simulation.providerName).toBe(
            "local-makeup-simulation-v1",
        );
        expect(response.body.simulation.preview.visual.beforeImageUrl).toMatch(
            /^data:image\/svg\+xml;charset=utf-8,/,
        );
        expect(response.body.simulation.preview.visual.afterImageUrl).toMatch(
            /^data:image\/svg\+xml;charset=utf-8,/,
        );
        expect(JSON.stringify(response.body)).not.toContain("storageKey");
        expect(JSON.stringify(response.body)).not.toContain("consentId");
        expect(JSON.stringify(response.body)).not.toContain("facePhotoId");
    });

    it("bloqueia simulacao de maquilhagem sem consentimento ativo", async () => {
        FaceConsent.findOne.mockResolvedValueOnce(null);

        const response = await request(createApp())
            .post("/api/makeup-simulations")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ productId });

        expect(response.status).toBe(403);
        expect(FacePhoto.findOne).not.toHaveBeenCalled();
        expect(Product.findOne).not.toHaveBeenCalled();
    });

    it("cria visualizacao antes/depois apenas com simulacao do proprio utilizador e recomendacoes validas", async () => {
        FaceConsent.findOne.mockResolvedValueOnce(makeConsent());
        MakeupSimulation.findOne.mockResolvedValueOnce(makeSimulation());
        ProductRecommendation.find.mockReturnValueOnce(
            queryFindPopulate([makeRecommendation()]),
        );
        BeforeAfterVisualization.findOneAndUpdate.mockResolvedValueOnce({
            _id: objectId(visualizationId),
            beforePanel: makeSimulation().preview.beforePanel,
            afterPanel: makeSimulation().preview.afterPanel,
            summary:
                "Visualizacao antes/depois baseada na simulacao de maquilhagem.",
            visualComparison: {
                type: "safe_svg_before_after",
                beforeImageUrl:
                    "data:image/svg+xml;charset=utf-8,%3Csvg%3Eantes%3C%2Fsvg%3E",
                afterImageUrl:
                    "data:image/svg+xml;charset=utf-8,%3Csvg%3Edepois%3C%2Fsvg%3E",
                altText: "Comparacao visual segura.",
            },
            recommendedProductNames: ["Gel controlo oleosidade"],
            limitations: ["Visualizacao imediata."],
            createdAt: new Date("2026-06-01T13:00:00.000Z"),
            updatedAt: new Date("2026-06-01T13:00:00.000Z"),
        });

        const response = await request(createApp())
            .post("/api/before-after-visualizations")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ simulationId });

        expect(response.status).toBe(201);
        expect(response.body.visualization.recommendedProductNames).toEqual([
            "Gel controlo oleosidade",
        ]);
        expect(response.body.visualization.visualComparison.beforeImageUrl).toMatch(
            /^data:image\/svg\+xml;charset=utf-8,/,
        );
        expect(response.body.visualization.visualComparison.afterImageUrl).toMatch(
            /^data:image\/svg\+xml;charset=utf-8,/,
        );
        expect(MakeupSimulation.findOne).toHaveBeenCalledWith({
            _id: simulationId,
            userId,
        });
        expect(JSON.stringify(response.body)).not.toContain("storageKey");
        expect(JSON.stringify(response.body)).not.toContain("consentId");
        expect(JSON.stringify(response.body)).not.toContain("facePhotoId");
    });

    it("bloqueia visualizacao antes/depois para simulacao inexistente ou de outro utilizador", async () => {
        FaceConsent.findOne.mockResolvedValueOnce(makeConsent());
        MakeupSimulation.findOne.mockResolvedValueOnce(null);

        const response = await request(createApp())
            .post("/api/before-after-visualizations")
            .set("Cookie", [`orelle_session=${makeToken(ROLES.CLIENTE, otherUserId)}`])
            .send({ simulationId });

        expect(response.status).toBe(404);
        expect(ProductRecommendation.find).not.toHaveBeenCalled();
        expect(BeforeAfterVisualization.findOneAndUpdate).not.toHaveBeenCalled();
    });
});
