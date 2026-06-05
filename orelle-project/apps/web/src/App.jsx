
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage.jsx";
import { AdminProductCreatePage } from "./pages/AdminProductCreatePage.jsx";
import { EditProfilePage } from "./pages/EditProfilePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { PreferencesPage } from "./pages/PreferencesPage.jsx";
import { ProfileSetupPage } from "./pages/ProfileSetupPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { ProductSearchPage } from "./pages/ProductSearchPage.jsx";
import { ProductDetailsPage } from "./pages/ProductDetailsPage.jsx";
import { ProductSearchPage } from "./pages/ProductSearchPage.jsx";
import { ProductReviewPage } from "./pages/ProductReviewPage.jsx";
import { RelatedProductsPage } from "./pages/RelatedProductsPage.jsx";
import { FacePhotoUploadPage } from "./pages/FacePhotoUploadPage.jsx";
import { FaceAnalysisPage } from "./pages/FaceAnalysisPage.jsx";
export function App() {
    return (
        <AuthProvider>
            <ProductSearchPage />
            <ProductDetailsPage />
            <ProductSearchPage />
            <ProductReviewPage />
            <RelatedProductsPage />
            <FacePhotoUploadPage />
            <FaceAnalysisPage />
            <FaceReportPage />
            <SkinHistoryPage />
            <RegisterPage />
            <LoginPage />
            <ProfileSetupPage />
            <EditProfilePage />
            <PreferencesPage />
            <AdminProductCreatePage />
            <AdminCategoriesPage />
            </AuthProvider>     
    );
}