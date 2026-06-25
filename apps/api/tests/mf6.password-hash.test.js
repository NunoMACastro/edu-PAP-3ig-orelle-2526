// apps/api/tests/mf6.password-hash.test.js
import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import { registerUser, BCRYPT_COST } from "../src/services/auth.service.js";
import { User } from "../src/models/user.model.js";

// O mock captura o payload entregue ao model para provar que só o hash segue para persistência.
vi.mock("../src/models/user.model.js", () => ({
    User: {
        findOne: vi.fn(() => ({ select: vi.fn().mockResolvedValue(null) })),
        create: vi.fn(async (data) => ({
            _id: { toString: () => "user-1" },
            email: data.email,
            role: data.role,
            createdAt: new Date("2026-06-22T00:00:00.000Z"),
        })),
    },
}));

describe("BK-MF6-06 bcrypt", () => {
    it("guarda hash bcrypt e devolve utilizador seguro", async () => {
        const user = await registerUser({
            email: "cliente@orelle.test",
            password: "Senha12345",
        });

        const created = User.create.mock.calls[0][0];
        // Estas asserções separam contrato privado de persistência e contrato público da resposta.
        expect(created.passwordHash).not.toBe("Senha12345");
        expect(await bcrypt.compare("Senha12345", created.passwordHash)).toBe(true);
        expect(user).not.toHaveProperty("passwordHash");
        expect(BCRYPT_COST).toBeGreaterThanOrEqual(12);
    });
});