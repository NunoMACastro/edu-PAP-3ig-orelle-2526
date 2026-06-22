import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "..");

const checks = [
    {
        file: "src/components/FeedbackMessage.jsx",
        required: ["role={config.role}", "aria-live={config.ariaLive}", "feedback__label"],
    },
    {
        file: "src/components/SubmitButton.jsx",
        required: ["disabled={isDisabled}", "aria-busy={isBusy}", "button--busy"],
    },
    {
        file: "src/pages/RegisterPage.jsx",
        required: ["FeedbackMessage", "SubmitButton", "apiRequest(\"/auth/register\""],
    },
    {
        file: "src/pages/FacePhotoUploadPage.jsx",
        required: ["FeedbackMessage", "SubmitButton", "FormData", "/face-photos"],
    },
    {
        file: "src/styles.css",
        required: [".feedback", ".feedback--error", ".button--busy"],
    },
];

/**
 * Garante que um ficheiro contém todos os fragmentos esperados.
 *
 * @async
 * @function assertContains
 * @param {{file: string, required: string[]}} check - Ficheiro relativo e fragmentos obrigatórios.
 * @returns {Promise<void>} Termina sem erro quando o contrato está presente.
 */
async function assertContains(check) {
    const absolutePath = resolve(webRoot, check.file);
    const content = await readFile(absolutePath, "utf8");

    for (const fragment of check.required) {
        // A verificação é textual para não exigir dependências novas de testes frontend.
        if (!content.includes(fragment)) {
            throw new Error(`${check.file} não contém: ${fragment}`);
        }
    }
}

for (const check of checks) {
    await assertContains(check);
}

console.log("BK-MF5-07 feedback smoke: PASS");