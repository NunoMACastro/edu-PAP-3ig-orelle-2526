/**
 * CLI local de migrações. Exige URI loopback explícita em
 * `ORELLE_LOCAL_MONGODB_URI` e nunca importa dotenv/config da aplicação.
 */
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
    connectLocalMongo,
    assertLocalMongoUri,
} from "./backup-local.core.mjs";
import {
    dryRunMigrations,
    getMigrationStatus,
    runMigrations,
} from "../src/migrations/migration-runner.js";

const ALLOWED_MODES = new Set(["status", "dry-run", "up"]);

/**
 * Executa um comando de migração com ligação explicitamente local.
 *
 * @param {{mode?: string, uri?: string}} [options] - Comando e URI injetáveis.
 * @returns {Promise<{mode: string, database: string, result: object[]}>} Resumo sanitizado.
 */
export async function runMigrationCommand({
    mode = "status",
    uri = process.env.ORELLE_LOCAL_MONGODB_URI,
} = {}) {
    if (!ALLOWED_MODES.has(mode)) {
        throw new Error("Modo de migração inválido: usar status, dry-run ou up");
    }

    const local = assertLocalMongoUri(uri);
    const { client, db } = await connectLocalMongo(local.uri);

    try {
        let result;
        if (mode === "status") {
            result = await getMigrationStatus({ db });
        } else if (mode === "dry-run") {
            result = await dryRunMigrations({ db });
        } else {
            result = await runMigrations({ client, db });
        }

        return { mode, database: local.databaseName, result };
    } finally {
        await client.close();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runMigrationCommand({ mode: process.argv[2] ?? "status" })
        .then((summary) => console.log(JSON.stringify(summary)))
        .catch((error) => {
            console.error(`Migração local falhou: ${error.message}`);
            process.exitCode = 1;
        });
}
