/**
 * Composicao principal do frontend real_dev.
 *
 * Os guias ainda nao introduzem routing final. Por isso, o App expoe todas as
 * paginas criadas pelos BKs implementados em sequencia, exatamente para
 * facilitar smoke testing manual de cada fluxo.
 */
import React, { useState } from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage.jsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.jsx";
import { AdminExportsPage } from "./pages/AdminExportsPage.jsx";
import { AdminNotificationsPage } from "./pages/AdminNotificationsPage.jsx";
import { AdminProductCreatePage } from "./pages/AdminProductCreatePage.jsx";
import { AdminReviewsPage } from "./pages/AdminReviewsPage.jsx";
import { AdminUsersPage } from "./pages/AdminUsersPage.jsx";
import { BiometricAuditPage } from "./pages/BiometricAuditPage.jsx";
import { BiometricDataRequestPage } from "./pages/BiometricDataRequestPage.jsx";
import { BiometricDataRequestsAdminPage } from "./pages/BiometricDataRequestsAdminPage.jsx";
import { BeforeAfterVisualizationPage } from "./pages/BeforeAfterVisualizationPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import { CheckoutPage } from "./pages/CheckoutPage.jsx";
import { ConsultantRecommendationReviewPage } from "./pages/ConsultantRecommendationReviewPage.jsx";
import { DailyRoutinePage } from "./pages/DailyRoutinePage.jsx";
import { EditProfilePage } from "./pages/EditProfilePage.jsx";
import { FaceAnalysisPage } from "./pages/FaceAnalysisPage.jsx";
import { FacePhotoUploadPage } from "./pages/FacePhotoUploadPage.jsx";
import { FaceReportPage } from "./pages/FaceReportPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { MakeupSimulationPage } from "./pages/MakeupSimulationPage.jsx";
import { PreferencesPage } from "./pages/PreferencesPage.jsx";
import { ProductDetailsPage } from "./pages/ProductDetailsPage.jsx";
import { ProductRecommendationsPage } from "./pages/ProductRecommendationsPage.jsx";
import { ProductReviewPage } from "./pages/ProductReviewPage.jsx";
import { ProductSearchPage } from "./pages/ProductSearchPage.jsx";
import { ProfileSetupPage } from "./pages/ProfileSetupPage.jsx";
import { PurchaseHistoryPage } from "./pages/PurchaseHistoryPage.jsx";
import { NotificationsPage } from "./pages/NotificationsPage.jsx";
import { RelatedProductsPage } from "./pages/RelatedProductsPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { RoutineAlertsPage } from "./pages/RoutineAlertsPage.jsx";
import { SkinComparisonPage } from "./pages/SkinComparisonPage.jsx";
import { SkinEvolutionPage } from "./pages/SkinEvolutionPage.jsx";
import { SkinHistoryPage } from "./pages/SkinHistoryPage.jsx";
import { StockAdminPage } from "./pages/StockAdminPage.jsx";
import { MeasuredPageSection } from "./components/MeasuredPageSection.jsx";
import { ThemeControls } from "./components/ThemeControls.jsx";
import { useAuth } from "./context/AuthContext.jsx";

/**
 * Agrupa paginas por responsabilidade visual sem substituir autorizacao.
 *
 * A autorizacao continua nos gates de role e na API; este componente serve
 * apenas para tornar a experiencia MF5 mais previsivel em desktop e mobile.
 *
 * @function SectionGroup
 * @param {{title: string, description: string, children: React.ReactNode}} props - Conteudo e contexto do grupo.
 * @returns {JSX.Element} Grupo responsivo de paginas.
 */
function SectionGroup({ title, description, children }) {
    return (
        <section className="section-group">
            <header className="section-group-header">
                <h2>{title}</h2>
                <p>{description}</p>
            </header>
            <div className="section-grid">{children}</div>
        </section>
    );
}

/**
 * Conteudo da aplicacao com acesso ao estado autenticado.
 *
 * @function AppContent
 * @returns {JSX.Element} Paginas MF0-MF5 agrupadas por papel, com gates de role preservados.
 */
function AppContent() {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [latestMakeupSimulation, setLatestMakeupSimulation] = useState(null);
    const isAdmin = user?.role === "administrador";
    const canReviewRecommendations =
        user?.role === "consultor" || user?.role === "administrador";

    return (
        <div className="app-shell">
            <header className="app-header">
                <div>
                    <p className="app-kicker">Experiencia Orélle</p>
                    <h1>Orélle</h1>
                </div>
                <div className="app-header__actions">
                    {/* O tema e visual; autenticacao e roles continuam no AuthContext/API. */}
                    <ThemeControls />

                    {user && (
                        <p className="session-pill">
                            {user.email} · {user.role}
                        </p>
                    )}
                </div>
            </header>

            <SectionGroup
                title="Conta e experiencia do cliente"
                description="Fluxos principais de perfil, catalogo, recomendacoes, carrinho e acompanhamento pessoal."
            >
                <RegisterPage />
                <LoginPage />
                <ProfileSetupPage />
                <EditProfilePage />
                <PreferencesPage />
                <MeasuredPageSection pageKey="catalog" label="Catalogo">
                    <ProductSearchPage />
                </MeasuredPageSection>
                <ProductDetailsPage />
                <ProductReviewPage />
                <RelatedProductsPage />
                <FacePhotoUploadPage />
                <BiometricDataRequestPage />
                <MeasuredPageSection pageKey="face-analysis" label="Analise facial">
                    <FaceAnalysisPage />
                </MeasuredPageSection>
                <MeasuredPageSection pageKey="face-report" label="Relatorio facial">
                    <FaceReportPage />
                </MeasuredPageSection>
                <SkinHistoryPage />
                <SkinEvolutionPage />
                <MeasuredPageSection
                    pageKey="recommendations"
                    label="Recomendacoes"
                >
                    <ProductRecommendationsPage
                        onRecommendationsChange={setRecommendations}
                    />
                </MeasuredPageSection>
                <DailyRoutinePage />
                <MakeupSimulationPage
                    onSimulationCreated={setLatestMakeupSimulation}
                />
                <BeforeAfterVisualizationPage simulation={latestMakeupSimulation} />
                <SkinComparisonPage />
                <MeasuredPageSection pageKey="cart" label="Carrinho">
                    <CartPage />
                </MeasuredPageSection>
                <MeasuredPageSection pageKey="checkout" label="Checkout">
                    <CheckoutPage />
                </MeasuredPageSection>
                <PurchaseHistoryPage />
                <NotificationsPage />
                <RoutineAlertsPage />
            </SectionGroup>

            {canReviewRecommendations && (
                <SectionGroup
                    title="Consultoria e privacidade"
                    description="Revisao assistida e tratamento operacional de pedidos biometricos sem expor dados sensiveis."
                >
                    <ConsultantRecommendationReviewPage
                        recommendations={recommendations}
                    />
                    <BiometricDataRequestsAdminPage />
                </SectionGroup>
            )}

            {isAdmin && (
                <SectionGroup
                    title="Administracao"
                    description="Gestao operacional, auditoria e metricas reservadas a administradores."
                >
                    <AdminProductCreatePage />
                    <AdminCategoriesPage />
                    <AdminUsersPage />
                    <AdminReviewsPage />
                    <AdminExportsPage />
                    <AdminNotificationsPage />
                    <AdminDashboardPage />
                    <StockAdminPage />
                    <BiometricAuditPage />
                </SectionGroup>
            )}
        </div>
    );
}

/**
 * Renderiza a aplicacao real_dev.
 *
 * @function App
 * @returns {JSX.Element} Aplicacao React com contexto de autenticacao.
 */
export function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
