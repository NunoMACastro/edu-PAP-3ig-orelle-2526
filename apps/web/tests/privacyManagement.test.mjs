/**
 * Testes focais dos contratos web de privacidade e eliminação de conta.
 *
 * As regras puras são exercitadas comportamentalmente e estes contratos
 * estruturais complementam as integrações React cobertas em Vitest/jsdom.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
    ACCOUNT_ERASURE_CONFIRMATION,
    canRetryPrivacyRequest,
    getPrivacyDecisionConfirmation,
    PRIVACY_ENDPOINTS,
    PRIVACY_RETRY_CONFIRMATION,
    validateAccountErasureForm,
    validatePrivacyDecisionDraft,
} from "../src/services/privacyManagement.js";

const CLIENT_PAGE_URL = new URL(
    "../src/pages/BiometricDataRequestPage.jsx",
    import.meta.url,
);
const ADMIN_PAGE_URL = new URL(
    "../src/pages/BiometricDataRequestsAdminPage.jsx",
    import.meta.url,
);
const ADMIN_USERS_URL = new URL("../src/pages/AdminUsersPage.jsx", import.meta.url);
const AUTH_CONTEXT_URL = new URL("../src/context/AuthContext.jsx", import.meta.url);
const LOGIN_PAGE_URL = new URL("../src/pages/LoginPage.jsx", import.meta.url);
const APP_URL = new URL("../src/App.jsx", import.meta.url);
const LAYOUTS_URL = new URL("../src/components/AppLayouts.jsx", import.meta.url);

test("usa exclusivamente os endpoints canónicos do workflow de privacidade", async () => {
    assert.deepEqual(PRIVACY_ENDPOINTS, {
        myRequests: "/me/privacy-requests",
        adminRequests: "/admin/privacy-requests",
        eraseAccount: "/me/account",
    });

    const [clientPage, adminPage] = await Promise.all([
        readFile(CLIENT_PAGE_URL, "utf8"),
        readFile(ADMIN_PAGE_URL, "utf8"),
    ]);

    assert.doesNotMatch(clientPage, /biometric-data-requests/);
    assert.doesNotMatch(adminPage, /biometric-data-requests/);
    assert.match(clientPage, /PRIVACY_ENDPOINTS\.myRequests/);
    assert.match(clientPage, /PRIVACY_ENDPOINTS\.eraseAccount/);
    assert.match(adminPage, /PRIVACY_ENDPOINTS\.adminRequests/);
    assert.match(adminPage, /method: "PATCH"/);
    assert.match(adminPage, /\/retry`/);
});

test("eliminação da conta exige password entre 8 e 72 bytes e ELIMINAR literal", () => {
    assert.equal(ACCOUNT_ERASURE_CONFIRMATION, "ELIMINAR");
    assert.equal(
        validateAccountErasureForm({
            password: "PasswordSegura123",
            confirmation: "ELIMINAR",
        }).isValid,
        true,
    );

    for (const confirmation of ["Eliminar", " ELIMINAR", "ELIMINAR ", ""]) {
        const result = validateAccountErasureForm({
            password: "PasswordSegura123",
            confirmation,
        });
        assert.equal(result.isValid, false);
        assert.ok(result.errors.confirmation);
    }

    assert.equal(
        validateAccountErasureForm({ password: "1234567", confirmation: "ELIMINAR" })
            .isValid,
        false,
    );
    assert.equal(
        validateAccountErasureForm({ password: "€".repeat(25), confirmation: "ELIMINAR" })
            .isValid,
        false,
        "25 símbolos euro ocupam 75 bytes UTF-8",
    );
});

test("decisão administrativa requer confirmação correspondente e motivo material na rejeição", () => {
    assert.equal(getPrivacyDecisionConfirmation("approved"), "APROVAR");
    assert.equal(getPrivacyDecisionConfirmation("rejected"), "REJEITAR");

    assert.equal(
        validatePrivacyDecisionDraft({
            decision: "approved",
            decisionReason: "",
            confirmation: "APROVAR",
        }).isValid,
        true,
    );
    assert.equal(
        validatePrivacyDecisionDraft({
            decision: "rejected",
            decisionReason: "não",
            confirmation: "REJEITAR",
        }).isValid,
        false,
    );
    assert.equal(
        validatePrivacyDecisionDraft({
            decision: "rejected",
            decisionReason: "Pedido incompatível com os recursos indicados.",
            confirmation: "REJEITAR",
        }).isValid,
        true,
    );
    assert.equal(
        validatePrivacyDecisionDraft({
            decision: "approved",
            confirmation: " APROVAR",
        }).isValid,
        false,
    );
});

test("retry só é apresentado para failed e exige REPROCESSAR literal", () => {
    assert.equal(PRIVACY_RETRY_CONFIRMATION, "REPROCESSAR");
    assert.equal(canRetryPrivacyRequest({ status: "failed" }), true);
    for (const status of ["pending", "processing", "completed", "rejected"]) {
        assert.equal(canRetryPrivacyRequest({ status }), false);
    }
});

test("a UI seleciona pedidos da lista, não pede IDs e conserva os payloads minimizados", async () => {
    const [clientPage, adminPage] = await Promise.all([
        readFile(CLIENT_PAGE_URL, "utf8"),
        readFile(ADMIN_PAGE_URL, "utf8"),
    ]);

    assert.match(adminPage, /setSelectedRequestId\(request\.id\)/);
    assert.doesNotMatch(adminPage, /name=["'](?:requestId|requesterId|userId)["']/);
    assert.doesNotMatch(clientPage, /name=["'](?:requestId|requesterId|userId)["']/);
    assert.doesNotMatch(clientPage, /JSON\.stringify\(\{[^}]*userId/s);
    assert.match(clientPage, /action: form\.action/);
    assert.match(clientPage, /resources: form\.resources/);
    assert.match(adminPage, /decision: decisionDraft\.decision/);
    assert.match(adminPage, /decisionReason: decisionDraft\.decisionReason/);
});

test("conta deleted é terminal na UI administrativa", async () => {
    const source = await readFile(ADMIN_USERS_URL, "utf8");

    assert.match(source, /user\.accountStatus !== "deleted"/);
    assert.match(source, /esta\s+conta não pode ser reativada/);
    assert.match(source, /Eliminação terminal pelo titular/);
    assert.match(source, /confirmationText="DESATIVAR"/);
    assert.doesNotMatch(source, />\s*Eliminar conta\s*</);
});

test("rotas, navegação e sessão local suportam os novos fluxos", async () => {
    const [app, authContext, clientPage, loginPage, roleNavigation] = await Promise.all([
        readFile(APP_URL, "utf8"),
        readFile(AUTH_CONTEXT_URL, "utf8"),
        readFile(CLIENT_PAGE_URL, "utf8"),
        readFile(LOGIN_PAGE_URL, "utf8"),
        readFile(new URL("../src/services/roleAppNavigation.js", import.meta.url), "utf8"),
    ]);

    assert.match(app, /path="\/admin\/pedidos-privacidade"/);
    assert.match(roleNavigation, /item\("\/admin\/pedidos-privacidade"/);
    assert.match(authContext, /const forgetSession = useCallback/);
    assert.match(authContext, /const logoutAll = useCallback/);
    assert.match(authContext, /apiRequest\("\/auth\/logout-all"/);
    assert.match(authContext, /clearCsrfTokenCache\(\)/);
    assert.match(authContext, /postSessionNotice/);
    assert.match(clientPage, /forgetSession\(data\.message\)/);
    assert.match(loginPage, /clearPostSessionNotice\(\)/);
    assert.match(
        loginPage,
        /location\.state\?\.accountDeletedMessage \?\? postSessionNotice/,
    );
});

test("ações destrutivas e logout usam latches síncronos contra duplo clique", async () => {
    const [clientPage, adminPage, loginPage, layouts] = await Promise.all([
        readFile(CLIENT_PAGE_URL, "utf8"),
        readFile(ADMIN_PAGE_URL, "utf8"),
        readFile(LOGIN_PAGE_URL, "utf8"),
        readFile(LAYOUTS_URL, "utf8"),
    ]);

    assert.match(clientPage, /createInFlightRef = useRef\(false\)/);
    assert.match(clientPage, /erasureInFlightRef = useRef\(false\)/);
    assert.match(adminPage, /actionInFlightRef = useRef\(false\)/);
    assert.match(loginPage, /sessionActionInFlightRef = useRef\(false\)/);
    assert.match(layouts, /sessionActionInFlightRef = useRef\(false\)/);

    for (const source of [clientPage, adminPage, loginPage, layouts]) {
        assert.match(source, /\.current\) return/);
        assert.match(source, /\.current = true/);
        assert.match(source, /\.current = false/);
    }
});
