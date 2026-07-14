/**
 * Provas reais do hardening de registo contra enumeração e corridas.
 *
 * O teste usa um MongoDB replica set efémero em loopback, cria o índice único
 * real de `User.email` e exerce o endpoint HTTP público. Nunca lê a configuração
 * `.env` nem estabelece ligações a bases de dados externas.
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { createApp } from "../src/app.js";
import { REGISTRATION_ACCEPTED_RESPONSE } from "../src/controllers/auth.controller.js";
import { User } from "../src/models/user.model.js";
import { getPasswordByteLength } from "../src/validators/auth.validator.js";

const DATABASE_NAME = "orelle_registration_hardening_test";
const REGISTRATION_PATH = "/api/auth/register";
let replicaSet;

/**
 * Confirma que a URI criada pelo teste só pode apontar para loopback local.
 *
 * @param {string} uri - URI fornecida pelo `MongoMemoryReplSet`.
 * @returns {void}
 * @throws {Error} Quando a URI não é efémera, local ou não é anónima.
 */
function assertEphemeralLoopbackUri(uri) {
    if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
        throw new Error("URI de registo não é loopback efémera");
    }
}

describe("ORELLE-AUD-P3-001 - registo concorrente em replica set", () => {
    beforeAll(async () => {
        replicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
        });
        const uri = replicaSet.getUri(DATABASE_NAME);
        assertEphemeralLoopbackUri(uri);

        await mongoose.connect(uri);
        await User.syncIndexes();
    }, 120_000);

    beforeEach(async () => {
        await User.deleteMany({});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await replicaSet?.stop();
    }, 60_000);

    it("aceita duas inscrições concorrentes sem enumerar qual criou a conta", async () => {
        const app = createApp();
        const email = "corrida@orelle.test";
        const password = `A1${"á".repeat(35)}`;
        const duplicateCodes = [];
        const createUser = User.create.bind(User);

        expect(getPasswordByteLength(password)).toBe(72);

        vi.spyOn(User, "create").mockImplementation(async (...args) => {
            try {
                return await createUser(...args);
            } catch (error) {
                if (Number(error?.code) === 11000) {
                    duplicateCodes.push(error.code);
                }
                throw error;
            }
        });

        const [firstResponse, secondResponse] = await Promise.all([
            request(app).post(REGISTRATION_PATH).send({ email, password }),
            request(app).post(REGISTRATION_PATH).send({ email, password }),
        ]);

        expect(firstResponse.status).toBe(202);
        expect(secondResponse.status).toBe(202);
        expect(firstResponse.body).toEqual(REGISTRATION_ACCEPTED_RESPONSE);
        expect(secondResponse.body).toEqual(firstResponse.body);
        expect(firstResponse.body).not.toHaveProperty("user");
        expect(firstResponse.body.message).not.toMatch(/exist|duplic|já regist/i);

        expect(duplicateCodes).toEqual([11000]);
        expect(await User.countDocuments({ email })).toBe(1);

        const storedUser = await User.findOne({ email }).select("+passwordHash");
        expect(storedUser).not.toBeNull();
        expect(storedUser.role).toBe("cliente");
        expect(await bcrypt.compare(password, storedUser.passwordHash)).toBe(
            true,
        );

        const emailIndex = (await User.collection.indexes()).find(
            (index) => index.key?.email === 1,
        );
        expect(emailIndex).toMatchObject({ key: { email: 1 }, unique: true });
    }, 30_000);

    it("aceita 72 bytes UTF-8 e rejeita 73 bytes antes de persistir", async () => {
        const app = createApp();
        const password72Bytes = `A1${"á".repeat(35)}`;
        const password73Bytes = `${password72Bytes}x`;

        expect(getPasswordByteLength(password72Bytes)).toBe(72);
        expect(getPasswordByteLength(password73Bytes)).toBe(73);

        const accepted = await request(app).post(REGISTRATION_PATH).send({
            email: "limite-72@orelle.test",
            password: password72Bytes,
        });
        const rejected = await request(app).post(REGISTRATION_PATH).send({
            email: "limite-73@orelle.test",
            password: password73Bytes,
        });

        expect(accepted.status).toBe(202);
        expect(accepted.body).toEqual(REGISTRATION_ACCEPTED_RESPONSE);
        expect(rejected.status).toBe(400);
        expect(rejected.body.error).toMatchObject({
            message: "Dados de registo invalidos",
            details: { password: "[redigido]" },
        });
        expect(await User.countDocuments()).toBe(1);
        expect(
            await User.exists({ email: "limite-73@orelle.test" }),
        ).toBeNull();
    }, 30_000);
});
