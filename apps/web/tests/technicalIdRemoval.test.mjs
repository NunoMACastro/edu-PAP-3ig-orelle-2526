/** Contratos G5 para impedir inputs e copy com identificadores técnicos. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [stockPage, categoriesPage, productCurationPage, productSearchPage] = await Promise.all([
    readFile(new URL("../src/pages/StockAdminPage.jsx", import.meta.url), "utf8"),
    readFile(
        new URL("../src/pages/AdminCategoriesPage.jsx", import.meta.url),
        "utf8",
    ),
    readFile(new URL("../src/pages/AdminProductsPage.jsx", import.meta.url), "utf8"),
    readFile(
        new URL("../src/pages/ProductSearchPage.jsx", import.meta.url),
        "utf8",
    ),
]);

const [preferencesPage, productReviewPage] = await Promise.all([
    readFile(new URL("../src/pages/PreferencesPage.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/ProductReviewPage.jsx", import.meta.url), "utf8"),
]);

test("stock e categorias escolhem produtos do catálogo sem pedir IDs", () => {
    assert.match(stockPage, /listProductsForAiCuration/);
    assert.match(categoriesPage, /apiRequest\("\/catalog\/products"/);
    for (const source of [stockPage, categoriesPage]) {
        assert.doesNotMatch(source, /ID do produto|ObjectId|placeholder=["'][^"']*ID/i);
    }
    assert.match(stockPage, /Ajustar stock de \$\{product\.name\}/);
    assert.match(stockPage, /admin-inventory-row/);
    assert.match(categoriesPage, /<select/);
    assert.doesNotMatch(categoriesPage, /<main[\s>]/);
    assert.match(categoriesPage, /selectedCategoryIds\.length === 0/);
    assert.match(categoriesPage, /<fieldset/);
    assert.match(categoriesPage, /<legend>Categorias<\/legend>/);
    assert.match(categoriesPage, /const categoryIds = \[\.\.\.selectedCategoryIds\]/);
});

test("curadoria escolhe produtos por nome e não pede identificadores", () => {
    assert.match(productCurationPage, /Pesquisa avançada de produtos/);
    assert.match(productCurationPage, /Editar curadoria de \$\{product\.name\}/);
    assert.match(productCurationPage, /Editar stock de \$\{product\.name\}/);
    assert.match(productCurationPage, /Editar categorias de \$\{product\.name\}/);
    assert.doesNotMatch(
        productCurationPage,
        /ObjectId|ID do produto|Identificador da variante|placeholder=["'][^"']*ID/i,
    );
});

test("preferências e feedback de avaliação não apresentam IDs", () => {
    assert.match(preferencesPage, /\/catalog\/products/);
    assert.match(preferencesPage, /type="checkbox"/);
    assert.doesNotMatch(preferencesPage, /IDs? de produtos/i);
    assert.doesNotMatch(preferencesPage, /productIdsText/);
    assert.doesNotMatch(productReviewPage, /Avaliação registada com ID/);
    assert.match(productReviewPage, /Avaliação registada com sucesso/);
});

test("o catálogo público escolhe categorias e preços em unidades humanas", () => {
    assert.match(productSearchPage, /apiRequest\("\/catalog\/categories"/);
    assert.match(productSearchPage, /Todas as categorias/);
    assert.match(productSearchPage, /Preço mínimo \(EUR\)/);
    assert.match(productSearchPage, /Math\.round\(euros \* 100\)/);
    assert.doesNotMatch(productSearchPage, /Categoria ID|Preço mínimo em cêntimos/);
    assert.doesNotMatch(productSearchPage, /setStatus\("error"\);[\s\S]{0,80}addToCart/);
});
