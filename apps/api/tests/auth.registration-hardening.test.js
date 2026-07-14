/**
 * Testes sem porta para o hardening do registo.
 *
 * Cobrem o limite real UTF-8 antes de bcrypt, a corrida no indice unico e a
 * resposta HTTP indistinguivel entre email novo e email ja registado.
 */
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    REGISTRATION_ACCEPTED_RESPONSE,
    registerController,
} from "../src/controllers/auth.controller.js";
import { User } from "../src/models/user.model.js";
import { registerUser } from "../src/services/auth.service.js";
import {
    getPasswordByteLength,
    validateLoginInput,
    validateRegisterInput,
} from "../src/validators/auth.validator.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        create: vi.fn(),
        findOne: vi.fn(),
    },
}));

const validInput = Object.freeze({
    email: "cliente@orelle.test",
    password: "PalavraPasse12345",
});

/**
 * Cria um erro equivalente ao duplicate key do MongoDB.
 *
 * @function duplicateEmailError
 * @returns {Error & {code: number, keyPattern: {email: number}}} Erro 11000.
 */
function duplicateEmailError() {
    return Object.assign(new Error("E11000 duplicate key"), {
        code: 11000,
        keyPattern: { email: 1 },
    });
}

/**
 * Cria um documento User minimo para o resultado interno do service.
 *
 * @function makeUserDocument
 * @returns {object} Documento seguro mockado.
 */
function makeUserDocument() {
    return {
        _id: { toString: () => "66a000000000000000000001" },
        email: validInput.email,
        role: "cliente",
        createdAt: new Date("2026-07-10T09:00:00.000Z"),
    };
}

/**
 * Cria a Response Express minima usada pelo controller.
 *
 * @function makeResponse
 * @returns {{status: Function, json: Function, statusCode?: number, body?: object}} Resposta fake.
 */
function makeResponse() {
    const response = {
        statusCode: undefined,
        body: undefined,
        status: vi.fn(),
        json: vi.fn(),
    };

    response.status.mockImplementation((statusCode) => {
        response.statusCode = statusCode;
        return response;
    });
    response.json.mockImplementation((body) => {
        response.body = body;
        return response;
    });

    return response;
}

describe("ORELLE-AUD-P3-001 - registo seguro", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.resetAllMocks();
    });

    it("aceita passwords nos limites exatos de 8 e 72 bytes", () => {
        const eightBytes = "Abcdefg1";
        const seventyTwoBytes = `A1${"x".repeat(70)}`;

        expect(getPasswordByteLength(eightBytes)).toBe(8);
        expect(getPasswordByteLength(seventyTwoBytes)).toBe(72);
        expect(
            validateRegisterInput({
                email: validInput.email,
                password: eightBytes,
            }).password,
        ).toBe(eightBytes);
        expect(
            validateRegisterInput({
                email: validInput.email,
                password: seventyTwoBytes,
            }).password,
        ).toBe(seventyTwoBytes);
    });

    it("rejeita passwords abaixo de 8 ou acima de 72 bytes", () => {
        expect(() =>
            validateRegisterInput({
                email: validInput.email,
                password: "Abcde12",
            }),
        ).toThrowError(
            expect.objectContaining({
                statusCode: 400,
                details: expect.objectContaining({
                    password: expect.stringContaining("8 bytes"),
                }),
            }),
        );

        expect(() =>
            validateRegisterInput({
                email: validInput.email,
                password: `A1${"x".repeat(71)}`,
            }),
        ).toThrowError(
            expect.objectContaining({
                statusCode: 400,
                details: expect.objectContaining({
                    password: expect.stringContaining("72 bytes"),
                }),
            }),
        );
    });

    it("rejeita Unicode com <=72 caracteres mas >72 bytes no registo e login", () => {
        const unicodePassword = `A1${"á".repeat(36)}`;

        expect(unicodePassword.length).toBeLessThanOrEqual(72);
        expect(getPasswordByteLength(unicodePassword)).toBe(74);

        for (const validate of [validateRegisterInput, validateLoginInput]) {
            expect(() =>
                validate({
                    email: validInput.email,
                    password: unicodePassword,
                }),
            ).toThrowError(
                expect.objectContaining({
                    statusCode: 400,
                    details: expect.objectContaining({
                        password: expect.stringContaining("72 bytes"),
                    }),
                }),
            );
        }
    });

    it("bloqueia password longa no service antes de chamar bcrypt ou MongoDB", async () => {
        const hashSpy = vi.spyOn(bcrypt, "hash");

        await expect(
            registerUser({
                email: validInput.email,
                password: `A1${"á".repeat(36)}`,
            }),
        ).rejects.toMatchObject({ statusCode: 400 });
        expect(hashSpy).not.toHaveBeenCalled();
        expect(User.create).not.toHaveBeenCalled();
    });

    it("resolve a corrida 11000 com um criado e uma resposta interna neutra", async () => {
        vi.spyOn(bcrypt, "hash").mockResolvedValue("hash-bcrypt-de-teste");
        let accountWasCreated = false;

        User.create.mockImplementation(async () => {
            await Promise.resolve();

            if (accountWasCreated) throw duplicateEmailError();

            accountWasCreated = true;
            return makeUserDocument();
        });

        const results = await Promise.all([
            registerUser(validInput),
            registerUser(validInput),
        ]);

        expect(results.map((result) => result.created).sort()).toEqual([
            false,
            true,
        ]);
        expect(results.find((result) => !result.created)).toEqual({
            created: false,
            user: null,
        });
        expect(User.findOne).not.toHaveBeenCalled();
        expect(User.create).toHaveBeenCalledTimes(2);
    });

    it("devolve status e body identicos para email novo e duplicado", async () => {
        vi.spyOn(bcrypt, "hash").mockResolvedValue("hash-bcrypt-de-teste");
        User.create
            .mockResolvedValueOnce(makeUserDocument())
            .mockRejectedValueOnce(duplicateEmailError());
        const createdResponse = makeResponse();
        const duplicateResponse = makeResponse();
        const createdNext = vi.fn();
        const duplicateNext = vi.fn();

        await registerController(
            { body: validInput },
            createdResponse,
            createdNext,
        );
        await registerController(
            { body: validInput },
            duplicateResponse,
            duplicateNext,
        );

        expect(createdNext).not.toHaveBeenCalled();
        expect(duplicateNext).not.toHaveBeenCalled();
        expect(createdResponse.statusCode).toBe(202);
        expect(duplicateResponse.statusCode).toBe(createdResponse.statusCode);
        expect(createdResponse.body).toEqual(REGISTRATION_ACCEPTED_RESPONSE);
        expect(duplicateResponse.body).toEqual(createdResponse.body);
        expect(createdResponse.body).not.toHaveProperty("user");
        expect(createdResponse.body.message).not.toMatch(/exist|duplic|já regist/i);
    });

    it("nao mascara erros MongoDB diferentes de duplicate email", async () => {
        vi.spyOn(bcrypt, "hash").mockResolvedValue("hash-bcrypt-de-teste");
        const persistenceError = Object.assign(new Error("database unavailable"), {
            code: 91,
        });
        User.create.mockRejectedValueOnce(persistenceError);

        await expect(registerUser(validInput)).rejects.toBe(persistenceError);

        const otherUniqueKeyError = Object.assign(
            new Error("E11000 noutra chave"),
            {
                code: 11000,
                keyPattern: { futureUniqueField: 1 },
            },
        );
        User.create.mockRejectedValueOnce(otherUniqueKeyError);

        await expect(registerUser(validInput)).rejects.toBe(otherUniqueKeyError);
    });
});
