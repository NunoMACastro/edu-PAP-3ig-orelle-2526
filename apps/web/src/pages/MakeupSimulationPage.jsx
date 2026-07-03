/**
 * Página de simulação de maquilhagem baseline.
 */
import { useEffect, useState } from "react";
import { OptimizedImage } from "../components/OptimizedImage.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Permite escolher um produto e gerar uma simulação visual segura.
 *
 * @function MakeupSimulationPage
 * @param {{onSimulationCreated?: Function}} props - Callback chamado quando a simulação é criada.
 * @returns {import("react").JSX.Element} Página de simulação de maquilhagem.
 */
export function MakeupSimulationPage({ onSimulationCreated = () => {} }) {
    const [productId, setProductId] = useState("");
    const [products, setProducts] = useState([]);
    const [productStatus, setProductStatus] = useState("idle");
    const [simulation, setSimulation] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        /**
         * Carrega produtos do catálogo para alimentar o seletor da simulação.
         *
         * @async
         * @function loadProducts
         * @returns {Promise<void>}
         */
        async function loadProducts() {
            setProductStatus("loading");

            try {
                const data = await apiRequest("/catalog/products");
                if (!isMounted) return;

                setProducts(data.products);
                setProductId((current) => current || data.products[0]?.id || "");
                setProductStatus(data.products.length === 0 ? "empty" : "success");
            } catch {
                if (!isMounted) return;
                setProducts([]);
                setProductStatus("error");
            }
        }

        loadProducts();

        return () => {
            isMounted = false;
        };
    }, []);

    /**
     * Submete o produto escolhido para criar a simulação de maquilhagem.
     *
     * @async
     * @function submitSimulation
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento de submissão do formulário.
     * @returns {Promise<void>}
     */
    async function submitSimulation(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/makeup-simulations", {
                method: "POST",
                body: JSON.stringify({ productId }),
            });
            setSimulation(data.simulation);
            onSimulationCreated(data.simulation);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Simulação de maquilhagem</h1>
            <form onSubmit={submitSimulation}>
                <label>
                    Produto
                    <select
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                        disabled={productStatus !== "success"}
                    >
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name} - {product.brandName}
                            </option>
                        ))}
                    </select>
                </label>
                {productStatus === "loading" && <p>A carregar produtos...</p>}
                {productStatus === "empty" && <p>Não existem produtos disponíveis.</p>}
                {productStatus === "error" && (
                    <p role="alert">Não foi possível carregar produtos.</p>
                )}
                <button
                    type="submit"
                    disabled={status === "loading" || !productId}
                >
                    Gerar simulação
                </button>
            </form>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && simulation && (
                <article>
                    <h2>{simulation.product.name}</h2>
                    <div className="preview-grid">
                        <section>
                            <h3>{simulation.preview.beforePanel.label}</h3>
                            {simulation.preview.visual?.beforeImageUrl && (
                                <OptimizedImage
                                    src={simulation.preview.visual.beforeImageUrl}
                                    alt={`${simulation.preview.visual.altText} Antes.`}
                                    width="320"
                                    height="210"
                                />
                            )}
                            <p>{simulation.preview.beforePanel.description}</p>
                        </section>
                        <section>
                            <h3>{simulation.preview.afterPanel.label}</h3>
                            {simulation.preview.visual?.afterImageUrl && (
                                <OptimizedImage
                                    src={simulation.preview.visual.afterImageUrl}
                                    alt={`${simulation.preview.visual.altText} Depois.`}
                                    width="320"
                                    height="210"
                                />
                            )}
                            <p>{simulation.preview.afterPanel.description}</p>
                        </section>
                    </div>
                    <p>Simulação: {simulation.id}</p>
                    <ul>
                        {simulation.preview.limitations.map((limitation) => (
                            <li key={limitation}>{limitation}</li>
                        ))}
                    </ul>
                </article>
            )}
        </section>
    );
}
