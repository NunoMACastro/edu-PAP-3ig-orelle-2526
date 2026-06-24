import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const distAssetsDir = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const MAX_MAIN_JS_ASSET_BYTES = 350_000;

if (!existsSync(distAssetsDir)) {
    throw new Error("Executa primeiro: npm --prefix apps/web run build");
}

const assets = readdirSync(distAssetsDir)
    .map((name) => {
        const fullPath = join(distAssetsDir, name);
        return { name, bytes: statSync(fullPath).size };
    })
    .sort((left, right) => right.bytes - left.bytes);

const jsAssets = assets.filter((asset) => asset.name.endsWith(".js"));
const oversizedJsAssets = jsAssets.filter(
    (asset) => asset.bytes > MAX_MAIN_JS_ASSET_BYTES,
);

// O script mede ficheiros gerados pelo build e não lê sessão, fotografias ou dados pessoais.
console.table(assets);

if (oversizedJsAssets.length > 0) {
    throw new Error(
        `Assets JS acima do limite derivado de ${MAX_MAIN_JS_ASSET_BYTES} bytes: ${oversizedJsAssets
            .map((asset) => asset.name)
            .join(", ")}`,
    );
}

console.log("BK-MF6-02 asset checks passed");