/** Contratos puros da experiência autenticada redesenhada. */
import assert from "node:assert/strict";
import test from "node:test";
import { resolveClientNextStep } from "../src/services/clientDashboard.js";
import {
    doesRoleNavigationItemMatch,
    getActiveRoleNavigationGroupId,
    getRoleNavigation,
    isRoleNavigationItemActive,
} from "../src/services/roleAppNavigation.js";

test("agrupa a navegação das três roles sem misturar governação no cliente", () => {
    const client = getRoleNavigation("cliente");
    const admin = getRoleNavigation("administrador");
    const consultant = getRoleNavigation("consultor");
    assert.equal(client.presentation, "accordion");
    assert.deepEqual(client.groups.map((group) => group.label), ["Início", "Consulta", "Pele e rotina", "Compras"]);
    assert.equal(client.groups[0].direct, true);
    assert.deepEqual(client.accountItems.map((item) => item.label), ["Perfil", "Preferências", "Privacidade", "Notificações"]);
    assert.deepEqual(client.utilityItems.map((item) => item.label), []);
    assert.deepEqual(
        client.groups.flatMap((group) => group.items).map((item) => item.label),
        [
            "Início",
            "Resumo da consulta",
            "Nova consulta",
            "Consulta atual",
            "Histórico de consultas",
            "A minha pele",
            "Histórico da pele",
            "Evolução",
            "Comparação",
            "Rotina",
            "Alertas",
            "Produtos",
            "Carrinho",
            "Encomendas",
        ],
    );
    assert.ok(admin.groups.some((group) => group.label === "Definições"));
    assert.equal(admin.presentation, undefined);
    assert.deepEqual(consultant.groups.flatMap((group) => group.items).map((item) => item.to), ["/consultoria/revisoes"]);
    assert.equal(client.mobile.length + 1, 4);
    assert.equal(admin.mobile.length + 1, 4);
    assert.equal(consultant.mobile.length + 1, 2);
});

test("destaca o pai mais específico em checkout, relatório e novo produto", () => {
    const client = getRoleNavigation("cliente");
    const cart = client.groups
        .flatMap((group) => group.items)
        .find((item) => item.action === "cart");
    const consultation = client.groups.flatMap((group) => group.items).find((item) => item.to === "/consulta");
    assert.equal(isRoleNavigationItemActive(client, cart, "/checkout"), true);
    assert.equal(isRoleNavigationItemActive(client, consultation, "/consulta/relatorios/123"), true);

    const admin = getRoleNavigation("administrador");
    const products = admin.groups.flatMap((group) => group.items).find((item) => item.to === "/admin/produtos");
    assert.equal(isRoleNavigationItemActive(admin, products, "/admin/produtos/novo"), true);
});

test("resolve o grupo atual sem confundir início, conta e utilitários", () => {
    const client = getRoleNavigation("cliente");
    const home = client.groups[0].items[0];
    const profile = client.accountItems.find((item) => item.to === "/conta/perfil");

    assert.equal(getActiveRoleNavigationGroupId(client, "/consulta/ativa"), "consulta");
    assert.equal(getActiveRoleNavigationGroupId(client, "/rotina"), "pele-rotina");
    assert.equal(getActiveRoleNavigationGroupId(client, "/compras"), "compras");
    assert.equal(getActiveRoleNavigationGroupId(client, "/conta/perfil"), null);
    assert.equal(getActiveRoleNavigationGroupId(client, "/carrinho"), "compras");
    assert.equal(isRoleNavigationItemActive(client, home, "/conta"), true);
    assert.equal(isRoleNavigationItemActive(client, home, "/conta/perfil"), false);
    assert.equal(isRoleNavigationItemActive(client, profile, "/conta/perfil"), true);
    assert.equal(doesRoleNavigationItemMatch(client.mobile[0], "/conta/perfil"), false);
    assert.equal(doesRoleNavigationItemMatch(client.mobile[1], "/consulta/ativa"), true);
});

test("prioriza perfil, consulta ativa, nova consulta e catálogo", () => {
    assert.equal(resolveClientNextStep({ profile: null, profileMissing: true, session: null, consultationAvailable: true }).to, "/conta/perfil");
    assert.equal(resolveClientNextStep({ profile: {}, profileMissing: false, session: { id: "s1" }, consultationAvailable: true }).to, "/consulta/ativa");
    assert.equal(resolveClientNextStep({ profile: {}, profileMissing: false, session: null, consultationAvailable: true }).to, "/consulta/nova");
    assert.equal(resolveClientNextStep({ profile: {}, profileMissing: false, session: null, consultationAvailable: false }).to, "/produtos");
});
