/**
 * Composicao principal do frontend real_dev.
 *
 * A aplicacao usa routing real para separar homepage, catalogo, area do cliente,
 * consultoria e administracao. As regras de negocio e autorizacao continuam nos
 * endpoints da API; o frontend apenas organiza a navegacao e os fluxos.
 */
import React from "react";
import {
    Navigate,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider, useCart } from "./context/CartContext.jsx";
import { ConsultationAvailabilityProvider } from "./context/ConsultationAvailabilityContext.jsx";
import {
    AdminLayout,
    AuthLayout,
    ClientLayout,
    ConsultantLayout,
    NotFoundPage,
    PublicLayout,
    RequireRole,
    USER_ROLES,
} from "./components/AppLayouts.jsx";
import { MeasuredPageSection } from "./components/MeasuredPageSection.jsx";
import { getRouteTitle } from "./services/routePresentation.js";

/** Converte um export nomeado num componente lazy sem alterar os módulos. */
function lazyNamed(loader, exportName) {
    return React.lazy(async () => {
        const loadedModule = await loader();
        return { default: loadedModule[exportName] };
    });
}

/**
 * Contém falhas inesperadas de render ou de chunks lazy sem deixar a aplicação
 * num ecrã vazio. Não apresenta detalhes internos do erro ao utilizador.
 */
class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { failed: false };
    }

    static getDerivedStateFromError() {
        return { failed: true };
    }

    render() {
        if (this.state.failed) {
            return (
                <main id="main-content" className="route-status" tabIndex={-1}>
                    <p role="alert">
                        Não foi possível apresentar esta página. Verifica a ligação e
                        tenta recarregar.
                    </p>
                    <button type="button" onClick={() => window.location.reload()}>
                        Recarregar aplicação
                    </button>
                </main>
            );
        }

        return this.props.children;
    }
}

const OrelleMockupHome = lazyNamed(
    () => import("./components/OrelleMockupHome.jsx"),
    "OrelleMockupHome",
);
const AccountOverviewPage = lazyNamed(() => import("./pages/AccountOverviewPage.jsx"), "AccountOverviewPage");
const AdminCategoriesPage = lazyNamed(() => import("./pages/AdminCategoriesPage.jsx"), "AdminCategoriesPage");
const AdminDashboardPage = lazyNamed(() => import("./pages/AdminDashboardPage.jsx"), "AdminDashboardPage");
const AdminExportsPage = lazyNamed(() => import("./pages/AdminExportsPage.jsx"), "AdminExportsPage");
const AdminNotificationsPage = lazyNamed(() => import("./pages/AdminNotificationsPage.jsx"), "AdminNotificationsPage");
const AdminOrdersPage = lazyNamed(() => import("./pages/AdminOrdersPage.jsx"), "AdminOrdersPage");
const AdminProductsPage = lazyNamed(() => import("./pages/AdminProductsPage.jsx"), "AdminProductsPage");
const AdminProductCreatePage = lazyNamed(() => import("./pages/AdminProductCreatePage.jsx"), "AdminProductCreatePage");
const AdminReviewsPage = lazyNamed(() => import("./pages/AdminReviewsPage.jsx"), "AdminReviewsPage");
const AdminUsersPage = lazyNamed(() => import("./pages/AdminUsersPage.jsx"), "AdminUsersPage");
const BiometricAuditPage = lazyNamed(() => import("./pages/BiometricAuditPage.jsx"), "BiometricAuditPage");
const BiometricDataRequestPage = lazyNamed(() => import("./pages/BiometricDataRequestPage.jsx"), "BiometricDataRequestPage");
const BiometricDataRequestsAdminPage = lazyNamed(() => import("./pages/BiometricDataRequestsAdminPage.jsx"), "BiometricDataRequestsAdminPage");
const CartDrawer = lazyNamed(() => import("./components/CartDrawer.jsx"), "CartDrawer");
const CartLegacyRoute = lazyNamed(
    () => import("./components/CartLegacyRoute.jsx"),
    "CartLegacyRoute",
);
const CheckoutPage = lazyNamed(() => import("./pages/CheckoutPage.jsx"), "CheckoutPage");
const ActiveConsultationPage = lazyNamed(() => import("./features/consultation/ActiveConsultationPage.jsx"), "ActiveConsultationPage");
const ConsultationDashboardPage = lazyNamed(() => import("./features/consultation/ConsultationDashboardPage.jsx"), "ConsultationDashboardPage");
const ConsultationHistoryPage = lazyNamed(() => import("./features/consultation/ConsultationHistoryPage.jsx"), "ConsultationHistoryPage");
const ConsultationReportPage = lazyNamed(() => import("./features/consultation/ConsultationReportPage.jsx"), "ConsultationReportPage");
const ConsultationReviewsPage = lazyNamed(() => import("./features/consultation/ConsultationReviewsPage.jsx"), "ConsultationReviewsPage");
const NewConsultationPage = lazyNamed(() => import("./features/consultation/NewConsultationPage.jsx"), "NewConsultationPage");
const DailyRoutinePage = lazyNamed(() => import("./pages/DailyRoutinePage.jsx"), "DailyRoutinePage");
const LoginPage = lazyNamed(() => import("./pages/LoginPage.jsx"), "LoginPage");
const NotificationsPage = lazyNamed(() => import("./pages/NotificationsPage.jsx"), "NotificationsPage");
const PreferencesPage = lazyNamed(() => import("./pages/PreferencesPage.jsx"), "PreferencesPage");
const ProductDetailsPage = lazyNamed(() => import("./pages/ProductDetailsPage.jsx"), "ProductDetailsPage");
const ProductReviewPage = lazyNamed(() => import("./pages/ProductReviewPage.jsx"), "ProductReviewPage");
const ProductSearchPage = lazyNamed(() => import("./pages/ProductSearchPage.jsx"), "ProductSearchPage");
const ProfileSetupPage = lazyNamed(() => import("./pages/ProfileSetupPage.jsx"), "ProfileSetupPage");
const PurchaseHistoryPage = lazyNamed(() => import("./pages/PurchaseHistoryPage.jsx"), "PurchaseHistoryPage");
const RegisterPage = lazyNamed(() => import("./pages/RegisterPage.jsx"), "RegisterPage");
const RelatedProductsPage = lazyNamed(() => import("./pages/RelatedProductsPage.jsx"), "RelatedProductsPage");
const RoutineAlertsPage = lazyNamed(() => import("./pages/RoutineAlertsPage.jsx"), "RoutineAlertsPage");
const SkinComparisonPage = lazyNamed(() => import("./pages/SkinComparisonPage.jsx"), "SkinComparisonPage");
const SkinEvolutionPage = lazyNamed(() => import("./pages/SkinEvolutionPage.jsx"), "SkinEvolutionPage");
const SkinHistoryPage = lazyNamed(() => import("./pages/SkinHistoryPage.jsx"), "SkinHistoryPage");
const SkinOverviewPage = lazyNamed(() => import("./pages/SkinOverviewPage.jsx"), "SkinOverviewPage");
const StockAdminPage = lazyNamed(() => import("./pages/StockAdminPage.jsx"), "StockAdminPage");

const CLIENT_ONLY = [USER_ROLES.CLIENTE];
const CONSULTANT_ROLES = [USER_ROLES.CONSULTOR, USER_ROLES.ADMINISTRADOR];
const ADMIN_ONLY = [USER_ROLES.ADMINISTRADOR];

/** Atualiza título/idioma e move o foco para o conteúdo após navegação. */
function RoutePresentationEffects() {
    const location = useLocation();
    const previousPathRef = React.useRef(location.pathname);

    React.useEffect(() => {
        document.documentElement.lang = "pt-PT";
        document.title = `${getRouteTitle(location.pathname)} | Orélle`;
        const pathnameChanged = previousPathRef.current !== location.pathname;
        previousPathRef.current = location.pathname;

        // No carregamento inicial o foco fica no início do documento para que
        // o primeiro Tab encontre o skip-link. Só navegações SPA movem o foco.
        if (!pathnameChanged) return undefined;

        const frameId = window.requestAnimationFrame(() => {
            const main = document.querySelector("main");
            if (!main) return;
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
            main.tabIndex = -1;
            main.focus({ preventScroll: true });
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [location.pathname]);

    return null;
}

/**
 * Renderiza uma area principal medida sem expor uma montra tecnica.
 *
 * @function MeasuredRoute
 * @param {{pageKey: string, label: string, children: React.ReactNode}} props - Conteudo da rota.
 * @returns {JSX.Element} Rota com medicao MF6 preservada.
 */
function MeasuredRoute({ pageKey, label, children }) {
    return (
        <MeasuredPageSection pageKey={pageKey} label={label}>
            {children}
        </MeasuredPageSection>
    );
}

/**
 * Define as rotas da aplicacao.
 *
 * @function AppRoutes
 * @returns {JSX.Element} Arvore de rotas React Router.
 */
function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<OrelleMockupHome />} />

            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registo" element={<RegisterPage />} />
            </Route>

            <Route element={<PublicLayout />}>
                <Route
                    path="/produtos"
                    element={
                        <MeasuredRoute pageKey="catalog" label="Catálogo">
                            <ProductSearchPage />
                        </MeasuredRoute>
                    }
                />
                <Route path="/produtos/:productId" element={<ProductDetailsPage />} />
                <Route
                    path="/produtos/:productId/relacionados"
                    element={<RelatedProductsPage />}
                />
                <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route
                element={
                    <RequireRole allowedRoles={CLIENT_ONLY}>
                        <ClientLayout />
                    </RequireRole>
                }
            >
                <Route path="/conta" element={<AccountOverviewPage />} />
                <Route path="/conta/perfil" element={<ProfileSetupPage />} />
                <Route
                    path="/conta/editar"
                    element={<Navigate to="/conta/perfil" replace />}
                />
                <Route path="/conta/preferencias" element={<PreferencesPage />} />
                <Route
                    path="/conta/privacidade-biometrica"
                    element={<BiometricDataRequestPage />}
                />
                <Route
                    path="/produtos/:productId/avaliar"
                    element={<ProductReviewPage />}
                />
                <Route path="/consulta" element={<ConsultationDashboardPage />} />
                <Route path="/consulta/nova" element={<NewConsultationPage />} />
                <Route
                    path="/consulta/ativa"
                    element={
                        <MeasuredRoute
                            pageKey="guided-consultation"
                            label="Consulta guiada"
                        >
                            <ActiveConsultationPage />
                        </MeasuredRoute>
                    }
                />
                <Route
                    path="/consulta/relatorios/:reportId/*"
                    element={
                        <MeasuredRoute
                            pageKey="consultation-report"
                            label="Relatório da consulta"
                        >
                            <ConsultationReportPage />
                        </MeasuredRoute>
                    }
                />
                <Route
                    path="/consulta/sessao"
                    element={<Navigate to="/consulta/ativa" replace />}
                />
                <Route
                    path="/consulta/recomendacoes"
                    element={<Navigate to="/consulta" replace />}
                />
                <Route
                    path="/consulta/historico"
                    element={
                        <MeasuredRoute pageKey="ai-history" label="Histórico IA">
                            <ConsultationHistoryPage />
                        </MeasuredRoute>
                    }
                />
                <Route
                    path="/consulta/insights"
                    element={<Navigate to="/consulta/historico" replace />}
                />
                <Route
                    path="/pele/fotografias"
                    element={<Navigate to="/consulta/nova" replace />}
                />
                <Route path="/pele" element={<SkinOverviewPage />} />
                <Route
                    path="/pele/analise"
                    element={<Navigate to="/consulta/ativa" replace />}
                />
                <Route
                    path="/pele/relatorio"
                    element={<Navigate to="/consulta" replace />}
                />
                <Route path="/pele/historico" element={<SkinHistoryPage />} />
                <Route path="/pele/evolucao" element={<SkinEvolutionPage />} />
                <Route path="/pele/comparacao" element={<SkinComparisonPage />} />
                <Route
                    path="/pele/simulacao"
                    element={<Navigate to="/consulta" replace />}
                />
                <Route
                    path="/pele/antes-depois/:simulationId"
                    element={<Navigate to="/consulta" replace />}
                />
                <Route path="/rotina" element={<DailyRoutinePage />} />
                <Route path="/rotina/alertas" element={<RoutineAlertsPage />} />
                <Route
                    path="/carrinho"
                    element={<CartLegacyRoute />}
                />
                <Route
                    path="/checkout"
                    element={
                        <MeasuredRoute
                            pageKey="checkout"
                            label="Confirmar encomenda"
                        >
                            <CheckoutPage />
                        </MeasuredRoute>
                    }
                />
                <Route path="/compras" element={<PurchaseHistoryPage />} />
                <Route path="/notificacoes" element={<NotificationsPage />} />
            </Route>

            <Route
                element={
                    <RequireRole allowedRoles={CONSULTANT_ROLES}>
                        <ConsultantLayout />
                    </RequireRole>
                }
            >
                <Route path="/consultoria/revisoes" element={<ConsultationReviewsPage />} />
                <Route
                    path="/consultoria/revisoes-ia"
                    element={<Navigate to="/consultoria/revisoes" replace />}
                />
            </Route>

            <Route
                element={
                    <RequireRole allowedRoles={ADMIN_ONLY}>
                        <AdminLayout />
                    </RequireRole>
                }
            >
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/produtos" element={<AdminProductsPage />} />
                <Route path="/admin/produtos/novo" element={<AdminProductCreatePage />} />
                <Route path="/admin/categorias" element={<AdminCategoriesPage />} />
                <Route path="/admin/utilizadores" element={<AdminUsersPage />} />
                <Route
                    path="/admin/pedidos-privacidade"
                    element={<BiometricDataRequestsAdminPage />}
                />
                <Route path="/admin/avaliacoes" element={<AdminReviewsPage />} />
                <Route path="/admin/exportacoes" element={<AdminExportsPage />} />
                <Route path="/admin/campanhas" element={<AdminNotificationsPage />} />
                <Route path="/admin/encomendas" element={<AdminOrdersPage />} />
                <Route path="/admin/stock" element={<StockAdminPage />} />
                <Route path="/admin/auditoria-biometrica" element={<BiometricAuditPage />} />
            </Route>

        </Routes>
    );
}

/** Carrega o painel comercial apenas quando o cliente o abre. */
function GlobalCartDrawer() {
    const { isOpen } = useCart();
    if (!isOpen) return null;

    return (
        <React.Suspense
            fallback={
                <p className="cart-drawer-loading" role="status">
                    A abrir o carrinho…
                </p>
            }
        >
            <MeasuredPageSection pageKey="cart" label="Carrinho">
                <CartDrawer />
            </MeasuredPageSection>
        </React.Suspense>
    );
}

/**
 * Renderiza a aplicacao real_dev.
 *
 * @function App
 * @returns {JSX.Element} Aplicacao React com contexto de autenticacao e routing.
 */
export function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <ConsultationAvailabilityProvider>
                    <a className="skip-link" href="#main-content">
                        Saltar para o conteúdo principal
                    </a>
                    <AppErrorBoundary>
                        <React.Suspense
                            fallback={
                                <main
                                    id="main-content"
                                    className="route-status"
                                    aria-busy="true"
                                    tabIndex={-1}
                                >
                                    <p role="status">A carregar página.</p>
                                </main>
                            }
                        >
                            <RoutePresentationEffects />
                            <AppRoutes />
                        </React.Suspense>
                        <GlobalCartDrawer />
                    </AppErrorBoundary>
                </ConsultationAvailabilityProvider>
            </CartProvider>
        </AuthProvider>
    );
}
