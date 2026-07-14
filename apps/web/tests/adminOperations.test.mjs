/** Contratos G5 das operações administrativas sem IDs técnicos manuais. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [ordersPage, usersPage, notificationsPage] = await Promise.all([
    readFile(new URL("../src/pages/AdminOrdersPage.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/AdminUsersPage.jsx", import.meta.url), "utf8"),
    readFile(
        new URL("../src/pages/AdminNotificationsPage.jsx", import.meta.url),
        "utf8",
    ),
]);
const [appSource, routePresentationSource, roleNavigationSource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/services/routePresentation.js", import.meta.url), "utf8"),
    readFile(new URL("../src/services/roleAppNavigation.js", import.meta.url), "utf8"),
]);
const confirmDialogSource = await readFile(
    new URL("../src/components/ConfirmDialog.jsx", import.meta.url),
    "utf8",
);

test("operações administrativas têm rota, menu e título visíveis", () => {
    assert.match(appSource, /AdminOrdersPage/);
    assert.match(appSource, /path="\/admin\/encomendas"/);
    assert.match(roleNavigationSource, /item\("\/admin\/encomendas"/);
    assert.match(routePresentationSource, /admin\\\/encomendas\$\/, "Encomendas"/);
});

test("encomendas são carregadas e avançadas por seleção, sem pedir IDs", () => {
    assert.match(ordersPage, /apiRequest\("\/admin\/orders"/);
    assert.match(ordersPage, /`\/admin\/orders\/\$\{order\.id\}\/status`/);
    assert.match(ordersPage, /body: JSON\.stringify\(\{ status: order\.nextStatus \}\)/);
    assert.match(ordersPage, /pagamento exclusivamente simulado/i);
    assert.match(ordersPage, /actionByOrder/);
    assert.match(ordersPage, /aria-busy=\{busy\}/);
    assert.doesNotMatch(ordersPage, /ObjectId|ID da encomenda|Introduz.*ID/i);
});

test("utilizadores permitem alterar role com estado isolado por linha", () => {
    assert.match(usersPage, /`\/admin\/users\/\$\{userId\}\/role`/);
    assert.match(usersPage, /<option value="cliente">\s*Cliente\s*<\/option>/);
    assert.match(usersPage, /<option value="consultor">\s*Consultor\s*<\/option>/);
    assert.match(usersPage, /<option value="administrador">/);
    assert.match(usersPage, /actionByUser/);
    assert.match(usersPage, /setUserAction\(userId/);
    assert.match(usersPage, /user\.accountStatus !== "deleted"/);
    assert.match(usersPage, /Desativar conta/);
    assert.doesNotMatch(usersPage, />\s*Eliminar conta\s*</);
    assert.match(usersPage, /<ConfirmDialog/);
    assert.match(usersPage, /confirmationText="DESATIVAR"/);
    assert.match(usersPage, /apiRequest\(`\/admin\/users\/\$\{userId\}`/);
});

test("diálogo destrutivo prende/restaura foco e exige confirmação escrita", () => {
    assert.match(confirmDialogSource, /role="dialog"/);
    assert.match(confirmDialogSource, /aria-modal="true"/);
    assert.match(confirmDialogSource, /FOCUSABLE_SELECTOR/);
    assert.match(confirmDialogSource, /previousFocusRef\.current\?\.focus/);
    assert.match(confirmDialogSource, /typedConfirmation === confirmationText/);
    assert.match(confirmDialogSource, /event\.key === "Escape"/);
});

test("campanhas escolhem a role e alertas de rotina têm execução explícita", () => {
    assert.match(notificationsPage, /name="targetRole"/);
    assert.match(notificationsPage, /\/admin\/notifications\/campaigns/);
    assert.match(notificationsPage, /\/admin\/routine-alerts\/run/);
    assert.match(notificationsPage, /Executar alertas devidos/);
    assert.match(notificationsPage, /campaignStatus/);
    assert.match(notificationsPage, /routineStatus/);
});
