// apps/api/tests/mf4.admin-reviews.test.js
import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateReviewModerationInput } from "../src/validators/admin-review.validator.js";
import { moderateReview } from "../src/services/admin-review.service.js";
import { Review } from "../src/models/review.model.js";

vi.mock("../src/models/review.model.js", () => ({
    Review: {
        findByIdAndUpdate: vi.fn(),
    },
}));

// Tal como nos services reais, basta que o ID tenha `toString()`.
// Isto mantém o teste focado na moderação e não na implementação do MongoDB.
function objectId(value) {
    return { toString: () => value };
}

// Este helper cria uma review com valores seguros por defeito.
// Cada teste altera apenas o que interessa para o cenário.
function makeReview(overrides = {}) {
    return {
        _id: objectId(overrides.id ?? "64b7f1a0f4e6f5c6d7e8f901"),
        productId: {
            _id: objectId(overrides.productId ?? "64b7f1a0f4e6f5c6d7e8f902"),
            name: overrides.productName ?? "Sérum suave",
        },
        rating: overrides.rating ?? 5,
        comment: overrides.comment ?? "Textura agradável",
        status: overrides.status ?? "published",
        moderationReason: overrides.moderationReason ?? "",
        moderatedAt: overrides.moderatedAt ?? null,
        createdAt: new Date("2026-06-15T10:00:00.000Z"),
    };
}

describe("BK-MF4-02 admin review moderation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejeita estado de moderação fora do contrato", () => {
        expect(() =>
            validateReviewModerationInput(
                { reviewId: "64b7f1a0f4e6f5c6d7e8f901" },
                { status: "deleted", moderationReason: "pedido inválido" },
            ),
        ).toThrow("Estado de moderação invalido");
    });

    it("oculta review sem alterar rating nem comentário", async () => {
        const reviewId = "64b7f1a0f4e6f5c6d7e8f901";
        Review.findByIdAndUpdate.mockReturnValueOnce({
            populate: vi.fn().mockResolvedValue(
                makeReview({
                    id: reviewId,
                    status: "hidden",
                    moderationReason: "linguagem ofensiva",
                    moderatedAt: new Date("2026-06-15T11:00:00.000Z"),
                }),
            ),
        });

        const review = await moderateReview({
            reviewId,
            status: "hidden",
            moderationReason: "linguagem ofensiva",
            adminUserId: "64b7f1a0f4e6f5c6d7e8f902",
        });
        const [, update] = Review.findByIdAndUpdate.mock.calls[0];

        // O update deve conter só campos de moderação. Se rating/comment
        // aparecerem aqui, o admin estaria a reescrever a opinião do cliente.
        expect(update).toMatchObject({
            status: "hidden",
            moderationReason: "linguagem ofensiva",
            moderatedBy: "64b7f1a0f4e6f5c6d7e8f902",
        });
        expect(update).not.toHaveProperty("rating");
        expect(update).not.toHaveProperty("comment");
        expect(review).toMatchObject({
            rating: 5,
            comment: "Textura agradável",
            status: "hidden",
        });
    });
});