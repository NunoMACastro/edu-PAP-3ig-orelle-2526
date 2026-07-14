/**
 * Botão de submissão com estado ocupado visível.
 *
 * O bloqueio de integridade síncrono pertence ao handler da operação, porque o
 * estado React só fica refletido no DOM no render seguinte.
 *
 * @function SubmitButton
 * @param {{isBusy?: boolean, busyText?: string, disabled?: boolean, className?: string, children: import("react").ReactNode}} props - Estado do envio, texto de espera, bloqueio externo, classe opcional e conteudo visivel.
 * @returns {JSX.Element} Botao acessivel para formularios.
 */
export function SubmitButton({
    isBusy = false,
    busyText = "A guardar...",
    disabled = false,
    className = "",
    children,
}) {
    // O botão comunica o estado ocupado e impede nova interação após o render.
    const isDisabled = disabled || isBusy;
    const classNames = ["submit-button", isBusy ? "button--busy" : "", className]
        .filter(Boolean)
        .join(" ");

    return (
        <button
            className={classNames}
            type="submit"
            disabled={isDisabled}
            aria-busy={isBusy}
        >
            {isBusy ? busyText : children}
        </button>
    );
}
