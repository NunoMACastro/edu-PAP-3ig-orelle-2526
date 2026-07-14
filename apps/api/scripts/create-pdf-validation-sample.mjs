/**
 * Gera uma amostra PDF não sensível para validação estrutural e visual local.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSimplePdf } from "../src/services/admin-export.service.js";

const DEFAULT_OUTPUT_PATH = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../tmp/pdfs/orelle-export-validation.pdf",
);

/**
 * Cria uma amostra determinística sem dados reais de utilizadores.
 *
 * @param {string} outputPath - Destino local do PDF.
 * @returns {Promise<{outputPath: string, bytes: number}>} Metadados sanitizados.
 */
export async function createPdfValidationSample(outputPath = DEFAULT_OUTPUT_PATH) {
    const resolvedOutputPath = path.resolve(outputPath);
    const rows = Array.from({ length: 90 }, (_, index) =>
        [
            `DEMO-${String(index + 1).padStart(3, "0")}`,
            index % 2 === 0 ? "active" : "inactive",
            `2026-07-${String((index % 28) + 1).padStart(2, "0")}`,
            "Amostra académica sem dados pessoais",
        ].join(","),
    );
    const body = ["reference,status,date,note", ...rows].join("\n");
    const buffer = await buildSimplePdf("Orélle — validação PDF", body);

    await mkdir(path.dirname(resolvedOutputPath), { recursive: true, mode: 0o700 });
    await writeFile(resolvedOutputPath, buffer, { mode: 0o600 });

    return { outputPath: resolvedOutputPath, bytes: buffer.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const result = await createPdfValidationSample(process.argv[2]);
    process.stdout.write(`${JSON.stringify(result)}\n`);
}
