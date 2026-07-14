/** Contratos estruturais de copy e labels nas superfícies principais. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [home, layouts, consultation, login, dashboard, checkout, reviews, details, roleNavigation] =
    await Promise.all(
        [
            "../src/components/OrelleMockupHome.jsx",
            "../src/components/AppLayouts.jsx",
            "../src/features/consultation/ConsultationDashboardPage.jsx",
            "../src/pages/LoginPage.jsx",
            "../src/pages/AdminDashboardPage.jsx",
            "../src/pages/CheckoutPage.jsx",
            "../src/pages/AdminReviewsPage.jsx",
            "../src/pages/ProductDetailsPage.jsx",
            "../src/services/roleAppNavigation.js",
        ].map((path) => readFile(new URL(path, import.meta.url), "utf8")),
    );

test("marca e headings públicos usam a copy PT-PT canónica", () => {
    for (const source of [home, layouts]) assert.match(source, /Orélle/);
    assert.match(layouts, /showContextHeader=\{false\}/);
    assert.match(consultation, /Consulta cosmética/);
    assert.match(login, /<h1>Iniciar sessão<\/h1>/);
    assert.match(dashboard, /title="Painel administrativo"/);
    assert.match(checkout, /title="Confirmar encomenda"/);
    assert.match(details, /aria-label="Breadcrumb"/);
    assert.match(details, /Entrar para comprar/);
    assert.match(home, /<h3>Aparência<\/h3>/);
    assert.match(home, /Descobre o que combina contigo/);
    assert.match(home, /Beleza, cuidado e escolhas pensadas para ti/);
    assert.doesNotMatch(home, /O hub identifica/);

    for (const source of [home, layouts, consultation]) {
        assert.doesNotMatch(source, />\s*Orelle\s*</);
    }
});

test("home promove maquilhagem e cuidados de pele sem interação falsa", () => {
    assert.match(home, /Beleza que parte de ti/);
    assert.match(home, /aria-label="Benefícios da consulta"/);
    assert.match(home, /Define os teus objetivos/);
    assert.match(home, /Conversa ao teu ritmo/);
    assert.match(home, /Recebe o teu relatório/);
    assert.match(home, /Descobrir a minha consulta/);
    assert.match(home, /orelle-makeup-original-960\.webp/);
    assert.match(home, /orelle-makeup-preview-960\.webp/);
    assert.match(home, /Compreender a tua pele muda tudo/);
    assert.match(home, /aria-label="Conversa sobre cuidados de pele"/);
    assert.match(home, /aria-label="Perguntas e respostas da consulta"/);
    assert.match(home, /Foco da consulta/);
    assert.match(home, /Começar a minha consulta/);
    assert.equal(
        (home.match(/Orientação cosmética — não substitui avaliação médica\./g) ?? [])
            .length,
        1,
    );
    assert.equal(
        (home.match(/Imagem gerada por IA — o resultado real poderá variar\./g) ?? [])
            .length,
        1,
    );
    assert.doesNotMatch(
        home,
        /OpenAI|Exemplo ilustrativo|Exemplo publicitário|mockup-chat-(?:transcript|message)|Mensagem da IA/i,
    );
    assert.doesNotMatch(
        home,
        /fluxo atual|limitações visíveis no fluxo|perfil de acesso|ligados à API|estado confirmado pelo servidor/i,
    );

    const dialogue = home.match(
        /<article\s+className="mockup-skin-dialogue"[\s\S]*?<\/article>/,
    )?.[0];
    assert.ok(dialogue);
    assert.doesNotMatch(dialogue, /<form\b|<input\b|<button\b|onSubmit=|setInterval|typing/i);
});

test("cards de valor usam ícones reconhecíveis em vez de siglas", () => {
    for (const icon of ["sparkles", "face", "review", "bag"]) {
        assert.match(home, new RegExp(`icon: "${icon}"`));
    }

    assert.doesNotMatch(home, /marker:\s*"(?:IA|SK|RH|PD)"/);
    assert.doesNotMatch(home, />\s*(?:SK|RH|PD)\s*</);
    assert.match(home, /className="mockup-feature-card__icon"[\s\S]*?aria-hidden="true"/);
});

test("home, avaliações e pagamento nunca refletem enums técnicos", () => {
    assert.match(home, /getUserRoleLabel\(user\.role\)/);
    assert.doesNotMatch(home, /\{user\.email\} · \{user\.role\}/);
    assert.match(reviews, /getProductReviewStatusLabel\(review\.status\)/);
    assert.doesNotMatch(reviews, /\{review\.rating\}\/5 · \{review\.status\}/);
    assert.match(checkout, /getVoucherStatusLabel\(voucher\.status\)/);
    assert.match(checkout, /getOrderStatusLabel\(order\.status\)/);
    assert.doesNotMatch(checkout, /Estado da encomenda: \{order\.status\}/);
});

test("o atalho flutuante de IA é exclusivo do cliente", () => {
    assert.match(home, /isClient && consultationLink/);
    assert.match(
        layouts,
        /role === USER_ROLES\.CLIENTE &&\s+consultation\.available &&\s+!location\.pathname\.startsWith\("\/consulta"\)/,
    );
    assert.match(layouts, /<RoleAppShell role=\{USER_ROLES\.CONSULTOR\}/);
    assert.match(layouts, /<RoleAppShell role=\{USER_ROLES\.ADMINISTRADOR\}/);
});

test("todas as shells autenticadas expõem logout direto no header", () => {
    assert.match(layouts, /className="role-topbar__logout"/);
    assert.match(layouts, /aria-label="Terminar sessão"/);
    assert.match(layouts, /onClick=\{\(\) => endSession\("current"\)\}/);
    assert.match(layouts, /<RoleAppShell role=\{USER_ROLES\.CLIENTE\}/);
    assert.match(layouts, /<RoleAppShell role=\{USER_ROLES\.CONSULTOR\}/);
    assert.match(layouts, /<RoleAppShell role=\{USER_ROLES\.ADMINISTRADOR\}/);
    assert.match(layouts, /user \? <TopbarLogoutButton \/> : null/);
    assert.match(home, /user \? <TopbarLogoutButton \/> : null/);
});

test("consultor não recebe operações administrativas de privacidade", () => {
    const consultantLinks = roleNavigation.match(
        /consultor: Object\.freeze\(\{[\s\S]*?administrador:/,
    )?.[0];
    assert.ok(consultantLinks);
    assert.match(consultantLinks, /\/consultoria\/revisoes/);
    assert.doesNotMatch(consultantLinks, /privacidade|\/admin\//i);
});
