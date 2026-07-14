/**
 * Testes sem rede do formato de backup académico/local.
 */
import {
    mkdir,
    readFile,
    readdir,
    rm,
    stat,
    writeFile,
} from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    BACKUP_COMPLETION_FILE,
    assertLocalMongoUri,
    createBackupSnapshot,
    createSnapshotId,
    decryptBackupBuffer,
    encryptBackupBuffer,
    parseBackupEncryptionKey,
    listSnapshotIds,
    pruneBackupSnapshots,
    readVerifiedBackupSnapshot,
    resolveBackupRoot,
} from "../scripts/backup-local.core.mjs";
import {
    LOCAL_BACKUP_INTERVAL_MS,
    startLocalBackupScheduler,
} from "../scripts/backup-scheduler.mjs";

const BACKUP_ROOT = resolveBackupRoot("storage/private/backups-core-test");
const KEY = Buffer.alloc(32, 7).toString("base64");

/**
 * Cria uma Db mínima com duas coleções para testar serialização sem MongoDB.
 *
 * @returns {object} Mock compatível com o core de backup.
 */
function createFakeDb() {
    const data = {
        users: {
            documents: [
                {
                    _id: new mongoose.Types.ObjectId(
                        "66c000000000000000000701",
                    ),
                    email: "cliente@orelle.test",
                    createdAt: new Date("2026-07-09T10:00:00.000Z"),
                },
            ],
            indexes: [
                { name: "_id_", key: { _id: 1 } },
                { name: "email_1", key: { email: 1 }, unique: true },
            ],
        },
        orders: {
            documents: [],
            indexes: [{ name: "_id_", key: { _id: 1 } }],
        },
    };

    return {
        databaseName: "orelle_backup_test",
        client: {
            startSession: () => ({
                withTransaction: async (callback) => callback(),
                endSession: async () => undefined,
            }),
        },
        listCollections: () => ({
            toArray: async () => Object.keys(data).map((name) => ({ name })),
        }),
        collection: (name) => ({
            find: () => ({
                sort: () => ({
                    toArray: async () => data[name].documents,
                }),
            }),
            indexes: async () => data[name].indexes,
        }),
    };
}

describe("backup local recuperável", () => {
    beforeEach(async () => {
        await rm(BACKUP_ROOT, { recursive: true, force: true });
        await mkdir(BACKUP_ROOT, { recursive: true });
    });

    afterEach(async () => {
        await rm(BACKUP_ROOT, { recursive: true, force: true });
    });

    it("exige uma chave AES-256 explícita", () => {
        expect(parseBackupEncryptionKey(KEY)).toHaveLength(32);
        expect(() => parseBackupEncryptionKey("curta")).toThrow(
            "32 bytes",
        );
    });

    it("autentica chave, AAD e ciphertext do envelope", () => {
        const plaintext = Buffer.from("conteúdo Extended JSON", "utf8");
        const envelope = encryptBackupBuffer(plaintext, KEY, "snapshot:users", {
            randomBytesFn: () => Buffer.alloc(12, 3),
        });

        expect(
            decryptBackupBuffer(envelope, KEY, "snapshot:users").toString(
                "utf8",
            ),
        ).toBe("conteúdo Extended JSON");
        expect(() =>
            decryptBackupBuffer(envelope, Buffer.alloc(32, 8), "snapshot:users"),
        ).toThrow("autenticar ou decifrar");
        expect(() =>
            decryptBackupBuffer(envelope, KEY, "snapshot:orders"),
        ).toThrow("fora de contexto");
    });

    it("recusa URI remota, SRV e credenciais", () => {
        expect(
            assertLocalMongoUri(
                "mongodb://127.0.0.1:27017/orelle_backup_test?replicaSet=rs0",
            ),
        ).toMatchObject({ databaseName: "orelle_backup_test" });
        expect(() =>
            assertLocalMongoUri("mongodb+srv://cluster.example/orelle"),
        ).toThrow("local");
        expect(() =>
            assertLocalMongoUri("mongodb://user:pass@127.0.0.1/orelle_test"),
        ).toThrow("sem credenciais");
        expect(() =>
            assertLocalMongoUri("mongodb://192.0.2.10/orelle_test"),
        ).toThrow("loopback");
    });

    it("cria e volta a ler um snapshot EJSON cifrado com índices", async () => {
        const manifest = await createBackupSnapshot({
            db: createFakeDb(),
            backupRoot: BACKUP_ROOT,
            encryptionKey: KEY,
            now: new Date("2026-07-09T11:00:00.000Z"),
        });
        const snapshotDirectory = path.join(BACKUP_ROOT, manifest.snapshotId);
        const verified = await readVerifiedBackupSnapshot({
            snapshotDirectory,
            encryptionKey: KEY,
        });
        const users = verified.payloads.find(
            (payload) => payload.collectionName === "users",
        );

        expect(manifest.collections).toHaveLength(2);
        expect(users.documents[0]._id).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(users.documents[0].createdAt).toBeInstanceOf(Date);
        expect(users.indexes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: "email_1", unique: true }),
            ]),
        );
        expect((await stat(BACKUP_ROOT)).mode & 0o777).toBe(0o700);
        expect((await stat(snapshotDirectory)).mode & 0o777).toBe(0o700);
        const snapshotFiles = await readdir(snapshotDirectory);
        for (const fileName of snapshotFiles) {
            expect(
                (await stat(path.join(snapshotDirectory, fileName))).mode &
                    0o777,
            ).toBe(0o600);
        }
    });

    it("deteta alteração do ficheiro cifrado antes de restaurar", async () => {
        const manifest = await createBackupSnapshot({
            db: createFakeDb(),
            backupRoot: BACKUP_ROOT,
            encryptionKey: KEY,
            now: new Date("2026-07-09T12:00:00.000Z"),
        });
        const snapshotDirectory = path.join(BACKUP_ROOT, manifest.snapshotId);
        const target = path.join(
            snapshotDirectory,
            manifest.collections[0].fileName,
        );
        const original = await readFile(target, "utf8");
        await writeFile(target, `${original}tamper`, "utf8");

        await expect(
            readVerifiedBackupSnapshot({
                snapshotDirectory,
                encryptionKey: KEY,
            }),
        ).rejects.toThrow("Checksum cifrado inválido");
    });

    it("mantém exatamente os sete snapshots mais recentes", async () => {
        const ids = [];
        for (let day = 1; day <= 9; day += 1) {
            const manifest = await createBackupSnapshot({
                db: createFakeDb(),
                backupRoot: BACKUP_ROOT,
                encryptionKey: KEY,
                now: new Date(
                    `2026-07-${String(day).padStart(2, "0")}T10:00:00.000Z`,
                ),
            });
            ids.push(manifest.snapshotId);
        }

        const result = await pruneBackupSnapshots({
            backupRoot: BACKUP_ROOT,
            keep: 7,
        });

        expect(result.kept).toHaveLength(7);
        expect(result.pruned).toEqual([ids[1], ids[0]]);
    });

    it("remove staging numa falha e não publica snapshot parcial", async () => {
        await expect(
            createBackupSnapshot({
                db: createFakeDb(),
                backupRoot: BACKUP_ROOT,
                encryptionKey: KEY,
                now: new Date("2026-07-09T13:00:00.000Z"),
                afterCollectionWritten: async ({ index }) => {
                    if (index === 0) throw new Error("falha injetada");
                },
            }),
        ).rejects.toThrow("falha injetada");

        expect(await listSnapshotIds(BACKUP_ROOT)).toEqual([]);
        expect(await readdir(BACKUP_ROOT)).toEqual([]);
    });

    it("ignora diretório final sem marcador verificado em latest/prune", async () => {
        const partialId = createSnapshotId(
            new Date("2026-07-09T14:00:00.000Z"),
        );
        const partialDirectory = path.join(BACKUP_ROOT, partialId);
        await mkdir(partialDirectory);
        await writeFile(
            path.join(partialDirectory, "manifest.json"),
            JSON.stringify({ format: "parcial" }),
        );
        const complete = await createBackupSnapshot({
            db: createFakeDb(),
            backupRoot: BACKUP_ROOT,
            encryptionKey: KEY,
            now: new Date("2026-07-09T13:30:00.000Z"),
        });

        expect(await listSnapshotIds(BACKUP_ROOT)).toEqual([
            complete.snapshotId,
        ]);
        const result = await pruneBackupSnapshots({
            backupRoot: BACKUP_ROOT,
            keep: 1,
        });
        expect(result).toEqual({ kept: [complete.snapshotId], pruned: [] });
        await expect(
            readFile(path.join(partialDirectory, "manifest.json"), "utf8"),
        ).resolves.toContain("parcial");
        await expect(
            readFile(
                path.join(
                    BACKUP_ROOT,
                    complete.snapshotId,
                    BACKUP_COMPLETION_FILE,
                ),
                "utf8",
            ),
        ).resolves.toContain(complete.snapshotId);
    });

    it("não inicia scheduler sem opt-in dev:local", () => {
        const setIntervalFn = vi.fn();

        expect(
            startLocalBackupScheduler({
                runtimeMode: "development",
                enabled: true,
                runJob: vi.fn(),
                setIntervalFn,
            }),
        ).toEqual({ started: false, timer: null });
        expect(setIntervalFn).not.toHaveBeenCalled();
    });

    it("inicia uma única execução diária e aguarda cleanup no stop", async () => {
        let scheduledJob;
        let finishJob;
        const timer = { unref: vi.fn() };
        const setIntervalFn = vi.fn((callback) => {
            scheduledJob = callback;
            return timer;
        });
        const clearIntervalFn = vi.fn();
        const runJob = vi.fn(
            () =>
                new Promise((resolve) => {
                    finishJob = resolve;
                }),
        );
        const scheduler = startLocalBackupScheduler({
            runtimeMode: "dev:local",
            enabled: true,
            runJob,
            setIntervalFn,
            clearIntervalFn,
        });

        expect(scheduler.started).toBe(true);
        expect(setIntervalFn).toHaveBeenCalledWith(
            expect.any(Function),
            LOCAL_BACKUP_INTERVAL_MS,
        );
        expect(timer.unref).toHaveBeenCalledOnce();

        const firstRun = scheduledJob();
        const overlappingRun = scheduledJob();
        expect(overlappingRun).toBe(firstRun);
        await vi.waitFor(() => expect(runJob).toHaveBeenCalledOnce());
        finishJob({ status: "created" });
        await firstRun;
        await scheduler.stop();

        expect(clearIntervalFn).toHaveBeenCalledWith(timer);
    });

    it("publica apenas comandos recuperáveis e não expõe o export diário legado", async () => {
        const packageManifest = JSON.parse(
            await readFile(new URL("../package.json", import.meta.url), "utf8"),
        );
        const backupScripts = Object.fromEntries(
            Object.entries(packageManifest.scripts).filter(([name]) =>
                name.startsWith("backup:"),
            ),
        );

        expect(backupScripts).toEqual({
            "backup:create": "node scripts/backup-create.mjs",
            "backup:restore": "node scripts/backup-restore.mjs",
            "backup:verify": "node scripts/backup-verify.mjs",
            "backup:prune": "node scripts/backup-prune.mjs",
        });
        expect(Object.values(packageManifest.scripts)).not.toContain(
            "node scripts/backup-daily.mjs",
        );
    });
});
