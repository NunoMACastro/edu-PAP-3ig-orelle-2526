import React from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

/**
 * Página de exportações administrativas.
 *
 * @function AdminExportsPage
 * @returns {JSX.Element} Ligações para CSV e PDF.
 */
export function AdminExportsPage() {
    const datasets = [
        { id: "sales", label: "Vendas" },
        { id: "ai-reports", label: "Relatórios IA" },
        { id: "users", label: "Utilizadores" },
    ];

    return (
        <section className="page-section">
            <h2>Exportações administrativas</h2>
            <ul>
                {datasets.map((dataset) => (
                    <li key={dataset.id}>
                        <strong>{dataset.label}</strong>
                        <a href={`${API_BASE_URL}/admin/exports/${dataset.id}?format=csv`}>
                            CSV
                        </a>
                        <a href={`${API_BASE_URL}/admin/exports/${dataset.id}?format=pdf`}>
                            PDF
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
}