/**
 * Testes comportamentais dos contratos puros da conta e do perfil.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
    CLIENT_ACCOUNT_LINKS,
    resolvePostLoginPath,
} from "../src/services/accountNavigation.js";
import {
    createEmptyProfileForm,
    PROFILE_LOAD_STATES,
    profileFormToPayload,
    profileToForm,
    resolveProfileWriteMethod,
} from "../src/services/profileForm.js";

test("o cliente entra na visão geral da conta por omissão", () => {
    assert.equal(resolvePostLoginPath({ role: "cliente" }), "/conta");
});

test("administrador e consultor mantêm os respetivos destinos", () => {
    assert.equal(resolvePostLoginPath({ role: "administrador" }), "/admin");
    assert.equal(
        resolvePostLoginPath({ role: "consultor" }),
        "/consultoria/revisoes",
    );
});

test("preserva uma rota interna pedida e rejeita destinos externos", () => {
    assert.equal(
        resolvePostLoginPath({ role: "cliente" }, "/compras"),
        "/compras",
    );
    assert.equal(
        resolvePostLoginPath({ role: "cliente" }, "//example.test"),
        "/conta",
    );
    assert.equal(
        resolvePostLoginPath({ role: "cliente" }, "https://example.test"),
        "/conta",
    );
});

test("recusa redirects internos incompatíveis com a role autenticada", () => {
    assert.equal(
        resolvePostLoginPath(
            { role: "consultor" },
            "/conta/privacidade-biometrica",
        ),
        "/consultoria/revisoes",
    );
    assert.equal(
        resolvePostLoginPath({ role: "cliente" }, "/admin/utilizadores"),
        "/conta",
    );
    assert.equal(
        resolvePostLoginPath(
            { role: "administrador" },
            "/consultoria/revisoes-ia",
        ),
        "/consultoria/revisoes-ia",
    );
    assert.equal(
        resolvePostLoginPath(
            { role: "consultor" },
            "/consulta/recomendacoes",
        ),
        "/consultoria/revisoes",
    );
    assert.equal(
        resolvePostLoginPath(
            { role: "consultor" },
            "/produtos/produto-publico",
        ),
        "/produtos/produto-publico",
    );
    assert.equal(
        resolvePostLoginPath(
            { role: "consultor" },
            "/produtos/produto-publico/avaliar",
        ),
        "/consultoria/revisoes",
    );
});

test("o menu pessoal expõe todas as rotas funcionais exigidas", () => {
    const destinations = new Set(CLIENT_ACCOUNT_LINKS.map((link) => link.to));

    for (const expectedPath of [
        "/conta/preferencias",
        "/conta/privacidade-biometrica",
        "/compras",
        "/notificacoes",
        "/pele/historico",
        "/pele/evolucao",
        "/pele/comparacao",
        "/rotina/alertas",
    ]) {
        assert.equal(destinations.has(expectedPath), true, expectedPath);
    }
});

test("um perfil inexistente usa POST e um perfil existente usa PUT", () => {
    assert.equal(
        resolveProfileWriteMethod(PROFILE_LOAD_STATES.MISSING),
        "POST",
    );
    assert.equal(
        resolveProfileWriteMethod(PROFILE_LOAD_STATES.EXISTING),
        "PUT",
    );
    assert.throws(() => resolveProfileWriteMethod(PROFILE_LOAD_STATES.LOADING));
    assert.throws(() => resolveProfileWriteMethod(PROFILE_LOAD_STATES.ERROR));
});

test("converte o perfil entre a API e o formulário sem campos técnicos", () => {
    const form = profileToForm({
        id: "technical-id-not-forwarded",
        userId: "technical-user-not-forwarded",
        nome: "Marta",
        idade: 19,
        tipoDePele: "mista",
        genero: "feminino",
        objetivos: ["hidratar", "proteger"],
        allergies: ["perfume"],
        avoidIngredients: [],
        lightMedicalRestrictions: ["retinol"],
    });
    const payload = profileFormToPayload(form);

    assert.deepEqual(payload, {
        nome: "Marta",
        idade: 19,
        tipoDePele: "mista",
        genero: "feminino",
        objetivos: ["hidratar", "proteger"],
        allergies: ["perfume"],
        avoidIngredients: [],
        lightMedicalRestrictions: ["retinol"],
    });
    assert.equal("id" in payload, false);
    assert.equal("userId" in payload, false);
});

test("cada abertura do formulário recebe um estado independente", () => {
    const first = createEmptyProfileForm();
    const second = createEmptyProfileForm();

    first.nome = "Alterado";
    assert.equal(second.nome, "");
});
