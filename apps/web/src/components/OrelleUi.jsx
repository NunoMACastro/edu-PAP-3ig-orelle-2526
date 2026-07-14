/** Componentes visuais semânticos partilhados pelas superfícies Orélle. */
import { Link } from "react-router-dom";

/** Botão consistente com as ações principais da homepage. */
export function OrelleButton({ variant = "primary", className = "", ...props }) {
    return <button className={`orelle-button orelle-button--${variant} ${className}`.trim()} {...props} />;
}

/** Link com aparência de ação, preservando a semântica de navegação. */
export function OrelleActionLink({ variant = "primary", className = "", ...props }) {
    return <Link className={`orelle-button orelle-button--${variant} ${className}`.trim()} {...props} />;
}

/** Cabeçalho editorial de página. */
export function PageHero({ eyebrow, title, description, actions, children, className = "" }) {
    return (
        <header className={`orelle-page-hero ${className}`.trim()}>
            <div className="orelle-page-hero__copy">
                {eyebrow ? <p className="orelle-eyebrow">{eyebrow}</p> : null}
                <h1>{title}</h1>
                {description ? <p>{description}</p> : null}
                {actions ? <div className="orelle-page-hero__actions">{actions}</div> : null}
            </div>
            {children ? <div className="orelle-page-hero__aside">{children}</div> : null}
        </header>
    );
}

/** Superfície de conteúdo explicitamente delimitada. */
export function SectionCard({ title, titleId, titleRef, description, actions, className = "", children, as: Element = "section" }) {
    return (
        <Element className={`orelle-section-card ${className}`.trim()}>
            {title || actions ? (
                <header className="orelle-section-card__header">
                    <div>{title ? <h2 id={titleId} ref={titleRef} tabIndex={titleRef ? -1 : undefined}>{title}</h2> : null}{description ? <p>{description}</p> : null}</div>
                    {actions ? <div className="orelle-section-card__actions">{actions}</div> : null}
                </header>
            ) : null}
            {children}
        </Element>
    );
}

/** Card navegável para um próximo passo. */
export function ActionCard({ to, eyebrow, title, description, action = "Abrir" }) {
    return (
        <Link className="orelle-action-card" to={to}>
            {eyebrow ? <span className="orelle-eyebrow">{eyebrow}</span> : null}
            <strong>{title}</strong>
            {description ? <span>{description}</span> : null}
            <span className="orelle-action-card__action">{action} <span aria-hidden="true">→</span></span>
        </Link>
    );
}

/** Estado vazio com uma ação contextual opcional. */
export function EmptyState({ title, description, action, icon = "✦" }) {
    return (
        <div className="orelle-empty-state">
            <span className="orelle-empty-state__icon" aria-hidden="true">{icon}</span>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
            {action ? <div>{action}</div> : null}
        </div>
    );
}

/** Mensagem de estado de produto, sem expor detalhes técnicos. */
export function StatusBanner({ tone = "info", title, children }) {
    return <aside className={`orelle-status-banner orelle-status-banner--${tone}`} role={tone === "error" ? "alert" : "status"}><strong>{title}</strong>{children ? <div>{children}</div> : null}</aside>;
}

/** Placeholder de carregamento com dimensões estáveis. */
export function Skeleton({ lines = 3, label = "A carregar conteúdo" }) {
    return <div className="orelle-skeleton" role="status" aria-label={label}>{Array.from({ length: lines }, (_, index) => <span key={index} />)}</div>;
}

/** Campo textual compatível com arrays existentes, enriquecido com chips. */
export function TagInput({ label, name, value, onChange, required = false, as: Element = "input", hint, placeholder }) {
    const tags = String(value ?? "").split(",").map((tag) => tag.trim()).filter(Boolean);
    return (
        <div className="orelle-tag-input">
            <label>
                {label}
                <Element
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                />
            </label>
            {hint ? <small>{hint}</small> : null}
            {tags.length ? <ul>{tags.map((tag) => <li key={tag}>{tag}</li>)}</ul> : <p>Ainda sem seleções.</p>}
        </div>
    );
}
