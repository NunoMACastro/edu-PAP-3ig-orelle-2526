/**
 * Wrapper de medicao local das paginas principais da MF6.
 */
import { usePagePerformance } from "../hooks/usePagePerformance.js";

/**
 * Mede uma area principal sem alterar a pagina interna.
 *
 * @function MeasuredPageSection
 * @param {{pageKey: string, label: string, children: React.ReactNode}} props - Area principal medida.
 * @returns {JSX.Element} Wrapper com aviso tecnico minimizado.
 */
export function MeasuredPageSection({ pageKey, label, children }) {
    // A observação permanece local e silenciosa; budgets técnicos pertencem aos
    // gates browser e não à linguagem de produto apresentada ao utilizador.
    usePagePerformance(pageKey, label);

    return (
        <div
            className="mf6-page-measure measured-page-section"
            data-mf6-page={pageKey}
            data-page-key={pageKey}
        >
            {children}
        </div>
    );
}
