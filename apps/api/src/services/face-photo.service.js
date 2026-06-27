/**
 * Service de consentimento e fotografias faciais.
 */
import { open, unlink } from "node:fs/promises";
import { AppError } from "../middlewares/error.middleware.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import {
    encryptFacePhotoFile,
    removeEncryptedFacePhotoFiles,
} from "./face-secure-storage.service.js";

const SIGNATURE_READ_BYTES = 12;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Confirma se o buffer comeca com a assinatura binaria esperada.
 *
 * @function hasSignaturePrefix
 * @param {Buffer} buffer - Bytes iniciais do ficheiro.
 * @param {number[]} signature - Assinatura esperada.
 * @returns {boolean} Verdadeiro quando a assinatura corresponde.
 */
function hasSignaturePrefix(buffer, signature) {
    return signature.every((byte, index) => buffer[index] === byte);
}

/**
 * Le apenas os bytes necessarios para validar a assinatura do ficheiro.
 *
 * @async
 * @function readFileSignature
 * @param {string} filePath - Caminho privado do ficheiro recebido.
 * @returns {Promise<Buffer>} Buffer com os primeiros bytes do ficheiro.
 */
async function readFileSignature(filePath) {
    const fileHandle = await open(filePath, "r");

    try {
        const buffer = Buffer.alloc(SIGNATURE_READ_BYTES);
        const { bytesRead } = await fileHandle.read(
            buffer,
            0,
            SIGNATURE_READ_BYTES,
            0,
        );

        return buffer.subarray(0, bytesRead);
    } finally {
        await fileHandle.close();
    }
}

/**
 * Valida que a assinatura binaria corresponde ao MIME aceite no upload.
 *
 * @async
 * @function ensureAllowedImageSignature
 * @param {Express.Multer.File} file - Ficheiro recebido por Multer.
 * @returns {Promise<void>} Conclui quando o ficheiro e uma imagem aceite.
 * @throws {AppError} Quando o conteudo nao corresponde ao MIME declarado.
 */
async function ensureAllowedImageSignature(file) {
    if (!file?.path) {
        throw new AppError(400, "Conteúdo de imagem inválido");
    }

    const signature = await readFileSignature(file.path);
    const isValidImage = {
        "image/jpeg":
            signature.length >= 3 &&
            signature[0] === 0xff &&
            signature[1] === 0xd8 &&
            signature[2] === 0xff,
        "image/png":
            signature.length >= PNG_SIGNATURE.length &&
            hasSignaturePrefix(signature, PNG_SIGNATURE),
        "image/webp":
            signature.length >= 12 &&
            signature.toString("ascii", 0, 4) === "RIFF" &&
            signature.toString("ascii", 8, 12) === "WEBP",
    }[file.mimetype];

    if (!isValidImage) {
        throw new AppError(400, "Conteúdo de imagem inválido");
    }
}

/**
 * Valida assinatura real de todas as fotografias antes da persistencia.
 *
 * @async
 * @function ensureAllowedImageSignatures
 * @param {{file: Express.Multer.File}[]} uploadedFiles - Ficheiros recebidos.
 * @returns {Promise<void>} Conclui quando todas as imagens sao validas.
 */
async function ensureAllowedImageSignatures(uploadedFiles) {
    await Promise.all(
        uploadedFiles.map(({ file }) => ensureAllowedImageSignature(file)),
    );
}

/**
 * Converte uma fotografia facial para resposta segura.
 *
 * @function toFacePhotoResponse
 * @param {object} photo - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, kind: string, originalName: string, mimeType: string, sizeBytes: number, status: string, createdAt: Date|undefined}} Metadados publicos.
 */
function toFacePhotoResponse(photo) {
    return {
        id: photo._id.toString(),
        kind: photo.kind,
        originalName: photo.originalName,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        status: photo.status,
        createdAt: photo.createdAt,
    };
}

/**
 * Remove ficheiros recem-recebidos quando a persistencia falha.
 *
 * @async
 * @function removeUploadedFiles
 * @param {{file?: {path?: string}}[]} uploadedFiles - Ficheiros a limpar.
 * @returns {Promise<void>} Conclui mesmo que algum ficheiro ja nao exista.
 */
export async function removeUploadedFiles(uploadedFiles = []) {
    await Promise.all(
        uploadedFiles.map(({ file }) => {
            if (!file?.path) return undefined;
            return unlink(file.path).catch(() => undefined);
        }),
    );
}

/**
 * Aceita ou renova consentimento facial do utilizador.
 *
 * @async
 * @function acceptFaceConsent
 * @param {string} userId - Utilizador autenticado.
 * @param {{version: string}} input - Consentimento validado.
 * @returns {Promise<object>} Consentimento seguro.
 */
export async function acceptFaceConsent(userId, input) {
    // O filtro por userId vem da sessao e impede consentimento criado para outra conta.
    const consent = await FaceConsent.findOneAndUpdate(
        { userId },
        {
            $set: {
                version: input.version,
                purpose: "analise_facial_cosmetica",
                acceptedAt: new Date(),
                revokedAt: null,
            },
        },
        { upsert: true, new: true, runValidators: true },
    );

    return {
        id: consent._id.toString(),
        version: consent.version,
        acceptedAt: consent.acceptedAt,
        purpose: consent.purpose,
    };
}

/**
 * Guarda metadados de fotografias faciais com ownership da sessao.
 *
 * @async
 * @function saveFacePhotos
 * @param {string} userId - Utilizador autenticado.
 * @param {{kind: string, file: Express.Multer.File}[]} uploadedFiles - Ficheiros validados.
 * @param {object|undefined} activeConsent - Consentimento ja confirmado na rota.
 * @returns {Promise<object[]>} Fotografias seguras.
 */
export async function saveFacePhotos(userId, uploadedFiles, activeConsent) {
    const encryptedFiles = [];

    try {
        const consent =
            activeConsent ??
            (await FaceConsent.findOne({ userId, revokedAt: null }));

        if (!consent) {
            throw new AppError(403, "Consentimento facial em falta");
        }

        await ensureAllowedImageSignatures(uploadedFiles);

        for (const { file } of uploadedFiles) {
            encryptedFiles.push(await encryptFacePhotoFile(file));
        }

        const photos = await FacePhoto.insertMany(
            uploadedFiles.map(({ kind, file }, index) => ({
                userId,
                kind,
                storageKey: encryptedFiles[index].storageKey,
                encryption: encryptedFiles[index].encryption,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                consentId: consent._id,
            })),
        );

        return photos.map(toFacePhotoResponse);
    } catch (err) {
        await removeUploadedFiles(uploadedFiles);
        await removeEncryptedFacePhotoFiles(encryptedFiles);
        throw err;
    }
}
