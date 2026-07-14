/**
 * Storage privado cifrado para fotografias faciais.
 *
 * Este service fica isolado para que o upload nunca exponha paths internos
 * nem deixe a versão original ao lado da versão cifrada.
 */
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../middlewares/error.middleware.js";
import {
    DATA_ENCRYPTION_ALGORITHM,
    decryptBufferWithContext,
    encryptBufferWithContext,
} from "./encryption.service.js";
import {
    assertAbortSignalActive,
    getAbortSignalError,
} from "../utils/abort-signal.util.js";

const ENCRYPTED_EXTENSION = ".enc";

/**
 * Constrói AAD único por fotografia, titular e tipo.
 *
 * @param {{userId: unknown, photoId: unknown, kind: "frontal"|"perfil"}} input - Identidade imutável do ficheiro.
 * @returns {{collection: string, owner: unknown, field: string}} Contexto AES-GCM.
 */
export function buildFacePhotoEncryptionContext({ userId, photoId, kind }) {
    const normalizedPhotoId = String(photoId?.toString?.() ?? photoId ?? "");
    if (!/^[a-f0-9]{24}$/i.test(normalizedPhotoId)) {
        throw new AppError(500, "Identidade da fotografia inválida.");
    }
    if (!new Set(["frontal", "perfil"]).has(kind)) {
        throw new AppError(500, "Tipo da fotografia inválido.");
    }
    return {
        collection: "facephotos",
        owner: userId,
        field: `bytes.${normalizedPhotoId.toLowerCase()}.${kind}`,
    };
}

/**
 * Remove um ficheiro sem falhar quando já não existe.
 *
 * @async
 * @function safeUnlink
 * @param {string|undefined} filePath - Caminho privado a remover.
 * @returns {Promise<void>}
 */
async function safeUnlink(filePath) {
    if (!filePath) return;
    await unlink(filePath).catch(() => undefined);
}

/**
 * Cifra uma fotografia normalizada pelo boundary de upload e remove o claro.
 *
 * @async
 * @function encryptFacePhotoFile
 * @param {{path?: string}} file - WebP temporario validado e sem metadados.
 * @param {{userId: unknown, photoId: unknown, kind: "frontal"|"perfil"}} identity - AAD imutável do novo documento.
 * @param {{signal?: AbortSignal, afterEncryptedWrite?: Function}} [options] - Cancelamento e hook interno de teste.
 * @returns {Promise<{storageKey: string, encryption: {algorithm: string, keyVersion: number, aadHash: string, iv: string, authTag: string}}>} Metadados seguros para MongoDB.
 * @throws {AppError} Quando não é possível minimizar o ficheiro original.
 */
export async function encryptFacePhotoFile(
    file,
    identity,
    { signal, afterEncryptedWrite } = {},
) {
    if (!file?.path) {
        throw new AppError(400, "Ficheiro facial inválido.");
    }

    assertAbortSignalActive(signal, "Persistência da fotografia cancelada.");
    let plainBuffer;
    try {
        plainBuffer = await readFile(
            file.path,
            signal ? { signal } : undefined,
        );
    } catch (error) {
        if (signal?.aborted) {
            throw getAbortSignalError(
                signal,
                "Persistência da fotografia cancelada.",
            );
        }
        throw error;
    }
    assertAbortSignalActive(signal, "Persistência da fotografia cancelada.");
    const encrypted = encryptBufferWithContext(
        plainBuffer,
        buildFacePhotoEncryptionContext(identity),
    );
    const encryptedPath = `${file.path}${ENCRYPTED_EXTENSION}`;

    try {
        await mkdir(path.dirname(encryptedPath), { recursive: true });
        assertAbortSignalActive(signal, "Persistência da fotografia cancelada.");
        await writeFile(
            encryptedPath,
            Buffer.from(encrypted.ciphertext, "base64"),
            { mode: 0o600, ...(signal ? { signal } : {}) },
        );
        if (afterEncryptedWrite) await afterEncryptedWrite(encryptedPath);
        assertAbortSignalActive(signal, "Persistência da fotografia cancelada.");

        try {
            await unlink(file.path);
        } catch {
            throw new AppError(
                500,
                "Não foi possível minimizar a fotografia original.",
            );
        }
        assertAbortSignalActive(signal, "Persistência da fotografia cancelada.");
    } catch (error) {
        await safeUnlink(encryptedPath);
        if (signal?.aborted) {
            throw getAbortSignalError(
                signal,
                "Persistência da fotografia cancelada.",
            );
        }
        throw error;
    }

    return {
        storageKey: encryptedPath,
        encryption: {
            algorithm: DATA_ENCRYPTION_ALGORITHM,
            keyVersion: encrypted.keyVersion,
            aadHash: encrypted.aadHash,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
        },
    };
}

/**
 * Remove fotografias cifradas criadas durante um pedido que falhou.
 *
 * @async
 * @function removeEncryptedFacePhotoFiles
 * @param {{storageKey?: string}[]} encryptedFiles - Ficheiros cifrados a limpar.
 * @returns {Promise<void>}
 */
export async function removeEncryptedFacePhotoFiles(encryptedFiles = []) {
    await Promise.all(
        encryptedFiles.map((file) => safeUnlink(file.storageKey)),
    );
}

/**
 * Lê uma fotografia cifrada para providers internos autorizados.
 *
 * @async
 * @function readEncryptedFacePhotoFile
 * @param {{_id?: unknown, userId?: unknown, kind?: "frontal"|"perfil", storageKey?: string, encryption?: {algorithm: string, keyVersion: number, aadHash: string, iv: string, authTag: string}}} photo - Documento de fotografia.
 * @param {{signal?: AbortSignal}} [options] - Cancelamento cooperativo.
 * @returns {Promise<Buffer>} Bytes originais da fotografia.
 * @throws {AppError} Quando o documento não tem metadados de cifra.
 */
export async function readEncryptedFacePhotoFile(photo, { signal } = {}) {
    if (!photo?.storageKey || !photo?.encryption) {
        throw new AppError(500, "Fotografia encriptada inválida.");
    }

    assertAbortSignalActive(signal, "Leitura da fotografia cancelada.");
    let ciphertext;
    try {
        ciphertext = await readFile(
            photo.storageKey,
            signal ? { signal } : undefined,
        );
    } catch (error) {
        if (signal?.aborted) {
            throw getAbortSignalError(signal, "Leitura da fotografia cancelada.");
        }
        throw error;
    }
    assertAbortSignalActive(signal, "Leitura da fotografia cancelada.");

    const decrypted = decryptBufferWithContext({
        encrypted: true,
        algorithm: photo.encryption.algorithm,
        keyVersion: photo.encryption.keyVersion,
        aadHash: photo.encryption.aadHash,
        iv: photo.encryption.iv,
        authTag: photo.encryption.authTag,
        ciphertext: ciphertext.toString("base64"),
    }, buildFacePhotoEncryptionContext({
        userId: photo.userId,
        photoId: photo._id,
        kind: photo.kind,
    }));
    assertAbortSignalActive(signal, "Leitura da fotografia cancelada.");
    return decrypted;
}
