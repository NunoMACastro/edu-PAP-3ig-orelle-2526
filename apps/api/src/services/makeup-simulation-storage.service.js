/** Storage privado AES-GCM das pré-visualizações cosméticas geradas por IA. */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { AppError } from "../middlewares/error.middleware.js";
import {
    DATA_ENCRYPTION_ALGORITHM,
    decryptBufferWithContext,
    encryptBufferWithContext,
} from "./encryption.service.js";

export const MAKEUP_SIMULATION_STORAGE_DIR = path.resolve(
    "storage/private/makeup-simulations",
);
export const MAX_MAKEUP_PROVIDER_BYTES = 32 * 1024 * 1024;
export const MAX_MAKEUP_OUTPUT_PIXELS = 16_000_000;

/**
 * Deriva o contexto AAD estável que liga o output ao titular e à simulação.
 * @returns {{collection: string, owner: unknown, field: string}} Contexto AES-GCM.
 */
export function buildMakeupOutputEncryptionContext({ userId, simulationId }) {
    return {
        collection: "makeupsimulations",
        owner: userId,
        field: `output.${simulationId?.toString?.() ?? simulationId}`,
    };
}

/** Valida um PNG único e remove metadata sem resize nem compressão lossy. */
export async function normalizeMakeupOutput(buffer, expectedDimensions = null) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new AppError(502, "Imagem OpenAI vazia ou inválida");
    }
    if (buffer.length > MAX_MAKEUP_PROVIDER_BYTES) {
        throw new AppError(502, "Imagem OpenAI excede o limite permitido");
    }

    const pipeline = sharp(buffer, {
        failOn: "warning",
        limitInputPixels: MAX_MAKEUP_OUTPUT_PIXELS,
        animated: false,
    });
    const metadata = await pipeline.metadata();
    if (
        metadata.format !== "png" ||
        Number(metadata.pages ?? 1) !== 1 ||
        !metadata.width ||
        !metadata.height ||
        metadata.width * metadata.height > MAX_MAKEUP_OUTPUT_PIXELS ||
        (expectedDimensions &&
            (metadata.width !== expectedDimensions.width ||
                metadata.height !== expectedDimensions.height))
    ) {
        throw new AppError(502, "Dimensões da imagem OpenAI inválidas");
    }

    return pipeline
        .rotate()
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
}

/** Persiste apenas ciphertext; não existe ficheiro intermédio em claro. */
export async function writeEncryptedMakeupOutput(
    buffer,
    {
        userId,
        simulationId,
        expectedDimensions = null,
        storageDir = MAKEUP_SIMULATION_STORAGE_DIR,
    },
) {
    const normalized = await normalizeMakeupOutput(buffer, expectedDimensions);
    const encrypted = encryptBufferWithContext(
        normalized,
        buildMakeupOutputEncryptionContext({ userId, simulationId }),
    );
    await mkdir(storageDir, { recursive: true, mode: 0o700 });
    const storageKey = path.join(
        storageDir,
        `${simulationId.toString()}-${randomUUID()}.png.enc`,
    );
    try {
        await writeFile(
            storageKey,
            Buffer.from(encrypted.ciphertext, "base64"),
            { mode: 0o600, flag: "wx" },
        );
    } catch (error) {
        await unlink(storageKey).catch(() => undefined);
        throw error;
    }

    return {
        storageKey,
        mimeType: "image/png",
        sizeBytes: normalized.length,
        encryption: {
            algorithm: DATA_ENCRYPTION_ALGORITHM,
            keyVersion: encrypted.keyVersion,
            aadHash: encrypted.aadHash,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
        },
    };
}

/** Decifra em memória apenas para o endpoint autenticado `no-store`. */
export async function readEncryptedMakeupOutput(simulation) {
    if (!simulation?.outputStorageKey || !simulation?.outputEncryption) {
        throw new AppError(404, "Imagem da simulação indisponível");
    }
    const ciphertext = await readFile(simulation.outputStorageKey);
    return decryptBufferWithContext(
        {
            encrypted: true,
            ...simulation.outputEncryption.toObject?.(),
            ...simulation.outputEncryption,
            ciphertext: ciphertext.toString("base64"),
        },
        buildMakeupOutputEncryptionContext({
            userId: simulation.userId,
            simulationId: simulation._id,
        }),
    );
}
