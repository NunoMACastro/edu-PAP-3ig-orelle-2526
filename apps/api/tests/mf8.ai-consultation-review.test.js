/**
 * Testes focais do BK-MF8-11.
 *
 * Cobrem autenticação, role, detalhe minimizado, decisão humana e DTO público
 * sem abrir porta TCP nem ligar a serviços externos.
 */
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { AiConsultationAuditLog } from "../src/models/ai-consultation-audit-log.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import {
    createSessionToken,
    SESSION_COOKIE_NAME,
} from "../src/services/session.service.js";
import { toPublishedConsultantInsightDto } from "../src/services/ai-consultation-review.service.js";
import { validateReviewDecisionInput } from "../src/validators/ai-consultation-review.validator.js";

vi.mock("../src/models/ai-consultation-review.model.js", () => ({
    AI_CONSULTATION_REVIEW_STATUSES: [
        "pending",
        "approved",
        "adjusted",
        "needs_clarification",
    ],
    AiConsultationReview: {
        find: vi.fn(),
        findOne: vi.fn(),
        findById: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/ai-consultation-audit-log.model.js", () => ({
    AiConsultationAuditLog: {
        create: vi.fn(),
    },
}));

vi.mock("../src/models/product-recommendation.model.js", () => ({
    ProductRecommendation: {
        updateMany: vi.fn(),
        updateOne: vi.fn(),
    },
}));

const app = createApp();

const consultantId = new mongoose.Types.ObjectId().toString();
const clientId = new mongoose.Types.ObjectId().toString();
const reviewId = new mongoose.Types.ObjectId().toString();
const sessionId = new mongoose.Types.ObjectId().toString();
const recommendationId = new mongoose.Types.ObjectId().toString();
const foreignRecommendationId = new mongoose.Types.ObjectId().toString();

/**
 * Cria cookie de sessão igual ao usado pela API.
 *
 * @function cookieFor
 * @param {string} role - Role do utilizador autenticado.
 * @returns {string[]} Header Cookie para Supertest.
 */
function cookieFor(role) {
    const token = createSessionToken({
        id: role === ROLES.CLIENTE ? clientId : consultantId,
        email: `${role}@orelle.test`,
        role,
    });

    return [`${SESSION_COOKIE_NAME}=${token}`];
}

/**
 * Cria uma query Mongoose falsa com encadeamento comum.
 *
 * @function queryResult
 * @param {unknown} value - Valor resolvido pela query.
 * @returns {object} Query mínima para mocks.
 */
function queryResult(value) {
    return {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(value),
    };
}

/**
 * Cria uma revisão persistida falsa com método `save`.
 *
 * @function makeReview
 * @param {object} [overrides={}] - Campos a sobrepor.
 * @returns {object} Revisão compatível com o service.
 */
function makeReview(overrides = {}) {
    return {
        _id: reviewId,
        userId: clientId,
        consultationSessionId: sessionId,
        recommendationIds: [
            {
                _id: recommendationId,
                productId: {
                    _id: new mongoose.Types.ObjectId().toString(),
                    name: "Sérum barreira",
                    brandName: "Orélle",
                    imageUrl: "/products/serum.png",
                    priceCents: 2490,
                    stock: 8,
                },
                score: 0.91,
                status: "active",
                reasonCodes: ["guided_context_match"],
                explanation: "Compatível com a avaliação guiada e o relatório.",
                sourceSignals: ["guidedContext:hidratar", "report:relatorio_cosmetico"],
                limitations: ["Confirma tolerância individual antes de usar."],
            },
        ],
        status: "pending",
        summary: "Sessão IA com recomendação enriquecida para revisão.",
        sourceLabels: ["respostas da avaliação guiada: hidratar"],
        limitations: ["Não substitui aconselhamento profissional presencial."],
        publicInsight: null,
        internalNote: null,
        reviewedBy: null,
        reviewedAt: null,
        auditTrail: [],
        machineResult: {
            recommendationIds: [recommendationId],
            summary: "Snapshot de máquina para revisão humana.",
            sourceLabels: ["respostas guiadas"],
            limitations: ["Limitação cosmética."],
            generatedAt: new Date("2026-07-06T09:59:00.000Z"),
        },
        humanOverride: null,
        updatedAt: new Date("2026-07-06T10:00:00.000Z"),
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

/**
 * Simula o compare-and-set da decisão e aplica o update ao documento mock.
 *
 * @function arrangeDecisionCas
 * @param {object} review - Revisão pendente usada pelo teste.
 * @returns {void}
 */
function arrangeDecisionCas(review) {
    vi.spyOn(AiConsultationReview, "findOneAndUpdate").mockImplementation(
        (_filter, update) => {
            Object.assign(review, update.$set);
            review.auditTrail.push(update.$push.auditTrail);
            return queryResult(review);
        },
    );
    vi.spyOn(AiConsultationAuditLog, "create").mockResolvedValue([{}]);
}

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe("BK-MF8-11 revisão humana de sessões IA", () => {
    it("bloqueia pedidos sem sessão na fila de consultor", async () => {
        const response = await request(app).get(
            "/api/consultant/ai-consultation-reviews",
        );

        expect(response.status).toBe(401);
    });

    it("bloqueia clientes na fila de consultor", async () => {
        const response = await request(app)
            .get("/api/consultant/ai-consultation-reviews")
            .set("Cookie", cookieFor(ROLES.CLIENTE));

        expect(response.status).toBe(403);
    });

    it("lista revisões para consultor autenticado sem expor userId", async () => {
        vi.spyOn(AiConsultationReview, "find").mockReturnValue(
            queryResult([makeReview()]),
        );

        const response = await request(app)
            .get("/api/consultant/ai-consultation-reviews")
            .set("Cookie", cookieFor(ROLES.CONSULTOR));

        expect(response.status).toBe(200);
        expect(response.body.reviews).toHaveLength(1);
        expect(response.body.reviews[0]).not.toHaveProperty("userId");
        expect(response.body.reviews[0]).not.toHaveProperty("consultationSessionId");
        expect(AiConsultationAuditLog.create).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    actorId: consultantId,
                    actorRole: ROLES.CONSULTOR,
                    action: "list",
                    resultCount: 1,
                }),
            ],
            undefined,
        );
    });

    it("devolve detalhe minimizado para decisão humana", async () => {
        vi.spyOn(AiConsultationReview, "findOne").mockReturnValue(
            queryResult(makeReview()),
        );

        const response = await request(app)
            .get(`/api/consultant/ai-consultation-reviews/${reviewId}`)
            .set("Cookie", cookieFor(ROLES.ADMIN));

        expect(response.status).toBe(200);
        expect(response.body.review.recommendations).toHaveLength(1);
        expect(response.body.review.recommendations[0].sourceLabels).toContain(
            "respostas da avaliação guiada: hidratar",
        );
        expect(JSON.stringify(response.body.review)).not.toContain("actorId");
        expect(JSON.stringify(response.body.review)).not.toContain("userId");
        expect(AiConsultationAuditLog.create).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    actorId: consultantId,
                    actorRole: ROLES.ADMIN,
                    action: "detail",
                    reviewId,
                }),
            ],
            undefined,
        );
    });

    it("recusa decisão inválida antes do service", () => {
        expect(() =>
            validateReviewDecisionInput(
                { reviewId },
                { decision: "publish", publicNote: "Nota pública segura." },
            ),
        ).toThrow("Decisão de revisão inválida");
    });

    it("preserva instructions e cautions na rotina humana ajustada", () => {
        const input = validateReviewDecisionInput(
            { reviewId },
            {
                decision: "adjusted",
                publicNote: "Ajustei a rotina para uma utilização mais segura.",
                adjustedRecommendationIds: [recommendationId],
                adjustedContent: {
                    assessment:
                        "Avaliação cosmética ajustada pelo consultor humano.",
                    routine: [
                        {
                            period: "manha",
                            title: "Proteção diária",
                            reason: "Reduzir a exposição cosmética acumulada.",
                            instructions:
                                "Aplicar uniformemente e renovar quando necessário.",
                            cautions: [
                                "Evitar contacto direto com os olhos.",
                                "Suspender em caso de desconforto persistente.",
                            ],
                        },
                    ],
                },
            },
        );

        expect(input.adjustedContent.routine).toEqual([
            {
                period: "manha",
                title: "Proteção diária",
                reason: "Reduzir a exposição cosmética acumulada.",
                instructions:
                    "Aplicar uniformemente e renovar quando necessário.",
                cautions: [
                    "Evitar contacto direto com os olhos.",
                    "Suspender em caso de desconforto persistente.",
                ],
            },
        ]);
    });

    it("aceita ajuste textual sem exigir recomendações", () => {
        const input = validateReviewDecisionInput(
            { reviewId },
            {
                decision: "adjusted",
                publicNote: "Avaliação revista pelo consultor humano.",
                adjustedRecommendationIds: [],
                adjustedContent: {
                    assessment:
                        "Avaliação cosmética ajustada sem produtos associados.",
                },
            },
        );

        expect(input.adjustedRecommendationIds).toEqual([]);
        expect(input.adjustedContent).toEqual({
            assessment:
                "Avaliação cosmética ajustada sem produtos associados.",
            routine: null,
            recommendations: null,
        });
    });

    it("aceita ajuste de rotina sem exigir recomendações", () => {
        const input = validateReviewDecisionInput(
            { reviewId },
            {
                decision: "adjusted",
                publicNote: "Rotina revista pelo consultor humano.",
                adjustedRecommendationIds: [],
                adjustedContent: {
                    routine: [
                        {
                            period: "noite",
                            title: "Hidratação noturna",
                            reason: "Apoiar o conforto cosmético da pele.",
                            instructions: "Aplicar uma camada fina ao deitar.",
                            cautions: [],
                        },
                    ],
                },
            },
        );

        expect(input.adjustedRecommendationIds).toEqual([]);
        expect(input.adjustedContent.routine).toHaveLength(1);
    });

    it.each([
        [
            "instructions",
            {
                period: "manha",
                title: "Proteção diária",
                reason: "Reduzir a exposição cosmética acumulada.",
                cautions: [],
            },
        ],
        [
            "cautions",
            {
                period: "manha",
                title: "Proteção diária",
                reason: "Reduzir a exposição cosmética acumulada.",
                instructions: "Aplicar uniformemente.",
            },
        ],
    ])("recusa rotina ajustada sem %s", (_field, step) => {
        expect(() =>
            validateReviewDecisionInput(
                { reviewId },
                {
                    decision: "adjusted",
                    publicNote:
                        "Ajustei a rotina para uma utilização mais segura.",
                    adjustedRecommendationIds: [recommendationId],
                    adjustedContent: { routine: [step] },
                },
            ),
        ).toThrow();
    });

    it.each(["approved", "needs_clarification"])(
        "recusa campos de ajuste quando decision=%s",
        (decision) => {
            expect(() =>
                validateReviewDecisionInput(
                    { reviewId },
                    {
                        decision,
                        publicNote:
                            decision === "approved"
                                ? "Relatório validado pelo consultor humano."
                                : "Indica a reação cosmética observada anteriormente.",
                        adjustedRecommendationIds: [recommendationId],
                        adjustedContent: {
                            assessment:
                                "Este ajuste não pertence a esta decisão.",
                        },
                    },
                ),
            ).toThrow();
        },
    );

    it("regista decisão ajustada e audit trail", async () => {
        const review = makeReview();
        vi.spyOn(AiConsultationReview, "findById").mockReturnValue(
            queryResult(review),
        );
        arrangeDecisionCas(review);
        vi.spyOn(ProductRecommendation, "updateOne").mockResolvedValue({
            matchedCount: 1,
        });

        const response = await request(app)
            .post(`/api/consultant/ai-consultation-reviews/${reviewId}/decision`)
            .set("Cookie", cookieFor(ROLES.CONSULTOR))
            .send({
                decision: "adjusted",
                publicNote: "Ajustei a recomendação para refletir a sessão.",
                internalNote: "Cliente pediu rotina mais simples.",
                adjustedRecommendationIds: [recommendationId],
            });

        expect(response.status).toBe(200);
        expect(ProductRecommendation.updateOne).toHaveBeenCalledWith(
            {
                _id: recommendationId,
                userId: clientId,
                humanOverride: null,
            },
            {
                $set: {
                    status: "accepted",
                    consultantNote:
                        "Ajustei a recomendação para refletir a sessão.",
                    humanOverride: {
                        decision: "accepted",
                        note: "Ajustei a recomendação para refletir a sessão.",
                        reviewId: review._id,
                        reviewedAt: expect.any(Date),
                    },
                },
            },
            undefined,
        );
        expect(review.save).not.toHaveBeenCalled();
        expect(review.auditTrail).toHaveLength(1);
        expect(review.humanOverride).toEqual(
            expect.objectContaining({
                decision: "adjusted",
                reviewId: review._id,
            }),
        );
        expect(response.body.review.publicInsight.note).toContain("Ajustei");
        expect(JSON.stringify(response.body.review)).not.toContain("actorId");
        expect(AiConsultationAuditLog.create).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    actorId: consultantId,
                    action: "decision",
                    reviewId,
                }),
            ],
            undefined,
        );
    });

    it("recusa propriedades inesperadas e IDs duplicados no contrato v6", () => {
        expect(() =>
            validateReviewDecisionInput(
                { reviewId },
                {
                    decision: "adjusted",
                    publicNote: "Ajuste seguro para o relatório cosmético.",
                    adjustedRecommendationIds: [
                        recommendationId,
                        recommendationId,
                    ],
                    adjustedContent: {
                        recommendations: [],
                    },
                },
            ),
        ).toThrow("duplicados");

        expect(() =>
            validateReviewDecisionInput(
                { reviewId },
                {
                    decision: "approved",
                    publicNote: "Relatório revisto e aprovado pelo consultor.",
                    unexpected: true,
                },
            ),
        ).toThrow("propriedades inesperadas");
    });

    it("recusa orientação insegura e campos de ajuste numa aprovação", () => {
        expect(() =>
            validateReviewDecisionInput(
                { reviewId },
                {
                    decision: "adjusted",
                    publicNote: "Ajuste seguro para o relatório cosmético.",
                    adjustedRecommendationIds: [recommendationId],
                    adjustedContent: {
                        recommendations: [
                            {
                                recommendationId,
                                explanation:
                                    "Este produto garante um resultado garantido.",
                                usage: "Aplicar uma vez por dia.",
                                cautions: [],
                            },
                        ],
                    },
                },
            ),
        ).toThrow("promessa ou diagnóstico");

        expect(() =>
            validateReviewDecisionInput(
                { reviewId },
                {
                    decision: "approved",
                    publicNote: "Relatório revisto e aprovado pelo consultor.",
                    adjustedRecommendationIds: [],
                },
            ),
        ).toThrow("Campos de ajuste");
    });

    it("recusa ajustar recomendação que não pertence à revisão", async () => {
        const review = makeReview();
        vi.spyOn(AiConsultationReview, "findById").mockReturnValue(
            queryResult(review),
        );

        const response = await request(app)
            .post(`/api/consultant/ai-consultation-reviews/${reviewId}/decision`)
            .set("Cookie", cookieFor(ROLES.CONSULTOR))
            .send({
                decision: "adjusted",
                publicNote: "Ajustei a recomendação para refletir a sessão.",
                internalNote: "Tentativa com recomendação externa.",
                adjustedRecommendationIds: [foreignRecommendationId],
            });

        expect(response.status).toBe(400);
        expect(ProductRecommendation.updateMany).not.toHaveBeenCalled();
        expect(review.save).not.toHaveBeenCalled();
    });

    it("recusa segunda decisão sobre revisão fechada", async () => {
        const review = makeReview({ status: "approved" });
        vi.spyOn(AiConsultationReview, "findById").mockReturnValue(
            queryResult(review),
        );

        const response = await request(app)
            .post(`/api/consultant/ai-consultation-reviews/${reviewId}/decision`)
            .set("Cookie", cookieFor(ROLES.CONSULTOR))
            .send({
                decision: "approved",
                publicNote: "Recomendação validada para o cliente.",
            });

        expect(response.status).toBe(409);
        expect(review.save).not.toHaveBeenCalled();
    });

    it("exporta DTO público reutilizável pelo BK-MF8-12 sem nota interna", () => {
        const reviewedAt = new Date("2026-07-06T11:00:00.000Z");
        const publishedAt = new Date("2026-07-06T11:01:00.000Z");
        const dto = toPublishedConsultantInsightDto(
            makeReview({
                status: "approved",
                reviewedAt,
                publicInsight: {
                    note: "Recomendação validada com ajuste seguro.",
                    publishedAt,
                },
                internalNote: "Nota operacional reservada.",
            }),
        );

        expect(dto).toEqual({
            id: reviewId,
            status: "approved",
            note: "Recomendação validada com ajuste seguro.",
            publishedAt,
            reviewedAt,
            recommendations: [
                {
                    id: recommendationId,
                    product: {
                        id: expect.any(String),
                        name: "Sérum barreira",
                        brandName: "Orélle",
                        imageUrl: "/products/serum.png",
                        priceCents: 2490,
                        stock: 8,
                    },
                    score: 0.91,
                    status: "active",
                    reasonCodes: ["guided_context_match"],
                    explanation:
                        "Compatível com a avaliação guiada e o relatório.",
                    sourceLabels: [
                        "respostas da avaliação guiada: hidratar",
                        "relatório cosmético mais recente: relatorio_cosmetico",
                    ],
                    limitations: [
                        "Confirma tolerância individual antes de usar.",
                    ],
                },
            ],
        });
        expect(dto).not.toHaveProperty("consultationSessionId");
        expect(JSON.stringify(dto)).not.toContain("Nota operacional");
    });
});
