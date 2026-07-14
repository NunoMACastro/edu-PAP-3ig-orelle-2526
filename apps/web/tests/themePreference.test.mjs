/** Contrato de persistência estritamente visual do tema. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
    normalizeTheme,
    THEME_STORAGE_KEY,
} from "../src/hooks/useThemePreference.js";

const source = await readFile(
    new URL("../src/hooks/useThemePreference.js", import.meta.url),
    "utf8",
);

test("tema usa uma única chave allowlisted e normaliza valores inesperados", () => {
    assert.equal(THEME_STORAGE_KEY, "orelle:theme");
    assert.equal(normalizeTheme("dark"), "dark");
    assert.equal(normalizeTheme("danger"), "light");
    assert.match(source, /localStorage\?\.setItem\(THEME_STORAGE_KEY, theme\)/);
    assert.doesNotMatch(source, /sessionStorage|JSON\.stringify\(user/i);
});
