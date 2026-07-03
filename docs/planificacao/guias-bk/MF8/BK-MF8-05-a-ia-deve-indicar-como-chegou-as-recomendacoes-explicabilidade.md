# BK-MF8-05 - A IA deve indicar como chegou às recomendações (explicabilidade)

## Header
- `doc_id`: `GUIA-BK-MF8-05`
- `bk_id`: `BK-MF8-05`
- `macro`: `MF8`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF7-07`
- `rf_rnf`: `RNF23`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-06`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-05-a-ia-deve-indicar-como-chegou-as-recomendacoes-explicabilidade.md`
- `last_updated`: `2026-07-01`

#### Objetivo

Neste BK vais transformar a explicação das recomendações num contrato real da Orélle: cada produto recomendado deve indicar motivos, fontes públicas permitidas e limitações claras, sem expor dados sensíveis nem prometer resultado clínico.

#### Importância

A Orélle usa análise facial, relatório cosmético, perfil, histórico e restrições para recomendar produtos. O cliente precisa de perceber a razão da sugestão para confiar na app e continuar a decidir por si. A explicabilidade também prepara o `BK-MF8-06`, porque só é possível avaliar não discriminação se os motivos usados pela recomendação forem visíveis, controlados e testáveis.

#### Scope-in

- Normalizar códigos de motivo de recomendação.
- Converter sinais técnicos em fontes públicas seguras.
- Bloquear recomendações sem motivo ou sem fonte permitida.
- Acrescentar limitações públicas que separam recomendação cosmética de decisão médica ou compra automática.
- Garantir que o DTO público não devolve fotografias, caminhos internos, consentimentos, tokens, prompts ou dados biométricos crus.
- Atualizar a página de recomendações para mostrar explicação, fontes e limitações.
- Criar teste focal de `RNF23` com positivos e negativos.

#### Scope-out

- Não criar um novo provider de IA.
- Não criar novo endpoint de recomendação.
- Não alterar carrinho, checkout, pagamento ou encomendas.
- Não alterar a lógica de revisão humana de consultores.
- Não guardar fotografias, prompts internos ou dados biométricos crus na recomendação.
- Não colocar produtos automaticamente no carrinho.

#### Estado antes e depois

- Antes: as recomendações já existem e têm motivos base, mas o guia não ensina a fechar `RNF23` com código completo, DTO público, frontend e teste focal.
- Depois: o aluno passa a ter um caminho completo para gerar, persistir, listar e apresentar recomendações explicáveis, com fontes públicas, limitações e negativos executáveis.

#### Pre-requisitos

- `BK-MF2-02`: cria recomendações personalizadas a partir de análise e histórico.
- `BK-MF2-03`: introduz motivos de recomendação.
- `BK-MF4-08`: bloqueia produtos incompatíveis com alergias, ingredientes a evitar e restrições médicas leves.
- `BK-MF7-07`: isola provider de IA e devolve fontes/limitações seguras.
- `BK-MF8-04`: fecha a camada operacional anterior da MF8.
- `RF18`, `RF19`, `RF40`, `RF43` e `RNF23`: definem recomendação personalizada, motivo, restrições e explicabilidade.

#### Glossário

- Explicabilidade: capacidade de mostrar ao cliente por que razão uma recomendação apareceu.
- Código de motivo: identificador técnico controlado, como `skin_type_match`, usado pelo backend para construir uma frase pública.
- Fonte pública: resumo seguro de um sinal usado pela recomendação, sem imagem, storage key, prompt interno ou dado biométrico cru.
- Limitação: aviso honesto que explica o alcance da recomendação, por exemplo que a sugestão é cosmética e não compra o produto pelo cliente.
- DTO público: objeto devolvido pela API com apenas os campos que o frontend pode apresentar.
- Guardrail: regra que impede texto inseguro, exagerado ou fora do domínio cosmético.

#### Conceitos teóricos essenciais

Uma recomendação explicável liga três peças: o produto sugerido, os motivos técnicos e as fontes públicas. O cliente não precisa de ver todos os cálculos internos, mas deve perceber que o produto apareceu por sinais concretos como tipo de pele, oleosidade, acne, manchas, rugas, relatório cosmético ou restrições respeitadas.

No backend, o service é a camada que deve controlar esta explicação. O frontend não inventa motivos, não decide ownership e não transforma uma recomendação em compra. O controller continua a usar a sessão autenticada para identificar o utilizador, e o service só devolve recomendações desse utilizador.

Um DTO público existe para separar dados internos de dados apresentáveis. A recomendação pode guardar `reasonCodes` e `sourceSignals`, mas a API deve devolver também `sourceLabels` legíveis e limitar campos sensíveis. Este BK não devolve fotografias, storage keys, IDs de consentimento, prompts, cookies, tokens ou caminhos internos.

Em IA, explicabilidade não significa revelar prompts privados nem afirmar certezas clínicas. A Orélle deve explicar a lógica cosmética da sugestão, manter fallback honesto quando faltam dados e bloquear frases que pareçam cura, garantia ou decisão clínica.

Em testes, `RNF23` precisa de positivos e negativos. O positivo prova que uma recomendação com motivos e fontes gera explicação pública. Os negativos provam que a app recusa recomendação sem motivo, ignora fontes desconhecidas e rejeita texto inseguro.

#### Arquitetura do BK

- `bk_id`: `BK-MF8-05`
- `flow_id`: `FLOW-MF8-EXPLICABILIDADE`
- `requisitos`: `RNF23`, com apoio funcional de `RF18`, `RF19`, `RF40` e `RF43`
- `dependências`: `BK-MF7-07`
- `tema técnico`: explicabilidade segura de recomendações
- `destino dos alunos`: `apps/api` e `apps/web`
- `endpoints existentes`: `POST /api/recommendations/generate`, `GET /api/recommendations`, `POST /api/recommendations/:recommendationId/feedback`
- `modelo usado`: `ProductRecommendation`
- `service principal`: `recommendation.service.js`
- `service auxiliar`: `recommendation-reason.service.js`
- `decisão CANONICO`: `RNF23` exige explicar como a IA chegou às recomendações.
- `decisão CANONICO`: recomendações não devem violar restrições declaradas em `RF40`.
- `decisão DERIVADO`: `sourceLabels` é um campo público calculado a partir de `sourceSignals` para a UI explicar fontes sem expor detalhes internos.
- `decisão DERIVADO`: o teste focal chama `mf8.recommendation-explainability.test.js` para ficar claro que fecha `RNF23` na MF8.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/services/recommendation-reason.service.js`
- EDITAR: `apps/api/src/services/recommendation.service.js`
- EDITAR: `apps/web/src/pages/ProductRecommendationsPage.jsx`
- CRIAR: `apps/api/tests/mf8.recommendation-explainability.test.js`
- REVER: `apps/api/src/models/product-recommendation.model.js`
- REVER: `apps/api/src/routes/recommendation.routes.js`
- REVER: `apps/api/src/controllers/recommendation.controller.js`
- REVER: `apps/api/src/services/recommendation-restrictions.service.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato e fronteiras

1. Objetivo funcional do passo no contexto da app.

Confirmar que o `BK-MF8-05` implementa `RNF23` sem alterar IDs, endpoints, roles ou requisitos de comércio.

2. Ficheiros envolvidos:
    - REVER: `docs/RF.md`
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
    - LOCALIZAÇÃO: linhas de `RF18`, `RF19`, `RF40`, `RF43`, `RNF23` e `BK-MF8-05`.

3. Instruções do que fazer.

Lê os requisitos e confirma estes pontos no teu apontamento de trabalho:

- `CANONICO`: `RNF23` pede explicabilidade de recomendações.
- `CANONICO`: `RF18` e `RF19` ligam recomendação a análise/histórico e motivo.
- `CANONICO`: `RF40` impede recomendações que violem restrições declaradas.
- `CANONICO`: `RF43` prepara recomendações enriquecidas com respostas guiadas em `BK-MF8-10`.
- `DERIVADO`: `sourceLabels` será calculado no backend para a UI apresentar fontes seguras.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. Esta revisão evita misturar explicabilidade com compra automática, revisão humana ou provider novo. Também protege a sequência da MF8: `BK-MF8-06` depende de motivos e fontes controlados por este BK.

6. Validação do passo.

Executa:

```bash
rg -n "RF18|RF19|RF40|RF43|RNF23|BK-MF8-05" docs/RF.md docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md
```

7. Cenário negativo/erro esperado.

Se `BK-MF8-05` não estiver ligado a `RNF23`, pára a implementação e regista o bloqueio no relatório da equipa.

### Passo 2 - Criar o service de explicação pública

1. Objetivo funcional do passo no contexto da app.

Centralizar a conversão de motivos técnicos em explicação pública segura, com fontes legíveis e limitações.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/recommendation-reason.service.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o conteúdo de `apps/api/src/services/recommendation-reason.service.js` pelo ficheiro completo abaixo. Este service é pequeno de propósito: ele só transforma sinais já validados pelo ranking em texto público.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/recommendation-reason.service.js
/**
 * Service de explicabilidade pública para recomendações.
 *
 * O ranking calcula sinais técnicos; este ficheiro converte esses sinais em
 * texto seguro para o cliente, sem revelar imagens, prompts ou caminhos internos.
 */
import { AppError } from "../middlewares/error.middleware.js";

const REASON_TEXT = Object.freeze({
    skin_type_match: "compatível com o tipo de pele estimado",
    oiliness_support: "adequado para tendência de oleosidade",
    acne_support: "alinhado com uma rotina cosmética para pele com acne",
    spots_support: "alinhado com uma rotina cosmética para manchas",
    wrinkles_support: "alinhado com uma rotina cosmética para rugas",
});

const SOURCE_PREFIX_TEXT = Object.freeze({
    skinType: "tipo de pele estimado na análise facial",
    oleosidade: "nível de oleosidade observado na análise facial",
    acne: "sinais de acne observados na análise facial",
    manchas: "sinais de manchas observados na análise facial",
    rugas: "sinais de rugas observados na análise facial",
    report: "relatório cosmético mais recente",
    restriction: "restrições declaradas no perfil",
});

const DEFAULT_LIMITATIONS = Object.freeze([
    "A sugestão é cosmética e deve ser confirmada pelo cliente antes da compra.",
    "A recomendação não adiciona produtos automaticamente ao carrinho.",
]);

const UNSAFE_PUBLIC_TEXT = /(cura|diagn[óo]stico|garantia|resultado garantido|tratamento definitivo)/i;

/**
 * Remove valores repetidos e vazios sem mudar a ordem original.
 *
 * @function uniqueCleanStrings
 * @param {unknown[]} values - Lista recebida de outro service.
 * @returns {string[]} Lista limpa e sem duplicados.
 */
function uniqueCleanStrings(values) {
    return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value).trim()))].filter(Boolean);
}

/**
 * Valida se uma frase pública fica dentro do domínio cosmético.
 *
 * @function assertSafePublicExplanation
 * @param {string} text - Texto que será devolvido ao frontend.
 * @returns {void}
 * @throws {AppError} Quando o texto contém promessa clínica ou linguagem insegura.
 */
export function assertSafePublicExplanation(text) {
    if (UNSAFE_PUBLIC_TEXT.test(String(text ?? ""))) {
        throw new AppError(400, "Explicação de recomendação fora do domínio cosmético");
    }
}

/**
 * Converte sinais técnicos em labels públicos.
 *
 * @function buildPublicSourceLabels
 * @param {string[]} sourceSignals - Sinais internos controlados pelo backend.
 * @returns {string[]} Labels seguros para o frontend.
 */
export function buildPublicSourceLabels(sourceSignals) {
    return uniqueCleanStrings(sourceSignals)
        .map((signal) => {
            const [prefix, rawValue] = signal.split(":");
            const label = SOURCE_PREFIX_TEXT[prefix];

            if (!label || !rawValue) return null;

            // O valor técnico é aparado e limitado para não transformar fontes em fuga de dados.
            const value = rawValue.replace(/[<>]/g, "").slice(0, 60);
            return `${label}: ${value}`;
        })
        .filter(Boolean);
}

/**
 * Constrói explicação pública para uma recomendação.
 *
 * @function buildRecommendationReason
 * @param {{ reasonCodes: string[], sourceSignals: string[], product: object, profile?: object|null }} input - Dados já validados pelo ranking.
 * @returns {{ reasonCodes: string[], sourceSignals: string[], sourceLabels: string[], explanation: string, limitations: string[] }} Explicação pública.
 * @throws {AppError} Quando faltam motivos, fontes ou o texto público fica inseguro.
 */
export function buildRecommendationReason({ reasonCodes, sourceSignals, product, profile = null }) {
    const validCodes = uniqueCleanStrings(reasonCodes).filter((code) => REASON_TEXT[code]);
    const validSignals = uniqueCleanStrings(sourceSignals);
    const sourceLabels = buildPublicSourceLabels(validSignals);

    if (validCodes.length === 0 || sourceLabels.length === 0) {
        throw new AppError(400, "Recomendação sem motivo cosmético suficiente");
    }

    const productName = String(product?.name ?? "Produto recomendado").replace(/[<>]/g, "").slice(0, 80);
    const readableReasons = validCodes.map((code) => REASON_TEXT[code]);
    const explanation = `${productName} foi recomendado porque é ${readableReasons.join(" e ")}. A explicação usa apenas sinais cosméticos autorizados.`;

    assertSafePublicExplanation(explanation);

    const restrictions = uniqueCleanStrings(profile?.lightMedicalRestrictions ?? []).map(
        (restriction) => `Restrição declarada respeitada: ${restriction.slice(0, 80)}.`,
    );

    return {
        reasonCodes: validCodes,
        sourceSignals: validSignals,
        sourceLabels,
        explanation,
        limitations: [...new Set([...restrictions, ...DEFAULT_LIMITATIONS])],
    };
}
```

5. Explicação do código.

Este ficheiro faz a fronteira entre cálculo técnico e texto público. `REASON_TEXT` transforma códigos internos em frases que o cliente entende. `SOURCE_PREFIX_TEXT` permite apresentar fontes sem mostrar fotografia, prompt, storage key ou identificador interno. `assertSafePublicExplanation` impede frases com promessa clínica ou certeza excessiva.

`buildRecommendationReason` recebe apenas sinais que já vieram do ranking. Se não houver motivo ou fonte pública, lança `AppError(400)`, porque uma recomendação sem explicação não cumpre `RNF23`. A função também acrescenta limitações: a recomendação é cosmética e não compra o produto pelo cliente.

O aluno pode acrescentar novos códigos a `REASON_TEXT` quando outro BK criar um novo sinal real. Não deve aceitar texto livre vindo do frontend, porque isso permitiria inventar explicações fora do contrato da Orélle.

6. Validação do passo.

Confirma que o ficheiro exporta `buildRecommendationReason`, `buildPublicSourceLabels` e `assertSafePublicExplanation`.

7. Cenário negativo/erro esperado.

Chamar `buildRecommendationReason` com `reasonCodes: []` ou `sourceSignals: []` deve lançar `"Recomendação sem motivo cosmético suficiente"`.

### Passo 3 - Integrar a explicação no service de recomendações

1. Objetivo funcional do passo no contexto da app.

Garantir que a geração e a listagem de recomendações devolvem um DTO público explicável, com fontes e limitações.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/recommendation.service.js`
    - REVER: `apps/api/src/models/product-recommendation.model.js`
    - REVER: `apps/api/src/services/recommendation-restrictions.service.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o conteúdo de `apps/api/src/services/recommendation.service.js` pelo ficheiro completo abaixo. Mantém as rotas e controllers existentes, porque o contrato HTTP já foi criado em BKs anteriores.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/recommendation.service.js
/**
 * Service de recomendações personalizadas.
 *
 * Liga análise facial, relatório, perfil cosmético e catálogo sem expor dados
 * sensíveis no DTO público devolvido ao frontend.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";
import { Product } from "../models/product.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { Profile } from "../models/profile.model.js";
import {
    buildPublicSourceLabels,
    buildRecommendationReason,
} from "./recommendation-reason.service.js";
import { filterProductsBlockedByProfile } from "./recommendation-restrictions.service.js";

const SIGNAL_LABELS = Object.freeze(["moderado", "moderada", "alto", "alta"]);
const PRODUCT_SELECT = "name brandName description ingredientNames skinTypes imageUrl priceCents stock";

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
 * Avalia compatibilidade cosmética entre produto e análise.
 *
 * @function scoreProductForAnalysis
 * @param {object} product - Produto candidato.
 * @param {object} analysis - Análise facial concluída.
 * @returns {{ score: number, reasonCodes: string[], sourceSignals: string[] }|null} Ranking ou null.
 */
function scoreProductForAnalysis(product, analysis) {
    const reasonCodes = [];
    const sourceSignals = [];
    let score = 0;
    const findings = analysis.findings;
    const productText = [product.name, product.description, ...(product.ingredientNames ?? [])]
        .join(" ")
        .toLowerCase();
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

    return {
        score: Math.min(Number(score.toFixed(2)), 1),
        reasonCodes,
        sourceSignals,
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
 * Gera recomendações personalizadas do utilizador autenticado.
 *
 * @async
 * @function generateRecommendationsForUser
 * @param {string} userId - ID vindo da sessão autenticada.
 * @returns {Promise<object[]>} Recomendações públicas geradas.
 * @throws {AppError} Quando faltam dados mínimos ou catálogo compatível.
 */
export async function generateRecommendationsForUser(userId) {
    const { analysis, report } = await getLatestAnalysisAndReport(userId);
    const profile = await Profile.findOne({ userId });

    if (!profile) {
        throw new AppError(400, "Perfil cosmético obrigatório");
    }

    const products = await Product.find({ stock: { $gt: 0 } })
        .select(PRODUCT_SELECT)
        .limit(60);
    const allowedProducts = filterProductsBlockedByProfile(products, profile);

    const rankedProducts = allowedProducts
        .map((product) => {
            const ranking = scoreProductForAnalysis(product, analysis);
            if (!ranking) return null;

            return { product, ...ranking };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    if (rankedProducts.length < 3) {
        throw new AppError(404, "Catálogo sem produtos compatíveis suficientes");
    }

    const recommendations = await Promise.all(
        rankedProducts.map(async ({ product, score, reasonCodes, sourceSignals }) => {
            const reason = buildRecommendationReason({
                reasonCodes,
                sourceSignals: [...sourceSignals, "report:relatorio_cosmetico"],
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
                        limitations: [...new Set([...reason.limitations, ...(report.limitations ?? [])])],
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
 * @param {string} userId - ID vindo da sessão autenticada.
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
 * @param {string} userId - ID vindo da sessão autenticada.
 * @param {{ recommendationId: string, feedback: "util"|"nao_relevante" }} input - Feedback validado.
 * @returns {Promise<object>} Recomendação atualizada.
 * @throws {AppError} Quando a recomendação não pertence ao utilizador.
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

`toRecommendationDto` passa a devolver `sourceLabels`, que são fontes públicas geradas no backend. O frontend mostra estes labels, mas não recebe `sourceSignals`, fotografias, prompts, IDs de consentimento ou caminhos internos.

`scoreProductForAnalysis` continua a usar os sinais cosméticos de fases anteriores: tipo de pele, oleosidade, acne, manchas e rugas. Isto preserva o contrato de `RF18` e `RF19`.

`generateRecommendationsForUser` usa a sessão através do `userId` recebido pelo controller. O frontend não escolhe o utilizador. O service também chama `filterProductsBlockedByProfile`, já criado em `BK-MF4-08`, antes de pontuar produtos. Assim, um produto incompatível com alergias ou ingredientes a evitar não chega à recomendação.

O código não cria endpoints novos. Ele reforça os endpoints existentes com um DTO mais explicável. Isto prepara `BK-MF8-06`, que precisa de motivos e fontes para avaliar não discriminação, e prepara `BK-MF8-10`, que vai enriquecer recomendações com respostas guiadas sem duplicar o contrato de explicabilidade.

6. Validação do passo.

Confirma que `POST /api/recommendations/generate` continua a devolver `recommendations`, e que cada item tem `explanation`, `reasonCodes`, `sourceLabels` e `limitations`.

7. Cenário negativo/erro esperado.

Se o catálogo só tiver produtos bloqueados por restrições do perfil, o endpoint deve falhar com resposta controlada em vez de sugerir produto incompatível.

### Passo 4 - Atualizar a página de recomendações

1. Objetivo funcional do passo no contexto da app.

Mostrar ao cliente a explicação, as fontes públicas e as limitações da recomendação sem inventar texto no frontend.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/pages/ProductRecommendationsPage.jsx`
    - REVER: `apps/web/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o conteúdo de `apps/web/src/pages/ProductRecommendationsPage.jsx` pelo ficheiro completo abaixo. A página continua a usar os endpoints existentes.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/ProductRecommendationsPage.jsx
/**
 * Página de recomendações personalizadas.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Mostra texto fallback quando uma lista pública vem vazia.
 *
 * @function renderList
 * @param {string[]} items - Lista recebida da API.
 * @param {string} emptyText - Texto a mostrar quando não há itens.
 * @returns {import("react").JSX.Element} Lista acessível.
 */
function renderList(items = [], emptyText) {
    if (!items.length) {
        return <p>{emptyText}</p>;
    }

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
 * @param {{ onRecommendationsChange?: Function }} props - Callback para sincronizar recomendações com outras páginas.
 * @returns {import("react").JSX.Element} Página de recomendações personalizadas.
 */
export function ProductRecommendationsPage({ onRecommendationsChange = () => {} }) {
    const [recommendations, setRecommendations] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    /**
     * Pede ao backend para gerar recomendações explicáveis.
     *
     * @async
     * @function generateRecommendations
     * @returns {Promise<void>}
     */
    async function generateRecommendations() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/recommendations/generate", {
                method: "POST",
            });
            setRecommendations(data.recommendations);
            onRecommendationsChange(data.recommendations);
            setStatus(data.recommendations.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Carrega recomendações já existentes para a sessão atual.
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
            setRecommendations(data.recommendations);
            onRecommendationsChange(data.recommendations);
            setStatus(data.recommendations.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Envia feedback sobre a utilidade da recomendação.
     *
     * @async
     * @function submitFeedback
     * @param {string} recommendationId - ID da recomendação avaliada.
     * @param {"util"|"nao_relevante"} feedback - Valor aceite pelo backend.
     * @returns {Promise<void>}
     */
    async function submitFeedback(recommendationId, feedback) {
        try {
            const data = await apiRequest(`/recommendations/${recommendationId}/feedback`, {
                method: "POST",
                body: JSON.stringify({ value: feedback }),
            });
            setRecommendations((items) => {
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
            <p>
                As sugestões abaixo mostram o motivo, as fontes usadas e as limitações
                da recomendação. A decisão de compra continua a ser tua.
            </p>

            <button onClick={generateRecommendations} disabled={status === "loading"}>
                Gerar recomendações explicáveis
            </button>
            <button onClick={loadRecommendations} disabled={status === "loading"}>
                Ver recomendações existentes
            </button>

            {status === "loading" && <p>A preparar recomendações...</p>}
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Ainda não existem recomendações.</p>}

            {status === "success" && (
                <ul>
                    {recommendations.map((recommendation) => (
                        <li key={recommendation.id}>
                            <article>
                                <h2>{recommendation.product.name}</h2>
                                <p>{recommendation.explanation}</p>
                                <p>
                                    Compatibilidade estimada:{" "}
                                    {Math.round(recommendation.score * 100)}%
                                </p>

                                <h3>Fontes usadas</h3>
                                {renderList(
                                    recommendation.sourceLabels,
                                    "Sem fontes públicas disponíveis.",
                                )}

                                <h3>Limitações</h3>
                                {renderList(
                                    recommendation.limitations,
                                    "Sem limitações públicas registadas.",
                                )}

                                {recommendation.consultantNote && (
                                    <p>Nota do consultor: {recommendation.consultantNote}</p>
                                )}

                                <button
                                    onClick={() => submitFeedback(recommendation.id, "util")}
                                >
                                    Útil
                                </button>
                                <button
                                    onClick={() =>
                                        submitFeedback(recommendation.id, "nao_relevante")
                                    }
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

A página mostra o que vem do backend: `explanation`, `sourceLabels` e `limitations`. Isto é importante porque o frontend não deve inventar a razão da recomendação. Se a API não devolver fontes, a UI mostra um fallback honesto em vez de fabricar texto.

`apiRequest` já deve usar a configuração de sessão da app. Assim, a página não usa tokens no browser e não envia `userId`. O backend decide ownership através da sessão.

Os botões de feedback continuam a enviar apenas `util` ou `nao_relevante`, que já são valores validados no backend. A página não adiciona produtos ao carrinho, porque recomendação e compra são fluxos separados.

6. Validação do passo.

Executa `npm --prefix apps/web run build` e confirma que a página compila sem erro.

7. Cenário negativo/erro esperado.

Se a API devolver erro por falta de análise, relatório ou perfil, a página deve mostrar a mensagem em `role="alert"` e não deve apresentar recomendação vazia como sucesso.

### Passo 5 - Criar o teste focal de explicabilidade

1. Objetivo funcional do passo no contexto da app.

Provar `RNF23` com testes executáveis: explicação pública positiva e negativos de motivo, fonte e texto inseguro.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.recommendation-explainability.test.js`
    - REVER: `apps/api/src/services/recommendation-reason.service.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Ele é um teste unitário de contrato, por isso não abre servidor HTTP e não depende de base de dados.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.recommendation-explainability.test.js
/**
 * Testes do BK-MF8-05 para explicabilidade de recomendações.
 */
import { describe, expect, it } from "vitest";
import {
    assertSafePublicExplanation,
    buildPublicSourceLabels,
    buildRecommendationReason,
} from "../src/services/recommendation-reason.service.js";

const product = {
    _id: "66c000000000000000000001",
    name: "Gel controlo oleosidade",
    storageKey: "/private/not-public.png",
    consentId: "66c000000000000000000099",
};

describe("BK-MF8-05 - explicabilidade de recomendações", () => {
    it("gera explicação pública com motivos, fontes e limitações", () => {
        const reason = buildRecommendationReason({
            product,
            reasonCodes: ["skin_type_match", "oiliness_support", "skin_type_match"],
            sourceSignals: ["skinType:mista", "oleosidade:moderada", "report:relatorio_cosmetico"],
            profile: { lightMedicalRestrictions: ["evitar ácidos fortes"] },
        });

        expect(reason.reasonCodes).toEqual(["skin_type_match", "oiliness_support"]);
        expect(reason.sourceLabels).toContain("tipo de pele estimado na análise facial: mista");
        expect(reason.explanation).toContain("Gel controlo oleosidade");
        expect(reason.limitations.join(" ")).toContain("Restrição declarada respeitada");
        expect(JSON.stringify(reason)).not.toContain("storageKey");
        expect(JSON.stringify(reason)).not.toContain("consentId");
    });

    it("recusa recomendação sem motivo ou sem fonte pública", () => {
        expect(() =>
            buildRecommendationReason({
                product,
                reasonCodes: [],
                sourceSignals: ["skinType:mista"],
            }),
        ).toThrow("Recomendação sem motivo cosmético suficiente");

        expect(() =>
            buildRecommendationReason({
                product,
                reasonCodes: ["skin_type_match"],
                sourceSignals: ["fontePrivada:/storage/photo.png"],
            }),
        ).toThrow("Recomendação sem motivo cosmético suficiente");
    });

    it("não transforma sinais desconhecidos em fontes públicas", () => {
        const labels = buildPublicSourceLabels([
            "skinType:mista",
            "prompt:segredo-interno",
            "storageKey:/private/photo.png",
        ]);

        expect(labels).toEqual(["tipo de pele estimado na análise facial: mista"]);
    });

    it("bloqueia texto público com promessa clínica ou certeza excessiva", () => {
        expect(() =>
            assertSafePublicExplanation("Este produto garante cura definitiva."),
        ).toThrow("Explicação de recomendação fora do domínio cosmético");
    });
});
```

5. Explicação do código.

O primeiro teste prova o caminho positivo: uma recomendação com motivos e fontes conhecidas gera explicação, fontes públicas e limitações. Também confirma que campos sensíveis do produto de teste não passam para o resultado.

O segundo teste prova que `RNF23` não aceita recomendação sem motivo ou sem fonte pública. Isto evita recomendações opacas.

O terceiro teste garante que uma fonte desconhecida, como prompt ou storage key, não vira texto público. O quarto teste bloqueia frases que parecem promessa clínica.

Este teste não substitui a suite de integração, mas fecha o contrato central do BK de forma rápida e isolada.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- mf8.recommendation-explainability.test.js
```

7. Cenário negativo/erro esperado.

Se removeres a validação de fonte pública, o teste `"não transforma sinais desconhecidos em fontes públicas"` deve falhar.

### Passo 6 - Executar validação técnica e pesquisa estática

1. Objetivo funcional do passo no contexto da app.

Confirmar que o guia fecha `RNF23` sem introduzir drift, paths privados ou linguagem proibida.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - REVER: `scripts/validate-planificacao.sh`
    - LOCALIZAÇÃO: comandos executados na raiz do repo.

3. Instruções do que fazer.

Executa os comandos abaixo a partir da raiz do repositório.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix apps/api test -- mf8.recommendation-explainability.test.js
npm --prefix apps/api test
npm --prefix apps/web run build
rg -n "real[_]dev|REAL[_]DEV" docs/planificacao/guias-bk/MF8/BK-MF*.md
bash scripts/validate-planificacao.sh
git diff --check
```

5. Explicação do código.

Os comandos validam camadas diferentes. O teste focal prova a explicabilidade. A suite API confirma que a alteração não partiu contratos anteriores. O build web confirma que a página React compila. A pesquisa por raiz privada garante que o BK de aluno não aponta para a referência interna. O validador de planificação confirma matriz, backlog, guias e links. O `git diff --check` evita fechar o BK com problemas de whitespace.

6. Validação do passo.

Regista no PR/defesa o comando, diretoria, exit code e resultado observado.

7. Cenário negativo/erro esperado.

Se `npm --prefix apps/api test` falhar por `listen EPERM` no ambiente de execução, repete fora da sandbox ou regista o bloqueio de ambiente sem marcar a suite como validada.

### Passo 7 - Fechar evidence e handoff

1. Objetivo funcional do passo no contexto da app.

Fechar a entrega com evidence suficiente e preparar `BK-MF8-06`.

2. Ficheiros envolvidos:
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-06-o-sistema-deve-garantir-nao-discriminacao-por-genero-idade-ou-tom-de-pele.md`
    - CRIAR/ATUALIZAR: evidence técnica do PR/defesa
    - LOCALIZAÇÃO: secção de evidence da equipa.

3. Instruções do que fazer.

Regista:

- resultado do teste focal `mf8.recommendation-explainability`;
- prova de que a resposta pública tem `explanation`, `sourceLabels` e `limitations`;
- prova de que não há paths da raiz privada nos BKs de aluno;
- nota de que `BK-MF8-06` deve usar `reasonCodes` e `sourceLabels` para avaliar fairness.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. A evidence transforma a alteração técnica numa defesa clara: mostra o que mudou, o que foi testado, que riscos foram controlados e que contrato fica disponível para o próximo BK.

6. Validação do passo.

A evidence deve indicar pelo menos um positivo e três negativos:

- recomendação explicável com motivos e fontes;
- recusa de recomendação sem motivo;
- recusa de fonte pública desconhecida;
- bloqueio de texto com promessa clínica ou certeza excessiva.

7. Cenário negativo/erro esperado.

Se o `BK-MF8-06` não conseguir identificar fontes e motivos públicos, volta a este BK antes de implementar fairness.

#### Expected results

- `apps/api/src/services/recommendation-reason.service.js` constrói explicação pública com `reasonCodes`, `sourceLabels`, `explanation` e `limitations`.
- `apps/api/src/services/recommendation.service.js` persiste motivos e fontes técnicas, mas devolve apenas DTO público seguro.
- `apps/web/src/pages/ProductRecommendationsPage.jsx` apresenta motivos, fontes e limitações sem inventar explicação no frontend.
- `apps/api/tests/mf8.recommendation-explainability.test.js` prova positivo e negativos de `RNF23`.
- Executar cenarios negativos obrigatorios (minimo 3) com resultado controlado.
- A recomendação não devolve fotografias, storage keys, consent IDs, prompts, tokens, cookies ou paths internos.
- O produto recomendado não é adicionado ao carrinho sem ação do cliente.

#### Critérios de aceite

- `RNF23` fica implementado no guia com código completo e teste focal.
- Cada recomendação pública tem `explanation`, `reasonCodes`, `sourceLabels` e `limitations`.
- Recomendação sem motivo ou sem fonte pública é recusada.
- Produto incompatível com restrições do perfil não entra no ranking.
- Texto com promessa clínica ou certeza excessiva é bloqueado.
- Frontend mostra estados `loading`, `error`, `empty` e `success`.
- A sessão continua a ser tratada pelo backend e pelo `apiClient`; a UI não envia `userId`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).

### Matriz minima de testes por prioridade

- Testes por prioridade respeitados: `P0` exige unit + integration + e2e + 3 negativos; `P1` exige unit/integration + 2 negativos; `P2` exige teste focal + 1 negativo.
- Evidence pronta para revisão técnica e defesa PAP.

#### Validação final

- [ ] `npm --prefix apps/api test -- mf8.recommendation-explainability.test.js`
- [ ] `npm --prefix apps/api test`
- [ ] `npm --prefix apps/web run build`
- [ ] `rg -n "real[_]dev|REAL[_]DEV" docs/planificacao/guias-bk/MF8/BK-MF*.md` sem ocorrências.
- [ ] `bash scripts/validate-planificacao.sh`
- [ ] `git diff --check`
- [ ] Executar cenarios negativos obrigatorios (minimo 3) com resultado controlado.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Resposta pública sem fotografias, storage keys, consent IDs, prompts, tokens, cookies ou paths internos.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite`, `## Evidence para PR/defesa`.

#### Evidence para PR/defesa

- `pr`: referência do commit/PR e resumo técnico da alteração.
- `proof_tecnico`: exemplo de recomendação com `explanation`, `sourceLabels` e `limitations`.
- `proof_testes`: output do teste `mf8.recommendation-explainability`.
- `proof_negativos`: sem motivo, fonte desconhecida e texto com promessa clínica.
- `proof_privacidade`: confirmação de ausência de fotografias, storage keys, consent IDs, prompts, tokens, cookies e paths internos.
- `proof_handoff`: nota a explicar como `BK-MF8-06` usa `reasonCodes` e `sourceLabels` para validar não discriminação.

#### Handoff

- Próximo BK recomendado: `BK-MF8-06`.
- O `BK-MF8-06` deve consumir `reasonCodes` e `sourceLabels` para verificar se os motivos usados pela recomendação não discriminam género, idade ou tom de pele.
- O `BK-MF8-10` deve reutilizar `buildRecommendationReason` quando enriquecer recomendações com respostas guiadas, em vez de criar outro contrato de explicação.
- Risco a vigiar: qualquer novo sinal de recomendação precisa de código de motivo e fonte pública antes de aparecer ao cliente.

#### Changelog

- `2026-07-01`: guia corrigido em modo `corrigir_apenas`, fechando a lacuna de `RNF23` com service de explicabilidade, integração no service de recomendações, página React, teste focal, negativos e handoff para `BK-MF8-06`.
