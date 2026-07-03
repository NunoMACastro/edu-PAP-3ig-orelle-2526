/**
 * Wrapper de medicao local das paginas principais da MF6.
 */
import React from "react";
import { usePagePerformance } from "../hooks/usePagePerformance.js";
import { PagePerformanceNotice } from "./PagePerformanceNotice.jsx";

/**
 * Mede uma area principal sem alterar a pagina interna.
 *
 * @function MeasuredPageSection
 * @param {{pageKey: string, label: string, children: React.ReactNode}} props - Area principal medida.
 * @returns {JSX.Element} Wrapper com aviso tecnico minimizado.
 */
export function MeasuredPageSection({ pageKey, label, children }) {
    const measurement = usePagePerformance(pageKey, label);

    return (
        <div
            className="mf6-page-measure measured-page-section"
            data-mf6-page={pageKey}
            data-page-key={pageKey}
        >
            <PagePerformanceNotice measurement={measurement} />
            {children}
        </div>
    );
}
