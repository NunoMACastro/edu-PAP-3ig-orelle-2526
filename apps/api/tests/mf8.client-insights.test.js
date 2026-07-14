/**
 * Testes focais do BK-MF8-12.
 *
 * Cobrem o endpoint de cliente para insights publicados pelo consultor, com
 * ownership por sessão, filtro opcional e DTO público sem campos internos.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import {
    createSessionToken,
    SESSION_COOKIE_NAME,
} from "../src/services/session.service.js";

vi.mock("../src/models/ai-consultation-review.model.js", () => ({
    AI_CONSULTATION_REVIEW_STATUSES: [
        "pending",
        "approved",
        "adjusted",
        "needs_clarification",
    ],
    AiConsultationReview: {
        find: vi.fn(),
        findById: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/report-unlock.model.js", () => ({
    REPORT_UNLOCK_STATUS: { LOCKED: "locked", UNLOCKED: "unlocked" },
    ReportUnlock: { find: vi.fn() },
}));

const clientUserId = new mongoose.Types.ObjectId().toString();
const otherClientUserId = new mongoose.Types.ObjectId().toString();
const reviewId = new mongoose.Types.ObjectId().toString();
const reportId = new mongoose.Types.ObjectId().toString();
const consultationSessionId = new mongoose.Types.ObjectId().toString();
const recommendationId = new mongoose.Types.ObjectId().toString();
const productId = new mongoose.Types.ObjectId().toString();

/**
 * Cria cookie de sessão igual ao fluxo real da API.
 *
 * @function cookieFor
 * @param {string} role - Role do utilizador autenticado.
 * @returns {string[]} Header Cookie para Supertest.
 */
function cookieFor(role = ROLES.CLIENTE) {
    const token = createSessionToken({
        id: clientUserId,
        email: `${role}@orelle.test`,
        role,
    });

    return [`${SESSION_COOKIE_NAME}=${token}`];
}

/**
 * Cria query Mongoose falsa com a cadeia usada pelo service.
 *
 * @function queryResult
 * @param {object[]} value - Resultado final da query.
 * @returns {object} Query encadeável.
 */
function queryResult(value) {
    return {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(value),
    };
}

function unlockedReportsQuery(value) {
    const query = {
        select: vi.fn(),
        lean: vi.fn().mockResolvedValue(value),
    };
    query.select.mockReturnValue(query);
    return query;
}

/**
 * Cria review publicada compatível com o DTO do BK-MF8-12.
 *
 * @function makePublishedReview
 * @param {object} [overrides={}] - Campos a sobrepor.
 * @returns {object} Documento simulado.
 */
function makePublishedReview(overrides = {}) {
    return {
        _id: reviewId,
        userId: clientUserId,
        reportId,
        consultationSessionId,
        status: "adjusted",
        reviewedAt: new Date("2026-07-06T11:00:00.000Z"),
        updatedAt: new Date("2026-07-06T11:02:00.000Z"),
        publicInsight: {
            note: "A rotina foi ajustada para respeitar as tuas restrições.",
            publishedAt: new Date("2026-07-06T11:03:00.000Z"),
        },
        internalNote: "Nota privada reservada ao consultor.",
        reviewedBy: new mongoose.Types.ObjectId().toString(),
        auditTrail: [
            {
                actorId: new mongoose.Types.ObjectId().toString(),
                actorRole: ROLES.CONSULTOR,
                action: "adjusted",
                occurredAt: new Date("2026-07-06T11:03:00.000Z"),
            },
        ],
        recommendationIds: [
            {
                _id: recommendationId,
                productId: {
                    _id: productId,
                    name: "Creme barreira",
                    brandName: "Orélle",
                    imageUrl: "/products/creme-barreira.png",
                    priceCents: 1990,
                    stock: 12,
                },
                score: 0.88,
                status: "adjusted",
                reasonCodes: ["guided_context_match"],
                explanation: "Respeita as respostas da avaliação guiada.",
                sourceSignals: ["guidedContext:hidratar"],
                limitations: ["Não substitui aconselhamento médico."],
            },
        ],
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    ReportUnlock.find.mockReturnValue(
        unlockedReportsQuery([{ reportId }]),
    );
});

describe("BK-MF8-12 insights do consultor visíveis para cliente", () => {
    it("bloqueia pedidos sem sessão autenticada", async () => {
        const response = await request(createApp()).get(
            "/api/me/ai-consultation-insights",
        );

        expect(response.status).toBe(401);
        expect(AiConsultationReview.find).not.toHaveBeenCalled();
    });

    it("rejeita consultationSessionId inválido antes de consultar o modelo", async () => {
        const response = await request(createApp())
            .get("/api/me/ai-consultation-insights?consultationSessionId=abc")
            .set("Cookie", cookieFor());

        expect(response.status).toBe(400);
        expect(AiConsultationReview.find).not.toHaveBeenCalled();
    });

    it("lista apenas insights publicados do utilizador autenticado", async () => {
        vi.spyOn(AiConsultationReview, "find").mockReturnValue(
            queryResult([makePublishedReview()]),
        );

        const response = await request(createApp())
            .get("/api/me/ai-consultation-insights")
            .set("Cookie", cookieFor());

        expect(response.status).toBe(200);
        expect(AiConsultationReview.find).toHaveBeenCalledWith({
            userId: clientUserId,
            status: { $in: ["approved", "adjusted"] },
            publicInsight: { $ne: null },
        });
        expect(JSON.stringify(response.body)).not.toContain(otherClientUserId);
        expect(response.body.insights).toHaveLength(1);
        expect(response.body.insights[0]).toMatchObject({
            id: reviewId,
            status: "adjusted",
            note: "A rotina foi ajustada para respeitar as tuas restrições.",
        });
        expect(response.body.insights[0].recommendations[0]).toMatchObject({
            id: recommendationId,
            product: { id: productId, name: "Creme barreira" },
        });
    });

    it("aplica filtro opcional de sessão sem aceitar userId vindo do browser", async () => {
        vi.spyOn(AiConsultationReview, "find").mockReturnValue(queryResult([]));

        const response = await request(createApp())
            .get(
                `/api/me/ai-consultation-insights?consultationSessionId=${consultationSessionId}`,
            )
            .set("Cookie", cookieFor());

        expect(response.status).toBe(200);
        expect(AiConsultationReview.find).toHaveBeenCalledWith({
            userId: clientUserId,
            status: { $in: ["approved", "adjusted"] },
            publicInsight: { $ne: null },
            consultationSessionId,
        });
    });

    it("remove reviews sem nota pública mesmo se a query mockada as devolver", async () => {
        vi.spyOn(AiConsultationReview, "find").mockReturnValue(
            queryResult([makePublishedReview({ publicInsight: null })]),
        );

        const response = await request(createApp())
            .get("/api/me/ai-consultation-insights")
            .set("Cookie", cookieFor());

        expect(response.status).toBe(200);
        expect(response.body.insights).toEqual([]);
    });

    it("não expõe campos internos da revisão no DTO público", async () => {
        vi.spyOn(AiConsultationReview, "find").mockReturnValue(
            queryResult([makePublishedReview()]),
        );

        const response = await request(createApp())
            .get("/api/me/ai-consultation-insights")
            .set("Cookie", cookieFor());

        expect(response.status).toBe(200);
        expect(response.body.insights[0]).not.toHaveProperty("userId");
        expect(response.body.insights[0]).not.toHaveProperty(
            "consultationSessionId",
        );
        expect(response.body.insights[0]).not.toHaveProperty("internalNote");
        expect(response.body.insights[0]).not.toHaveProperty("reviewedBy");
        expect(response.body.insights[0]).not.toHaveProperty("auditTrail");
        expect(JSON.stringify(response.body)).not.toContain("Nota privada");
        expect(JSON.stringify(response.body)).not.toContain("actorId");
    });

    it("não publica recomendações dismissed nem fora da seleção final", async () => {
        const dismissed = makePublishedReview({
            humanOverride: {
                decision: "adjusted",
                finalRecommendationIds: [],
            },
            recommendationIds: [
                {
                    ...makePublishedReview().recommendationIds[0],
                    status: "dismissed",
                },
            ],
        });
        vi.spyOn(AiConsultationReview, "find").mockReturnValue(
            queryResult([dismissed]),
        );

        const response = await request(createApp())
            .get("/api/me/ai-consultation-insights")
            .set("Cookie", cookieFor());

        expect(response.status).toBe(200);
        expect(response.body.insights[0].recommendations).toEqual([]);
    });
});
