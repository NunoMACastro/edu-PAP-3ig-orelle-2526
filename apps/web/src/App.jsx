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

/**
 * Conteudo da aplicacao com acesso ao estado autenticado.
 *
 * @function AppContent
 * @returns {JSX.Element} Paginas MF0-MF2, com controlos admin visiveis apenas para admin.
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
                    <p className="app-kicker">real_dev</p>
                    <h1>Orélle</h1>
                </div>
                {user && (
                    <p className="session-pill">
                        {user.email} · {user.role}
                    </p>
                )}
            </header>

            <div className="page-stack">
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
                {canReviewRecommendations && (
                    <ConsultantRecommendationReviewPage
                        recommendations={recommendations}
                    />
                )}
                {isAdmin && (
                    <>
                        <AdminProductCreatePage />
                        <AdminCategoriesPage />
                        <AdminUsersPage />
                        <AdminReviewsPage />
                        <AdminExportsPage />
                        <AdminNotificationsPage />
                        <AdminDashboardPage />
                        <StockAdminPage />
                    </>
                )}
            </div>
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
