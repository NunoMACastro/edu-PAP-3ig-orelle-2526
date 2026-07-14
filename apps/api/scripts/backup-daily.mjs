/**
 * Procedimento de backup seguro para o BK-MF8-04.
 *
 * O script fecha o contrato RNF21 em contexto PAP: valida que a execucao esta
 * em ambiente de teste, escreve apenas em storage privado dentro de real_dev e
 * redige campos sensiveis antes de gerar artefactos locais de backup.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import mongoose from "mongoose";

import {
    assertTestEnvironmentIsIsolated,
    env,
    getMongoDatabaseName,
} from "../src/config/env.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const API_ROOT = path.resolve(path.dirname(SCRIPT_FILE), "..");
const IMPLEMENTATION_ROOT = path.resolve(API_ROOT, "..");
const PRIVATE_STORAGE_ROOT = path.join(IMPLEMENTATION_ROOT, "storage", "private");

export const DEFAULT_BACKUP_ROOT = path.join(PRIVATE_STORAGE_ROOT, "backups");

const SENSITIVE_KEY_PATTERNS = [
    /password/i,
    /token/i,
    /cookie/i,
    /secret/i,
    /api[_-]?key/i,
    /^storageKey$/i,
    /filePath/i,
    /path$/i,
    /photo/i,
    /image/i,
    /report/i,
    /biometric/i,
];

const PUBLIC_DESTINATION_SEGMENTS = new Set([
    "public",
    "dist",
    "build",
    "node_modules",
]);

/**
 * Resolve e valida a pasta onde os backups podem ser escritos.
 *
 * @function resolveBackupRoot
 * @param {string|undefined} rawRoot - Pasta recebida por BACKUP_ROOT, CLI ou teste.
 * @returns {string} Caminho absoluto dentro de real_dev/storage/private.
 * @throws {Error} Quando o destino e vazio, publico ou fora da area privada.
 */
export function resolveBackupRoot(rawRoot = process.env.BACKUP_ROOT) {
    if (!String(rawRoot ?? DEFAULT_BACKUP_ROOT).trim()) {
        throw new Error("BACKUP_ROOT nao pode estar vazio");
    }

    const backupRoot = rawRoot
        ? path.resolve(IMPLEMENTATION_ROOT, rawRoot)
        : DEFAULT_BACKUP_ROOT;
    const relativeToPrivate = path.relative(PRIVATE_STORAGE_ROOT, backupRoot);
    const isOutsidePrivate =
        relativeToPrivate.startsWith("..") || path.isAbsolute(relativeToPrivate);
    const relativeSegments = relativeToPrivate
        .split(path.sep)
        .filter(Boolean)
        .map((segment) => segment.toLowerCase());

    if (isOutsidePrivate) {
        throw new Error("BACKUP_ROOT deve ficar dentro de storage/private");
    }

    if (relativeSegments.some((segment) => PUBLIC_DESTINATION_SEGMENTS.has(segment))) {
        throw new Error("BACKUP_ROOT nao pode apontar para pasta publica ou de build");
    }

    return backupRoot;
}

/**
 * Indica se uma chave de documento deve ser redigida no backup pedagogico.
 *
 * @function isSensitiveKey
 * @param {string} key - Nome do campo no documento MongoDB.
 * @returns {boolean} Verdadeiro quando o campo pode conter dado sensivel.
 */
export function isSensitiveKey(key) {
    return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Redige campos sensiveis em documentos antes de escrever o backup.
 *
 * @function redactSensitiveFields
 * @param {unknown} value - Valor a preparar para o backup.
 * @returns {unknown} Valor seguro para serializacao.
 */
export function redactSensitiveFields(value) {
    if (Array.isArray(value)) {
        return value.map((item) => redactSensitiveFields(item));
    }

    if (value && typeof value === "object") {
        const plainValue = JSON.parse(JSON.stringify(value));

        return Object.fromEntries(
            Object.entries(plainValue).map(([key, item]) => {
                if (isSensitiveKey(key)) {
                    // Mantemos a chave para prova tecnica, mas nunca o valor sensivel.
                    return [key, "[redigido]"];
                }

                return [key, redactSensitiveFields(item)];
            }),
        );
    }

    return value;
}

/**
 * Cria um identificador estavel e legivel para a execucao de backup.
 *
 * @function createBackupId
 * @param {Date} now - Data usada na evidence.
 * @returns {string} Identificador sem caracteres problematicos para ficheiros.
 */
export function createBackupId(now = new Date()) {
    return `bk-mf8-04-${now.toISOString().replace(/[:.]/g, "-")}`;
}

/**
 * Constroi o nome do ficheiro de uma colecao.
 *
 * @function createCollectionBackupFileName
 * @param {string} collectionName - Nome da colecao MongoDB.
 * @param {Date} now - Data usada na evidence.
 * @returns {string} Nome de ficheiro seguro.
 */
export function createCollectionBackupFileName(collectionName, now = new Date()) {
    const safeCollectionName = collectionName
        .replace(/[^a-z0-9_-]/gi, "-")
        .toLowerCase();

    return `${createBackupId(now)}-${safeCollectionName}.backup.json`;
}

/**
 * Valida ambiente e destino antes de qualquer leitura da base de dados.
 *
 * @function validateBackupConfiguration
 * @param {{ nodeEnv?: string, mongoUri?: string, source?: NodeJS.ProcessEnv|Record<string, string|undefined>, backupRoot?: string }} options - Configuracao a validar.
 * @returns {{ backupRoot: string, mongoDatabaseName: string }} Resumo seguro da configuracao.
 * @throws {Error} Quando o ambiente ou destino podem tocar em dados reais.
 */
export function validateBackupConfiguration(options = {}) {
    const nodeEnv = options.nodeEnv ?? env.nodeEnv;
    const mongoUri = options.mongoUri ?? env.mongoUri;
    const backupRoot = resolveBackupRoot(options.backupRoot);

    if (!mongoUri) {
        throw new Error("MONGODB_URI de teste e obrigatorio para executar backup");
    }

    const isolation = assertTestEnvironmentIsIsolated({
        nodeEnv,
        mongoUri,
        source: options.source ?? process.env,
    });

    return {
        backupRoot,
        mongoDatabaseName: isolation.mongoDatabaseName,
    };
}

/**
 * Garante que o resumo publico nao contem segredos nem caminhos internos.
 *
 * @function assertPublicOutputDoesNotExposeSecrets
 * @param {unknown} output - Resumo a escrever no terminal ou na evidence.
 * @returns {void}
 * @throws {Error} Quando o output contem dados sensiveis.
 */
export function assertPublicOutputDoesNotExposeSecrets(output) {
    const serializedOutput = JSON.stringify(output);
    const forbiddenPatterns = [
        /mongodb(\+srv)?:\/\//i,
        /password/i,
        /token/i,
        /cookie/i,
        /secret/i,
        /storageKey/i,
        /\/Users\//,
        /storage\/private/i,
    ];

    if (forbiddenPatterns.some((pattern) => pattern.test(serializedOutput))) {
        throw new Error("Resumo publico do backup nao pode expor segredos ou caminhos internos");
    }
}

/**
 * Le todos os documentos de uma colecao e escreve um ficheiro JSON redigido.
 *
 * @async
 * @function writeCollectionBackup
 * @param {{ collectionName: string, collection: import("mongodb").Collection, backupRoot: string, now: Date }} options - Dados da colecao.
 * @returns {Promise<{ name: string, count: number, fileName: string }>} Metadados seguros da colecao.
 */
export async function writeCollectionBackup({
    collectionName,
    collection,
    backupRoot,
    now,
}) {
    const documents = await collection.find({}).toArray();
    const safeDocuments = redactSensitiveFields(documents);
    const fileName = createCollectionBackupFileName(collectionName, now);
    const destination = path.join(backupRoot, fileName);

    // O destino ja foi validado antes da leitura da base, reduzindo exposicao acidental.
    await writeFile(destination, `${JSON.stringify(safeDocuments, null, 2)}\n`, "utf8");

    return {
        name: collectionName,
        count: documents.length,
        fileName,
    };
}

/**
 * Executa o backup ou a simulacao segura do BK-MF8-04.
 *
 * @async
 * @function runBackup
 * @param {{ dryRun?: boolean, now?: Date, backupRoot?: string, nodeEnv?: string, mongoUri?: string, source?: NodeJS.ProcessEnv|Record<string, string|undefined> }} options - Opcoes de execucao.
 * @returns {Promise<{ backupId: string, status: string, dryRun: boolean, databaseName: string, collections: Array<{ name: string, count: number, fileName: string }> }>} Resumo seguro para PR/defesa.
 */
export async function runBackup(options = {}) {
    const dryRun = options.dryRun ?? process.argv.includes("--dry-run");
    const now = options.now ?? new Date();
    const backupId = createBackupId(now);
    const { backupRoot, mongoDatabaseName } = validateBackupConfiguration(options);
    const collections = [];
    let connected = false;

    await mkdir(backupRoot, { recursive: true });

    try {
        if (!dryRun) {
            await connectDB();
            connected = true;

            for (const [collectionName, collection] of Object.entries(
                mongoose.connection.collections,
            )) {
                collections.push(
                    await writeCollectionBackup({
                        collectionName,
                        collection,
                        backupRoot,
                        now,
                    }),
                );
            }
        }
    } finally {
        if (connected) {
            await disconnectDB();
        }
    }

    const manifest = {
        backupId,
        bkId: "BK-MF8-04",
        requirement: "RNF21",
        generatedAt: now.toISOString(),
        dryRun,
        databaseName: getMongoDatabaseName(options.mongoUri ?? env.mongoUri),
        collections,
    };
    const manifestFileName = `${backupId}-manifest.backup.json`;

    await writeFile(
        path.join(backupRoot, manifestFileName),
        `${JSON.stringify(manifest, null, 2)}\n`,
        "utf8",
    );

    const publicSummary = {
        backupId,
        status: "ok",
        dryRun,
        databaseName: mongoDatabaseName,
        collections,
    };

    assertPublicOutputDoesNotExposeSecrets(publicSummary);

    return publicSummary;
}

if (process.argv[1] === SCRIPT_FILE) {
    runBackup()
        .then((summary) => {
            console.log(JSON.stringify(summary, null, 2));
        })
        .catch((error) => {
            console.error(`Backup BK-MF8-04 falhou: ${error.message}`);
            process.exitCode = 1;
        });
}
