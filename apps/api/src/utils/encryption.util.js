/**
 * Utilitários puros de encriptação de dados sensíveis em repouso.
 *
 * Os schemas podem usar estes helpers sem depender de services de domínio,
 * preservando a fronteira MVC do BK-MF8-01 e mantendo AES-256-GCM da MF6.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";

export const DATA_ENCRYPTION_ALGORITHM = "aes-256-gcm";
export const DATA_ENCRYPTION_KEY_VERSION = 2;
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const CONTEXT_PREFIX = "orelle:data:v2";
const JSON_TYPE_MARKER = "__orelleEncryptedTypeV2";

/** Preserva datas/ObjectIds dentro de JSON cifrado sem dependências novas. */
function contextualJsonReplacer(key, value) {
    const originalValue = key === "" ? value : this?.[key];
    if (originalValue instanceof Date) {
        return { [JSON_TYPE_MARKER]: "date", value: originalValue.toISOString() };
    }
    if (
        originalValue &&
        typeof originalValue === "object" &&
        originalValue._bsontype === "ObjectId" &&
        typeof originalValue.toHexString === "function"
    ) {
        return {
            [JSON_TYPE_MARKER]: "objectId",
            value: originalValue.toHexString(),
        };
    }
    return value;
}

/** Restaura tipos que os services esperam após a autenticação AES-GCM. */
function contextualJsonReviver(_key, value) {
    if (!value || typeof value !== "object") return value;
    if (value[JSON_TYPE_MARKER] === "date") return new Date(value.value);
    // ObjectIds são restaurados como hex canónico; DTOs e refs Mongoose aceitam-no
    // sem importar BSON para a camada criptográfica.
    if (value[JSON_TYPE_MARKER] === "objectId") return String(value.value);
    return value;
}

/**
 * Normaliza o contexto que fica autenticado, mas não cifrado, pelo AES-GCM.
 * O owner continua disponível como campo de ownership pesquisável no documento;
 * o envelope guarda apenas o hash do AAD para detetar trocas antes de decifrar.
 *
 * @param {{collection: string, owner: unknown, field: string}} context - Contexto do campo.
 * @returns {{collection: string, owner: string, field: string}} Contexto canónico.
 */
function normalizeEncryptionContext(context) {
    const collection = String(context?.collection ?? "").trim().toLowerCase();
    const owner = String(context?.owner?.toString?.() ?? context?.owner ?? "").trim();
    const field = String(context?.field ?? "").trim();

    if (
        !/^[a-z0-9_-]+$/.test(collection) ||
        !/^[a-f0-9]{24}$/i.test(owner) ||
        !/^[a-zA-Z0-9_.-]+$/.test(field)
    ) {
        throw new AppError(500, "Contexto de encriptação inválido.");
    }

    return { collection, owner: owner.toLowerCase(), field };
}

/**
 * Constrói bytes AAD determinísticos e sem ambiguidades de concatenação.
 *
 * @param {{collection: string, owner: unknown, field: string}} context - Contexto lógico.
 * @returns {Buffer} Additional Authenticated Data para AES-GCM.
 */
export function buildDataEncryptionAad(context) {
    const normalized = normalizeEncryptionContext(context);
    return Buffer.from(
        JSON.stringify({ v: 2, p: CONTEXT_PREFIX, ...normalized }),
        "utf8",
    );
}

/** Calcula a impressão digital pública do AAD esperado. */
function getAadHash(aad) {
    return createHash("sha256").update(aad).digest("base64");
}

/**
 * Confirma se um valor já tem o formato cifrado interno.
 *
 * @function isEncryptedPayload
 * @param {unknown} value - Valor candidato.
 * @returns {boolean} Verdadeiro quando parece payload cifrado da Orélle.
 */
export function isEncryptedPayload(value) {
    return (
        Boolean(value) &&
        typeof value === "object" &&
        value.encrypted === true &&
        value.algorithm === DATA_ENCRYPTION_ALGORITHM &&
        typeof value.iv === "string" &&
        typeof value.authTag === "string" &&
        typeof value.ciphertext === "string"
    );
}

/**
 * Distingue envelopes contextuais v2 dos envelopes binários/v1 legados.
 *
 * @param {unknown} value - Valor candidato.
 * @returns {boolean} Verdadeiro apenas para o contrato contextual atual.
 */
export function isContextualEncryptedPayload(value) {
    return (
        isEncryptedPayload(value) &&
        value.keyVersion === DATA_ENCRYPTION_KEY_VERSION &&
        typeof value.aadHash === "string"
    );
}

/**
 * Converte uma chave textual numa chave AES-256.
 *
 * @function parseDataEncryptionKey
 * @param {string|undefined} rawKey - Chave em base64, hex ou texto forte.
 * @returns {Buffer} Chave com 32 bytes.
 * @throws {AppError} Quando a chave está ausente ou é fraca.
 */
export function parseDataEncryptionKey(rawKey) {
    const value = String(rawKey ?? "").trim();

    if (!value) {
        throw new AppError(500, "Chave de encriptação inválida.");
    }

    const base64Candidate = Buffer.from(value, "base64");
    if (base64Candidate.length === KEY_BYTES) return base64Candidate;

    const hexCandidate = /^[a-f0-9]+$/i.test(value)
        ? Buffer.from(value, "hex")
        : Buffer.alloc(0);
    if (hexCandidate.length === KEY_BYTES) return hexCandidate;

    if (Buffer.byteLength(value, "utf8") >= KEY_BYTES) {
        return createHash("sha256").update(value).digest();
    }

    throw new AppError(500, "Chave de encriptação inválida.");
}

/**
 * Resolve a chave ativa, exigindo segredo dedicado em produção.
 *
 * @function getActiveDataEncryptionKey
 * @returns {Buffer} Chave AES-256 para cifra/decifra.
 * @throws {AppError} Quando a configuração de produção não tem chave.
 */
function getActiveDataEncryptionKey() {
    if (env.dataEncryptionKey) {
        return parseDataEncryptionKey(env.dataEncryptionKey);
    }

    if (env.nodeEnv === "production") {
        throw new AppError(500, "DATA_ENCRYPTION_KEY obrigatória em produção.");
    }

    // Fallback só para desenvolvimento/testes, sem criar chave fixa para produção.
    return createHash("sha256")
        .update(`orelle-dev-data-key:${env.sessionSecret}`)
        .digest();
}

/**
 * Encripta bytes sensíveis com AES-256-GCM.
 *
 * @function encryptBuffer
 * @param {Buffer} plainBuffer - Conteúdo a cifrar.
 * @returns {{encrypted: true, algorithm: string, iv: string, authTag: string, ciphertext: string}} Payload cifrado.
 */
export function encryptBuffer(plainBuffer) {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(
        DATA_ENCRYPTION_ALGORITHM,
        getActiveDataEncryptionKey(),
        iv,
    );
    const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);

    return {
        encrypted: true,
        algorithm: DATA_ENCRYPTION_ALGORITHM,
        iv: iv.toString("base64"),
        authTag: cipher.getAuthTag().toString("base64"),
        ciphertext: ciphertext.toString("base64"),
    };
}

/**
 * Decifra bytes previamente cifrados pela Orélle.
 *
 * @function decryptBuffer
 * @param {object} payload - Payload AES-256-GCM.
 * @returns {Buffer} Conteúdo original.
 * @throws {AppError} Quando o payload é inválido ou foi adulterado.
 */
export function decryptBuffer(payload) {
    if (!isEncryptedPayload(payload)) {
        throw new AppError(500, "Payload de encriptação inválido.");
    }

    try {
        const decipher = createDecipheriv(
            DATA_ENCRYPTION_ALGORITHM,
            getActiveDataEncryptionKey(),
            Buffer.from(payload.iv, "base64"),
        );
        decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

        return Buffer.concat([
            decipher.update(Buffer.from(payload.ciphertext, "base64")),
            decipher.final(),
        ]);
    } catch {
        throw new AppError(500, "Conteúdo encriptado inválido.");
    }
}

/**
 * Encripta bytes associando-os de forma criptográfica à coleção, owner e campo.
 *
 * @param {Buffer} plainBuffer - Conteúdo sensível.
 * @param {{collection: string, owner: unknown, field: string}} context - AAD lógico.
 * @returns {{encrypted: true, algorithm: string, keyVersion: number, aadHash: string, iv: string, authTag: string, ciphertext: string}} Envelope v2.
 */
export function encryptBufferWithContext(plainBuffer, context) {
    if (!Buffer.isBuffer(plainBuffer)) {
        throw new AppError(500, "Conteúdo para encriptação inválido.");
    }

    const aad = buildDataEncryptionAad(context);
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(
        DATA_ENCRYPTION_ALGORITHM,
        getActiveDataEncryptionKey(),
        iv,
        { authTagLength: AUTH_TAG_BYTES },
    );
    cipher.setAAD(aad);
    const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);

    return {
        encrypted: true,
        algorithm: DATA_ENCRYPTION_ALGORITHM,
        keyVersion: DATA_ENCRYPTION_KEY_VERSION,
        aadHash: getAadHash(aad),
        iv: iv.toString("base64"),
        authTag: cipher.getAuthTag().toString("base64"),
        ciphertext: ciphertext.toString("base64"),
    };
}

/**
 * Decifra um envelope v2 exigindo exatamente o mesmo contexto usado na cifra.
 *
 * @param {object} payload - Envelope contextual v2.
 * @param {{collection: string, owner: unknown, field: string}} context - AAD esperado.
 * @returns {Buffer} Bytes autenticados.
 * @throws {AppError} Em troca de owner/campo, adulteração ou envelope legado.
 */
export function decryptBufferWithContext(payload, context) {
    if (!isContextualEncryptedPayload(payload)) {
        throw new AppError(500, "Payload contextual de encriptação inválido.");
    }

    try {
        const aad = buildDataEncryptionAad(context);
        const iv = Buffer.from(payload.iv, "base64");
        const authTag = Buffer.from(payload.authTag, "base64");

        if (
            payload.aadHash !== getAadHash(aad) ||
            iv.length !== IV_BYTES ||
            authTag.length !== AUTH_TAG_BYTES
        ) {
            throw new Error("Contexto ou metadados divergentes");
        }

        const decipher = createDecipheriv(
            DATA_ENCRYPTION_ALGORITHM,
            getActiveDataEncryptionKey(),
            iv,
            { authTagLength: AUTH_TAG_BYTES },
        );
        decipher.setAAD(aad);
        decipher.setAuthTag(authTag);

        return Buffer.concat([
            decipher.update(Buffer.from(payload.ciphertext, "base64")),
            decipher.final(),
        ]);
    } catch {
        throw new AppError(500, "Conteúdo contextual encriptado inválido.");
    }
}

/**
 * Encripta um valor JSON mantendo tipo lógico na decifra.
 *
 * @function encryptJson
 * @param {unknown} value - Valor serializável a proteger.
 * @returns {object} Payload cifrado.
 */
export function encryptJson(value) {
    if (isEncryptedPayload(value)) return value;

    // Os schemas usam este setter para proteger relatórios sem chamar services.
    return encryptBuffer(Buffer.from(JSON.stringify(value), "utf8"));
}

/**
 * Decifra um valor JSON, aceitando dados antigos ainda em claro.
 *
 * @function decryptJson
 * @param {unknown} value - Valor cifrado ou legado em claro.
 * @returns {unknown} Valor lógico para services e DTOs.
 */
export function decryptJson(value) {
    if (!isEncryptedPayload(value)) return value;

    return JSON.parse(decryptBuffer(value).toString("utf8"));
}

/**
 * Encripta JSON no contrato contextual v2. Um envelope existente só é aceite
 * depois de ser autenticado no contexto atual, impedindo cópias entre campos.
 *
 * @param {unknown} value - Valor lógico serializável.
 * @param {{collection: string, owner: unknown, field: string}} context - AAD lógico.
 * @returns {unknown} null/undefined preservado ou envelope v2.
 */
export function encryptJsonWithContext(value, context) {
    if (value === null || value === undefined) return value;

    if (isContextualEncryptedPayload(value)) {
        decryptBufferWithContext(value, context);
        return value;
    }

    if (isEncryptedPayload(value)) {
        throw new AppError(
            500,
            "Payload legado só pode ser convertido pela migração de dados.",
        );
    }

    return encryptBufferWithContext(
        Buffer.from(JSON.stringify(value, contextualJsonReplacer), "utf8"),
        context,
    );
}

/**
 * Decifra JSON exclusivamente no contrato contextual v2 usado em runtime.
 * Plaintext e envelopes v1 falham fechados; apenas a migração os pode ler.
 *
 * @param {unknown} value - Envelope v2 ou valor nulo.
 * @param {{collection: string, owner: unknown, field: string}} context - AAD esperado.
 * @returns {unknown} Valor lógico autenticado.
 */
export function decryptJsonWithContext(value, context) {
    if (value === null || value === undefined) return value;

    return JSON.parse(
        decryptBufferWithContext(value, context).toString("utf8"),
        contextualJsonReviver,
    );
}

/**
 * Compatibilidade deliberadamente isolada para as migrações append-only
 * 005, 006, 008 e 009. Aceita dados em claro e envelopes v1, devolvendo o
 * valor lógico que será imediatamente recifrado em v2. Nunca é usada por
 * models ou services de runtime.
 *
 * @param {unknown} value - Valor legado ou v2.
 * @param {{collection: string, owner: unknown, field: string}} context - Contexto final.
 * @returns {unknown} Valor lógico para conversão.
 */
export function decryptJsonForMigration(value, context) {
    if (value === null || value === undefined) return value;
    if (isContextualEncryptedPayload(value)) {
        return decryptJsonWithContext(value, context);
    }
    if (isEncryptedPayload(value)) return decryptJson(value);
    return value;
}
