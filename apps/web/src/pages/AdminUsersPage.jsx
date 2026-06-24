/**
 * Pagina administrativa de gestao de utilizadores da MF4.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Lista utilizadores e executa acoes administrativas de estado.
 *
 * @function AdminUsersPage
 * @returns {JSX.Element} UI admin de contas.
 */
export function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    async function loadUsers() {
        setStatus("loading");
        setMessage("");

        try {
            const data = await apiRequest("/admin/users");
            setUsers(data.users);
            setStatus(data.users.length === 0 ? "empty" : "success");
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    async function updateStatus(userId, nextStatus) {
        try {
            const data = await apiRequest(`/admin/users/${userId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: nextStatus }),
            });
            setUsers((items) =>
                items.map((item) => (item.id === userId ? data.user : item)),
            );
            setMessage("Estado da conta atualizado.");
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    async function deleteUser(userId) {
        try {
            const data = await apiRequest(`/admin/users/${userId}`, {
                method: "DELETE",
            });
            setUsers((items) =>
                items.map((item) => (item.id === userId ? data.user : item)),
            );
            setMessage("Conta eliminada logicamente.");
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Gestão de utilizadores</h1>
            <button onClick={loadUsers} disabled={status === "loading"}>
                {status === "loading" ? "A carregar..." : "Ver utilizadores"}
            </button>
            {status === "error" && <p role="alert">{message}</p>}
            {status === "empty" && <p>Sem utilizadores para mostrar.</p>}
            {message && status !== "error" && <p role="status">{message}</p>}
            {status === "success" && (
                <ul>
                    {users.map((user) => (
                        <li key={user.id}>
                            <article>
                                <h2>{user.email}</h2>
                                <p>
                                    {user.role} · {user.accountStatus}
                                </p>
                                <button onClick={() => updateStatus(user.id, "active")}>
                                    Ativar
                                </button>
                                <button
                                    onClick={() => updateStatus(user.id, "suspended")}
                                >
                                    Suspender
                                </button>
                                <button onClick={() => deleteUser(user.id)}>
                                    Eliminar conta
                                </button>
                            </article>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
