/**
 * Testes da MF1 para catalogo, detalhe, reviews e relacionados.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { Category } from "../src/models/category.model.js";
import { Product } from "../src/models/product.model.js";
import { Review } from "../src/models/review.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import { validateCatalogQuery } from "../src/validators/catalog-query.validator.js";

vi.mock("../src/models/category.model.js", () => ({
    Category: {
        exists: vi.fn(),
    },
}));

vi.mock("../src/models/product.model.js", () => ({
    Product: {
        countDocuments: vi.fn(),
        create: vi.fn(),
        exists: vi.fn(),
        find: vi.fn(),
        findById: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/review.model.js", () => ({
    Review: {
        create: vi.fn(),
        find: vi.fn(),
    },
}));

const productId = "66c000000000000000000001";
const relatedProductId = "66c000000000000000000002";
const userId = "66a000000000000000000001";

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
 * Gera um token de sessão para testar rotas autenticadas.
 *
 * @function makeToken
 * @param {string} [role=ROLES.CLIENTE] - Role colocada no token.
 * @returns {string} JWT de sessão válido para os testes.
 */
function makeToken(role = ROLES.CLIENTE) {
    return createSessionToken({
        id: userId,
        email: `${role}@orelle.test`,
        role,
    });
}

/**
 * Cria um produto mock com os campos públicos usados no catálogo.
 *
 * @function makeProduct
 * @param {object} [overrides={}] - Campos a sobrepor no produto base.
 * @returns {object} Produto mock.
 */
function makeProduct(overrides = {}) {
    return {
        _id: objectId(productId),
        name: "Gel de Limpeza Suave",
        brandName: "Orelle",
        description:
            "Gel cosmetico de limpeza diaria para pele mista, sem promessa clinica.",
        ingredientNames: ["agua", "glicerina"],
        skinTypes: ["mista"],
        imageUrl: "https://images.orelle.local/gel.png",
        priceCents: 1290,
        stock: 10,
        categoryIds: [objectId("66d000000000000000000001")],
        ...overrides,
    };
}

/**
 * Simula a cadeia de query Mongoose `select().sort().limit()`.
 *
 * @function queryMock
 * @param {unknown} result - Resultado final resolvido pela query.
 * @returns {object} Query mock encadeável.
 */
function queryMock(result) {
    return {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

describe("MF1 - catalogo, reviews e relacionados", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("rejeita filtros de catalogo invalidos", () => {
        expect(() =>
            validateCatalogQuery({ minPriceCents: "-1" }),
        ).toThrow("Filtros de catálogo inválidos");
    });

    it("lista catalogo publico sem expor createdBy", async () => {
        Product.find.mockReturnValueOnce(queryMock([makeProduct()]));

        const response = await request(createApp()).get(
            "/api/catalog/products?brandName=Orelle&skinType=mista",
        );

        expect(response.status).toBe(200);
        expect(response.body.products).toHaveLength(1);
        expect(response.body.products[0].createdBy).toBeUndefined();
        expect(Product.find).toHaveBeenCalledWith(
            expect.objectContaining({ skinTypes: "mista" }),
        );
    });

    it("rejeita categoria inexistente no filtro publico", async () => {
        const missingCategoryId = "66d000000000000000000999";
        Category.exists.mockResolvedValueOnce(null);

        const response = await request(createApp()).get(
            `/api/catalog/products?categoryId=${missingCategoryId}`,
        );

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("Categoria invalida");
        expect(Product.find).not.toHaveBeenCalled();
    });

    it("devolve detalhe publico com resumo de reviews", async () => {
        Product.findById.mockResolvedValueOnce(makeProduct());
        Review.find.mockReturnValueOnce(
            queryMock([{ rating: 5 }, { rating: 3 }]),
        );

        const response = await request(createApp()).get(
            `/api/catalog/products/${productId}`,
        );

        expect(response.status).toBe(200);
        expect(response.body.product.reviewSummary).toEqual({
            averageRating: 4,
            totalReviews: 2,
        });
        expect(response.body.product.createdBy).toBeUndefined();
    });

    it("rejeita detalhe com productId invalido", async () => {
        const response = await request(createApp()).get(
            "/api/catalog/products/produto-invalido",
        );

        expect(response.status).toBe(400);
        expect(Product.findById).not.toHaveBeenCalled();
    });

    it("cliente cria review sem enviar userId", async () => {
        Product.exists.mockResolvedValueOnce(true);
        Review.create.mockResolvedValueOnce({
            _id: objectId("review-1"),
            productId: objectId(productId),
            rating: 5,
            comment: "Gostei da textura.",
            status: "published",
            createdAt: new Date("2026-06-01T10:00:00.000Z"),
        });

        const response = await request(createApp())
            .post(`/api/catalog/products/${productId}/reviews`)
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ rating: 5, comment: "Gostei da textura.", userId: "fake" });

        expect(response.status).toBe(201);
        expect(Review.create).toHaveBeenCalledWith(
            expect.objectContaining({ userId }),
        );
        expect(response.body.review.userId).toBeUndefined();
    });

    it("bloqueia review com role que nao e cliente", async () => {
        const response = await request(createApp())
            .post(`/api/catalog/products/${productId}/reviews`)
            .set("Cookie", [`orelle_session=${makeToken(ROLES.ADMIN)}`])
            .send({ rating: 5, comment: "Teste" });

        expect(response.status).toBe(403);
        expect(Review.create).not.toHaveBeenCalled();
    });

    it("devolve produtos relacionados sem o produto atual", async () => {
        Product.findById.mockResolvedValueOnce(makeProduct());
        Product.find.mockReturnValueOnce(
            queryMock([
                makeProduct({
                    _id: objectId(relatedProductId),
                    name: "Creme Hidratante",
                }),
            ]),
        );

        const response = await request(createApp()).get(
            `/api/catalog/products/${productId}/related`,
        );

        expect(response.status).toBe(200);
        expect(response.body.products[0].id).toBe(relatedProductId);
        expect(Product.find).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: { $ne: expect.anything() },
                stock: { $gt: 0 },
            }),
        );
    });
});
