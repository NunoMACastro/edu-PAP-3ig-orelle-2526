/**
 * Pagina administrativa de gestao de utilizadores da MF4.
 */
import { useEffect, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog.jsx";
import { AdminIconButton, AdminPageHeader, AdminStatusBadge } from "../components/AdminUi.jsx";
import { EmptyState, Skeleton } from "../components/OrelleUi.jsx";
import { ErrorSummary } from "../components/ErrorSummary.jsx";
import { apiRequest } from "../services/apiClient.js";

const ROLE_LABELS = Object.freeze({
    cliente: "Cliente",
    consultor: "Consultor",
    administrador: "Administrador",
});
const ACCOUNT_STATUS_LABELS = Object.freeze({
    active: "Ativa",
    suspended: "Desativada administrativamente",
    deleted: "Eliminada pelo titular",
});

/**
 * Lista utilizadores e executa acoes administrativas de estado.
 *
 * @function AdminUsersPage
 * @returns {JSX.Element} UI admin de contas.
 */
export function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loadStatus, setLoadStatus] = useState("loading");
    const [loadError, setLoadError] = useState("");
    const [roleDraftByUser, setRoleDraftByUser] = useState({});
    const [actionByUser, setActionByUser] = useState({});
    const [userPendingDeactivation, setUserPendingDeactivation] = useState(null);

    /**
     * Carrega a lista administrativa de utilizadores.
     *
     * @async
     * @function loadUsers
     * @param {AbortSignal} [signal] - Cancelamento do ciclo de vida da página.
     * @returns {Promise<void>}
     */
    async function loadUsers(signal) {
        setLoadStatus("loading");
        setLoadError("");

        try {
            const data = await apiRequest("/admin/users", { signal });
            setUsers(data.users);
            setRoleDraftByUser(
                Object.fromEntries(data.users.map((user) => [user.id, user.role])),
            );
            setLoadStatus("success");
        } catch (err) {
            if (err.code === "REQUEST_ABORTED") return;
            setLoadError(err.message);
            setLoadStatus("error");
        }
    }

    useEffect(() => {
        const controller = new AbortController();
        loadUsers(controller.signal);
        return () => controller.abort();
    }, []);

    /**
     * Atualiza apenas o estado da linha em curso, preservando lista e restantes ações.
     *
     * @param {string} userId - Utilizador alvo.
     * @param {{status: string, message?: string, error?: object|string|null}} action - Estado público da ação.
     * @returns {void}
     */
    function setUserAction(userId, action) {
        setActionByUser((current) => ({
            ...current,
            [userId]: { message: "", error: null, ...action },
        }));
    }

    /**
     * Substitui uma linha pelo DTO devolvido pela API.
     *
     * @param {string} userId - Identificador opaco interno da linha.
     * @param {object} user - DTO administrativo atualizado.
     * @returns {void}
     */
    function replaceUser(userId, user) {
        setUsers((items) =>
            items.map((item) => (item.id === userId ? user : item)),
        );
        setRoleDraftByUser((current) => ({
            ...current,
            [userId]: user.role,
        }));
    }

    /**
     * Reativa uma conta administrativamente desativada.
     *
     * @async
     * @function updateStatus
     * @param {string} userId - Utilizador alvo.
     * @param {string} nextStatus - Estado ativo permitido pelo contrato.
     * @returns {Promise<void>}
     */
    async function updateStatus(userId, nextStatus) {
        setUserAction(userId, { status: "loading" });

        try {
            const data = await apiRequest(`/admin/users/${userId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: nextStatus }),
            });
            replaceUser(userId, data.user);
            setUserAction(userId, {
                status: "success",
                message: "Estado da conta atualizado.",
            });
        } catch (err) {
            setUserAction(userId, { status: "error", error: err });
        }
    }

    /**
     * Aplica explicitamente a role selecionada na linha do utilizador.
     *
     * @param {string} userId - Utilizador alvo.
     * @returns {Promise<void>}
     */
    async function updateRole(userId) {
        const role = roleDraftByUser[userId];
        setUserAction(userId, { status: "loading" });

        try {
            const data = await apiRequest(`/admin/users/${userId}/role`, {
                method: "PATCH",
                body: JSON.stringify({ role }),
            });
            replaceUser(userId, data.user);
            setUserAction(userId, {
                status: "success",
                message: "Tipo de acesso atualizado.",
            });
        } catch (err) {
            setUserAction(userId, { status: "error", error: err });
        }
    }

    /**
     * Pede a desativação administrativa reversível e atualiza a linha.
     *
     * @async
     * O endpoint HTTP DELETE é legado, mas a API preserva os dados, grava o
     * estado suspenso e revoga sessões. A eliminação terminal pertence apenas
     * ao próprio titular no fluxo de privacidade.
     *
     * @function deactivateUser
     * @param {string} userId - Utilizador alvo da desativação.
     * @returns {Promise<boolean>} Verdadeiro quando a API confirma a operação.
     */
    async function deactivateUser(userId) {
        setUserAction(userId, { status: "loading" });

        try {
            const data = await apiRequest(`/admin/users/${userId}`, {
                method: "DELETE",
            });
            replaceUser(userId, data.user);
            setUserAction(userId, {
                status: "success",
                message:
                    "Conta desativada administrativamente e sessões anteriores revogadas.",
            });
            setUserPendingDeactivation(null);
            return true;
        } catch (err) {
            setUserAction(userId, { status: "error", error: err });
            return false;
        }
    }

    return (
        <section className="admin-page admin-users-page">
            <AdminPageHeader eyebrow="Definições" title="Utilizadores" description="Gere tipos de acesso e estados de conta sem expor dados além do necessário." actions={<AdminIconButton icon="refresh" label="Atualizar utilizadores" onClick={() => loadUsers()} disabled={loadStatus === "loading"} />} />
            {loadStatus === "error" && <p role="alert">{loadError}</p>}
            {loadStatus === "loading" && users.length === 0 ? (
                <Skeleton lines={5} label="A carregar utilizadores" />
            ) : null}
            {loadStatus !== "loading" && users.length === 0 ? (
                <EmptyState title="Sem utilizadores" description="Não existem contas disponíveis para gerir." />
            ) : null}
            {users.length > 0 && (
                <ul className="admin-user-list">
                    {users.map((user) => {
                        const action = actionByUser[user.id] ?? {
                            status: "idle",
                            message: "",
                            error: null,
                        };
                        const busy = action.status === "loading";
                        const roleDraft = roleDraftByUser[user.id] ?? user.role;

                        return (
                            <li key={user.id}>
                                <article className="admin-user-row" aria-busy={busy}>
                                    <header className="admin-user-row__identity">
                                        <div>
                                            <h2>{user.email}</h2>
                                            <span>{ROLE_LABELS[user.role] ?? "Tipo de acesso indisponível"}</span>
                                        </div>
                                        <AdminStatusBadge tone={user.accountStatus === "active" ? "success" : user.accountStatus === "deleted" ? "danger" : "warning"}>
                                            {ACCOUNT_STATUS_LABELS[user.accountStatus] ?? "Estado indisponível"}
                                        </AdminStatusBadge>
                                    </header>
                                    {user.accountStatus !== "deleted" ? (
                                        <>
                                            <label className="admin-user-row__role">
                                                Tipo de acesso
                                                <select
                                                    value={roleDraft}
                                                    onChange={(event) =>
                                                        setRoleDraftByUser(
                                                            (current) => ({
                                                                ...current,
                                                                [user.id]:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    disabled={busy}
                                                >
                                                    <option value="cliente">
                                                        Cliente
                                                    </option>
                                                    <option value="consultor">
                                                        Consultor
                                                    </option>
                                                    <option value="administrador">
                                                        Administrador
                                                    </option>
                                                </select>
                                            </label>
                                            <div className="admin-user-row__actions">
                                                <AdminIconButton
                                                    icon="save"
                                                    label="Guardar tipo de acesso"
                                                    onClick={() => updateRole(user.id)}
                                                    disabled={busy || roleDraft === user.role}
                                                />
                                                {user.accountStatus === "suspended" ? (
                                                    <AdminIconButton
                                                        icon="user-check"
                                                        label="Reativar conta"
                                                        onClick={() => updateStatus(user.id, "active")}
                                                        disabled={busy}
                                                    />
                                                ) : (
                                                    <AdminIconButton
                                                        icon="user-x"
                                                        label="Desativar conta"
                                                        onClick={() => setUserPendingDeactivation(user)}
                                                        disabled={busy}
                                                    />
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="admin-user-row__feedback" role="status">
                                            Eliminação terminal pelo titular: esta
                                            conta não pode ser reativada.
                                        </p>
                                    )}
                                    {action.status === "error" &&
                                    userPendingDeactivation?.id !== user.id ? (
                                        <ErrorSummary
                                            error={action.error}
                                            id={`user-action-error-${user.id}`}
                                        />
                                    ) : null}
                                    {action.status === "success" ? (
                                        <p className="admin-user-row__feedback" role="status">{action.message}</p>
                                    ) : null}
                                </article>
                            </li>
                        );
                    })}
                </ul>
            )}
            <ConfirmDialog
                open={Boolean(userPendingDeactivation)}
                title="Desativar conta"
                description="A conta fica sem acesso e todas as sessões são revogadas. Os dados são preservados e a conta pode ser reativada posteriormente."
                confirmationText="DESATIVAR"
                confirmLabel="Desativar conta"
                busy={
                    userPendingDeactivation
                        ? actionByUser[userPendingDeactivation.id]?.status ===
                          "loading"
                        : false
                }
                error={
                    userPendingDeactivation
                        ? actionByUser[userPendingDeactivation.id]?.error
                        : null
                }
                onCancel={() => setUserPendingDeactivation(null)}
                onConfirm={() =>
                    deactivateUser(userPendingDeactivation.id)
                }
            />
        </section>
    );
}
