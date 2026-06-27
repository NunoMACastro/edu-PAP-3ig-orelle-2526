/**
 * Aviso tecnico minimizado para o budget de performance MF6.
 */
import React from "react";

/**
 * Mostra o estado de performance sem dados pessoais ou de sessao.
 *
 * @function PagePerformanceNotice
 * @param {{measurement: {label: string, durationMs: number, budgetMs: number, status: string}|null}} props - Medicao local.
 * @returns {JSX.Element|null} Aviso tecnico discreto.
 */
export function PagePerformanceNotice({ measurement }) {
    if (!measurement || measurement.status === "ignored") return null;

    const isSlow = measurement.status === "slow";
    const message = isSlow
        ? `${measurement.label}: ${measurement.durationMs}ms acima do budget ${measurement.budgetMs}ms.`
        : `${measurement.label}: ${measurement.durationMs}ms dentro do budget ${measurement.budgetMs}ms.`;

    return (
        <p
            className="mf6-performance page-performance-notice"
            data-status={measurement.status}
            role="status"
            aria-live="polite"
        >
            {message}
        </p>
    );
}
