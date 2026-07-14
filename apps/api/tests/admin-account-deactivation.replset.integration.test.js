/**
 * Prova a separação entre desativação administrativa e eliminação terminal.
 *
 * O teste usa apenas um replica set efémero loopback. Confirma rollback de
 * conta+sessoes, revogação atómica, reativação sem ressuscitar cookies e a
 * barreira que impede alterar um tombstone produzido pelo titular.
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { AuthSession } from "../src/models/auth-session.model.js";
import {
    ACCOUNT_STATUSES,
    User,
} from "../src/models/user.model.js";
import {
    setUserAccountStatus,
    softDeleteUserAccount,
    updateUserRole,
} from "../src/services/admin-users.service.js";

const DATABASE_NAME = "orelle_admin_deactivation_test";
let replicaSet;

/** Recusa qualquer URI que não pertença ao replica set deste teste. */
function assertEphemeralUri(uri) {
    if (
        !uri.startsWith("mongodb://127.0.0.1:") ||
        !uri.includes(`/${DATABASE_NAME}?`) ||
        !uri.includes("replicaSet=") ||
        uri.includes("@")
    ) {
        throw new Error("Teste admin recusou URI não efémera");
    }
}

/** Cria conta ativa com duas sessões revogáveis. */
async function createActiveAccount(label) {
    const user = await User.create({
        email: `${label}@orelle.test`,
        passwordHash: await bcrypt.hash("Password-Local-123", 4),
        role: "cliente",
        isActive: true,
        accountStatus: ACCOUNT_STATUSES.ACTIVE,
    });
    const now = new Date();
    await AuthSession.create([
        {
            tokenHash: "a".repeat(64),
            userId: user._id,
            expiresAt: new Date(now.getTime() + 60_000),
            lastSeenAt: now,
            csrfHash: "b".repeat(64),
        },
        {
            tokenHash: "c".repeat(64),
            userId: user._id,
            expiresAt: new Date(now.getTime() + 60_000),
            lastSeenAt: now,
            csrfHash: "d".repeat(64),
        },
    ]);
    return user;
}

describe("desativação administrativa reversível", () => {
    beforeAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            throw new Error("O teste exige Mongoose desligado");
        }
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        assertEphemeralUri(uri);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
        await Promise.all([User.syncIndexes(), AuthSession.syncIndexes()]);
    }, 120_000);

    afterEach(async () => {
        vi.restoreAllMocks();
        await Promise.all(
            Object.values(mongoose.connection.collections).map((collection) =>
                collection.deleteMany({}),
            ),
        );
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
        await replicaSet?.stop();
    }, 60_000);

    it("faz rollback se a revogação falhar e depois desativa/revoga uma vez", async () => {
        const user = await createActiveAccount("rollback");
        const actorUserId = new mongoose.Types.ObjectId().toString();
        const revokeSpy = vi
            .spyOn(AuthSession, "updateMany")
            .mockRejectedValueOnce(new Error("falha-injetada-revogacao"));

        await expect(
            softDeleteUserAccount({
                targetUserId: user._id.toString(),
                actorUserId,
            }),
        ).rejects.toThrow("falha-injetada-revogacao");
        revokeSpy.mockRestore();

        expect(await User.findById(user._id).lean()).toMatchObject({
            email: "rollback@orelle.test",
            isActive: true,
            accountStatus: ACCOUNT_STATUSES.ACTIVE,
            deletedAt: null,
        });
        expect(
            await AuthSession.countDocuments({
                userId: user._id,
                revokedAt: null,
            }),
        ).toBe(2);

        const deactivated = await softDeleteUserAccount({
            targetUserId: user._id.toString(),
            actorUserId,
        });
        expect(deactivated).toMatchObject({
            email: "rollback@orelle.test",
            isActive: false,
            accountStatus: ACCOUNT_STATUSES.SUSPENDED,
            deletedAt: null,
        });
        const revokedSessions = await AuthSession.collection
            .find({ userId: user._id })
            .toArray();
        expect(revokedSessions).toHaveLength(2);
        expect(
            revokedSessions.every(
                ({ revokedAt, csrfHash }) =>
                    revokedAt instanceof Date && csrfHash === null,
            ),
        ).toBe(true);

        const reactivated = await setUserAccountStatus({
            targetUserId: user._id.toString(),
            actorUserId,
            status: ACCOUNT_STATUSES.ACTIVE,
        });
        expect(reactivated).toMatchObject({
            isActive: true,
            accountStatus: ACCOUNT_STATUSES.ACTIVE,
        });
        expect(
            await AuthSession.countDocuments({
                userId: user._id,
                revokedAt: null,
            }),
        ).toBe(0);
    }, 30_000);

    it("nunca desativa nem reativa uma conta terminalmente eliminada", async () => {
        const user = await User.create({
            email: "deleted-terminal@deleted.invalid",
            passwordHash: await bcrypt.hash("Password-Local-123", 4),
            role: "cliente",
            isActive: false,
            accountStatus: ACCOUNT_STATUSES.DELETED,
            suspendedAt: new Date(),
            deletedAt: new Date(),
        });
        const actorUserId = new mongoose.Types.ObjectId().toString();

        await expect(
            softDeleteUserAccount({
                targetUserId: user._id.toString(),
                actorUserId,
            }),
        ).rejects.toMatchObject({ statusCode: 409 });
        await expect(
            setUserAccountStatus({
                targetUserId: user._id.toString(),
                actorUserId,
                status: ACCOUNT_STATUSES.ACTIVE,
            }),
        ).rejects.toMatchObject({ statusCode: 409 });
        await expect(
            updateUserRole({
                targetUserId: user._id.toString(),
                actorUserId,
                role: "consultor",
            }),
        ).rejects.toMatchObject({ statusCode: 409 });
        expect(await User.findById(user._id).lean()).toMatchObject({
            isActive: false,
            accountStatus: ACCOUNT_STATUSES.DELETED,
            email: "deleted-terminal@deleted.invalid",
            role: "cliente",
        });
    });
});
