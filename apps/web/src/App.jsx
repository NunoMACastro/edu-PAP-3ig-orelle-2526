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
import { useAuth } from "./context/AuthContext.jsx";
import { BiometricDataRequestsAdminPage } from "./pages/BiometricDataRequestsAdminPage.jsx";
import { BiometricAuditPage } from "./pages/BiometricAuditPage.jsx";
import { ThemeControls } from "./components/ThemeControls.jsx";
/**
 * Agrupa páginas por responsabilidade visual sem criar router.
 *
 * @function SectionGroup
 * @param {{title: string, children: React.ReactNode}} props - Título e conteúdo.
 * @returns {JSX.Element} Secção responsiva.
 */
function SectionGroup({ title, children }) {
    return (
        <section className="section-group">
            <h2>{title}</h2>
            <div className="section-grid">{children}</div>
        </section>
    );
}

/**
 * Agrupa páginas por responsabilidade visual sem criar router.
 *
 * @function SectionGroup
 * @param {{title: string, children: React.ReactNode}} props - Título e conteúdo.
 * @returns {JSX.Element} Secção responsiva.
 */
function SectionGroup({ title, children }) {
    return (
        <section className="section-group">
            <h2>{title}</h2>
            <div className="section-grid">{children}</div>
        </section>
    );
}

/**
 * Conteúdo principal com zonas de cliente, consultoria e administração.
 *
 * @function AppContent
 * @returns {JSX.Element} Interface principal responsiva sem regressão das páginas já existentes.
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
                    <p className="app-kicker">Experiência Orélle</p>
                    <h1>Orélle</h1>
                </div>

                <div className="app-header__actions">
                    {/* O tema é visual; a sessão continua a vir do AuthContext. */}
                    <ThemeControls />

                    {user && (
                        <p className="session-pill">
                            {/* Email e role mantêm a mesma origem e não são guardados pelo tema. */}
                            {user.email} · {user.role}
                        </p>
                    )}
                </div>
            </header>
            <SectionGroup title="Conta e experiência do cliente">
                <RegisterPage />
                <LoginPage />
                <ProfileSetupPage />
                <EditProfilePage />
                <PreferencesPage />
                <ProductSearchPage />
                <ProductDetailsPage />
                <ProductReviewPage />
                <RelatedProductsPage />
                <FacePhotoUploadPage />
                <FaceAnalysisPage />
                <FaceReportPage />
                <SkinHistoryPage />
                <SkinEvolutionPage />
                <ProductRecommendationsPage
                    onRecommendationsChange={setRecommendations}
                />
                <DailyRoutinePage />
                <MakeupSimulationPage
                    onSimulationCreated={setLatestMakeupSimulation}
                />
                <BeforeAfterVisualizationPage simulation={latestMakeupSimulation} />
                <SkinComparisonPage />
                <CartPage />
                <CheckoutPage />
                <PurchaseHistoryPage />
                <NotificationsPage />
                <RoutineAlertsPage />
            </SectionGroup>

            {canReviewRecommendations && (
                <SectionGroup title="Consultoria e privacidade">
                    <ConsultantRecommendationReviewPage
                        recommendations={recommendations}
                    />
                    <BiometricDataRequestsAdminPage />
                </SectionGroup>
            )}

            {isAdmin && (
                <SectionGroup title="Administração">
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