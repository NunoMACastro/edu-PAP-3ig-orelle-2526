# BK-MF6-04 - Imagens otimizadas (lazy loading e compressão automática)

## Header

- `doc_id`: `BK-MF6-04`
- `bk_id`: `BK-MF6-04`
- `macro`: `MF6`
- `titulo`: `Imagens otimizadas (lazy loading e compressão automática)`
- `tipo`: `performance`
- `owner`: `Daniel Bulica`
- `apoio`: `Aline`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `-`
- `rf_rnf`: `RNF08`
- `fase_documental`: `Fase 3`
- `sprint`: `S10-S11`
- `core_or_reforco`: `Core`
- `funcional`: `false`
- `transversal`: `false`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF6-05`
- `guia_path`: `docs/planificacao/guias-bk/MF6/BK-MF6-04-imagens-otimizadas-lazy-loading-e-compressao-automatica.md`
- `source_files`: `docs/RNF.md; docs/RF.md; docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md; docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md; docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
- `last_updated`: `2026-06-23`

#### Objetivo

Neste BK vais implementar otimização de imagens no frontend do Orelle. O requisito `RNF08` pede imagens otimizadas com `lazy loading` e compressão automática.

O trabalho fica concentrado em duas zonas reais da aplicação: a imagem da página de detalhe de produto e as fotografias enviadas no fluxo facial. O resultado esperado é reduzir peso e trabalho inicial do browser sem alterar consentimento, autenticação, validação backend, carrinho ou regras de privacidade.

#### Importância

Imagens são essenciais no Orelle: ajudam o cliente a ver produtos, enviar fotografias faciais e confiar nas recomendações. Também podem tornar a app lenta se forem carregadas sem controlo ou enviadas para a API com tamanho desnecessário.

`CANONICO`: `RNF08` define otimização de imagens como requisito de performance. `BK-MF6-04` é `P1`, `Core` e prepara `BK-MF6-05`, onde a comunicação segura continua a proteger os fluxos que transportam imagens.

`DERIVADO`: este BK usa um componente React `OptimizedImage` e um helper `compressImageForUpload` porque o projeto atual já usa React, Vite, `apiRequest`, `FormData` e APIs nativas do browser. Não é preciso adicionar dependências.

#### Scope-in

- Criar `apps/web/src/components/OptimizedImage.jsx`.
- Criar `apps/web/src/utils/image-compression.js`.
- Atualizar `apps/web/src/pages/FacePhotoUploadPage.jsx` para comprimir fotografias antes de criar o `FormData`.
- Atualizar `apps/web/src/pages/ProductDetailsPage.jsx` para usar `OptimizedImage` sem alterar o contrato atual da página.
- Acrescentar CSS para imagens otimizadas em `apps/web/src/styles.css`.
- Criar `apps/web/scripts/check-mf6-images.mjs` como verificação focal.
- Manter `apiRequest`, os endpoints existentes e os campos `frontal` e `perfil`.

#### Scope-out

- Não criar endpoints novos.
- Não alterar a API de upload facial.
- Não alterar regras de consentimento facial.
- Não alterar validações backend de tipo, tamanho, quantidade ou ownership.
- Não adicionar `react-router-dom` ou outra dependência.
- Não guardar fotografias, tokens ou dados biométricos no armazenamento persistente do browser.
- Não alterar carrinho, encomenda, pagamento, recomendações ou checkout.

#### Estado antes e depois

Antes deste BK, a página de detalhe de produto renderiza a imagem com `<img>` direto e o fluxo facial envia os ficheiros selecionados no tamanho original.

Depois deste BK, a página de detalhe de produto usa `OptimizedImage`, as fotografias facial frontal e de perfil passam por compressão local antes do envio e a API continua a validar os ficheiros como antes. Se a compressão não for suportada ou falhar, o ficheiro original segue pelo mesmo fluxo.

#### Pre-requisitos

- Saber que `apps/web/src/services/apiClient.js` exporta `apiRequest`.
- Saber que `apiRequest` já usa `credentials: "include"` e deteta `FormData`.
- Saber que `apps/web/src/pages/FacePhotoUploadPage.jsx` envia `/face-consent` e `/face-photos`.
- Saber que `apps/web/src/pages/ProductDetailsPage.jsx` consome `/catalog/products/:productId` e usa `brandName`, `priceCents`, `reviewSummary`, `ingredientNames` e `relatedProducts`.
- Rever `RF10`, `RF13` e `RNF08`.
- Ter `npm --prefix apps/web run build` funcional antes de iniciar o BK.

#### Glossário

- `lazy loading`: carregamento adiado de imagens que ainda não precisam de aparecer no ecrã.
- `decoding`: descodificação da imagem pelo browser antes de a desenhar.
- `compressão`: redução do tamanho de um ficheiro antes de o enviar.
- `fallback`: caminho seguro usado quando uma otimização falha.
- `FormData`: estrutura usada para enviar ficheiros num pedido HTTP.
- `MIME type`: tipo declarado do ficheiro, como `image/jpeg` ou `image/png`.
- `ownership`: garantia de que dados sensíveis pertencem ao utilizador autenticado correto.
- `CANONICO`: regra presente nos documentos oficiais.
- `DERIVADO`: decisão técnica mínima para cumprir o contrato sem inventar domínio.

#### Conceitos teóricos essenciais

`lazy loading` reduz o trabalho inicial do browser. Quando uma imagem usa `loading="lazy"`, o browser pode atrasar o carregamento até a imagem estar próxima do ecrã visível. Isto ajuda páginas com imagens de produto e listas visuais.

`decoding="async"` permite ao browser descodificar imagens com menos impacto na renderização principal. Não substitui imagens bem dimensionadas, mas melhora a fluidez.

Compressão local de imagens usa APIs nativas: `createImageBitmap`, `canvas` e `toBlob`. O ficheiro é lido em memória, redesenhado com largura máxima e exportado como JPEG com qualidade controlada. A app não guarda a fotografia no browser; apenas prepara uma versão mais leve para o upload.

O backend continua a proteger o sistema. A compressão no frontend não substitui consentimento, sessão autenticada, ownership, validação de MIME type, tamanho máximo, quantidade de ficheiros e campos obrigatórios.

No frontend React, o estado local controla ficheiro selecionado, consentimento, loading, sucesso e erro. O aluno deve preservar estes estados porque o upload facial envolve dados sensíveis e precisa de mensagens claras.

Na página de produto, a otimização da imagem não pode alterar o domínio de comércio. Ver produto e adicionar ao carrinho são ações separadas. O botão de carrinho continua a chamar `/cart/items` apenas quando o utilizador clica.

Em testes e evidence, este BK usa um script focal. Ele não substitui build nem testes de integração, mas confirma rapidamente que o aluno não deixou imports partidos, campos errados ou atributos de imagem em falta.

#### Arquitetura do BK

O BK atua em `apps/web`.

`OptimizedImage` é um componente pequeno para centralizar `loading`, `decoding`, `alt` e `referrerPolicy`.

`compressImageForUpload` é um helper isolado para comprimir ficheiros de imagem antes de serem anexados ao `FormData`.

`FacePhotoUploadPage.jsx` usa o helper antes de chamar `/face-photos`, mantendo `/face-consent`, `frontal`, `perfil` e `apiRequest`.

`ProductDetailsPage.jsx` continua sem router. A página mantém o formulário de ID de produto que já existe no projeto, carrega `/catalog/products/:productId`, usa `brandName` e `priceCents`, e troca apenas o `<img>` direto por `OptimizedImage`.

`check-mf6-images.mjs` valida a integração esperada depois de o aluno aplicar o BK.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/web/src/components/OptimizedImage.jsx`
- CRIAR: `apps/web/src/utils/image-compression.js`
- EDITAR: `apps/web/src/pages/FacePhotoUploadPage.jsx`
- EDITAR: `apps/web/src/pages/ProductDetailsPage.jsx`
- EDITAR: `apps/web/src/styles.css`
- CRIAR: `apps/web/scripts/check-mf6-images.mjs`
- REVER: `apps/web/src/services/apiClient.js`
- REVER: `apps/api/src/middlewares/face-photo-upload.middleware.js`
- REVER: `apps/api/src/validators/face-photo.validator.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contratos antes de escrever código

1. Objetivo funcional do passo no contexto da app.

Confirmar que `RNF08` melhora performance sem alterar os contratos de catálogo, upload facial, consentimento, sessão e carrinho.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/RF.md`
    - REVER: `apps/web/src/services/apiClient.js`
    - REVER: `apps/api/src/middlewares/face-photo-upload.middleware.js`
    - REVER: `apps/api/src/validators/face-photo.validator.js`
    - LOCALIZAÇÃO: leitura dos contratos antes de editar código.

3. Instruções do que fazer.

Confirma que `apiRequest` é o cliente HTTP existente, que o upload facial usa `frontal` e `perfil`, que a página de detalhe de produto usa dados de catálogo reais e que a API continua responsável pela validação final.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é preparatório porque evita corrigir performance à custa de quebrar contratos já existentes.

5. Explicação do código.

Não há código. O objetivo é perceber o que não pode mudar: endpoints, nomes de campos, cliente HTTP, formato do produto e validações backend. Isto evita criar uma segunda versão do fluxo de upload ou de detalhe de produto.

6. Validação do passo.

Confirma que `apps/web/src/services/apiClient.js` exporta `apiRequest`, que `/face-consent` e `/face-photos` existem no fluxo facial e que o produto público usa `brandName` e `priceCents`.

7. Cenário negativo/erro esperado.

Se encontrares código a importar `apiClient` ou `react-router-dom` sem dependência instalada, esse código deve ser corrigido antes de o BK ser considerado pronto.

### Passo 2 - Criar o componente `OptimizedImage`

1. Objetivo funcional do passo no contexto da app.

Criar um componente reutilizável para imagens que mantém acessibilidade e aplica carregamento otimizado por defeito.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/components/OptimizedImage.jsx`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria a pasta `apps/web/src/components` se ainda não existir. Depois cria o ficheiro abaixo exatamente com este conteúdo.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/components/OptimizedImage.jsx

/**
 * Renderiza uma imagem com atributos de performance e acessibilidade.
 *
 * @function OptimizedImage
 * @param {{src: string, alt: string, className?: string, eager?: boolean}} props - Dados da imagem.
 * @returns {JSX.Element} Imagem pronta para usar em páginas do Orelle.
 */
export function OptimizedImage({ src, alt, className = "", eager = false }) {
    // Lazy loading é o padrão para não descarregar imagens antes de serem úteis.
    const loadingMode = eager ? "eager" : "lazy";
    const imageClassName = `optimized-image ${className}`.trim();

    return (
        <img
            className={imageClassName}
            src={src}
            alt={alt}
            loading={loadingMode}
            decoding="async"
            // A imagem pode vir de catálogo; não enviamos a página atual como referência.
            referrerPolicy="no-referrer"
        />
    );
}
```

5. Explicação do código.

O componente recebe `src`, `alt`, `className` e `eager`. O `alt` continua obrigatório porque uma imagem de produto precisa de alternativa textual. O `loading` fica `lazy` por defeito e só passa a `eager` se uma imagem for crítica no primeiro ecrã. O `decoding="async"` ajuda o browser a descodificar a imagem com menos bloqueio visual.

Este componente prepara `ProductDetailsPage.jsx` para deixar de repetir atributos de imagem. O aluno pode mudar `className`, mas não deve remover `alt`, `loading`, `decoding` nem `referrerPolicy` sem justificar a alteração.

6. Validação do passo.

Confirma que o ficheiro exporta `OptimizedImage` e que contém `loading={loadingMode}`, `decoding="async"` e `referrerPolicy="no-referrer"`.

7. Cenário negativo/erro esperado.

Se o aluno remover `alt`, a página fica pior para acessibilidade. Se usar `eager` em todas as imagens, o requisito de performance perde efeito.

### Passo 3 - Criar o helper de compressão de imagens

1. Objetivo funcional do passo no contexto da app.

Criar uma função que tenta reduzir o tamanho de imagens antes do upload facial e devolve o ficheiro original sempre que a compressão não for segura.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/utils/image-compression.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria a pasta `apps/web/src/utils` se ainda não existir. O helper deve usar apenas APIs nativas do browser e não deve guardar ficheiros em armazenamento persistente do browser.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/src/utils/image-compression.js

const MAX_IMAGE_WIDTH = 1280;
const JPEG_QUALITY = 0.82;
const MIN_SIZE_TO_COMPRESS_BYTES = 900_000;

/**
 * Indica se o browser suporta as APIs necessárias para comprimir imagens.
 *
 * @function canCompressInBrowser
 * @returns {boolean} Verdadeiro quando há suporte mínimo para compressão local.
 */
function canCompressInBrowser() {
    return (
        typeof document !== "undefined" &&
        typeof createImageBitmap === "function"
    );
}

/**
 * Calcula dimensões finais mantendo proporção.
 *
 * @function calculateTargetSize
 * @param {{width: number, height: number}} bitmap - Imagem descodificada pelo browser.
 * @returns {{targetWidth: number, targetHeight: number}} Dimensões para o canvas.
 */
function calculateTargetSize(bitmap) {
    // Nunca aumentamos imagens pequenas; a compressão serve para reduzir custo.
    const resizeRatio = Math.min(1, MAX_IMAGE_WIDTH / bitmap.width);

    return {
        targetWidth: Math.round(bitmap.width * resizeRatio),
        targetHeight: Math.round(bitmap.height * resizeRatio),
    };
}

/**
 * Converte o conteúdo de um canvas para Blob JPEG.
 *
 * @function canvasToJpegBlob
 * @param {HTMLCanvasElement} canvas - Canvas com a imagem redimensionada.
 * @returns {Promise<Blob|null>} Blob comprimido ou null se o browser falhar.
 */
function canvasToJpegBlob(canvas) {
    return new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });
}

/**
 * Cria um novo File JPEG preservando o nome base do ficheiro original.
 *
 * @function buildCompressedFile
 * @param {Blob} blob - Conteúdo comprimido.
 * @param {File} originalFile - Ficheiro escolhido pelo utilizador.
 * @returns {File} Ficheiro pronto para anexar ao FormData.
 */
function buildCompressedFile(blob, originalFile) {
    const originalName = originalFile.name.replace(/\.[^.]+$/, "");
    const fileName = `${originalName}.jpg`;

    return new File([blob], fileName, {
        type: "image/jpeg",
        lastModified: originalFile.lastModified,
    });
}

/**
 * Tenta comprimir uma imagem antes do envio para a API.
 *
 * @async
 * @function compressImageForUpload
 * @param {File} file - Ficheiro selecionado no formulário facial.
 * @returns {Promise<File>} Ficheiro comprimido ou original quando o fallback é necessário.
 */
export async function compressImageForUpload(file) {
    if (!file.type.startsWith("image/")) {
        return file;
    }

    if (file.size < MIN_SIZE_TO_COMPRESS_BYTES) {
        return file;
    }

    if (!canCompressInBrowser()) {
        return file;
    }

    let bitmap;

    try {
        bitmap = await createImageBitmap(file);

        const { targetWidth, targetHeight } = calculateTargetSize(bitmap);
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext("2d");

        if (!context) {
            return file;
        }

        // O canvas só existe em memória; a fotografia não é guardada no browser.
        context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

        const blob = await canvasToJpegBlob(canvas);

        if (!blob || blob.size >= file.size) {
            return file;
        }

        return buildCompressedFile(blob, file);
    } catch {
        // Qualquer falha de descodificação mantém o upload funcional com o ficheiro original.
        return file;
    } finally {
        bitmap?.close?.();
    }
}
```

5. Explicação do código.

O helper rejeita ficheiros que não são imagem, evita comprimir ficheiros pequenos e confirma se o browser suporta `createImageBitmap`. Depois cria um canvas em memória, desenha a imagem redimensionada e exporta JPEG com qualidade controlada.

O retorno mais importante é o fallback: se uma API não existir, se a imagem não descodificar, se o canvas falhar ou se o resultado ficar maior, o ficheiro original é devolvido. Isto cumpre o RNF08 sem quebrar o fluxo facial.

6. Validação do passo.

Confirma que o ficheiro contém `typeof createImageBitmap === "function"`, `try`, `catch`, `canvas.toBlob`, `return file` e `bitmap?.close?.()`.

7. Cenário negativo/erro esperado.

Num browser sem `createImageBitmap`, o upload deve continuar com o ficheiro original. Uma imagem corrompida também deve voltar ao ficheiro original em vez de bloquear o formulário.

### Passo 4 - Integrar compressão no upload facial

1. Objetivo funcional do passo no contexto da app.

Comprimir as fotografias frontal e de perfil antes de criar o `FormData`, preservando consentimento, campos do backend e `apiRequest`.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/pages/FacePhotoUploadPage.jsx`
    - REVER: `apps/web/src/services/apiClient.js`
    - LOCALIZAÇÃO: substituir o ficheiro completo da página.

3. Instruções do que fazer.

Substitui o conteúdo de `FacePhotoUploadPage.jsx` pelo código abaixo. Mantém `/face-consent`, `/face-photos`, `frontal`, `perfil`, `apiRequest` e o envio por `FormData`.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/FacePhotoUploadPage.jsx

/**
 * Página de consentimento e upload facial MF1/MF6.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";
import { compressImageForUpload } from "../utils/image-compression.js";

/**
 * Cria o FormData final do upload facial.
 *
 * @async
 * @function buildFacePhotoFormData
 * @param {{frontalFile: File, perfilFile: File}} input - Ficheiros escolhidos pelo utilizador.
 * @returns {Promise<FormData>} FormData com os campos esperados pelo backend.
 */
async function buildFacePhotoFormData({ frontalFile, perfilFile }) {
    const [compressedFrontal, compressedPerfil] = await Promise.all([
        compressImageForUpload(frontalFile),
        compressImageForUpload(perfilFile),
    ]);

    const formData = new FormData();

    // Os nomes dos campos são contrato do backend e não devem ser traduzidos.
    formData.append("frontal", compressedFrontal);
    formData.append("perfil", compressedPerfil);

    return formData;
}

/**
 * Envia consentimento e duas fotografias por FormData.
 *
 * @function FacePhotoUploadPage
 * @returns {JSX.Element} Formulário de upload facial.
 */
export function FacePhotoUploadPage() {
    const [accepted, setAccepted] = useState(false);
    const [frontal, setFrontal] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    /**
     * Aceita consentimento e envia fotos comprimidas quando possível.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulário.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();

        if (!accepted || !frontal || !perfil) {
            setStatus("error");
            setMessage("Aceita o consentimento e seleciona as duas fotografias.");
            return;
        }

        setStatus("loading");
        setMessage("A preparar fotografias...");

        try {
            // O consentimento é registado antes do upload para respeitar o fluxo facial.
            await apiRequest("/face-consent", {
                method: "POST",
                body: JSON.stringify({
                    accepted: true,
                    version: "face-analysis-v1",
                }),
            });

            const formData = await buildFacePhotoFormData({
                frontalFile: frontal,
                perfilFile: perfil,
            });

            // O apiRequest deteta FormData e evita forçar Content-Type errado.
            const data = await apiRequest("/face-photos", {
                method: "POST",
                body: formData,
            });

            setStatus("success");
            setMessage(`${data.photos.length} fotografias guardadas.`);
        } catch (err) {
            setStatus("error");
            setMessage(err.message);
        }
    }

    return (
        <section>
            <h1>Fotografias para análise facial</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(event) => setAccepted(event.target.checked)}
                    />
                    Aceito o tratamento destas fotografias para análise facial cosmética.
                </label>
                <label>
                    Fotografia frontal
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) =>
                            setFrontal(event.target.files[0] ?? null)
                        }
                    />
                </label>
                <label>
                    Fotografia de perfil
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) =>
                            setPerfil(event.target.files[0] ?? null)
                        }
                    />
                </label>
                <button
                    type="submit"
                    disabled={!accepted || !frontal || !perfil || status === "loading"}
                >
                    {status === "loading" ? "A enviar..." : "Enviar fotografias"}
                </button>
            </form>
            {message && (
                <p role={status === "error" ? "alert" : "status"}>
                    {message}
                </p>
            )}
        </section>
    );
}
```

5. Explicação do código.

A função `buildFacePhotoFormData` comprime as duas fotografias em paralelo e só depois cria o `FormData`. Isto garante que `frontal` e `perfil` continuam iguais ao contrato backend.

`handleSubmit` valida consentimento e presença das duas fotografias antes de chamar a API. O consentimento é enviado primeiro, depois o upload usa `apiRequest`. O frontend não decide ownership; o backend usa a sessão autenticada e valida consentimento, tipo, tamanho e quantidade.

6. Validação do passo.

Confirma que a página importa `apiRequest`, importa `compressImageForUpload`, não importa `apiClient`, mantém `/face-consent`, mantém `/face-photos` e chama `buildFacePhotoFormData` antes do upload.

7. Cenário negativo/erro esperado.

Sem consentimento ou sem uma das fotografias, a página deve mostrar erro e não deve enviar pedido para `/face-photos`.

### Passo 5 - Integrar imagem otimizada no detalhe de produto

1. Objetivo funcional do passo no contexto da app.

Trocar o `<img>` direto por `OptimizedImage` sem alterar o modo atual de carregar produto por ID nem o contrato real do produto.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/pages/ProductDetailsPage.jsx`
    - REVER: `apps/web/src/services/apiClient.js`
    - REVER: `apps/api/src/services/product.service.js`
    - LOCALIZAÇÃO: substituir o ficheiro completo da página.

3. Instruções do que fazer.

Substitui o conteúdo de `ProductDetailsPage.jsx` pelo código abaixo. Não adiciones router. Mantém `apiRequest`, `productId` em estado local, `brandName`, `priceCents`, `reviewSummary`, `ingredientNames` e `relatedProducts`.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/ProductDetailsPage.jsx

/**
 * Página de detalhe público de produto.
 */
import { useState } from "react";
import { OptimizedImage } from "../components/OptimizedImage.jsx";
import { apiRequest } from "../services/apiClient.js";

const PRODUCT_NOT_FOUND_MESSAGE = "Produto não encontrado";

/**
 * Mostra imagem, descrição, ingredientes, preço, stock e resumo de notas.
 *
 * @function ProductDetailsPage
 * @returns {JSX.Element} Formulário por ID e detalhe do produto.
 */
export function ProductDetailsPage() {
    const [productId, setProductId] = useState("");
    const [product, setProduct] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [cartMessage, setCartMessage] = useState("");

    /**
     * Carrega detalhe por ID.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulário.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");
        setCartMessage("");
        setProduct(null);

        try {
            // A página atual usa apiRequest e não depende de router.
            const data = await apiRequest(`/catalog/products/${productId}`);
            setProduct(data.product);
            setStatus("success");
        } catch (err) {
            if (err.message === PRODUCT_NOT_FOUND_MESSAGE) {
                setStatus("empty");
                return;
            }

            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Adiciona o produto detalhado ao carrinho.
     *
     * @async
     * @function addToCart
     * @returns {Promise<void>}
     */
    async function addToCart() {
        if (!product) return;

        setError("");
        setCartMessage("");

        try {
            // A compra continua dependente de clique explícito do utilizador.
            await apiRequest("/cart/items", {
                method: "POST",
                body: JSON.stringify({ productId: product.id, quantity: 1 }),
            });
            setCartMessage("Produto adicionado ao carrinho.");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section className="product-detail-section">
            <h1>Detalhe do produto</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    ID do produto
                    <input
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                    />
                </label>
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A carregar..." : "Ver produto"}
                </button>
            </form>

            {status === "error" && <p role="alert">{error}</p>}
            {cartMessage && <p role="status">{cartMessage}</p>}
            {status === "empty" && <p>Produto não encontrado.</p>}
            {status === "success" && product && (
                <article className="product-detail-card">
                    <OptimizedImage
                        className="product-detail-image"
                        src={product.imageUrl}
                        alt={product.name}
                    />
                    <h2>{product.name}</h2>
                    <p>{product.brandName}</p>
                    <p>{product.description}</p>
                    <p>{(product.priceCents / 100).toFixed(2)} EUR</p>
                    <p>Stock: {product.stock}</p>
                    <button type="button" onClick={addToCart}>
                        Adicionar ao carrinho
                    </button>
                    <p>
                        Nota média: {product.reviewSummary.averageRating} (
                        {product.reviewSummary.totalReviews} avaliações)
                    </p>
                    <h3>Ingredientes</h3>
                    <ul>
                        {product.ingredientNames.map((ingredient) => (
                            <li key={ingredient}>{ingredient}</li>
                        ))}
                    </ul>
                    <h3>Produtos relacionados</h3>
                    {product.relatedProducts.length === 0 ? (
                        <p>Sem produtos relacionados neste momento.</p>
                    ) : (
                        <ul>
                            {product.relatedProducts.map((item) => (
                                <li key={item.id}>{item.name}</li>
                            ))}
                        </ul>
                    )}
                </article>
            )}
        </section>
    );
}
```

5. Explicação do código.

A página mantém a arquitetura atual: o utilizador escreve o ID, o frontend chama `/catalog/products/:productId` com `apiRequest` e mostra o produto devolvido pela API. A única alteração visual essencial é trocar `<img>` por `OptimizedImage`.

O código preserva `brandName` e `priceCents`, que são os campos reais do backend. O botão de carrinho continua separado e só chama `/cart/items` no clique do utilizador.

6. Validação do passo.

Confirma que o ficheiro importa `OptimizedImage` e `apiRequest`, não importa `react-router-dom`, não usa `product.brand` nem `product.priceFormatted`, e mantém o botão de carrinho com `type="button"`.

7. Cenário negativo/erro esperado.

Com um ID inexistente, a página deve mostrar "Produto não encontrado." e não deve tentar adicionar nada ao carrinho.

### Passo 6 - Acrescentar estilos para imagens otimizadas

1. Objetivo funcional do passo no contexto da app.

Reservar dimensões estáveis para imagens otimizadas e evitar saltos visuais quando a imagem carrega.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/styles.css`
    - LOCALIZAÇÃO: acrescentar o bloco no fim do ficheiro.

3. Instruções do que fazer.

Acrescenta o bloco abaixo no fim de `styles.css`. Não substituas estilos existentes.

4. Código completo, correto e integrado com a app final.

```css
/* apps/web/src/styles.css */

/* A classe comum mantém imagens fluidas sem afetar todos os <img> da app. */
.optimized-image {
    display: block;
    max-width: 100%;
    height: auto;
    object-fit: cover;
}

.product-detail-card {
    display: grid;
    gap: 12px;
    max-width: 720px;
}

/* A proporção reserva espaço antes da imagem chegar e reduz saltos de layout. */
.product-detail-image {
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: 8px;
    background: #f5f1ee;
}

.product-detail-section form {
    display: grid;
    gap: 12px;
    max-width: 420px;
}

@media (max-width: 760px) {
    .product-detail-card {
        max-width: 100%;
    }
}
```

5. Explicação do código.

`.optimized-image` define comportamento comum para imagens otimizadas. `.product-detail-image` reserva proporção com `aspect-ratio`, o que reduz alterações bruscas de layout. O CSS não mexe em todas as imagens globais da app, apenas nas classes usadas neste BK.

6. Validação do passo.

Confirma que o CSS contém `.optimized-image`, `.product-detail-card`, `.product-detail-image` e uma media query para ecrãs estreitos.

7. Cenário negativo/erro esperado.

Se `aspect-ratio` for removido, a página pode saltar quando a imagem terminar de carregar. Se o estilo for aplicado a todos os `img`, outras páginas podem mudar sem autorização deste BK.

### Passo 7 - Criar verificação focal do BK

1. Objetivo funcional do passo no contexto da app.

Criar um script local que confirma as integrações principais do BK e rejeita regressões como `apiClient`, `react-router-dom` e campos de produto errados.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/scripts/check-mf6-images.mjs`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo e executa-o após aplicares os passos anteriores. Este script lê ficheiros de `apps/web/src` e valida o contrato deste BK.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/scripts/check-mf6-images.mjs

import { readFile } from "node:fs/promises";

const projectRoot = new URL("../", import.meta.url);

/**
 * Lê um ficheiro dentro de apps/web usando caminho relativo.
 *
 * @async
 * @function readProjectFile
 * @param {string} relativePath - Caminho dentro de apps/web.
 * @returns {Promise<string>} Conteúdo textual do ficheiro.
 */
async function readProjectFile(relativePath) {
    return readFile(new URL(relativePath, projectRoot), "utf8");
}

/**
 * Confirma que um ficheiro contém texto obrigatório.
 *
 * @function assertIncludes
 * @param {string} content - Conteúdo do ficheiro.
 * @param {string} expected - Texto esperado.
 * @param {string} label - Descrição da regra.
 * @returns {void}
 */
function assertIncludes(content, expected, label) {
    if (!content.includes(expected)) {
        throw new Error(`${label}: falta "${expected}"`);
    }
}

/**
 * Confirma que um ficheiro não contém texto proibido para este BK.
 *
 * @function assertNotIncludes
 * @param {string} content - Conteúdo do ficheiro.
 * @param {string} forbidden - Texto proibido.
 * @param {string} label - Descrição da regra.
 * @returns {void}
 */
function assertNotIncludes(content, forbidden, label) {
    if (content.includes(forbidden)) {
        throw new Error(`${label}: remove "${forbidden}"`);
    }
}

const [
    optimizedImage,
    compressionHelper,
    facePhotoUploadPage,
    productDetailsPage,
    styles,
] = await Promise.all([
    readProjectFile("src/components/OptimizedImage.jsx"),
    readProjectFile("src/utils/image-compression.js"),
    readProjectFile("src/pages/FacePhotoUploadPage.jsx"),
    readProjectFile("src/pages/ProductDetailsPage.jsx"),
    readProjectFile("src/styles.css"),
]);

// Estas regras garantem que a imagem tem atributos reais de performance.
assertIncludes(optimizedImage, "loading={loadingMode}", "OptimizedImage controla lazy loading");
assertIncludes(optimizedImage, 'decoding="async"', "OptimizedImage usa descodificação assíncrona");

assertIncludes(
    compressionHelper,
    'typeof createImageBitmap === "function"',
    "compressão verifica suporte do browser",
);
assertIncludes(compressionHelper, "catch", "compressão tem fallback em erro");
assertIncludes(compressionHelper, "bitmap?.close?.()", "compressão liberta bitmap");

assertIncludes(facePhotoUploadPage, "apiRequest", "upload facial usa cliente real");
assertNotIncludes(facePhotoUploadPage, "apiClient", "upload facial não deve importar apiClient");
assertIncludes(facePhotoUploadPage, "compressImageForUpload", "upload comprime antes do envio");
assertIncludes(facePhotoUploadPage, 'formData.append("frontal"', "upload mantém campo frontal");
assertIncludes(facePhotoUploadPage, 'formData.append("perfil"', "upload mantém campo perfil");

// A página de produto deve preservar o contrato real do backend.
assertIncludes(productDetailsPage, "OptimizedImage", "detalhe usa imagem otimizada");
assertIncludes(productDetailsPage, "apiRequest", "detalhe usa cliente real");
assertNotIncludes(productDetailsPage, "react-router-dom", "detalhe não introduz router");
assertIncludes(productDetailsPage, "product.brandName", "detalhe usa brandName");
assertIncludes(productDetailsPage, "product.priceCents", "detalhe usa priceCents");
assertNotIncludes(productDetailsPage, "product.priceFormatted", "detalhe não usa preço inexistente");

assertIncludes(styles, ".optimized-image", "CSS contém classe comum");
assertIncludes(styles, ".product-detail-image", "CSS reserva layout da imagem");

console.log("BK-MF6-04 image checks passed");
```

5. Explicação do código.

O script lê os cinco ficheiros principais do BK e confirma marcas de integração. Ele verifica o caminho positivo, como `OptimizedImage`, `compressImageForUpload` e `apiRequest`, e o caminho negativo, como ausência de `apiClient`, ausência de `react-router-dom` e ausência de `product.priceFormatted`.

Isto ajuda o aluno a detetar rapidamente se copiou código antigo ou se mudou o contrato real do produto.

6. Validação do passo.

Executa `node apps/web/scripts/check-mf6-images.mjs`. O output esperado é `BK-MF6-04 image checks passed`.

7. Cenário negativo/erro esperado.

Se `ProductDetailsPage.jsx` importar `react-router-dom` ou usar `product.priceFormatted`, o script deve falhar com mensagem clara.

#### Expected results

- `OptimizedImage` existe e centraliza `loading`, `decoding`, `alt` e `referrerPolicy`.
- `compressImageForUpload` comprime imagens grandes quando o browser suporta as APIs necessárias.
- A compressão devolve o ficheiro original quando não for segura.
- `FacePhotoUploadPage.jsx` usa `apiRequest`, preserva consentimento e envia `frontal`/`perfil`.
- `ProductDetailsPage.jsx` usa `OptimizedImage`, `apiRequest`, `brandName` e `priceCents`.
- `styles.css` reserva espaço para imagens de produto.
- `check-mf6-images.mjs` valida a integração principal do BK.

#### Critérios de aceite

- O BK não introduz dependências novas.
- O BK não introduz router.
- O BK não usa `apiClient`.
- O BK preserva `/face-consent`, `/face-photos`, `/catalog/products/:productId` e `/cart/items`.
- O backend continua responsável por consentimento, ownership e validação final.
- O carrinho só muda após clique do utilizador.
- `node apps/web/scripts/check-mf6-images.mjs` termina com sucesso.
- `npm --prefix apps/web run build` termina com sucesso.
- `### Matriz minima de testes por prioridade`: para `P1`, o BK exige teste focal, build frontend e `2` cenários negativos.
- Cenarios negativos concluidos: minimo `2`, cobrindo ausência de consentimento antes do upload e ID de produto inexistente no detalhe.
- Evidencia de testes por camada registada com script focal, build frontend, validador documental e notas de regressão para falhas observadas no script focal, no build ou no validador documental.

#### Validação final

Executa estes comandos a partir da raiz do projeto:

```bash
node apps/web/scripts/check-mf6-images.mjs
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
```

Executar cenarios negativos obrigatorios (minimo 2): ausência de consentimento antes do upload facial e ID de produto inexistente na página de detalhe.

- Negativos: minimo `2` cenarios com resultado controlado e evidence registada.
- As secções iniciais explicam objetivo, importância, pre-requisitos, glossário e conceitos técnicos do BK.
- As secções operacionais indicam scope, ficheiros, passos lineares, validação, handoff e evidence sem checklists pendentes.
- A validação final usa comandos reais do projeto e resultados observáveis pelo aluno.
- O guia não mantém secções estruturais antigas fora do contrato `####` da MF6.

Se o validador global falhar por regras antigas de guias, regista a falha no relatório técnico e preserva a evidência do script focal e do build.

#### Evidence para PR/defesa

- Output de `node apps/web/scripts/check-mf6-images.mjs`.
- Output de `npm --prefix apps/web run build`.
- Evidencia de testes por camada: script focal do BK, build frontend, execução do validador documental e cenários negativos registados.
- Screenshot da página de detalhe de produto com imagem carregada.
- Screenshot do formulário facial antes do envio.
- Nota técnica indicando que não foram adicionadas dependências.
- Nota de segurança indicando que o frontend não guarda fotografias no armazenamento persistente do browser.
- Nota de domínio indicando que produtos só entram no carrinho por clique explícito.

#### Handoff

Entrega ao `BK-MF6-05` um frontend que otimiza imagens sem alterar endpoints e sem enfraquecer consentimento, ownership ou validação backend. O próximo BK pode concentrar-se em transporte seguro porque este BK mantém os fluxos `/face-photos`, `/catalog/products/:productId` e `/cart/items` estáveis.

#### Changelog

- 2026-06-24: Substituída checklist estrutural antiga por validação observável alinhada com o contrato ativo da MF6.
- 2026-06-23: Acrescentados anchors de validação documental dentro das secções modernas para fechar a divergência do gate sem regressar ao layout antigo.
- 2026-06-23: Corrigido para usar `apiRequest`, remover dependência inexistente de router, preservar `brandName`/`priceCents`, alinhar passos 1-7, acrescentar cenários negativos e reforçar comentários didáticos internos.
