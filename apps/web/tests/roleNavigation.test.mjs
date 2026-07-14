/** Contrato de regresso visível à área de cada role. */
import assert from "node:assert/strict";
import test from "node:test";
import { getRoleHomeDestination } from "../src/services/roleNavigation.js";

test("cada role conhecida regressa à sua área e roles desconhecidas falham fechadas", () => {
    assert.deepEqual(getRoleHomeDestination("cliente"), {
        to: "/conta",
        label: "Área do cliente",
        shortLabel: "Conta",
        icon: "user",
    });
    assert.equal(
        getRoleHomeDestination("consultor")?.to,
        "/consultoria/revisoes",
    );
    assert.equal(getRoleHomeDestination("administrador")?.to, "/admin");
    assert.equal(getRoleHomeDestination("aluno"), null);
    assert.equal(getRoleHomeDestination(undefined), null);
});
