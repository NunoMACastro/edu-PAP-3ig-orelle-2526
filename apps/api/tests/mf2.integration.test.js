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
import {
    ReportUnlock,
    REPORT_UNLOCK_STATUS,
} from "../src/models/report-unlock.model.js";
import { DailyRoutine } from "../src/models/daily-routine.model.js";
import { RecommendationReview } from "../src/models/recommendation-review.model.js";
import { MakeupSimulation } from "../src/models/makeup-simulation.model.js";
import { BeforeAfterVisualization } from "../src/models/before-after-visualization.model.js";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import { Profile } from "../src/models/profile.model.js";
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

vi.mock("../src/models/report-unlock.model.js", () => ({
    REPORT_UNLOCK_STATUS: {
        LOCKED: "locked",
        UNLOCKED: "unlocked",
    },
    ReportUnlock: {
        find: vi.fn(),
        findOne: vi.fn(),
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
    MAKEUP_SIMULATION_STATUSES: {
        QUEUED: "queued",
        PROCESSING: "processing",
        COMPLETED: "completed",
        FAILED_RETRYABLE: "failed_retryable",
        FAILED_TERMINAL: "failed_terminal",
        EXPIRED: "expired",
        CANCELLED: "cancelled",
    },
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

vi.mock("../src/models/profile.model.js", () => ({
    Profile: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/ai-consultation-session.model.js", () => ({
    AI_CONSULTATION_FLOW_STATES: {
        COLLECTING_PHOTOS: "collecting_photos",
        ANALYZING: "analyzing",
        ASKING_QUESTIONS: "asking_questions",
        GENERATING_REPORT: "generating_report",
        FAILED_RETRYABLE: "failed_retryable",
    },
    AI_CONSULTATION_STATUS: {
        DRAFT: "draft",
        SUBMITTED: "submitted",
    },
    AiConsultationSession: {
        findOne: vi.fn(),
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
const simulationId = "66c000000000000000000080";

/**
 * Cria um identificador mínimo com a interface usada pelos DTOs.
 *
 * @function objectId
 * @param {string} id - Valor textual a devolver por `toString`.
 * @returns {{toString: Function}} Objeto que simula um ObjectId Mongoose.
 */
function objectId(id) {
    return {
        /**
         * Devolve o valor textual do ObjectId simulado.
         *
         * @function toString
         * @returns {string} Identificador textual usado no teste.
         */
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
 * @returns {string} Token opaco de sessão válido para os testes.
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
 * Cria gate académico mock para recomendações derivadas.
 *
 * @function makeReportUnlock
 * @param {object} [overrides={}] - Campos a sobrepor no gate base.
 * @returns {object} Gate de paywall mock.
 */
function makeReportUnlock(overrides = {}) {
    return {
        _id: objectId("66c0000000000000000000c0"),
        userId,
        reportId: objectId(reportId),
        recommendationIds: [objectId(recommendationId)],
        recommendedTotalCents: 1299,
        depositCents: 130,
        status: REPORT_UNLOCK_STATUS.UNLOCKED,
        unlockedAt: new Date("2026-06-01T10:30:00.000Z"),
        ...overrides,
    };
}

function querySelectLean(result) {
    const query = {
        select: vi.fn(),
        lean: vi.fn().mockResolvedValue(result),
    };
    query.select.mockReturnValue(query);
    return query;
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
        humanOverride: null,
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

describe("MF2 - integracao HTTP", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        ReportUnlock.findOne.mockResolvedValue(makeReportUnlock());
        ReportUnlock.find.mockReturnValue(
            querySelectLean([
                {
                    analysisId: objectId(analysisId),
                    reportId: objectId(reportId),
                    status: REPORT_UNLOCK_STATUS.UNLOCKED,
                },
            ]),
        );
        AiConsultationSession.findOne.mockReturnValue({
            sort: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue(null),
        });
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
            _id: { $in: [analysisId] },
        });
    });

    it("bloqueia evolucao temporal sem sessao", async () => {
        const response = await request(createApp()).get("/api/me/skin-evolution");

        expect(response.status).toBe(401);
        expect(FaceAnalysis.find).not.toHaveBeenCalled();
    });

    it("remove a geração direta antiga de recomendações", async () => {
        const response = await request(createApp())
            .post("/api/recommendations/generate")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(404);
        expect(JSON.stringify(response.body)).not.toContain("storageKey");
        expect(FaceAnalysis.findOne).not.toHaveBeenCalled();
        expect(FaceReport.findOne).not.toHaveBeenCalled();
        expect(Product.find).not.toHaveBeenCalled();
    });

    it("não avalia perfil no endpoint antigo de recomendações", async () => {
        const response = await request(createApp())
            .post("/api/recommendations/generate")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(404);
        expect(Profile.findOne).not.toHaveBeenCalled();
        expect(Product.find).not.toHaveBeenCalled();
    });

    it("não tenta recuperar relatórios no endpoint antigo de recomendações", async () => {
        const response = await request(createApp())
            .post("/api/recommendations/generate")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(404);
        expect(FaceReport.findOne).not.toHaveBeenCalled();
        expect(Product.find).not.toHaveBeenCalled();
    });

    it("lista recomendacoes e regista feedback com ownership pelo utilizador autenticado", async () => {
        const machineExplanation =
            "Gel controlo oleosidade foi recomendado porque e compativel com a pele.";
        const adjustedExplanation =
            "Explicação ajustada e publicada sem alterar o snapshot automático.";
        ProductRecommendation.find.mockReturnValueOnce(
            queryFindPopulate([
                makeRecommendation({
                    humanOverride: {
                        decision: "adjusted",
                        adjustedExplanation,
                        reviewId: objectId("66c0000000000000000000b1"),
                    },
                }),
            ]),
        );
        ProductRecommendation.findById.mockResolvedValueOnce(makeRecommendation());
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
        expect(list.body.recommendations[0]).toMatchObject({
            explanation: adjustedExplanation,
            machineExplanation,
        });
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

    it("bloqueia rotina diaria derivada quando o report das recomendacoes está locked", async () => {
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
        ReportUnlock.findOne.mockResolvedValueOnce(
            makeReportUnlock({ status: REPORT_UNLOCK_STATUS.LOCKED }),
        );

        const response = await request(createApp())
            .post("/api/me/daily-routine/generate")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(423);
        expect(response.body.error.message).toBe(
            "Relatório bloqueado por pagamento académico simulado",
        );
        expect(DailyRoutine.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("remove a revisão individual antiga para todas as roles", async () => {
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

        expect(clientResponse.status).toBe(404);
        expect(consultantResponse.status).toBe(404);
        expect(ProductRecommendation.findById).not.toHaveBeenCalled();
        expect(ProductRecommendation.findOneAndUpdate).not.toHaveBeenCalled();
        expect(RecommendationReview.create).not.toHaveBeenCalled();
    });

    it("remove a rota direta antiga de simulação de maquilhagem", async () => {
        const response = await request(createApp())
            .post("/api/makeup-simulations")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ productId });

        expect(response.status).toBe(404);
        expect(FaceConsent.findOne).not.toHaveBeenCalled();
        expect(FacePhoto.findOne).not.toHaveBeenCalled();
        expect(Product.findOne).not.toHaveBeenCalled();
        expect(MakeupSimulation.create).not.toHaveBeenCalled();
    });

    it("não expõe a rota direta antiga mesmo sem consentimento", async () => {
        const response = await request(createApp())
            .post("/api/makeup-simulations")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ productId });

        expect(response.status).toBe(404);
        expect(FaceConsent.findOne).not.toHaveBeenCalled();
        expect(FacePhoto.findOne).not.toHaveBeenCalled();
        expect(Product.findOne).not.toHaveBeenCalled();
    });

    it("remove o endpoint conceptual antigo de antes/depois", async () => {
        const response = await request(createApp())
            .post("/api/before-after-visualizations")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ simulationId });

        expect(response.status).toBe(404);
        expect(MakeupSimulation.findOne).not.toHaveBeenCalled();
        expect(ProductRecommendation.find).not.toHaveBeenCalled();
        expect(BeforeAfterVisualization.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("não consulta o gate antigo no endpoint antes/depois substituído", async () => {
        const response = await request(createApp())
            .post("/api/before-after-visualizations")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ simulationId });

        expect(response.status).toBe(404);
        expect(ReportUnlock.findOne).not.toHaveBeenCalled();
        expect(BeforeAfterVisualization.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("não revela ownership através do endpoint antes/depois substituído", async () => {
        const response = await request(createApp())
            .post("/api/before-after-visualizations")
            .set("Cookie", [`orelle_session=${makeToken(ROLES.CLIENTE, otherUserId)}`])
            .send({ simulationId });

        expect(response.status).toBe(404);
        expect(MakeupSimulation.findOne).not.toHaveBeenCalled();
        expect(ProductRecommendation.find).not.toHaveBeenCalled();
        expect(BeforeAfterVisualization.findOneAndUpdate).not.toHaveBeenCalled();
    });
});
