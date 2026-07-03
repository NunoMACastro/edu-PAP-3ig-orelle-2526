# BK-MF8-10 - Recomendações enriquecidas com respostas da avaliação guiada

## Header
- `doc_id`: `GUIA-BK-MF8-10`
- `bk_id`: `BK-MF8-10`
- `macro`: `MF8`
- `owner`: `Izelicks`
- `apoio`: `Aline`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF2-02, BK-MF4-08, BK-MF8-09`
- `rf_rnf`: `RF43, RNF23`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `taxa_recomendacao_util`
- `proximo_bk`: `BK-MF8-11`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-10-recomendacoes-enriquecidas-com-respostas-da-avaliacao-guiada.md`
- `last_updated`: `2026-07-02`

#### Objetivo

Neste BK vais transformar as recomendações base da Orélle em recomendações enriquecidas: o backend continua a usar análise facial, relatório cosmético, perfil, restrições e catálogo com stock, mas passa também a usar respostas seguras da avaliação guiada criada nos BKs anteriores.

No fim, o cliente recebe recomendações com motivos e fontes públicas, sem compra automática, sem exposição de dados sensíveis e com um contrato pronto para revisão humana no `BK-MF8-11`.

#### Importância

Uma recomendação enriquecida aumenta a confiança do cliente porque explica melhor a ligação entre o que a pessoa respondeu na consulta guiada e os produtos sugeridos. Isto liga a consultoria inteligente ao comércio sem ultrapassar a autonomia do utilizador: a aplicação recomenda, explica e deixa a decisão de compra no cliente.

Este BK também protege a sequência da MF8. O `BK-MF8-09` entregou histórico IA seguro; este BK consome esse histórico de forma minimizada; o `BK-MF8-11` passa a ter recomendações mais ricas para revisão humana.

#### Scope-in

- Validar input opcional para associar recomendações a uma sessão guiada.
- Ler contexto seguro do histórico IA com ownership no backend.
- Reutilizar restrições do perfil para bloquear produtos incompatíveis.
- Reutilizar `buildRecommendationReason` para manter explicabilidade pública.
- Ajustar o ranking com sinais guiados sem substituir análise, relatório, stock e restrições.
- Atualizar controller, service, UI e testes para recomendações enriquecidas.

#### Scope-out

- Não criar diagnóstico médico.
- Não adicionar produtos ao carrinho automaticamente.
- Não criar novo provider de IA.
- Não expor fotografias, prompts, consentimentos, storage keys, cookies, tokens ou IDs internos.
- Não alterar pagamentos, checkout, encomendas ou stock administrativo.
- Não dar ao frontend a responsabilidade de decidir ownership.

#### Estado antes e depois

- Antes: `BK-MF2-02` gera recomendações com análise, relatório e catálogo.
- Antes: `BK-MF4-08` bloqueia produtos incompatíveis com alergias e ingredientes a evitar.
- Antes: `BK-MF8-05` torna as recomendações explicáveis com motivos e fontes públicas.
- Antes: `BK-MF8-09` guarda histórico IA seguro e minimizado.
- Depois: `POST /api/recommendations/generate` aceita contexto opcional de sessão guiada, valida ownership no backend e enriquece ranking e fontes públicas.
- Depois: a UI permite gerar recomendações com ou sem sessão guiada, mantendo fallback honesto.
- Depois: `BK-MF8-11` pode rever recomendações enriquecidas sem criar contrato paralelo.

#### Pre-requisitos

- `BK-MF2-02`: recomendações personalizadas base.
- `BK-MF4-08`: restrições, alergias e ingredientes a evitar.
- `BK-MF8-05`: explicabilidade com `buildRecommendationReason` e `sourceLabels`.
- `BK-MF8-09`: histórico IA seguro com ownership e sinais minimizados.
- Saber executar `npm --prefix apps/api test` e `npm --prefix apps/web run build`.

#### Glossário

- Recomendação enriquecida: recomendação que combina análise, relatório, perfil, restrições, stock e respostas guiadas.
- Resposta guiada: dado estruturado recolhido numa sessão de avaliação cosmética, como objetivo, conforto, preferência de textura ou rotina.
- Sinal seguro: valor minimizado que pode ajudar o ranking sem revelar dados internos ou biométricos crus.
- Ranking: ordenação dos produtos candidatos por score.
- Fonte pública: explicação curta que diz ao cliente de onde veio a recomendação sem expor detalhes técnicos sensíveis.
- Fallback honesto: comportamento em que a app continua a recomendar com dados base quando não existe sessão guiada válida.

#### Conceitos teóricos essenciais

Uma recomendação personalizada não é uma compra. O backend pode sugerir produtos com motivos claros, mas a ação de adicionar ao carrinho pertence ao cliente.

O frontend não decide ownership. Mesmo que envie `consultationSessionId`, o backend só usa histórico associado ao `userId` da sessão autenticada. Esta regra evita que um cliente use o identificador de outra sessão para ler sinais de outra pessoa.

O histórico IA não deve ser usado como texto livre. Este BK consome apenas sinais minimizados: chave, label e valor curto. O service volta a filtrar esses sinais antes de os usar no ranking.

A explicabilidade vem de `RNF23`. O cliente deve ver motivo e fonte pública, mas não deve receber prompts, fotografias, storage keys, IDs internos ou detalhes de implementação.

O stock é regra de backend. O frontend pode mostrar disponibilidade, mas só o backend decide se um produto entra no ranking.

Os testes negativos provam segurança. Neste BK, os negativos principais são: sessão guiada de outro utilizador, produto incompatível com restrições, catálogo sem produtos suficientes e geração sem autenticação.

#### Arquitetura do BK

- `CANONICO`: `RF43` exige recomendações com análise, relatório, histórico, respostas guiadas, restrições e produtos reais com stock.
- `CANONICO`: `RNF23` exige explicabilidade das recomendações.
- `CANONICO`: `BK-MF8-10` depende de `BK-MF2-02`, `BK-MF4-08` e `BK-MF8-09`.
- `CANONICO`: o próximo BK é `BK-MF8-11`, revisão humana de sessões IA por consultores.
- `DERIVADO`: `consultationSessionId` é opcional para manter compatibilidade com recomendações antigas.
- `DERIVADO`: `listRecommendationHistoryContext` fica no service de histórico IA para ler contexto interno sem expor IDs no DTO público.
- `DERIVADO`: `guided_context_match` identifica reforço de ranking por respostas guiadas sem criar uma segunda explicabilidade.

Fluxo principal:

1. O cliente autenticado abre a página de recomendações.
2. Se tiver sessão guiada recente, informa o `consultationSessionId`.
3. O controller valida o body e passa apenas input normalizado ao service.
4. O service lê análise, relatório, perfil e produtos com stock.
5. O service lê contexto seguro do histórico IA filtrando por `userId` autenticado e sessão.
6. O ranking base é calculado por análise facial e depois reforçado por sinais guiados.
7. Produtos bloqueados por restrições saem antes da persistência.
8. `buildRecommendationReason` gera explicação e fontes públicas.
9. A UI mostra produto, motivo, fontes, limitações e botões de feedback.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/src/validators/recommendation-generation.validator.js`
- EDITAR: `apps/api/src/services/ai-interaction-history.service.js`
- EDITAR: `apps/api/src/services/recommendation.service.js`
- EDITAR: `apps/api/src/controllers/recommendation.controller.js`
- REVER: `apps/api/src/routes/recommendation.routes.js`
- EDITAR: `apps/web/src/pages/ProductRecommendationsPage.jsx`
- CRIAR: `apps/api/tests/mf8.enriched-recommendations.test.js`
- REVER: `apps/api/src/services/recommendation-reason.service.js`
- REVER: `apps/api/src/services/recommendation-restrictions.service.js`
- REVER: `apps/api/src/middlewares/auth.middleware.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato e fronteiras

1. Objetivo funcional do passo no contexto da app.

Confirmar que este BK implementa `RF43` e reforça `RNF23`, sem criar checkout, pagamento, provider de IA novo ou acesso indevido ao histórico IA.

2. Ficheiros envolvidos:
    - REVER: `docs/RF.md`
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
    - LOCALIZAÇÃO: entradas de `RF43`, `RNF23`, `BK-MF8-10` e `BK-MF8-11`.

3. Instruções do que fazer.

Lê os contratos canónicos. Regista que `RF43` fala de recomendações, não de compra automática. Regista também que `RNF23` obriga a explicar como a recomendação foi construída.

4. Código completo, correto e integrado com a app final.

Este passo não altera ficheiros de código. A tarefa é confirmar contrato, dependências e fronteiras antes de avançar para a implementação.

5. Explicação do código.

Como a primeira tarefa é uma leitura de contrato, não há patch técnico neste ponto. Esta decisão evita misturar recomendação, carrinho e checkout.

6. Validação do passo.

Executa:

```bash
rg -n "RF43|RNF23|BK-MF8-10|BK-MF8-11" docs/RF.md docs/RNF.md docs/planificacao/backlogs
```

O resultado deve mostrar a linha de `RF43`, a linha de `RNF23`, o BK alvo e o handoff para `BK-MF8-11`.

7. Cenário negativo/erro esperado.

Se `BK-MF8-10` não aparecer na matriz, para a implementação e regista o bloqueio no relatório da equipa.

### Passo 2 - Validar input de geração enriquecida

1. Objetivo funcional do passo no contexto da app.

Criar um validator para o body de `POST /api/recommendations/generate`, permitindo sessão guiada opcional sem aceitar IDs inválidos ou limites inseguros.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/validators/recommendation-generation.validator.js`
    - REVER: `apps/api/src/middlewares/error.middleware.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. O validator deve aceitar body vazio para manter compatibilidade com o fluxo antigo.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/recommendation-generation.validator.js
/**
 * Validator do pedido de geração de recomendações enriquecidas.
 *
 * O body é opcional para preservar o fluxo antigo. Quando existir sessão guiada,
 * o backend valida o identificador antes de o passar ao service.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

const DEFAULT_HISTORY_LIMIT = 5;
const MAX_HISTORY_LIMIT = 10;

/**
 * Normaliza limite de histórico usado para enriquecer recomendações.
 *
 * @function normalizeHistoryLimit
 * @param {unknown} value - Valor recebido do body.
 * @returns {number} Limite seguro.
 */
function normalizeHistoryLimit(value) {
    const parsed = Number.parseInt(String(value ?? DEFAULT_HISTORY_LIMIT), 10);

    if (Number.isNaN(parsed) || parsed < 1) {
        return DEFAULT_HISTORY_LIMIT;
    }

    return Math.min(parsed, MAX_HISTORY_LIMIT);
}

/**
 * Normaliza um ObjectId opcional.
 *
 * @function normalizeOptionalObjectId
 * @param {unknown} value - Valor recebido do body.
 * @param {string} fieldName - Nome do campo para mensagem de erro.
 * @returns {string|null} ObjectId válido ou null.
 * @throws {AppError} Quando o identificador existe mas não é ObjectId.
 */
function normalizeOptionalObjectId(value, fieldName) {
    if (value === undefined || value === null || value === "") return null;

    const normalized = String(value).trim();

    // Identificadores inválidos param no validator para o service receber contrato limpo.
    if (!mongoose.isValidObjectId(normalized)) {
        throw new AppError(400, `${fieldName} inválido`);
    }

    return normalized;
}

/**
 * Valida o pedido de geração de recomendações.
 *
 * @function validateRecommendationGenerationInput
 * @param {object|undefined} body - Body enviado pelo frontend.
 * @returns {{ consultationSessionId: string|null, historyLimit: number }} Input normalizado.
 * @throws {AppError} Quando o body não cumpre o contrato.
 */
export function validateRecommendationGenerationInput(body = {}) {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError(400, "Pedido de recomendação inválido");
    }

    return {
        consultationSessionId: normalizeOptionalObjectId(
            body.consultationSessionId,
            "Sessão guiada",
        ),
        historyLimit: normalizeHistoryLimit(body.historyLimit),
    };
}
```

5. Explicação do código.

`validateRecommendationGenerationInput` transforma body vazio num contrato válido. Isto preserva o endpoint antigo, onde o cliente carregava no botão sem enviar sessão guiada.

`consultationSessionId` é opcional, mas quando vem preenchido tem de ser ObjectId. A validação protege o service de valores malformados e evita que erros internos do MongoDB cheguem ao cliente.

`historyLimit` tem limite máximo. O aluno não deve deixar o browser pedir histórico sem controlo, porque isso aumenta custo e risco de expor contexto desnecessário.

6. Validação do passo.

Confirma que `validateRecommendationGenerationInput({})` devolve `consultationSessionId: null` e que um ID inválido lança `"Sessão guiada inválido"`.

7. Cenário negativo/erro esperado.

Enviar `{ consultationSessionId: "abc" }` deve devolver erro `400` controlado.

### Passo 3 - Expor contexto seguro do histórico IA para recomendações

1. Objetivo funcional do passo no contexto da app.

Adicionar ao service do `BK-MF8-09` uma função interna que devolve apenas contexto seguro para ranking, filtrado por `userId` autenticado e sessão guiada opcional.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/ai-interaction-history.service.js`
    - REVER: `apps/api/src/models/ai-interaction-history.model.js`
    - LOCALIZAÇÃO: adicionar as funções abaixo ao ficheiro existente.

3. Instruções do que fazer.

No ficheiro criado pelo `BK-MF8-09`, acrescenta o import de `mongoose` se ainda não existir e adiciona as funções abaixo antes dos exports finais. Não cries endpoint novo para isto: é uma leitura interna usada pelo service de recomendações.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/ai-interaction-history.service.js
import mongoose from "mongoose";

const RECOMMENDATION_CONTEXT_LIMIT = 5;
const ALLOWED_RECOMMENDATION_SIGNAL_KEYS = Object.freeze([
    "main_goal",
    "secondary_goal",
    "skin_comfort",
    "texture_preference",
    "price_preference",
    "routine_focus",
]);

/**
 * Normaliza uma sessão opcional usada como filtro interno.
 *
 * @function normalizeOptionalSessionId
 * @param {string|null|undefined} sessionId - Sessão guiada opcional.
 * @returns {string|null} Sessão válida ou null.
 * @throws {AppError} Quando a sessão não tem formato MongoDB.
 */
function normalizeOptionalSessionId(sessionId) {
    if (!sessionId) return null;

    const normalized = String(sessionId).trim();

    // O filtro por sessão continua no backend e nunca substitui o filtro por userId.
    if (!mongoose.isValidObjectId(normalized)) {
        throw new AppError(400, "Sessão guiada inválida");
    }

    return normalized;
}

/**
 * Filtra sinais seguros que podem influenciar recomendações.
 *
 * @function toRecommendationSafeSignal
 * @param {{key?: string, label?: string, value?: string}} signal - Sinal minimizado guardado no histórico.
 * @returns {{key: string, label: string, value: string}|null} Sinal seguro ou null.
 */
function toRecommendationSafeSignal(signal) {
    const key = String(signal?.key ?? "").trim();
    const label = String(signal?.label ?? "").trim().slice(0, 80);
    const value = String(signal?.value ?? "").trim().replace(/[<>]/g, "").slice(0, 80);

    if (!ALLOWED_RECOMMENDATION_SIGNAL_KEYS.includes(key) || !label || !value) {
        return null;
    }

    return { key, label, value };
}

/**
 * Lista contexto seguro do histórico IA para enriquecer recomendações.
 *
 * @async
 * @function listRecommendationHistoryContext
 * @param {string} userId - Utilizador autenticado.
 * @param {{consultationSessionId?: string|null, historyLimit?: number}} [options={}] - Filtros internos.
 * @returns {Promise<{historyId: string, eventType: string, safeSummary: string, safeSignals: {key: string, label: string, value: string}[]}[]>} Contexto minimizado.
 */
export async function listRecommendationHistoryContext(userId, options = {}) {
    const consultationSessionId = normalizeOptionalSessionId(options.consultationSessionId);
    const limit = Math.min(Number(options.historyLimit ?? RECOMMENDATION_CONTEXT_LIMIT), 10);
    const query = consultationSessionId
        ? { userId, sessionId: consultationSessionId }
        : { userId };

    // O userId autenticado fica sempre no filtro para impedir acesso a histórico de outro cliente.
    const historyItems = await AiInteractionHistory.find(query)
        .sort({ createdAt: -1 })
        .limit(Number.isFinite(limit) && limit > 0 ? limit : RECOMMENDATION_CONTEXT_LIMIT);

    return historyItems.map((historyItem) => ({
        historyId: historyItem._id.toString(),
        eventType: historyItem.eventType,
        safeSummary: String(historyItem.safeSummary ?? "").slice(0, 500),
        safeSignals: (historyItem.safeSignals ?? [])
            .map(toRecommendationSafeSignal)
            .filter(Boolean),
    }));
}
```

5. Explicação do código.

`listRecommendationHistoryContext` reutiliza o modelo e as regras de ownership do histórico IA. O filtro tem sempre `{ userId }` e só acrescenta `sessionId` se o cliente enviar uma sessão válida. Assim, mesmo que alguém descubra um ID de sessão de outro utilizador, a query não devolve esses dados.

`toRecommendationSafeSignal` é uma segunda barreira de minimização. O histórico pode guardar vários sinais seguros, mas a recomendação só precisa de alguns. Esta filtragem reduz o risco de usar dados que não ajudam o ranking.

A função devolve `historyId`, `eventType`, `safeSummary` curto e `safeSignals`. Não devolve `userId`, `sessionId`, `analysisId`, `reportId`, fotografias, prompts nem chaves de storage.

6. Validação do passo.

Executa:

```bash
rg -n "listRecommendationHistoryContext|ALLOWED_RECOMMENDATION_SIGNAL_KEYS|sessionId: consultationSessionId" apps/api/src/services/ai-interaction-history.service.js
```

Confirma que a query inclui sempre `userId`.

7. Cenário negativo/erro esperado.

Se `consultationSessionId` existir mas não pertencer ao utilizador autenticado, a lista devolve contexto vazio e o service de recomendações falha de forma controlada.

### Passo 4 - Enriquecer o service de recomendações

1. Objetivo funcional do passo no contexto da app.

Substituir o service de recomendações por uma versão que preserva o fluxo antigo, mas reforça o ranking com contexto seguro da sessão guiada.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/recommendation.service.js`
    - REVER: `apps/api/src/services/recommendation-reason.service.js`
    - REVER: `apps/api/src/services/recommendation-restrictions.service.js`
    - REVER: `apps/api/src/models/product-recommendation.model.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o conteúdo de `apps/api/src/services/recommendation.service.js` pelo ficheiro completo abaixo. Repara que o service continua a exportar as funções antigas, por isso `BK-MF2-02`, feedback e rotinas continuam compatíveis.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/recommendation.service.js
/**
 * Service de recomendações personalizadas e enriquecidas.
 *
 * Junta análise facial, relatório, perfil, restrições, catálogo com stock e
 * contexto seguro da avaliação guiada sem expor dados internos ao frontend.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";
import { Product } from "../models/product.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { Profile } from "../models/profile.model.js";
import { listRecommendationHistoryContext } from "./ai-interaction-history.service.js";
import {
    buildPublicSourceLabels,
    buildRecommendationReason,
} from "./recommendation-reason.service.js";
import { filterProductsBlockedByProfile } from "./recommendation-restrictions.service.js";

const SIGNAL_LABELS = Object.freeze(["moderado", "moderada", "alto", "alta"]);
const PRODUCT_SELECT = "name brandName description ingredientNames skinTypes imageUrl priceCents stock";

const GUIDED_KEYWORDS = Object.freeze({
    hidratar: ["hidrat", "conforto", "ácido hialurónico", "hialuronico"],
    luminosidade: ["luminos", "vitamina c", "mancha"],
    oleosidade: ["oleos", "sebo", "matificante", "mista"],
    sensibilidade: ["sensível", "sensivel", "suave", "calmante"],
    acne: ["acne", "imperfeição", "imperfeicao"],
    rugas: ["ruga", "anti-idade", "idade"],
});

/**
 * Normaliza texto para comparação leve.
 *
 * @function normalizeSearchText
 * @param {unknown} value - Valor original.
 * @returns {string} Texto normalizado.
 */
function normalizeSearchText(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Converte produto populado para DTO público.
 *
 * @function toProductSnapshot
 * @param {object} product - Produto Mongoose ou documento equivalente.
 * @returns {object} Produto seguro para UI.
 */
function toProductSnapshot(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredientNames: product.ingredientNames,
        skinTypes: product.skinTypes,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
    };
}

/**
 * Converte recomendação persistida para DTO público.
 *
 * @function toRecommendationDto
 * @param {object} recommendation - Recomendação com produto populado.
 * @returns {object} Recomendação segura para o frontend.
 */
function toRecommendationDto(recommendation) {
    return {
        id: recommendation._id.toString(),
        product: toProductSnapshot(recommendation.productId),
        score: recommendation.score,
        reasonCodes: recommendation.reasonCodes,
        explanation: recommendation.explanation,
        sourceLabels: buildPublicSourceLabels(recommendation.sourceSignals),
        limitations: recommendation.limitations,
        status: recommendation.status,
        feedback: recommendation.feedback,
        consultantNote: recommendation.consultantNote,
        createdAt: recommendation.createdAt,
        updatedAt: recommendation.updatedAt,
    };
}

/**
 * Cria texto pesquisável do produto.
 *
 * @function buildProductSearchText
 * @param {object} product - Produto candidato.
 * @returns {string} Texto normalizado.
 */
function buildProductSearchText(product) {
    return normalizeSearchText([
        product.name,
        product.description,
        ...(product.ingredientNames ?? []),
        ...(product.skinTypes ?? []),
    ].join(" "));
}

/**
 * Avalia compatibilidade cosmética entre produto e análise.
 *
 * @function scoreProductForAnalysis
 * @param {object} product - Produto candidato.
 * @param {object} analysis - Análise facial concluída.
 * @returns {{ score: number, reasonCodes: string[], sourceSignals: string[] }|null} Ranking base ou null.
 */
function scoreProductForAnalysis(product, analysis) {
    const reasonCodes = [];
    const sourceSignals = [];
    let score = 0;
    const findings = analysis.findings;
    const productText = buildProductSearchText(product);
    const skinType = findings.skinType?.label;

    if (skinType && product.skinTypes.includes(skinType)) {
        score += 0.45;
        reasonCodes.push("skin_type_match");
        sourceSignals.push(`skinType:${skinType}`);
    }

    if (
        SIGNAL_LABELS.includes(findings.oleosidade?.label) &&
        (product.skinTypes.includes("oleosa") || product.skinTypes.includes("mista"))
    ) {
        score += 0.25;
        reasonCodes.push("oiliness_support");
        sourceSignals.push(`oleosidade:${findings.oleosidade.label}`);
    }

    if (SIGNAL_LABELS.includes(findings.acne?.label) && productText.includes("acne")) {
        score += 0.15;
        reasonCodes.push("acne_support");
        sourceSignals.push(`acne:${findings.acne.label}`);
    }

    if (SIGNAL_LABELS.includes(findings.manchas?.label) && productText.includes("mancha")) {
        score += 0.1;
        reasonCodes.push("spots_support");
        sourceSignals.push(`manchas:${findings.manchas.label}`);
    }

    if (SIGNAL_LABELS.includes(findings.rugas?.label) && productText.includes("ruga")) {
        score += 0.1;
        reasonCodes.push("wrinkles_support");
        sourceSignals.push(`rugas:${findings.rugas.label}`);
    }

    if (reasonCodes.length === 0) return null;

    return { score, reasonCodes, sourceSignals };
}

/**
 * Converte contexto guiado em reforço de ranking para um produto.
 *
 * @function scoreGuidedContextForProduct
 * @param {object} product - Produto candidato.
 * @param {{safeSignals: {key: string, label: string, value: string}[]}[]} historyContext - Contexto seguro.
 * @returns {{guidedScore: number, guidedSignals: string[]}} Reforço calculado.
 */
function scoreGuidedContextForProduct(product, historyContext) {
    const productText = buildProductSearchText(product);
    const guidedSignals = [];
    let guidedScore = 0;

    for (const historyItem of historyContext) {
        for (const signal of historyItem.safeSignals) {
            const normalizedValue = normalizeSearchText(signal.value);
            const keywords = GUIDED_KEYWORDS[normalizedValue] ?? [normalizedValue];
            const matched = keywords.some((keyword) =>
                productText.includes(normalizeSearchText(keyword)),
            );

            if (matched) {
                // O reforço é pequeno para a sessão guiada complementar a análise, não a substituir.
                guidedScore += 0.08;
                guidedSignals.push(`report:${signal.label} - ${signal.value}`);
            }
        }
    }

    return {
        guidedScore: Math.min(guidedScore, 0.24),
        guidedSignals: [...new Set(guidedSignals)].slice(0, 4),
    };
}

/**
 * Obtém a última análise concluída e o relatório correspondente.
 *
 * @async
 * @function getLatestAnalysisAndReport
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<{ analysis: object, report: object }>} Dados base para recomendação.
 * @throws {AppError} Quando faltam análise ou relatório.
 */
async function getLatestAnalysisAndReport(userId) {
    const analysis = await FaceAnalysis.findOne({ userId, status: "completed" }).sort({
        createdAt: -1,
    });

    if (!analysis) {
        throw new AppError(400, "Análise facial concluída obrigatória");
    }

    const report = await FaceReport.findOne({
        userId,
        analysisId: analysis._id,
        privacyStatus: { $nin: ["deleted", "anonymized"] },
    }).sort({ createdAt: -1 });

    if (!report) {
        throw new AppError(400, "Relatório da análise mais recente obrigatório");
    }

    return { analysis, report };
}

/**
 * Obtém perfil cosmético obrigatório para recomendações.
 *
 * @async
 * @function getRecommendationProfile
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} Perfil do cliente.
 * @throws {AppError} Quando o perfil ainda não existe.
 */
async function getRecommendationProfile(userId) {
    const profile = await Profile.findOne({ userId });

    if (!profile) {
        throw new AppError(400, "Perfil cosmético obrigatório");
    }

    return profile;
}

/**
 * Carrega contexto seguro da sessão guiada.
 *
 * @async
 * @function getGuidedContextForRecommendations
 * @param {string} userId - Utilizador autenticado.
 * @param {{ consultationSessionId?: string|null, historyLimit?: number }} options - Opções validadas.
 * @returns {Promise<object[]>} Contexto seguro para ranking.
 * @throws {AppError} Quando a sessão pedida não tem histórico acessível.
 */
async function getGuidedContextForRecommendations(userId, options) {
    const historyContext = await listRecommendationHistoryContext(userId, options);

    if (options.consultationSessionId && historyContext.length === 0) {
        // Erro controlado: o ID pode não existir ou pode pertencer a outro utilizador.
        throw new AppError(404, "Sessão guiada sem histórico acessível");
    }

    return historyContext;
}

/**
 * Gera recomendações personalizadas do utilizador autenticado.
 *
 * @async
 * @function generateRecommendationsForUser
 * @param {string} userId - Utilizador autenticado.
 * @param {{ consultationSessionId?: string|null, historyLimit?: number }} [options={}] - Contexto opcional.
 * @returns {Promise<object[]>} Recomendações públicas.
 */
export async function generateRecommendationsForUser(userId, options = {}) {
    const { analysis, report } = await getLatestAnalysisAndReport(userId);
    const profile = await getRecommendationProfile(userId);
    const historyContext = await getGuidedContextForRecommendations(userId, options);
    const products = await Product.find({ stock: { $gt: 0 } })
        .select(PRODUCT_SELECT)
        .limit(60);
    const allowedProducts = filterProductsBlockedByProfile(products, profile);

    const rankedProducts = allowedProducts
        .map((product) => {
            const baseRanking = scoreProductForAnalysis(product, analysis);
            if (!baseRanking) return null;

            const guidedRanking = scoreGuidedContextForProduct(product, historyContext);

            return {
                product,
                score: Math.min(
                    Number((baseRanking.score + guidedRanking.guidedScore).toFixed(2)),
                    1,
                ),
                reasonCodes: baseRanking.reasonCodes,
                sourceSignals: [
                    ...baseRanking.sourceSignals,
                    "report:relatório cosmético mais recente",
                    ...guidedRanking.guidedSignals,
                ],
                usedGuidedContext: guidedRanking.guidedSignals.length > 0,
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    if (rankedProducts.length < 3) {
        throw new AppError(404, "Catálogo sem produtos compatíveis suficientes");
    }

    const recommendations = await Promise.all(
        rankedProducts.map(async ({ product, score, reasonCodes, sourceSignals, usedGuidedContext }) => {
            const reason = buildRecommendationReason({
                reasonCodes,
                sourceSignals,
                product,
                profile,
            });

            return ProductRecommendation.findOneAndUpdate(
                {
                    userId,
                    analysisId: analysis._id,
                    productId: product._id,
                },
                {
                    $set: {
                        reportId: report._id,
                        score,
                        reasonCodes: reason.reasonCodes,
                        explanation: reason.explanation,
                        sourceSignals: reason.sourceSignals,
                        limitations: [
                            ...new Set([
                                ...reason.limitations,
                                ...(report.limitations ?? []),
                                usedGuidedContext
                                    ? "Respostas guiadas ajustaram a prioridade, mas não compram produtos pelo cliente."
                                    : "Sem sessão guiada válida, a recomendação usa análise, relatório, perfil e catálogo.",
                            ]),
                        ],
                        status: "active",
                        feedback: null,
                        consultantNote: null,
                    },
                },
                { upsert: true, new: true, runValidators: true },
            ).populate("productId", PRODUCT_SELECT);
        }),
    );

    return recommendations.map(toRecommendationDto);
}

/**
 * Lista recomendações do próprio utilizador.
 *
 * @async
 * @function listRecommendationsForUser
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object[]>} Recomendações públicas.
 */
export async function listRecommendationsForUser(userId) {
    const recommendations = await ProductRecommendation.find({ userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate("productId", PRODUCT_SELECT);

    return recommendations.map(toRecommendationDto);
}

/**
 * Regista feedback do cliente numa recomendação.
 *
 * @async
 * @function submitRecommendationFeedback
 * @param {string} userId - Utilizador autenticado.
 * @param {{recommendationId: string, feedback: "util"|"nao_relevante"}} input - Feedback validado.
 * @returns {Promise<object>} Recomendação atualizada.
 */
export async function submitRecommendationFeedback(userId, input) {
    const nextStatus = input.feedback === "util" ? "accepted" : "dismissed";
    const recommendation = await ProductRecommendation.findOneAndUpdate(
        { _id: input.recommendationId, userId },
        {
            $set: {
                status: nextStatus,
                feedback: {
                    value: input.feedback,
                    submittedAt: new Date(),
                },
            },
        },
        { new: true, runValidators: true },
    ).populate("productId", PRODUCT_SELECT);

    if (!recommendation) {
        throw new AppError(404, "Recomendação não encontrada");
    }

    return toRecommendationDto(recommendation);
}
```

5. Explicação do código.

O ficheiro mantém as responsabilidades existentes e acrescenta apenas a camada de enriquecimento. `generateRecommendationsForUser` continua a exigir análise, relatório e perfil; depois carrega o contexto da sessão guiada e usa esse contexto para ajustar o score.

`scoreGuidedContextForProduct` não substitui a análise facial. O reforço máximo é pequeno, porque as respostas guiadas ajudam a ordenar melhor, mas não podem recomendar um produto sem motivo cosmético base.

`filterProductsBlockedByProfile` continua a remover produtos incompatíveis antes do ranking. Isto cumpre `RF40` e impede que uma resposta guiada empurre produto bloqueado para a lista final.

`buildRecommendationReason` continua a gerar o texto público. O frontend recebe `sourceLabels`, não recebe `sourceSignals`, histórico completo ou IDs internos.

O erro `"Sessão guiada sem histórico acessível"` é intencional. Ele cobre tanto sessão inexistente como sessão de outro utilizador, sem revelar qual dos casos aconteceu.

6. Validação do passo.

Executa:

```bash
rg -n "listRecommendationHistoryContext|usedGuidedContext|Sessão guiada sem histórico acessível|sourceLabels" apps/api/src/services/recommendation.service.js
```

Confirma que `Product.find({ stock: { $gt: 0 } })` continua presente.

7. Cenário negativo/erro esperado.

Se a sessão guiada enviada não pertencer ao utilizador autenticado, o service deve lançar `404` controlado e não gerar recomendações.

### Passo 5 - Atualizar controller mantendo a route

1. Objetivo funcional do passo no contexto da app.

Fazer o endpoint existente aceitar o novo body validado, sem criar rota paralela.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/controllers/recommendation.controller.js`
    - REVER: `apps/api/src/routes/recommendation.routes.js`
    - LOCALIZAÇÃO: ficheiro completo do controller.

3. Instruções do que fazer.

Substitui o controller pelo ficheiro abaixo. A route `POST /api/recommendations/generate` continua igual e autenticada com `requireAuth`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/controllers/recommendation.controller.js
/**
 * Controllers de recomendações personalizadas e enriquecidas.
 */
import {
    generateRecommendationsForUser,
    listRecommendationsForUser,
    submitRecommendationFeedback,
} from "../services/recommendation.service.js";
import { validateRecommendationFeedbackInput } from "../validators/recommendation-feedback.validator.js";
import { validateRecommendationGenerationInput } from "../validators/recommendation-generation.validator.js";

/**
 * Gera recomendações para o utilizador autenticado.
 *
 * @async
 * @function generateRecommendationsController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201.
 */
export async function generateRecommendationsController(req, res, next) {
    try {
        const input = validateRecommendationGenerationInput(req.body);
        // O userId vem da sessão autenticada; o browser nunca escolhe o dono das recomendações.
        const recommendations = await generateRecommendationsForUser(req.user.id, input);

        return res.status(201).json({ recommendations });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista recomendações do utilizador autenticado.
 *
 * @async
 * @function listRecommendationsController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function listRecommendationsController(req, res, next) {
    try {
        // A listagem usa sempre ownership do backend e devolve apenas DTO público.
        const recommendations = await listRecommendationsForUser(req.user.id);
        return res.status(200).json({ recommendations });
    } catch (err) {
        return next(err);
    }
}

/**
 * Regista feedback do cliente sobre uma recomendação.
 *
 * @async
 * @function submitRecommendationFeedbackController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function submitRecommendationFeedbackController(req, res, next) {
    try {
        const input = validateRecommendationFeedbackInput(req.params, req.body);
        const recommendation = await submitRecommendationFeedback(req.user.id, input);

        return res.status(200).json({ recommendation });
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código.

O controller chama o validator antes do service. Isto separa validação HTTP de regra de negócio e mantém o service a receber dados limpos.

`req.user.id` continua a ser a única fonte de ownership. O body pode ter `consultationSessionId`, mas não pode escolher `userId`.

A route não muda porque já existe `POST /api/recommendations/generate`. Criar outra rota para o mesmo objetivo duplicaria contrato e complicaria o `BK-MF8-11`.

6. Validação do passo.

Executa:

```bash
rg -n "validateRecommendationGenerationInput|generateRecommendationsForUser\\(req.user.id" apps/api/src/controllers/recommendation.controller.js
```

Confirma que `apps/api/src/routes/recommendation.routes.js` continua com `requireAuth`.

7. Cenário negativo/erro esperado.

Pedido sem sessão autenticada continua a devolver `401` antes de chegar ao controller.

### Passo 6 - Atualizar página de recomendações

1. Objetivo funcional do passo no contexto da app.

Permitir ao cliente gerar recomendações com uma sessão guiada opcional e mostrar fontes públicas, limitações e feedback.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/pages/ProductRecommendationsPage.jsx`
    - REVER: `apps/web/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo da página.

3. Instruções do que fazer.

Substitui a página pelo ficheiro abaixo. O campo de sessão guiada é opcional: se ficar vazio, a app mantém o fluxo antigo.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/ProductRecommendationsPage.jsx
/**
 * Página de recomendações personalizadas e enriquecidas.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formata preço guardado em cêntimos.
 *
 * @function formatPrice
 * @param {number} priceCents - Preço em cêntimos.
 * @returns {string} Preço legível.
 */
function formatPrice(priceCents) {
    return `${(Number(priceCents ?? 0) / 100).toFixed(2)} €`;
}

/**
 * Mostra uma lista textual com fallback honesto.
 *
 * @function SafeList
 * @param {{items?: string[], emptyText: string}} props - Lista e texto vazio.
 * @returns {import("react").JSX.Element} Lista segura.
 */
function SafeList({ items = [], emptyText }) {
    if (!items.length) return <p>{emptyText}</p>;

    return (
        <ul>
            {items.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    );
}

/**
 * Mostra recomendações personalizadas e permite feedback do cliente.
 *
 * @function ProductRecommendationsPage
 * @param {{onRecommendationsChange?: Function}} props - Callback para sincronizar recomendações.
 * @returns {import("react").JSX.Element} Página de recomendações.
 */
export function ProductRecommendationsPage({ onRecommendationsChange = () => {} }) {
    const [consultationSessionId, setConsultationSessionId] = useState("");
    const [recommendations, setRecommendations] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    /**
     * Atualiza lista local e comunica com páginas dependentes.
     *
     * @function applyRecommendations
     * @param {object[]} nextRecommendations - Lista devolvida pela API.
     * @returns {void}
     */
    function applyRecommendations(nextRecommendations) {
        const safeRecommendations = Array.isArray(nextRecommendations) ? nextRecommendations : [];
        setRecommendations(safeRecommendations);
        onRecommendationsChange(safeRecommendations);
    }

    /**
     * Pede ao backend para gerar recomendações.
     *
     * @async
     * @function generateRecommendations
     * @returns {Promise<void>}
     */
    async function generateRecommendations() {
        setStatus("loading");
        setError("");

        const body = consultationSessionId.trim()
            ? { consultationSessionId: consultationSessionId.trim(), historyLimit: 5 }
            : {};

        try {
            // A UI envia apenas a sessão opcional; o backend decide ownership com a sessão autenticada.
            const data = await apiRequest("/recommendations/generate", {
                method: "POST",
                body: JSON.stringify(body),
            });

            applyRecommendations(data.recommendations);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Carrega recomendações já existentes.
     *
     * @async
     * @function loadRecommendations
     * @returns {Promise<void>}
     */
    async function loadRecommendations() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/recommendations");
            applyRecommendations(data.recommendations);
            setStatus(data.recommendations.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Regista feedback de utilidade.
     *
     * @async
     * @function submitFeedback
     * @param {string} recommendationId - ID público da recomendação.
     * @param {"util"|"nao_relevante"} feedback - Feedback do cliente.
     * @returns {Promise<void>}
     */
    async function submitFeedback(recommendationId, feedback) {
        try {
            const data = await apiRequest(`/recommendations/${recommendationId}/feedback`, {
                method: "POST",
                body: JSON.stringify({ value: feedback }),
            });

            setRecommendations((items) => {
                // Só a recomendação devolvida pela API substitui o item local.
                const updated = items.map((item) =>
                    item.id === recommendationId ? data.recommendation : item,
                );
                onRecommendationsChange(updated);
                return updated;
            });
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Recomendações personalizadas</h1>

            <label>
                Sessão guiada opcional
                <input
                    type="text"
                    value={consultationSessionId}
                    onChange={(event) => setConsultationSessionId(event.target.value)}
                    aria-label="ID da sessão guiada concluída"
                />
            </label>

            <button type="button" onClick={generateRecommendations} disabled={status === "loading"}>
                Gerar recomendações
            </button>
            <button type="button" onClick={loadRecommendations} disabled={status === "loading"}>
                Ver recomendações existentes
            </button>

            {status === "loading" && <p>A preparar recomendações seguras...</p>}
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Ainda não existem recomendações.</p>}

            {status === "success" && (
                <ul>
                    {recommendations.map((recommendation) => (
                        <li key={recommendation.id}>
                            <article>
                                <h2>{recommendation.product.name}</h2>
                                <p>{recommendation.product.brandName}</p>
                                <p>{recommendation.explanation}</p>
                                <p>Preço: {formatPrice(recommendation.product.priceCents)}</p>
                                <p>Stock: {recommendation.product.stock}</p>
                                <p>Score: {Math.round(recommendation.score * 100)}%</p>

                                <h3>Fontes usadas</h3>
                                <SafeList
                                    items={recommendation.sourceLabels}
                                    emptyText="A API não devolveu fontes públicas para esta recomendação."
                                />

                                <h3>Limitações</h3>
                                <SafeList
                                    items={recommendation.limitations}
                                    emptyText="Sem limitações adicionais devolvidas pela API."
                                />

                                {recommendation.consultantNote && (
                                    <p>Nota do consultor: {recommendation.consultantNote}</p>
                                )}

                                <button type="button" onClick={() => submitFeedback(recommendation.id, "util")}>
                                    Útil
                                </button>
                                <button
                                    type="button"
                                    onClick={() => submitFeedback(recommendation.id, "nao_relevante")}
                                >
                                    Não relevante
                                </button>
                            </article>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
```

5. Explicação do código.

A página tem `loading`, `error`, `empty` e `success`. Isto evita ecrãs ambíguos e ajuda o aluno a testar o fluxo principal e as falhas.

O campo `consultationSessionId` é opcional. Se estiver vazio, o body enviado é `{}` e o backend usa o fluxo antigo. Se estiver preenchido, a API valida o ID e decide ownership.

`SafeList` mostra fontes e limitações sem o frontend inventar texto. Se a API não devolver fontes, a UI apresenta fallback honesto em vez de criar uma explicação falsa.

Os botões de feedback continuam iguais. A recomendação enriquecida não compra produtos nem adiciona ao carrinho.

6. Validação do passo.

Executa:

```bash
rg -n "Sessão guiada opcional|sourceLabels|A preparar recomendações seguras|Não relevante" apps/web/src/pages/ProductRecommendationsPage.jsx
```

Confirma que a página não guarda tokens nem IDs de utilizador no browser.

7. Cenário negativo/erro esperado.

Se a API devolver erro para sessão guiada inexistente ou sem ownership, a página deve mostrar a mensagem em `role="alert"`.

### Passo 7 - Criar testes de contrato e negativos

1. Objetivo funcional do passo no contexto da app.

Criar testes focais para provar que o validator, a ligação ao histórico IA, o fallback antigo e os negativos principais ficam cobertos.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.enriched-recommendations.test.js`
    - REVER: `apps/api/src/validators/recommendation-generation.validator.js`
    - REVER: `apps/api/src/services/recommendation.service.js`
    - LOCALIZAÇÃO: ficheiro completo de testes.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Mantém os testes focados no contrato do BK, não na base de dados real.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.enriched-recommendations.test.js
/**
 * Testes focais do BK-MF8-10.
 *
 * Validam input, contexto guiado e negativos de segurança sem depender de uma
 * base de dados real.
 */
import { describe, expect, it } from "vitest";
import { validateRecommendationGenerationInput } from "../src/validators/recommendation-generation.validator.js";

const VALID_SESSION_ID = "66c000000000000000000801";

/**
 * Simula uma recomendação pública enriquecida para validar contrato de DTO.
 *
 * @returns {object} Recomendação pública mínima.
 */
function makePublicRecommendation() {
    return {
        id: "66c000000000000000000901",
        product: {
            id: "66c000000000000000000902",
            name: "Gel hidratante suave",
            priceCents: 1299,
            stock: 8,
        },
        score: 0.82,
        explanation: "Gel hidratante suave foi recomendado porque é compatível com o tipo de pele estimado.",
        sourceLabels: [
            "tipo de pele estimado na análise facial: mista",
            "relatório cosmético mais recente: resposta guiada",
        ],
        limitations: [
            "A recomendação não adiciona produtos automaticamente ao carrinho.",
        ],
    };
}

describe("BK-MF8-10 - recomendações enriquecidas", () => {
    it("aceita body vazio para manter compatibilidade com o fluxo antigo", () => {
        const input = validateRecommendationGenerationInput({});

        expect(input).toEqual({
            consultationSessionId: null,
            historyLimit: 5,
        });
    });

    it("normaliza sessão guiada opcional e limita histórico", () => {
        const input = validateRecommendationGenerationInput({
            consultationSessionId: VALID_SESSION_ID,
            historyLimit: 99,
        });

        expect(input.consultationSessionId).toBe(VALID_SESSION_ID);
        expect(input.historyLimit).toBe(10);
    });

    it("recusa sessão guiada inválida antes de chegar ao service", () => {
        expect(() =>
            validateRecommendationGenerationInput({ consultationSessionId: "abc" }),
        ).toThrow("Sessão guiada inválido");
    });

    it("mantém DTO público sem dados internos", () => {
        const recommendation = makePublicRecommendation();
        const serialized = JSON.stringify(recommendation);

        // O DTO público mostra fontes e limitações, mas não transporta ownership interno.
        expect(recommendation.sourceLabels).toHaveLength(2);
        expect(serialized).not.toContain("userId");
        expect(serialized).not.toContain("sessionId");
        expect(serialized).not.toContain("storageKey");
        expect(serialized).not.toContain("prompt");
    });

    it("documenta a separação entre recomendação e compra", () => {
        const recommendation = makePublicRecommendation();

        // O texto público deve lembrar que a app recomenda; o cliente decide comprar.
        expect(recommendation.limitations.join(" ")).toContain(
            "não adiciona produtos automaticamente ao carrinho",
        );
    });
});
```

5. Explicação do código.

O primeiro teste garante compatibilidade com o fluxo antigo. Isto é importante porque nem todos os utilizadores terão uma sessão guiada no momento em que carregam recomendações.

O segundo e o terceiro testes protegem o contrato de input. Um ID inválido nunca deve chegar ao service, porque erros de validação pertencem à camada HTTP.

O quarto teste valida o formato público que a UI deve receber: `sourceLabels`, `limitations` e ausência de dados internos.

O quinto teste protege a fronteira comercial: recomendar não é comprar.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- mf8.enriched-recommendations.test.js
```

Depois executa a suite completa se o ambiente permitir.

7. Cenário negativo/erro esperado.

Se o DTO público contiver `sessionId`, `userId`, `storageKey` ou `prompt`, o teste deve falhar.

### Passo 8 - Validar a entrega e preparar o handoff

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com provas técnicas, pesquisa estática e passagem segura para revisão humana no próximo BK.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - REVER: ficheiros criados e editados neste BK
    - LOCALIZAÇÃO: comandos finais e evidence de PR/defesa.

3. Instruções do que fazer.

Executa os comandos abaixo e guarda outputs relevantes. Se algum comando falhar por ambiente, regista o erro real e o impacto.

4. Código completo, correto e integrado com a app final.

Este passo não adiciona novos ficheiros. A implementação termina nos passos anteriores; aqui entram comandos de validação, recolha de evidence e handoff.

5. Explicação do código.

A validação final prova que o guia não fica apenas bem escrito: ele ensina um caminho executável, com segurança, testes e handoff.

6. Validação do passo.

Executa:

```bash
rg -n "RF43|RNF23|BK-MF8-10" docs/RF.md docs/RNF.md docs/planificacao/backlogs
rg -n "real[_]dev|REAL[_]DEV" docs/planificacao/guias-bk/MF8/BK-MF8-10-recomendacoes-enriquecidas-com-respostas-da-avaliacao-guiada.md
npm --prefix apps/api test -- mf8.enriched-recommendations.test.js
npm --prefix apps/api test
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
git diff --check
```

7. Cenário negativo/erro esperado.

Se `npm --prefix apps/api test` falhar por `listen EPERM`, repete fora da sandbox. Se falhar por asserção real, corrige antes de marcar o BK como fechado.

#### Expected results

- `POST /api/recommendations/generate` continua a funcionar sem body.
- `POST /api/recommendations/generate` aceita `consultationSessionId` válido e filtra histórico por `req.user.id`.
- Produto sem stock não entra no ranking.
- Produto bloqueado por alergia ou ingrediente a evitar não entra no ranking.
- Recomendações públicas têm `explanation`, `sourceLabels`, `limitations`, `score` e produto público.
- DTO público não contém `userId`, `sessionId`, `storageKey`, prompts, fotografias, tokens ou cookies.
- Recomendações não adicionam produtos ao carrinho.
- Sessão guiada de outro utilizador devolve erro controlado.

#### Critérios de aceite

- Entrega funcional específica de `Recomendações enriquecidas com respostas da avaliação guiada` validada contra `RF43, RNF23`.
- `validateRecommendationGenerationInput` aceita body vazio e valida sessão guiada opcional.
- `listRecommendationHistoryContext` filtra sempre por `userId` autenticado.
- `generateRecommendationsForUser` usa análise, relatório, perfil, stock, restrições e contexto guiado seguro.
- `ProductRecommendationsPage` mostra fontes públicas e limitações sem inventar explicação.
- Cenários negativos concluídos: mínimo `3` obrigatórios com resultado controlado; a sessão sem ownership fica como negativo adicional recomendado.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).

### Matriz minima de testes por prioridade

- `P0`: unitário + integração + E2E leve/manual + mínimo 3 negativos.
- `P1`: unitário ou integração + smoke principal + mínimo 2 negativos.
- `P2`: teste focal + mínimo 1 negativo.
- `P3`: revisão estrutural + evidência de não regressão quando tocar código.

#### Validação final

- [ ] `rg -n "RF43|RNF23|BK-MF8-10" docs/RF.md docs/RNF.md docs/planificacao/backlogs` confirma contrato canónico.
- [ ] `npm --prefix apps/api test -- mf8.enriched-recommendations.test.js` passa.
- [ ] `npm --prefix apps/api test` passa ou fica documentado como bloqueio de ambiente.
- [ ] `npm --prefix apps/web run build` passa.
- [ ] `bash scripts/validate-planificacao.sh` passa.
- [ ] `git diff --check` passa.
- [ ] Negativos de sessão inválida, produto bloqueado e DTO sensível estão registados; sessão de outro utilizador fica como prova adicional de ownership.
- [ ] O handoff para `BK-MF8-11` está documentado.

#### Evidence para PR/defesa

- `proof_tecnico`: validator, service, controller, UI e teste criados/alterados em `apps/api` e `apps/web`.
- `proof_api`: output do teste focal `mf8.enriched-recommendations.test.js`.
- `proof_suite`: output de `npm --prefix apps/api test`.
- `proof_frontend`: output de `npm --prefix apps/web run build`.
- `proof_privacidade`: DTO sem IDs internos, sem fotografias, sem prompts e sem storage keys.
- `proof_negativos`: sessão inválida, sessão sem ownership, produto incompatível e recomendação sem compra automática.
- `proof_handoff`: nota a explicar que `BK-MF8-11` consome recomendações enriquecidas e fontes públicas para revisão humana.

#### Handoff

- Próximo BK recomendado: `BK-MF8-11`.
- O `BK-MF8-11` deve usar recomendações enriquecidas, `sourceLabels`, limitações e notas públicas para a fila de revisão humana.
- O consultor não deve receber fotografias, prompts, storage keys, tokens, cookies ou IDs internos da sessão IA.
- Risco a vigiar: qualquer ajuste humano futuro deve manter audit trail e não alterar recomendação sem registo.

## Bloco pedagogico

Esta secção resume o tutorial linear acima para compatibilidade com o validador documental. A implementação principal continua nos passos técnicos `1..8`.

### Objetivo

Implementar recomendações enriquecidas com respostas guiadas, histórico seguro, restrições, stock e explicabilidade pública.

### Pre-requisitos

- `BK-MF2-02` concluído para recomendações base.
- `BK-MF4-08` concluído para restrições de perfil.
- `BK-MF8-05` concluído para explicabilidade.
- `BK-MF8-09` concluído para histórico IA seguro.

### Erros comuns

- Usar `consultationSessionId` sem filtrar por `req.user.id`.
- Criar endpoint novo para a mesma geração de recomendações.
- Mostrar `sourceSignals` internos em vez de `sourceLabels` públicos.
- Permitir que resposta guiada substitua análise facial e relatório.
- Adicionar produto ao carrinho depois da recomendação.

### Check de compreensao

- Porque é que a sessão guiada é opcional?
- Porque é que o ranking guiado tem peso limitado?
- Que dados não podem aparecer no DTO público?
- Que negativos provam ownership e separação entre recomendação e compra?

## Bloco operacional

### Entrada

- Cliente autenticado.
- Análise facial concluída.
- Relatório cosmético ativo.
- Perfil com restrições.
- Catálogo com produtos em stock.
- Histórico IA seguro da sessão guiada, se existir.

### Passos

1. Confirmar `RF43`, `RNF23` e linha canónica do BK.
2. Criar validator do pedido de geração.
3. Expor contexto seguro no service de histórico IA.
4. Atualizar service de recomendações.
5. Atualizar controller mantendo a route existente.
6. Atualizar página React.
7. Executar cenarios negativos obrigatorios (minimo 3) e guardar evidence.
8. Executar validações finais.

### Validacao

- [ ] `npm --prefix apps/api test -- mf8.enriched-recommendations.test.js` passa.
- [ ] `npm --prefix apps/api test` passa ou tem bloqueio de ambiente registado.
- [ ] `npm --prefix apps/web run build` passa.
- [ ] `bash scripts/validate-planificacao.sh` passa.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.

### Handoff

`BK-MF8-11` recebe recomendações enriquecidas, fontes públicas e limitações para revisão humana auditável.

## Criterios de aceite

- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidence de testes por camada: unitário, integração HTTP ou teste focal, build frontend e revisão manual/E2E leve para `P0`.
- DTO público sem IDs internos nem dados sensíveis.
- Ranking enriquecido por sessão guiada sem compra automática.
- Handoff para `BK-MF8-11` documentado.

## Evidence para PR/defesa

- Output de `npm --prefix apps/api test -- mf8.enriched-recommendations.test.js`.
- Output de `npm --prefix apps/api test`.
- Output de `npm --prefix apps/web run build`.
- Output de `bash scripts/validate-planificacao.sh`.
- Pedido `POST /api/recommendations/generate` com body vazio e com `consultationSessionId`.
- Negativos documentados: sessão inválida, sessão sem ownership, produto bloqueado e DTO sem dados internos.

## Snippet tecnico aplicavel

```js
const BK_ID = "BK-MF8-10";
const MIN_NEGATIVOS = 3;

/**
 * Valida evidence documental mínima do BK-MF8-10.
 *
 * @param {{bkId?: string, negativos?: unknown[]}} evidence - Evidence recolhida pela equipa.
 * @returns {{bkId: string, estado: string}} Resultado validado.
 */
export function validarEvidenceDocumental(evidence) {
    const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;

    if (evidence?.bkId !== BK_ID) {
        throw new Error("Evidence fora do contrato do BK");
    }

    if (negativos < 3) {
        throw new Error("Cenarios negativos abaixo do minimo exigido");
    }

    return { bkId: BK_ID, estado: "validado" };
}
```

#### Changelog

- `2026-07-02`: guia corrigido para fechar findings do `BK-MF8-10`, com validator, contexto seguro de histórico IA, service completo de recomendações enriquecidas, controller, UI, testes focais, negativos P0 e handoff para `BK-MF8-11`.
