/**
 * Teste de fluxo integrado da MF0.
 *
 * Este teste usa mocks de persistência para validar a cadeia HTTP principal
 * sem depender de MongoDB real: registo, login, perfil, preferências, role
 * admin, produto e categoria.
 */
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { Category } from "../src/models/category.model.js";
import { Preference } from "../src/models/preference.model.js";
import { Product } from "../src/models/product.model.js";
import { Profile } from "../src/models/profile.model.js";
import { User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        create: vi.fn(),
        findByIdAndUpdate: vi.fn(),
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/profile.model.js", async () => {
    const actual = await vi.importActual("../src/models/profile.model.js");
    return {
        ...actual,
        Profile: {
            create: vi.fn(),
            findOne: vi.fn(),
            findOneAndUpdate: vi.fn(),
        },
    };
});

vi.mock("../src/models/preference.model.js", () => ({
    Preference: {
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/product.model.js", () => ({
    Product: {
        countDocuments: vi.fn(),
        create: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/category.model.js", () => ({
    Category: {
        countDocuments: vi.fn(),
        create: vi.fn(),
        find: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

const userId = "66a000000000000000000001";
const adminId = "66a000000000000000000999";
const productId = "66c000000000000000000001";
const categoryId = "66d000000000000000000001";

const validProductPayload = {
    name: "Gel de Limpeza Suave",
    brandName: "Orelle",
    description:
        "Gel cosmetico de limpeza diaria para pele mista, sem promessa clinica.",
    ingredientNames: ["agua", "glicerina"],
    skinTypes: ["mista"],
    imageUrl: "https://images.orelle.local/gel.png",
    priceCents: 1290,
    stock: 10,
};

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
 * Cria o cookie de sessão de administrador usado nos passos protegidos.
 *
 * @function makeAdminCookie
 * @returns {string[]} Header Cookie compatível com Supertest.
 */
function makeAdminCookie() {
    const token = createSessionToken({
        id: adminId,
        email: "admin@orelle.test",
        role: ROLES.ADMIN,
    });

    return [`orelle_session=${token}`];
}

describe("MF0 - fluxo API completo", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("executa registo, sessão, perfil, preferencias, roles, produto e categoria", async () => {
        const app = createApp();
        const agent = request.agent(app);
        const passwordHash = await bcrypt.hash("PalavraPasse12345", 12);

        User.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue(null),
        });
        User.create.mockResolvedValueOnce({
            _id: objectId(userId),
            email: "cliente@orelle.test",
            role: ROLES.CLIENTE,
            createdAt: new Date("2026-05-29T10:00:00.000Z"),
        });

        const register = await agent.post("/api/auth/register").send({
            email: "cliente@orelle.test",
            password: "PalavraPasse12345",
        });

        expect(register.status).toBe(201);
        expect(register.body.user.passwordHash).toBeUndefined();

        User.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({
                _id: objectId(userId),
                email: "cliente@orelle.test",
                role: ROLES.CLIENTE,
                passwordHash,
                createdAt: new Date("2026-05-29T10:00:00.000Z"),
            }),
        });

        const login = await agent.post("/api/auth/login").send({
            email: "cliente@orelle.test",
            password: "PalavraPasse12345",
        });

        expect(login.status).toBe(200);
        expect(login.headers["set-cookie"].join(";")).toContain("HttpOnly");

        Profile.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue(null),
        });
        Profile.create.mockResolvedValueOnce({
            _id: objectId("profile-1"),
            userId: objectId(userId),
            nome: "Marta Silva",
            idade: 18,
            tipoDePele: "mista",
            genero: "feminino",
            objetivos: ["hidratar"],
        });

        const profile = await agent.post("/api/profile/me").send({
            nome: "Marta Silva",
            idade: 18,
            tipoDePele: "mista",
            genero: "feminino",
            objetivos: ["hidratar"],
        });

        expect(profile.status).toBe(201);

        Product.countDocuments.mockResolvedValueOnce(1);
        Preference.findOneAndUpdate.mockResolvedValueOnce({
            _id: objectId("pref-1"),
            userId: objectId(userId),
            favoriteBrandNames: ["Orelle"],
            favoriteProductIds: [objectId(productId)],
            updatedAt: new Date("2026-05-29T10:00:00.000Z"),
        });

        const preferences = await agent.put("/api/preferences/me").send({
            favoriteBrandNames: ["Orelle"],
            favoriteProductIds: [productId],
        });

        expect(preferences.status).toBe(200);
        expect(preferences.body.preferences.favoriteProductIds).toEqual([
            productId,
        ]);

        User.findByIdAndUpdate.mockResolvedValueOnce({
            _id: objectId(userId),
            email: "cliente@orelle.test",
            role: ROLES.CONSULTOR,
            updatedAt: new Date("2026-05-29T10:00:00.000Z"),
        });

        const role = await request(app)
            .patch(`/api/admin/users/${userId}/role`)
            .set("Cookie", makeAdminCookie())
            .send({ role: ROLES.CONSULTOR });

        expect(role.status).toBe(200);
        expect(role.body.user.role).toBe(ROLES.CONSULTOR);

        Product.create.mockResolvedValueOnce({
            _id: objectId(productId),
            ...validProductPayload,
            categoryIds: [],
            createdBy: objectId(adminId),
            createdAt: new Date("2026-05-29T10:00:00.000Z"),
            updatedAt: new Date("2026-05-29T10:00:00.000Z"),
        });

        const product = await request(app)
            .post("/api/admin/products")
            .set("Cookie", makeAdminCookie())
            .send(validProductPayload);

        expect(product.status).toBe(201);
        expect(product.body.product.brandName).toBe("Orelle");

        Category.create.mockResolvedValueOnce({
            _id: objectId(categoryId),
            name: "Limpeza",
            slug: "limpeza",
            description: "",
        });

        const category = await request(app)
            .post("/api/admin/categories")
            .set("Cookie", makeAdminCookie())
            .send({ name: "Limpeza" });

        expect(category.status).toBe(201);

        Category.countDocuments.mockResolvedValueOnce(1);
        Product.findByIdAndUpdate.mockResolvedValueOnce({
            _id: objectId(productId),
            name: "Gel de Limpeza Suave",
            categoryIds: [objectId(categoryId)],
        });

        const association = await request(app)
            .patch(`/api/admin/products/${productId}/categories`)
            .set("Cookie", makeAdminCookie())
            .send({ categoryIds: [categoryId] });

        expect(association.status).toBe(200);
        expect(association.body.product.categoryIds).toEqual([categoryId]);
    });
});
