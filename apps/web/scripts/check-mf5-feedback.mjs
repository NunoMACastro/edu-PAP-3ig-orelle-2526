import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "..");

const checks = [
    {
        file: "src/components/FeedbackMessage.jsx",
        required: [
            "role={config.role}",
            "aria-live={config.ariaLive}",
            "aria-hidden=\"true\"",
            "feedback__label",
        ],
    },
    {
        file: "src/components/SubmitButton.jsx",
        required: ["disabled={isDisabled}", "aria-busy={isBusy}", "button--busy"],
    },
    {
        file: "src/pages/RegisterPage.jsx",
        required: [
            "FeedbackMessage",
            "SubmitButton",
            "aria-describedby",
            'apiRequest("/auth/register"',
        ],
    },
    {
        file: "src/pages/FacePhotoUploadPage.jsx",
        required: [
            "FeedbackMessage",
            "SubmitButton",
            "Aceita o consentimento e escolhe as duas fotografias.",
            "FormData",
            "/face-photos",
        ],
    },
    {
        file: "src/styles.css",
        required: [
            ".feedback",
            ".feedback__icon",
            ".feedback__label",
            ".feedback--error",
            ".feedback--success",
            ".button--busy",
        ],
    },
];

/**
 * Garante que um ficheiro contem todos os fragmentos esperados.
 *
 * @async
 * @function assertContains
 * @param {{file: string, required: string[]}} check - Ficheiro relativo e fragmentos obrigatorios.
 * @returns {Promise<void>} Termina sem erro quando o contrato esta presente.
 */
async function assertContains(check) {
    const absolutePath = resolve(webRoot, check.file);
    const content = await readFile(absolutePath, "utf8");

    for (const fragment of check.required) {
        // A verificacao e textual para nao exigir dependencias novas de testes frontend.
        if (!content.includes(fragment)) {
            throw new Error(`${check.file} nao contem: ${fragment}`);
        }
    }
}

for (const check of checks) {
    await assertContains(check);
}

console.log("BK-MF5-07 feedback smoke: PASS");
