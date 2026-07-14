/**
 * Testes da MF8 para historico seguro da interacao cliente-IA.
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
    listRecommendationHistoryContext,
    recordAiInteractionHistoryEvent,
} from "../src/services/ai-interaction-history.service.js";

vi.mock("../src/models/ai-interaction-history.model.js", () => ({
    AI_HISTORY_EVENT_TYPES: [
        "consultation_submitted",
        "answer_summary_ready",
        "recommendation_context_ready",
    ],
    AI_HISTORY_SOURCES: ["guided_consultation", "recommendation_engine"],
    AiInteractionHistory: {
        create: vi.fn(),
        find: vi.fn(),
    },
}));

const userId = "66a000000000000000000001";
const sessionId = "66b000000000000000000001";
const historyId = "66c000000000000000000001";

/**
 * Cria um identificador minimo com interface de ObjectId.
 *
 * @function objectId
 * @param {string} id - Valor textual.
 * @returns {{toString: Function}} ID compativel com DTOs.
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
 * Cria evento de historico mock.
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
        purpose: "Continuidade da avaliacao cosmetica",
        safeSummary: "Sessao guiada submetida com objetivo de luminosidade.",
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
 * @returns {{sort: Function, limit: Function}} Query encadeavel.
 */
function querySortLimit(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

describe("BK-MF8-09 - historico seguro da interacao cliente-IA", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("regista evento minimizado e devolve DTO publico", async () => {
        AiInteractionHistory.create.mockResolvedValueOnce(makeHistoryItem());

        const event = await recordAiInteractionHistoryEvent({
            userId,
            sessionId,
            eventType: "consultation_submitted",
            purpose: "Continuidade da avaliacao cosmetica",
            safeSummary:
                "Sessao guiada submetida com objetivo de luminosidade.",
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
        expect(event.userId).toBeUndefined();
        expect(event.sessionId).toBeUndefined();
    });

    it("recusa conteudo sensivel antes de criar documento", async () => {
        await expect(
            recordAiInteractionHistoryEvent({
                userId,
                sessionId,
                eventType: "answer_summary_ready",
                purpose: "Continuidade da avaliacao cosmetica",
                safeSummary: "Resumo com prompt interno copiado.",
                safeSignals: [
                    {
                        key: "main_goal",
                        label: "Objetivo principal",
                        value: "Luminosidade",
                    },
                ],
            }),
        ).rejects.toThrow("Historico IA contem dado sensivel.");

        expect(AiInteractionHistory.create).not.toHaveBeenCalled();
    });

    it("lista apenas historico do utilizador autenticado pelo filtro do backend", async () => {
        AiInteractionHistory.find.mockReturnValueOnce(
            querySortLimit([makeHistoryItem()]),
        );

        const history = await listMyAiInteractionHistory(userId, { limit: 5 });

        expect(AiInteractionHistory.find).toHaveBeenCalledWith({ userId });
        expect(history).toHaveLength(1);
        expect(history[0].safeSignals[0].key).toBe("main_goal");
        expect(history[0].userId).toBeUndefined();
        expect(history[0].sessionId).toBeUndefined();
    });

    it("entrega contexto interno sem IDs para o BK-MF8-10", async () => {
        AiInteractionHistory.find.mockReturnValueOnce(
            querySortLimit([makeHistoryItem()]),
        );

        const context = await listRecommendationHistoryContext(userId, {
            sessionId,
            limit: 3,
        });

        expect(AiInteractionHistory.find).toHaveBeenCalledWith({
            userId,
            sessionId,
        });
        expect(context[0].safeSignals[0].value).toBe("Luminosidade");
        expect(context[0].userId).toBeUndefined();
        expect(context[0].sessionId).toBeUndefined();
    });

    it("expoe endpoint autenticado sem IDs internos", async () => {
        AiInteractionHistory.find.mockReturnValueOnce(
            querySortLimit([makeHistoryItem()]),
        );

        const response = await request(createApp())
            .get("/api/me/ai-interactions?limit=5")
            .set("Cookie", makeCookie());

        expect(response.status).toBe(200);
        expect(response.body.history).toHaveLength(1);
        expect(response.body.history[0].safeSummary).toContain("Sessao guiada");
        expect(JSON.stringify(response.body)).not.toContain("sessionId");
        expect(JSON.stringify(response.body)).not.toContain("userId");
    });

    it("bloqueia pedido sem autenticacao", async () => {
        const response = await request(createApp()).get("/api/me/ai-interactions");

        expect(response.status).toBe(401);
        expect(AiInteractionHistory.find).not.toHaveBeenCalled();
    });
});
