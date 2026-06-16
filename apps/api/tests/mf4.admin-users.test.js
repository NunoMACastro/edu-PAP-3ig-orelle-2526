import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    listAdminUsers,
    setUserAccountStatus,
    softDeleteUserAccount,
} from "../src/services/admin-users.service.js";
import { ACCOUNT_STATUSES, User } from "../src/models/user.model.js";

vi.mock("../src/models/user.model.js", () => ({
    ACCOUNT_STATUSES: Object.freeze({
        ACTIVE: "active",
        SUSPENDED: "suspended",
        DELETED: "deleted",
    }),
    User: {
        find: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

// O teste não precisa de um ObjectId real da base de dados; precisa de um valor
// com `toString()`, porque é isso que o service usa para montar DTOs.
function objectId(value) {
    return { toString: () => value };
}

// `makeUser` cria documentos falsos com a mesma forma dos documentos Mongoose
// usados pelo service. Isto mantém o teste legível e evita repetir objetos enormes.
function makeUser(overrides = {}) {
    return {
        _id: objectId(overrides.id ?? "64b7f1a0f4e6f5c6d7e8f901"),
        email: overrides.email ?? "cliente@orelle.local",
        role: overrides.role ?? "cliente",
        isActive: overrides.isActive ?? true,
        accountStatus: overrides.accountStatus ?? ACCOUNT_STATUSES.ACTIVE,
        suspendedAt: overrides.suspendedAt ?? null,
        deletedAt: overrides.deletedAt ?? null,
        passwordHash: overrides.passwordHash ?? "hash-fora-do-dto",
        createdAt: new Date("2026-06-15T10:00:00.000Z"),
        updatedAt: new Date("2026-06-15T10:00:00.000Z"),
    };
}

// A chain `find().select().sort().limit()` é simulada porque o service usa
// query builders do Mongoose. O objetivo do teste é validar a regra do service,
// não testar a base de dados.
function queryUsers(users) {
    return {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(users),
    };
}

describe("BK-MF4-01 admin users", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("lista utilizadores com DTO administrativo sem passwordHash", async () => {
        User.find.mockReturnValueOnce(queryUsers([makeUser()]));

        const users = await listAdminUsers();

        expect(User.find).toHaveBeenCalledWith({});
        expect(users).toEqual([
            expect.objectContaining({
                id: "64b7f1a0f4e6f5c6d7e8f901",
                email: "cliente@orelle.local",
                accountStatus: ACCOUNT_STATUSES.ACTIVE,
            }),
        ]);
        // Este é o ponto de privacidade do teste: o hash existe no documento falso,
        // mas nunca pode aparecer no DTO devolvido ao painel admin.
        expect(users[0]).not.toHaveProperty("passwordHash");
    });

    it("impede administrador de suspender a própria conta", async () => {
        const actorUserId = "64b7f1a0f4e6f5c6d7e8f901";

        await expect(
            setUserAccountStatus({
                targetUserId: actorUserId,
                actorUserId,
                status: ACCOUNT_STATUSES.SUSPENDED,
            }),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Um administrador não deve alterar a própria conta neste fluxo",
        });
        // Se esta chamada acontecesse, o admin poderia bloquear-se a si próprio
        // e deixar a equipa sem acesso operacional ao painel.
        expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("executa eliminação lógica sem expor dados sensíveis", async () => {
        const targetUserId = "64b7f1a0f4e6f5c6d7e8f901";
        const actorUserId = "64b7f1a0f4e6f5c6d7e8f902";
        User.findByIdAndUpdate.mockResolvedValueOnce(
            makeUser({
                id: targetUserId,
                email: `deleted-${targetUserId}@orelle.local`,
                isActive: false,
                accountStatus: ACCOUNT_STATUSES.DELETED,
                suspendedAt: new Date("2026-06-15T10:00:00.000Z"),
                deletedAt: new Date("2026-06-15T10:00:00.000Z"),
            }),
        );

        const user = await softDeleteUserAccount({ targetUserId, actorUserId });

        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            targetUserId,
            expect.objectContaining({
                accountStatus: ACCOUNT_STATUSES.DELETED,
                isActive: false,
                email: `deleted-${targetUserId}@orelle.local`,
            }),
            expect.objectContaining({ new: true, runValidators: true }),
        );
        expect(user).toMatchObject({
            id: targetUserId,
            accountStatus: ACCOUNT_STATUSES.DELETED,
            isActive: false,
        });
        expect(user).not.toHaveProperty("passwordHash");
    });
});