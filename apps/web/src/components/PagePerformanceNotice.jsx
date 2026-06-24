/**
 * Mostra evidence local de carregamento para uma página principal.
 *
 * @function PagePerformanceNotice
 * @param {{metric: {pageLabel: string, loadMs: number, budgetMs: number, status: string}|null}} props - Métrica minimizada.
 * @returns {JSX.Element|null} Aviso técnico discreto.
 */
export function PagePerformanceNotice({ metric }) {
    if (!metric || metric.status === "ignored") {
        return null;
    }

    const isSlow = metric.status === "slow";
    const statusClassName = isSlow
        ? "mf6-performance mf6-performance--slow"
        : "mf6-performance mf6-performance--ok";

    return (
        <p className={statusClassName} role="status">
            <strong>{metric.pageLabel}</strong>:{" "}
            {isSlow
                ? `acima do orçamento (${metric.loadMs} ms / ${metric.budgetMs} ms).`
                : `dentro do orçamento (${metric.loadMs} ms / ${metric.budgetMs} ms).`}
        </p>
    );
}