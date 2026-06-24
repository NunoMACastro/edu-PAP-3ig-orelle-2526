/**
 * Composição principal do frontend Orélle.
 *
 * Os guias ainda não introduzem routing final. Por isso, o App expõe as páginas
 * criadas pelos BKs em sequência e mede as áreas principais exigidas por RNF06.
 */
import React, { useState } from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import { MeasuredPageSection } from "./components/MeasuredPageSection.jsx";
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
import { NotificationsPage } from "./pages/NotificationsPage.jsx";
import { PreferencesPage } from "./pages/PreferencesPage.jsx";
import { ProductDetailsPage } from "./pages/ProductDetailsPage.jsx";
import { ProductRecommendationsPage } from "./pages/ProductRecommendationsPage.jsx";
import { ProductReviewPage } from "./pages/ProductReviewPage.jsx";
import { ProductSearchPage } from "./pages/ProductSearchPage.jsx";
import { ProfileSetupPage } from "./pages/ProfileSetupPage.jsx";
import { PurchaseHistoryPage } from "./pages/PurchaseHistoryPage.jsx";
import { RelatedProductsPage } from "./pages/RelatedProductsPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { RoutineAlertsPage } from "./pages/RoutineAlertsPage.jsx";
import { SkinComparisonPage } from "./pages/SkinComparisonPage.jsx";
import { SkinEvolutionPage } from "./pages/SkinEvolutionPage.jsx";
import { SkinHistoryPage } from "./pages/SkinHistoryPage.jsx";
import { StockAdminPage } from "./pages/StockAdminPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

/**
 * Conteúdo da aplicação com acesso ao estado autenticado.
 *
 * @function AppContent
 * @returns {JSX.Element} Páginas da Orélle com medição RNF06 nas áreas principais.
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
                    <p className="app-kicker">PAP 2025/2026</p>
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
                <MeasuredPageSection pageKey="catalog">
                    <ProductSearchPage />
                </MeasuredPageSection>
                <ProductDetailsPage />
                <ProductReviewPage />
                <RelatedProductsPage />
                <FacePhotoUploadPage />
                <MeasuredPageSection pageKey="face-analysis">
                    <FaceAnalysisPage />
                </MeasuredPageSection>
                <MeasuredPageSection pageKey="face-report">
                    <FaceReportPage />
                </MeasuredPageSection>
                <SkinHistoryPage />
                <SkinEvolutionPage />
                <MeasuredPageSection pageKey="recommendations">
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
                <MeasuredPageSection pageKey="cart">
                    <CartPage />
                </MeasuredPageSection>
                <MeasuredPageSection pageKey="checkout">
                    <CheckoutPage />
                </MeasuredPageSection>
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
 * Renderiza a aplicação Orélle.
 *
 * @function App
 * @returns {JSX.Element} Aplicação React com contexto de autenticação.
 */
export function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}