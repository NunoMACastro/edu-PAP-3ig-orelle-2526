/**
 * Testes do BK-MF0-01 / RF01.
 *
 * Cobrem registo positivo, email invalido e email duplicado.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/user.model.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findOne: vi.fn(),
        create: vi.fn(),
    },
}));

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

describe("BK-MF0-01 / RF01 - registo", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("cria utilizador valido sem expor password", async () => {
        User.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue(null),
        });
        User.create.mockResolvedValueOnce({
            _id: objectId("user-1"),
            email: "cliente@orelle.test",
            role: "cliente",
            createdAt: new Date("2026-05-29T10:00:00.000Z"),
        });

        const response = await request(createApp())
            .post("/api/auth/register")
            .send({
                email: "cliente@orelle.test",
                password: "PalavraPasse12345",
            });

        expect(response.status).toBe(201);
        expect(response.body.user.email).toBe("cliente@orelle.test");
        expect(response.body.user.password).toBeUndefined();
        expect(response.body.user.passwordHash).toBeUndefined();
    });

    it("rejeita email invalido", async () => {
        const response = await request(createApp())
            .post("/api/auth/register")
            .send({ email: "email-invalido", password: "PalavraPasse12345" });

        expect(response.status).toBe(400);
        expect(response.body.error.details.email).toBe("Email invalido");
    });

    it("rejeita password fraca", async () => {
        const response = await request(createApp())
            .post("/api/auth/register")
            .send({ email: "cliente@orelle.test", password: "curta" });

        expect(response.status).toBe(400);
        expect(response.body.error.details.password).toBeDefined();
    });

    it("rejeita email duplicado", async () => {
        User.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({ _id: "user-1" }),
        });

        const response = await request(createApp())
            .post("/api/auth/register")
            .send({
                email: "cliente@orelle.test",
                password: "PalavraPasse12345",
            });

        expect(response.status).toBe(409);
    });
});
