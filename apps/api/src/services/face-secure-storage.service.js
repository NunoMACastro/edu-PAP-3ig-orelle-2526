import { readFile, unlink, writeFile } from "node:fs/promises";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";
import {
    decryptBuffer,
    encryptBuffer,
    parseEncryptionKey,
} from "./encryption.service.js";

/**
 * Cifra uma fotografia facial validada antes de a tornar durável.
 *
 * @async
 * @function encryptFacePhotoFile
 * @param {{sourcePath: string}} input - Caminho privado criado pelo upload.
 * @returns {Promise<{storageKey: string, encryption: {algorithm: string, iv: string, authTag: string}}>} Dados privados para o model.
 */
export async function encryptFacePhotoFile({ sourcePath }) {
    const key = parseEncryptionKey(env.dataEncryptionKey);
    const originalBuffer = await readFile(sourcePath);
    const encryptedPayload = encryptBuffer(originalBuffer, key);
    const encryptedPath = `${sourcePath}.enc`;

    // A escrita cifrada acontece antes de remover o original para evitar perda
    // de ficheiro se o disco falhar durante a operação.
    await writeFile(encryptedPath, encryptedPayload.encrypted);

    try {
        await unlink(sourcePath);
    } catch {
        await unlink(encryptedPath).catch(() => undefined);
        throw new AppError(500, "Não foi possível concluir o armazenamento cifrado.");
    }

    return {
        storageKey: encryptedPath,
        encryption: {
            algorithm: encryptedPayload.algorithm,
            iv: encryptedPayload.iv,
            authTag: encryptedPayload.authTag,
        },
    };
}

/**
 * Remove ficheiros cifrados quando a persistência de metadados falha.
 *
 * @async
 * @function removeEncryptedFacePhotoFiles
 * @param {{storageKey?: string}[]} encryptedFiles - Ficheiros cifrados criados neste pedido.
 * @returns {Promise<void>} Conclui mesmo que algum ficheiro já tenha sido removido.
 */
export async function removeEncryptedFacePhotoFiles(encryptedFiles = []) {
    await Promise.all(
        encryptedFiles.map(({ storageKey }) => {
            if (!storageKey) return undefined;
            return unlink(storageKey).catch(() => undefined);
        }),
    );
}

/**
 * Lê uma fotografia cifrada para uso interno autorizado.
 *
 * @async
 * @function readEncryptedFacePhotoFile
 * @param {{storageKey: string, encryption: {algorithm: string, iv: string, authTag: string}}} photo - Documento com campos privados selecionados.
 * @returns {Promise<Buffer>} Bytes originais para providers internos autorizados.
 */
export async function readEncryptedFacePhotoFile(photo) {
    const key = parseEncryptionKey(env.dataEncryptionKey);
    const encrypted = await readFile(photo.storageKey);

    // A decifragem fica no backend; o frontend nunca recebe a fotografia original.
    return decryptBuffer({
        ...photo.encryption,
        encrypted,
        key,
    });
}