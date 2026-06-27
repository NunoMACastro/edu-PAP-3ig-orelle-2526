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
    decryptBuffer,
    encryptBuffer,
} from "./encryption.service.js";

const ENCRYPTED_EXTENSION = ".enc";

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
 * Cifra uma fotografia recebida por Multer e remove o original.
 *
 * @async
 * @function encryptFacePhotoFile
 * @param {Express.Multer.File} file - Ficheiro já validado por MIME e assinatura.
 * @returns {Promise<{storageKey: string, encryption: {algorithm: string, iv: string, authTag: string}}>} Metadados seguros para MongoDB.
 * @throws {AppError} Quando não é possível minimizar o ficheiro original.
 */
export async function encryptFacePhotoFile(file) {
    if (!file?.path) {
        throw new AppError(400, "Ficheiro facial inválido.");
    }

    const plainBuffer = await readFile(file.path);
    const encrypted = encryptBuffer(plainBuffer);
    const encryptedPath = `${file.path}${ENCRYPTED_EXTENSION}`;

    await mkdir(path.dirname(encryptedPath), { recursive: true });
    await writeFile(encryptedPath, Buffer.from(encrypted.ciphertext, "base64"));

    try {
        await unlink(file.path);
    } catch {
        await safeUnlink(encryptedPath);
        throw new AppError(500, "Não foi possível minimizar a fotografia original.");
    }

    return {
        storageKey: encryptedPath,
        encryption: {
            algorithm: DATA_ENCRYPTION_ALGORITHM,
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
 * @param {{storageKey?: string, encryption?: {algorithm: string, iv: string, authTag: string}}} photo - Documento de fotografia.
 * @returns {Promise<Buffer>} Bytes originais da fotografia.
 * @throws {AppError} Quando o documento não tem metadados de cifra.
 */
export async function readEncryptedFacePhotoFile(photo) {
    if (!photo?.storageKey || !photo?.encryption) {
        throw new AppError(500, "Fotografia encriptada inválida.");
    }

    const ciphertext = await readFile(photo.storageKey);

    return decryptBuffer({
        encrypted: true,
        algorithm: photo.encryption.algorithm,
        iv: photo.encryption.iv,
        authTag: photo.encryption.authTag,
        ciphertext: ciphertext.toString("base64"),
    });
}
