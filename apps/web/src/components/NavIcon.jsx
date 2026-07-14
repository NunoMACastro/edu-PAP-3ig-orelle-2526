/**
 * Icones inline usados na navegacao principal da Orelle.
 *
 * Mantem os menus compactos sem adicionar dependencias externas.
 */
/**
 * Renderiza os paths SVG do icone pedido.
 *
 * @function renderIcon
 * @param {string} name - Identificador semantico do icone.
 * @returns {JSX.Element} Conteudo do SVG.
 */
function renderIcon(name) {
    switch (name) {
        case "bag":
            return (
                <>
                    <path d="M6.5 8.5h11l-.75 10h-9.5l-.75-10Z" />
                    <path d="M9 8.5a3 3 0 0 1 6 0" />
                </>
            );
        case "sparkles":
            return (
                <>
                    <path d="m12 3 1.45 3.05L16.5 7.5l-3.05 1.45L12 12l-1.45-3.05L7.5 7.5l3.05-1.45L12 3Z" />
                    <path d="m6.5 13 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" />
                    <path d="m17.5 12 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" />
                </>
            );
        case "login":
            return (
                <>
                    <circle cx="7.5" cy="12" r="3.5" />
                    <path d="M11 12h9.5" />
                    <path d="M17.5 12v3" />
                    <path d="M14.5 12v2" />
                </>
            );
        case "logout":
            return (
                <>
                    <path d="m14 7-5 5 5 5" />
                    <path d="M9 12h11.5" />
                    <path d="M8.5 4.5h-4v15h4" />
                </>
            );
        case "user-plus":
            return (
                <>
                    <circle cx="9" cy="8" r="3" />
                    <path d="M4 19a5 5 0 0 1 10 0" />
                    <path d="M17.5 8v6" />
                    <path d="M14.5 11h6" />
                </>
            );
        case "face":
            return (
                <>
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="M9 10h.01" />
                    <path d="M15 10h.01" />
                    <path d="M8.5 14.5a5 5 0 0 0 7 0" />
                </>
            );
        case "calendar":
            return (
                <>
                    <path d="M5 5.5h14v14H5z" />
                    <path d="M8 3.5v4" />
                    <path d="M16 3.5v4" />
                    <path d="M5 9h14" />
                </>
            );
        case "cart":
            return (
                <>
                    <path d="M4 5h2l1.5 9h9.5l2-6.5H7" />
                    <circle cx="9" cy="18" r="1.25" />
                    <circle cx="17" cy="18" r="1.25" />
                </>
            );
        case "user":
            return (
                <>
                    <circle cx="12" cy="8" r="3.25" />
                    <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
                </>
            );
        case "review":
            return (
                <>
                    <path d="M5 5h14v10H9l-4 4V5Z" />
                    <path d="M8 9h8" />
                    <path d="M8 12h5" />
                </>
            );
        case "shield":
            return (
                <>
                    <path d="M12 3.5 19 6v5.2c0 4.15-2.55 6.8-7 8.3-4.45-1.5-7-4.15-7-8.3V6l7-2.5Z" />
                    <path d="m9.5 12 1.75 1.75L15 10" />
                </>
            );
        case "dashboard":
            return (
                <>
                    <path d="M4.5 4.5h6v6h-6z" />
                    <path d="M13.5 4.5h6v6h-6z" />
                    <path d="M4.5 13.5h6v6h-6z" />
                    <path d="M13.5 13.5h6v6h-6z" />
                </>
            );
        case "tag":
            return (
                <>
                    <path d="M4.5 11.5 12 4h6v6l-7.5 7.5a2 2 0 0 1-2.8 0l-3.2-3.2a2 2 0 0 1 0-2.8Z" />
                    <path d="M15.5 7.5h.01" />
                </>
            );
        case "users":
            return (
                <>
                    <circle cx="9" cy="8" r="3" />
                    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                    <path d="M16 11a2.5 2.5 0 1 0-.5-4.95" />
                    <path d="M16 14c2.3.3 4 2.1 4.5 5" />
                </>
            );
        case "star":
            return (
                <path d="m12 3.8 2.35 4.75 5.25.75-3.8 3.7.9 5.2L12 15.75 7.3 18.2l.9-5.2-3.8-3.7 5.25-.75L12 3.8Z" />
            );
        case "search":
            return (
                <>
                    <circle cx="10.5" cy="10.5" r="6.25" />
                    <path d="m15.25 15.25 4.25 4.25" />
                </>
            );
        case "download":
            return (
                <>
                    <path d="M12 4v10" />
                    <path d="m8 10 4 4 4-4" />
                    <path d="M5 18.5h14" />
                </>
            );
        case "megaphone":
            return (
                <>
                    <path d="M4 13h3l9 4V5l-9 4H4v4Z" />
                    <path d="M7 13.5 8.5 19" />
                    <path d="M18 9.5a3 3 0 0 1 0 3" />
                </>
            );
        case "box":
            return (
                <>
                    <path d="m12 3.5 7 4-7 4-7-4 7-4Z" />
                    <path d="M5 7.5v8l7 4 7-4v-8" />
                    <path d="M12 11.5v8" />
                </>
            );
        case "edit":
            return (
                <>
                    <path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-4-4l-10 10v4Z" />
                    <path d="m13.5 6.5 4 4" />
                </>
            );
        case "eye":
            return (
                <>
                    <path d="M3.5 12s3.2-5.5 8.5-5.5 8.5 5.5 8.5 5.5-3.2 5.5-8.5 5.5S3.5 12 3.5 12Z" />
                    <circle cx="12" cy="12" r="2.5" />
                </>
            );
        case "plus":
            return <path d="M12 4.5v15M4.5 12h15" />;
        case "refresh":
            return (
                <>
                    <path d="M19 8a7.5 7.5 0 1 0 .2 7.6" />
                    <path d="M19 4.5V8h-3.5" />
                </>
            );
        case "arrow-right":
            return (
                <>
                    <path d="M5 12h14" />
                    <path d="m14 7 5 5-5 5" />
                </>
            );
        case "close":
            return (
                <>
                    <path d="m6 6 12 12" />
                    <path d="m18 6-12 12" />
                </>
            );
        case "save":
            return (
                <>
                    <path d="M5 4.5h12l2 2v13H5v-15Z" />
                    <path d="M8 4.5v5h8v-5" />
                    <path d="M8.5 19.5v-6h7v6" />
                </>
            );
        case "user-check":
            return (
                <>
                    <circle cx="9" cy="8" r="3" />
                    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                    <path d="m15.5 13.5 2 2 3.5-4" />
                </>
            );
        case "user-x":
            return (
                <>
                    <circle cx="9" cy="8" r="3" />
                    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                    <path d="m16 12 4 4m0-4-4 4" />
                </>
            );
        case "sun":
            return (
                <>
                    <circle cx="12" cy="12" r="3.5" />
                    <path d="M12 3.5v2" />
                    <path d="M12 18.5v2" />
                    <path d="M3.5 12h2" />
                    <path d="M18.5 12h2" />
                    <path d="m5.9 5.9 1.4 1.4" />
                    <path d="m16.7 16.7 1.4 1.4" />
                    <path d="m18.1 5.9-1.4 1.4" />
                    <path d="m7.3 16.7-1.4 1.4" />
                </>
            );
        case "moon":
            return (
                <path d="M18.5 15.4A7.2 7.2 0 0 1 8.6 5.5 7.7 7.7 0 1 0 18.5 15.4Z" />
            );
        case "contrast":
            return (
                <>
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="M12 3.5v17" />
                    <path d="M12 6.5a5.5 5.5 0 0 1 0 11" />
                </>
            );
        default:
            return (
                <>
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v4l2.5 2.5" />
                </>
            );
    }
}

/**
 * Icone SVG compacto para menus de topo.
 *
 * @function NavIcon
 * @param {{name: string, className?: string}} props - Nome e classe opcional.
 * @returns {JSX.Element} Icone acessivel por contexto externo.
 */
export function NavIcon({ name, className = "" }) {
    return (
        <svg
            className={className}
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            focusable="false"
        >
            {renderIcon(name)}
        </svg>
    );
}
