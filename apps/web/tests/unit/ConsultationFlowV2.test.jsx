/** Testes comportamentais das novas superfícies de consulta. */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActiveConsultationPage } from "../../src/features/consultation/ActiveConsultationPage.jsx";
import { ConsultationReportPage } from "../../src/features/consultation/ConsultationReportPage.jsx";
import { ConsultationReviewsPage } from "../../src/features/consultation/ConsultationReviewsPage.jsx";
import { NewConsultationPage } from "../../src/features/consultation/NewConsultationPage.jsx";

const apiMock = vi.hoisted(() => ({
    getCurrentConsultationSession: vi.fn(),
    answerConsultationQuestion: vi.fn(),
    editConsultationAnswer: vi.fn(),
    cancelConsultationSession: vi.fn(),
    retryConsultationSession: vi.fn(),
    submitConsultationSession: vi.fn(),
    getConsultationCapabilities: vi.fn(),
    getConsultationGoals: vi.fn(),
    getFaceConsent: vi.fn(),
    acceptFaceConsent: vi.fn(),
    createConsultationSession: vi.fn(),
    startConsultationAnalysis: vi.fn(),
    uploadFacePhotos: vi.fn(),
    downloadOwnedConsultationPhoto: vi.fn(),
    getConsultationReport: vi.fn(),
    finalizeConsultationReport: vi.fn(),
    requestConsultationReportReview: vi.fn(),
    unlockConsultationReport: vi.fn(),
    withdrawConsultationReportReview: vi.fn(),
    createMakeupSimulation: vi.fn(),
    getMakeupSimulation: vi.fn(),
    downloadMakeupSimulationImage: vi.fn(),
    downloadAuthenticatedReportImage: vi.fn(),
    revokeConsultationReviewPhotoAccess: vi.fn(),
    revokeMakeupSimulationConsent: vi.fn(),
    createCosmeticVisualization: vi.fn(),
    getCosmeticVisualization: vi.fn(),
    downloadCosmeticVisualizationImage: vi.fn(),
    revokeCosmeticVisualizationConsent: vi.fn(),
    submitCosmeticVisualizationFeedback: vi.fn(),
    submitConsultationRecommendationFeedback: vi.fn(),
    listConsultationReviews: vi.fn(),
    getConsultationReview: vi.fn(),
    decideConsultationReview: vi.fn(),
    downloadConsultationReviewPhoto: vi.fn(),
}));

const cartMock = vi.hoisted(() => ({
    addLines: vi.fn(),
    useCart: vi.fn(),
}));

const photoMock = vi.hoisted(() => ({
    inspectPhotoFile: vi.fn(),
    compressImageForUpload: vi.fn(),
}));

vi.mock("../../src/features/consultation/consultationApi.js", () => ({
    ...apiMock,
    createPaymentIdempotencyKey: () => "report-test-idempotency-key",
}));

vi.mock("../../src/context/CartContext.jsx", () => ({
    useCart: cartMock.useCart,
}));

vi.mock("../../src/features/consultation/photoPreflight.js", () => ({
    inspectPhotoFile: photoMock.inspectPhotoFile,
}));

vi.mock("../../src/utils/imageOptimization.js", () => ({
    compressImageForUpload: photoMock.compressImageForUpload,
}));

const GOALS = [
    ["acne_imperfections", "Acne e imperfeições"],
    ["hydration_barrier", "Hidratação e barreira"],
    ["oil_control", "Controlo de oleosidade"],
    ["sensitivity_redness", "Sensibilidade e vermelhidão"],
    ["spots_tone_luminosity", "Manchas, tom e luminosidade"],
    ["sun_protection", "Proteção solar"],
    ["makeup", "Maquilhagem"],
].map(([code, label]) => ({ code, label, description: `${label}.` }));

beforeEach(() => {
    vi.clearAllMocks();
    cartMock.useCart.mockReturnValue({
        addLines: cartMock.addLines,
        actionStatus: "idle",
    });
    apiMock.getConsultationCapabilities.mockResolvedValue({ available: true });
    apiMock.getConsultationGoals.mockResolvedValue({
        selection: { primary: 1, secondaryMax: 2 },
        questions: { min: 10, max: 17 },
        goals: GOALS,
    });
    apiMock.getFaceConsent.mockResolvedValue({
        consent: null,
        providerConsentRequirement: { required: false },
    });
    apiMock.getCurrentConsultationSession.mockResolvedValue(null);
    apiMock.acceptFaceConsent.mockResolvedValue({ accepted: true });
    photoMock.inspectPhotoFile.mockResolvedValue({
        ok: true,
        errors: [],
        warnings: [],
    });
    photoMock.compressImageForUpload.mockImplementation(async (file) => file);
});

afterEach(() => {
    vi.useRealTimers();
});

describe("ActiveConsultationPage", () => {
    it("encaminha avisos fotográficos para a revisão do par", async () => {
        apiMock.getCurrentConsultationSession.mockResolvedValue({
            id: "session-photo-review",
            flowState: "collecting_photos",
            photos: { requiresWarningConfirmation: true },
        });

        render(
            <MemoryRouter initialEntries={["/consulta/ativa"]}>
                <Routes>
                    <Route path="/consulta/ativa" element={<ActiveConsultationPage />} />
                    <Route path="/consulta/nova" element={<p>Revisão das fotografias</p>} />
                </Routes>
            </MemoryRouter>,
        );

        expect(await screen.findByText("Revisão das fotografias")).toBeVisible();
    });

    it("mostra uma pergunta de cada vez e envia a resposta com revision", async () => {
        const session = {
            id: "session-public",
            flowState: "asking_questions",
            canCancel: true,
            conversation: {
                answeredCount: 1,
                totalQuestions: 8,
                currentIndex: 2,
                maxQuestions: 17,
                answers: [
                    {
                        slotCode: "comfort_level",
                        label: "Como sentes a pele?",
                        displayValue: "Confortável",
                        value: 5,
                        type: "scale",
                        min: 1,
                        max: 5,
                        editable: true,
                    },
                ],
                turns: [
                    {
                        id: "turn-question-1",
                        kind: "question",
                        question: { label: "Como sentes a pele?" },
                    },
                    {
                        id: "turn-answer-1",
                        kind: "answer",
                        value: "Confortável",
                    },
                ],
                currentQuestion: {
                    id: "frequency",
                    revision: 3,
                    type: "single_select",
                    label: "Com que frequência?",
                    options: [{ value: "daily", label: "Todos os dias" }],
                },
            },
        };
        apiMock.getCurrentConsultationSession.mockResolvedValue(session);
        apiMock.answerConsultationQuestion.mockResolvedValue({
            ...session,
            flowState: "ready_for_report",
            conversation: { ...session.conversation, currentQuestion: null },
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <ActiveConsultationPage />
            </MemoryRouter>,
        );

        expect(await screen.findByText("Com que frequência?")).toBeVisible();
        expect(screen.getAllByText("Pergunta 2 de 8")).toHaveLength(2);
        await user.click(screen.getByRole("button", { name: "Rever respostas" }));
        expect(screen.getByText("Como sentes a pele?")).toBeVisible();
        expect(screen.getByText("Confortável")).toBeVisible();
        await user.click(screen.getByRole("button", { name: "Fechar revisão" }));
        await user.click(screen.getByRole("radio", { name: "Todos os dias" }));
        await user.click(screen.getByRole("button", { name: "Guardar e continuar" }));

        await waitFor(() => {
            expect(apiMock.answerConsultationQuestion).toHaveBeenCalledWith(
                "session-public",
                {
                    questionId: "frequency",
                    revision: 3,
                    value: "daily",
                },
                { signal: expect.any(AbortSignal) },
            );
        });
    });

    it("confirma restrições através do perfil sem aceitar texto livre", async () => {
        const session = {
            id: "session-profile-restrictions",
            flowState: "asking_questions",
            revision: 4,
            conversation: {
                answeredCount: 3,
                totalQuestions: 10,
                currentIndex: 4,
                answers: [],
                currentQuestion: {
                    id: "4:allergies_restrictions",
                    revision: 4,
                    slotCode: "allergies_restrictions",
                    type: "single_select",
                    label: "As restrições do teu perfil estão atualizadas?",
                    options: [
                        {
                            value: "profile_restrictions_confirmed",
                            label: "Sim, o meu perfil está atualizado",
                        },
                        {
                            value: "profile_restrictions_needs_update",
                            label: "Não, preciso de atualizar o perfil",
                        },
                    ],
                },
            },
        };
        apiMock.getCurrentConsultationSession.mockResolvedValue(session);
        apiMock.answerConsultationQuestion.mockRejectedValue(
            Object.assign(
                new Error(
                    "Atualiza as alergias e restrições no perfil antes de continuar.",
                ),
                {
                    status: 409,
                    details: {
                        code: "PROFILE_RESTRICTIONS_UPDATE_REQUIRED",
                    },
                },
            ),
        );
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <ActiveConsultationPage />
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole("radio", {
                name: "Sim, o meu perfil está atualizado",
            }),
        ).toBeVisible();
        expect(
            screen.queryByRole("textbox"),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("link", {
                name: "Consultar ou atualizar o perfil",
            }),
        ).toHaveAttribute("href", "/conta/perfil");

        await user.click(
            screen.getByRole("radio", {
                name: "Não, preciso de atualizar o perfil",
            }),
        );
        await user.click(
            screen.getByRole("button", { name: "Guardar e continuar" }),
        );

        expect(
            await screen.findByRole("link", {
                name: "Atualizar agora as restrições do perfil",
            }),
        ).toHaveAttribute("href", "/conta/perfil");
    });

    it("explica uma falha legacy de perfil e não propõe um retry inútil", async () => {
        apiMock.getCurrentConsultationSession.mockResolvedValue({
            id: "session-profile-failed",
            flowState: "failed_retryable",
            revision: 8,
            operation: {
                status: "failed_terminal",
                error: {
                    code: "PROFILE_RESTRICTIONS_UPDATE_REQUIRED",
                    retryable: false,
                },
            },
            conversation: {
                answeredCount: 10,
                totalQuestions: 10,
                currentIndex: 10,
                currentQuestion: null,
                answers: [
                    {
                        slotCode: "allergies_restrictions",
                        label: "As restrições do teu perfil estão atualizadas?",
                        displayValue: "Resposta legacy",
                        value: "Evito perfume intenso",
                        type: "single_select",
                        editable: true,
                    },
                ],
            },
        });

        render(
            <MemoryRouter>
                <ActiveConsultationPage />
            </MemoryRouter>,
        );

        expect(
            await screen.findByText(
                "Atualiza as restrições antes de continuar",
            ),
        ).toBeVisible();
        expect(
            screen.getByRole("link", { name: "Atualizar perfil" }),
        ).toHaveAttribute("href", "/conta/perfil");
        expect(
            screen.queryByRole("button", { name: "Tentar novamente" }),
        ).not.toBeInTheDocument();
    });

    it("apresenta a profundidade como quatro escolhas simples com recomendação", async () => {
        const session = {
            id: "session-makeup-depth",
            flowState: "asking_questions",
            revision: 7,
            conversation: {
                answeredCount: 6,
                totalQuestions: 16,
                currentIndex: 7,
                answers: [],
                currentQuestion: {
                    id: "7:makeup_plan_depth",
                    revision: 7,
                    slotCode: "makeup_plan_depth",
                    type: "single_select",
                    label: "Quão elaborado queres o teu plano de maquilhagem?",
                    options: [
                        { value: "essential", label: "Essencial" },
                        { value: "balanced", label: "Equilibrado" },
                        { value: "elaborate", label: "Elaborado" },
                        { value: "custom", label: "Personalizar" },
                    ],
                    presentation: {
                        control: "descriptive_cards",
                        helper: "A Orélle transforma esta escolha num plano coerente.",
                        recommendedOption: "balanced",
                        optionDescriptions: {
                            essential: "Poucos passos e aplicação rápida.",
                            balanced: "Look completo sem camadas desnecessárias.",
                            elaborate: "Mais preparação, definição e detalhe.",
                            custom: "Escolher manualmente os elementos.",
                        },
                    },
                },
            },
        };
        apiMock.getCurrentConsultationSession.mockResolvedValue(session);
        apiMock.answerConsultationQuestion.mockResolvedValue(session);
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <ActiveConsultationPage />
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole("radio", { name: /Equilibrado/ }),
        ).toBeVisible();
        expect(screen.getByText("Recomendado")).toBeVisible();
        expect(
            screen.getByText("Look completo sem camadas desnecessárias."),
        ).toBeVisible();
        await user.click(screen.getByRole("radio", { name: /Equilibrado/ }));
        await user.click(
            screen.getByRole("button", { name: "Guardar e continuar" }),
        );

        await waitFor(() =>
            expect(apiMock.answerConsultationQuestion).toHaveBeenCalledWith(
                "session-makeup-depth",
                {
                    questionId: "7:makeup_plan_depth",
                    revision: 7,
                    value: "balanced",
                },
                { signal: expect.any(AbortSignal) },
            ),
        );
    });

    it("agrupa a personalização avançada e troca automaticamente bases alternativas", async () => {
        apiMock.getCurrentConsultationSession.mockResolvedValue({
            id: "session-makeup-custom",
            flowState: "asking_questions",
            conversation: {
                answeredCount: 15,
                totalQuestions: 17,
                currentIndex: 16,
                answers: [],
                currentQuestion: {
                    id: "16:makeup_functions",
                    revision: 16,
                    slotCode: "makeup_functions",
                    type: "multi_select",
                    label: "Que elementos queres incluir no plano personalizado?",
                    options: [
                        { value: "skin_tint", label: "Skin tint" },
                        { value: "foundation", label: "Base" },
                        { value: "concealer", label: "Corretor" },
                        { value: "eyeshadow", label: "Sombra de olhos" },
                        { value: "mascara", label: "Máscara de pestanas" },
                    ],
                    presentation: {
                        control: "grouped_option_cards",
                        groups: [
                            {
                                label: "Preparação e pele",
                                options: ["skin_tint", "foundation", "concealer"],
                            },
                            {
                                label: "Olhos e sobrancelhas",
                                options: ["eyeshadow", "mascara"],
                            },
                        ],
                        exclusiveGroups: [["skin_tint", "foundation"]],
                    },
                },
            },
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <ActiveConsultationPage />
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole("heading", { name: "Preparação e pele" }),
        ).toBeVisible();
        expect(
            screen.getByRole("heading", { name: "Olhos e sobrancelhas" }),
        ).toBeVisible();
        const skinTint = screen.getByRole("checkbox", { name: "Skin tint" });
        const foundation = screen.getByRole("checkbox", { name: "Base" });
        await user.click(skinTint);
        expect(skinTint).toBeChecked();
        await user.click(foundation);
        expect(foundation).toBeChecked();
        expect(skinTint).not.toBeChecked();
    });

    it("mostra o plano deduzido antes de gerar o relatório", async () => {
        apiMock.getCurrentConsultationSession.mockResolvedValue({
            id: "session-makeup-ready",
            flowState: "ready_for_report",
            goals: { primaryGoal: "makeup", secondaryGoals: [] },
            photos: { ready: true, count: 2 },
            makeupPlan: {
                depth: "balanced",
                depthLabel: "Equilibrado",
                functions: [
                    { code: "foundation", label: "Base" },
                    { code: "mascara", label: "Máscara de pestanas" },
                ],
            },
            conversation: {
                answeredCount: 12,
                totalQuestions: 12,
                currentIndex: 12,
                currentQuestion: null,
                answers: [],
            },
        });

        render(
            <MemoryRouter>
                <ActiveConsultationPage />
            </MemoryRouter>,
        );

        expect(await screen.findByText("Plano de maquilhagem")).toBeVisible();
        expect(
            screen.getByText(
                (_, element) =>
                    element?.tagName === "DD" &&
                    element.textContent ===
                        "Equilibrado · Base, Máscara de pestanas",
            ),
        ).toBeVisible();
    });
});

describe("NewConsultationPage", () => {
    it("apresenta sete objetivos e limita secundários a dois", async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <NewConsultationPage />
            </MemoryRouter>,
        );

        const primaryOptions = await screen.findAllByRole("radio");
        expect(primaryOptions).toHaveLength(7);
        await user.click(
            screen.getByRole("radio", { name: /Acne e imperfeições/ }),
        );
        await user.click(screen.getByRole("button", { name: "Continuar" }));

        const secondaryGroup = await screen.findByRole("group", {
            name: /Seleciona até dois/,
        });
        expect(within(secondaryGroup).getAllByRole("checkbox")).toHaveLength(7);
        await user.click(
            within(secondaryGroup).getByRole("checkbox", {
                name: /Hidratação e barreira/,
            }),
        );
        await user.click(
            within(secondaryGroup).getByRole("checkbox", {
                name: /Controlo de oleosidade/,
            }),
        );

        expect(
            within(secondaryGroup).getByRole("checkbox", {
                name: /Sensibilidade e vermelhidão/,
            }),
        ).toBeDisabled();
    });

    it("pede confirmação dos avisos remotos sem voltar a enviar fotografias", async () => {
        apiMock.createConsultationSession.mockResolvedValue({
            id: "session-warning",
            flowState: "collecting_photos",
        });
        apiMock.uploadFacePhotos.mockResolvedValue([
            {
                id: "photo-frontal",
                kind: "frontal",
                quality: {
                    status: "warning",
                    warnings: ["uneven_lighting_risk"],
                },
            },
            {
                id: "photo-perfil",
                kind: "perfil",
                quality: { status: "ok", warnings: [] },
            },
        ]);
        apiMock.startConsultationAnalysis.mockResolvedValue({
            id: "session-warning",
            flowState: "analyzing",
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <NewConsultationPage />
            </MemoryRouter>,
        );

        await user.click(
            await screen.findByRole("radio", { name: /Acne e imperfeições/ }),
        );
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(
            screen.getByRole("checkbox", {
                name: /Autorizo a avaliação cosmética/,
            }),
        );
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.upload(
            screen.getByLabelText("Fotografia frontal"),
            new File(["frontal"], "frontal.jpg", { type: "image/jpeg" }),
        );
        await user.upload(
            screen.getByLabelText("Fotografia de perfil"),
            new File(["perfil"], "perfil.jpg", { type: "image/jpeg" }),
        );
        await waitFor(() => {
            expect(photoMock.inspectPhotoFile).toHaveBeenCalledTimes(2);
        });
        await user.click(screen.getByRole("button", { name: "Iniciar análise" }));

        const warningHeading = await screen.findByRole("heading", {
            name: "Precisamos da tua decisão",
        });
        expect(warningHeading).toBeVisible();
        await waitFor(() => expect(warningHeading).toHaveFocus());
        expect(screen.getByText("Decisão necessária")).toBeVisible();
        expect(
            screen.getByRole("button", { name: "Continuar mesmo assim" }),
        ).toBeDisabled();
        expect(apiMock.startConsultationAnalysis).not.toHaveBeenCalled();
        await user.click(
            screen.getByRole("checkbox", {
                name: /Compreendo e quero continuar/,
            }),
        );
        await user.click(
            screen.getByRole("button", { name: "Continuar mesmo assim" }),
        );

        await waitFor(() => {
            expect(apiMock.startConsultationAnalysis).toHaveBeenCalledWith(
                "session-warning",
                { acknowledgePhotoWarnings: true },
                { signal: expect.any(AbortSignal) },
            );
        });
        expect(apiMock.uploadFacePhotos).toHaveBeenCalledTimes(1);
        expect(photoMock.inspectPhotoFile).toHaveBeenCalledWith(
            expect.any(File),
            { expectedKind: "frontal" },
        );
        expect(photoMock.inspectPhotoFile).toHaveBeenCalledWith(
            expect.any(File),
            { expectedKind: "perfil" },
        );
    });

    it("mostra temporariamente as duas fotografias confirmadas na revisão", async () => {
        Object.defineProperty(URL, "createObjectURL", {
            configurable: true,
            value: vi
                .fn()
                .mockReturnValueOnce("blob:frontal-preview")
                .mockReturnValueOnce("blob:perfil-preview"),
        });
        Object.defineProperty(URL, "revokeObjectURL", {
            configurable: true,
            value: vi.fn(),
        });
        apiMock.getFaceConsent.mockResolvedValue({
            consent: {
                status: "active",
                version: "face-analysis-v2",
                purposes: { openAiAnalysis: true },
            },
            providerConsentRequirement: {
                required: false,
                consentVersion: "face-analysis-v2",
            },
        });
        apiMock.getCurrentConsultationSession.mockResolvedValue({
            id: "session-photo-previews",
            flowState: "collecting_photos",
            goals: { primaryGoal: "acne_imperfections", secondaryGoals: [] },
            photos: {
                ready: true,
                requiresWarningConfirmation: true,
                items: [
                    { id: "photo-front", kind: "frontal" },
                    { id: "photo-side", kind: "perfil" },
                ],
            },
            analysis: {
                id: "analysis-photo-previews",
                status: "completed",
                photoQuality: {
                    status: "warning",
                    warnings: ["blur_detected"],
                },
            },
        });
        apiMock.downloadOwnedConsultationPhoto
            .mockResolvedValueOnce(new Blob(["front"], { type: "image/jpeg" }))
            .mockResolvedValueOnce(new Blob(["side"], { type: "image/jpeg" }));

        const { unmount } = render(
            <MemoryRouter>
                <NewConsultationPage />
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole("img", {
                name: "Pré-visualização da fotografia frontal",
            }),
        ).toHaveAttribute("src", "blob:frontal-preview");
        expect(
            screen.getByRole("img", {
                name: "Pré-visualização da fotografia de perfil",
            }),
        ).toHaveAttribute("src", "blob:perfil-preview");
        expect(apiMock.downloadOwnedConsultationPhoto).toHaveBeenNthCalledWith(
            1,
            "analysis-photo-previews",
            "frontal",
            { signal: expect.any(AbortSignal) },
        );
        expect(apiMock.downloadOwnedConsultationPhoto).toHaveBeenNthCalledWith(
            2,
            "analysis-photo-previews",
            "perfil",
            { signal: expect.any(AbortSignal) },
        );

        unmount();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:frontal-preview");
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:perfil-preview");
    });

    it("exige um novo par quando a análise anterior ficou inconclusiva", async () => {
        apiMock.getFaceConsent.mockResolvedValue({
            consent: {
                status: "active",
                version: "face-analysis-v2",
                purposes: { openAiAnalysis: true },
            },
            providerConsentRequirement: {
                required: false,
                consentVersion: "face-analysis-v2",
            },
        });
        apiMock.getCurrentConsultationSession.mockResolvedValue({
            id: "session-new-photos",
            flowState: "collecting_photos",
            goals: { primaryGoal: "acne_imperfections", secondaryGoals: [] },
            photos: {
                ready: false,
                requiresNewPhotos: true,
                items: [
                    { id: "old-front", kind: "frontal" },
                    { id: "old-side", kind: "perfil" },
                ],
            },
        });
        render(
            <MemoryRouter>
                <NewConsultationPage />
            </MemoryRouter>,
        );

        expect(await screen.findByRole("heading", { name: "As tuas fotografias" })).toBeVisible();
        expect(screen.getByText("Precisamos de novas fotografias")).toBeVisible();
        expect(screen.getByRole("button", { name: "Iniciar análise" })).toBeDisabled();
        expect(apiMock.startConsultationAnalysis).not.toHaveBeenCalled();
    });
});

describe("ConsultationReportPage", () => {
    it("mantém um único carregamento e as associações ao navegar pela workspace", async () => {
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-workspace",
            lifecycleStatus: "unlocked",
            locked: false,
            objectives: [
                { code: "hydration_barrier", priority: "primary" },
            ],
            content: {
                answerSummary: "A hidratação é a prioridade desta consulta.",
                objectivesAssessment: "Avaliação cosmética estruturada.",
                photoQuality: { status: "pass", warnings: [] },
                safetyFlags: ["Introduzir os produtos gradualmente."],
                observations: ["Descamação superficial localizada."],
            },
            routine: [
                {
                    routineSlotCode: "moisturize",
                    period: "manha",
                    priority: "essential",
                    title: "Hidratar",
                    reason: "Reforçar o conforto da pele.",
                    instructions: "Aplicar uma camada fina.",
                    cautions: [],
                    recommendationIds: ["recommendation-moisturizer"],
                },
            ],
            recommendations: [
                {
                    id: "recommendation-moisturizer",
                    routineSlotCodes: ["moisturize"],
                    product: {
                        productId: "product-moisturizer",
                        name: "Creme barreira",
                        brandName: "Orélle",
                        priceCents: 1_490,
                    },
                    currentAvailability: {
                        available: true,
                        priceCents: 1_490,
                        stock: 3,
                    },
                    explanation: "Adequado ao objetivo principal.",
                    sourceLabels: [
                        "objetivo selecionado na consulta: hidratação e barreira",
                    ],
                },
            ],
            limitations: [],
            visualizationSpec: { enabled: false, limitations: [] },
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter
                initialEntries={[
                    "/consulta/relatorios/report-workspace/resumo",
                ]}
            >
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(
            await screen.findByText("A hidratação é a prioridade desta consulta."),
        ).toBeVisible();
        expect(
            screen.queryByRole("button", { name: "Essencial" }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Completa" }),
        ).not.toBeInTheDocument();
        await user.click(screen.getByRole("link", { name: "Plano" }));
        expect(
            await screen.findByRole("heading", { name: "Hidratar" }),
        ).toBeVisible();
        await user.click(screen.getByRole("link", { name: "Creme barreira" }));
        expect(
            await screen.findByRole("heading", { name: "Produtos recomendados" }),
        ).toBeVisible();
        const productDetail = await screen.findByRole("dialog", {
            name: "Creme barreira",
        });
        expect(
            within(productDetail).getByRole("heading", {
                name: "Creme barreira",
            }),
        ).toBeVisible();
        expect(
            within(productDetail).getByText("Objetivo selecionado na consulta"),
        ).toBeVisible();
        expect(
            within(productDetail).getByText("hidratação e barreira"),
        ).toBeVisible();
        await user.click(
            within(productDetail).getByRole("button", {
                name: "Fechar",
            }),
        );
        await waitFor(() =>
            expect(
                screen.queryByRole("dialog", { name: "Creme barreira" }),
            ).not.toBeInTheDocument(),
        );
        expect(apiMock.getConsultationReport).toHaveBeenCalledTimes(1);
    });

    it("pagina muitas recomendações sem montar uma lista vertical ilimitada", async () => {
        const recommendations = Array.from({ length: 20 }, (_, index) => ({
            id: `recommendation-${index + 1}`,
            routineSlotCodes: ["moisturize"],
            product: {
                productId: `product-${index + 1}`,
                name: `Produto ${String(index + 1).padStart(2, "0")}`,
                brandName: "Orélle",
                priceCents: 500 + index,
            },
            currentAvailability: {
                available: true,
                priceCents: 500 + index,
                stock: 2,
            },
            explanation: "Produto incluído no plano.",
        }));
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-many-products",
            lifecycleStatus: "unlocked",
            locked: false,
            objectives: [],
            content: {
                answerSummary: "Resumo.",
                photoQuality: { status: "pass" },
            },
            routine: [],
            recommendations,
            limitations: [],
            visualizationSpec: { enabled: false, limitations: [] },
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter
                initialEntries={[
                    "/consulta/relatorios/report-many-products/produtos",
                ]}
            >
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(await screen.findByText("20 produtos")).toBeVisible();
        expect(
            screen.getAllByRole("button", { name: "Ver detalhe completo" }),
        ).toHaveLength(6);
        expect(screen.getByText("Produto 01")).toBeVisible();
        expect(screen.queryByText("Produto 07")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Seguinte" }));
        expect(await screen.findByText("Produto 07")).toBeVisible();
        expect(screen.queryByText("Produto 01")).not.toBeInTheDocument();
    });

    it("não monta conteúdo completo recebido indevidamente num relatório bloqueado", async () => {
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-public",
            lifecycleStatus: "frozen_locked",
            teaser: {
                title: "Plano pronto",
                summary: "Resumo seguro",
                recommendationCount: 2,
                availableRecommendationCount: 1,
                recommendedTotalCents: 4_990,
                depositCents: 499,
                objectives: [
                    {
                        code: "hydration_barrier",
                        priority: "primary",
                    },
                ],
            },
            cosmeticSummary: "CONTEÚDO SECRETO NÃO DEVE ESTAR NO DOM",
        });

        render(
            <MemoryRouter initialEntries={["/consulta/relatorios/report-public/pre-visualizacao"]}>
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(await screen.findByText("Resumo seguro")).toBeVisible();
        expect(screen.getByText("Disponíveis no cálculo")).toBeVisible();
        expect(screen.getByText("Hidratação e barreira — principal")).toBeVisible();
        expect(
            screen.queryByText("CONTEÚDO SECRETO NÃO DEVE ESTAR NO DOM"),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", {
                name: "Simular pagamento e desbloquear",
            }),
        ).toBeVisible();
    });

    it("envia consentimento fotográfico pontual com a versão do relatório", async () => {
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-public",
            lifecycleStatus: "draft_ready",
            locked: true,
            objectives: [],
            access: { recommendationCount: 2, depositCents: null },
            consentNotices: {
                consultantPhotoAccess: "consultant-photo-access-v1",
            },
        });
        apiMock.requestConsultationReportReview.mockResolvedValue({
            id: "report-public",
            lifecycleStatus: "review_pending",
            locked: true,
            review: { status: "pending", photoAccess: { granted: true } },
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={["/consulta/relatorios/report-public/pre-visualizacao"]}>
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );
        await user.click(
            await screen.findByRole("checkbox", {
                name: /Permitir acesso temporário às fotografias/,
            }),
        );
        await user.click(
            screen.getByRole("button", { name: "Pedir revisão humana" }),
        );

        await waitFor(() => {
            expect(apiMock.requestConsultationReportReview).toHaveBeenCalledWith(
                "report-public",
                {
                    grantPhotoAccess: true,
                    photoAccessNoticeVersion: "consultant-photo-access-v1",
                },
                { signal: expect.any(AbortSignal) },
            );
        });
    });

    it("permite conceder novo grant explícito numa revisão pendente", async () => {
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-after-clarification",
            lifecycleStatus: "review_pending",
            locked: true,
            objectives: [],
            access: { recommendationCount: 2, depositCents: 200 },
            review: {
                status: "pending",
                photoAccess: { granted: false },
            },
            consentNotices: {
                consultantPhotoAccess: "consultant-photo-access-v1",
            },
        });
        apiMock.requestConsultationReportReview.mockResolvedValue({
            id: "report-after-clarification",
            lifecycleStatus: "review_pending",
            locked: true,
            review: {
                status: "pending",
                photoAccess: { granted: true },
            },
        });
        const user = userEvent.setup();
        render(
            <MemoryRouter
                initialEntries={[
                    "/consulta/relatorios/report-after-clarification",
                ]}
            >
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        await user.click(
            await screen.findByRole("checkbox", {
                name: /Autorizo o consultor a ver as fotografias deste relatório/,
            }),
        );
        await user.click(
            screen.getByRole("button", {
                name: "Conceder acesso às fotografias",
            }),
        );

        await waitFor(() => {
            expect(apiMock.requestConsultationReportReview).toHaveBeenCalledWith(
                "report-after-clarification",
                {
                    grantPhotoAccess: true,
                    photoAccessNoticeVersion: "consultant-photo-access-v1",
                },
                { signal: expect.any(AbortSignal) },
            );
        });
    });

    it("envia consentimento, intensidade e variantes ao pedir a visualização", async () => {
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-public",
            lifecycleStatus: "unlocked",
            locked: false,
            content: { summary: "Plano desbloqueado" },
            routine: [],
            recommendations: [],
            limitations: [],
            visualizationSpec: {
                enabled: true,
                objectives: [
                    {
                        code: "oil_control",
                        priority: "primary",
                        effect: "reduce_excess_specular_shine",
                        regions: ["forehead", "nose"],
                    },
                ],
                makeup: { requiresVariantConfirmation: false },
                variantRecommendationIds: [],
                limitations: [],
            },
            consentNotices: {
                generativeCosmeticVisualization:
                    "generative-cosmetic-visualization-v1",
            },
        });
        apiMock.createCosmeticVisualization.mockResolvedValue({
            id: "simulation-public",
            status: "queued",
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={["/consulta/relatorios/report-public/pre-visualizacao"]}>
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );
        await user.click(
            await screen.findByRole("checkbox", {
                name: /Autorizo esta edição cosmética temporária/,
            }),
        );
        await user.click(
            screen.getByRole("button", {
                name: "Criar pré-visualização em PNG",
            }),
        );

        await waitFor(() => {
            expect(apiMock.createCosmeticVisualization).toHaveBeenCalledWith(
                "report-public",
                {
                    generativeEditAccepted: true,
                    generativeEditNoticeVersion:
                        "generative-cosmetic-visualization-v1",
                    intensity: "balanced",
                    variantSelections: [],
                },
                { signal: expect.any(AbortSignal) },
            );
        });
    });

    it("confirma junto da imagem as variantes e regiões de maquilhagem usadas", async () => {
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-makeup",
            lifecycleStatus: "unlocked",
            locked: false,
            objectives: [{ code: "makeup", priority: "primary" }],
            content: { summary: "Plano de maquilhagem desbloqueado" },
            routine: [],
            limitations: [],
            recommendations: [
                {
                    id: "recommendation-lips",
                    variantId: "rose",
                    visualRoles: ["lips"],
                    product: {
                        productId: "product-lipstick",
                        name: "Batom hidratante",
                        brandName: "Orélle",
                        priceCents: 1_200,
                        variant: {
                            variantId: "rose",
                            label: "Rosa",
                        },
                    },
                    currentAvailability: {
                        available: true,
                        priceCents: 1_200,
                        stock: 4,
                    },
                    availableVariants: [
                        {
                            variantId: "rose",
                            label: "Rosa",
                            priceCents: 1_200,
                            available: true,
                        },
                        {
                            variantId: "berry",
                            label: "Frutos vermelhos",
                            priceCents: 1_250,
                            available: true,
                        },
                    ],
                },
            ],
            visualizationSpec: {
                enabled: true,
                objectives: [
                    {
                        code: "makeup",
                        priority: "primary",
                        effect: "apply_confirmed_catalog_makeup",
                        regions: ["lips"],
                    },
                ],
                makeup: {
                    effectiveRegions: ["lips"],
                    requiresVariantConfirmation: true,
                },
                variantRecommendationIds: ["recommendation-lips"],
                limitations: [],
            },
            consentNotices: {
                generativeCosmeticVisualization:
                    "generative-cosmetic-visualization-v1",
            },
        });
        apiMock.createCosmeticVisualization.mockResolvedValue({
            id: "visualization-makeup",
            status: "queued",
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={["/consulta/relatorios/report-makeup/pre-visualizacao"]}>
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole("heading", {
                name: "Produtos e variantes usados na imagem",
            }),
        ).toBeVisible();
        expect(screen.getByText("Lábios")).toBeVisible();
        expect(
            screen.getByRole("combobox", {
                name: "Variante para Batom hidratante",
            }),
        ).toHaveValue("rose");
        await user.click(
            screen.getByRole("button", {
                name: "Confirmar variantes da imagem",
            }),
        );
        await user.click(
            screen.getByRole("checkbox", {
                name: /Autorizo esta edição cosmética temporária/,
            }),
        );
        await user.click(
            screen.getByRole("button", {
                name: "Criar pré-visualização em PNG",
            }),
        );

        await waitFor(() => {
            expect(apiMock.createCosmeticVisualization).toHaveBeenCalledWith(
                "report-makeup",
                {
                    generativeEditAccepted: true,
                    generativeEditNoticeVersion:
                        "generative-cosmetic-visualization-v1",
                    intensity: "balanced",
                    variantSelections: [
                        {
                            recommendationId: "recommendation-lips",
                            variantId: "rose",
                        },
                    ],
                },
                { signal: expect.any(AbortSignal) },
            );
        });
    });

    it("agrupa limitações visuais e não expõe códigos técnicos", async () => {
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-compact-visual",
            lifecycleStatus: "unlocked",
            locked: false,
            objectives: [{ code: "hydration_barrier", priority: "primary" }],
            content: {
                answerSummary: "Plano hidratante.",
                photoQuality: { status: "pass" },
            },
            routine: [],
            recommendations: [],
            limitations: [],
            visualizationSpec: {
                enabled: true,
                objectives: [
                    {
                        code: "hydration_barrier",
                        priority: "primary",
                        effect: "reduce_visible_dryness_and_flaking",
                    },
                ],
                makeup: {
                    effectiveRegions: [],
                    requiresVariantConfirmation: false,
                },
                variantRecommendationIds: [],
                limitations: [
                    "A função concealer foi omitida porque não existe um produto recomendado que a suporte.",
                    "A função setting_powder foi omitida porque não existe um produto recomendado que a suporte.",
                    "A proteção solar invisível ou sem acabamento escolhido não produz uma alteração visual credível.",
                ],
            },
        });

        render(
            <MemoryRouter
                initialEntries={[
                    "/consulta/relatorios/report-compact-visual/pre-visualizacao",
                ]}
            >
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole("heading", { name: "Não incluído" }),
        ).toBeVisible();
        expect(screen.getByText("Sem produto compatível")).toBeVisible();
        expect(screen.getByText(/Corretor e Pó fixador/)).toBeVisible();
        expect(
            screen.getByText("Proteção solar sem efeito visível"),
        ).toBeVisible();
        expect(screen.queryByText(/setting_powder/)).not.toBeInTheDocument();
    });

    it("bloqueia sem custo um relatório principal de maquilhagem sem plano executável", async () => {
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-broken-makeup",
            lifecycleStatus: "unlocked",
            locked: false,
            objectives: [
                { code: "makeup", priority: "primary" },
                { code: "spots_tone_luminosity", priority: "secondary" },
            ],
            content: { summary: "Plano legado incompleto" },
            routine: [],
            recommendations: [],
            limitations: [],
            visualizationSpec: {
                enabled: true,
                objectives: [
                    {
                        code: "spots_tone_luminosity",
                        priority: "secondary",
                        effect: "improve_local_tone_uniformity",
                        regions: ["affected_areas"],
                    },
                ],
                makeup: {
                    effectiveRegions: [],
                    requiresVariantConfirmation: false,
                },
                variantRecommendationIds: [],
                limitations: [],
            },
            consentNotices: {
                generativeCosmeticVisualization:
                    "generative-cosmetic-visualization-v1",
            },
        });

        render(
            <MemoryRouter
                initialEntries={["/consulta/relatorios/report-broken-makeup/pre-visualizacao"]}
            >
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole("alert", {
                name: "",
            }),
        ).toHaveTextContent(/geração foi bloqueada neste relatório/);
        expect(
            screen.getByRole("link", { name: "Iniciar nova consulta" }),
        ).toHaveAttribute("href", "/consulta/nova");
        expect(
            screen.queryByRole("button", {
                name: "Criar pré-visualização em PNG",
            }),
        ).not.toBeInTheDocument();
        expect(apiMock.createCosmeticVisualization).not.toHaveBeenCalled();
    });

    it("mantém o polling após uma falha transitória e apresenta o estado final", async () => {
        vi.useFakeTimers();
        const startedAt = new Date(Date.now() - 65_000).toISOString();
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-processing",
            lifecycleStatus: "unlocked",
            locked: false,
            content: { summary: "Plano desbloqueado" },
            routine: [],
            recommendations: [],
            limitations: [],
            visualizationSpec: {
                enabled: true,
                objectives: [],
                makeup: { requiresVariantConfirmation: false },
                variantRecommendationIds: [],
                limitations: [],
            },
            visualization: {
                id: "simulation-processing",
                status: "processing",
                createdAt: startedAt,
                updatedAt: startedAt,
            },
            consentNotices: {
                generativeCosmeticVisualization:
                    "generative-cosmetic-visualization-v1",
            },
        });
        const transientError = Object.assign(new Error("offline"), {
            status: 0,
            code: "NETWORK_ERROR",
        });
        apiMock.getCosmeticVisualization
            .mockRejectedValueOnce(transientError)
            .mockResolvedValueOnce({
                id: "simulation-processing",
                status: "failed_retryable",
                createdAt: startedAt,
                updatedAt: new Date().toISOString(),
            });

        render(
            <MemoryRouter
                initialEntries={["/consulta/relatorios/report-processing/pre-visualizacao"]}
            >
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });
        expect(
            screen
                .getByText("A criar a tua pré-visualização")
                .closest('[role="status"]'),
        ).toHaveTextContent(/Tempo decorrido:1 min 05 s/);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(2_000);
        });
        expect(
            screen.getByText(/Vamos tentar novamente automaticamente/),
        ).toBeVisible();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(4_000);
        });
        expect(apiMock.getCosmeticVisualization).toHaveBeenCalledTimes(2);
        expect(apiMock.getCosmeticVisualization).toHaveBeenLastCalledWith(
            "simulation-processing",
            { signal: expect.any(AbortSignal) },
        );
        expect(
            screen.getByText("A edição foi interrompida. Podes tentar novamente."),
        ).toBeVisible();
    });

    it("apresenta a fotografia original e a pré-visualização concluída", async () => {
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-with-preview",
            lifecycleStatus: "unlocked",
            locked: false,
            content: { summary: "Plano desbloqueado" },
            routine: [],
            recommendations: [],
            limitations: [],
            sourceImageUrl: "/api/me/skin-analyses/analysis-public/image",
            visualizationSpec: {
                enabled: true,
                objectives: [],
                makeup: { requiresVariantConfirmation: false },
                variantRecommendationIds: [],
                limitations: [],
            },
            visualization: {
                id: "simulation-completed",
                status: "completed",
            },
            consentNotices: {
                generativeCosmeticVisualization:
                    "generative-cosmetic-visualization-v1",
            },
        });
        apiMock.downloadCosmeticVisualizationImage.mockResolvedValue(
            new Blob(["generated"], { type: "image/png" }),
        );
        apiMock.downloadAuthenticatedReportImage.mockResolvedValue(
            new Blob(["source"], { type: "image/webp" }),
        );
        const createObjectUrl = vi
            .fn()
            .mockReturnValueOnce("blob:makeup-preview")
            .mockReturnValueOnce("blob:makeup-source");
        Object.defineProperty(URL, "createObjectURL", {
            configurable: true,
            value: createObjectUrl,
        });
        Object.defineProperty(URL, "revokeObjectURL", {
            configurable: true,
            value: vi.fn(),
        });

        const { unmount } = render(
            <MemoryRouter
                initialEntries={["/consulta/relatorios/report-with-preview/pre-visualizacao"]}
            >
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole("img", {
                name: "Fotografia original usada nesta pré-visualização",
            }),
        ).toHaveAttribute("src", "blob:makeup-source");
        expect(
            screen.getByRole("img", {
                name: "Pré-visualização cosmética gerada para esta consulta",
            }),
        ).toHaveAttribute("src", "blob:makeup-preview");
        expect(
            screen.queryByText("generative-makeup-v1"),
        ).not.toBeInTheDocument();
        expect(apiMock.downloadCosmeticVisualizationImage).toHaveBeenCalledWith(
            "simulation-completed",
            { signal: expect.any(AbortSignal) },
        );

        unmount();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:makeup-preview");
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:makeup-source");
    });

    it("mostra snapshot histórico e só oferece compra quando há stock atual", async () => {
        cartMock.addLines.mockResolvedValue({
            addedCount: 1,
            requestedCount: 1,
        });
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-public",
            lifecycleStatus: "unlocked",
            locked: false,
            objectives: [
                { code: "hydration_barrier", priority: "primary" },
            ],
            content: {
                answerSummary: "Resumo das respostas confirmado.",
                objectivesAssessment:
                    "A pele apresenta sinais que beneficiam de hidratação. A rotina deve ser introduzida gradualmente. Foi selecionada uma recomendação com variantId.",
                observations: [
                    "Observação cosmética um.",
                    "Observação cosmética dois.",
                    "Observação cosmética três.",
                    "Observação cosmética adicional.",
                ],
                photoQuality: { status: "pass", reasons: [], warnings: [] },
                safetyFlags: ["Cautela cosmética explícita."],
            },
            routine: [
                {
                    period: "manha",
                    priority: "essential",
                    title: "Hidratar",
                    reason: "Reforça o conforto cosmético.",
                    instructions: "Aplicar uma camada fina.",
                    cautions: ["Interromper em caso de desconforto."],
                },
            ],
            sources: ["fotografia_frontal", "fotografia_perfil"],
            limitations: [],
            provenance: {
                provider: "openai",
                effectiveModel: "modelo-publicado",
                promptVersion: "prompt-v2",
                responseSchemaVersion: "schema-v2",
            },
            review: { status: "approved" },
            recommendations: [
                {
                    id: "recommendation-available",
                    product: {
                        productId: "product-available",
                        name: "Produto disponível",
                        brandName: "Orélle",
                        imageUrl: "/assets/products/product-available.webp",
                        priceCents: 1_299,
                        stock: 2,
                        variant: {
                            variantId: "variant-light",
                            label: "Claro",
                        },
                    },
                    currentAvailability: {
                        available: true,
                        priceCents: 1_399,
                        stock: 4,
                    },
                    explanation: "Adequado ao objetivo principal.",
                    usage: "Usar de manhã.",
                    cautions: ["Confirmar tolerância."],
                },
                {
                    id: "recommendation-unavailable",
                    product: {
                        productId: "product-unavailable",
                        name: "Produto sem stock",
                        brandName: "Orélle",
                        imageUrl: "/assets/products/product-unavailable.webp",
                        priceCents: 999,
                        stock: 1,
                    },
                    currentAvailability: {
                        available: false,
                        priceCents: 999,
                        stock: 0,
                    },
                    explanation: "Snapshot preservado no relatório.",
                },
            ],
        });

        const user = userEvent.setup();
        render(
            <MemoryRouter initialEntries={["/consulta/relatorios/report-public/produtos"]}>
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        const availableProduct = (
            await screen.findByText("Produto disponível")
        ).closest("li");
        const unavailableProduct = screen.getByText("Produto sem stock").closest("li");
        expect(availableProduct).not.toBeNull();
        expect(unavailableProduct).not.toBeNull();
        expect(availableProduct.querySelector("img")).not.toBeNull();
        expect(unavailableProduct.querySelector("img")).not.toBeNull();
        expect(within(availableProduct).getByText(/12,99/)).toBeVisible();
        expect(within(availableProduct).getByText(/13,99/)).toBeVisible();
        await user.click(
            within(availableProduct).getByRole("button", {
                name: "Ver detalhe completo",
            }),
        );
        expect(
            await screen.findByRole("link", {
                name: "Ver produto disponível",
            }),
        ).toHaveAttribute(
            "href",
            "/produtos/product-available?variant=variant-light",
        );
        await user.click(screen.getByRole("button", { name: "Fechar" }));
        expect(
            within(unavailableProduct).queryByRole("link", {
                name: "Ver produto disponível",
            }),
        ).not.toBeInTheDocument();
        expect(within(unavailableProduct).getByRole("status")).toHaveTextContent(
            /temporariamente indisponível/,
        );
        await user.click(
            screen.getByRole("button", {
                name: "Adicionar ao carrinho",
            }),
        );
        await waitFor(() => {
            expect(cartMock.addLines).toHaveBeenCalledWith(
                [
                    {
                        productId: "product-available",
                        variantId: "variant-light",
                        quantity: 1,
                    },
                ],
            );
        });
        expect(screen.queryByText(/1 produto adicionado/)).not.toBeInTheDocument();
    });

    it("retoma voucher e job de maquilhagem devolvidos pelo relatório", async () => {
        apiMock.getConsultationReport.mockResolvedValue({
            id: "report-public",
            lifecycleStatus: "unlocked",
            locked: false,
            content: {
                answerSummary: "Resumo disponível.",
                objectivesAssessment: "Avaliação cosmética disponível.",
                photoQuality: { status: "pass" },
            },
            objectives: [],
            routine: [],
            recommendations: [],
            limitations: [],
            voucher: { code: "VOUCHER-RELOAD", amountCents: 500 },
            visualization: {
                id: "simulation-retry",
                status: "failed_retryable",
            },
            visualizationSpec: {
                enabled: true,
                objectives: [],
                makeup: { requiresVariantConfirmation: false },
                variantRecommendationIds: [],
                limitations: [],
            },
            consentNotices: {
                generativeCosmeticVisualization:
                    "generative-cosmetic-visualization-v1",
            },
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={["/consulta/relatorios/report-public"]}>
                <Routes>
                    <Route
                        path="/consulta/relatorios/:reportId/*"
                        element={<ConsultationReportPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(await screen.findByText("VOUCHER-RELOAD")).toBeVisible();
        expect(
            screen.queryByText("Plano visual de maquilhagem"),
        ).not.toBeInTheDocument();
        expect(
            screen.getByText("A edição foi interrompida. Podes tentar novamente."),
        ).toBeVisible();
        await user.click(
            screen.getByRole("link", { name: "Pré-visualização" }),
        );
        const retry = await screen.findByRole("button", {
            name: "Tentar novamente",
        });
        expect(retry).toBeDisabled();
        await user.click(
            screen.getByRole("checkbox", {
                name: /Autorizo esta edição cosmética temporária/,
            }),
        );
        expect(retry).toBeEnabled();
    });
});

describe("ConsultationReviewsPage", () => {
    it("seleciona uma recomendação antes de guardar um ajuste", async () => {
        apiMock.listConsultationReviews.mockResolvedValue([
            { id: "review-public", status: "pending", summary: "Revisão A" },
        ]);
        apiMock.getConsultationReview.mockResolvedValue({
            id: "review-public",
            status: "pending",
            summary: "Revisão A",
            recommendations: [
                {
                    id: "recommendation-public",
                    product: { name: "Creme suave" },
                    explanation: "Adequado ao objetivo escolhido.",
                    usage: "Aplicar de manhã.",
                    cautions: ["Evitar o contacto com os olhos."],
                },
            ],
            photoAccess: { granted: false },
            report: {
                schemaVersion: 2,
                content: {
                    assessment:
                        "Avaliação cosmética original suficientemente detalhada.",
                },
                routine: [
                    {
                        period: "manha",
                        title: "Limpeza suave",
                        reason: "Prepara a pele para os passos seguintes.",
                        instructions: "Aplicar com movimentos suaves.",
                        cautions: ["Evitar o contacto com os olhos."],
                    },
                ],
            },
        });
        apiMock.decideConsultationReview.mockResolvedValue({
            id: "review-public",
            status: "adjusted",
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <ConsultationReviewsPage />
            </MemoryRouter>,
        );
        await user.click(await screen.findByRole("button", { name: /Revisão A/ }));
        await user.selectOptions(
            await screen.findByRole("combobox", { name: "Decisão" }),
            "adjusted",
        );
        expect(
            screen.getByRole("button", { name: "Guardar decisão" }),
        ).toBeDisabled();
        expect(
            screen.getByRole("checkbox", { name: "Creme suave" }),
        ).toBeChecked();
        await user.clear(
            screen.getByRole("textbox", { name: "Avaliação ajustada" }),
        );
        await user.type(
            screen.getByRole("textbox", { name: "Avaliação ajustada" }),
            "Avaliação cosmética ajustada pelo consultor.",
        );
        await user.type(
            screen.getByRole("textbox", { name: "Nota para o cliente" }),
            "Ajuste confirmado para esta rotina.",
        );
        await user.click(screen.getByRole("button", { name: "Guardar decisão" }));

        await waitFor(() => {
            expect(apiMock.decideConsultationReview).toHaveBeenCalledWith(
                "review-public",
                expect.objectContaining({
                    decision: "adjusted",
                    adjustedRecommendationIds: ["recommendation-public"],
                    adjustedContent: {
                        assessment:
                            "Avaliação cosmética ajustada pelo consultor.",
                        routine: [
                            {
                                period: "manha",
                                title: "Limpeza suave",
                                reason:
                                    "Prepara a pele para os passos seguintes.",
                                instructions:
                                    "Aplicar com movimentos suaves.",
                                cautions: [
                                    "Evitar o contacto com os olhos.",
                                ],
                            },
                        ],
                        recommendations: [
                            {
                                recommendationId: "recommendation-public",
                                explanation:
                                    "Adequado ao objetivo escolhido.",
                                usage: "Aplicar de manhã.",
                                cautions: [
                                    "Evitar o contacto com os olhos.",
                                ],
                            },
                        ],
                    },
                }),
                { signal: expect.any(AbortSignal) },
            );
        });
    });

    it("permite ajustar texto quando o relatório não tem recomendações", async () => {
        apiMock.listConsultationReviews.mockResolvedValue([
            {
                id: "review-without-products",
                status: "pending",
                summary: "Revisão sem produtos",
            },
        ]);
        apiMock.getConsultationReview.mockResolvedValue({
            id: "review-without-products",
            status: "pending",
            summary: "Revisão sem produtos",
            recommendations: [],
            photoAccess: { granted: false },
            report: {
                schemaVersion: 2,
                content: {
                    assessment: "Avaliação cosmética original sem produtos.",
                    routine: [],
                },
                routine: [],
            },
        });
        apiMock.decideConsultationReview.mockResolvedValue({
            id: "review-without-products",
            status: "adjusted",
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <ConsultationReviewsPage />
            </MemoryRouter>,
        );
        await user.click(
            await screen.findByRole("button", { name: /Revisão sem produtos/ }),
        );
        await user.selectOptions(
            await screen.findByRole("combobox", { name: "Decisão" }),
            "adjusted",
        );

        const saveButton = screen.getByRole("button", {
            name: "Guardar decisão",
        });
        expect(saveButton).toBeDisabled();
        expect(
            screen.getByText(/Este relatório não contém produtos/),
        ).toBeInTheDocument();

        await user.clear(
            screen.getByRole("textbox", { name: "Avaliação ajustada" }),
        );
        await user.type(
            screen.getByRole("textbox", { name: "Avaliação ajustada" }),
            "Avaliação cosmética ajustada sem recomendações disponíveis.",
        );
        await user.type(
            screen.getByRole("textbox", { name: "Nota para o cliente" }),
            "Avaliação revista pelo consultor humano.",
        );
        expect(saveButton).toBeEnabled();
        await user.click(saveButton);

        await waitFor(() => {
            expect(apiMock.decideConsultationReview).toHaveBeenCalledWith(
                "review-without-products",
                expect.objectContaining({
                    decision: "adjusted",
                    adjustedRecommendationIds: [],
                    adjustedContent: {
                        assessment:
                            "Avaliação cosmética ajustada sem recomendações disponíveis.",
                        routine: undefined,
                        recommendations: [],
                    },
                }),
                { signal: expect.any(AbortSignal) },
            );
        });
    });
});
