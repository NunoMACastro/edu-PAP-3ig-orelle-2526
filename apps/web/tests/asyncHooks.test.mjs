/**
 * Contratos puros e estruturais dos hooks assíncronos partilhados pela G5.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
    ASYNC_STATUS,
    collectionResourceStatus,
    createAsyncGenerationGate,
    isAsyncAbort,
    normalizeAsyncError,
} from "../src/hooks/asyncOperation.js";

const [resourceHook, actionHook] = await Promise.all([
    readFile(new URL("../src/hooks/useAsyncResource.js", import.meta.url), "utf8"),
    readFile(new URL("../src/hooks/useAsyncAction.js", import.meta.url), "utf8"),
]);

const [dashboardPage, reviewsPage, notificationsPage] = await Promise.all([
    readFile(
        new URL("../src/pages/AdminDashboardPage.jsx", import.meta.url),
        "utf8",
    ),
    readFile(
        new URL("../src/pages/AdminReviewsPage.jsx", import.meta.url),
        "utf8",
    ),
    readFile(
        new URL("../src/pages/NotificationsPage.jsx", import.meta.url),
        "utf8",
    ),
]);

const resilientPageNames = [
    "SkinComparisonPage",
    "SkinHistoryPage",
];
const resilientPages = await Promise.all(
    resilientPageNames.map((pageName) =>
        readFile(
            new URL(`../src/pages/${pageName}.jsx`, import.meta.url),
            "utf8",
        ),
    ),
);

test("a geração mais recente invalida resultados anteriores", () => {
    const gate = createAsyncGenerationGate();
    const first = gate.next();

    assert.equal(gate.isCurrent(first), true);

    const second = gate.next();
    assert.equal(gate.isCurrent(first), false);
    assert.equal(gate.isCurrent(second), true);

    gate.invalidate();
    assert.equal(gate.isCurrent(second), false);
    assert.equal(gate.current(), 3);
});

test("cancelamentos são reconhecidos sem esconder erros reais", () => {
    const controller = new AbortController();
    assert.equal(isAsyncAbort({ code: "REQUEST_ABORTED" }), true);
    assert.equal(isAsyncAbort({ name: "AbortError" }), true);
    assert.equal(isAsyncAbort(new Error("rede"), controller.signal), false);

    controller.abort();
    assert.equal(isAsyncAbort(new Error("cancelado"), controller.signal), true);
});

test("estados de coleção e erros rejeitados são normalizados", () => {
    assert.equal(collectionResourceStatus([]), ASYNC_STATUS.EMPTY);
    assert.equal(collectionResourceStatus([{}]), ASYNC_STATUS.SUCCESS);
    assert.equal(normalizeAsyncError("Falha conhecida").message, "Falha conhecida");
    assert.equal(
        normalizeAsyncError({ private: "não expor" }).message,
        "A operação não pôde ser concluída.",
    );
});

test("os hooks cancelam rede, bloqueiam stale updates e preservam estado", () => {
    for (const source of [resourceHook, actionHook]) {
        assert.match(source, /new AbortController\(\)/);
        assert.match(source, /generationRef\.current\.isCurrent\(generation\)/);
        assert.match(source, /activeControllerRef\.current\?\.abort\(\)/);
        assert.match(source, /return \{ ok: false, stale/);
    }

    assert.match(
        resourceHook,
        /setState\(\(current\) => \(\{[\s\S]*?\.\.\.current,[\s\S]*?status: ASYNC_STATUS\.ERROR/,
    );
    assert.match(actionHook, /result: initialResult/);
});

test("as páginas separam leitura e mutação sem apagar conteúdo carregado", () => {
    assert.match(dashboardPage, /useAsyncResource/);
    assert.match(dashboardPage, /\{stats \? \(/);
    assert.match(reviewsPage, /useAsyncResource/);
    assert.match(reviewsPage, /useAsyncAction/);
    assert.match(reviewsPage, /reviews\.length > 0/);
    assert.match(notificationsPage, /useAsyncResource/);
    assert.match(notificationsPage, /useAsyncAction/);
    assert.match(notificationsPage, /notifications\.length > 0/);

    for (const source of [dashboardPage, reviewsPage, notificationsPage]) {
        assert.match(source, /signal/);
        assert.doesNotMatch(source, /setStatus\("error"\)/);
    }
});

test("comparação e histórico de pele usam operações canceláveis", () => {
    for (const [index, source] of resilientPages.entries()) {
        assert.match(
            source,
            /useAsync(?:Resource|Action)/,
            `${resilientPageNames[index]} deve usar um hook assíncrono partilhado`,
        );
        assert.match(
            source,
            /signal/,
            `${resilientPageNames[index]} deve propagar AbortSignal`,
        );
        assert.match(
            source,
            /<ErrorSummary/,
            `${resilientPageNames[index]} deve separar feedback de erro`,
        );
        assert.doesNotMatch(source, /setStatus\("error"\)/);
    }

    assert.match(resilientPages[0], /\.result/);
    assert.match(resilientPages[1], /\.data/);
});
