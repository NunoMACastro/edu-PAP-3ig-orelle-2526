/** Wizard progressivo de objetivos, consentimento e fotografias da consulta. */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorSummary } from "../../components/ErrorSummary.jsx";
import {
    EmptyState,
    OrelleActionLink,
    OrelleButton,
    PageHero,
    Skeleton,
} from "../../components/OrelleUi.jsx";
import { useConsultationAvailability } from "../../context/ConsultationAvailabilityContext.jsx";
import { useAsyncAction } from "../../hooks/useAsyncAction.js";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { compressImageForUpload } from "../../utils/imageOptimization.js";
import {
    acceptFaceConsent,
    createConsultationSession,
    downloadOwnedConsultationPhoto,
    getConsultationGoals,
    getCurrentConsultationSession,
    getFaceConsent,
    startConsultationAnalysis,
    uploadFacePhotos,
} from "./consultationApi.js";
import { getSessionDestination, getSessionPhase } from "./consultationModel.js";
import {
    getPublicPhotoWarnings,
    getSessionPhotoWarnings,
    getUploadPhotoWarnings,
    hasMatchingFaceAnalysisConsent,
} from "./consultationPresentation.js";
import { inspectPhotoFile } from "./photoPreflight.js";

const EMPTY_PREFLIGHT = Object.freeze({
    status: "idle",
    errors: [],
    warnings: [],
});

const EMPTY_PHOTO_PREVIEWS = Object.freeze({
    frontal: "",
    perfil: "",
    status: "idle",
});

const WIZARD_STEPS = Object.freeze([
    { number: 1, shortLabel: "Objetivo", title: "O teu objetivo principal" },
    { number: 2, shortLabel: "Extras", title: "Objetivos complementares" },
    { number: 3, shortLabel: "Privacidade", title: "Privacidade e consentimento" },
    { number: 4, shortLabel: "Fotos", title: "As tuas fotografias" },
]);

const SUBMISSION_LABELS = Object.freeze({
    idle: "Iniciar análise",
    preparing: "A preparar fotografias…",
    uploading: "A enviar com segurança…",
    starting: "A iniciar análise…",
});

/** Apresenta o progresso sem permitir saltar validações através do indicador. */
function ConsultationStepper({ currentStep }) {
    return (
        <nav className="consultation-stepper" aria-label="Progresso da consulta">
            <ol>
                {WIZARD_STEPS.map((step) => (
                    <li
                        key={step.number}
                        className={step.number < currentStep ? "is-complete" : ""}
                        aria-current={step.number === currentStep ? "step" : undefined}
                    >
                        <span aria-hidden="true">
                            {step.number < currentStep ? "✓" : step.number}
                        </span>
                        <strong>{step.shortLabel}</strong>
                    </li>
                ))}
            </ol>
        </nav>
    );
}

/** Upload nativo preservado, apresentado como tile legível e previsível. */
function PhotoUploadTile({
    kind,
    label,
    guidance,
    file,
    preflight,
    remoteReady,
    previewUrl,
    previewStatus,
    disabled,
    inputRef,
    onSelect,
}) {
    const inputId = `consultation-photo-${kind}`;
    const statusId = `${inputId}-status`;
    const ready = preflight.status === "valid" || remoteReady;

    return (
        <article className={`consultation-upload-tile consultation-upload-tile--${kind}${ready ? " is-ready" : ""}`}>
            <div className="consultation-upload-tile__heading">
                <span aria-hidden="true">{ready ? "✓" : kind === "frontal" ? "◉" : "◐"}</span>
                <div>
                    <h3>{label}</h3>
                    <p>{guidance}</p>
                </div>
            </div>
            <input
                ref={inputRef}
                id={inputId}
                className="consultation-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={disabled || remoteReady}
                aria-label={label}
                aria-describedby={statusId}
                onChange={(event) =>
                    void onSelect(kind, event.target.files?.[0] ?? null)
                }
            />
            {!remoteReady && (
                <label className="consultation-upload-tile__action" htmlFor={inputId}>
                    {file ? "Substituir fotografia" : "Escolher fotografia"}
                </label>
            )}
            <div id={statusId} className="consultation-upload-tile__status" role="status">
                {remoteReady && <span>Fotografia confirmada e guardada.</span>}
                {file && <span className="consultation-upload-tile__filename">{file.name}</span>}
                {preflight.status === "checking" && <span>A verificar fotografia…</span>}
                {preflight.status === "valid" && <span>Pronta para envio.</span>}
                {preflight.errors.map((error) => (
                    <span className="is-error" key={error}>{error}</span>
                ))}
                {preflight.warnings.map((warning) => (
                    <span key={warning}>{warning}</span>
                ))}
            </div>
            {(previewUrl || (remoteReady && previewStatus === "loading")) && (
                <div className="consultation-upload-tile__preview">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={`Pré-visualização da ${label.toLowerCase()}`}
                        />
                    ) : (
                        <span role="status">A carregar pré-visualização…</span>
                    )}
                </div>
            )}
            {remoteReady && previewStatus === "error" && !previewUrl && (
                <p className="consultation-upload-tile__preview-error" role="status">
                    Não foi possível apresentar a pré-visualização.
                </p>
            )}
        </article>
    );
}

/**
 * Só inicia a análise depois das validações locais, consentimentos e decisões
 * remotas terem terminado. Nenhum dado biométrico é persistido no browser.
 */
export function NewConsultationPage() {
    const navigate = useNavigate();
    const availability = useConsultationAvailability();
    const resumableSessionRef = useRef(null);
    const uploadedPhotosRef = useRef(null);
    const preflightGenerationRef = useRef({ frontal: 0, perfil: 0 });
    const stepHeadingRef = useRef(null);
    const warningHeadingRef = useRef(null);
    const frontalInputRef = useRef(null);
    const previousStepRef = useRef(1);

    const [currentStep, setCurrentStep] = useState(1);
    const [primaryGoal, setPrimaryGoal] = useState("");
    const [secondaryGoals, setSecondaryGoals] = useState([]);
    const [consentAccepted, setConsentAccepted] = useState(false);
    const [providerConsentAccepted, setProviderConsentAccepted] = useState(false);
    const [files, setFiles] = useState({ frontal: null, perfil: null });
    const [confirmedPhotoItems, setConfirmedPhotoItems] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState(EMPTY_PHOTO_PREVIEWS);
    const [preflight, setPreflight] = useState({
        frontal: EMPTY_PREFLIGHT,
        perfil: EMPTY_PREFLIGHT,
    });
    const [formError, setFormError] = useState(null);
    const [photoWarnings, setPhotoWarnings] = useState([]);
    const [photoWarningsAcknowledged, setPhotoWarningsAcknowledged] =
        useState(false);
    const [submissionStage, setSubmissionStage] = useState("idle");

    const goalsResource = useAsyncResource(
        ({ signal }) => getConsultationGoals({ signal }),
        { initialData: null },
    );
    const consentResource = useAsyncResource(
        ({ signal }) => getFaceConsent({ signal }),
        { initialData: null },
    );
    const currentSessionResource = useAsyncResource(
        async ({ signal }) => {
            try {
                return await getCurrentConsultationSession({ signal });
            } catch (error) {
                if (error?.status === 404) return null;
                throw error;
            }
        },
        { initialData: null },
    );

    const startAction = useAsyncAction(async ({ signal }) => {
        setSubmissionStage("preparing");
        const requirement = consentResource.data?.providerConsentRequirement;
        await acceptFaceConsent(
            {
                accepted: true,
                version: "face-analysis-v2",
                providerConsentAccepted:
                    requirement?.required === true
                        ? providerConsentAccepted
                        : false,
                provider:
                    requirement?.required === true ? "openai" : undefined,
                noticeVersion:
                    requirement?.noticeVersion ??
                    availability.capability?.noticeVersion ??
                    undefined,
                generativeEditAccepted: false,
                consultantPhotoAccessAccepted: false,
            },
            { signal },
        );

        const session =
            resumableSessionRef.current ??
            (await createConsultationSession(
                { primaryGoal, secondaryGoals },
                { signal },
            ));
        resumableSessionRef.current = session;

        let photos = uploadedPhotosRef.current;
        if (!Array.isArray(photos) || photos.length < 2) {
            const [frontal, perfil] = await Promise.all([
                compressImageForUpload(files.frontal),
                compressImageForUpload(files.perfil),
            ]);
            setSubmissionStage("uploading");
            photos = await uploadFacePhotos({ frontal, perfil }, { signal });
            uploadedPhotosRef.current = photos;
        }

        const uploadWarnings = getUploadPhotoWarnings(photos);
        if (uploadWarnings.length > 0 && !photoWarningsAcknowledged) {
            return {
                requiresPhotoWarningAcknowledgement: true,
                session,
                warnings: uploadWarnings,
            };
        }

        setSubmissionStage("starting");
        return startConsultationAnalysis(
            session.id,
            {
                acknowledgePhotoWarnings:
                    photoWarningsAcknowledged &&
                    (uploadWarnings.length > 0 || photoWarnings.length > 0),
            },
            { signal },
        );
    });

    const loadGoals = goalsResource.load;
    const loadConsent = consentResource.load;
    const loadCurrentSession = currentSessionResource.load;

    useEffect(() => {
        if (availability.status !== "success" || !availability.available) return;
        void loadGoals();
        void loadConsent();
        void loadCurrentSession();
    }, [
        availability.available,
        availability.status,
        loadConsent,
        loadCurrentSession,
        loadGoals,
    ]);

    useEffect(() => {
        if (previousStepRef.current === currentStep) return undefined;
        previousStepRef.current = currentStep;
        const frame = window.requestAnimationFrame(() => {
            stepHeadingRef.current?.focus({ preventScroll: true });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [currentStep]);

    useEffect(() => {
        if (photoWarnings.length === 0) return undefined;
        const frame = window.requestAnimationFrame(() => {
            warningHeadingRef.current?.focus();
        });
        return () => window.cancelAnimationFrame(frame);
    }, [photoWarnings]);

    useEffect(() => {
        const current = currentSessionResource.data;
        const phase = getSessionPhase(current);
        if (!current || !["collecting_goal", "collecting_photos"].includes(phase)) {
            return;
        }
        if (phase === "collecting_photos" && consentResource.status !== "success") {
            return;
        }

        resumableSessionRef.current = current;
        const primary =
            current.goals?.primaryGoal ??
            current.goals?.primary?.code ??
            current.goals?.primary ??
            "";
        const secondary =
            current.goals?.secondaryGoals ?? current.goals?.secondary ?? [];
        if (primary) setPrimaryGoal(String(primary));
        if (Array.isArray(secondary)) {
            setSecondaryGoals(
                secondary
                    .map((goal) => String(goal?.code ?? goal))
                    .filter(Boolean)
                    .slice(0, 2),
            );
        }

        if (phase === "collecting_goal") {
            setCurrentStep(1);
            return;
        }

        const consentMatches = hasMatchingFaceAnalysisConsent(
            consentResource.data,
        );
        if (consentMatches) {
            setConsentAccepted(true);
            setProviderConsentAccepted(
                consentResource.data?.providerConsentRequirement?.required === true,
            );
        }
        setCurrentStep(consentMatches ? 4 : 3);

        const sessionPhotos = current.photos?.items ?? [];
        if (current.photos?.requiresNewPhotos === true) {
            uploadedPhotosRef.current = null;
            setConfirmedPhotoItems([]);
            setFiles({ frontal: null, perfil: null });
            setPreflight({
                frontal: EMPTY_PREFLIGHT,
                perfil: EMPTY_PREFLIGHT,
            });
            setPhotoWarnings([]);
            setPhotoWarningsAcknowledged(false);
            return;
        }
        if (current.photos?.ready === true && sessionPhotos.length >= 2) {
            uploadedPhotosRef.current = sessionPhotos;
            setConfirmedPhotoItems(sessionPhotos);
            const warnings = getSessionPhotoWarnings(current);
            setPhotoWarnings(
                current.photos?.requiresWarningConfirmation === true &&
                    warnings.length === 0
                    ? ["A análise detetou limitações de enquadramento ou iluminação."]
                    : warnings,
            );
            setPhotoWarningsAcknowledged(false);
        }
    }, [
        consentResource.data,
        consentResource.status,
        currentSessionResource.data,
    ]);

    useEffect(() => {
        if (currentStep !== 4 || typeof URL.createObjectURL !== "function") {
            setPhotoPreviews(EMPTY_PHOTO_PREVIEWS);
            return undefined;
        }

        const objectUrls = [];
        const localPreviews = { frontal: "", perfil: "" };
        for (const kind of ["frontal", "perfil"]) {
            if (!files[kind]) continue;
            const url = URL.createObjectURL(files[kind]);
            objectUrls.push(url);
            localPreviews[kind] = url;
        }

        if (objectUrls.length > 0) {
            setPhotoPreviews({ ...localPreviews, status: "ready" });
            return () => {
                objectUrls.forEach((url) => URL.revokeObjectURL(url));
            };
        }

        const analysisId = currentSessionResource.data?.analysis?.id;
        if (confirmedPhotoItems.length < 2 || !analysisId) {
            setPhotoPreviews(EMPTY_PHOTO_PREVIEWS);
            return undefined;
        }

        const controller = new AbortController();
        let active = true;
        setPhotoPreviews({ frontal: "", perfil: "", status: "loading" });

        void Promise.all(
            ["frontal", "perfil"].map((kind) =>
                downloadOwnedConsultationPhoto(analysisId, kind, {
                    signal: controller.signal,
                }),
            ),
        )
            .then(([frontal, perfil]) => {
                if (!active) return;
                const frontalUrl = URL.createObjectURL(frontal);
                const perfilUrl = URL.createObjectURL(perfil);
                objectUrls.push(frontalUrl, perfilUrl);
                setPhotoPreviews({
                    frontal: frontalUrl,
                    perfil: perfilUrl,
                    status: "ready",
                });
            })
            .catch((error) => {
                if (!active || error?.name === "AbortError") return;
                setPhotoPreviews({ frontal: "", perfil: "", status: "error" });
            });

        return () => {
            active = false;
            controller.abort();
            objectUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [
        confirmedPhotoItems,
        currentSessionResource.data?.analysis?.id,
        currentStep,
        files,
    ]);

    /** Valida localmente uma fotografia antes de qualquer transmissão. */
    async function selectPhoto(kind, file) {
        const generation = preflightGenerationRef.current[kind] + 1;
        preflightGenerationRef.current[kind] = generation;
        uploadedPhotosRef.current = null;
        setPhotoWarnings([]);
        setPhotoWarningsAcknowledged(false);
        setFiles((current) => ({ ...current, [kind]: file }));
        if (!file) {
            setPreflight((current) => ({
                ...current,
                [kind]: EMPTY_PREFLIGHT,
            }));
            return;
        }

        setPreflight((current) => ({
            ...current,
            [kind]: { status: "checking", errors: [], warnings: [] },
        }));
        const result = await inspectPhotoFile(file, { expectedKind: kind });
        if (preflightGenerationRef.current[kind] !== generation) return;
        setPreflight((current) => ({
            ...current,
            [kind]: {
                status: result.ok ? "valid" : "invalid",
                errors: result.errors,
                warnings: result.warnings ?? [],
            },
        }));
    }

    /** Limpa o par completo, porque frontal e perfil são validados em conjunto. */
    function chooseNewPhotoPair() {
        uploadedPhotosRef.current = null;
        setConfirmedPhotoItems([]);
        setFiles({ frontal: null, perfil: null });
        setPreflight({ frontal: EMPTY_PREFLIGHT, perfil: EMPTY_PREFLIGHT });
        setPhotoWarnings([]);
        setPhotoWarningsAcknowledged(false);
        setFormError(null);
        window.requestAnimationFrame(() => frontalInputRef.current?.focus());
    }

    /** Mantém exclusividade entre objetivo principal e secundários. */
    function choosePrimaryGoal(code) {
        setPrimaryGoal(code);
        setSecondaryGoals((current) => current.filter((item) => item !== code));
        setFormError(null);
    }

    /** Aplica o máximo de dois objetivos secundários sem esconder opções. */
    function toggleSecondaryGoal(code, checked) {
        setSecondaryGoals((current) => {
            if (!checked) return current.filter((item) => item !== code);
            if (current.includes(code) || current.length >= 2) return current;
            return [...current, code];
        });
    }

    /** Avança apenas quando os dados obrigatórios do passo atual são válidos. */
    function continueWizard() {
        setFormError(null);
        if (currentStep === 1 && !primaryGoal) {
            setFormError("Escolhe um objetivo principal para continuar.");
            return;
        }
        const providerRequired =
            consentResource.data?.providerConsentRequirement?.required === true;
        if (
            currentStep === 3 &&
            (!consentAccepted || (providerRequired && !providerConsentAccepted))
        ) {
            setFormError("Confirma os consentimentos necessários para continuar.");
            return;
        }
        setCurrentStep((step) => Math.min(step + 1, WIZARD_STEPS.length));
    }

    /** Submete o último passo e interpreta apenas códigos públicos conhecidos. */
    async function submitNewConsultation(event) {
        event.preventDefault();
        setFormError(null);
        const providerRequired =
            consentResource.data?.providerConsentRequirement?.required === true;
        if (!primaryGoal) {
            setCurrentStep(1);
            setFormError("Escolhe um objetivo principal.");
            return;
        }
        if (!consentAccepted || (providerRequired && !providerConsentAccepted)) {
            setCurrentStep(3);
            setFormError("Confirma os consentimentos necessários para esta análise.");
            return;
        }

        const photosAlreadyUploaded =
            Array.isArray(uploadedPhotosRef.current) &&
            uploadedPhotosRef.current.length >= 2;
        if (
            !photosAlreadyUploaded &&
            (!files.frontal ||
                !files.perfil ||
                preflight.frontal.status !== "valid" ||
                preflight.perfil.status !== "valid")
        ) {
            setFormError("Escolhe uma fotografia frontal e outra de perfil válidas.");
            return;
        }
        if (photoWarnings.length > 0 && !photoWarningsAcknowledged) {
            setFormError("Confirma os avisos antes de continuares com estas fotografias.");
            return;
        }

        const result = await startAction.run();
        setSubmissionStage("idle");
        const errorCode = result.error?.details?.code ?? result.error?.code ?? "";
        if (errorCode === "FACE_PHOTO_QUALITY_FAILED") {
            chooseNewPhotoPair();
            setFormError(
                "A avaliação não conseguiu confirmar este par. Escolhe novas fotografias.",
            );
            return;
        }
        if (errorCode === "PHOTO_WARNINGS_CONFIRMATION_REQUIRED") {
            const warnings = getUploadPhotoWarnings(uploadedPhotosRef.current);
            setPhotoWarnings(
                warnings.length > 0
                    ? warnings
                    : ["A análise detetou limitações de enquadramento ou iluminação."],
            );
            setPhotoWarningsAcknowledged(false);
            return;
        }
        if (errorCode === "OPEN_CONSULTATION_EXISTS") {
            navigate("/consulta/ativa", { replace: true });
            return;
        }
        if (result.data?.requiresPhotoWarningAcknowledgement) {
            const warnings = getPublicPhotoWarnings({
                status: "warning",
                warnings: result.data.warnings,
            });
            setPhotoWarnings(warnings);
            setPhotoWarningsAcknowledged(false);
            return;
        }
        if (result.ok && result.data) {
            navigate(getSessionDestination(result.data), { replace: true });
        }
    }

    const goals = goalsResource.data?.goals ?? [];
    const isLoading = [
        goalsResource.status,
        consentResource.status,
        currentSessionResource.status,
    ].some((status) => status === "idle" || status === "loading");
    const isBusy = startAction.status === "loading";
    const providerAvailable = availability.available;
    const currentSession = currentSessionResource.data;
    const currentPhase = getSessionPhase(currentSession);
    const requiresNewPhotos = currentSession?.photos?.requiresNewPhotos === true;
    const remotePhotosReady = confirmedPhotoItems.length >= 2;
    const freshPhotosReady =
        files.frontal &&
        files.perfil &&
        preflight.frontal.status === "valid" &&
        preflight.perfil.status === "valid";
    const photosReady = remotePhotosReady || freshPhotosReady;
    const activeStep = WIZARD_STEPS[currentStep - 1];

    if (availability.status === "loading" || availability.status === "idle") {
        return (
            <section className="consultation-flow consultation-new">
                <PageHero
                    eyebrow="Nova consulta"
                    title="A preparar o teu percurso"
                    description="Estamos a confirmar a disponibilidade da consulta."
                />
                <Skeleton lines={4} />
            </section>
        );
    }

    if (!providerAvailable) {
        return (
            <section className="consultation-flow consultation-new">
                <PageHero
                    eyebrow="Nova consulta"
                    title="Voltaremos a cuidar deste percurso em breve"
                    description="A consulta guiada está temporariamente indisponível, mas o resto da tua experiência Orélle continua acessível."
                />
                <EmptyState
                    title="Consulta temporariamente indisponível"
                    description="Podes consultar os teus relatórios anteriores, manter a rotina ou explorar produtos selecionados."
                    action={
                        <div className="flow-actions">
                            <OrelleActionLink to="/consulta/historico">Ver histórico</OrelleActionLink>
                            <OrelleActionLink variant="secondary" to="/produtos">Explorar produtos</OrelleActionLink>
                        </div>
                    }
                />
            </section>
        );
    }

    return (
        <section className="consultation-flow consultation-new">
            <header className="consultation-wizard-hero">
                <div>
                    <p className="app-kicker">Nova consulta</p>
                    <h1>Vamos conhecer a tua pele</h1>
                    <p>Quatro passos simples para personalizarmos a tua experiência.</p>
                </div>
                <span>4 passos · cerca de 2 minutos</span>
            </header>

            {currentSession && currentPhase === "collecting_photos" && (
                <aside className="consultation-resume-strip" role="status">
                    <strong>
                        {photoWarnings.length > 0
                            ? "Precisamos da tua decisão."
                            : "O teu progresso está guardado."}
                    </strong>
                    <span>
                        {photoWarnings.length > 0
                            ? "Revê os avisos de qualidade e escolhe como queres continuar."
                            : requiresNewPhotos
                            ? "Precisamos de um novo par de fotografias."
                            : "A análise terminou e precisa da tua confirmação."}
                    </span>
                </aside>
            )}

            <ConsultationStepper currentStep={currentStep} />

            {isLoading ? (
                <Skeleton lines={4} label="A preparar o formulário seguro" />
            ) : (
                <form className="consultation-wizard" onSubmit={submitNewConsultation} noValidate>
                    <ErrorSummary
                        error={
                            goalsResource.error ??
                            consentResource.error ??
                            currentSessionResource.error ??
                            formError ??
                            startAction.error
                        }
                        id="new-consultation-error"
                    />

                    <section className="consultation-wizard__card" aria-labelledby="consultation-step-title">
                        <header className="consultation-wizard__heading">
                            <div>
                                <span>Passo {currentStep} de {WIZARD_STEPS.length}</span>
                                <h2 id="consultation-step-title" ref={stepHeadingRef} tabIndex={-1}>
                                    {activeStep.title}
                                </h2>
                            </div>
                            {currentStep === 2 && (
                                <span>{secondaryGoals.length}/2 selecionados</span>
                            )}
                            {currentStep === 4 && photoWarnings.length > 0 && (
                                <span className="consultation-wizard__decision-badge">
                                    Decisão necessária
                                </span>
                            )}
                        </header>

                        {currentStep === 1 && (
                            <fieldset className="consultation-wizard__fieldset">
                                <legend>Escolhe a prioridade desta consulta</legend>
                                <div className="consultation-goal-grid consultation-goal-grid--primary">
                                    {goals.map((goal) => (
                                        <label key={goal.code} className="consultation-option-card">
                                            <input
                                                type="radio"
                                                name="primary-goal"
                                                value={goal.code}
                                                checked={primaryGoal === goal.code}
                                                onChange={() => choosePrimaryGoal(goal.code)}
                                                disabled={isBusy}
                                            />
                                            <strong>{goal.label}</strong>
                                            <span>{goal.description}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        )}

                        {currentStep === 2 && (
                            <fieldset className="consultation-wizard__fieldset">
                                <legend>Seleciona até dois, ou continua sem escolher</legend>
                                <div className="consultation-goal-grid consultation-goal-grid--secondary">
                                    {goals.map((goal) => {
                                        const selected = secondaryGoals.includes(goal.code);
                                        const unavailable =
                                            goal.code === primaryGoal ||
                                            (!selected && secondaryGoals.length >= 2);
                                        return (
                                            <label key={goal.code} className="consultation-option-card consultation-option-card--compact">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    disabled={unavailable || isBusy}
                                                    onChange={(event) =>
                                                        toggleSecondaryGoal(goal.code, event.target.checked)
                                                    }
                                                />
                                                <strong>{goal.label}</strong>
                                            </label>
                                        );
                                    })}
                                </div>
                            </fieldset>
                        )}

                        {currentStep === 3 && (
                            <div className="consultation-consent-step">
                                <p>
                                    Usamos as fotografias apenas para criar esta avaliação cosmética e respeitamos as tuas escolhas de privacidade.
                                </p>
                                <label className="consultation-consent-choice">
                                    <input
                                        type="checkbox"
                                        checked={consentAccepted}
                                        onChange={(event) => setConsentAccepted(event.target.checked)}
                                        disabled={isBusy}
                                    />
                                    <span>
                                        <strong>Autorizo a avaliação cosmética</strong>
                                        Aceito o tratamento das fotografias e dos dados desta consulta.
                                    </span>
                                </label>
                                {consentResource.data?.providerConsentRequirement?.required && (
                                    <label className="consultation-consent-choice">
                                        <input
                                            type="checkbox"
                                            checked={providerConsentAccepted}
                                            onChange={(event) => setProviderConsentAccepted(event.target.checked)}
                                            disabled={isBusy}
                                        />
                                        <span>
                                            <strong>Autorizo o processamento pela OpenAI</strong>
                                            Apenas para esta consulta, sem autorização de treino.
                                        </span>
                                    </label>
                                )}
                                <details className="consultation-consent-details">
                                    <summary>Que informação é enviada?</summary>
                                    <ul>
                                        <li>as fotografias frontal e de perfil;</li>
                                        <li>as respostas e os factos cosméticos derivados;</li>
                                        <li>o perfil mínimo relevante, como pele, alergias, restrições e orçamento;</li>
                                        <li>uma seleção curta do catálogo já filtrado, sem nome, email ou identificadores da conta.</li>
                                    </ul>
                                </details>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="consultation-photo-step" id="consultation-photo-upload">
                                <div className="consultation-photo-step__uploads">
                                    <PhotoUploadTile
                                        kind="frontal"
                                        label="Fotografia frontal"
                                        guidance="Olha diretamente para a câmara."
                                        file={files.frontal}
                                        preflight={preflight.frontal}
                                        remoteReady={remotePhotosReady}
                                        previewUrl={photoPreviews.frontal}
                                        previewStatus={photoPreviews.status}
                                        disabled={isBusy}
                                        inputRef={frontalInputRef}
                                        onSelect={selectPhoto}
                                    />
                                    <PhotoUploadTile
                                        kind="perfil"
                                        label="Fotografia de perfil"
                                        guidance="Roda o rosto entre 35° e 75°."
                                        file={files.perfil}
                                        preflight={preflight.perfil}
                                        remoteReady={remotePhotosReady}
                                        previewUrl={photoPreviews.perfil}
                                        previewStatus={photoPreviews.status}
                                        disabled={isBusy}
                                        onSelect={selectPhoto}
                                    />
                                </div>

                                <aside
                                    className={`consultation-photo-review${photoWarnings.length > 0 || requiresNewPhotos ? " consultation-photo-review--warning" : ""}`}
                                    role={photoWarnings.length > 0 ? "region" : undefined}
                                    aria-live={photoWarnings.length > 0 ? "polite" : undefined}
                                    aria-labelledby={photoWarnings.length > 0 ? "photo-warning-title" : undefined}
                                >
                                    {photoWarnings.length > 0 ? (
                                        <>
                                            <header className="consultation-photo-review__header">
                                                <span className="consultation-photo-review__icon" aria-hidden="true">!</span>
                                                <div>
                                                    <span className="consultation-photo-review__eyebrow">Atenção à qualidade</span>
                                                    <h3 id="photo-warning-title" ref={warningHeadingRef} tabIndex={-1}>
                                                        Precisamos da tua decisão
                                                    </h3>
                                                    <p>As fotografias podem ser usadas, mas estas limitações podem reduzir a precisão da avaliação.</p>
                                                </div>
                                            </header>
                                            <div className="consultation-photo-review__warnings">
                                                <strong>O que detetámos</strong>
                                                <ul>
                                                    {photoWarnings.map((warning) => (
                                                        <li key={warning}>{warning}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <label className={`consultation-warning-confirmation${photoWarningsAcknowledged ? " is-selected" : ""}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={photoWarningsAcknowledged}
                                                    onChange={(event) => setPhotoWarningsAcknowledged(event.target.checked)}
                                                    disabled={isBusy}
                                                />
                                                <span>
                                                    <strong>Continuar com estas fotografias</strong>
                                                    <small>Compreendo e quero continuar com este par.</small>
                                                </span>
                                            </label>
                                            <p className="consultation-photo-review__recommendation">
                                                <strong>Recomendado:</strong> escolhe novas fotografias para obteres uma avaliação mais fiável.
                                            </p>
                                        </>
                                    ) : requiresNewPhotos && !freshPhotosReady ? (
                                        <>
                                            <span className="consultation-photo-review__icon" aria-hidden="true">↻</span>
                                            <h3>Precisamos de novas fotografias</h3>
                                            <p>A avaliação anterior não permitiu confirmar a qualidade necessária. Escolhe um novo par.</p>
                                        </>
                                    ) : (
                                        <>
                                            <span className="consultation-photo-review__icon" aria-hidden="true">✦</span>
                                            <h3>Antes de continuares</h3>
                                            <ul>
                                                <li>Usa luz frontal uniforme e um fundo simples.</li>
                                                <li>Limpa a lente e mantém o rosto centrado.</li>
                                                <li>Afasta o cabelo e não uses filtros ou maquilhagem.</li>
                                            </ul>
                                        </>
                                    )}
                                </aside>
                            </div>
                        )}

                        <footer className="consultation-wizard__actions">
                            {currentStep > 1 && (
                                <OrelleButton
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setFormError(null);
                                        setCurrentStep((step) => Math.max(1, step - 1));
                                    }}
                                    disabled={isBusy}
                                >
                                    Voltar
                                </OrelleButton>
                            )}
                            {currentStep < 4 ? (
                                <OrelleButton type="button" onClick={continueWizard} disabled={isBusy}>
                                    Continuar
                                </OrelleButton>
                            ) : photoWarnings.length > 0 ? (
                                <>
                                    <OrelleButton type="button" variant="secondary" onClick={chooseNewPhotoPair} disabled={isBusy}>
                                        Escolher novas fotografias
                                    </OrelleButton>
                                    <OrelleButton type="submit" disabled={isBusy || !photoWarningsAcknowledged}>
                                        {isBusy ? SUBMISSION_LABELS[submissionStage] : "Continuar mesmo assim"}
                                    </OrelleButton>
                                </>
                            ) : (
                                <OrelleButton type="submit" disabled={isBusy || !photosReady}>
                                    {isBusy ? SUBMISSION_LABELS[submissionStage] : "Iniciar análise"}
                                </OrelleButton>
                            )}
                        </footer>

                        {isBusy && (
                            <p className="consultation-submission-status" role="status" aria-live="polite">
                                {SUBMISSION_LABELS[submissionStage]}
                            </p>
                        )}
                    </section>
                </form>
            )}
        </section>
    );
}
