/**
 * Núcleo de snapshots MongoDB recuperáveis para o ambiente académico/local.
 *
 * Os documentos e índices são serializados em Extended JSON, cifrados com uma
 * chave dedicada AES-256-GCM e acompanhados por checksums. Este módulo não
 * importa a configuração da aplicação nem carrega ficheiros `.env`.
 */
import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes,
} from "node:crypto";
import {
    chmod,
    lstat,
    mkdir,
    readFile,
    readdir,
    realpath,
    rename,
    rm,
    writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const { EJSON } = mongoose.mongo.BSON;
const SCRIPT_FILE = fileURLToPath(import.meta.url);
const API_ROOT = path.resolve(path.dirname(SCRIPT_FILE), "..");
const IMPLEMENTATION_ROOT = path.resolve(API_ROOT, "..");
const PRIVATE_STORAGE_ROOT = path.join(IMPLEMENTATION_ROOT, "storage", "private");
export const DEFAULT_PRIVATE_DATA_ROOT = path.join(
    API_ROOT,
    "storage",
    "private",
);
export const DEFAULT_RESTORE_STORAGE_ROOT = path.join(
    DEFAULT_PRIVATE_DATA_ROOT,
    "restores",
);

export const DEFAULT_BACKUP_ROOT = path.join(PRIVATE_STORAGE_ROOT, "backups");
export const BACKUP_FORMAT = "orelle-local-backup-v2";
export const BACKUP_ENVELOPE_FORMAT = "orelle-aes-gcm-envelope-v1";
export const PRIVATE_FILE_BACKUP_FORMAT = "orelle-private-file-v1";
export const BACKUP_RETENTION_COUNT = 7;
export const BACKUP_COMPLETION_FILE = "snapshot.complete.json";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const SNAPSHOT_PREFIX = "orelle-snapshot-";
const STAGING_PREFIX = ".orelle-backup-staging-";
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
const PRIVATE_FILE_REFERENCES = Object.freeze([
    {
        collectionName: "facephotos",
        fieldName: "storageKey",
        requiredStatus: "active",
    },
    {
        collectionName: "makeupsimulations",
        fieldName: "outputStorageKey",
        requiredStatus: "completed",
    },
    {
        collectionName: "filedeletionjobs",
        fieldName: "storageKey",
        requiredStatus: null,
    },
]);

/**
 * Calcula SHA-256 hexadecimal.
 *
 * @param {Buffer|string} value - Conteúdo a resumir.
 * @returns {string} Digest hexadecimal.
 */
export function sha256(value) {
    return createHash("sha256").update(value).digest("hex");
}

/**
 * Converte uma chave base64 ou hexadecimal em exatamente 256 bits.
 *
 * @param {string|Buffer} rawKey - Chave dedicada ao backup.
 * @returns {Buffer} Chave AES-256.
 */
export function parseBackupEncryptionKey(rawKey) {
    if (Buffer.isBuffer(rawKey) && rawKey.length === KEY_BYTES) {
        return Buffer.from(rawKey);
    }

    const value = String(rawKey ?? "").trim();
    const key = /^[a-f0-9]{64}$/i.test(value)
        ? Buffer.from(value, "hex")
        : Buffer.from(value, "base64");

    if (key.length !== KEY_BYTES) {
        throw new Error(
            "ORELLE_BACKUP_KEY deve conter 32 bytes em base64 ou 64 caracteres hexadecimais",
        );
    }

    return key;
}

/**
 * Garante que a pasta de backups fica dentro de `real_dev/storage/private`.
 *
 * @param {string|undefined} rawRoot - Caminho opcional absoluto ou relativo.
 * @returns {string} Caminho absoluto validado.
 */
export function resolveBackupRoot(rawRoot = undefined) {
    const backupRoot = rawRoot
        ? path.resolve(IMPLEMENTATION_ROOT, rawRoot)
        : DEFAULT_BACKUP_ROOT;
    const relative = path.relative(PRIVATE_STORAGE_ROOT, backupRoot);

    if (
        !relative ||
        relative.startsWith("..") ||
        path.isAbsolute(relative) ||
        relative.split(path.sep).some((part) =>
            ["public", "dist", "build", "node_modules"].includes(
                part.toLowerCase(),
            ),
        )
    ) {
        throw new Error(
            "A pasta de backup deve ficar numa subpasta privada de storage/private",
        );
    }

    return backupRoot;
}

/**
 * Restringe leitura de dados privados à árvore efetiva da API.
 *
 * @param {string|undefined} rawRoot - Raiz explícita usada apenas por testes locais.
 * @returns {string} Raiz absoluta contida em `api/storage/private`.
 */
export function resolvePrivateDataRoot(rawRoot = undefined) {
    const privateRoot = rawRoot
        ? path.resolve(rawRoot)
        : DEFAULT_PRIVATE_DATA_ROOT;
    const relative = path.relative(DEFAULT_PRIVATE_DATA_ROOT, privateRoot);
    if (
        relative.startsWith("..") ||
        path.isAbsolute(relative) ||
        relative.split(path.sep).includes("backups") ||
        relative.split(path.sep).includes("restores")
    ) {
        throw new Error("Storage privado de origem fora da árvore autorizada");
    }
    return privateRoot;
}

function assertSafeRelativePrivatePath(relativePath) {
    if (
        typeof relativePath !== "string" ||
        !relativePath ||
        path.isAbsolute(relativePath) ||
        path.normalize(relativePath).startsWith("..") ||
        relativePath.includes("\0")
    ) {
        throw new Error("Referência privada inválida no backup");
    }
    return path.normalize(relativePath);
}

async function collectReferencedPrivateFiles({
    documentsByCollection,
    privateStorageRoot,
}) {
    const safeRoot = resolvePrivateDataRoot(privateStorageRoot);
    const references = new Map();

    for (const definition of PRIVATE_FILE_REFERENCES) {
        const documents =
            documentsByCollection.get(definition.collectionName) ?? [];
        for (const document of documents) {
            const storageKey = document?.[definition.fieldName];
            if (typeof storageKey !== "string" || !storageKey) continue;
            if (!path.isAbsolute(storageKey)) {
                throw new Error("Storage key privado não é absoluto");
            }
            const absolutePath = path.resolve(storageKey);
            const relativePath = assertSafeRelativePrivatePath(
                path.relative(safeRoot, absolutePath),
            );
            const current = references.get(absolutePath);
            references.set(absolutePath, {
                sourceStorageKey: absolutePath,
                relativePath,
                required:
                    Boolean(current?.required) ||
                    document.status === definition.requiredStatus,
            });
        }
    }

    if (references.size === 0) return [];
    const [canonicalRoot, canonicalAllowedRoot] = await Promise.all([
        realpath(safeRoot).catch(() => null),
        realpath(DEFAULT_PRIVATE_DATA_ROOT).catch(() => null),
    ]);
    if (!canonicalRoot || !canonicalAllowedRoot) {
        throw new Error("Storage privado referenciado está indisponível");
    }
    const canonicalRootRelative = path.relative(
        canonicalAllowedRoot,
        canonicalRoot,
    );
    if (
        canonicalRootRelative.startsWith("..") ||
        path.isAbsolute(canonicalRootRelative)
    ) {
        throw new Error("Storage privado de origem fora da árvore autorizada");
    }
    const ordered = [...references.values()].sort((left, right) =>
        left.relativePath.localeCompare(right.relativePath),
    );
    const result = [];

    for (let index = 0; index < ordered.length; index += 1) {
        const reference = ordered[index];
        let bytes = Buffer.alloc(0);
        let state = "present";
        try {
            const metadata = await lstat(reference.sourceStorageKey);
            if (!metadata.isFile() || metadata.isSymbolicLink()) {
                throw new Error("Referência privada não é um ficheiro regular");
            }
            const canonicalFile = await realpath(reference.sourceStorageKey);
            const canonicalRelative = path.relative(canonicalRoot, canonicalFile);
            assertSafeRelativePrivatePath(canonicalRelative);
            bytes = await readFile(canonicalFile);
        } catch (error) {
            if (error?.code !== "ENOENT" || reference.required) {
                throw new Error("Ficheiro privado referenciado está indisponível");
            }
            state = "absent";
        }
        result.push({
            id: `private-${String(index + 1).padStart(6, "0")}`,
            ...reference,
            state,
            bytes,
        });
    }
    return result;
}

/**
 * Aceita exclusivamente URIs MongoDB locais, sem credenciais nem SRV.
 *
 * @param {string} rawUri - URI fornecida explicitamente ao script.
 * @returns {{uri: string, databaseName: string}} URI e base validadas.
 */
export function assertLocalMongoUri(rawUri) {
    const uri = String(rawUri ?? "").trim();

    if (!uri.startsWith("mongodb://") || uri.includes("@")) {
        throw new Error("O backup exige uma URI MongoDB local sem credenciais");
    }

    let parsed;
    try {
        parsed = new URL(uri);
    } catch {
        throw new Error("URI MongoDB local inválida");
    }

    if (!LOCAL_HOSTS.has(parsed.hostname)) {
        throw new Error("O backup só pode ligar a localhost/loopback");
    }

    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    if (!/^[a-zA-Z0-9_-]+$/.test(databaseName)) {
        throw new Error("A URI local deve indicar uma base de dados explícita");
    }

    return { uri, databaseName };
}

/**
 * Cria um identificador cronologicamente ordenável para o snapshot.
 *
 * @param {Date} now - Relógio injetável.
 * @returns {string} Nome seguro de diretório.
 */
export function createSnapshotId(now = new Date()) {
    return `${SNAPSHOT_PREFIX}${now.toISOString().replace(/[-:.]/g, "")}`;
}

/**
 * Serializa BSON sem perder ObjectId, Date, Decimal128 ou binários.
 *
 * @param {unknown} value - Valor BSON/JS.
 * @returns {string} Extended JSON canónico.
 */
function stringifyEjson(value) {
    return EJSON.stringify(value, { relaxed: false });
}

/**
 * Cifra bytes com AAD para impedir troca de ficheiros entre coleções/snapshots.
 *
 * @param {Buffer} plaintext - Conteúdo Extended JSON.
 * @param {Buffer|string} rawKey - Chave dedicada.
 * @param {string} aad - Contexto autenticado.
 * @param {{randomBytesFn?: typeof randomBytes}} [options] - Fonte de IV injetável.
 * @returns {object} Envelope JSON persistível.
 */
export function encryptBackupBuffer(
    plaintext,
    rawKey,
    aad,
    { randomBytesFn = randomBytes } = {},
) {
    const key = parseBackupEncryptionKey(rawKey);
    const iv = randomBytesFn(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from(aad, "utf8"));
    const ciphertext = Buffer.concat([
        cipher.update(plaintext),
        cipher.final(),
    ]);

    return {
        format: BACKUP_ENVELOPE_FORMAT,
        algorithm: ALGORITHM,
        keyId: sha256(key).slice(0, 16),
        aad,
        iv: iv.toString("base64"),
        authTag: cipher.getAuthTag().toString("base64"),
        plaintextSha256: sha256(plaintext),
        ciphertext: ciphertext.toString("base64"),
    };
}

/**
 * Autentica, decifra e valida o checksum do envelope.
 *
 * @param {object} envelope - Envelope lido do snapshot.
 * @param {Buffer|string} rawKey - Chave dedicada.
 * @param {string} expectedAad - Contexto esperado pelo manifest.
 * @returns {Buffer} Extended JSON original.
 */
export function decryptBackupBuffer(envelope, rawKey, expectedAad) {
    if (
        envelope?.format !== BACKUP_ENVELOPE_FORMAT ||
        envelope?.algorithm !== ALGORITHM ||
        envelope?.aad !== expectedAad
    ) {
        throw new Error("Envelope de backup inválido ou fora de contexto");
    }

    try {
        const key = parseBackupEncryptionKey(rawKey);
        const decipher = createDecipheriv(
            ALGORITHM,
            key,
            Buffer.from(envelope.iv, "base64"),
        );
        decipher.setAAD(Buffer.from(expectedAad, "utf8"));
        decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));
        const plaintext = Buffer.concat([
            decipher.update(Buffer.from(envelope.ciphertext, "base64")),
            decipher.final(),
        ]);

        if (sha256(plaintext) !== envelope.plaintextSha256) {
            throw new Error("Checksum interno do backup não coincide");
        }

        return plaintext;
    } catch (error) {
        if (error?.message?.includes("Checksum interno")) throw error;
        throw new Error("Não foi possível autenticar ou decifrar o backup");
    }
}

/**
 * Mantém apenas opções de índice reproduzíveis entre versões MongoDB.
 *
 * @param {object[]} indexes - Resultado de `collection.indexes()`.
 * @returns {object[]} Índices normalizados e ordenados.
 */
export function normalizeIndexes(indexes) {
    const optionalKeys = [
        "unique",
        "sparse",
        "expireAfterSeconds",
        "partialFilterExpression",
        "collation",
    ];

    return indexes
        .map((index) => {
            const normalized = { name: index.name, key: index.key };
            for (const key of optionalKeys) {
                if (index[key] !== undefined) normalized[key] = index[key];
            }
            return normalized;
        })
        .sort((left, right) => left.name.localeCompare(right.name));
}

/**
 * Lê apenas metadados que não são permitidos dentro de uma transação MongoDB.
 * A leitura é repetida antes e depois do snapshot; qualquer alteração de
 * coleções/índices invalida a tentativa em vez de misturar eras de schema.
 *
 * @param {import("mongodb").Db} db - Base local de origem.
 * @returns {Promise<{name: string, indexes: object[]}[]>} Metadados canónicos.
 */
async function readCollectionMetadata(db) {
    const collectionNames = (
        await db.listCollections({}, { nameOnly: true }).toArray()
    )
        .map(({ name }) => name)
        .filter((name) => !name.startsWith("system."))
        .sort();
    const metadata = [];

    for (const name of collectionNames) {
        metadata.push({
            name,
            indexes: normalizeIndexes(await db.collection(name).indexes()),
        });
    }

    return metadata;
}

/**
 * Confirma estabilidade do catálogo sem executar `listCollections` ou
 * `listIndexes` na transação snapshot (operações rejeitadas pelo MongoDB).
 *
 * @param {object[]} before - Metadados anteriores ao snapshot.
 * @param {object[]} after - Metadados posteriores ao snapshot.
 * @returns {void}
 */
function assertStableCollectionMetadata(before, after) {
    if (sha256(stringifyEjson(before)) !== sha256(stringifyEjson(after))) {
        throw new Error(
            "Coleções ou índices mudaram durante o snapshot; tenta novamente",
        );
    }
}

/**
 * Lê todos os documentos sob um único readConcern snapshot.
 *
 * @param {object} options - Dependências transacionais.
 * @param {import("mongodb").Db} options.db - Base de origem.
 * @param {object[]} options.metadata - Coleções estáveis pré-lidas.
 * @param {Function|undefined} options.sessionFactory - Fábrica injetável para testes.
 * @param {Function|undefined} options.afterCollectionRead - Hook interno de concorrência.
 * @returns {Promise<Map<string, object[]>>} Documentos por coleção.
 */
async function readDocumentsAtConsistentPoint({
    db,
    metadata,
    sessionFactory,
    afterCollectionRead,
}) {
    const session = sessionFactory
        ? await sessionFactory()
        : db.client?.startSession?.();

    if (!session?.withTransaction || !session?.endSession) {
        throw new Error(
            "Snapshot requer MongoDB com sessão transacional disponível",
        );
    }

    try {
        let documentsByCollection = new Map();
        await session.withTransaction(
            async () => {
                const attempt = new Map();
                for (let index = 0; index < metadata.length; index += 1) {
                    const collectionName = metadata[index].name;
                    const documents = await db
                        .collection(collectionName)
                        .find({}, { session })
                        .sort({ _id: 1 })
                        .toArray();
                    attempt.set(collectionName, documents);
                    if (afterCollectionRead) {
                        await afterCollectionRead({
                            collectionName,
                            index,
                            session,
                        });
                    }
                }
                documentsByCollection = attempt;
            },
            {
                readConcern: { level: "snapshot" },
                readPreference: "primary",
            },
        );
        return documentsByCollection;
    } finally {
        await session.endSession();
    }
}

/**
 * Escreve um ficheiro por rename atómico dentro do mesmo diretório.
 *
 * @param {string} destination - Destino final.
 * @param {Buffer|string} contents - Conteúdo completo.
 * @returns {Promise<void>}
 */
async function atomicWriteFile(destination, contents) {
    const temporary = `${destination}.${process.pid}.tmp`;
    await writeFile(temporary, contents, { mode: 0o600 });
    await rename(temporary, destination);
}

/**
 * Valida que um nome do manifest não consegue escapar do snapshot.
 *
 * @param {string} snapshotDirectory - Diretório confiável.
 * @param {string} fileName - Nome vindo do manifest.
 * @returns {string} Caminho absoluto seguro.
 */
function resolveSnapshotFile(snapshotDirectory, fileName) {
    if (path.basename(fileName) !== fileName) {
        throw new Error("Nome de ficheiro inválido no manifest");
    }

    return path.join(snapshotDirectory, fileName);
}

/**
 * Cria snapshot cifrado de todas as coleções e índices da base indicada.
 *
 * @param {{db: import("mongodb").Db, backupRoot?: string, privateStorageRoot?: string, encryptionKey: Buffer|string, now?: Date, sessionFactory?: Function, afterCollectionRead?: Function, afterSnapshotRead?: Function, afterCollectionWritten?: Function, afterPrivateFileWritten?: Function}} options - Dependências explícitas e hooks internos de teste.
 * @returns {Promise<object>} Manifest sanitizado do snapshot.
 */
export async function createBackupSnapshot({
    db,
    backupRoot = DEFAULT_BACKUP_ROOT,
    privateStorageRoot = DEFAULT_PRIVATE_DATA_ROOT,
    encryptionKey,
    now = new Date(),
    sessionFactory,
    afterCollectionRead,
    afterSnapshotRead,
    afterCollectionWritten,
    afterPrivateFileWritten,
}) {
    parseBackupEncryptionKey(encryptionKey);
    const safeRoot = resolveBackupRoot(backupRoot);
    const snapshotId = createSnapshotId(now);
    const snapshotDirectory = path.join(safeRoot, snapshotId);
    const stagingDirectory = path.join(
        safeRoot,
        `${STAGING_PREFIX}${snapshotId}-${randomBytes(8).toString("hex")}`,
    );
    await mkdir(safeRoot, { recursive: true, mode: 0o700 });
    await chmod(safeRoot, 0o700);
    await mkdir(stagingDirectory, { recursive: false, mode: 0o700 });

    try {
        const metadataBefore = await readCollectionMetadata(db);
        const documentsByCollection = await readDocumentsAtConsistentPoint({
            db,
            metadata: metadataBefore,
            sessionFactory,
            afterCollectionRead,
        });
        if (afterSnapshotRead) await afterSnapshotRead();
        const metadataAfter = await readCollectionMetadata(db);
        assertStableCollectionMetadata(metadataBefore, metadataAfter);
        const referencedPrivateFiles = await collectReferencedPrivateFiles({
            documentsByCollection,
            privateStorageRoot,
        });
        const collections = [];

        for (let index = 0; index < metadataBefore.length; index += 1) {
            const { name: collectionName, indexes } = metadataBefore[index];
            const documents = documentsByCollection.get(collectionName) ?? [];
            const payload = {
                format: BACKUP_FORMAT,
                collectionName,
                documents,
                indexes,
            };
            const plaintext = Buffer.from(stringifyEjson(payload), "utf8");
            const aad = `${snapshotId}:${collectionName}`;
            const envelope = encryptBackupBuffer(
                plaintext,
                encryptionKey,
                aad,
            );
            const safeCollectionName =
                collectionName.replace(/[^a-z0-9_-]/gi, "-") || "collection";
            const fileName = `${safeCollectionName}-${sha256(collectionName).slice(0, 12)}.ejson.enc`;
            const fileBuffer = Buffer.from(
                `${JSON.stringify(envelope)}\n`,
                "utf8",
            );
            await atomicWriteFile(
                path.join(stagingDirectory, fileName),
                fileBuffer,
            );

            collections.push({
                name: collectionName,
                fileName,
                documentCount: documents.length,
                indexCount: indexes.length,
                encryptedSha256: sha256(fileBuffer),
                plaintextSha256: envelope.plaintextSha256,
            });
            if (afterCollectionWritten) {
                await afterCollectionWritten({ collectionName, index });
            }
        }

        const privateFiles = [];
        for (let index = 0; index < referencedPrivateFiles.length; index += 1) {
            const privateFile = referencedPrivateFiles[index];
            const payload = {
                format: PRIVATE_FILE_BACKUP_FORMAT,
                id: privateFile.id,
                sourceStorageKey: privateFile.sourceStorageKey,
                relativePath: privateFile.relativePath,
                state: privateFile.state,
                bytes: privateFile.bytes.toString("base64"),
            };
            const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
            const aad = `${snapshotId}:private-file:${privateFile.id}`;
            const envelope = encryptBackupBuffer(
                plaintext,
                encryptionKey,
                aad,
            );
            const fileName = `${privateFile.id}.bin.enc`;
            const fileBuffer = Buffer.from(
                `${JSON.stringify(envelope)}\n`,
                "utf8",
            );
            await atomicWriteFile(
                path.join(stagingDirectory, fileName),
                fileBuffer,
            );
            privateFiles.push({
                id: privateFile.id,
                fileName,
                state: privateFile.state,
                byteLength: privateFile.bytes.length,
                encryptedSha256: sha256(fileBuffer),
                plaintextSha256: envelope.plaintextSha256,
            });
            if (afterPrivateFileWritten) {
                await afterPrivateFileWritten({ id: privateFile.id, index });
            }
        }

        const manifest = {
            format: BACKUP_FORMAT,
            snapshotId,
            generatedAt: now.toISOString(),
            sourceDatabase: db.databaseName,
            collections,
            privateFiles,
        };
        const manifestBuffer = Buffer.from(
            `${JSON.stringify(manifest, null, 2)}\n`,
            "utf8",
        );
        const manifestSha256 = sha256(manifestBuffer);
        await atomicWriteFile(
            path.join(stagingDirectory, "manifest.json"),
            manifestBuffer,
        );
        await atomicWriteFile(
            path.join(stagingDirectory, "manifest.sha256"),
            `${manifestSha256}  manifest.json\n`,
        );

        // A publicação só ocorre depois de uma leitura criptográfica integral
        // usando a chave ativa; `list/latest/prune` exigem este marcador.
        await readVerifiedBackupSnapshot({
            snapshotDirectory: stagingDirectory,
            encryptionKey,
        });
        await atomicWriteFile(
            path.join(stagingDirectory, BACKUP_COMPLETION_FILE),
            `${JSON.stringify({
                format: BACKUP_FORMAT,
                snapshotId,
                manifestSha256,
                verifiedAt: new Date().toISOString(),
            })}\n`,
        );

        await rename(stagingDirectory, snapshotDirectory);
        return manifest;
    } catch (error) {
        await rm(stagingDirectory, { recursive: true, force: true });
        throw error;
    }
}

/**
 * Lê e valida manifest, sidecar, envelopes e checksums do snapshot.
 *
 * @param {{snapshotDirectory: string, encryptionKey: Buffer|string}} options - Snapshot e chave.
 * @returns {Promise<{manifest: object, payloads: object[], privateFiles: object[]}>} Conteúdo autenticado.
 */
export async function readVerifiedBackupSnapshot({
    snapshotDirectory,
    encryptionKey,
}) {
    const manifestPath = path.join(snapshotDirectory, "manifest.json");
    const checksumPath = path.join(snapshotDirectory, "manifest.sha256");
    const [manifestBuffer, checksumText] = await Promise.all([
        readFile(manifestPath),
        readFile(checksumPath, "utf8"),
    ]);
    const checksumMatch = checksumText
        .trim()
        .match(/^([a-f0-9]{64})\s+manifest\.json$/iu);
    if (!checksumMatch) {
        throw new Error("Sidecar do manifest inválido");
    }
    const expectedManifestChecksum = checksumMatch[1].toLowerCase();
    if (sha256(manifestBuffer) !== expectedManifestChecksum) {
        throw new Error("Checksum do manifest não coincide");
    }

    const manifest = JSON.parse(manifestBuffer.toString("utf8"));
    const directoryName = path.basename(snapshotDirectory);
    if (
        manifest.format !== BACKUP_FORMAT ||
        !manifest.snapshotId?.startsWith(SNAPSHOT_PREFIX) ||
        !Array.isArray(manifest.collections) ||
        !Array.isArray(manifest.privateFiles) ||
        (directoryName.startsWith(SNAPSHOT_PREFIX) &&
            directoryName !== manifest.snapshotId)
    ) {
        throw new Error("Manifest de backup inválido");
    }

    const payloads = [];
    const collectionNames = new Set();
    const fileNames = new Set();
    for (const entry of manifest.collections) {
        if (
            !entry?.name ||
            !entry?.fileName ||
            collectionNames.has(entry.name) ||
            fileNames.has(entry.fileName) ||
            !Number.isSafeInteger(entry.documentCount) ||
            entry.documentCount < 0 ||
            !Number.isSafeInteger(entry.indexCount) ||
            entry.indexCount < 0 ||
            !/^[a-f0-9]{64}$/iu.test(entry.encryptedSha256 ?? "") ||
            !/^[a-f0-9]{64}$/iu.test(entry.plaintextSha256 ?? "")
        ) {
            throw new Error("Entrada inválida no manifest de backup");
        }
        collectionNames.add(entry.name);
        fileNames.add(entry.fileName);
        const filePath = resolveSnapshotFile(snapshotDirectory, entry.fileName);
        const fileBuffer = await readFile(filePath);
        if (sha256(fileBuffer) !== entry.encryptedSha256) {
            throw new Error(`Checksum cifrado inválido para ${entry.name}`);
        }

        const envelope = JSON.parse(fileBuffer.toString("utf8"));
        const aad = `${manifest.snapshotId}:${entry.name}`;
        const plaintext = decryptBackupBuffer(envelope, encryptionKey, aad);
        if (sha256(plaintext) !== entry.plaintextSha256) {
            throw new Error(`Checksum original inválido para ${entry.name}`);
        }

        const payload = EJSON.parse(plaintext.toString("utf8"), {
            relaxed: false,
        });
        if (
            payload.format !== BACKUP_FORMAT ||
            payload.collectionName !== entry.name ||
            !Array.isArray(payload.documents) ||
            !Array.isArray(payload.indexes) ||
            payload.documents.length !== entry.documentCount ||
            payload.indexes.length !== entry.indexCount
        ) {
            throw new Error(`Payload incoerente para ${entry.name}`);
        }
        payloads.push(payload);
    }

    const privateFiles = [];
    const privateIds = new Set();
    for (const entry of manifest.privateFiles) {
        if (
            !/^private-\d{6}$/u.test(entry?.id ?? "") ||
            privateIds.has(entry.id) ||
            !entry?.fileName ||
            fileNames.has(entry.fileName) ||
            !new Set(["present", "absent"]).has(entry.state) ||
            !Number.isSafeInteger(entry.byteLength) ||
            entry.byteLength < 0 ||
            !/^[a-f0-9]{64}$/iu.test(entry.encryptedSha256 ?? "") ||
            !/^[a-f0-9]{64}$/iu.test(entry.plaintextSha256 ?? "")
        ) {
            throw new Error("Entrada privada inválida no manifest de backup");
        }
        privateIds.add(entry.id);
        fileNames.add(entry.fileName);
        const fileBuffer = await readFile(
            resolveSnapshotFile(snapshotDirectory, entry.fileName),
        );
        if (sha256(fileBuffer) !== entry.encryptedSha256) {
            throw new Error("Checksum cifrado inválido para ficheiro privado");
        }
        const envelope = JSON.parse(fileBuffer.toString("utf8"));
        const aad = `${manifest.snapshotId}:private-file:${entry.id}`;
        const plaintext = decryptBackupBuffer(envelope, encryptionKey, aad);
        if (sha256(plaintext) !== entry.plaintextSha256) {
            throw new Error("Checksum original inválido para ficheiro privado");
        }
        const payload = JSON.parse(plaintext.toString("utf8"));
        const relativePath = assertSafeRelativePrivatePath(
            payload?.relativePath,
        );
        if (
            payload?.format !== PRIVATE_FILE_BACKUP_FORMAT ||
            payload.id !== entry.id ||
            !path.isAbsolute(payload.sourceStorageKey ?? "") ||
            payload.sourceStorageKey.includes("\0") ||
            payload.state !== entry.state ||
            typeof payload.bytes !== "string"
        ) {
            throw new Error("Payload privado incoerente no backup");
        }
        const bytes = Buffer.from(payload.bytes, "base64");
        if (
            bytes.length !== entry.byteLength ||
            (entry.state === "absent" && bytes.length !== 0)
        ) {
            throw new Error("Bytes privados incoerentes no backup");
        }
        privateFiles.push({
            id: entry.id,
            sourceStorageKey: payload.sourceStorageKey,
            relativePath,
            state: entry.state,
            bytes,
            plaintextSha256: entry.plaintextSha256,
        });
    }

    return { manifest, payloads, privateFiles };
}

/**
 * Recria índices não implícitos numa coleção restaurada.
 *
 * @param {import("mongodb").Collection} collection - Coleção alvo.
 * @param {object[]} indexes - Índices normalizados do snapshot.
 * @returns {Promise<void>}
 */
async function restoreIndexes(collection, indexes) {
    const definitions = indexes
        .filter((index) => index.name !== "_id_")
        .map(({ key, ...options }) => ({ key, ...options }));

    if (definitions.length > 0) {
        await collection.createIndexes(definitions);
    }
}

function resolveRestoreStorageRoot({
    databaseName,
    snapshotId,
    restoreStorageRoot,
}) {
    const targetRoot = restoreStorageRoot
        ? path.resolve(restoreStorageRoot)
        : path.join(DEFAULT_RESTORE_STORAGE_ROOT, databaseName, snapshotId);
    const relative = path.relative(DEFAULT_RESTORE_STORAGE_ROOT, targetRoot);
    if (
        !relative ||
        relative.startsWith("..") ||
        path.isAbsolute(relative) ||
        relative.includes("\0")
    ) {
        throw new Error("Storage de restore fora da árvore privada isolada");
    }
    return targetRoot;
}

function buildPrivateRestorePlan({
    privateFiles,
    databaseName,
    snapshotId,
    restoreStorageRoot,
}) {
    const targetRoot = resolveRestoreStorageRoot({
        databaseName,
        snapshotId,
        restoreStorageRoot,
    });
    const mapping = new Map();
    const targets = new Set();
    const files = privateFiles.map((privateFile) => {
        const relativePath = assertSafeRelativePrivatePath(
            privateFile.relativePath,
        );
        const targetStorageKey = path.join(targetRoot, relativePath);
        if (
            mapping.has(privateFile.sourceStorageKey) ||
            targets.has(targetStorageKey)
        ) {
            throw new Error("Referências privadas duplicadas no restore");
        }
        mapping.set(privateFile.sourceStorageKey, targetStorageKey);
        targets.add(targetStorageKey);
        return { ...privateFile, relativePath, targetStorageKey };
    });
    return { targetRoot, mapping, files };
}

function rewritePrivateStorageReferences(value, mapping) {
    if (typeof value === "string") return mapping.get(value) ?? value;
    if (Array.isArray(value)) {
        return value.map((entry) =>
            rewritePrivateStorageReferences(entry, mapping),
        );
    }
    if (
        !value ||
        typeof value !== "object" ||
        value instanceof Date ||
        Buffer.isBuffer(value) ||
        value._bsontype
    ) {
        return value;
    }
    return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
            key,
            rewritePrivateStorageReferences(entry, mapping),
        ]),
    );
}

async function stagePrivateRestoreFiles(plan) {
    const stagingRoot = `${plan.targetRoot}.staging-${randomBytes(8).toString("hex")}`;
    await mkdir(stagingRoot, { recursive: true, mode: 0o700 });
    await chmod(stagingRoot, 0o700);
    try {
        for (const privateFile of plan.files) {
            if (privateFile.state === "absent") continue;
            const stagingPath = path.join(stagingRoot, privateFile.relativePath);
            await mkdir(path.dirname(stagingPath), {
                recursive: true,
                mode: 0o700,
            });
            await writeFile(stagingPath, privateFile.bytes, {
                mode: 0o600,
                flag: "wx",
            });
            if (sha256(await readFile(stagingPath)) !== sha256(privateFile.bytes)) {
                throw new Error("Checksum do ficheiro privado restaurado não coincide");
            }
        }
        return stagingRoot;
    } catch (error) {
        await rm(stagingRoot, { recursive: true, force: true });
        throw error;
    }
}

async function verifyPrivateRestoreFiles(plan) {
    for (const privateFile of plan.files) {
        if (privateFile.state === "absent") {
            await readFile(privateFile.targetStorageKey)
                .then(() => {
                    throw new Error("Ficheiro privado ausente foi materializado");
                })
                .catch((error) => {
                    if (error?.code !== "ENOENT") throw error;
                });
            continue;
        }
        const restored = await readFile(privateFile.targetStorageKey);
        if (sha256(restored) !== sha256(privateFile.bytes)) {
            throw new Error("Verificação dos bytes privados restaurados falhou");
        }
    }
    return { count: plan.files.length, match: true };
}

/**
 * Restaura um snapshot apenas numa base terminada em `_restore`.
 *
 * @param {{db: import("mongodb").Db, snapshotDirectory: string, encryptionKey: Buffer|string, restoreStorageRoot?: string}} options - Alvo isolado.
 * @returns {Promise<object>} Contagens restauradas.
 */
export async function restoreBackupSnapshot({
    db,
    snapshotDirectory,
    encryptionKey,
    restoreStorageRoot,
}) {
    if (!String(db.databaseName).endsWith("_restore")) {
        throw new Error("Restore permitido apenas numa base terminada em _restore");
    }

    const { manifest, payloads, privateFiles } = await readVerifiedBackupSnapshot({
        snapshotDirectory,
        encryptionKey,
    });
    const restorePlan = buildPrivateRestorePlan({
        privateFiles,
        databaseName: db.databaseName,
        snapshotId: manifest.snapshotId,
        restoreStorageRoot,
    });
    const stagingRoot = await stagePrivateRestoreFiles(restorePlan);
    try {
        await db.dropDatabase();

        for (const payload of payloads) {
            const collection = await db.createCollection(payload.collectionName);
            const documents = rewritePrivateStorageReferences(
                payload.documents,
                restorePlan.mapping,
            );
            if (documents.length > 0) {
                await collection.insertMany(documents, { ordered: true });
            }
            await restoreIndexes(collection, payload.indexes);
        }
        await mkdir(path.dirname(restorePlan.targetRoot), {
            recursive: true,
            mode: 0o700,
        });
        await rm(restorePlan.targetRoot, { recursive: true, force: true });
        await rename(stagingRoot, restorePlan.targetRoot);
    } catch (error) {
        await rm(stagingRoot, { recursive: true, force: true });
        throw error;
    }

    return {
        snapshotId: manifest.snapshotId,
        targetDatabase: db.databaseName,
        collections: payloads.map((payload) => ({
            name: payload.collectionName,
            documentCount: payload.documents.length,
            indexCount: payload.indexes.length,
        })),
        privateFileCount: privateFiles.length,
    };
}

/**
 * Restaura, compara documentos/índices/checksums e limpa a base efémera.
 *
 * @param {{restoreDb: import("mongodb").Db, snapshotDirectory: string, encryptionKey: Buffer|string, restoreStorageRoot?: string, cleanup?: boolean}} options - Base `_restore` isolada.
 * @returns {Promise<object>} Evidência de integridade.
 */
export async function verifyBackupSnapshot({
    restoreDb,
    snapshotDirectory,
    encryptionKey,
    restoreStorageRoot,
    cleanup = true,
}) {
    const verified = await readVerifiedBackupSnapshot({
        snapshotDirectory,
        encryptionKey,
    });
    const restorePlan = buildPrivateRestorePlan({
        privateFiles: verified.privateFiles,
        databaseName: restoreDb.databaseName,
        snapshotId: verified.manifest.snapshotId,
        restoreStorageRoot,
    });

    try {
        await restoreBackupSnapshot({
            db: restoreDb,
            snapshotDirectory,
            encryptionKey,
            restoreStorageRoot: restorePlan.targetRoot,
        });
        const comparisons = [];

        for (const expected of verified.payloads) {
            const collection = restoreDb.collection(expected.collectionName);
            const documents = await collection.find({}).sort({ _id: 1 }).toArray();
            const indexes = normalizeIndexes(await collection.indexes());
            const expectedDocuments = rewritePrivateStorageReferences(
                expected.documents,
                restorePlan.mapping,
            );
            const documentsMatch =
                sha256(stringifyEjson(documents)) ===
                sha256(stringifyEjson(expectedDocuments));
            const indexesMatch =
                sha256(stringifyEjson(indexes)) ===
                sha256(stringifyEjson(expected.indexes));

            if (!documentsMatch || !indexesMatch) {
                throw new Error(
                    `Verificação de restore falhou para ${expected.collectionName}`,
                );
            }

            comparisons.push({
                name: expected.collectionName,
                documentCount: documents.length,
                indexCount: indexes.length,
                documentsMatch,
                indexesMatch,
            });
        }

        const privateFileComparison = await verifyPrivateRestoreFiles(
            restorePlan,
        );
        return {
            snapshotId: verified.manifest.snapshotId,
            status: "verified",
            comparisons,
            privateFiles: privateFileComparison,
        };
    } finally {
        if (cleanup && String(restoreDb.databaseName).endsWith("_restore")) {
            await restoreDb.dropDatabase();
            await rm(restorePlan.targetRoot, {
                recursive: true,
                force: true,
            });
        }
    }
}

/**
 * Confirma, sem necessitar da chave, que um diretório foi publicado pelo fluxo
 * de staging já verificado e que todos os artefactos cifrados continuam
 * presentes com os checksums registados. A autenticação AES completa continua
 * a ser feita por `readVerifiedBackupSnapshot` no restore/verify.
 *
 * @param {string} snapshotDirectory - Candidato final.
 * @param {string} snapshotId - ID esperado pelo nome da pasta.
 * @returns {Promise<boolean>} Verdadeiro apenas para snapshot completo.
 */
async function isCompleteSnapshotDirectory(snapshotDirectory, snapshotId) {
    try {
        const [markerText, manifestBuffer, checksumText] = await Promise.all([
            readFile(
                path.join(snapshotDirectory, BACKUP_COMPLETION_FILE),
                "utf8",
            ),
            readFile(path.join(snapshotDirectory, "manifest.json")),
            readFile(
                path.join(snapshotDirectory, "manifest.sha256"),
                "utf8",
            ),
        ]);
        const marker = JSON.parse(markerText);
        const manifest = JSON.parse(manifestBuffer.toString("utf8"));
        const manifestSha256 = sha256(manifestBuffer);
        const checksumMatch = checksumText
            .trim()
            .match(/^([a-f0-9]{64})\s+manifest\.json$/iu);

        if (
            marker.format !== BACKUP_FORMAT ||
            marker.snapshotId !== snapshotId ||
            marker.manifestSha256 !== manifestSha256 ||
            checksumMatch?.[1]?.toLowerCase() !== manifestSha256 ||
            manifest.format !== BACKUP_FORMAT ||
            manifest.snapshotId !== snapshotId ||
            !Array.isArray(manifest.collections) ||
            !Array.isArray(manifest.privateFiles)
        ) {
            return false;
        }

        const names = new Set();
        const files = new Set();
        for (const entry of manifest.collections) {
            if (
                !entry?.name ||
                names.has(entry.name) ||
                !entry?.fileName ||
                files.has(entry.fileName) ||
                !/^[a-f0-9]{64}$/iu.test(entry.encryptedSha256 ?? "")
            ) {
                return false;
            }
            names.add(entry.name);
            files.add(entry.fileName);
            const fileBuffer = await readFile(
                resolveSnapshotFile(snapshotDirectory, entry.fileName),
            );
            if (sha256(fileBuffer) !== entry.encryptedSha256) return false;
            const envelope = JSON.parse(fileBuffer.toString("utf8"));
            if (
                envelope.format !== BACKUP_ENVELOPE_FORMAT ||
                envelope.aad !== `${snapshotId}:${entry.name}`
            ) {
                return false;
            }
        }
        for (const entry of manifest.privateFiles) {
            if (
                !/^private-\d{6}$/u.test(entry?.id ?? "") ||
                !entry?.fileName ||
                files.has(entry.fileName) ||
                !/^[a-f0-9]{64}$/iu.test(entry.encryptedSha256 ?? "")
            ) {
                return false;
            }
            files.add(entry.fileName);
            const fileBuffer = await readFile(
                resolveSnapshotFile(snapshotDirectory, entry.fileName),
            );
            if (sha256(fileBuffer) !== entry.encryptedSha256) return false;
            const envelope = JSON.parse(fileBuffer.toString("utf8"));
            if (
                envelope.format !== BACKUP_ENVELOPE_FORMAT ||
                envelope.aad !== `${snapshotId}:private-file:${entry.id}`
            ) {
                return false;
            }
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Lista apenas snapshots completos/verificados por ordem cronológica descendente.
 *
 * @param {string} backupRoot - Raiz privada validada.
 * @returns {Promise<string[]>} IDs de snapshots.
 */
export async function listSnapshotIds(backupRoot = DEFAULT_BACKUP_ROOT) {
    const safeRoot = resolveBackupRoot(backupRoot);
    const entries = await readdir(safeRoot, { withFileTypes: true }).catch(
        (error) => {
            if (error.code === "ENOENT") return [];
            throw error;
        },
    );

    const candidates = entries.filter(
        (entry) =>
            entry.isDirectory() && entry.name.startsWith(SNAPSHOT_PREFIX),
    );
    const completeness = await Promise.all(
        candidates.map(async (entry) => ({
            name: entry.name,
            complete: await isCompleteSnapshotDirectory(
                path.join(safeRoot, entry.name),
                entry.name,
            ),
        })),
    );

    return completeness
        .filter(({ complete }) => complete)
        .map(({ name }) => name)
        .sort()
        .reverse();
}

/**
 * Elimina snapshots antigos, mantendo por defeito os sete mais recentes.
 *
 * @param {{backupRoot?: string, keep?: number}} [options] - Política local.
 * @returns {Promise<{kept: string[], pruned: string[]}>} Resultado sanitizado.
 */
export async function pruneBackupSnapshots({
    backupRoot = DEFAULT_BACKUP_ROOT,
    keep = BACKUP_RETENTION_COUNT,
} = {}) {
    if (!Number.isInteger(keep) || keep < 1 || keep > 365) {
        throw new Error("Retenção de backup inválida");
    }

    const safeRoot = resolveBackupRoot(backupRoot);
    const snapshotIds = await listSnapshotIds(safeRoot);
    const kept = snapshotIds.slice(0, keep);
    const pruned = snapshotIds.slice(keep);

    for (const snapshotId of pruned) {
        await rm(path.join(safeRoot, snapshotId), {
            recursive: true,
            force: false,
        });
    }

    return { kept, pruned };
}

/**
 * Abre um MongoClient depois de validar uma URI explicitamente local.
 *
 * @param {string} uri - URI loopback sem credenciais.
 * @returns {Promise<{client: import("mongodb").MongoClient, db: import("mongodb").Db}>} Ligação local.
 */
export async function connectLocalMongo(uri) {
    const local = assertLocalMongoUri(uri);
    const client = new mongoose.mongo.MongoClient(local.uri);
    await client.connect();
    return { client, db: client.db(local.databaseName) };
}

/**
 * Resolve um snapshot explícito ou o mais recente da raiz.
 *
 * @param {{backupRoot?: string, snapshotId?: string}} [options] - Seleção CLI.
 * @returns {Promise<string>} Diretório absoluto.
 */
export async function resolveSnapshotDirectory({
    backupRoot = DEFAULT_BACKUP_ROOT,
    snapshotId = undefined,
} = {}) {
    const safeRoot = resolveBackupRoot(backupRoot);
    const snapshotIds = await listSnapshotIds(safeRoot);
    const selected = snapshotId ?? snapshotIds[0];

    if (
        !selected ||
        path.basename(selected) !== selected ||
        !selected.startsWith(SNAPSHOT_PREFIX) ||
        !snapshotIds.includes(selected)
    ) {
        throw new Error("Snapshot local não encontrado ou inválido");
    }

    return path.join(safeRoot, selected);
}
