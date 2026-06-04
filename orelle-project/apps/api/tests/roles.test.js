import { describe, expect, it } from "vitest";
import { ROLES } from "../src/constants/roles.js";
import { requireRole } from "../src/middlewares/role.middleware.js";

function runMiddleware(middleware, req) {
    return new Promise((resolve) => {
        middleware(req, {}, (err) => resolve(err));
    });
}

describe("BK-MF0-05 / RF05 - roles", () => {
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

    it("bloqueia pedido sem autenticacao", async () => {
        const err = await runMiddleware(requireRole(ROLES.ADMIN), {});

        expect(err.statusCode).toBe(401);
    });
});