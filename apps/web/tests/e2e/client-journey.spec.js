/**
 * Viagem E2E do cliente até à revisão humana e pagamento apenas simulado.
 */
import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { expectNoSeriousOrCriticalAxeViolations } from "./helpers/accessibility.js";
import {
    browserApiRequest,
    loginAs,
    logoutViaUi,
} from "./helpers/auth.js";
import { isMutationReferenceProject } from "./helpers/environment.js";

const FACE_FIXTURE_PATH = fileURLToPath(
    new URL("../fixtures/synthetic-face-frontal.jpg", import.meta.url),
);

/**
 * Responde ao guião versionado devolvido pela API sem usar IDs técnicos.
 *
 * @param {import("@playwright/test").Page} page - Página na consulta guiada.
 * @returns {Promise<void>} Redirect automático para o relatório canónico.
 */
async function completeGuidedConsultation(page) {
    const createReportButton = page.getByRole("button", {
        name: "Gerar o meu relatório",
    });
    const questionHeading = page.locator(".questionnaire-card h2");

    // O guião atual pode chegar a 17 perguntas (maquilhagem principal, dois
    // objetivos secundários e reservas). O limite apenas protege o teste de
    // um loop remoto incoerente; a saída normal continua a ser o botão final.
    for (let questionIndex = 0; questionIndex < 17; questionIndex += 1) {
        await expect(questionHeading.or(createReportButton)).toBeVisible({
            timeout: 20_000,
        });
        if (await createReportButton.isVisible()) break;

        const questionCard = page
            .locator(".questionnaire-card")
            .filter({ has: page.locator("h2") })
            .last();
        const previousQuestion = await questionCard.getByRole("heading").innerText();
        const radios = questionCard.getByRole("radio");
        const checkboxes = questionCard.getByRole("checkbox");
        const number = questionCard.locator('input[type="number"]');
        const textArea = questionCard.locator("textarea");

        if ((await radios.count()) > 0) {
            await radios.first().check();
        } else if ((await checkboxes.count()) > 0) {
            await checkboxes.first().check();
        } else if ((await number.count()) > 0) {
            await number.fill("50");
        } else if ((await textArea.count()) > 0) {
            const isRestrictionQuestion =
                /alerg|restriç|ingrediente(?:s)?\s+(?:a\s+)?evitar/i.test(
                    previousQuestion,
                );
            await textArea.fill(
                isRestrictionQuestion
                    ? "Não tenho alergias conhecidas"
                    : "Rotina cosmética simples para o teste E2E.",
            );
        } else {
            throw new Error("Tipo de pergunta canónica sem controlo suportado");
        }

        await questionCard
            .getByRole("button", { name: "Guardar e continuar" })
            .click();
        await expect
            .poll(
                async () => {
                    if (await createReportButton.isVisible()) return true;
                    if (!(await questionHeading.isVisible())) return false;
                    return (await questionHeading.innerText()) !== previousQuestion;
                },
                { timeout: 20_000 },
            )
            .toBe(true);
    }

    await expect(createReportButton).toBeVisible();
    await page.getByRole("button", { name: "Rever todas as respostas" }).click();
    const reviewDialog = page.getByRole("dialog", { name: "Respostas guardadas" });
    await expect(reviewDialog).toBeVisible();
    await reviewDialog.getByRole("button", { name: /^Editar:/ }).first().click();
    const editCard = page.locator(".questionnaire-card");
    await expect(editCard.getByText("A editar resposta")).toBeVisible();
    await editCard.getByRole("button", { name: "Guardar alteração" }).click();
    await expect(reviewDialog).toBeVisible();
    await reviewDialog.getByRole("button", { name: "Fechar revisão" }).click();
    await expectNoSeriousOrCriticalAxeViolations(page);
    await createReportButton.click();
    const retryButton = page.getByRole("button", { name: "Tentar novamente" });
    const reportOutcome = await Promise.race([
        page
            .waitForURL(/\/consulta\/relatorios\/[^/?#]+$/, {
                timeout: 30_000,
            })
            .then(() => "report"),
        retryButton
            .waitFor({ state: "visible", timeout: 30_000 })
            .then(() => "failed"),
    ]);
    if (reportOutcome === "failed") {
        const current = await browserApiRequest(
            page,
            "/api/ai-consultation/sessions/current",
        );
        const session = current.body?.session ?? current.body?.data?.session;
        const errorCode = session?.operation?.error?.code ?? "unknown";
        throw new Error(`Geração de relatório E2E falhou: ${errorCode}`);
    }
}

test("cliente percorre perfil, checkout, consulta, privacidade e revisão", async ({
    page,
}, testInfo) => {
    test.skip(
        !isMutationReferenceProject(testInfo.project.name),
        "A viagem destrutiva corre uma vez; os restantes engines cobrem UI pública",
    );
    test.setTimeout(180_000);

    await loginAs(page, "cliente", testInfo.project.name);

    // Home e catálogo mantêm um regresso visível à área da role.
    await page.goto("/");
    await expect(
        page
            .getByRole("navigation", { name: "Navegação principal" })
            .getByRole("link", { name: "Área do cliente" }),
    ).toBeVisible();
    await page.goto("/produtos");
    await expect(
        page
            .getByRole("navigation", { name: "Navegação Orélle" })
            .getByRole("link", { name: "Área do cliente" }),
    ).toBeVisible();

    // Perfil ausente (404) -> POST -> edição recorrente por PUT.
    await page.goto("/conta/perfil");
    const createProfile = page.getByRole("form", { name: "Criar perfil" });
    await expect(createProfile).toBeVisible();
    await createProfile.getByLabel("Nome").fill("Cliente E2E");
    await createProfile.getByLabel("Idade").fill("30");
    await createProfile.getByLabel("Tipo de pele").selectOption("mista");
    await createProfile
        .getByLabel("Objetivos")
        .fill("hidratação, equilíbrio");
    await createProfile.getByRole("button", { name: "Criar perfil" }).click();
    await expect(page.getByRole("status")).toContainText(
        "Perfil criado com sucesso.",
    );

    const editProfile = page.getByRole("form", { name: "Editar perfil" });
    await expect(editProfile).toBeVisible();
    await editProfile.getByLabel("Nome").fill("Cliente E2E atualizado");
    await editProfile
        .getByRole("button", { name: "Guardar alterações" })
        .click();
    await expect(page.getByRole("status")).toContainText(
        "Perfil atualizado com sucesso.",
    );
    await expectNoSeriousOrCriticalAxeViolations(page);

    // Catálogo -> carrinho -> checkout pendente -> pagamento simulado -> replay.
    await page.goto("/produtos");
    await expect(
        page.getByRole("heading", { name: "Catálogo Orélle", level: 1 }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Adicionar" }).first().click();
    await expect(page.getByText("Produto adicionado ao carrinho.")).toBeVisible();
    await page.goto("/carrinho");
    await expect(page).toHaveURL(/\/produtos$/);
    const cartDrawer = page.getByRole("dialog", { name: "Carrinho" });
    await expect(cartDrawer).toBeVisible();
    await expect(cartDrawer.getByRole("button", { name: "Fechar" })).toBeFocused();
    await expect(cartDrawer.getByRole("listitem").first()).toBeVisible();
    await expectNoSeriousOrCriticalAxeViolations(page);
    await cartDrawer
        .getByRole("button", { name: "Continuar para confirmação" })
        .click();
    await expect(page).toHaveURL(/\/checkout$/);

    const checkoutResponsePromise = page.waitForResponse(
        (response) =>
            response.request().method() === "POST" &&
            new URL(response.url()).pathname === "/api/orders/checkout",
    );
    await page
        .getByRole("button", { name: "Criar resumo da encomenda" })
        .click();
    const checkoutResponse = await checkoutResponsePromise;
    expect(checkoutResponse.status()).toBe(201);
    await expect(
        page.getByText(
            "Nenhum valor será cobrado. A confirmação regista a encomenda sem criar um movimento financeiro.",
        ),
    ).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "Resumo da encomenda", level: 2 }),
    ).toBeVisible();

    const simulateResponsePromise = page.waitForResponse(
        (response) =>
            response.request().method() === "POST" &&
            /\/api\/orders\/[^/]+\/payments\/simulate$/.test(
                new URL(response.url()).pathname,
            ),
    );
    await page.getByRole("button", { name: "Confirmar encomenda" }).click();
    const simulateResponse = await simulateResponsePromise;
    expect(simulateResponse.status()).toBe(200);
    const paidPayload = await simulateResponse.json();
    const replayHeaders = await simulateResponse.request().allHeaders();
    const idempotencyKey = replayHeaders["idempotency-key"];
    const csrfToken = replayHeaders["x-csrf-token"];
    expect(typeof idempotencyKey).toBe("string");
    expect(typeof csrfToken).toBe("string");
    await expect(
        page.getByText(
            "Encomenda confirmada. Não foi efetuada qualquer cobrança.",
        ),
    ).toBeVisible();

    const simulationPath = new URL(simulateResponse.url()).pathname;
    const replay = await browserApiRequest(page, simulationPath, {
        method: "POST",
        headers: {
            "Idempotency-Key": idempotencyKey,
            "X-CSRF-Token": csrfToken,
        },
    });
    expect(replay.status).toBe(200);
    expect(replay.body?.order?.id).toBe(paidPayload.order.id);
    expect(replay.body?.order?.payment?.simulationReference).toBe(
        paidPayload.order.payment.simulationReference,
    );
    await expectNoSeriousOrCriticalAxeViolations(page);
    await page.goto("/carrinho");
    await expect(page).toHaveURL(/\/produtos$/);
    await expect(
        page.getByRole("dialog", { name: "Carrinho" }).getByText("O carrinho está vazio"),
    ).toBeVisible();

    // O modelo MediaPipe é best-effort: a falha local não pode bloquear o
    // transporte OpenAI de teste nem desativar os gates nativos/servidor.
    await page.route("**/mediapipe/models/**", (route) => route.abort());
    await page.goto("/consulta/nova");
    await page
        .getByRole("radio", { name: /Acne e imperfeições/ })
        .check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page
        .getByRole("checkbox", {
            name: /Autorizo a avaliação cosmética/,
        })
        .check();
    const providerConsent = page.getByRole("checkbox", {
        name: /Autorizo o processamento pela OpenAI/,
    });
    if (await providerConsent.isVisible()) await providerConsent.check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page
        .getByLabel("Fotografia frontal")
        .setInputFiles(FACE_FIXTURE_PATH);
    await page
        .getByLabel("Fotografia de perfil")
        .setInputFiles(FACE_FIXTURE_PATH);
    await expect(page.getByText("Pronta para envio.")).toHaveCount(2);
    await expect(
        page.getByText(/verificação automática/i).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Iniciar análise" }).click();

    const warningAcknowledgement = page.getByRole("checkbox", {
        name: /Compreendo e quero continuar/,
    });
    const startOutcome = await Promise.race([
        page
            .waitForURL(/\/consulta\/ativa(?:[/?#]|$)/, { timeout: 30_000 })
            .then(() => "active"),
        warningAcknowledgement
            .waitFor({ state: "visible", timeout: 30_000 })
            .then(() => "warning"),
    ]);
    if (startOutcome === "warning") {
        await warningAcknowledgement.check();
        await page
            .getByRole("button", { name: "Continuar mesmo assim" })
            .click();
        await expect(page).toHaveURL(/\/consulta\/ativa(?:[/?#]|$)/);
    }

    await completeGuidedConsultation(page);
    const reportUrl = page.url();
    await expect(
        page.getByRole("heading", { name: "Queres uma segunda opinião?", level: 2 }),
    ).toBeVisible();
    await page
        .getByRole("checkbox", {
            name: /Permitir acesso temporário às fotografias/,
        })
        .check();
    await page.getByRole("button", { name: "Pedir revisão humana" }).click();
    await expect(
        page.getByRole("heading", { name: "Revisão pedida", level: 2 }),
    ).toBeVisible();
    await expectNoSeriousOrCriticalAxeViolations(page);

    // O pedido aparece na fila canónica e só o consultor o pode decidir.
    await page.goto("/");
    await expect(
        page.getByRole("button", { name: "Terminar sessão" }),
    ).toBeVisible();
    await logoutViaUi(page, { expectedDestination: "public" });
    await loginAs(page, "consultor", testInfo.project.name);
    const pendingReview = page
        .locator(".consultation-review-list")
        .getByRole("button")
        .first();
    await expect(pendingReview).toBeVisible();
    await pendingReview.click();
    await expect(
        page.getByRole("heading", { name: "Detalhe da revisão", level: 2 }),
    ).toBeVisible();
    await page.getByLabel("Decisão").selectOption("approved");
    await page
        .getByLabel("Nota para o cliente")
        .fill("Recomendação revista por consultor no cenário E2E.");
    await page
        .getByLabel("Nota interna")
        .fill("Validação automática isolada.");
    await page.getByRole("button", { name: "Guardar decisão" }).click();
    await expect(
        page.getByText("Revisão aprovada e retirada da fila."),
    ).toBeVisible();
    await expectNoSeriousOrCriticalAxeViolations(page);

    // A versão aprovada volta a rascunho, é finalizada e desbloqueada pelo
    // cliente sem sair do fluxo same-origin nem abrir um gateway real.
    await page.goto("/produtos");
    await expect(
        page.getByRole("button", { name: "Terminar sessão" }),
    ).toBeVisible();
    await logoutViaUi(page, { expectedDestination: "public" });
    await loginAs(page, "cliente", testInfo.project.name);
    await page.goto(reportUrl);
    await page.getByRole("button", { name: "Finalizar o meu plano" }).click();
    await expect(
        page.getByRole("heading", { name: "Simulação de pagamento", level: 2 }),
    ).toBeVisible();
    const reportPaymentPromise = page.waitForResponse(
        (response) =>
            response.request().method() === "POST" &&
            /\/api\/face-reports\/[^/]+\/unlock\/simulate-payment$/.test(
                new URL(response.url()).pathname,
            ),
    );
    await page
        .getByRole("button", {
            name: /^(?:Simular pagamento e desbloquear|Desbloquear relatório)$/,
        })
        .click();
    const reportPaymentResponse = await reportPaymentPromise;
    expect(reportPaymentResponse.status()).toBe(200);
    const reportPaymentHeaders = await reportPaymentResponse.request().allHeaders();
    expect(reportPaymentHeaders["idempotency-key"]).toMatch(/^report\.[^.]+\./);
    await expect(
        page.getByText("Próxima ação recomendada", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/consulta\/relatorios\/[^/?#]+\/resumo(?:[/?#]|$)/);
    await expectNoSeriousOrCriticalAxeViolations(page);

    // O pedido de privacidade é criado apenas depois de terminar a consulta,
    // porque o pedido instala corretamente uma write barrier sobre fotos e reports.
    await page.goto("/conta/privacidade-biometrica");
    await expect(
        page.getByRole("heading", {
            name: "Privacidade e dados faciais",
            level: 1,
        }),
    ).toBeVisible();
    await page
        .getByLabel("Motivo opcional")
        .fill("Pedido E2E pendente sem execução destrutiva.");
    let privacyCreateCount = 0;
    const countPrivacyCreate = (request) => {
        if (
            request.method() === "POST" &&
            new URL(request.url()).pathname === "/api/me/privacy-requests"
        ) {
            privacyCreateCount += 1;
        }
    };
    page.on("request", countPrivacyCreate);
    const privacyCreateResponse = page.waitForResponse(
        (response) =>
            response.request().method() === "POST" &&
            new URL(response.url()).pathname === "/api/me/privacy-requests",
    );
    await page
        .getByRole("button", { name: "Criar pedido de privacidade" })
        .evaluate((button) => {
            button.click();
            button.click();
        });
    await privacyCreateResponse;
    expect(privacyCreateCount).toBe(1);
    page.off("request", countPrivacyCreate);
    await expect(page.getByText(/Pedido registado/)).toBeVisible();
    await page
        .getByText("Zona de risco — eliminar conta", { exact: true })
        .click();
    await expect(
        page.getByRole("button", { name: "Eliminar a minha conta" }),
    ).toBeDisabled();
    await expectNoSeriousOrCriticalAxeViolations(page);
});
