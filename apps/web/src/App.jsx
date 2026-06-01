/**
 * Composicao principal do frontend MF0.
 *
 * Os guias ainda nao introduzem routing final. Por isso, o App expoe todas as
 * paginas criadas pelos BKs MF0 em sequencia, exatamente para facilitar smoke
 * testing manual de cada fluxo.
 */
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage.jsx";
import { AdminProductCreatePage } from "./pages/AdminProductCreatePage.jsx";
import { EditProfilePage } from "./pages/EditProfilePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { PreferencesPage } from "./pages/PreferencesPage.jsx";
import { ProfileSetupPage } from "./pages/ProfileSetupPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

/**
 * Conteudo da aplicacao com acesso ao estado autenticado.
 *
 * @function AppContent
 * @returns {JSX.Element} Paginas MF0, com controlos admin visiveis apenas para admin.
 */
function AppContent() {
    const { user } = useAuth();
    const isAdmin = user?.role === "administrador";

    return (
        <>
            <RegisterPage />
            <LoginPage />
            <ProfileSetupPage />
            <EditProfilePage />
            <PreferencesPage />
            {isAdmin && (
                <>
                    <AdminProductCreatePage />
                    <AdminCategoriesPage />
                </>
            )}
        </>
    );
}

/**
 * Renderiza a aplicacao MF0.
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
