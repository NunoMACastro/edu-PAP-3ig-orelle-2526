/**
 * Layouts e guards de navegacao da aplicacao Orélle.
 *
 * A autorizacao real continua no backend. Estes componentes organizam apenas a
 * experiencia visual por role e evitam expor ecras fora do contexto correto.
 */
import { useEffect, useRef, useState } from "react";
import {
    Link,
    Navigate,
    NavLink,
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { getRoleHomeDestination } from "../services/roleNavigation.js";
import {
    getRoleNavigation,
    isRoleNavigationItemActive,
} from "../services/roleAppNavigation.js";
import { useConsultationAvailability } from "../context/ConsultationAvailabilityContext.jsx";
import { getCurrentConsultationSession } from "../features/consultation/consultationApi.js";
import { ErrorSummary } from "./ErrorSummary.jsx";
import { BrandLogo } from "./BrandLogo.jsx";
import { NavIcon } from "./NavIcon.jsx";
import { OptimizedImage } from "./OptimizedImage.jsx";
import { ThemeControls } from "./ThemeControls.jsx";
import { TopbarLogoutButton } from "./TopbarLogoutButton.jsx";
import {
    RoleMobileNavigationLink,
    RoleNavigation,
    RoleNavigationLink,
} from "./RoleNavigation.jsx";

export const USER_ROLES = {
    CLIENTE: "cliente",
    CONSULTOR: "consultor",
    ADMINISTRADOR: "administrador",
};
const USER_ROLE_LABELS = Object.freeze({
    [USER_ROLES.CLIENTE]: "Cliente",
    [USER_ROLES.CONSULTOR]: "Consultor",
    [USER_ROLES.ADMINISTRADOR]: "Administrador",
});

const CONSULTATION_LOGIN_STATE = { from: { pathname: "/consulta" } };

const PUBLIC_GUEST_LINKS = [
    { to: "/produtos", label: "Produtos", icon: "bag" },
    {
        to: "/login",
        state: CONSULTATION_LOGIN_STATE,
        label: "Entrar para IA",
        shortLabel: "Entrar para IA",
        icon: "sparkles",
        featured: true,
        showLabel: true,
    },
    { to: "/login", label: "Iniciar sessão", icon: "login" },
    { to: "/registo", label: "Registo", icon: "user-plus" },
];

const PUBLIC_AUTH_BASE_LINKS = [
    { to: "/produtos", label: "Produtos", icon: "bag" },
    {
        to: "/consulta",
        label: "Consulta assistida",
        shortLabel: "Consulta",
        icon: "sparkles",
        featured: true,
        showLabel: true,
    },
];

/**
 * Renderiza um link de navegacao com estado ativo acessivel.
 *
 * @function AppNavLink
 * @param {{to?: string, action?: "cart", label: string, state?: object, shortLabel?: string, icon?: string, featured?: boolean, showLabel?: boolean, end?: boolean}} props - Destino ou ação, texto e icone.
 * @returns {JSX.Element} Link de navegacao.
 */
function AppNavLink({
    to,
    action,
    label,
    state,
    shortLabel,
    icon,
    featured = false,
    showLabel = false,
    end = false,
}) {
    const { itemCount, openCart } = useCart();
    const visibleLabel = shortLabel || label;
    const classes = [
        "app-nav-link",
        featured ? "app-nav-link--featured" : "",
        showLabel ? "" : "app-nav-link--icon-only",
    ]
        .filter(Boolean)
        .join(" ");

    if (action === "cart") {
        return (
            <button
                type="button"
                aria-label={`Carrinho, ${itemCount} ${itemCount === 1 ? "unidade" : "unidades"}`}
                title={label}
                className={classes}
                onClick={openCart}
            >
                {icon ? (
                    <span className="app-nav-link__icon">
                        <NavIcon name={icon} />
                    </span>
                ) : null}
                {showLabel ? (
                    <span className="app-nav-link__label">{visibleLabel}</span>
                ) : null}
                <span className="cart-count-badge" aria-hidden="true">
                    {itemCount > 99 ? "99+" : itemCount}
                </span>
            </button>
        );
    }

    return (
        <NavLink
            to={to}
            state={state}
            end={end}
            aria-label={label}
            title={label}
            className={({ isActive }) =>
                [
                    "app-nav-link",
                    isActive ? "app-nav-link--active" : "",
                    featured ? "app-nav-link--featured" : "",
                    showLabel ? "" : "app-nav-link--icon-only",
                ]
                    .filter(Boolean)
                    .join(" ")
            }
        >
            {icon ? (
                <span className="app-nav-link__icon">
                    <NavIcon name={icon} />
                </span>
            ) : null}
            {showLabel ? (
                <span className="app-nav-link__label">{visibleLabel}</span>
            ) : null}
        </NavLink>
    );
}

/**
 * Shell partilhada para areas funcionais da aplicacao.
 *
 * @function AppLayoutShell
 * @param {{title: string, kicker: string, links: {to: string, label: string, state?: object, shortLabel?: string, icon?: string, featured?: boolean, showLabel?: boolean, end?: boolean}[], secondaryLinks?: {to: string, label: string, end?: boolean}[], variant?: string, showFloatingAi?: boolean, showProductSearch?: boolean, showContextHeader?: boolean}} props - Contexto visual do layout.
 * @returns {JSX.Element} Layout responsivo com navegacao principal.
 */
function PublicLayoutShell({
    title,
    kicker,
    links,
    secondaryLinks = [],
    variant = "client",
    showFloatingAi = true,
    showProductSearch = true,
    showContextHeader = true,
}) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const floatingAiLink = user?.role === USER_ROLES.CLIENTE
          ? {
              to: "/consulta",
              state: undefined,
              label: "Abrir consultora IA",
              text: "IA",
          }
          : null;

    /**
     * Mantem a pesquisa de produtos disponivel fora da home.
     *
     * @function submitProductSearch
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento de submissao.
     * @returns {void}
     */
    function submitProductSearch(event) {
        event.preventDefault();

        const query = search.trim();
        navigate(query ? `/produtos?search=${encodeURIComponent(query)}` : "/produtos");
    }

    return (
        <div className={`professional-shell app-layout app-layout--${variant}`}>
            <header className="mockup-topbar public-catalog-topbar">
                <Link className="mockup-brand" to="/" aria-label="Orélle início">
                    <BrandLogo tone="light" priority />
                </Link>

                {showProductSearch ? (
                    <form
                        className="mockup-search"
                        role="search"
                        onSubmit={submitProductSearch}
                    >
                        <label>
                            <span>Pesquisar produtos</span>
                            <input
                                placeholder="Pesquisar produtos..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </label>
                    </form>
                ) : null}

                <nav className="mockup-nav" aria-label={`Navegação ${title}`}>
                    {links.map((link) => (
                        <AppNavLink key={`${link.action ?? link.to}:${link.label}`} {...link} />
                    ))}
                    {user ? <TopbarLogoutButton /> : null}
                </nav>
            </header>

            <main
                id="main-content"
                className="professional-main app-layout__main"
                tabIndex={-1}
            >
                {showContextHeader ? (
                    <header className="professional-page-heading app-layout__heading">
                        <p className="app-kicker">{kicker}</p>
                        <p className="app-layout__title">{title}</p>
                    </header>
                ) : null}

                {secondaryLinks.length > 0 ? (
                    <nav
                        className="app-section-nav"
                        aria-label="Navegação da área pessoal"
                    >
                        {secondaryLinks.map((link) => (
                            <AppNavLink
                                key={`${link.to}:${link.label}`}
                                {...link}
                                showLabel
                            />
                        ))}
                    </nav>
                ) : null}

                <Outlet />
            </main>

            <footer className="app-layout__footer">
                <div>
                    <Link
                        className="app-layout__footer-brand"
                        to="/"
                        aria-label="Orélle início"
                    >
                        <BrandLogo />
                    </Link>
                    <p>Preferências visuais</p>
                </div>
                <ThemeControls />
            </footer>

            {showFloatingAi && floatingAiLink ? (
                <Link
                    className="app-floating-ai"
                    to={floatingAiLink.to}
                    state={floatingAiLink.state}
                    aria-label={floatingAiLink.label}
                >
                    {floatingAiLink.text}
                </Link>
            ) : null}
        </div>
    );
}

/**
 * Shell autenticada comum às três roles, com navegação adaptativa e conta
 * recolhida num menu próprio para manter o header numa única linha.
 */
function RoleAppShell({ role, showProductSearch = false }) {
    const { user, logout, logoutAll } = useAuth();
    const { itemCount, openCart } = useCart();
    const consultation = useConsultationAvailability();
    const location = useLocation();
    const navigate = useNavigate();
    const navigation = getRoleNavigation(role);
    const [search, setSearch] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [hasActiveConsultation, setHasActiveConsultation] = useState(false);
    const [sessionAction, setSessionAction] = useState({ status: "idle", scope: "current", error: null });
    const menuButtonRef = useRef(null);
    const drawerRef = useRef(null);
    const accountButtonRef = useRef(null);
    const accountMenuRef = useRef(null);
    const sessionActionInFlightRef = useRef(false);

    useEffect(() => {
        setDrawerOpen(false);
        setMoreOpen(false);
        setAccountOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (role !== USER_ROLES.CLIENTE) {
            setHasActiveConsultation(false);
            return undefined;
        }
        const controller = new AbortController();
        getCurrentConsultationSession({ signal: controller.signal })
            .then((session) => setHasActiveConsultation(Boolean(session?.canCancel)))
            .catch((error) => {
                if (error?.name !== "AbortError") setHasActiveConsultation(false);
            });
        return () => controller.abort();
    }, [location.pathname, role]);

    useEffect(() => {
        if (!drawerOpen && !accountOpen && !moreOpen) return undefined;

        const activeContainer = drawerOpen
            ? drawerRef.current
            : accountOpen
              ? accountMenuRef.current
              : document.querySelector(".role-mobile-more");
        const focusable = activeContainer?.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        focusable?.[0]?.focus();

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setDrawerOpen(false);
                setAccountOpen(false);
                setMoreOpen(false);
                (drawerOpen ? menuButtonRef : accountButtonRef).current?.focus();
                return;
            }
            if (event.key !== "Tab" || !focusable?.length) return;
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
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [drawerOpen, accountOpen, moreOpen]);

    function submitProductSearch(event) {
        event.preventDefault();
        const query = search.trim();
        navigate(query ? `/produtos?search=${encodeURIComponent(query)}` : "/produtos");
    }

    async function endSession(scope) {
        if (sessionActionInFlightRef.current) return;
        sessionActionInFlightRef.current = true;
        setSessionAction({ status: "loading", scope, error: null });
        try {
            await (scope === "all" ? logoutAll() : logout());
        } catch (error) {
            setSessionAction({ status: "error", scope, error });
        } finally {
            sessionActionInFlightRef.current = false;
        }
    }

    const avatarLabel = user?.email?.slice(0, 1).toUpperCase() || "O";
    const consultationAvailable = consultation.status !== "success" || consultation.available;
    const cartNavigationItem = navigation.groups
        .flatMap((navigationGroup) => navigationGroup.items)
        .find((navigationItem) => navigationItem.action === "cart");
    const cartActive = cartNavigationItem
        ? isRoleNavigationItemActive(navigation, cartNavigationItem, location.pathname)
        : false;
    const accountContextActive = navigation.accountItems.some((navigationItem) =>
        isRoleNavigationItemActive(navigation, navigationItem, location.pathname),
    );
    const contentClass =
        role === USER_ROLES.CLIENTE
            ? "role-shell--client"
            : role === USER_ROLES.ADMINISTRADOR
              ? "role-shell--admin-content"
              : "role-shell--consultant-content";
    const nonPrimaryItems = navigation.groups.flatMap((group) => group.items).filter(
        (item) => !navigation.mobile.some((mobileItem) => mobileItem.to === item.to),
    );

    return (
        <div className={`role-shell role-shell--${role} ${contentClass}`}>
            <header className="role-topbar">
                <button ref={menuButtonRef} className="role-topbar__menu" type="button" aria-label="Abrir menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
                    <span aria-hidden="true">☰</span>
                </button>
                <Link className="role-topbar__brand" to="/" aria-label="Orélle início">
                    <BrandLogo tone="light" priority />
                </Link>
                {showProductSearch ? (
                    <form className="role-topbar__search" role="search" onSubmit={submitProductSearch}>
                        <label><span>Pesquisar produtos</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar produtos…" /></label>
                    </form>
                ) : <span className="role-topbar__context">{navigation.title}</span>}
                <nav className="role-topbar__actions" aria-label="Ações rápidas">
                    {role === USER_ROLES.CLIENTE ? (
                        <>
                            <Link className={`role-topbar__quick role-topbar__quick--consultation ${consultationAvailable ? "" : "role-topbar__quick--muted"}`} to="/consulta" aria-label={hasActiveConsultation ? "Consulta em curso" : "Consulta"}><NavIcon name="sparkles" /><span>Consulta</span>{hasActiveConsultation ? <i className="role-topbar__activity" aria-hidden="true" /> : null}</Link>
                            <button
                                type="button"
                                className={`role-topbar__quick ${cartActive ? "role-topbar__quick--active" : ""}`}
                                aria-label={`Carrinho, ${itemCount} ${itemCount === 1 ? "unidade" : "unidades"}`}
                                aria-current={cartActive ? "page" : undefined}
                                onClick={openCart}
                            >
                                <NavIcon name="cart" />
                                <span>Carrinho</span>
                                <span className="cart-count-badge" aria-hidden="true">
                                    {itemCount > 99 ? "99+" : itemCount}
                                </span>
                            </button>
                        </>
                    ) : null}
                    <button
                        className="role-topbar__logout"
                        type="button"
                        aria-label="Terminar sessão"
                        aria-busy={
                            sessionAction.status === "loading" &&
                            sessionAction.scope === "current"
                        }
                        disabled={sessionAction.status === "loading"}
                        onClick={() => endSession("current")}
                    >
                        <NavIcon name="logout" />
                        <span>
                            {sessionAction.status === "loading" &&
                            sessionAction.scope === "current"
                                ? "A sair…"
                                : "Sair"}
                        </span>
                    </button>
                    <button
                        ref={accountButtonRef}
                        className={`role-account-button ${accountContextActive ? "role-account-button--active" : ""}`}
                        type="button"
                        aria-label="Abrir menu da conta"
                        aria-expanded={accountOpen}
                        onClick={() => setAccountOpen((open) => !open)}
                    >
                        {avatarLabel}
                    </button>
                </nav>
                {accountOpen ? (
                    <div ref={accountMenuRef} className="role-account-menu" role="dialog" aria-label="Conta e sessão">
                        <div className="role-account-menu__identity"><strong>{user?.email}</strong><span>{USER_ROLE_LABELS[user?.role] ?? "Acesso autenticado"}</span></div>
                        {navigation.accountItems.length > 0 ? (
                            <nav className="role-account-menu__navigation" aria-label="Navegação da conta">
                                <span>Conta</span>
                                {navigation.accountItems.map((navigationItem) => (
                                    <RoleNavigationLink
                                        key={navigationItem.to}
                                        item={navigationItem}
                                        navigation={navigation}
                                        pathname={location.pathname}
                                        onNavigate={() => setAccountOpen(false)}
                                        className="role-account-menu__link"
                                    />
                                ))}
                            </nav>
                        ) : null}
                        <div className="role-account-menu__themes"><span>Aspeto</span><ThemeControls /></div>
                        <button type="button" disabled={sessionAction.status === "loading"} onClick={() => endSession("current")}>Sair</button>
                        <button type="button" disabled={sessionAction.status === "loading"} onClick={() => endSession("all")}>Sair de todos os dispositivos</button>
                    </div>
                ) : null}
            </header>

            <ErrorSummary error={sessionAction.error} id="session-action-error" title="Não foi possível terminar a sessão" />

            <div className="role-shell__body">
                <aside className="role-sidebar">
                    <div className="role-sidebar__identity"><span>{role === USER_ROLES.CONSULTOR ? "Consultoria" : navigation.title}</span><small>Experiência Orélle</small></div>
                    <RoleNavigation navigation={navigation} pathname={location.pathname} />
                </aside>
                <main id="main-content" className="role-content" tabIndex={-1}><Outlet /></main>
            </div>

            {drawerOpen ? (
                <div className="role-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setDrawerOpen(false); menuButtonRef.current?.focus(); } }}>
                    <aside ref={drawerRef} className="role-drawer" role="dialog" aria-modal="true" aria-label={`Menu ${navigation.title}`}>
                        <header><BrandLogo /><button type="button" aria-label="Fechar menu" onClick={() => { setDrawerOpen(false); menuButtonRef.current?.focus(); }}>×</button></header>
                        <RoleNavigation navigation={navigation} pathname={location.pathname} onNavigate={() => setDrawerOpen(false)} />
                    </aside>
                </div>
            ) : null}

            <nav
                className="role-bottom-nav"
                aria-label={`Navegação móvel ${navigation.title}`}
                style={{
                    "--role-mobile-nav-columns": navigation.mobile.length + 1,
                }}
            >
                {navigation.mobile.map((item) => (
                    <RoleMobileNavigationLink key={item.to} item={item} pathname={location.pathname} />
                ))}
                <button type="button" className={moreOpen ? "role-navigation__link--active" : ""} aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}><NavIcon name="dashboard" /><span>Mais</span></button>
            </nav>
            {moreOpen ? (
                <div className="role-mobile-more" role="dialog" aria-label="Mais destinos">
                    <header><strong>Mais</strong><button type="button" aria-label="Fechar" onClick={() => setMoreOpen(false)}>×</button></header>
                    <div>{nonPrimaryItems.map((item) => <RoleNavigationLink key={item.to} item={item} navigation={navigation} pathname={location.pathname} />)}</div>
                </div>
            ) : null}

            <footer className="role-footer"><Link to="/" aria-label="Orélle início"><BrandLogo /></Link><span>Beleza com inteligência e cuidado.</span></footer>
            {role === USER_ROLES.CLIENTE &&
            consultation.available &&
            !location.pathname.startsWith("/consulta") ? (
                <Link className="app-floating-ai" to="/consulta" aria-label="Abrir consultora IA">IA</Link>
            ) : null}
        </div>
    );
}

/**
 * Shell pública focada nos percursos de autenticação.
 *
 * Mantém a navegação mínima, um único main e os controlos de acessibilidade
 * sem expor pesquisa ou ações comerciais durante login e registo.
 *
 * @function AuthLayout
 * @returns {JSX.Element} Layout editorial partilhado por login e registo.
 */
export function AuthLayout() {
    return (
        <div className="auth-layout">
            <header className="auth-topbar">
                <Link
                    className="auth-topbar__brand"
                    to="/"
                    aria-label="Orélle início"
                >
                    <BrandLogo tone="light" priority />
                </Link>
                <Link className="auth-topbar__home-link" to="/">
                    Voltar ao início
                </Link>
            </header>

            <main id="main-content" className="auth-main" tabIndex={-1}>
                <section className="auth-visual" aria-label="Identidade Orélle">
                    <div className="auth-visual__media" aria-hidden="true">
                        <OptimizedImage
                            src="/home/orelle-auth-portrait-v2-1003.webp"
                            alt=""
                            width={1003}
                            height={1568}
                            className="auth-visual__image"
                            sizes="(max-width: 920px) 0px, 53vw"
                            priority
                            avifSrcSet="/home/orelle-auth-portrait-v2-480.avif 480w, /home/orelle-auth-portrait-v2-640.avif 640w, /home/orelle-auth-portrait-v2-960.avif 960w, /home/orelle-auth-portrait-v2-1003.avif 1003w"
                            webpSrcSet="/home/orelle-auth-portrait-v2-480.webp 480w, /home/orelle-auth-portrait-v2-640.webp 640w, /home/orelle-auth-portrait-v2-960.webp 960w, /home/orelle-auth-portrait-v2-1003.webp 1003w"
                        />
                    </div>
                    <div className="auth-visual__content">
                        <BrandLogo variant="full" tone="light" priority />
                        <p className="auth-visual__kicker">Beleza pensada para ti</p>
                        <h2>Uma experiência de beleza mais pessoal.</h2>
                        <p>
                            Cuidado cosmético, inteligência e olhar humano reunidos
                            para te ajudar a escolher com mais confiança.
                        </p>
                    </div>
                </section>

                <section className="auth-panel" aria-label="Autenticação">
                    <div className="auth-panel__content">
                        <Outlet />
                    </div>
                </section>
            </main>

            <footer className="auth-footer">
                <span>Preferências visuais</span>
                <ThemeControls />
            </footer>
        </div>
    );
}

/**
 * Layout publico para auth e catalogo.
 *
 * @function PublicLayout
 * @returns {JSX.Element} Layout publico.
 */
export function PublicLayout() {
    const { user } = useAuth();
    const roleDestination = getRoleHomeDestination(user?.role);
    const publicBaseLinks =
        user?.role === USER_ROLES.CLIENTE
            ? PUBLIC_AUTH_BASE_LINKS
            : PUBLIC_AUTH_BASE_LINKS.filter((link) => link.to !== "/consulta");
    const authenticatedLinks = roleDestination
        ? [
              ...publicBaseLinks,
              { ...roleDestination, showLabel: true },
              ...(user?.role === USER_ROLES.CLIENTE
                  ? [{ action: "cart", label: "Carrinho", icon: "cart" }]
                  : []),
          ]
        : publicBaseLinks;

    return (
        <PublicLayoutShell
            title="Orélle"
            kicker="Experiência pública"
            links={user ? authenticatedLinks : PUBLIC_GUEST_LINKS}
            variant="public"
            showFloatingAi={user?.role === USER_ROLES.CLIENTE}
            showContextHeader={false}
        />
    );
}

/**
 * Layout autenticado do cliente.
 *
 * @function ClientLayout
 * @returns {JSX.Element} Layout de cliente.
 */
export function ClientLayout() {
    return <RoleAppShell role={USER_ROLES.CLIENTE} showProductSearch />;
}

/**
 * Mantém o menu da role ao abrir as rotas de consulta partilhadas.
 *
 * @returns {JSX.Element} Layout de cliente, consultor ou administrador.
 */
export function ConsultationLayout() {
    const { user } = useAuth();

    if (user?.role === USER_ROLES.ADMINISTRADOR) return <AdminLayout />;
    if (user?.role === USER_ROLES.CONSULTOR) return <ConsultantLayout />;
    return <ClientLayout />;
}

/**
 * Layout de consultoria.
 *
 * @function ConsultantLayout
 * @returns {JSX.Element} Layout de consultor.
 */
export function ConsultantLayout() {
    return <RoleAppShell role={USER_ROLES.CONSULTOR} />;
}

/**
 * Layout administrativo.
 *
 * @function AdminLayout
 * @returns {JSX.Element} Layout de administracao.
 */
export function AdminLayout() {
    return <RoleAppShell role={USER_ROLES.ADMINISTRADOR} />;
}

/**
 * Protege uma rota que exige sessao autenticada.
 *
 * @function RequireAuth
 * @param {{children: React.ReactNode}} props - Conteudo protegido.
 * @returns {JSX.Element} Conteudo, loading ou redirect para login.
 */
export function RequireAuth({ children }) {
    const { user, loading, initializationError, retrySession } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <main id="main-content" className="route-status" aria-busy="true" tabIndex={-1}>
                <p role="status">A carregar sessão segura.</p>
            </main>
        );
    }

    if (!user) {
        if (initializationError) {
            return (
                <main id="main-content" className="route-status" tabIndex={-1}>
                    <p role="alert">{initializationError}</p>
                    <button type="button" onClick={() => retrySession()}>
                        Tentar confirmar sessão novamente
                    </button>
                </main>
            );
        }
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}

/**
 * Protege uma rota por role visual sem substituir a autorizacao da API.
 *
 * @function RequireRole
 * @param {{allowedRoles: string[], children: React.ReactNode}} props - Roles permitidas e conteudo.
 * @returns {JSX.Element} Conteudo autorizado ou estado sem acesso.
 */
export function RequireRole({ allowedRoles, children }) {
    const { user, loading, initializationError, retrySession } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <main id="main-content" className="route-status" aria-busy="true" tabIndex={-1}>
                <p role="status">A validar permissão.</p>
            </main>
        );
    }

    if (!user) {
        if (initializationError) {
            return (
                <main id="main-content" className="route-status" tabIndex={-1}>
                    <p role="alert">{initializationError}</p>
                    <button type="button" onClick={() => retrySession()}>
                        Tentar confirmar sessão novamente
                    </button>
                </main>
            );
        }
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!allowedRoles.includes(user.role)) {
        return (
            <main id="main-content" className="route-status" tabIndex={-1}>
                <p className="app-kicker">Acesso reservado</p>
                <h1>Esta área não está disponível para o teu perfil de acesso.</h1>
                <Link className="text-link" to="/">
                    Voltar ao início
                </Link>
            </main>
        );
    }

    return children;
}

/**
 * Pagina de fallback para rotas inexistentes.
 *
 * @function NotFoundPage
 * @returns {JSX.Element} Estado 404 visual.
 */
export function NotFoundPage() {
    return (
        <section className="route-status">
            <p className="app-kicker">404</p>
            <h1>Página não encontrada.</h1>
            <Link className="text-link" to="/">
                Voltar ao início
            </Link>
        </section>
    );
}
