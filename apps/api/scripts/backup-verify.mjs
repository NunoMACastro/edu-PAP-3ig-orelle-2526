/**
 * CLI `backup:verify`: restaura numa base efémera `_restore`, compara conteúdo
 * e índices e elimina a base de verificação no final.
 */
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
    assertLocalMongoUri,
    connectLocalMongo,
    resolveSnapshotDirectory,
    verifyBackupSnapshot,
} from "./backup-local.core.mjs";

/**
 * Verifica integralmente o snapshot indicado ou mais recente.
 *
 * @returns {Promise<object>} Evidência sanitizada de integridade.
 */
export async function runBackupVerify() {
    const local = assertLocalMongoUri(process.env.ORELLE_LOCAL_MONGODB_URI);
    const targetDatabase = `${local.databaseName}_backup_verify_restore`;
    const { client } = await connectLocalMongo(local.uri);

    try {
        const snapshotDirectory = await resolveSnapshotDirectory({
            backupRoot: process.env.ORELLE_BACKUP_ROOT,
            snapshotId: process.env.ORELLE_BACKUP_SNAPSHOT_ID,
        });
        const result = await verifyBackupSnapshot({
            restoreDb: client.db(targetDatabase),
            snapshotDirectory,
            encryptionKey: process.env.ORELLE_BACKUP_KEY,
            cleanup: true,
        });

        return {
            status: result.status,
            snapshotId: result.snapshotId,
            collectionCount: result.comparisons.length,
            allDocumentsMatch: result.comparisons.every(
                (item) => item.documentsMatch,
            ),
            allIndexesMatch: result.comparisons.every(
                (item) => item.indexesMatch,
            ),
            privateFilesMatch: result.privateFiles.match,
            privateFileCount: result.privateFiles.count,
        };
    } finally {
        await client.close();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runBackupVerify()
        .then((summary) => console.log(JSON.stringify(summary)))
        .catch((error) => {
            console.error(`Verificação de backup falhou: ${error.message}`);
            process.exitCode = 1;
        });
}
