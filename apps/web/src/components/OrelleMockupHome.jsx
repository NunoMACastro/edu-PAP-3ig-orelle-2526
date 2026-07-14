/**
 * Home visual alinhada com o mockup local da Orelle.
 *
 * Esta camada aproxima a primeira experiencia da app ao mockup sem criar regras
 * de negocio, endpoints ou dados falsos. As acoes usam as rotas reais da app.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../services/apiClient.js";
import { getUserRoleLabel } from "../services/presentationLabels.js";
import { getRoleHomeDestination } from "../services/roleNavigation.js";
import { BrandLogo } from "./BrandLogo.jsx";
import { NavIcon } from "./NavIcon.jsx";
import { OptimizedImage } from "./OptimizedImage.jsx";
import { ProductCard } from "./ProductCard.jsx";
import { ThemeControls } from "./ThemeControls.jsx";
import { TopbarLogoutButton } from "./TopbarLogoutButton.jsx";

const FEATURE_CARDS = [
    {
        icon: "sparkles",
        title: "Inteligência que cuida",
        description:
            "Sugestões pensadas a partir da tua pele, dos teus objetivos e das tuas preferências.",
    },
    {
        icon: "face",
        title: "Cuidado à tua medida",
        description:
            "Uma leitura cosmética personalizada, clara e focada no que procuras.",
    },
    {
        icon: "review",
        title: "Olhar especializado",
        description:
            "Quando quiseres, um consultor pode rever e enriquecer o teu relatório.",
    },
    {
        icon: "bag",
        title: "Escolhas com propósito",
        description:
            "Descobre produtos selecionados para completar a tua rotina de beleza.",
    },
];

/**
 * Renderiza um link reutilizavel da home mockup.
 *
 * @function HomeActionLink
 * @param {{children: React.ReactNode, to: string, state?: object, variant?: "primary"|"secondary"|"gold", className?: string}} props - Texto e destino do link.
 * @returns {JSX.Element} Link visual da home.
 */
function HomeActionLink({
    children,
    to,
    state,
    variant = "primary",
    className = "",
}) {
    return (
        <Link
            to={to}
            state={state}
            className={`mockup-action mockup-action--${variant} ${className}`.trim()}
        >
            {children}
        </Link>
    );
}

/**
 * Renderiza um link compacto da navegacao principal da home.
 *
 * @function HomeNavLink
 * @param {{to?: string, action?: "cart", label: string, icon: string, state?: object, shortLabel?: string, primary?: boolean, showLabel?: boolean}} props - Destino ou ação e apresentação.
 * @returns {JSX.Element} Link de navegacao iconografico.
 */
function HomeNavLink({
    to,
    action,
    label,
    icon,
    state,
    shortLabel,
    primary = false,
    showLabel = false,
}) {
    const { itemCount, openCart } = useCart();
    const classes = [
        "mockup-nav-link",
        primary ? "mockup-nav-primary" : "",
        showLabel ? "" : "mockup-nav-link--icon-only",
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
                <span className="mockup-nav-icon">
                    <NavIcon name={icon} />
                </span>
                {showLabel ? (
                    <span className="mockup-nav-label">{shortLabel || label}</span>
                ) : null}
                <span className="cart-count-badge" aria-hidden="true">
                    {itemCount > 99 ? "99+" : itemCount}
                </span>
            </button>
        );
    }

    return (
        <Link
            to={to}
            state={state}
            aria-label={label}
            title={label}
            className={classes}
        >
            <span className="mockup-nav-icon">
                <NavIcon name={icon} />
            </span>
            {showLabel ? (
                <span className="mockup-nav-label">{shortLabel || label}</span>
            ) : null}
        </Link>
    );
}

/**
 * Renderiza a home principal e-commerce/consultoria.
 *
 * @function OrelleMockupHome
 * @param {{consultationPath?: string}} props - Rota principal da consulta.
 * @returns {JSX.Element} Home alinhada com o mockup.
 */
export function OrelleMockupHome({ consultationPath = "/consulta" }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [featuredStatus, setFeaturedStatus] = useState("loading");
    const isClient = user?.role === "cliente";
    const roleDestination = getRoleHomeDestination(user?.role);
    const consultationLoginState = { from: { pathname: consultationPath } };
    const consultationLink = isClient
        ? {
              to: consultationPath,
              state: undefined,
              navLabel: "A minha consulta",
              heroLabel: "Continuar a minha consulta",
              actionLabel: "Continuar consulta",
              footerLabel: "A minha consulta",
          }
        : !user
          ? {
              to: "/login",
              state: consultationLoginState,
              navLabel: "Começar consulta",
              heroLabel: "Começar a minha consulta",
              actionLabel: "Começar a minha consulta",
              footerLabel: "Começar consulta",
            }
          : null;
    const heroPrimaryLink = consultationLink ?? {
        to: roleDestination?.to ?? "/",
        state: undefined,
        heroLabel: roleDestination?.label ?? "Voltar ao início",
    };

    useEffect(() => {
        let isActive = true;

        /**
         * Carrega a montra publica sem inventar produtos locais.
         *
         * @async
         * @function loadFeaturedProducts
         * @returns {Promise<void>} Resolve quando a chamada termina.
         */
        async function loadFeaturedProducts() {
            setFeaturedStatus("loading");

            try {
                const data = await apiRequest("/catalog/products/featured");
                const products = Array.isArray(data?.products)
                    ? data.products
                    : [];

                if (!isActive) return;

                setFeaturedProducts(products);
                setFeaturedStatus(products.length > 0 ? "success" : "empty");
            } catch {
                if (!isActive) return;

                setFeaturedProducts([]);
                setFeaturedStatus("error");
            }
        }

        loadFeaturedProducts();

        return () => {
            isActive = false;
        };
    }, []);

    /**
     * Encaminha a pesquisa da home para o catalogo real.
     *
     * @function submitSearch
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento de submissao.
     * @returns {void}
     */
    function submitSearch(event) {
        event.preventDefault();

        const query = search.trim();
        navigate(query ? `/produtos?search=${encodeURIComponent(query)}` : "/produtos");
    }

    return (
        <div className="mockup-home" data-mockup-home="true">
            <header className="mockup-topbar">
                <Link className="mockup-brand" to="/" aria-label="Orélle início">
                    <BrandLogo tone="light" priority />
                </Link>

                <form
                    className="mockup-search"
                    role="search"
                    onSubmit={submitSearch}
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

                <nav className="mockup-nav" aria-label="Navegação principal">
                    {consultationLink && (
                        <HomeNavLink
                            to={consultationLink.to}
                            state={consultationLink.state}
                            label={consultationLink.navLabel}
                            shortLabel="Consulta"
                            icon="sparkles"
                            primary
                            showLabel
                        />
                    )}
                    <HomeNavLink to="/produtos" label="Produtos" icon="bag" />
                    {user && roleDestination ? (
                        <HomeNavLink
                            to={roleDestination.to}
                            label={roleDestination.label}
                            shortLabel={roleDestination.shortLabel}
                            icon={roleDestination.icon}
                            showLabel
                        />
                    ) : !user ? (
                        <>
                            <HomeNavLink
                                to="/login"
                                label="Iniciar sessão"
                                icon="login"
                            />
                            <HomeNavLink to="/registo" label="Registo" icon="user-plus" />
                        </>
                    ) : null}
                    {isClient ? (
                        <HomeNavLink action="cart" label="Carrinho" icon="cart" />
                    ) : null}
                    {user ? <TopbarLogoutButton /> : null}
                </nav>
            </header>

            <main id="main-content" tabIndex={-1}>
                <section className="mockup-hero" aria-labelledby="mockup-hero-title">
                    <OptimizedImage
                        src="/home/orelle-home-hero-v2-1774.webp"
                        alt="Retrato editorial de uma mulher de cabelo encaracolado em luz suave"
                        width={1774}
                        height={887}
                        className="mockup-hero__image"
                        sizes="100vw"
                        priority
                        avifSrcSet="/home/orelle-home-hero-v2-640.avif 640w, /home/orelle-home-hero-v2-960.avif 960w, /home/orelle-home-hero-v2-1536.avif 1536w, /home/orelle-home-hero-v2-1774.avif 1774w"
                        webpSrcSet="/home/orelle-home-hero-v2-640.webp 640w, /home/orelle-home-hero-v2-960.webp 960w, /home/orelle-home-hero-v2-1536.webp 1536w, /home/orelle-home-hero-v2-1774.webp 1774w"
                    />
                    <div className="mockup-hero__content">
                        <p className="mockup-pill">
                            Beleza pensada para ti
                        </p>
                        <h1 id="mockup-hero-title">Descobre a beleza com inteligência</h1>
                        <p>
                            Uma experiência de beleza mais pessoal, onde a
                            Inteligência Artificial e o cuidado cosmético se encontram
                            para revelar o que combina contigo.
                        </p>
                        <div className="mockup-hero__actions">
                            <HomeActionLink
                                to={heroPrimaryLink.to}
                                state={heroPrimaryLink.state}
                            >
                                {heroPrimaryLink.heroLabel}
                            </HomeActionLink>
                            <HomeActionLink variant="secondary" to="/produtos">
                                Explorar produtos
                            </HomeActionLink>
                        </div>
                    </div>
                </section>

                <section
                    className="mockup-ai-section"
                    aria-labelledby="mockup-ai-title"
                >
                    <div className="mockup-section-inner mockup-ai-grid">
                        <div className="mockup-ai-copy">
                            <p className="mockup-pill mockup-pill--gold">
                                Inteligência Artificial + olhar humano
                            </p>
                            <h2 id="mockup-ai-title">
                                Beleza que parte de ti
                            </h2>
                            <p>
                                Conta-nos o que te inspira e descobre uma experiência
                                criada à volta da tua pele, das tuas preferências e do
                                teu estilo. Da rotina ao look final, cada sugestão ajuda-te
                                a escolher com mais confiança.
                            </p>
                            <ul
                                className="mockup-ai-benefits"
                                aria-label="Benefícios da consulta"
                            >
                                <li className="mockup-ai-benefit">
                                    <h3>Define os teus objetivos</h3>
                                    <p>
                                        Escolhe o que queres cuidar e partilha apenas as
                                        fotografias que autorizares.
                                    </p>
                                </li>
                                <li className="mockup-ai-benefit">
                                    <h3>Conversa ao teu ritmo</h3>
                                    <p>
                                        Responde a uma pergunta de cada vez, com o
                                        progresso sempre guardado.
                                    </p>
                                </li>
                                <li className="mockup-ai-benefit">
                                    <h3>Recebe o teu relatório</h3>
                                    <p>
                                        Descobre recomendações explicadas e, quando
                                        aplicável, uma inspiração visual de maquilhagem.
                                    </p>
                                </li>
                            </ul>
                            {consultationLink ? (
                                <HomeActionLink
                                    variant="gold"
                                    to={consultationLink.to}
                                    state={consultationLink.state}
                                >
                                    Descobrir a minha consulta
                                </HomeActionLink>
                            ) : null}
                        </div>

                        <article
                            className="mockup-consultation-showcase"
                            aria-label="Pré-visualização de maquilhagem personalizada"
                        >
                            <header className="mockup-consultation-showcase__header">
                                <span className="mockup-consultation-showcase__eyebrow">
                                    A tua inspiração
                                </span>
                                <h3>Um look pensado para ti</h3>
                            </header>

                            <div className="mockup-consultation-intent">
                                <span>O teu look</span>
                                <blockquote>
                                    “Luminosa, natural e elegante.”
                                </blockquote>
                            </div>

                            <div className="mockup-makeup-preview">
                                <figure>
                                    <OptimizedImage
                                        src="/home/orelle-makeup-original-960.webp"
                                        alt="Retrato original sem a pré-visualização de maquilhagem"
                                        width={960}
                                        height={960}
                                        sizes="(max-width: 620px) calc((100vw - 4.5rem) / 2), 240px"
                                        avifSrcSet="/home/orelle-makeup-original-320.avif 320w, /home/orelle-makeup-original-520.avif 520w, /home/orelle-makeup-original-960.avif 960w"
                                        webpSrcSet="/home/orelle-makeup-original-320.webp 320w, /home/orelle-makeup-original-520.webp 520w, /home/orelle-makeup-original-960.webp 960w"
                                    />
                                    <figcaption>Original</figcaption>
                                </figure>
                                <span
                                    className="mockup-makeup-preview__transition"
                                    aria-hidden="true"
                                >
                                    →
                                </span>
                                <figure>
                                    <OptimizedImage
                                        src="/home/orelle-makeup-preview-960.webp"
                                        alt="Pré-visualização de maquilhagem luminosa em tons rose-gold"
                                        width={960}
                                        height={960}
                                        sizes="(max-width: 620px) calc((100vw - 4.5rem) / 2), 240px"
                                        avifSrcSet="/home/orelle-makeup-preview-320.avif 320w, /home/orelle-makeup-preview-520.avif 520w, /home/orelle-makeup-preview-960.avif 960w"
                                        webpSrcSet="/home/orelle-makeup-preview-320.webp 320w, /home/orelle-makeup-preview-520.webp 520w, /home/orelle-makeup-preview-960.webp 960w"
                                    />
                                    <figcaption>Com IA</figcaption>
                                </figure>
                            </div>

                            <div className="mockup-consultation-insight">
                                <span aria-hidden="true">IA</span>
                                <div>
                                    <strong>Sugestão da IA</strong>
                                    <p>
                                        Tons rosados suaves e um acabamento luminoso para
                                        um look leve, elegante e natural.
                                    </p>
                                </div>
                            </div>

                            <p className="mockup-makeup-note">
                                Imagem gerada por IA — o resultado real poderá variar.
                            </p>
                        </article>
                    </div>
                </section>

                <section
                    className="mockup-skin-section"
                    aria-labelledby="mockup-skin-title"
                >
                    <div className="mockup-section-inner mockup-skin-grid">
                        <div className="mockup-skin-copy">
                            <p className="mockup-pill mockup-pill--gold">
                                Cuidados que começam por te ouvir
                            </p>
                            <h2 id="mockup-skin-title">
                                Compreender a tua pele muda tudo
                            </h2>
                            <p>
                                A consulta adapta as perguntas ao que procuras —
                                hidratação, oleosidade, sensibilidade, manchas e
                                luminosidade, proteção solar ou acne e imperfeições —
                                para construir uma rotina cosmética mais clara e
                                realista.
                            </p>
                            <ul
                                className="mockup-skin-benefits"
                                aria-label="Benefícios dos cuidados de pele"
                            >
                                <li>
                                    <strong>Perguntas com propósito</strong>
                                    <span>
                                        A conversa aprofunda apenas o que importa para o
                                        teu objetivo.
                                    </span>
                                </li>
                                <li>
                                    <strong>Uma rotina possível</strong>
                                    <span>
                                        Passos simples, cuidados e cautelas pensados para
                                        o teu dia a dia.
                                    </span>
                                </li>
                                <li>
                                    <strong>Produtos pensados para ti</strong>
                                    <span>
                                        Sugestões do catálogo escolhidas a partir do teu
                                        perfil e das tuas preferências.
                                    </span>
                                </li>
                            </ul>
                            {consultationLink ? (
                                <HomeActionLink
                                    variant="gold"
                                    to={consultationLink.to}
                                    state={consultationLink.state}
                                >
                                    Começar a minha consulta
                                </HomeActionLink>
                            ) : null}
                            <p className="mockup-skin-note">
                                Orientação cosmética — não substitui avaliação médica.
                            </p>
                        </div>

                        <article
                            className="mockup-skin-dialogue"
                            aria-label="Conversa sobre cuidados de pele"
                        >
                            <header className="mockup-skin-dialogue__header">
                                <span>Consulta com IA</span>
                                <h3>Uma conversa que se adapta a ti</h3>
                            </header>
                            <ol
                                className="mockup-skin-dialogue__messages"
                                aria-label="Perguntas e respostas da consulta"
                            >
                                <li
                                    className="mockup-skin-dialogue__message mockup-skin-dialogue__message--orelle"
                                    aria-label="Orélle pergunta o que gostarias de melhorar na tua pele"
                                >
                                    <span className="mockup-skin-dialogue__speaker">
                                        Orélle
                                    </span>
                                    <p>O que gostarias de melhorar na tua pele?</p>
                                </li>
                                <li
                                    className="mockup-skin-dialogue__message mockup-skin-dialogue__message--user"
                                    aria-label="Tu respondes que queres controlar a oleosidade sem desconforto"
                                >
                                    <span className="mockup-skin-dialogue__speaker">
                                        Tu
                                    </span>
                                    <p>
                                        Quero controlar a oleosidade sem deixar a pele
                                        desconfortável.
                                    </p>
                                </li>
                                <li
                                    className="mockup-skin-dialogue__message mockup-skin-dialogue__message--orelle"
                                    aria-label="Orélle pergunta se sentes a pele repuxada depois da limpeza"
                                >
                                    <span className="mockup-skin-dialogue__speaker">
                                        Orélle
                                    </span>
                                    <p>
                                        Depois da limpeza, sentes a pele repuxada em
                                        alguma zona?
                                    </p>
                                </li>
                                <li
                                    className="mockup-skin-dialogue__message mockup-skin-dialogue__message--user"
                                    aria-label="Tu respondes que sim, sobretudo nas bochechas"
                                >
                                    <span className="mockup-skin-dialogue__speaker">
                                        Tu
                                    </span>
                                    <p>Sim, sobretudo nas bochechas.</p>
                                </li>
                            </ol>
                            <div className="mockup-skin-dialogue__summary">
                                <span aria-hidden="true">
                                    <NavIcon name="sparkles" />
                                </span>
                                <div>
                                    <strong>Foco da consulta</strong>
                                    <p>
                                        Equilibrar a oleosidade e respeitar a barreira da
                                        pele.
                                    </p>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>

                <section className="mockup-features-section" aria-labelledby="mockup-features-title">
                    <div className="mockup-section-inner">
                        <div className="mockup-section-heading">
                            <h2 id="mockup-features-title">Porque escolher a Orélle?</h2>
                            <p>Tecnologia e cuidado para escolheres com mais confiança.</p>
                        </div>
                        <div className="mockup-feature-grid">
                            {FEATURE_CARDS.map((feature) => (
                                <article className="mockup-feature-card" key={feature.title}>
                                    <span
                                        className="mockup-feature-card__icon"
                                        aria-hidden="true"
                                    >
                                        <NavIcon name={feature.icon} />
                                    </span>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mockup-products-section" id="produtos" aria-labelledby="mockup-products-title">
                    <div className="mockup-section-inner">
                        <div className="mockup-section-heading">
                            <h2 id="mockup-products-title">Produtos em destaque</h2>
                            <p>Os produtos com melhor desempenho e stock disponível.</p>
                        </div>
                        <div className="mockup-products-content">
                            {featuredStatus === "loading" && (
                                <p className="mockup-products-state" role="status">
                                    A carregar produtos em destaque...
                                </p>
                            )}
                            {featuredStatus === "error" && (
                                <p className="mockup-products-state" role="alert">
                                    Não foi possível carregar os produtos em destaque.
                                </p>
                            )}
                            {featuredStatus === "empty" && (
                                <p className="mockup-products-state">
                                    Ainda não existem produtos com stock para destacar.
                                </p>
                            )}
                            {featuredStatus === "success" && (
                                <ul className="product-card-grid mockup-featured-products-grid">
                                    {featuredProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            headingLevel={3}
                                            statusLabel="Disponível"
                                        >
                                            <Link
                                                className="text-link"
                                                to={`/produtos/${product.id}`}
                                            >
                                                Ver produto
                                            </Link>
                                        </ProductCard>
                                    ))}
                                </ul>
                            )}
                            <HomeActionLink variant="secondary" to="/produtos">
                                Abrir catálogo
                            </HomeActionLink>
                        </div>
                    </div>
                </section>

                {consultationLink && (
                <section className="mockup-cta-section" aria-labelledby="mockup-cta-title">
                    <div className="mockup-section-inner">
                        <p className="mockup-cta-icon" aria-hidden="true">IA</p>
                        <h2 id="mockup-cta-title">Descobre o que combina contigo</h2>
                        <p>
                            Partilha os teus objetivos e recebe uma experiência personalizada,
                            da rotina ao look que mais te inspira.
                        </p>
                        <HomeActionLink
                            variant="gold"
                            to={consultationLink.to}
                            state={consultationLink.state}
                        >
                            {consultationLink.actionLabel}
                        </HomeActionLink>
                    </div>
                </section>
                )}
            </main>

            <footer className="mockup-footer">
                <div className="mockup-section-inner mockup-footer-grid">
                    <div>
                        <BrandLogo
                            variant="full"
                            tone="light"
                            className="mockup-footer-brand"
                        />
                        <p>Beleza, cuidado e escolhas pensadas para ti.</p>
                    </div>
                    <div>
                        <h3>Produtos</h3>
                        <Link to="/produtos">Catálogo</Link>
                    </div>
                    {consultationLink && <div>
                        <h3>Consulta</h3>
                        <Link
                            to={consultationLink.to}
                            state={consultationLink.state}
                        >
                            {consultationLink.footerLabel}
                        </Link>
                    </div>}
                    <div>
                        <h3>Conta</h3>
                        {user && roleDestination ? (
                            <>
                                <Link to={roleDestination.to}>{roleDestination.label}</Link>
                                <p>
                                    {user.email} · {getUserRoleLabel(user.role)}
                                </p>
                            </>
                        ) : !user ? (
                            <>
                                <Link to="/login">Iniciar sessão</Link>
                                <Link to="/registo">Registo</Link>
                            </>
                        ) : null}
                    </div>
                    <div>
                        <h3>Aparência</h3>
                        <ThemeControls />
                    </div>
                </div>
            </footer>

            {isClient && consultationLink && <div className="mockup-floating-ai">
                <span aria-hidden="true" />
                <button
                    type="button"
                    aria-label="Abrir consulta assistida"
                    onClick={() =>
                        navigate(consultationLink.to, {
                            state: consultationLink.state,
                        })
                    }
                >
                    IA
                </button>
                <small>IA</small>
            </div>}
        </div>
    );
}
