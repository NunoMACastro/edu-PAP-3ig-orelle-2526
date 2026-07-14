/**
 * Testes focais do BK-MF8-10.
 *
 * Validam input, contexto guiado e negativos de segurança sem depender de uma
 * base de dados real.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { AiConsultationSession } from "../src/models/ai-consultation-session.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import {
    ReportUnlock,
    REPORT_UNLOCK_STATUS,
} from "../src/models/report-unlock.model.js";
import { Product } from "../src/models/product.model.js";
import { Profile } from "../src/models/profile.model.js";
import { listRecommendationHistoryContext } from "../src/services/ai-interaction-history.service.js";
import {
    createSessionToken,
    SESSION_COOKIE_NAME,
} from "../src/services/session.service.js";
import { validateRecommendationGenerationInput } from "../src/validators/recommendation-generation.validator.js";

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

vi.mock("../src/models/product.model.js", () => ({
    Product: {
        find: vi.fn(),
    },
}));

vi.mock("../src/models/product-recommendation.model.js", () => ({
    ProductRecommendation: {
        find: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/report-unlock.model.js", () => ({
    REPORT_UNLOCK_STATUS: {
        LOCKED: "locked",
        UNLOCKED: "unlocked",
    },
    ReportUnlock: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/ai-consultation-review.model.js", () => ({
    AiConsultationReview: {
        findOneAndUpdate: vi.fn(),
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

vi.mock("../src/models/profile.model.js", () => ({
    Profile: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/services/ai-interaction-history.service.js", () => ({
    listMyAiInteractionHistory: vi.fn(),
    listRecommendationHistoryContext: vi.fn(),
    recordAiInteractionHistoryEvent: vi.fn(),
}));

const userId = "66c000000000000000000701";
const analysisId = "66c000000000000000000702";
const reportId = "66c000000000000000000703";
const consultationSessionId = "66c000000000000000000704";
const hydratingProductId = "66c000000000000000000705";
const oilControlProductId = "66c000000000000000000706";
const calmProductId = "66c000000000000000000707";

/**
 * Cria identificador mínimo compatível com DTOs Mongoose.
 *
 * @function objectId
 * @param {string} id - Valor textual.
 * @returns {{toString: Function}} ObjectId simulado.
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
 * Cria cookie autenticado para Supertest.
 *
 * @function makeCookie
 * @returns {string[]} Header Cookie.
 */
function makeCookie() {
    const token = createSessionToken({
        id: userId,
        email: "cliente@orelle.test",
        role: ROLES.CLIENTE,
    });

    return [`${SESSION_COOKIE_NAME}=${token}`];
}

/**
 * Simula query Mongoose terminada em `sort()`.
 *
 * @function querySort
 * @param {unknown} result - Resultado final.
 * @returns {{sort: Function}} Query encadeável.
 */
function querySort(result) {
    return {
        sort: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula query Mongoose `sort().select()`.
 *
 * @function querySortSelect
 * @param {unknown} result - Resultado final.
 * @returns {{sort: Function, select: Function}} Query encadeável.
 */
function querySortSelect(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula query Mongoose `select().limit()`.
 *
 * @function querySelectLimit
 * @param {unknown} result - Resultado final.
 * @returns {{select: Function, limit: Function}} Query encadeável.
 */
function querySelectLimit(result) {
    return {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Simula update Mongoose terminando em `populate()`.
 *
 * @function queryUpdatePopulate
 * @param {unknown} result - Resultado final.
 * @returns {{populate: Function}} Query encadeável.
 */
function queryUpdatePopulate(result) {
    return {
        populate: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Cria análise facial cosmética suficiente para ranking.
 *
 * @function makeAnalysis
 * @returns {object} Análise mock.
 */
function makeAnalysis() {
    return {
        _id: objectId(analysisId),
        mode: "openai",
        isDemo: false,
        providerVersion: "responses-v1",
        findings: {
            skinType: { label: "mista" },
            acne: { label: "moderado" },
            manchas: { label: "baixo" },
            rugas: { label: "baixo" },
            oleosidade: { label: "moderada" },
        },
    };
}

/**
 * Cria relatório facial ativo.
 *
 * @function makeReport
 * @returns {object} Relatório mock.
 */
function makeReport() {
    return {
        _id: objectId(reportId),
        limitations: ["Relatório cosmético sem finalidade médica."],
    };
}

/**
 * Cria perfil cosmético com restrições vazias.
 *
 * @function makeProfile
 * @returns {object} Perfil mock.
 */
function makeProfile(overrides = {}) {
    return {
        userId: objectId(userId),
        genero: "feminino",
        idade: 19,
        tomDePele: "medio",
        allergies: [],
        avoidIngredients: [],
        lightMedicalRestrictions: ["pele reativa"],
        ...overrides,
    };
}

/**
 * Cria produto candidato para recomendações.
 *
 * @function makeProduct
 * @param {string} id - ID do produto.
 * @param {object} overrides - Campos a sobrepor.
 * @returns {object} Produto mock.
 */
function makeProduct(id, overrides) {
    return {
        _id: objectId(id),
        name: "Produto Orélle",
        brandName: "Orélle",
        description: "Produto para pele mista",
        ingredientNames: ["niacinamida"],
        skinTypes: ["mista"],
        imageUrl: "https://example.test/produto.png",
        priceCents: 1299,
        stock: 8,
        ...overrides,
    };
}

/**
 * Cria contexto seguro vindo do BK-MF8-09.
 *
 * @function makeHistoryContext
 * @returns {object[]} Contexto minimizado.
 */
function makeHistoryContext() {
    return [
        {
            eventType: "consultation_submitted",
            purpose: "Continuidade da avaliação cosmética",
            safeSummary:
                "Sessão guiada submetida com objetivo de hidratação.",
            safeSignals: [
                {
                    key: "main_goal",
                    label: "Objetivo principal",
                    value: "hidratar",
                },
            ],
            source: "guided_consultation",
            createdAt: new Date("2026-07-06T10:00:00.000Z"),
        },
    ];
}

/**
 * Cria documento de recomendação populado a partir do update testado.
 *
 * @function makeRecommendationFromUpdate
 * @param {object} filter - Filtro recebido pelo model.
 * @param {object} update - Update recebido pelo model.
 * @param {Map<string, object>} productsById - Produtos por ID.
 * @returns {object} Recomendação mock.
 */
function makeRecommendationFromUpdate(filter, update, productsById) {
    const productId = filter.productId.toString();

    return {
        _id: objectId(`77${productId.slice(2)}`),
        userId,
        analysisId: objectId(analysisId),
        reportId: objectId(reportId),
        analysisMode: update.$set.analysisMode,
        analysisIsDemo: update.$set.analysisIsDemo,
        analysisProviderVersion: update.$set.analysisProviderVersion,
        productId: productsById.get(productId),
        score: update.$set.score,
        reasonCodes: update.$set.reasonCodes,
        explanation: update.$set.explanation,
        sourceSignals: update.$set.sourceSignals,
        limitations: update.$set.limitations,
        machineResult: update.$set.machineResult,
        humanOverride: update.$setOnInsert.humanOverride,
        status: update.$setOnInsert.status,
        feedback: update.$setOnInsert.feedback,
        consultantNote: update.$setOnInsert.consultantNote,
        createdAt: new Date("2026-07-06T10:00:00.000Z"),
        updatedAt: new Date("2026-07-06T10:00:00.000Z"),
    };
}

/**
 * Prepara mocks comuns ao fluxo de geração.
 *
 * @function mockRecommendationBase
 * @returns {object[]} Produtos usados no teste.
 */
function mockRecommendationBase(options = {}) {
    const products = [
        makeProduct(hydratingProductId, {
            name: "Creme hidratante conforto",
            description: "Creme hidratante suave para conforto de pele mista",
        }),
        makeProduct(oilControlProductId, {
            name: "Gel controlo oleosidade",
            description: "Gel para oleosidade moderada em pele mista",
        }),
        makeProduct(calmProductId, {
            name: "Sérum calmante mista",
            description: "Sérum suave para pele mista sensível",
        }),
    ];
    const productsById = new Map(
        products.map((product) => [product._id.toString(), product]),
    );

    FaceAnalysis.findOne.mockReturnValueOnce(querySort(makeAnalysis()));
    FaceReport.findOne.mockReturnValueOnce(querySort(makeReport()));
    AiConsultationSession.findOne.mockReturnValueOnce(
        querySortSelect(
            options.consultationSession === null
                ? null
                : { _id: objectId(consultationSessionId) },
        ),
    );
    Profile.findOne.mockResolvedValueOnce(
        makeProfile(options.profileOverrides),
    );
    Product.find.mockReturnValueOnce(querySelectLimit(products));
    ProductRecommendation.findOneAndUpdate.mockImplementation((filter, update) =>
        queryUpdatePopulate(
            makeRecommendationFromUpdate(filter, update, productsById),
        ),
    );

    return products;
}

describe("BK-MF8-10 - recomendações enriquecidas", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        ReportUnlock.findOne.mockResolvedValue({
            _id: objectId("66c0000000000000000007f0"),
            reportId: objectId(reportId),
            status: REPORT_UNLOCK_STATUS.UNLOCKED,
            recommendedTotalCents: 3000,
            depositCents: 300,
            recommendationIds: [],
            unlockedAt: new Date("2026-06-18T12:00:00.000Z"),
        });
    });

    it("aceita body vazio sem expor identificador de sessão", () => {
        const input = validateRecommendationGenerationInput({});

        expect(input).toEqual({
            historyLimit: 5,
        });
    });

    it("recusa identificador técnico de sessão vindo do browser", () => {
        expect(() =>
            validateRecommendationGenerationInput({ consultationSessionId }),
        ).toThrow("selecionada automaticamente pelo backend");
    });

    it("limita histórico sem aceitar sessão no body", () => {
        const input = validateRecommendationGenerationInput({
            historyLimit: 99,
        });

        expect(input.historyLimit).toBe(10);
    });

    it("remove a geração direta antiga de recomendações", async () => {
        const response = await request(createApp())
            .post("/api/recommendations/generate")
            .set("Cookie", makeCookie())
            .send({ historyLimit: 5 });

        expect(response.status).toBe(404);
        expect(JSON.stringify(response.body)).not.toContain("sessionId");
        expect(JSON.stringify(response.body)).not.toContain("userId");
        expect(listRecommendationHistoryContext).not.toHaveBeenCalled();
        expect(ProductRecommendation.findOneAndUpdate).not.toHaveBeenCalled();
        expect(AiConsultationReview.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("não cria recomendações base sintéticas sem consulta submetida", async () => {
        const response = await request(createApp())
            .post("/api/recommendations/generate")
            .set("Cookie", makeCookie())
            .send({ historyLimit: 5 });

        expect(response.status).toBe(404);
        expect(listRecommendationHistoryContext).not.toHaveBeenCalled();
        expect(AiConsultationReview.findOneAndUpdate).not.toHaveBeenCalled();
        expect(ProductRecommendation.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("não executa ranking antigo com atributos protegidos enviados pelo cliente", async () => {
        const firstResponse = await request(createApp())
            .post("/api/recommendations/generate")
            .set("Cookie", makeCookie())
            .send({
                historyLimit: 5,
                genero: "feminino",
                idade: 18,
                tomDePele: "claro",
            });

        const secondResponse = await request(createApp())
            .post("/api/recommendations/generate")
            .set("Cookie", makeCookie())
            .send({
                historyLimit: 5,
                genero: "masculino",
                idade: 74,
                tomDePele: "escuro",
            });

        expect(firstResponse.status).toBe(404);
        expect(secondResponse.status).toBe(404);
        expect(Profile.findOne).not.toHaveBeenCalled();
        expect(ProductRecommendation.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("não consulta histórico guiado através do endpoint substituído", async () => {
        const response = await request(createApp())
            .post("/api/recommendations/generate")
            .set("Cookie", makeCookie())
            .send({ historyLimit: 5 });

        expect(response.status).toBe(404);
        expect(AiConsultationSession.findOne).not.toHaveBeenCalled();
        expect(listRecommendationHistoryContext).not.toHaveBeenCalled();
        expect(Product.find).not.toHaveBeenCalled();
        expect(ProductRecommendation.findOneAndUpdate).not.toHaveBeenCalled();
        expect(AiConsultationReview.findOneAndUpdate).not.toHaveBeenCalled();
    });
});
