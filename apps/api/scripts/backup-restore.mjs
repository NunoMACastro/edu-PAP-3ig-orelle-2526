/**
 * CLI `backup:restore` para uma base local isolada terminada em `_restore`.
 */
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
    assertLocalMongoUri,
    connectLocalMongo,
    resolveSnapshotDirectory,
    restoreBackupSnapshot,
} from "./backup-local.core.mjs";

/**
 * Restaura o snapshot indicado ou o mais recente.
 *
 * @returns {Promise<object>} Resumo sanitizado.
 */
export async function runBackupRestore() {
    const local = assertLocalMongoUri(process.env.ORELLE_LOCAL_MONGODB_URI);
    const targetDatabase =
        process.env.ORELLE_RESTORE_DATABASE ?? `${local.databaseName}_restore`;

    if (!targetDatabase.endsWith("_restore")) {
        throw new Error("ORELLE_RESTORE_DATABASE deve terminar em _restore");
    }

    const { client } = await connectLocalMongo(local.uri);
    try {
        const snapshotDirectory = await resolveSnapshotDirectory({
            backupRoot: process.env.ORELLE_BACKUP_ROOT,
            snapshotId: process.env.ORELLE_BACKUP_SNAPSHOT_ID,
        });
        const result = await restoreBackupSnapshot({
            db: client.db(targetDatabase),
            snapshotDirectory,
            encryptionKey: process.env.ORELLE_BACKUP_KEY,
        });

        return {
            status: "restored",
            snapshotId: result.snapshotId,
            targetDatabase: result.targetDatabase,
            collectionCount: result.collections.length,
            privateFileCount: result.privateFileCount,
        };
    } finally {
        await client.close();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runBackupRestore()
        .then((summary) => console.log(JSON.stringify(summary)))
        .catch((error) => {
            console.error(`Restore local falhou: ${error.message}`);
            process.exitCode = 1;
        });
}
