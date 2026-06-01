/**
 * Testes do BK-MF0-05 / RF05.
 *
 * Exercitam diretamente o middleware de autorizacao por role.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { requireRole } from "../src/middlewares/role.middleware.js";
import { User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findByIdAndUpdate: vi.fn(),
    },
}));

/**
 * Executa um middleware Express num teste unitario.
 *
 * @function runMiddleware
 * @param {import("express").RequestHandler} middleware - Middleware a testar.
 * @param {object} req - Pedido fake.
 * @returns {Promise<Error|undefined>} Erro enviado para `next`, se existir.
 */
function runMiddleware(middleware, req) {
    return new Promise((resolve) => {
        middleware(req, {}, (err) => resolve(err));
    });
}

describe("BK-MF0-05 / RF05 - roles", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("permite administrador", async () => {
        const err = await runMiddleware(requireRole(ROLES.ADMIN), {
            user: { id: "admin-1", role: ROLES.ADMIN },
        });

        expect(err).toBeUndefined();
    });

    it("bloqueia cliente em rota admin", async () => {
        const err = await runMiddleware(requireRole(ROLES.ADMIN), {
            user: { id: "cliente-1", role: ROLES.CLIENTE },
        });

        expect(err.statusCode).toBe(403);
    });

    it("bloqueia pedido sem autenticação", async () => {
        const err = await runMiddleware(requireRole(ROLES.ADMIN), {});

        expect(err.statusCode).toBe(401);
    });

    it("admin altera role por endpoint", async () => {
        User.findByIdAndUpdate.mockResolvedValueOnce({
            _id: { toString: () => "user-2" },
            email: "consultor@orelle.test",
            role: ROLES.CONSULTOR,
            updatedAt: new Date("2026-05-29T10:00:00.000Z"),
        });

        const token = createSessionToken({
            id: "admin-1",
            email: "admin@orelle.test",
            role: ROLES.ADMIN,
        });

        const response = await request(createApp())
            .patch("/api/admin/users/user-2/role")
            .set("Cookie", [`orelle_session=${token}`])
            .send({ role: ROLES.CONSULTOR });

        expect(response.status).toBe(200);
        expect(response.body.user.role).toBe(ROLES.CONSULTOR);
    });

    it("cliente recebe 403 no endpoint admin", async () => {
        const token = createSessionToken({
            id: "cliente-1",
            email: "cliente@orelle.test",
            role: ROLES.CLIENTE,
        });

        const response = await request(createApp())
            .patch("/api/admin/users/user-2/role")
            .set("Cookie", [`orelle_session=${token}`])
            .send({ role: ROLES.CONSULTOR });

        expect(response.status).toBe(403);
    });

    it("endpoint admin sem sessão devolve 401", async () => {
        const response = await request(createApp())
            .patch("/api/admin/users/user-2/role")
            .send({ role: ROLES.CONSULTOR });

        expect(response.status).toBe(401);
    });

    it("rejeita role invalida por endpoint", async () => {
        const token = createSessionToken({
            id: "admin-1",
            email: "admin@orelle.test",
            role: ROLES.ADMIN,
        });

        const response = await request(createApp())
            .patch("/api/admin/users/user-2/role")
            .set("Cookie", [`orelle_session=${token}`])
            .send({ role: "moderador" });

        expect(response.status).toBe(400);
    });

    it("devolve 404 quando utilizador alvo nao existe", async () => {
        User.findByIdAndUpdate.mockResolvedValueOnce(null);

        const token = createSessionToken({
            id: "admin-1",
            email: "admin@orelle.test",
            role: ROLES.ADMIN,
        });

        const response = await request(createApp())
            .patch("/api/admin/users/user-404/role")
            .set("Cookie", [`orelle_session=${token}`])
            .send({ role: ROLES.CONSULTOR });

        expect(response.status).toBe(404);
    });
});
