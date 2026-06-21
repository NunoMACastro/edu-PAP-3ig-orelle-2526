
/**
 * Composicao principal do frontend real_dev (MF0 a MF4).
 *
 * Os guias ainda nao introduzem routing final. Por isso, o App expoe todas as
 * paginas criadas pelos BKs implementados em sequencia, exatamente para
 * facilitar smoke testing manual de cada fluxo.
 */
import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { AdminUsersPage } from "./pages/AdminUsersPage.jsx"; // -> NOVO: Importado para o MF4
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage.jsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.jsx";
import { AdminProductCreatePage } from "./pages/AdminProductCreatePage.jsx";
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
import { RelatedProductsPage } from "./pages/RelatedProductsPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { SkinComparisonPage } from "./pages/SkinComparisonPage.jsx";
import { SkinEvolutionPage } from "./pages/SkinEvolutionPage.jsx";
import { SkinHistoryPage } from "./pages/SkinHistoryPage.jsx";
import { StockAdminPage } from "./pages/StockAdminPage.jsx";
import { NotificationsPage } from "./pages/NotificationsPage.jsx";
import { RoutineAlertsPage } from "./pages/RoutineAlertsPage.jsx";
import { AdminNotificationsPage } from "./pages/AdminNotificationsPage.jsx";
/**
 * Conteudo da aplicacao com acesso ao estado autenticado.
 *
 * @function AppContent
 * @returns {JSX.Element} Paginas MF0-MF4, com controlos admin visiveis apenas para admin.
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
                {/* Páginas do fluxo de cliente e consultor */}
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
                <RoutineAlertsPage />
                <NotificationsPage />
                {canReviewRecommendations && (
                    <ConsultantRecommendationReviewPage
                        recommendations={recommendations}
                    />
                )}

                {/* Páginas do Painel Administrativo */}
                {isAdmin && (
                    <>
                        {/* A página de utilizadores entra aqui para o painel admin. 
                            Nota: Esta condição visual melhora a experiência, mas a segurança 
                            real é validada pelas barreiras das rotas `/api/admin` no backend. */}
                        <AdminNotificationsPage />  
                        <AdminUsersPage />
                        <AdminProductCreatePage />
                        <AdminCategoriesPage />
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
export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}