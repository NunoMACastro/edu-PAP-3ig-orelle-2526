/** Componentes administrativos compactos e coerentes com a marca Orélle. */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { NavIcon } from "./NavIcon.jsx";

/** Cabeçalho editorial compacto usado no backoffice. */
export function AdminPageHeader({ eyebrow, title, description, actions }) {
    return (
        <header className="admin-page-header">
            <div>{eyebrow ? <p>{eyebrow}</p> : null}<h1>{title}</h1>{description ? <span>{description}</span> : null}</div>
            {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
        </header>
    );
}

/** Botão exclusivamente icónico com nome acessível e tooltip nativo. */
export function AdminIconButton({ icon, label, className = "", ...props }) {
    return <button type="button" className={`admin-icon-button ${className}`.trim()} aria-label={label} title={label} {...props}><NavIcon name={icon} /></button>;
}

/** Link exclusivamente icónico para navegação sem mutação. */
export function AdminIconLink({ icon, label, className = "", ...props }) {
    return <Link className={`admin-icon-button ${className}`.trim()} aria-label={label} title={label} {...props}><NavIcon name={icon} /></Link>;
}

/** Badge de estado com vocabulário visual consistente. */
export function AdminStatusBadge({ tone = "neutral", children }) {
    return <span className={`admin-status-badge admin-status-badge--${tone}`}>{children}</span>;
}

/** Navegação paginada compacta com total e estado atual anunciados. */
export function AdminPagination({
    page,
    totalPages,
    total,
    onPageChange,
    label = "Paginação administrativa",
    disabled = false,
}) {
    const displayTotalPages = Math.max(1, totalPages);

    return (
        <nav className="admin-pagination" aria-label={label} aria-busy={disabled}>
            <span>{total} {total === 1 ? "resultado" : "resultados"}</span>
            <div>
                <button
                    type="button"
                    disabled={disabled || page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    Anterior
                </button>
                <span aria-live="polite">
                    Página {page} de {displayTotalPages}
                </span>
                <button
                    type="button"
                    disabled={disabled || totalPages === 0 || page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Seguinte
                </button>
            </div>
        </nav>
    );
}

/** Ação incremental usada por coleções ordenadas por cursor. */
export function AdminLoadMore({ hasMore, loading, onLoad, children }) {
    if (!hasMore) return null;

    return (
        <div className="admin-load-more">
            <button type="button" disabled={loading} onClick={onLoad}>
                {loading ? "A carregar…" : children}
            </button>
        </div>
    );
}

/**
 * Modal acessível com foco contido e restaurado, sem dependências externas.
 */
export function AdminModal({ open, title, description, onClose, children }) {
    const dialogRef = useRef(null);
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        previousFocusRef.current = document.activeElement;
        const dialog = dialogRef.current;
        const selector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusable = dialog?.querySelectorAll(selector);
        focusable?.[0]?.focus();

        function handleKeyDown(event) {
            if (event.key === "Escape") { onClose(); return; }
            if (event.key !== "Tab" || !focusable?.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previousFocusRef.current?.focus();
        };
    }, [onClose, open]);

    if (!open) return null;
    return (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <section ref={dialogRef} className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" aria-describedby={description ? "admin-modal-description" : undefined}>
                <header><div><h2 id="admin-modal-title">{title}</h2>{description ? <p id="admin-modal-description">{description}</p> : null}</div><AdminIconButton icon="close" label="Fechar modal" onClick={onClose} /></header>
                <div className="admin-modal__content">{children}</div>
            </section>
        </div>
    );
}
