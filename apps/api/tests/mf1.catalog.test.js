/**
 * Testes da MF1 para catalogo, detalhe, reviews e relacionados.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { Category } from "../src/models/category.model.js";
import { Order } from "../src/models/order.model.js";
import { Product } from "../src/models/product.model.js";
import { Review } from "../src/models/review.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import { validateCatalogQuery } from "../src/validators/catalog-query.validator.js";

vi.mock("../src/models/category.model.js", () => ({
    Category: {
        exists: vi.fn(),
        find: vi.fn(),
    },
}));

vi.mock("../src/models/order.model.js", () => ({
    Order: {
        aggregate: vi.fn(),
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
 * Gera um token de sessão para testar rotas autenticadas.
 *
 * @function makeToken
 * @param {string} [role=ROLES.CLIENTE] - Role colocada no token.
 * @returns {string} Token opaco de sessão válido para os testes.
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

    it("lista apenas categorias publicas sem estado administrativo", async () => {
        Category.find.mockReturnValueOnce({
            sort: vi.fn().mockResolvedValue([
                {
                    _id: objectId("66d000000000000000000001"),
                    name: "Limpeza",
                    slug: "limpeza",
                    description: "Produtos para limpeza cosmética.",
                    isActive: true,
                },
            ]),
        });

        const response = await request(createApp()).get(
            "/api/catalog/categories",
        );

        expect(response.status).toBe(200);
        expect(response.body.categories).toEqual([
            {
                id: "66d000000000000000000001",
                name: "Limpeza",
                slug: "limpeza",
                description: "Produtos para limpeza cosmética.",
            },
        ]);
        expect(response.body.categories[0]).not.toHaveProperty("isActive");
        expect(Category.find).toHaveBeenCalledWith({ isActive: true });
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

    it("lista produtos em destaque sem expor metricas internas", async () => {
        Order.aggregate.mockResolvedValueOnce([
            {
                _id: objectId(productId),
                unitsSold: 8,
                revenueCents: 10320,
            },
        ]);
        Product.find
            .mockResolvedValueOnce([makeProduct()])
            .mockReturnValueOnce(queryMock([]));

        const response = await request(createApp()).get(
            "/api/catalog/products/featured",
        );

        expect(response.status).toBe(200);
        expect(response.body.products).toHaveLength(1);
        expect(response.body.products[0].createdBy).toBeUndefined();
        expect(response.body.products[0].unitsSold).toBeUndefined();
        expect(response.body.products[0].revenueCents).toBeUndefined();
        expect(Order.aggregate).toHaveBeenCalledWith(
            expect.arrayContaining([
                { $match: { "payment.status": "simulated_paid" } },
                { $sort: { unitsSold: -1, revenueCents: -1 } },
            ]),
        );
    });

    it("filtra destacados por stock atual e preenche com produtos recentes", async () => {
        const soldOutProductId = "66c000000000000000000003";
        Order.aggregate.mockResolvedValueOnce([
            { _id: objectId(productId), unitsSold: 10, revenueCents: 12900 },
            { _id: objectId(soldOutProductId), unitsSold: 7, revenueCents: 9030 },
        ]);
        Product.find
            .mockResolvedValueOnce([makeProduct()])
            .mockReturnValueOnce(
                queryMock([
                    makeProduct({
                        _id: objectId(relatedProductId),
                        name: "Creme Hidratante",
                    }),
                ]),
            );

        const response = await request(createApp()).get(
            "/api/catalog/products/featured",
        );

        expect(response.status).toBe(200);
        expect(response.body.products.map((product) => product.id)).toEqual([
            productId,
            relatedProductId,
        ]);
        expect(Product.find).toHaveBeenNthCalledWith(1, {
            _id: { $in: [productId, soldOutProductId] },
            stock: { $gt: 0 },
        });
        expect(Product.find).toHaveBeenNthCalledWith(2, {
            _id: { $nin: [productId, soldOutProductId] },
            stock: { $gt: 0 },
        });
    });

    it("limita produtos em destaque a seis itens", async () => {
        const rankedProducts = Array.from({ length: 7 }, (_, index) => {
            const id = `66c00000000000000000001${index}`;

            return {
                sale: {
                    _id: objectId(id),
                    unitsSold: 20 - index,
                    revenueCents: 10000 - index,
                },
                product: makeProduct({
                    _id: objectId(id),
                    name: `Produto ${index}`,
                }),
            };
        });
        Order.aggregate.mockResolvedValueOnce(
            rankedProducts.map((item) => item.sale),
        );
        Product.find.mockResolvedValueOnce(
            rankedProducts.map((item) => item.product),
        );

        const response = await request(createApp()).get(
            "/api/catalog/products/featured",
        );

        expect(response.status).toBe(200);
        expect(response.body.products).toHaveLength(6);
        expect(response.body.products[0].id).toBe(rankedProducts[0].product._id.toString());
        expect(response.body.products[5].id).toBe(rankedProducts[5].product._id.toString());
    });

    it("usa fallback de produtos recentes com stock quando ainda nao ha vendas", async () => {
        Order.aggregate.mockResolvedValueOnce([]);
        Product.find.mockReturnValueOnce(queryMock([makeProduct()]));

        const response = await request(createApp()).get(
            "/api/catalog/products/featured",
        );

        expect(response.status).toBe(200);
        expect(response.body.products).toHaveLength(1);
        expect(Product.find).toHaveBeenCalledWith({ stock: { $gt: 0 } });
    });

    it("mantem a rota de destacados antes da rota dinamica de detalhe", async () => {
        Order.aggregate.mockResolvedValueOnce([]);
        Product.find.mockReturnValueOnce(queryMock([]));

        const response = await request(createApp()).get(
            "/api/catalog/products/featured",
        );

        expect(response.status).toBe(200);
        expect(Product.findById).not.toHaveBeenCalled();
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
