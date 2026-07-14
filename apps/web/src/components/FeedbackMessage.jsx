const FEEDBACK_CONFIG = Object.freeze({
    error: {
        label: "Erro",
        role: "alert",
        ariaLive: "assertive",
        icon: "!",
    },
    success: {
        label: "Sucesso",
        role: "status",
        ariaLive: "polite",
        icon: "✓",
    },
    warning: {
        label: "Aviso",
        role: "alert",
        ariaLive: "assertive",
        icon: "!",
    },
    info: {
        label: "Informação",
        role: "status",
        ariaLive: "polite",
        icon: "i",
    },
});

/**
 * Mostra uma mensagem acessivel e consistente para formularios da Orelle.
 *
 * @function FeedbackMessage
 * @param {{id?: string, type?: "error"|"success"|"warning"|"info", children: import("react").ReactNode}} props - Identificador, tipo e conteudo seguro da mensagem.
 * @returns {JSX.Element|null} Mensagem formatada ou null quando nao existe conteudo.
 */
export function FeedbackMessage({ id, type = "info", children }) {
    if (!children) {
        return null;
    }

    // A tabela concentra labels e roles para todas as paginas anunciarem estados da mesma forma.
    const config = FEEDBACK_CONFIG[type] ?? FEEDBACK_CONFIG.info;

    return (
        <p
            id={id}
            className={`feedback feedback--${type}`}
            role={config.role}
            aria-live={config.ariaLive}
        >
            <span className="feedback__icon" aria-hidden="true">
                {config.icon}
            </span>
            <span className="feedback__body">
                <strong className="feedback__label">{config.label}:</strong>{" "}
                {children}
            </span>
        </p>
    );
}
