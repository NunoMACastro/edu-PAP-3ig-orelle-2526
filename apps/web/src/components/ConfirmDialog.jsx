/**
 * Diálogo modal acessível para ações irreversíveis.
 *
 * Exige confirmação escrita, mantém o foco dentro do modal, fecha por Escape
 * quando não está busy e devolve o foco ao elemento que o abriu.
 */
import { useEffect, useId, useRef, useState } from "react";
import { ErrorSummary } from "./ErrorSummary.jsx";

const FOCUSABLE_SELECTOR = [
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "a[href]",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * @param {{open: boolean, title: string, description: string, confirmationText: string, confirmLabel: string, busy?: boolean, error?: object|string|null, onCancel: () => void, onConfirm: () => void|Promise<void>}} props - Contrato do modal.
 * @returns {JSX.Element|null} Modal acessível ou null quando fechado.
 */
export function ConfirmDialog({
    open,
    title,
    description,
    confirmationText,
    confirmLabel,
    busy = false,
    error = null,
    onCancel,
    onConfirm,
}) {
    const titleId = useId();
    const descriptionId = useId();
    const dialogRef = useRef(null);
    const inputRef = useRef(null);
    const previousFocusRef = useRef(null);
    const busyRef = useRef(busy);
    const onCancelRef = useRef(onCancel);
    const [typedConfirmation, setTypedConfirmation] = useState("");

    useEffect(() => {
        busyRef.current = busy;
        onCancelRef.current = onCancel;
    }, [busy, onCancel]);

    useEffect(() => {
        if (!open) return undefined;
        previousFocusRef.current = document.activeElement;
        setTypedConfirmation("");
        inputRef.current?.focus();

        function handleKeyDown(event) {
            if (event.key === "Escape" && !busyRef.current) {
                event.preventDefault();
                onCancelRef.current();
                return;
            }
            if (event.key !== "Tab") return;

            const focusable = [
                ...(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []),
            ];
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previousFocusRef.current?.focus?.();
        };
    }, [open]);

    useEffect(() => {
        if (open && busy) dialogRef.current?.focus();
    }, [busy, open]);

    if (!open) return null;
    const confirmed = typedConfirmation === confirmationText;

    return (
        <div className="dialog-backdrop">
            <section
                ref={dialogRef}
                className="confirm-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                aria-busy={busy}
                tabIndex={-1}
            >
                <h2 id={titleId}>{title}</h2>
                <p id={descriptionId}>{description}</p>
                <ErrorSummary
                    error={error}
                    id={`${descriptionId}-error`}
                    title="A operação não foi concluída"
                />
                <label>
                    Escreve {confirmationText} para confirmar
                    <input
                        ref={inputRef}
                        value={typedConfirmation}
                        onChange={(event) => setTypedConfirmation(event.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                        disabled={busy}
                    />
                </label>
                <div className="confirm-dialog__actions">
                    <button type="button" onClick={onCancel} disabled={busy}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="button--danger"
                        onClick={onConfirm}
                        disabled={!confirmed || busy}
                    >
                        {busy ? "A processar…" : confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
}
