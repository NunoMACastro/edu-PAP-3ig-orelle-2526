/**
 * Botão de submissão com estado ocupado e proteção contra duplo envio.
 *
 * @function SubmitButton
 * @param {{isBusy?: boolean, busyText?: string, disabled?: boolean, className?: string, children: import("react").ReactNode}} props - Estado do envio, texto de espera, bloqueio externo, classe opcional e conteúdo visível.
 * @returns {JSX.Element} Botão acessível para formulários.
 */
export function SubmitButton({
    isBusy = false,
    busyText = "A guardar...",
    disabled = false,
    className = "",
    children,
}) {
    // O botão fica bloqueado se o formulário estiver inválido ou se já existir uma submissão em curso.
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
            {/* O texto ocupado torna o estado visível em vez de deixar o utilizador sem resposta. */}
            {isBusy ? busyText : children}
        </button>
    );
}