/**
 * Boundary seguro de consentimento e upload multipart de fotografias faciais.
 *
 * O parser usa Busboy diretamente para aplicar backpressure e limites antes de
 * qualquer processamento de imagem. Cada parte aceite e escrita num ficheiro
 * temporario privado com permissoes restritas; qualquer erro, limite ou abort
 * remove todos os temporarios antes de propagar o erro ao Express.
 */
import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import Busboy from "busboy";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../constants/face-consent.js";
import { FaceConsent } from "../models/face-consent.model.js";
import {
    assertAbortSignalActive,
    getAbortSignalError,
} from "../utils/abort-signal.util.js";
import { AppError } from "./error.middleware.js";

const TEST_WORKER_NAMESPACE =
    process.env.NODE_ENV === "test"
        ? `worker-${String(
              process.env.VITEST_POOL_ID ??
                  process.env.VITEST_WORKER_ID ??
                  process.pid,
          ).replace(/[^a-z0-9_-]/gi, "_")}`
        : "";

export const FACE_PHOTO_UPLOAD_DIR = path.resolve(
    "storage/private/facial-photos",
    TEST_WORKER_NAMESPACE,
);
export const MAX_FACE_PHOTO_UPLOAD_BYTES = 10 * 1024 * 1024;

const EXPECTED_FILE_FIELDS = new Set(["frontal", "perfil"]);
const MAX_FACE_PHOTO_FILES = 2;
const MAX_FACE_PHOTO_PARTS = 2;
const ALLOWED_DECLARED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);
const MAX_ORIGINAL_NAME_BYTES = 255;

/**
 * Garante consentimento ativo antes de permitir upload facial.
 *
 * @async
 * @function ensureActiveFaceConsent
 * @param {import("express").Request & {user?: {id: string}, faceConsent?: object}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<void>} Continua ou devolve erro.
 */
export async function ensureActiveFaceConsent(req, res, next) {
    try {
        const consent = await FaceConsent.findOne({
            userId: req.user.id,
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
            version: "face-analysis-v2",
            revokedAt: null,
        });

        if (!consent) {
            return next(new AppError(403, "Consentimento facial em falta"));
        }

        req.faceConsent = consent;
        return next();
    } catch (err) {
        return next(err);
    }
}

/**
 * Reduz o nome original a metadados inofensivos e com tamanho limitado.
 *
 * O nome nunca participa no path temporario. A normalizacao remove path
 * traversal, caracteres de controlo e nomes excessivamente longos, mantendo
 * apenas informacao util para o titular.
 *
 * @function sanitizeOriginalName
 * @param {unknown} value - Nome vindo do cabecalho multipart.
 * @returns {string} Nome seguro para persistencia como metadado.
 */
function sanitizeOriginalName(value) {
    const basename = path.basename(String(value ?? "fotografia"));
    const printable = basename.replace(/[\u0000-\u001f\u007f]/g, "_").trim();
    const fallback = printable || "fotografia";

    if (Buffer.byteLength(fallback, "utf8") <= MAX_ORIGINAL_NAME_BYTES) {
        return fallback;
    }

    let truncated = "";
    for (const character of fallback) {
        if (
            Buffer.byteLength(`${truncated}${character}`, "utf8") >
            MAX_ORIGINAL_NAME_BYTES
        ) {
            break;
        }
        truncated += character;
    }

    return truncated || "fotografia";
}

/**
 * Remove paths temporarios sem transformar `ENOENT` numa falha secundaria.
 *
 * @async
 * @function cleanupTemporaryPaths
 * @param {Iterable<string>} paths - Paths criados pelo pedido corrente.
 * @returns {Promise<void>} Termina depois de tentar remover todos os paths.
 */
async function cleanupTemporaryPaths(paths) {
    await Promise.all(
        [...paths].map((filePath) => unlink(filePath).catch(() => undefined)),
    );
}

/**
 * Cria o parser Busboy com um contrato estrito de duas partes de ficheiro.
 *
 * @function createFacePhotoBusboy
 * @param {import("node:http").IncomingMessage} req - Stream HTTP multipart.
 * @returns {import("busboy").Busboy} Parser configurado.
 * @throws {AppError} Quando o Content-Type multipart e invalido ou ausente.
 */
function createFacePhotoBusboy(req) {
    try {
        return Busboy({
            headers: req.headers,
            defParamCharset: "utf8",
            limits: {
                fileSize: MAX_FACE_PHOTO_UPLOAD_BYTES,
                // Busboy emite *Limit ao atingir o valor, pelo que um slot
                // sentinela permite distinguir o par válido de uma 3.ª parte.
                files: MAX_FACE_PHOTO_FILES + 1,
                fields: 1,
                parts: MAX_FACE_PHOTO_PARTS + 1,
                fieldNameSize: 32,
                headerPairs: 50,
            },
        });
    } catch {
        throw new AppError(400, "Pedido multipart inválido");
    }
}

/**
 * Faz parse streaming do par facial com limites e cleanup em abort/erro.
 * `uploadDir` permite isolamento de testes; o middleware de runtime usa sempre
 * o diretório privado canónico e devolve o shape esperado pelo controller.
 *
 * @async
 * @function parseFacePhotoMultipart
 * @param {import("node:http").IncomingMessage} req - Stream multipart.
 * @param {{uploadDir?: string}} [options] - Diretório temporário opcional.
 * @returns {Promise<Record<"frontal"|"perfil", object[]>>} Par aceite.
 * @throws {AppError} Quando formato, campos ou limites são inválidos.
 */
export async function parseFacePhotoMultipart(
    req,
    { uploadDir = FACE_PHOTO_UPLOAD_DIR } = {},
) {
    assertAbortSignalActive(req.orelleAbortSignal, "Upload facial cancelado.");
    await mkdir(uploadDir, { recursive: true, mode: 0o700 });
    assertAbortSignalActive(req.orelleAbortSignal, "Upload facial cancelado.");

    const parser = createFacePhotoBusboy(req);
    const temporaryPaths = new Set();
    const inputStreams = new Set();
    const outputStreams = new Set();
    const writeTasks = [];
    const files = {};
    let fileCount = 0;
    let partCount = 0;
    let firstError = null;
    let settled = false;

    /**
     * Preserva apenas o primeiro erro, que representa a causa original do
     * pedido invalido e evita que limites subsequentes escondam essa causa.
     *
     * @param {Error} error - Erro seguro a propagar.
     * @returns {void}
     */
    const rememberError = (error) => {
        firstError ??= error;
    };

    parser.on("file", (fieldName, fileStream, info) => {
        fileCount += 1;
        partCount += 1;
        const declaredMimeType = String(info.mimeType ?? "").toLowerCase();

        if (
            fileCount > MAX_FACE_PHOTO_FILES ||
            partCount > MAX_FACE_PHOTO_PARTS
        ) {
            rememberError(
                new AppError(400, "Número de partes excede o limite permitido"),
            );
            fileStream.resume();
            return;
        }

        if (!EXPECTED_FILE_FIELDS.has(fieldName)) {
            rememberError(new AppError(400, "Campo de ficheiro inesperado"));
            fileStream.resume();
            return;
        }

        if (files[fieldName]) {
            rememberError(new AppError(400, "Campo de ficheiro duplicado"));
            fileStream.resume();
            return;
        }

        if (!ALLOWED_DECLARED_MIME_TYPES.has(declaredMimeType)) {
            rememberError(new AppError(400, "Formato de imagem não permitido"));
            fileStream.resume();
            return;
        }

        const temporaryPath = path.join(
            uploadDir,
            `${crypto.randomUUID()}.upload`,
        );
        const output = createWriteStream(temporaryPath, {
            flags: "wx",
            mode: 0o600,
        });
        const file = {
            fieldname: fieldName,
            originalname: sanitizeOriginalName(info.filename),
            encoding: info.encoding,
            mimetype: declaredMimeType,
            destination: uploadDir,
            filename: path.basename(temporaryPath),
            path: temporaryPath,
            size: 0,
        };

        temporaryPaths.add(temporaryPath);
        inputStreams.add(fileStream);
        outputStreams.add(output);
        files[fieldName] = [file];

        fileStream.on("data", (chunk) => {
            file.size += chunk.length;
        });
        fileStream.once("limit", () => {
            rememberError(
                new AppError(
                    400,
                    "Ficheiro excede o tamanho máximo permitido",
                ),
            );
        });

        const writeTask = pipeline(
            fileStream,
            output,
            ...(req.orelleAbortSignal
                ? [{ signal: req.orelleAbortSignal }]
                : []),
        )
            .catch((error) => {
                rememberError(
                    req.orelleAbortSignal?.aborted
                        ? getAbortSignalError(
                              req.orelleAbortSignal,
                              "Upload facial cancelado.",
                          )
                        : req.aborted
                        ? new AppError(400, "Upload interrompido")
                        : new AppError(400, "Não foi possível receber o ficheiro"),
                );
                return error;
            })
            .finally(() => {
                inputStreams.delete(fileStream);
                outputStreams.delete(output);
            });

        writeTasks.push(writeTask);
    });

    parser.on("field", () => {
        partCount += 1;
        rememberError(new AppError(400, "Campos multipart não permitidos"));
    });

    parser.once("filesLimit", () => {
        rememberError(
            new AppError(400, "Número de ficheiros excede o limite permitido"),
        );
    });
    parser.once("fieldsLimit", () => {
        rememberError(new AppError(400, "Campos multipart não permitidos"));
    });
    parser.once("partsLimit", () => {
        rememberError(
            new AppError(400, "Número de partes excede o limite permitido"),
        );
    });
    parser.once("error", () => {
        rememberError(new AppError(400, "Pedido multipart inválido"));
    });

    return new Promise((resolve, reject) => {
        /**
         * Finaliza uma unica vez, aguardando escritas e limpando qualquer
         * ficheiro parcial antes de devolver erro.
         *
         * @async
         * @function finalize
         * @returns {Promise<void>}
         */
        const finalize = async () => {
            if (settled) return;
            settled = true;
            req.off("aborted", handleAbort);
            req.off("error", handleRequestError);
            req.orelleAbortSignal?.removeEventListener(
                "abort",
                handleSignalAbort,
            );
            await Promise.allSettled(writeTasks);

            if (firstError) {
                await cleanupTemporaryPaths(temporaryPaths);
                reject(firstError);
                return;
            }

            resolve(files);
        };

        /**
         * Cancela parser e escritas quando o cliente fecha o upload.
         *
         * @function handleAbort
         * @returns {void}
         */
        function handleAbort() {
            rememberError(new AppError(400, "Upload interrompido"));
            req.unpipe(parser);
            parser.destroy();
            for (const input of inputStreams) input.destroy();
            for (const output of outputStreams) output.destroy();
            void finalize();
        }

        /**
         * Trata falha do stream de request como upload invalido e garante o
         * mesmo caminho de cleanup usado num abort.
         *
         * @function handleRequestError
         * @returns {void}
         */
        function handleRequestError() {
            rememberError(new AppError(400, "Upload interrompido"));
            parser.destroy();
            for (const input of inputStreams) input.destroy();
            for (const output of outputStreams) output.destroy();
            void finalize();
        }

        /**
         * Propaga o timeout/cancelamento transversal ao parser e a todas as
         * streams, mantendo a razão segura criada pelo middleware HTTP.
         *
         * @function handleSignalAbort
         * @returns {void}
         */
        function handleSignalAbort() {
            rememberError(
                getAbortSignalError(
                    req.orelleAbortSignal,
                    "Upload facial cancelado.",
                ),
            );
            req.unpipe(parser);
            parser.destroy();
            for (const input of inputStreams) input.destroy();
            for (const output of outputStreams) output.destroy();
            void finalize();
        }

        req.once("aborted", handleAbort);
        req.once("error", handleRequestError);
        req.orelleAbortSignal?.addEventListener("abort", handleSignalAbort, {
            once: true,
        });
        parser.once("close", () => void finalize());
        if (req.orelleAbortSignal?.aborted) handleSignalAbort();
        else req.pipe(parser);
    });
}

/**
 * Middleware Express que anexa apenas o par multipart completamente recebido.
 *
 * @async
 * @function uploadFacePhotos
 * @param {import("express").Request} req - Pedido autenticado e consentido.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<void>} Continua depois do parse ou encaminha erro seguro.
 */
export async function uploadFacePhotos(req, res, next) {
    try {
        req.files = await parseFacePhotoMultipart(req);
        next();
    } catch (error) {
        next(error);
    }
}
