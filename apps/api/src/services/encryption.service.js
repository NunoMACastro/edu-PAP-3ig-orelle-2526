/**
 * Service de encriptação em repouso da MF6.
 *
 * `RNF11` exige proteger fotografias e relatórios de análise quando ficam
 * guardados. AES-256-GCM foi escolhido por ser primitivo nativo do Node.js,
 * autenticado e suficiente para a PAP sem dependências novas.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";

export const DATA_ENCRYPTION_ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;

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

    // Fallback só para desenvolvimento/testes, para manter a app executável
    // sem inventar uma chave fixa hardcoded para produção.
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
 * Encripta um valor JSON mantendo tipo lógico na decifra.
 *
 * @function encryptJson
 * @param {unknown} value - Valor serializável a proteger.
 * @returns {object} Payload cifrado.
 */
export function encryptJson(value) {
    if (isEncryptedPayload(value)) return value;

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
