/**
 * Testes do BK-MF6-06 / RNF10.
 *
 * Estes testes provam o contrato de bcrypt sem depender de MongoDB real: a
 * password entra no service, mas apenas o hash segue para persistencia e apenas
 * dados publicos regressam ao cliente.
 */
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    BCRYPT_COST,
    loginUser,
    registerUser,
} from "../src/services/auth.service.js";
import { User } from "../src/models/user.model.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findOne: vi.fn(),
        create: vi.fn(),
    },
}));

/**
 * Cria um identificador minimo com a interface usada por `toSafeUser`.
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
 * Simula uma query Mongoose com `.select(...)`.
 *
 * @function queryWithSelect
 * @param {unknown} value - Valor resolvido pela query.
 * @returns {{select: Function}} Query minima usada pelos services de auth.
 */
function queryWithSelect(value) {
    return {
        select: vi.fn().mockResolvedValue(value),
    };
}

describe("BK-MF6-06 / RNF10 - password hash bcrypt", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("guarda hash bcrypt e devolve utilizador publico sem segredos", async () => {
        User.findOne.mockReturnValueOnce(queryWithSelect(null));
        User.create.mockImplementationOnce(async (data) => ({
            _id: objectId("user-1"),
            email: data.email,
            role: data.role,
            createdAt: new Date("2026-06-25T00:00:00.000Z"),
        }));

        const user = await registerUser({
            email: "cliente@orelle.test",
            password: "PalavraPasse12345",
        });
        const created = User.create.mock.calls[0][0];

        // A persistencia recebe apenas o hash; a password original nunca segue
        // para o model nem para a resposta publica.
        expect(BCRYPT_COST).toBeGreaterThanOrEqual(12);
        expect(created.passwordHash).not.toBe("PalavraPasse12345");
        expect(created.passwordHash).toMatch(/^\$2[aby]\$12\$/);
        expect(await bcrypt.compare("PalavraPasse12345", created.passwordHash)).toBe(
            true,
        );
        expect(created).not.toHaveProperty("password");
        expect(user).toEqual({
            id: "user-1",
            email: "cliente@orelle.test",
            role: "cliente",
            createdAt: new Date("2026-06-25T00:00:00.000Z"),
        });
        expect(user).not.toHaveProperty("password");
        expect(user).not.toHaveProperty("passwordHash");
    });

    it("usa a mesma mensagem para email inexistente e password errada", async () => {
        const passwordHash = await bcrypt.hash("PalavraPasse12345", BCRYPT_COST);
        User.findOne
            .mockReturnValueOnce(queryWithSelect(null))
            .mockReturnValueOnce(
                queryWithSelect({
                    _id: objectId("user-1"),
                    email: "cliente@orelle.test",
                    role: "cliente",
                    passwordHash,
                    createdAt: new Date("2026-06-25T00:00:00.000Z"),
                }),
            );

        await expect(
            loginUser({
                email: "nao-existe@orelle.test",
                password: "PalavraPasse12345",
            }),
        ).rejects.toMatchObject({
            statusCode: 401,
            message: "Credenciais invalidas",
        });

        await expect(
            loginUser({
                email: "cliente@orelle.test",
                password: "Errada123",
            }),
        ).rejects.toMatchObject({
            statusCode: 401,
            message: "Credenciais invalidas",
        });
    });
});
