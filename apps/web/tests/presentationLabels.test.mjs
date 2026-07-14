/** Contratos unitários dos labels públicos fail-closed. */
import assert from "node:assert/strict";
import test from "node:test";
import {
    getBiometricAuditEventLabel,
    getBiometricAuditOutcomeLabel,
    getBiometricAuditResourceLabel,
    getOrderStatusLabel,
    getPrivacyActionLabel,
    getPrivacyResourceLabel,
    getPrivacyScopeLabel,
    getPrivacyStatusLabel,
    getProductCoverageLabel,
    getProductFinishLabel,
    getProductReviewStatusLabel,
    getProductTextureLabel,
    getProductUndertoneLabel,
    getProductUvaLabel,
    getSkinTypeLabel,
    getUserRoleLabel,
    getVoucherStatusLabel,
} from "../src/services/presentationLabels.js";

test("traduz tipos de acesso conhecidos sem refletir valores técnicos", () => {
    assert.equal(getUserRoleLabel("cliente"), "Cliente");
    assert.equal(getUserRoleLabel("consultor"), "Consultor");
    assert.equal(getUserRoleLabel("administrador"), "Administrador");
    assert.equal(
        getUserRoleLabel("root_internal"),
        "Perfil de acesso indisponível",
    );
});

test("traduz tipos de pele e mantém unknown neutro", () => {
    assert.deepEqual(
        ["normal", "seca", "oleosa", "mista", "sensivel", "nao_conclusivo"].map(
            getSkinTypeLabel,
        ),
        ["Normal", "Seca", "Oleosa", "Mista", "Sensível", "Não conclusivo"],
    );
    assert.equal(
        getSkinTypeLabel("future_skin_type"),
        "Tipo de pele indisponível",
    );
});

test("traduz atributos comerciais sem refletir enums desconhecidos", () => {
    assert.equal(getProductTextureLabel("gel_cream"), "Gel-creme");
    assert.equal(getProductFinishLabel("matte"), "Mate");
    assert.equal(getProductCoverageLabel("full"), "Alta");
    assert.equal(getProductUndertoneLabel("olive"), "Oliva");
    assert.equal(getProductUvaLabel("broad_spectrum"), "Amplo espectro");

    assert.equal(getProductTextureLabel("future_texture"), "Textura indisponível");
    assert.equal(getProductFinishLabel("future_finish"), "Acabamento indisponível");
    assert.equal(getProductCoverageLabel("future_coverage"), "Cobertura indisponível");
    assert.equal(getProductUndertoneLabel("future_tone"), "Subtom indisponível");
    assert.equal(getProductUvaLabel("future_uva"), "Proteção UVA indisponível");
});

test("traduz campos de privacidade com fallbacks específicos", () => {
    assert.equal(getPrivacyScopeLabel("biometric"), "Dados biométricos");
    assert.equal(getPrivacyActionLabel("delete"), "Eliminar dados biométricos");
    assert.equal(getPrivacyStatusLabel("failed"), "Falhou — pode ser reprocessado");
    assert.equal(getPrivacyResourceLabel("photos"), "Fotografias faciais");

    assert.equal(getPrivacyScopeLabel("future_scope"), "Âmbito indisponível");
    assert.equal(getPrivacyActionLabel("future_action"), "Ação indisponível");
    assert.equal(getPrivacyStatusLabel("future_status"), "Estado indisponível");
    assert.equal(getPrivacyResourceLabel("future_resource"), "Recurso indisponível");
});

test("traduz evento, desfecho e recurso de auditoria sem heurísticas", () => {
    assert.equal(getBiometricAuditEventLabel("view_audit"), "Consulta da auditoria");
    assert.equal(getBiometricAuditOutcomeLabel("allowed"), "Permitido");
    assert.equal(getBiometricAuditResourceLabel("report"), "Relatório cosmético");

    assert.equal(getBiometricAuditEventLabel("future_event"), "Evento indisponível");
    assert.equal(
        getBiometricAuditOutcomeLabel("future_outcome"),
        "Resultado indisponível",
    );
    assert.equal(
        getBiometricAuditResourceLabel("future_resource"),
        "Recurso auditado indisponível",
    );
});

test("traduz estados de avaliação, encomenda e voucher com fallback neutro", () => {
    assert.equal(getProductReviewStatusLabel("published"), "Publicada");
    assert.equal(getProductReviewStatusLabel("hidden"), "Oculta");
    assert.equal(getOrderStatusLabel("pendente"), "Pendente");
    assert.equal(getOrderStatusLabel("entregue"), "Entregue");
    assert.equal(getVoucherStatusLabel("active"), "Disponível");
    assert.equal(getVoucherStatusLabel("used"), "Utilizado");

    for (const formatter of [
        getProductReviewStatusLabel,
        getOrderStatusLabel,
        getVoucherStatusLabel,
    ]) {
        assert.equal(formatter("internal_future_value"), "Estado indisponível");
    }
});
