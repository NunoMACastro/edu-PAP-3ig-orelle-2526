import { usePagePerformance } from "../hooks/usePagePerformance.js";
import { getMainPageDefinition } from "../utils/performance-budget.js";
import { PagePerformanceNotice } from "./PagePerformanceNotice.jsx";

/**
 * Envolve uma página principal com medição RNF06.
 *
 * @function MeasuredPageSection
 * @param {{pageKey: string, children: import("react").ReactNode}} props - Página técnica e conteúdo React.
 * @returns {JSX.Element} Secção medida para evidence local.
 */
export function MeasuredPageSection({ pageKey, children }) {
    const metric = usePagePerformance(pageKey);
    const definition = getMainPageDefinition(pageKey);
    const label = definition?.label ?? pageKey;

    return (
        <div className="mf6-page-measure" data-mf6-page={pageKey}>
            {/* O aviso aparece antes da página para ser fácil recolher evidence sem tocar na lógica interna. */}
            <PagePerformanceNotice metric={metric} />
            <div className="mf6-page-measure__content" aria-label={`Área medida: ${label}`}>
                {children}
            </div>
        </div>
    );
}