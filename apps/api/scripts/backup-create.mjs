/**
 * CLI `backup:create` para snapshots académicos locais.
 *
 * Exige `ORELLE_LOCAL_MONGODB_URI` loopback e `ORELLE_BACKUP_KEY`; não carrega
 * o `.env` da aplicação e nunca imprime URI, chave ou caminhos privados.
 */
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
    createBackupSnapshot,
    connectLocalMongo,
    pruneBackupSnapshots,
} from "./backup-local.core.mjs";

/**
 * Cria um snapshot e aplica retenção diária de sete cópias.
 *
 * @returns {Promise<object>} Resumo sanitizado para o terminal.
 */
export async function runBackupCreate() {
    const { client, db } = await connectLocalMongo(
        process.env.ORELLE_LOCAL_MONGODB_URI,
    );

    try {
        const manifest = await createBackupSnapshot({
            db,
            backupRoot: process.env.ORELLE_BACKUP_ROOT,
            encryptionKey: process.env.ORELLE_BACKUP_KEY,
        });
        const retention = await pruneBackupSnapshots({
            backupRoot: process.env.ORELLE_BACKUP_ROOT,
            keep: 7,
        });

        return {
            status: "created",
            snapshotId: manifest.snapshotId,
            collectionCount: manifest.collections.length,
            privateFileCount: manifest.privateFiles.length,
            retainedSnapshots: retention.kept.length,
            prunedSnapshots: retention.pruned.length,
        };
    } finally {
        await client.close();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runBackupCreate()
        .then((summary) => console.log(JSON.stringify(summary)))
        .catch((error) => {
            console.error(`Backup local falhou: ${error.message}`);
            process.exitCode = 1;
        });
}
