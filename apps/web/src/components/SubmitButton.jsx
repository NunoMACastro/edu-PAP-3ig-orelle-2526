/**
 * Botao de submissao com estado ocupado e protecao contra duplo envio.
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
    // O botao fica bloqueado se o formulario estiver invalido ou se ja existir submissao em curso.
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
