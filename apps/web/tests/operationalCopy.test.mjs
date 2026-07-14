/** Contrato transversal que impede copy de implementação nas páginas publicadas. */
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SOURCE_ROOT = fileURLToPath(new URL("../src", import.meta.url));
const FORBIDDEN_PUBLIC_COPY = Object.freeze([
    /pagamento simulado/i,
    /vendas simuladas/i,
    /volume simulado/i,
    /demonstração académica/i,
    /avisos da verificação do servidor/i,
    /confirmado pela API/i,
    /comunicar com a API/i,
    /prova CSRF/i,
    /resposta JSON inválida/i,
    /gates locais/i,
    /validação segura do servidor/i,
    /o retry mantém/i,
    /versão do prompt/i,
    /versão do esquema/i,
    /registo legado cancelado/i,
]);

/** Recolhe recursivamente módulos que podem contribuir texto para o bundle. */
async function listSourceModules(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(
        entries.map(async (entry) => {
            const target = path.join(directory, entry.name);
            if (entry.isDirectory()) return listSourceModules(target);
            return /\.(?:js|jsx)$/.test(entry.name) ? [target] : [];
        }),
    );
    return nested.flat();
}

/** Remove comentários, que são documentação interna e não chegam ao browser. */
function stripComments(source) {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
}

test("nenhuma página publica linguagem operacional conhecida", async () => {
    const modules = await listSourceModules(SOURCE_ROOT);

    for (const modulePath of modules) {
        const source = stripComments(await readFile(modulePath, "utf8"));
        for (const pattern of FORBIDDEN_PUBLIC_COPY) {
            assert.doesNotMatch(
                source,
                pattern,
                `${path.relative(SOURCE_ROOT, modulePath)} contém ${pattern}`,
            );
        }
    }
});

test("checkout preserva transparência sobre a ausência de cobrança", async () => {
    const source = await readFile(
        path.join(SOURCE_ROOT, "services/simulatedCheckout.js"),
        "utf8",
    );
    assert.match(source, /Nenhum valor será cobrado/);
    assert.match(source, /sem criar um movimento financeiro/);
});
