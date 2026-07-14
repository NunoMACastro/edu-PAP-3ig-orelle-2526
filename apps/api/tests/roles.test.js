/**
 * Testes do BK-MF0-05 / RF05.
 *
 * Exercitam diretamente o middleware de autorização por role.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { requireRole } from "../src/middlewares/role.middleware.js";
import { ACCOUNT_STATUSES, User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/user.model.js", () => ({
    ACCOUNT_STATUSES: {
        ACTIVE: "active",
        SUSPENDED: "suspended",
        DELETED: "deleted",
    },
    User: {
        findOneAndUpdate: vi.fn(),
        exists: vi.fn(),
    },
}));

const targetUserId = "66e000000000000000000001";
const missingUserId = "66e000000000000000000002";

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
 * Executa um middleware Express num teste unitário.
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
        User.findOneAndUpdate.mockResolvedValueOnce({
            _id: objectId(targetUserId),
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
            .patch(`/api/admin/users/${targetUserId}/role`)
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
            .patch(`/api/admin/users/${targetUserId}/role`)
            .set("Cookie", [`orelle_session=${token}`])
            .send({ role: ROLES.CONSULTOR });

        expect(response.status).toBe(403);
    });

    it("endpoint admin sem sessão devolve 401", async () => {
        const response = await request(createApp())
            .patch(`/api/admin/users/${targetUserId}/role`)
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
            .patch(`/api/admin/users/${targetUserId}/role`)
            .set("Cookie", [`orelle_session=${token}`])
            .send({ role: "moderador" });

        expect(response.status).toBe(400);
    });

    it("rejeita ID de utilizador malformado por endpoint", async () => {
        const token = createSessionToken({
            id: "admin-1",
            email: "admin@orelle.test",
            role: ROLES.ADMIN,
        });

        const response = await request(createApp())
            .patch("/api/admin/users/user-invalido/role")
            .set("Cookie", [`orelle_session=${token}`])
            .send({ role: ROLES.CONSULTOR });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("ID de utilizador invalido");
        expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("devolve 404 quando utilizador alvo nao existe", async () => {
        User.findOneAndUpdate.mockResolvedValueOnce(null);

        const token = createSessionToken({
            id: "admin-1",
            email: "admin@orelle.test",
            role: ROLES.ADMIN,
        });

        const response = await request(createApp())
            .patch(`/api/admin/users/${missingUserId}/role`)
            .set("Cookie", [`orelle_session=${token}`])
            .send({ role: ROLES.CONSULTOR });

        expect(response.status).toBe(404);
    });

    it("recusa alterar a role de uma conta terminalmente eliminada", async () => {
        User.findOneAndUpdate.mockResolvedValueOnce(null);
        User.exists.mockResolvedValueOnce(true);

        const token = createSessionToken({
            id: "admin-1",
            email: "admin@orelle.test",
            role: ROLES.ADMIN,
        });

        const response = await request(createApp())
            .patch(`/api/admin/users/${targetUserId}/role`)
            .set("Cookie", [`orelle_session=${token}`])
            .send({ role: ROLES.CONSULTOR });

        expect(response.status).toBe(409);
        expect(response.body.error.message).toContain("terminalmente");
        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: targetUserId,
                accountStatus: { $ne: ACCOUNT_STATUSES.DELETED },
            },
            { role: ROLES.CONSULTOR },
            { new: true, runValidators: true },
        );
    });
});
