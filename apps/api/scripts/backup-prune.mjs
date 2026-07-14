/**
 * CLI `backup:prune` para manter os sete snapshots locais mais recentes.
 */
import process from "node:process";
import { fileURLToPath } from "node:url";
import { pruneBackupSnapshots } from "./backup-local.core.mjs";

/**
 * Aplica a retenção local sem aceder à base de dados.
 *
 * @returns {Promise<object>} Contagens sanitizadas.
 */
export async function runBackupPrune() {
    const result = await pruneBackupSnapshots({
        backupRoot: process.env.ORELLE_BACKUP_ROOT,
        keep: 7,
    });

    return {
        status: "pruned",
        retainedSnapshots: result.kept.length,
        prunedSnapshots: result.pruned.length,
    };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runBackupPrune()
        .then((summary) => console.log(JSON.stringify(summary)))
        .catch((error) => {
            console.error(`Retenção de backup falhou: ${error.message}`);
            process.exitCode = 1;
        });
}
