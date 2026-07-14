/** Segundo wizard acessível e retomável da consulta cosmética Orélle. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ErrorSummary } from "../../components/ErrorSummary.jsx";
import { Skeleton, StatusBanner } from "../../components/OrelleUi.jsx";
import { useAsyncAction } from "../../hooks/useAsyncAction.js";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import {
    answerConsultationQuestion,
    cancelConsultationSession,
    editConsultationAnswer,
    getCurrentConsultationSession,
    retryConsultationSession,
    submitConsultationSession,
} from "./consultationApi.js";
import {
    CONSULTATION_GOAL_FALLBACKS,
    getConsultationPollDelay,
    getCurrentQuestion,
    getSessionDestination,
    getSessionPhase,
    isQuestionAnswerPresent,
    normalizeQuestion,
    QUESTION_TYPES,
    shouldPollConsultation,
    toCanonicalQuestionValue,
    toQuestionDisplayValue,
} from "./consultationModel.js";

const ASYNC_PHASE_COPY = Object.freeze({
    analyzing: {
        title: "A analisar as fotografias",
        description:
            "Estamos a ler a pele e a preparar as perguntas personalizadas.",
    },
    generating_report: {
        title: "A preparar o teu relatório",
        description:
            "Estamos a organizar as respostas e recomendações. Este processo pode demorar alguns minutos.",
    },
    review_pending: {
        title: "Revisão humana em curso",
        description:
            "O teu pedido foi guardado e podes acompanhar o estado no dashboard da consulta.",
    },
});
const SAVE_FEEDBACK_LABELS = Object.freeze({
    guardado: "Guardado",
    "a guardar": "A guardar…",
    "por guardar": "Alterações por guardar",
});
const PROFILE_RESTRICTIONS_UPDATE_REQUIRED =
    "PROFILE_RESTRICTIONS_UPDATE_REQUIRED";

/** Cria um valor vazio adequado ao controlo sem responder pelo utilizador. */
function initialQuestionValue(question, persistedValue = undefined) {
    if (persistedValue !== undefined) {
        return toQuestionDisplayValue(question, persistedValue);
    }
    if (question?.type === "multi_select") return [];
    if (question?.type === "scale") return question.min;
    return "";
}

/** Formulário visual associado a um único slot canónico. */
function QuestionControl({ question, value, onChange, disabled }) {
    const inputId = `consultation-answer-${question.id}`;
    const presentation = question.presentation ?? {};

    if (["single_select", "multi_select"].includes(question.type)) {
        const multiple = question.type === "multi_select";
        const selected = multiple && Array.isArray(value) ? value : [];
        const descriptions = presentation.optionDescriptions ?? {};
        const exclusiveGroups = Array.isArray(presentation.exclusiveGroups)
            ? presentation.exclusiveGroups
            : [];
        const renderOption = (option) => {
            const checked = multiple
                ? selected.includes(option.value)
                : value === option.value;
            const description = descriptions[option.value];
            const recommended =
                presentation.recommendedOption === option.value;
            return (
                <label
                    className={`questionnaire-option${checked ? " is-selected" : ""}`}
                    key={option.value}
                >
                    <input
                        type={multiple ? "checkbox" : "radio"}
                        name={inputId}
                        value={option.value}
                        checked={checked}
                        onChange={(event) => {
                            if (!multiple) {
                                onChange(event.target.value);
                                return;
                            }
                            if (!event.target.checked) {
                                onChange(
                                    selected.filter(
                                        (item) => item !== option.value,
                                    ),
                                );
                                return;
                            }
                            const exclusiveGroup = exclusiveGroups.find(
                                (group) =>
                                    Array.isArray(group) &&
                                    group.includes(option.value),
                            );
                            const retained = exclusiveGroup
                                ? selected.filter(
                                      (item) =>
                                          !exclusiveGroup.includes(item),
                                  )
                                : selected;
                            onChange([...retained, option.value]);
                        }}
                        disabled={disabled}
                    />
                    <span className="questionnaire-option__copy">
                        <strong>{option.label}</strong>
                        {recommended ? (
                            <small className="questionnaire-option__badge">
                                Recomendado
                            </small>
                        ) : null}
                        {description ? <small>{description}</small> : null}
                    </span>
                </label>
            );
        };
        const optionByValue = new Map(
            question.options.map((option) => [option.value, option]),
        );
        const groups = Array.isArray(presentation.groups)
            ? presentation.groups
                  .map((group) => ({
                      ...group,
                      options: (group.options ?? [])
                          .map((option) => optionByValue.get(option))
                          .filter(Boolean),
                  }))
                  .filter((group) => group.options.length > 0)
            : [];
        return (
            <fieldset
                className={`questionnaire-options questionnaire-options--${presentation.control ?? "default"}`}
            >
                <legend>{multiple ? "Podes escolher várias opções" : "Escolhe uma opção"}</legend>
                {groups.length > 0 ? (
                    <div className="questionnaire-option-groups">
                        {groups.map((group) => (
                            <section
                                className="questionnaire-option-group"
                                key={group.label}
                            >
                                <h3>{group.label}</h3>
                                <div className="questionnaire-options__grid">
                                    {group.options.map(renderOption)}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="questionnaire-options__grid">
                        {question.options.map(renderOption)}
                    </div>
                )}
                {presentation.helper ? <small>{presentation.helper}</small> : null}
            </fieldset>
        );
    }

    if (question.type === "scale") {
        const values = Array.from(
            { length: question.max - question.min + 1 },
            (_, index) => question.min + index,
        );
        return (
            <fieldset className="questionnaire-scale">
                <legend>Escolhe o valor que melhor descreve a tua situação</legend>
                <div className="questionnaire-scale__labels">
                    <span>{presentation.minLabel ?? "Menor"}</span>
                    <span>{presentation.maxLabel ?? "Maior"}</span>
                </div>
                <div className="questionnaire-scale__values">
                    {values.map((scaleValue) => (
                        <label className={value === scaleValue ? "is-selected" : ""} key={scaleValue}>
                            <input
                                type="radio"
                                name={inputId}
                                value={scaleValue}
                                checked={value === scaleValue}
                                onChange={() => onChange(scaleValue)}
                                disabled={disabled}
                            />
                            <span>{scaleValue}</span>
                        </label>
                    ))}
                </div>
            </fieldset>
        );
    }

    if (question.type === "number") {
        const currency = presentation.control === "currency";
        const min = presentation.displayMin ?? question.min;
        const max = presentation.displayMax ?? question.max;
        return (
            <label className="questionnaire-number" htmlFor={inputId}>
                <span>{currency ? "Orçamento aproximado" : "A tua resposta"}</span>
                <div className="questionnaire-number__control">
                    {currency ? <span aria-hidden="true">€</span> : null}
                    <input
                        id={inputId}
                        type="number"
                        inputMode={currency ? "decimal" : "numeric"}
                        min={min}
                        max={max}
                        step={currency ? "0.01" : "1"}
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        disabled={disabled}
                    />
                    {!currency && presentation.unit ? <span>{presentation.unit}</span> : null}
                </div>
                {presentation.helper ? <small>{presentation.helper}</small> : null}
            </label>
        );
    }

    if (question.type === "short_text") {
        return (
            <label className="questionnaire-text" htmlFor={inputId}>
                <span>A tua resposta</span>
                {presentation.helper ? <small>{presentation.helper}</small> : null}
                <textarea
                    id={inputId}
                    maxLength={question.maxLength}
                    placeholder={presentation.example ?? "Escreve aqui…"}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    disabled={disabled}
                />
                <small className="questionnaire-text__counter">
                    {String(value).length}/{question.maxLength}
                </small>
            </label>
        );
    }

    return <p role="alert">Este formato de pergunta não está disponível.</p>;
}

/** Drawer modal para rever e iniciar a edição de respostas anteriores. */
function AnswersReviewDialog({ open, answers, onClose, onEdit }) {
    const closeRef = useRef(null);
    useEffect(() => {
        if (!open) return undefined;
        const previous = document.activeElement;
        closeRef.current?.focus();
        function onKeyDown(event) {
            if (event.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            previous?.focus?.();
        };
    }, [onClose, open]);

    if (!open) return null;
    return (
        <div
            className="questionnaire-dialog-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <aside className="questionnaire-dialog" role="dialog" aria-modal="true" aria-labelledby="answers-review-title">
                <header>
                    <div>
                        <p className="app-kicker">A tua consulta</p>
                        <h2 id="answers-review-title">Respostas guardadas</h2>
                    </div>
                    <button ref={closeRef} type="button" aria-label="Fechar revisão" onClick={onClose}>×</button>
                </header>
                {answers.length > 0 ? (
                    <ol className="questionnaire-answer-list">
                        {answers.map((answer, index) => (
                            <li key={answer.slotCode}>
                                <span>{String(index + 1).padStart(2, "0")}</span>
                                <div><strong>{answer.label}</strong><p>{answer.displayValue}</p></div>
                                {answer.editable ? (
                                    <button type="button" aria-label={`Editar: ${answer.label}`} onClick={() => onEdit(answer)}>Editar</button>
                                ) : null}
                            </li>
                        ))}
                    </ol>
                ) : <p>Ainda não existem respostas guardadas.</p>}
            </aside>
        </div>
    );
}

/** Experiência principal do segundo wizard. */
export function ActiveConsultationPage() {
    const navigate = useNavigate();
    const headingRef = useRef(null);
    const pollAttemptRef = useRef(0);
    const savedTimerRef = useRef(null);
    const conflictDraftRef = useRef(undefined);
    const [answer, setAnswer] = useState("");
    const [editingAnswer, setEditingAnswer] = useState(null);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [saveFeedback, setSaveFeedback] = useState("guardado");
    const [slowRequest, setSlowRequest] = useState(false);
    const sessionResource = useAsyncResource(
        ({ signal }) => getCurrentConsultationSession({ signal }),
        { initialData: null },
    );
    const mutation = useAsyncAction(
        async ({ signal }, operation, session, value, answerToEdit) => {
            if (operation === "answer") {
                const question = getCurrentQuestion(session);
                return answerConsultationQuestion(
                    session.id,
                    {
                        questionId: question.id,
                        revision: question.revision ?? session.revision,
                        value: toCanonicalQuestionValue(question, value),
                    },
                    { signal },
                );
            }
            if (operation === "edit") {
                const editQuestion = normalizeQuestion({
                    ...answerToEdit,
                    id: `edit-${answerToEdit.slotCode}`,
                });
                return editConsultationAnswer(
                    session.id,
                    answerToEdit.slotCode,
                    {
                        revision: session.revision,
                        value: toCanonicalQuestionValue(editQuestion, value),
                    },
                    { signal },
                );
            }
            if (operation === "submit") return submitConsultationSession(session.id, { signal });
            if (operation === "retry") return retryConsultationSession(session.id, { signal });
            if (operation === "cancel") return cancelConsultationSession(session.id, { signal });
            throw new Error("Operação de consulta inválida.");
        },
    );
    const loadSession = sessionResource.load;
    const setSessionData = sessionResource.setData;

    useEffect(() => { void loadSession(); }, [loadSession]);

    const session = sessionResource.data;
    const phase = getSessionPhase(session);
    const sessionDestination = getSessionDestination(session);
    const question = useMemo(() => getCurrentQuestion(session), [session]);
    const editQuestion = useMemo(
        () => editingAnswer
            ? normalizeQuestion({ ...editingAnswer, id: `edit-${editingAnswer.slotCode}` })
            : null,
        [editingAnswer],
    );
    const formQuestion = editQuestion ?? question;
    const busy = mutation.status === "loading";
    const mutationErrorCode =
        mutation.error?.details?.code ?? mutation.error?.code ?? null;
    const operationError = session?.operation?.error ?? null;
    const operationRequiresProfileUpdate =
        operationError?.code === PROFILE_RESTRICTIONS_UPDATE_REQUIRED;
    const answers = session?.conversation?.answers ?? [];
    const answeredCount = session?.conversation?.answeredCount ?? answers.length;
    const totalQuestions = session?.conversation?.totalQuestions ?? 8;
    const currentIndex = session?.conversation?.currentIndex ?? Math.min(answeredCount + 1, totalQuestions);
    const progress = totalQuestions > 0
        ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100))
        : 0;

    useEffect(() => {
        if (!session || !shouldPollConsultation(session)) {
            pollAttemptRef.current = 0;
            return undefined;
        }
        const timer = window.setTimeout(() => {
            pollAttemptRef.current += 1;
            void loadSession();
        }, getConsultationPollDelay(pollAttemptRef.current));
        return () => window.clearTimeout(timer);
    }, [loadSession, phase, session]);

    useEffect(() => {
        if (editingAnswer) return;
        if (conflictDraftRef.current !== undefined) {
            setAnswer(conflictDraftRef.current);
            conflictDraftRef.current = undefined;
        } else {
            setAnswer(initialQuestionValue(question));
        }
        setLocalError(null);
    }, [editingAnswer, question]);

    useEffect(() => {
        if (!formQuestion) return undefined;
        const frame = window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
        return () => window.cancelAnimationFrame(frame);
    }, [formQuestion]);

    useEffect(() => {
        if (!busy) {
            setSlowRequest(false);
            return undefined;
        }
        const timer = window.setTimeout(() => setSlowRequest(true), 700);
        return () => window.clearTimeout(timer);
    }, [busy]);

    useEffect(() => () => window.clearTimeout(savedTimerRef.current), []);

    useEffect(() => {
        if (session && sessionDestination !== "/consulta/ativa") {
            navigate(sessionDestination, { replace: true });
        }
    }, [navigate, session, sessionDestination]);

    function beginEdit(item) {
        setEditingAnswer(item);
        const normalized = normalizeQuestion({ ...item, id: `edit-${item.slotCode}` });
        setAnswer(initialQuestionValue(normalized, item.value));
        setReviewOpen(false);
        setLocalError(null);
    }

    async function runMutation(operation, value = undefined) {
        if (!session) return;
        setLocalError(null);
        if (["answer", "edit"].includes(operation) && (!formQuestion || !isQuestionAnswerPresent(formQuestion, value))) {
            setLocalError("Completa a resposta antes de continuar.");
            return;
        }
        if (["answer", "edit"].includes(operation)) setSaveFeedback("a guardar");
        const result = await mutation.run(operation, session, value, editingAnswer);
        if (!result.ok || !result.data) {
            setSaveFeedback("por guardar");
            if (result.error?.status === 409) {
                conflictDraftRef.current = value;
                void loadSession();
            }
            return;
        }
        setSessionData(result.data);
        if (["answer", "edit"].includes(operation)) {
            setSaveFeedback("guardado");
            window.clearTimeout(savedTimerRef.current);
            savedTimerRef.current = window.setTimeout(() => setSaveFeedback("guardado"), 1_000);
        }
        if (operation === "edit") {
            setEditingAnswer(null);
            setReviewOpen(true);
        }
        if (operation === "cancel") navigate("/consulta", { replace: true });
    }

    if (sessionResource.status === "loading" && !session) {
        return <section className="consultation-questionnaire" aria-busy="true"><Skeleton label="A retomar a tua consulta" lines={5} /></section>;
    }

    if (session && sessionDestination !== "/consulta/ativa") {
        const returningToPhotos = sessionDestination === "/consulta/nova";
        return (
            <section className="consultation-questionnaire" aria-live="polite">
                <StatusBanner tone="info" title={returningToPhotos ? "Precisamos da tua confirmação" : "O teu relatório está pronto"}>
                    <p>{returningToPhotos ? "Revê as indicações das fotografias para continuares." : "Estamos a abrir o resultado da consulta."}</p>
                    <Link className="orelle-button" to={sessionDestination} replace>{returningToPhotos ? "Rever fotografias" : "Abrir relatório"}</Link>
                </StatusBanner>
            </section>
        );
    }

    if (!session) {
        return (
            <section className="consultation-questionnaire">
                <StatusBanner tone="info" title="Não existe uma consulta ativa"><Link className="orelle-button" to="/consulta/nova">Iniciar nova consulta</Link></StatusBanner>
            </section>
        );
    }

    const asyncCopy = ASYNC_PHASE_COPY[phase];
    const goals = [session.goals?.primaryGoal, ...(session.goals?.secondaryGoals ?? [])]
        .map((code) => CONSULTATION_GOAL_FALLBACKS[code]?.label)
        .filter(Boolean);
    const budget = answers.find((item) => item.slotCode === "budget_cents");
    const restrictions = answers.find((item) => item.slotCode === "allergies_restrictions");
    const makeupPlan = session.makeupPlan;

    return (
        <section className="consultation-questionnaire" aria-labelledby="questionnaire-page-title">
            <header className="questionnaire-progress">
                <div className="questionnaire-progress__copy">
                    <p className="app-kicker">Consulta cosmética guiada</p>
                    <h1 id="questionnaire-page-title">
                        {phase === "ready_for_report" ? "A tua consulta está completa" : "Uma pergunta de cada vez"}
                    </h1>
                    <p>{phase === "ready_for_report" ? `${answeredCount} respostas guardadas` : `Pergunta ${currentIndex} de ${totalQuestions}`}</p>
                </div>
                <div className="questionnaire-progress__bar" role="progressbar" aria-label="Progresso da consulta" aria-valuemin="0" aria-valuemax={totalQuestions} aria-valuenow={answeredCount}>
                    <span style={{ width: `${progress}%` }} />
                </div>
                <div className="questionnaire-progress__actions">
                    <span className={`questionnaire-save-state questionnaire-save-state--${saveFeedback.replaceAll(" ", "-")}`} aria-live="polite">{busy && slowRequest ? "A guardar e a preparar…" : SAVE_FEEDBACK_LABELS[saveFeedback]}</span>
                    <button type="button" className="orelle-button orelle-button--ghost" onClick={() => setReviewOpen(true)}>Rever respostas</button>
                    <Link className="orelle-button orelle-button--secondary" to="/consulta">Guardar e sair</Link>
                    <button type="button" className="questionnaire-more" aria-label="Mais opções" onClick={() => setCancelOpen(true)}>•••</button>
                </div>
            </header>

            <ErrorSummary error={sessionResource.error ?? mutation.error ?? localError} id="active-consultation-error" />
            {mutationErrorCode === PROFILE_RESTRICTIONS_UPDATE_REQUIRED ? (
                <p>
                    <Link
                        className="text-link"
                        to="/conta/perfil"
                        state={{ returnTo: "/consulta/ativa" }}
                    >
                        Atualizar agora as restrições do perfil
                    </Link>
                </p>
            ) : null}

            {asyncCopy ? (
                <section className="questionnaire-async-state" aria-live="polite" aria-busy={shouldPollConsultation(session)}>
                    <span className="questionnaire-async-state__mark" aria-hidden="true">✦</span>
                    <div><p className="app-kicker">Consulta em curso</p><h2>{asyncCopy.title}</h2><p>{asyncCopy.description}</p></div>
                    <Link className="orelle-button orelle-button--secondary" to="/consulta">Acompanhar no dashboard</Link>
                </section>
            ) : null}

            {!asyncCopy && phase === "failed_retryable" ? (
                <StatusBanner
                    tone="warning"
                    title={
                        operationRequiresProfileUpdate
                            ? "Atualiza as restrições antes de continuar"
                            : "A consulta foi interrompida"
                    }
                >
                    <p>
                        {operationRequiresProfileUpdate
                            ? "O relatório não foi iniciado porque o perfil precisa de ser confirmado. As respostas continuam guardadas."
                            : "O teu progresso está guardado. Podes repetir apenas a operação que falhou."}
                    </p>
                    {operationRequiresProfileUpdate ? (
                        <div className="questionnaire-final-review__actions">
                            <Link
                                className="orelle-button"
                                to="/conta/perfil"
                                state={{ returnTo: "/consulta/ativa" }}
                            >
                                Atualizar perfil
                            </Link>
                            <button
                                type="button"
                                className="orelle-button orelle-button--secondary"
                                onClick={() => setReviewOpen(true)}
                            >
                                Rever respostas
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => void runMutation("retry")} disabled={busy}>{busy ? "A tentar novamente…" : "Tentar novamente"}</button>
                    )}
                </StatusBanner>
            ) : null}

            {!asyncCopy && phase === "ready_for_report" ? (
                <section className="questionnaire-final-review">
                    <div className="questionnaire-final-review__intro"><p className="app-kicker">Última confirmação</p><h2>Confirma o essencial</h2><p>Revê os pontos que mais influenciam as recomendações antes de criares o relatório.</p></div>
                    <dl>
                        <div><dt>Objetivos</dt><dd>{goals.join(" · ") || "Objetivos guardados"}</dd></div>
                        <div><dt>Orçamento</dt><dd>{budget?.displayValue ?? "Não indicado"}</dd></div>
                        <div><dt>Alergias e restrições</dt><dd>{restrictions?.displayValue ?? "Não indicadas"}</dd></div>
                        {makeupPlan ? (
                            <div>
                                <dt>Plano de maquilhagem</dt>
                                <dd>
                                    <strong>{makeupPlan.depthLabel}</strong>
                                    {makeupPlan.functions?.length
                                        ? ` · ${makeupPlan.functions.map(({ label }) => label).join(", ")}`
                                        : " · Sem elementos visuais aplicáveis às regiões escolhidas"}
                                </dd>
                            </div>
                        ) : null}
                        <div><dt>Fotografias</dt><dd>{session.photos?.ready ? "Frontal e perfil confirmadas" : `${session.photos?.count ?? 0} de 2 confirmadas`}</dd></div>
                    </dl>
                    <div className="questionnaire-final-review__actions">
                        <button type="button" className="orelle-button orelle-button--secondary" onClick={() => setReviewOpen(true)}>Rever todas as respostas</button>
                        <button type="button" className="orelle-button" onClick={() => void runMutation("submit")} disabled={busy}>{busy ? "A iniciar o relatório…" : "Gerar o meu relatório"}</button>
                    </div>
                </section>
            ) : null}

            {!asyncCopy && formQuestion && (editingAnswer || ["asking_questions", "needs_clarification"].includes(phase)) ? (
                <form className="questionnaire-card" onSubmit={(event) => { event.preventDefault(); void runMutation(editingAnswer ? "edit" : "answer", answer); }}>
                    <header>
                        <p className="app-kicker">{editingAnswer ? "A editar resposta" : `Pergunta ${currentIndex} de ${totalQuestions}`}</p>
                        <h2 ref={headingRef} tabIndex={-1}>{formQuestion.label}</h2>
                    </header>
                    {formQuestion.slotCode === "allergies_restrictions" ? (
                        <p>
                            A consulta usa exclusivamente as restrições guardadas no teu perfil.{" "}
                            <Link
                                className="text-link"
                                to="/conta/perfil"
                                state={{ returnTo: "/consulta/ativa" }}
                            >
                                Consultar ou atualizar o perfil
                            </Link>
                        </p>
                    ) : null}
                    {QUESTION_TYPES.includes(formQuestion.type) ? <QuestionControl question={formQuestion} value={answer} onChange={(value) => { setAnswer(value); setSaveFeedback("por guardar"); }} disabled={busy} /> : <p role="alert">Formato de pergunta indisponível.</p>}
                    <footer>
                        {editingAnswer ? <button type="button" className="orelle-button orelle-button--ghost" onClick={() => { setEditingAnswer(null); setAnswer(initialQuestionValue(question)); setReviewOpen(true); }}>Cancelar edição</button> : <span>O teu progresso é guardado a cada resposta.</span>}
                        <button type="submit" className="orelle-button" disabled={busy || !QUESTION_TYPES.includes(formQuestion.type)}>{busy ? (slowRequest ? "A guardar e a preparar…" : "A guardar…") : editingAnswer ? "Guardar alteração" : "Guardar e continuar"}</button>
                    </footer>
                </form>
            ) : null}

            {!asyncCopy && phase === "asking_questions" && !formQuestion ? (
                <StatusBanner tone="info" title="A preparar a próxima pergunta"><p>A tua última resposta ficou guardada.</p><button type="button" onClick={() => void loadSession()}>Atualizar consulta</button></StatusBanner>
            ) : null}

            <AnswersReviewDialog open={reviewOpen} answers={answers} onClose={() => setReviewOpen(false)} onEdit={beginEdit} />

            {cancelOpen ? (
                <div className="questionnaire-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCancelOpen(false); }}>
                    <div className="questionnaire-confirm" role="alertdialog" aria-modal="true" aria-labelledby="cancel-consultation-title">
                        <p className="app-kicker">Atenção</p><h2 id="cancel-consultation-title">Cancelar esta consulta?</h2><p>O percurso atual será encerrado. Os relatórios anteriores continuam disponíveis.</p>
                        <div><button type="button" className="orelle-button orelle-button--secondary" onClick={() => setCancelOpen(false)}>Manter consulta</button><button type="button" className="orelle-button button--danger" onClick={() => void runMutation("cancel")} disabled={busy}>{busy ? "A cancelar…" : "Cancelar consulta"}</button></div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
