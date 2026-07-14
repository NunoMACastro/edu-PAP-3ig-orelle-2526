import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getRouteTitle } from "../src/services/routePresentation.js";

test("produz títulos humanos sem IDs técnicos", () => {
    assert.equal(getRouteTitle("/"), "Início");
    assert.equal(getRouteTitle("/checkout"), "Confirmar encomenda");
    assert.equal(getRouteTitle("/conta/editar"), "Editar perfil");
    assert.equal(
        getRouteTitle("/produtos/507f1f77bcf86cd799439011"),
        "Detalhe do produto",
    );
    assert.equal(
        getRouteTitle("/pele/antes-depois/507f1f77bcf86cd799439011"),
        "Consulta",
    );
    assert.equal(getRouteTitle("/rota-inexistente"), "Página não encontrada");
});

test("todas as rotas montadas têm título humano explícito", async () => {
    const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
    const mountedPaths = [
        ...source.matchAll(/\bpath="([^"]+)"/g),
    ]
        .map((match) => match[1])
        .filter((path) => path !== "*");

    assert.ok(mountedPaths.length > 30, "inventário de rotas inesperadamente curto");
    for (const path of mountedPaths) {
        const representativePath = path
            .replace(/:[^/]+/g, "valor-publico")
            .replace(/\/\*$/, "");
        assert.notEqual(
            getRouteTitle(representativePath),
            "Página não encontrada",
            `rota sem título explícito: ${path}`,
        );
    }
});

test("o router usa lazy loading, título, foco e skip-link", async () => {
    const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

    assert.match(source, /React\.lazy/);
    assert.match(source, /React\.Suspense/);
    assert.match(source, /document\.title/);
    assert.match(source, /main\.focus\(\{ preventScroll: true \}\)/);
    assert.match(source, /href="#main-content"/);
    assert.doesNotMatch(source, /^import \{ .*Page \} from "\.\/pages\//m);
});

test("páginas montadas dentro do shell não criam outro main", async () => {
    const nestedPages = [
        "LoginPage.jsx",
        "RegisterPage.jsx",
        "PreferencesPage.jsx",
        "AdminProductCreatePage.jsx",
    ];

    for (const filename of nestedPages) {
        const source = await readFile(
            new URL(`../src/pages/${filename}`, import.meta.url),
            "utf8",
        );
        assert.doesNotMatch(source, /<\/?main\b/);
    }
});
