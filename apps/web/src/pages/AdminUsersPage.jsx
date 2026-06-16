import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Painel administrativo de utilizadores.
 *
 * @function AdminUsersPage
 * @returns {JSX.Element} Lista e ações admin sobre contas.
 */
export function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    /**
     * Carrega utilizadores seguros a partir da API admin.
     *
     * @async
     * @returns {Promise<void>}
     */
    async function loadUsers() {
        setStatus("loading");
        setMessage("");

        try {
            const data = await apiRequest("/admin/users");
            setUsers(data.users);
            setStatus("success");
        } catch (err) {
            setStatus("error");
            setMessage(err.message);
        }
    }

    /**
     * Altera estado de conta sem enviar dados sensíveis.
     *
     * @async
     * @param {string} userId - Utilizador alvo.
     * @param {"active"|"suspended"} nextStatus - Estado pretendido.
     * @returns {Promise<void>}
     */
    async function changeStatus(userId, nextStatus) {
        await apiRequest(`/admin/users/${userId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: nextStatus }),
        });
        await loadUsers();
    }

    /**
     * Executa eliminação lógica da conta.
     *
     * @async
     * @param {string} userId - Utilizador alvo.
     * @returns {Promise<void>}
     */
    async function deleteAccount(userId) {
        await apiRequest(`/admin/users/${userId}`, { method: "DELETE" });
        await loadUsers();
    }

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <section className="page-section">
            <h2>Gestão de utilizadores</h2>
            {status === "loading" && <p>A carregar utilizadores...</p>}
            {message && <p role="alert">{message}</p>}
            <ul>
                {users.map((user) => (
                    <li key={user.id}>
                        <strong>{user.email}</strong>
                        <span> {user.role} - {user.accountStatus}</span>
                        <button type="button" onClick={() => changeStatus(user.id, "active")}>
                            Ativar
                        </button>
                        <button type="button" onClick={() => changeStatus(user.id, "suspended")}>
                            Suspender
                        </button>
                        <button type="button" onClick={() => deleteAccount(user.id)}>
                            Eliminar
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}