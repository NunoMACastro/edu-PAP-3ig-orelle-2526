/**
 * Contrato de supply-chain e self-hosting do preflight MediaPipe.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const WEB_ROOT = process.cwd();
const MODEL_PATH = path.join(
    WEB_ROOT,
    "public/mediapipe/models/face_landmarker.task",
);
const EXPECTED_MODEL_SHA256 =
    "64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff";
const WASM_FILES = [
    "vision_wasm_internal.js",
    "vision_wasm_internal.wasm",
    "vision_wasm_module_internal.js",
    "vision_wasm_module_internal.wasm",
    "vision_wasm_nosimd_internal.js",
    "vision_wasm_nosimd_internal.wasm",
];

test("fixa o package e preserva modelo/WASM exclusivamente locais", async () => {
    const manifest = JSON.parse(
        await readFile(path.join(WEB_ROOT, "package.json"), "utf8"),
    );
    assert.equal(manifest.dependencies["@mediapipe/tasks-vision"], "0.10.35");

    await Promise.all([
        access(MODEL_PATH),
        ...WASM_FILES.map((file) =>
            access(path.join(WEB_ROOT, "public/mediapipe/wasm", file)),
        ),
    ]);
    const digest = createHash("sha256")
        .update(await readFile(MODEL_PATH))
        .digest("hex");
    assert.equal(digest, EXPECTED_MODEL_SHA256);

    const source = await readFile(
        path.join(
            WEB_ROOT,
            "src/features/consultation/mediapipeFacePreflight.js",
        ),
        "utf8",
    );
    assert.match(source, /import\("@mediapipe\/tasks-vision"\)/);
    assert.match(source, /\/mediapipe\/wasm/);
    assert.match(source, /\/mediapipe\/models\/face_landmarker\.task/);
    assert.doesNotMatch(source, /https?:\/\//i);
});
