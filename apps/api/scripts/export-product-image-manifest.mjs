/**
 * Exporta o manifesto canónico para geração das imagens dos produtos.
 *
 * O ficheiro resultante fica na raiz de `real_dev` para poder ser usado sem
 * iniciar a API nem ligar à base de dados. Toda a informação deriva das seeds,
 * evitando listas manuais que possam ficar desatualizadas.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildProductImageGenerationManifest } from "../src/scripts/seed-products.js";

const OUTPUT_PATH = fileURLToPath(
    new URL("../../product-image-generation-manifest.json", import.meta.url),
);

/**
 * Gera o JSON formatado e informa apenas o caminho e o total exportado.
 *
 * @returns {Promise<void>} Termina depois de o manifesto ser persistido.
 */
async function exportProductImageManifest() {
    const products = buildProductImageGenerationManifest();
    const document = {
        schemaVersion: 1,
        generatedFrom: "real_dev/api/src/scripts/seed-products.js",
        productCount: products.length,
        products,
    };

    await writeFile(
        OUTPUT_PATH,
        `${JSON.stringify(document, null, 2)}\n`,
        "utf8",
    );
    console.log(`Manifesto de imagens exportado: ${products.length} produtos`);
    console.log(OUTPUT_PATH);
}

await exportProductImageManifest();
