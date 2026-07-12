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
- `last_updated`: `2026-07-11`

> **Contrato atual (2026-07-10):** as imagens de catálogo são publicadas em variantes `320`, `640` e `960` píxeis, com AVIF, WebP e PNG fallback. A UI usa `<picture>`, `srcset`, `sizes`, largura e altura explícitas. Só a imagem crítica do hero usa `loading="eager"` e prioridade alta; as restantes usam lazy loading. Os gates medem transferência real e impõem `thumbnail <= 120 KiB` e imagem crítica `<= 300 KiB`. A otimização local do upload é apenas uma primeira redução; a API continua a validar, auto-orientar, remover EXIF e normalizar os bytes recebidos.

> **Upload canónico OpenAI v2 — 2026-07-11:** integrar `compressImageForUpload` em `apps/web/src/features/consultation/NewConsultationPage.jsx`, depois do preflight e antes de criar o `FormData` com `frontal`/`perfil`. O consentimento é o contrato OpenAI v2 emitido pelo backend; não enviar uma versão `face-analysis-v1` nem criar `FacePhotoUploadPage`. O Passo 4 e o smoke inferior que usam essa página antiga são históricos e **não devem ser executados**. Ver [plano canónico da consulta OpenAI](../../PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md).

### Critérios de aceitação ativos

- Catálogo usa variantes `320/640/960`, `<picture>`, dimensões explícitas e budgets aprovados.
- `NewConsultationPage` comprime como otimização best-effort, preserva `frontal`/`perfil` e não substitui preflight ou validação backend.
- A API volta a validar tipo, tamanho, dimensões/pixels, auto-orienta, remove EXIF e normaliza WebP antes de cifrar.
- Falha de compressão local conserva o ficheiro original; fotografia tecnicamente inválida continua rejeitada pelo backend.

<details class="historical-archive">
<summary><strong>Anexo histórico do upload facial v1 — não executar</strong></summary>

> Todo o conteúdo restante deste ficheiro, incluindo `FacePhotoUploadPage`, consentimento v1, passos, smoke, checklists e evidence associados, é preservado apenas para rastreabilidade e não constitui instrução ativa.

#### Objetivo

Neste BK vais implementar o pipeline de imagens responsivas do Orelle. O requisito `RNF08` pede imagens otimizadas com `lazy loading` e compressão automática, e a prova final exige variantes adequadas ao viewport e budgets observáveis no browser.

O trabalho fica concentrado em três zonas: geração de variantes dos assets de catálogo, renderização responsiva na página de produto e redução inicial das fotografias enviadas no fluxo facial. O resultado esperado é reduzir peso e trabalho inicial do browser sem alterar consentimento, autenticação, validação backend, carrinho ou regras de privacidade.

#### Importância

Imagens são essenciais no Orelle: ajudam o cliente a ver produtos, enviar fotografias faciais e confiar nas recomendações. Também podem tornar a app lenta se forem carregadas sem controlo ou enviadas para a API com tamanho desnecessário.

`CANONICO`: `RNF08` define otimização de imagens como requisito de performance. `BK-MF6-04` é `P1`, `Core` e prepara `BK-MF6-05`, onde a comunicação segura continua a proteger os fluxos que transportam imagens.

`DERIVADO`: este BK usa um componente React `OptimizedImage`, um gerador de variantes baseado em `sharp` já adotado pelo projeto e um helper `compressImageForUpload`. O browser escolhe a variante; a API continua a fazer a normalização de segurança do upload.

#### Scope-in

- Criar `apps/web/src/components/OptimizedImage.jsx` com `<picture>`, AVIF, WebP e fallback.
- Criar `apps/web/scripts/generate-responsive-product-images.mjs` para variantes `320/640/960` sem upscale.
- Criar `apps/web/src/utils/responsiveImageSources.js` e `apps/web/src/utils/imageOptimization.js`.
- Atualizar `apps/web/src/pages/FacePhotoUploadPage.jsx` para comprimir fotografias antes de criar o `FormData`.
- Atualizar `apps/web/src/pages/ProductDetailsPage.jsx` para usar `OptimizedImage` sem alterar o contrato atual da página.
- Acrescentar CSS para imagens otimizadas em `apps/web/src/styles.css`.
- Criar `apps/web/scripts/check-mf6-images.mjs` e um teste Playwright de transferência como verificações focais.
- Manter `apiRequest`, os endpoints existentes e os campos `frontal` e `perfil`.

#### Scope-out

- Não criar endpoints novos.
- Não alterar a API de upload facial.
- Não alterar regras de consentimento facial.
- Não alterar validações backend de tipo, tamanho, quantidade ou ownership.
- Não adicionar outro router nem pedir IDs técnicos ao utilizador; reutilizar `react-router-dom`/`useParams` já presentes. `sharp` é a única dependência justificada para gerar/normalizar imagens.
- Não guardar fotografias, tokens ou dados biométricos no armazenamento persistente do browser.
- Não alterar carrinho, encomenda, pagamento, recomendações ou checkout.

#### Estado antes e depois

Antes deste BK, a página de detalhe de produto renderiza uma origem única com `<img>` direto e o fluxo facial pode enviar ficheiros selecionados no tamanho original.

Depois deste BK, a página de detalhe de produto usa `OptimizedImage` com variantes e dimensões explícitas, as fotografias facial frontal e de perfil passam por compressão local antes do envio e a API valida e normaliza os bytes. Se a redução no browser não for suportada, o original pode seguir para a API, mas nunca contorna a validação, a remoção de EXIF nem a normalização server-side.

#### Pre-requisitos

- Saber que `apps/web/src/services/apiClient.js` exporta `apiRequest`.
- Saber que `apiRequest` já usa `credentials: "include"` e deteta `FormData`.
- Saber que `apps/web/src/pages/FacePhotoUploadPage.jsx` envia `/face-consent` e `/face-photos`.
- Saber que `apps/web/src/pages/ProductDetailsPage.jsx` recebe `productId` pela rota, consome `/catalog/products/:productId` e usa `brandName`, `priceCents`, `reviewSummary` e `ingredientNames`.
- Rever `RF10`, `RF13` e `RNF08`.
- Ter `npm --prefix apps/web run build` funcional antes de iniciar o BK.

#### Glossário

- `lazy loading`: carregamento adiado de imagens que ainda não precisam de aparecer no ecrã.
- `decoding`: descodificação da imagem pelo browser antes de a desenhar.
- `srcset`: conjunto de variantes entre as quais o browser escolhe de acordo com o viewport e a densidade do ecrã.
- `sizes`: largura prevista da imagem em cada breakpoint, usada na escolha de `srcset`.
- prioridade de fetch: prioridade de rede reservada à imagem crítica que pode determinar o LCP; no JSX atual é emitida através de `fetchpriority`.
- `compressão`: redução do tamanho de um ficheiro antes de o enviar.
- `fallback`: caminho seguro usado quando uma otimização falha.
- `FormData`: estrutura usada para enviar ficheiros num pedido HTTP.
- `MIME type`: tipo declarado do ficheiro, como `image/jpeg` ou `image/png`.
- `ownership`: garantia de que dados sensíveis pertencem ao utilizador autenticado correto.
- `CANONICO`: regra presente nos documentos oficiais.
- `DERIVADO`: decisão técnica mínima para cumprir o contrato sem inventar domínio.

#### Conceitos teóricos essenciais

`lazy loading` reduz o trabalho inicial do browser. Quando uma imagem usa `loading="lazy"`, o browser pode atrasar o carregamento até a imagem estar próxima do ecrã visível. A exceção é a imagem crítica do hero: usa carregamento eager e prioridade alta para não atrasar o LCP.

`<picture>` permite disponibilizar AVIF, WebP e fallback. `srcset` com variantes `320/640/960` evita transferir uma imagem de desktop para um telemóvel; `sizes` informa a largura visual esperada. `width` e `height` explícitos reservam espaço e evitam CLS.

`decoding="async"` permite ao browser descodificar imagens com menos impacto na renderização principal. Não substitui imagens bem dimensionadas, mas melhora a fluidez.

Compressão local de imagens usa APIs nativas: `createImageBitmap`, `canvas` e `toBlob`. O ficheiro é lido em memória e redesenhado com largura máxima, mas o helper preserva o MIME e o nome originais; um PNG continua PNG e não é cristalizado artificialmente em JPEG. A app não guarda a fotografia no browser; apenas prepara uma versão mais leve para o upload. A API continua a descodificar e normalizar todo o conteúdo recebido para WebP seguro.

O backend continua a proteger o sistema. A compressão no frontend não substitui consentimento, sessão autenticada, ownership, validação de MIME type, tamanho máximo, quantidade de ficheiros e campos obrigatórios.

No frontend React, o estado local controla ficheiro selecionado, consentimento, loading, sucesso e erro. O aluno deve preservar estes estados porque o upload facial envolve dados sensíveis e precisa de mensagens claras.

Na página de produto, a otimização da imagem não pode alterar o domínio de comércio. Ver produto e adicionar ao carrinho são ações separadas. O botão de carrinho continua a chamar `/cart/items` apenas quando o utilizador clica.

Em testes e evidence, este BK combina um script focal, build e Playwright. O script valida o contrato estático; o browser mede bytes realmente transferidos, LCP e CLS. O tamanho do ficheiro-fonte ou uma estimativa no mount não prova `RNF08`.

#### Arquitetura do BK

O BK atua em `apps/web`.

`generate-responsive-product-images.mjs` lê os PNG canónicos em `public/products`, cria AVIF/WebP nas larguras `320/640/960` e otimiza o próprio PNG como fallback de 960 px. Os outputs temporários são validados antes de rename; não existe publicação parcial.

`OptimizedImage` centraliza `<picture>`, `srcset`, `sizes`, dimensões, `loading`, prioridade de fetch, `decoding`, `alt` e `referrerPolicy`.

`compressImageForUpload` é um helper isolado para comprimir ficheiros de imagem antes de serem anexados ao `FormData`.

`FacePhotoUploadPage.jsx` usa o helper antes de chamar `/face-photos`, mantendo `/face-consent`, `frontal`, `perfil` e `apiRequest`.

`ProductDetailsPage.jsx` usa `useParams` para obter `productId` da rota pública, recarrega/cancela o pedido quando o parâmetro muda e nunca pede um ID técnico ao utilizador. Mantém `/catalog/products/:productId`, `brandName`, `priceCents` e troca o `<img>` direto por `OptimizedImage`.

`check-mf6-images.mjs` valida a integração esperada depois de o aluno aplicar o BK; o teste consolidado `performance.spec.js` valida budgets com `PerformanceObserver` e Resource Timing.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/web/src/components/OptimizedImage.jsx`
- CRIAR: `apps/web/scripts/generate-responsive-product-images.mjs`
- CRIAR: `apps/web/src/utils/responsiveImageSources.js`
- CRIAR: `apps/web/src/utils/imageOptimization.js`
- EDITAR: `apps/web/src/pages/FacePhotoUploadPage.jsx`
- EDITAR: `apps/web/src/pages/ProductDetailsPage.jsx`
- EDITAR: `apps/web/src/styles.css`
- CRIAR: `apps/web/scripts/check-mf6-images.mjs`
- EDITAR: `apps/web/tests/e2e/performance.spec.js`
- REVER: `apps/web/tests/e2e/helpers/performance.js`
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

Se encontrares um cliente HTTP paralelo ou um formulário que pede `productId` ao utilizador, esse código deve ser corrigido. `ProductDetailsPage` reutiliza o router existente e recebe o identificador exclusivamente através de `useParams`.

### Passo 2 - Gerar variantes responsivas

1. Objetivo funcional do passo no contexto da app.

Gerar versões AVIF e WebP nas larguras `320`, `640` e `960`, sem upscale, e otimizar o PNG canónico como fallback de 960 px.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/scripts/generate-responsive-product-images.mjs`
    - EDITAR: `apps/web/package.json`, adicionando `images:generate`.

3. Instruções do que fazer.

O script percorre apenas `public/products`, aceita como fontes canónicas nomes slug terminados em `.png`, usa nomes determinísticos e publica seis variantes ao lado do PNG fallback. Cada output é escrito temporariamente, validado quanto a dimensão/budget e só depois publicado por rename. `sharp` é justificado porque as APIs nativas de Node não codificam AVIF/WebP nem garantem a mesma orientação e remoção de metadata.

4. Código essencial integrado com a app final.

```js
// apps/web/scripts/generate-responsive-product-images.mjs
import { readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PRODUCT_DIR = path.resolve("public/products");
const WIDTHS = Object.freeze([320, 640, 960]);
const THUMBNAIL_MAX_BYTES = 120 * 1024;
const IMAGE_MAX_BYTES = 300 * 1024;

async function validateVariant(filePath, expectedWidth) {
    const [fileStats, metadata] = await Promise.all([
        stat(filePath),
        sharp(filePath).metadata(),
    ]);
    const maximumBytes = expectedWidth === 320
        ? THUMBNAIL_MAX_BYTES
        : IMAGE_MAX_BYTES;
    if (metadata.width !== expectedWidth || fileStats.size > maximumBytes) {
        throw new Error(`Variante inválida ou acima do budget: ${path.basename(filePath)}`);
    }
}

for (const filename of (await readdir(PRODUCT_DIR)).filter((name) => /^[a-z0-9-]+\.png$/i.test(name))) {
    const sourcePath = path.join(PRODUCT_DIR, filename);
    const slug = path.basename(filename, ".png");
    const metadata = await sharp(sourcePath, { failOn: "error" }).metadata();
    if (!metadata.width || metadata.width < WIDTHS.at(-1)) {
        throw new Error(`${filename} não permite uma variante real de 960px`);
    }

    const pending = [];
    try {
        for (const width of WIDTHS) {
            for (const format of ["avif", "webp"]) {
                const finalPath = path.join(PRODUCT_DIR, `${slug}-${width}.${format}`);
                const temporaryPath = `${finalPath}.orelle-tmp`;
                let pipeline = sharp(sourcePath).rotate().resize({ width, withoutEnlargement: true });
                pipeline = format === "avif"
                    ? pipeline.avif({ quality: 54, effort: 6 })
                    : pipeline.webp({ quality: 76, effort: 6 });
                pending.push({ temporaryPath, finalPath, width });
                await pipeline.toFile(temporaryPath);
            }
        }

        const fallbackTemporaryPath = `${sourcePath}.orelle-tmp`;
        pending.push({ temporaryPath: fallbackTemporaryPath, finalPath: sourcePath, width: 960 });
        await sharp(sourcePath)
            .rotate()
            .resize({ width: 960, withoutEnlargement: true })
            .png({ palette: true, colours: 128, compressionLevel: 9 })
            .toFile(fallbackTemporaryPath);

        await Promise.all(
            pending.map(({ temporaryPath, width }) => validateVariant(temporaryPath, width)),
        );
        for (const output of pending) {
            await rename(output.temporaryPath, output.finalPath);
        }
    } finally {
        await Promise.all(pending.map(({ temporaryPath }) => rm(temporaryPath, { force: true })));
    }
}
```

5. Validação do passo.

Executa `npm --prefix apps/web run images:generate` e confirma, por produto, seis variantes (`3 × AVIF/WebP`) e um PNG fallback otimizado. Executa também `npm --prefix apps/web run check:g6-image-budgets`.

6. Cenário negativo/erro esperado.

Um ficheiro que não seja um PNG canónico com slug é ignorado. Uma fonte com menos de `960` píxeis é recusada, em vez de inventar uma variante ampliada.

### Passo 2A - Criar o componente `OptimizedImage`

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

import { useState } from "react";
import { getProductPictureSources } from "../utils/responsiveImageSources.js";

/**
 * Renderiza uma imagem com atributos de performance e acessibilidade.
 *
 * @function OptimizedImage
 * @param {{src: string, alt: string, width?: number|string, height?: number|string, className?: string, sizes?: string, priority?: boolean}} props - Dados da imagem.
 * @returns {JSX.Element|null} Imagem pronta ou fallback acessível.
 */
export function OptimizedImage({
    src,
    alt,
    width,
    height,
    className = "",
    sizes = "100vw",
    priority = false,
}) {
    const [failed, setFailed] = useState(false);
    const resolvedWidth = width ?? 640;
    const resolvedHeight = height ?? resolvedWidth;
    const sources = getProductPictureSources(src);

    if (!src || failed) {
        return (
            <span
                className={`optimized-image-fallback ${className}`.trim()}
                role="img"
                aria-label={`${alt}. Imagem indisponível.`}
                style={{ aspectRatio: `${resolvedWidth} / ${resolvedHeight}` }}
            >
                Imagem indisponível
            </span>
        );
    }

    return (
        <picture>
            {sources?.avifSrcSet ? <source type="image/avif" srcSet={sources.avifSrcSet} sizes={sizes} /> : null}
            {sources?.webpSrcSet ? <source type="image/webp" srcSet={sources.webpSrcSet} sizes={sizes} /> : null}
            <img
                className={className}
                src={sources?.fallbackSrc ?? src}
                sizes={sizes}
                width={resolvedWidth}
                height={resolvedHeight}
                alt={alt}
                loading={priority ? "eager" : "lazy"}
                fetchpriority={priority ? "high" : undefined}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setFailed(true)}
            />
        </picture>
    );
}
```

5. Explicação do código.

O componente recebe o URL PNG público, deriva AVIF/WebP através de `responsiveImageSources` e preserva o PNG como fallback. O `loading` fica `lazy` por defeito; apenas a imagem que determina o hero/LCP recebe `priority`, carregamento eager e prioridade alta. As dimensões explícitas reservam layout antes da transferência.

Este componente prepara `ProductDetailsPage.jsx` para deixar de repetir atributos de imagem. O aluno pode mudar `className` e `sizes`, mas não deve remover `<picture>`, `srcset`, dimensões, `alt`, `loading`, prioridade, `decoding` nem `referrerPolicy` sem justificar a alteração.

6. Validação do passo.

Confirma que o ficheiro exporta `OptimizedImage` e contém `<picture>`, fontes AVIF/WebP, PNG fallback, `srcSet`, `sizes`, dimensões resolvidas, `loading={priority ? "eager" : "lazy"}`, `fetchpriority`, `decoding="async"` e `referrerPolicy="no-referrer"`.

7. Cenário negativo/erro esperado.

Se o aluno remover `alt` ou dimensões, a página perde acessibilidade ou estabilidade visual. Se marcar todas as imagens com `priority`, elas competem com o recurso crítico e o requisito de performance perde efeito.

### Passo 3 - Criar o helper de compressão de imagens

1. Objetivo funcional do passo no contexto da app.

Criar uma função que tenta reduzir o tamanho de imagens antes do upload facial e devolve o ficheiro original sempre que a compressão não for segura.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/utils/imageOptimization.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria a pasta `apps/web/src/utils` se ainda não existir. O helper deve usar apenas APIs nativas do browser e não deve guardar ficheiros em armazenamento persistente do browser.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/src/utils/imageOptimization.js

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;

/**
 * Indica se o browser suporta as APIs necessárias para comprimir imagens.
 *
 * @function canCompressInBrowser
 * @returns {boolean} Verdadeiro quando há suporte mínimo para compressão local.
 */
function scaleDimensions(width, height, maxDimension) {
    const ratio = Math.min(1, maxDimension / Math.max(width, height));
    return {
        width: Math.max(1, Math.round(width * ratio)),
        height: Math.max(1, Math.round(height * ratio)),
    };
}

/**
 * Converte o conteúdo de um canvas para Blob preservando o MIME original.
 *
 * @param {HTMLCanvasElement} canvas - Canvas com a imagem redimensionada.
 * @param {string} type - MIME original.
 * @param {number} quality - Qualidade aplicável pelo encoder do browser.
 * @returns {Promise<Blob|null>} Blob comprimido ou null se o browser falhar.
 */
function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
        canvas.toBlob(resolve, type, quality);
    });
}

/**
 * Tenta comprimir uma imagem antes do envio para a API.
 *
 * @async
 * @function compressImageForUpload
 * @param {File} file - Ficheiro selecionado no formulário facial.
 * @param {{maxDimension?: number, quality?: number}} [options={}] - Orçamento local.
 * @returns {Promise<File>} Ficheiro comprimido ou original quando o fallback é necessário.
 */
export async function compressImageForUpload(file, options = {}) {
    if (
        !file?.type?.startsWith("image/") ||
        typeof createImageBitmap !== "function" ||
        typeof document === "undefined"
    ) {
        return file;
    }

    const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
    const quality = options.quality ?? DEFAULT_QUALITY;
    let bitmap;

    try {
        bitmap = await createImageBitmap(file);
        const size = scaleDimensions(bitmap.width, bitmap.height, maxDimension);
        const canvas = document.createElement("canvas");
        canvas.width = size.width;
        canvas.height = size.height;
        canvas.getContext("2d").drawImage(bitmap, 0, 0, size.width, size.height);
        const blob = await canvasToBlob(canvas, file.type, quality);

        if (!blob || blob.size >= file.size) {
            return file;
        }

        return new File([blob], file.name, {
            type: file.type,
            lastModified: file.lastModified,
        });
    } catch {
        // Qualquer falha de descodificação mantém o upload funcional com o ficheiro original.
        return file;
    } finally {
        bitmap?.close?.();
    }
}
```

5. Explicação do código.

O helper rejeita ficheiros que não são imagem e confirma se o browser suporta `createImageBitmap`. Depois cria um canvas em memória, desenha a imagem redimensionada e pede ao browser um Blob do mesmo MIME. O `File` final conserva `file.name`, `file.type` e `lastModified`; a normalização de segurança para WebP continua exclusivamente no backend.

O retorno mais importante é o fallback: se uma API não existir, se a imagem não descodificar, se o canvas falhar ou se o resultado ficar maior, o ficheiro original é devolvido. Isto cumpre o RNF08 sem quebrar o fluxo facial.

6. Validação do passo.

Confirma que o ficheiro contém `typeof createImageBitmap === "function"`, `canvas.toBlob(resolve, type, quality)`, `file.name`, `type: file.type`, `return file` e `bitmap?.close?.()`.

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
import { compressImageForUpload } from "../utils/imageOptimization.js";

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

Trocar o `<img>` direto por `OptimizedImage`, mantendo o `productId` recebido pela rota, o cancelamento quando a rota muda e o contrato real do produto.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/pages/ProductDetailsPage.jsx`
    - REVER: `apps/web/src/services/apiClient.js`
    - REVER: `apps/api/src/services/product.service.js`
    - LOCALIZAÇÃO: substituir o ficheiro completo da página.

3. Instruções do que fazer.

Substitui o conteúdo de `ProductDetailsPage.jsx` pelo código abaixo. Reutiliza `react-router-dom` já instalado, obtém `productId` com `useParams` e nunca apresenta um campo técnico de ID. Mantém `apiRequest`, `brandName`, `priceCents`, `reviewSummary` e `ingredientNames`.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/ProductDetailsPage.jsx

/**
 * Página de detalhe público de produto.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { OptimizedImage } from "../components/OptimizedImage.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/apiClient.js";

const PRODUCT_NOT_FOUND_MESSAGE = "Produto não encontrado";

/**
 * Mostra imagem, descrição, ingredientes, preço, stock e resumo de notas.
 *
 * @function ProductDetailsPage
 * @returns {JSX.Element} Detalhe do produto indicado pela rota.
 */
export function ProductDetailsPage() {
    const { user } = useAuth();
    const location = useLocation();
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [cartMessage, setCartMessage] = useState("");
    const [cartError, setCartError] = useState("");
    const [cartBusy, setCartBusy] = useState(false);
    const cartInFlightRef = useRef(false);
    const isClient = user?.role === "cliente";

    useEffect(() => {
        const controller = new AbortController();
        loadProduct(controller.signal);
        return () => controller.abort();
        // A rota é a fonte do detalhe; quando muda, a página recarrega.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    /**
     * Carrega detalhe pelo ID da rota.
     *
     * @async
     * @function loadProduct
     * @param {AbortSignal} signal - Cancela o pedido quando a rota muda.
     * @returns {Promise<void>}
     */
    async function loadProduct(signal) {
        if (!productId) return;

        setStatus("loading");
        setError("");
        setCartMessage("");
        setProduct(null);

        try {
            const data = await apiRequest(`/catalog/products/${productId}`, { signal });
            setProduct(data.product);
            setStatus("success");
        } catch (err) {
            if (err.code === "REQUEST_ABORTED") return;
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
        if (!product || cartInFlightRef.current) return;

        setCartError("");
        setCartMessage("");

        if (!isClient) {
            setCartError(
                user
                    ? "Carrinho disponível apenas para clientes."
                    : "Inicia sessão para adicionar produtos ao carrinho.",
            );
            return;
        }

        cartInFlightRef.current = true;
        setCartBusy(true);
        try {
            await apiRequest("/cart/items", {
                method: "POST",
                body: JSON.stringify({ productId: product.id, quantity: 1 }),
            });
            setCartMessage("Produto adicionado ao carrinho.");
        } catch (err) {
            setCartError(err.message);
        } finally {
            cartInFlightRef.current = false;
            setCartBusy(false);
        }
    }

    return (
        <section>
            <h1>Detalhe do produto</h1>
            <p><Link to="/produtos">Voltar ao catálogo</Link></p>

            {status === "error" && <p role="alert">{error}</p>}
            {cartError && <p role="alert">{cartError}</p>}
            {cartMessage && <p>{cartMessage} <Link to="/carrinho">Ver carrinho</Link></p>}
            {status === "loading" && <p role="status">A carregar produto...</p>}
            {status === "empty" && <p>Produto não encontrado.</p>}
            {status === "success" && product && (
                <article>
                    <OptimizedImage
                        src={product.imageUrl}
                        alt={product.name}
                        sizes="(max-width: 700px) calc(100vw - 2rem), 50vw"
                    />
                    <h2>{product.name}</h2>
                    <p>{product.brandName}</p>
                    <p>{product.description}</p>
                    <p>{(product.priceCents / 100).toFixed(2)} EUR</p>
                    <p>Stock: {product.stock}</p>
                    {isClient ? (
                        <button type="button" onClick={addToCart} disabled={cartBusy}>
                            {cartBusy ? "A adicionar..." : "Adicionar ao carrinho"}
                        </button>
                    ) : user ? (
                        <p>Carrinho disponível apenas para clientes.</p>
                    ) : (
                        <Link to="/login" state={{ from: location }}>Entrar para adicionar</Link>
                    )}
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
                    <Link to={`/produtos/${product.id}/relacionados`}>
                        Ver produtos semelhantes e complementares
                    </Link>
                </article>
            )}
        </section>
    );
}
```

5. Explicação do código.

A página recebe o ID exclusivamente da rota, chama `/catalog/products/:productId` com `apiRequest` e cancela o pedido anterior quando o parâmetro muda. O detalhe não é o hero da home, por isso mantém lazy loading; apenas o hero explicitamente marcado com `priority` usa eager/prioridade alta.

O código preserva `brandName` e `priceCents`, que são os campos reais do backend. O botão de carrinho continua separado e só chama `/cart/items` no clique do utilizador.

6. Validação do passo.

Confirma que o ficheiro importa `OptimizedImage`, `apiRequest` e `useParams`, recebe `productId` da rota, usa `AbortController`, não renderiza um campo de ID, não usa `product.brand` nem `product.priceFormatted` e mantém o botão de carrinho com `type="button"`.

7. Cenário negativo/erro esperado.

Com uma rota que contém um ID inexistente, a página deve mostrar "Produto não encontrado." e não deve tentar adicionar nada ao carrinho. Se a rota mudar durante o pedido, a chamada anterior é abortada sem apagar o estado da nova rota.

### Passo 6 - Acrescentar estilos para imagens otimizadas

1. Objetivo funcional do passo no contexto da app.

Garantir que imagens continuam fluidas e que a falha de carregamento tem um fallback visual acessível. A reserva contra CLS vem principalmente de `width`/`height` no componente.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/styles.css`
    - LOCALIZAÇÃO: rever a regra global de imagem e acrescentar o fallback sem substituir estilos existentes.

3. Instruções do que fazer.

Mantém a regra global `img { display: block; max-width: 100%; object-fit: cover; }` já existente e acrescenta o fallback abaixo. Não cries novamente um formulário de produto nem classes dependentes de ID.

4. Código completo, correto e integrado com a app final.

```css
/* apps/web/src/styles.css */

/* OptimizedImage troca a imagem por este estado quando os bytes falham. */
.optimized-image-fallback {
    display: grid;
    place-items: center;
    width: 100%;
    min-height: 8rem;
    border: 1px dashed var(--line);
    color: var(--muted);
    background: var(--surface-soft);
    text-align: center;
}
```

5. Explicação do código.

As dimensões intrínsecas de `OptimizedImage` reservam o layout antes da transferência. `.optimized-image-fallback` mantém área, contraste e mensagem quando a origem/variante falha, sem reintroduzir classes de uma página antiga.

6. Validação do passo.

Confirma que o CSS global mantém imagens fluidas e contém `.optimized-image-fallback` com área mínima e contraste. Confirma também que o componente fornece `width` e `height` mesmo quando os props são omitidos.

7. Cenário negativo/erro esperado.

Se `width`/`height` forem removidos do componente, a página pode saltar quando a imagem terminar de carregar. Se o fallback não tiver nome acessível ou contraste, a falha visual deixa de ser compreensível.

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
    variantGenerator,
    optimizedImage,
    compressionHelper,
    facePhotoUploadPage,
    productDetailsPage,
] = await Promise.all([
    readProjectFile("scripts/generate-responsive-product-images.mjs"),
    readProjectFile("src/components/OptimizedImage.jsx"),
    readProjectFile("src/utils/imageOptimization.js"),
    readProjectFile("src/pages/FacePhotoUploadPage.jsx"),
    readProjectFile("src/pages/ProductDetailsPage.jsx"),
]);

// Estas regras garantem que a imagem tem atributos reais de performance.
assertIncludes(variantGenerator, "[320, 640, 960]", "gerador cria as três larguras");
assertIncludes(variantGenerator, ".avif(", "gerador cria AVIF");
assertIncludes(variantGenerator, ".webp(", "gerador cria WebP");
assertIncludes(variantGenerator, "withoutEnlargement: true", "gerador não faz upscale");
assertIncludes(optimizedImage, "<picture>", "OptimizedImage usa picture");
assertIncludes(optimizedImage, 'type="image/avif"', "OptimizedImage oferece AVIF");
assertIncludes(optimizedImage, 'type="image/webp"', "OptimizedImage oferece WebP");
assertIncludes(optimizedImage, "srcSet", "OptimizedImage oferece variantes");
assertIncludes(optimizedImage, "sizes={sizes}", "OptimizedImage declara sizes");
assertIncludes(optimizedImage, "width={resolvedWidth}", "OptimizedImage reserva largura");
assertIncludes(optimizedImage, "height={resolvedHeight}", "OptimizedImage reserva altura");
assertIncludes(optimizedImage, 'loading={priority ? "eager" : "lazy"}', "OptimizedImage controla lazy loading");
assertIncludes(optimizedImage, "fetchpriority={priority", "OptimizedImage controla prioridade");
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
assertIncludes(productDetailsPage, "useParams", "detalhe recebe productId da rota");
assertNotIncludes(productDetailsPage, "ID do produto", "detalhe não pede ID técnico");
assertIncludes(productDetailsPage, "product.brandName", "detalhe usa brandName");
assertIncludes(productDetailsPage, "product.priceCents", "detalhe usa priceCents");
assertNotIncludes(productDetailsPage, "product.priceFormatted", "detalhe não usa preço inexistente");

console.log("BK-MF6-04 image checks passed");
```

5. Explicação do código.

O script lê os ficheiros principais do BK e confirma marcas de integração. Verifica as três larguras/formats, `<picture>`, dimensões, prioridade, `compressImageForUpload`, `apiRequest` e `useParams`, além dos negativos como ausência de `apiClient`, campo técnico de ID e `product.priceFormatted`.

Isto ajuda o aluno a detetar rapidamente se copiou código antigo ou se mudou o contrato real do produto.

6. Validação do passo.

Executa `node apps/web/scripts/check-mf6-images.mjs`. O output esperado é `BK-MF6-04 image checks passed`.

7. Cenário negativo/erro esperado.

Se `ProductDetailsPage.jsx` deixar de usar `useParams`, voltar a pedir "ID do produto" ou usar `product.priceFormatted`, o script deve falhar com mensagem clara.

### Passo 8 - Medir transferência e estabilidade no browser

1. Objetivo funcional do passo no contexto da app.

Provar que o browser escolhe variantes leves e que as imagens não degradam LCP/CLS. A medição usa Playwright e Resource Timing; screenshots e o tamanho dos ficheiros no disco são apenas evidência complementar.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/tests/e2e/performance.spec.js`
    - REVER: `apps/web/tests/e2e/helpers/performance.js`

3. Contrato do teste.

O teste consolidado instala os observers antes de navegar, mede home e catálogo, recolhe LCP, CLS, JavaScript inicial, transferência total e bytes de cada recurso de imagem. LCP/CLS correm em Chromium, onde as APIs necessárias estão disponíveis; os restantes fluxos E2E continuam multi-engine.

```js
import { expect, test } from "@playwright/test";
import {
    collectPerformanceMetrics,
    installPerformanceObservers,
    PERFORMANCE_BUDGETS,
} from "./helpers/performance.js";

for (const route of ["/", "/produtos"]) {
    test(`budgets reais em ${route}`, async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "LCP/CLS sem suporte equivalente");
        await installPerformanceObservers(page);
        await page.goto(route);
        const metrics = await collectPerformanceMetrics(page);

        expect(metrics.lcpMs).toBeGreaterThan(0);
        expect(metrics.lcpMs).toBeLessThanOrEqual(PERFORMANCE_BUDGETS.lcpMs);
        expect(metrics.cls).toBeLessThanOrEqual(PERFORMANCE_BUDGETS.cls);
        expect(metrics.initialJavascriptBytes).toBeLessThanOrEqual(
            PERFORMANCE_BUDGETS.initialJavascriptBytes,
        );
        for (const image of metrics.imageTransfers) {
            const maximum = /-320\.(?:avif|webp)$/i.test(image.path)
                ? PERFORMANCE_BUDGETS.thumbnailBytes
                : PERFORMANCE_BUDGETS.imageBytes;
            expect(image.bytes).toBeLessThanOrEqual(maximum);
        }
    });
}
```

4. Cenários negativos obrigatórios.

- Se uma imagem crítica exceder `300 KiB`, o teste falha.
- Se uma thumbnail `-320.avif|webp` exceder `120 KiB`, se a transferência total/JS exceder o budget ou se LCP/CLS ultrapassar os limites, o teste falha.

#### Expected results

- Existem variantes `320/640/960` em AVIF/WebP e PNG fallback otimizado, sem upscale.
- `OptimizedImage` usa `<picture>`, `srcset`, `sizes`, dimensões explícitas, lazy/eager contextual, prioridade, `decoding`, `alt` e `referrerPolicy`.
- `compressImageForUpload` comprime imagens grandes quando o browser suporta as APIs necessárias.
- A compressão devolve o ficheiro original quando não for segura.
- `FacePhotoUploadPage.jsx` usa `apiRequest`, preserva consentimento e envia `frontal`/`perfil`.
- `ProductDetailsPage.jsx` usa `OptimizedImage`, `apiRequest`, `brandName` e `priceCents`.
- `OptimizedImage` reserva espaço por dimensões intrínsecas e `styles.css` apresenta o fallback acessível.
- `check-mf6-images.mjs` valida a integração principal do BK.
- Playwright prova transferência real, LCP e CLS dentro dos budgets.

#### Critérios de aceite

- `sharp` é a única dependência de imagem adicionada e fica justificada pela geração/normalização AVIF/WebP.
- O BK reutiliza o router existente e `useParams`; não apresenta IDs técnicos.
- O BK não usa `apiClient`.
- O BK preserva `/face-consent`, `/face-photos`, `/catalog/products/:productId` e `/cart/items`.
- O backend continua responsável por consentimento, ownership e validação final.
- O carrinho só muda após clique do utilizador.
- `node apps/web/scripts/check-mf6-images.mjs` termina com sucesso.
- `npm --prefix apps/web run build` termina com sucesso.
- `npm --prefix apps/web run test:e2e -- performance.spec.js` termina com sucesso.
- Thumbnail transferida `<= 120 KiB`, imagem crítica `<= 300 KiB`, LCP `<= 3 s` e CLS `<= 0,1` no perfil de teste.
- Apenas uma imagem crítica usa eager/prioridade alta; as restantes imagens usam lazy loading.
- `### Matriz minima de testes por prioridade`: para `P1`, o BK exige teste focal, build frontend e `2` cenários negativos.
- Cenarios negativos concluidos: minimo `2`, cobrindo ausência de consentimento antes do upload e ID de produto inexistente no detalhe.
- Evidencia de testes por camada registada com script focal, build frontend, validador documental e notas de regressão para falhas observadas no script focal, no build ou no validador documental.

#### Validação final

Executa estes comandos a partir da raiz do projeto:

```bash
node apps/web/scripts/check-mf6-images.mjs
npm --prefix apps/web run build
npm --prefix apps/web run test:e2e -- performance.spec.js
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
- Output de `npm --prefix apps/web run test:e2e -- performance.spec.js`, incluindo LCP, CLS, JS, transferência total e bytes de imagens.
- Evidencia de testes por camada: script focal do BK, build frontend, execução do validador documental e cenários negativos registados.
- Screenshot da página de detalhe de produto com imagem carregada.
- Screenshot do formulário facial antes do envio.
- Nota técnica justificando `sharp` e confirmando ausência de dependências adicionais sem necessidade.
- Nota de segurança indicando que o frontend não guarda fotografias no armazenamento persistente do browser.
- Nota de domínio indicando que produtos só entram no carrinho por clique explícito.

#### Handoff

Entrega ao `BK-MF6-05` um frontend que otimiza imagens sem alterar endpoints e sem enfraquecer consentimento, ownership ou validação backend. O próximo BK pode concentrar-se em transporte seguro porque este BK mantém os fluxos `/face-photos`, `/catalog/products/:productId` e `/cart/items` estáveis.

#### Changelog

- 2026-07-10: Alinhado com variantes `320/640/960`, AVIF/WebP/fallback, `<picture>`, dimensões, prioridade contextual e budgets medidos por Playwright/Resource Timing.
- 2026-06-24: Substituída checklist estrutural antiga por validação observável alinhada com o contrato ativo da MF6.
- 2026-06-23: Acrescentados anchors de validação documental dentro das secções modernas para fechar a divergência do gate sem regressar ao layout antigo.
- 2026-06-23: Corrigido para usar `apiRequest`, remover dependência inexistente de router, preservar `brandName`/`priceCents`, alinhar passos 1-7, acrescentar cenários negativos e reforçar comentários didáticos internos.

## Suplemento de validacao documental
Este suplemento fecha lacunas formais detetadas pelo validador de planificacao sem alterar o contrato funcional original do guia.

## Bloco pedagogico
### Objetivo
O aluno deve completar `Imagens otimizadas (lazy loading e compressão automática).` com rastreabilidade direta a `RNF08`, mantendo evidence objetiva, negativos por prioridade e handoff claro.

### Pre-requisitos
- Rever `RNF08` nos documentos RF/RNF aplicáveis.
- Confirmar dependencias declaradas: `-`.
- Consultar `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md` e o guia atual antes de implementar.

### Erros comuns
- Fechar o BK sem negativos minimos por prioridade.
- Alterar comportamento sem alinhar matriz, backlog, anexos e guia.
- Registar evidence sem output, screenshot, request/response ou teste verificavel.

### Check de compreensao
- [ ] Sei explicar o objetivo do BK e o requisito associado.
- [ ] Sei quais sao entradas, saidas, dependencias e criterio de sucesso.
- [ ] Sei executar o smoke principal e os negativos obrigatorios.

## Bloco operacional
### Entrada
- BK: `BK-MF6-04`
- Requisito: `RNF08`
- Dependencias: `-`
- Sprint: `S10-S11`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF6-04` e do requisito `RNF08`.
2. Validar pre-condicoes e dependencias declaradas (`-`).
3. Rever ficheiros reais ligados ao BK e identificar o fluxo principal.
4. Consolidar contrato de entrada/saida com validacao, ownership e erros controlados.
5. Executar cenarios negativos obrigatorios (minimo 2) e registar o resultado.
6. Reexecutar validacao afetada e guardar evidence final para defesa/PR.

### Validacao
- [ ] Smoke: fluxo principal executa sem erro bloqueante.
- [ ] Negativos: minimo `2` cenarios com resultado controlado.
- [ ] Tecnico: metadados alinhados entre guia, backlog, matriz e anexos.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF6-05`
- Registar riscos, dependencias pendentes e validacoes executadas antes do fecho.

## Criterios de aceite
- Entrega funcional especifica de `Imagens otimizadas (lazy loading e compressão automática).` validada contra `RNF08`.
- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).
- Metadados do guia alinhados com matriz, backlog e anexos.

## Evidence para PR/defesa
- `proof_tecnico`: output, log, screenshot ou request/response do fluxo principal.
- `proof_negativos`: cenarios negativos executados e resultados observados.
- `proof_handoff`: estado final, riscos e proximo BK.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF6-04';
const MIN_NEGATIVOS = 2;

export function validarEvidenceDocumental(evidence) {
  const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;

  if (evidence?.bkId !== BK_ID) {
    throw new Error('Evidence fora do contrato do BK');
  }

  if (negativos < 2) {
    throw new Error('Cenarios negativos abaixo do minimo exigido');
  }

  return { bkId: BK_ID, estado: 'validado' };
}
```

## Changelog
- `2026-06-30`: suplemento documental adicionado para cumprir validador de planificacao.

</details>
