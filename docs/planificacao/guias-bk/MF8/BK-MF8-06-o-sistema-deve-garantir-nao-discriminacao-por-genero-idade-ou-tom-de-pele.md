# BK-MF8-06 - O sistema deve garantir não discriminação por género, idade ou tom de pele

## Header
- `doc_id`: `GUIA-BK-MF8-06`
- `bk_id`: `BK-MF8-06`
- `macro`: `MF8`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF8-05`
- `rf_rnf`: `RNF24`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-07`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-06-o-sistema-deve-garantir-nao-discriminacao-por-genero-idade-ou-tom-de-pele.md`
- `last_updated`: `2026-07-02`

#### Objetivo

Neste BK vais implementar um guard de fairness para garantir que as recomendações públicas da Orélle não usam género, idade ou tom de pele como motivo de ranking, bloqueio, texto ofensivo ou justificação discriminatória.

#### Importância

A Orélle trabalha com perfil cosmético, análise facial e recomendações personalizadas. Isto dá valor ao cliente, mas também aumenta a responsabilidade ética: uma recomendação pode explicar tipo de pele, oleosidade, acne, manchas ou rugas, mas não pode dizer que uma pessoa deve ou não deve usar um produto por ser mulher, homem, jovem, mais velha, ter determinado tom de pele ou pertencer a um grupo sensível.

Este BK fecha `RNF24` e depende diretamente do `BK-MF8-05`: primeiro a app passou a explicar recomendações; agora essa explicação precisa de um gate ético antes de chegar ao cliente.

#### Scope-in

- Criar um service isolado para validar fairness em recomendações.
- Bloquear motivos técnicos baseados em atributos sensíveis.
- Bloquear fontes de ranking que usem género, idade ou tom de pele.
- Bloquear linguagem pública discriminatória ou fora do domínio cosmético.
- Integrar o guard no service real de recomendações antes de persistir e devolver DTOs.
- Criar teste Vitest com positivo e negativos materiais para `RNF24`.
- Manter a recomendação separada de carrinho, checkout, pagamento e decisão clínica.

#### Scope-out

- Não criar modelo estatístico avançado de fairness.
- Não criar novo endpoint de recomendação.
- Não alterar o provider externo de IA criado em MF7.
- Não alterar upload, consentimento ou armazenamento de imagens.
- Não implementar revisão humana de consultores; isso pertence a BKs posteriores.
- Não usar género, idade ou tom de pele para limitar acesso a produtos.
- Não adicionar produtos automaticamente ao carrinho.

#### Estado antes e depois

- Antes: `BK-MF8-05` já deixa recomendações com motivos, fontes públicas e limitações, mas ainda não existe um guard dedicado a `RNF24`.
- Depois: cada recomendação passa por uma validação de fairness antes de ser persistida ou devolvida ao frontend, e o aluno tem teste executável para provar positivo e negativos.

#### Pre-requisitos

- `BK-MF2-02`: cria recomendações personalizadas a partir de análise e histórico.
- `BK-MF2-03`: introduz motivos de recomendação.
- `BK-MF4-08`: bloqueia produtos incompatíveis com alergias, ingredientes a evitar e restrições médicas leves.
- `BK-MF7-07`: isola provider de IA e limita respostas externas.
- `BK-MF8-05`: cria explicabilidade com `reasonCodes`, `sourceSignals`, `sourceLabels`, `explanation` e `limitations`.
- `RNF24`: exige não discriminação por género, idade ou tom de pele.

#### Glossário

- Fairness: conjunto de regras que reduz tratamento desigual injustificado.
- Atributo sensível: dado pessoal que exige proteção especial no raciocínio da app, como género, idade ou tom de pele.
- Motivo cosmético: sinal permitido, como tipo de pele, oleosidade, acne, manchas, rugas, relatório cosmético ou restrição declarada.
- Fonte técnica: valor interno usado pelo backend para justificar uma recomendação, como `skinType:mista`.
- Texto público: frase que a API devolve ao frontend e que o cliente pode ler.
- Guard ético: validação que bloqueia output inseguro antes de chegar ao utilizador.
- DTO público: objeto devolvido pela API com apenas campos seguros para interface.

#### Conceitos teóricos essenciais

A não discriminação não significa ignorar necessidades cosméticas reais. A app pode usar tipo de pele, oleosidade, acne, manchas, rugas, histórico de análise e restrições declaradas, porque estes sinais pertencem ao domínio da recomendação cosmética. O que a app não pode fazer é transformar género, idade ou tom de pele em razão para recomendar, excluir, inferiorizar ou limitar uma pessoa.

No backend, fairness deve estar perto da lógica que constrói a recomendação. Se a validação ficar apenas no frontend, uma rota, teste ou integração futura pode devolver texto inseguro sem passar pela interface. Por isso, este BK cria `ai-fairness-guard.service.js` e chama esse guard em `recommendation.service.js`.

`reasonCodes` e `sourceSignals` vêm do `BK-MF8-05`. O guard usa esses campos para confirmar que a explicação pública nasceu de sinais cosméticos permitidos. O frontend continua a mostrar dados prontos, mas não decide se uma recomendação é justa.

A idade pode existir no perfil porque `RF03` define perfil cosmético com idade e género. Isso não autoriza usar a idade como ranking discriminatório. Se no futuro houver uma regra de segurança por idade, ela precisa de contrato documental próprio; neste BK a idade é tratada como atributo sensível que não deve aparecer como motivo de recomendação.

Em testes, `RNF24` precisa de pelo menos um caminho positivo e três negativos: recomendação com sinais cosméticos permitidos, bloqueio de fonte sensível, bloqueio de motivo sensível e bloqueio de linguagem discriminatória. Estes testes são pequenos, mas protegem a fronteira ética da app.

#### Arquitetura do BK

- `bk_id`: `BK-MF8-06`
- `flow_id`: `FLOW-MF8-FAIRNESS`
- `requisitos`: `RNF24`, com apoio de `RF18`, `RF19`, `RF40`, `RF43` e `RNF23`
- `dependências`: `BK-MF8-05`
- `tema técnico`: fairness guard para recomendações explicáveis
- `destino dos alunos`: `apps/api` e `apps/web`
- `endpoints existentes`: `POST /api/recommendations/generate`, `GET /api/recommendations`, `POST /api/recommendations/:recommendationId/feedback`
- `service novo`: `ai-fairness-guard.service.js`
- `service editado`: `recommendation.service.js`
- `teste novo`: `mf8.fairness-guard.test.js`
- `decisão CANONICO`: `RNF24` exige não discriminação por género, idade ou tom de pele.
- `decisão CANONICO`: `RF18`, `RF19`, `RF40` e `RF43` mantêm recomendação personalizada, motivo, restrições e produtos reais com stock.
- `decisão DERIVADO`: `ai-fairness-guard.service.js` isola a validação ética sem introduzir dependências novas.
- `decisão DERIVADO`: `fairnessStatus` no DTO público confirma que a recomendação passou pelo guard, sem expor dados sensíveis.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/src/services/ai-fairness-guard.service.js`
- EDITAR: `apps/api/src/services/recommendation.service.js`
- CRIAR: `apps/api/tests/mf8.fairness-guard.test.js`
- REVER: `apps/api/src/services/recommendation-reason.service.js`
- REVER: `apps/api/src/models/product-recommendation.model.js`
- REVER: `apps/api/src/controllers/recommendation.controller.js`
- REVER: `apps/api/src/routes/recommendation.routes.js`
- REVER: `apps/web/src/pages/ProductRecommendationsPage.jsx`

#### Tutorial técnico linear

### Passo 1 - Confirmar o contrato ético do BK

1. Objetivo funcional do passo no contexto da app.

Confirmar que `BK-MF8-06` fecha apenas `RNF24` e encaixa na sequência `BK-MF8-05 -> BK-MF8-06 -> BK-MF8-07`.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
    - LOCALIZAÇÃO: linhas de `RNF24`, `RF18`, `RF19`, `RF40`, `RF43` e `BK-MF8-06`.

3. Instruções do que fazer.

Lê os documentos e confirma estes pontos no teu apontamento de trabalho:

- `CANONICO`: `RNF24` exige não discriminação por género, idade ou tom de pele.
- `CANONICO`: `BK-MF8-06` depende de `BK-MF8-05`.
- `CANONICO`: recomendações continuam ligadas a análise, histórico, motivos e restrições, não a compra automática.
- `DERIVADO`: o guard de fairness será implementado como service de backend para ser reutilizável.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. Esta confirmação evita misturar fairness com revisão humana, treino de modelo, checkout ou privacidade de imagens. O BK fica focado numa fronteira: validar recomendação e texto público antes de chegar ao cliente.

6. Validação do passo.

Executa:

```bash
rg -n "RNF24|BK-MF8-06|RF18|RF19|RF40|RF43" docs/RNF.md docs/RF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md
```

7. Cenário negativo/erro esperado.

Se `BK-MF8-06` não estiver ligado a `RNF24`, pára a correção e regista `TODO (BLOCKER)` no relatório da equipa.

### Passo 2 - Mapear os contratos que vêm do BK-MF8-05

1. Objetivo funcional do passo no contexto da app.

Identificar que campos a validação de fairness deve consumir sem duplicar a lógica de explicabilidade criada no BK anterior.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/services/recommendation-reason.service.js`
    - REVER: `apps/api/src/services/recommendation.service.js`
    - REVER: `apps/api/src/models/product-recommendation.model.js`
    - LOCALIZAÇÃO: exports de explicabilidade, DTO público e campos `reasonCodes`, `sourceSignals`, `explanation`, `limitations`.

3. Instruções do que fazer.

Confirma que o fluxo de recomendação já tem:

- `reasonCodes`: motivos técnicos controlados pelo backend.
- `sourceSignals`: fontes técnicas internas controladas pelo backend.
- `sourceLabels`: fontes públicas seguras calculadas a partir de `sourceSignals`.
- `explanation`: texto público apresentado ao cliente.
- `limitations`: limites cosméticos e de decisão do cliente.

O guard deste BK deve usar estes campos. Não cries outro modelo de recomendação nem outro endpoint.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. O mapeamento impede duplicar explicabilidade: `BK-MF8-05` explica a recomendação; `BK-MF8-06` valida se essa explicação não usa atributos sensíveis de forma injustificada.

6. Validação do passo.

Executa:

```bash
rg -n "reasonCodes|sourceSignals|sourceLabels|buildRecommendationReason|ProductRecommendation" apps/api/src/services apps/api/src/models docs/planificacao/guias-bk/MF8/BK-MF8-05-a-ia-deve-indicar-como-chegou-as-recomendacoes-explicabilidade.md
```

7. Cenário negativo/erro esperado.

Se não encontrares `reasonCodes` ou `sourceSignals`, volta ao `BK-MF8-05` antes de avançar, porque fairness precisa de motivos e fontes controlados.

### Passo 3 - Criar o guard de fairness

1. Objetivo funcional do passo no contexto da app.

Criar uma camada pequena e testável que bloqueia motivos, fontes e textos discriminatórios antes de a recomendação ser persistida ou devolvida ao frontend.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/services/ai-fairness-guard.service.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria `apps/api/src/services/ai-fairness-guard.service.js` com o conteúdo completo abaixo. Este service não chama base de dados, não chama IA externa e não cria dependências novas. Ele recebe um objeto de recomendação já montado pelo backend e valida três dimensões: motivos, fontes e texto público.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/ai-fairness-guard.service.js
/**
 * Guard ético de recomendações para RNF24.
 *
 * Este service impede que género, idade ou tom de pele sejam usados como
 * motivo técnico, fonte de ranking ou linguagem pública discriminatória.
 */
import { AppError } from "../middlewares/error.middleware.js";

// Esta lista é pequena e fechada porque só representa os atributos protegidos por RNF24.
const PROTECTED_ATTRIBUTES = Object.freeze(["genero", "idade", "tom_de_pele"]);

// Estes códigos parecem motivos técnicos, mas usam atributos pessoais em vez de sinais cosméticos.
const SENSITIVE_REASON_CODES = Object.freeze([
    "gender_match",
    "genero_match",
    "age_match",
    "idade_match",
    "skin_tone_match",
    "tom_pele_match",
]);

// O prefixo bloqueia fontes como "idade:45" sem impedir sinais cosméticos como "skinType:mista".
const SENSITIVE_SOURCE_PREFIXES = Object.freeze([
    "gender",
    "genero",
    "age",
    "idade",
    "skinTone",
    "skin_tone",
    "tomPele",
    "tom_pele",
    "tomDePele",
]);

// Os padrões procuram frases de exclusão ou inferiorização, não descrições cosméticas permitidas.
const DISCRIMINATORY_TEXT_PATTERNS = Object.freeze([
    {
        pattern: /\b(mulheres|homens|raparigas|rapazes).{0,32}(nao devem|nao podem|sao incapazes|sao inadequad)/u,
        message: "Texto público discrimina por género",
    },
    {
        pattern: /\b(idosos|idosas|jovens|idade).{0,32}(nao devem|nao podem|incapaz|inadequad|pior)/u,
        message: "Texto público discrimina por idade",
    },
    {
        pattern: /\b(pele escura|pele clara|tom de pele).{0,36}(inferior|superior|inadequad|nao deve|nao pode)/u,
        message: "Texto público discrimina por tom de pele",
    },
]);

/**
 * Normaliza texto para comparação de políticas sem depender de acentos.
 *
 * @function normalizePolicyText
 * @param {unknown} value - Valor textual recebido pelo guard.
 * @returns {string} Texto normalizado para pesquisa interna.
 */
function normalizePolicyText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

/**
 * Converte uma lista desconhecida numa lista de strings limpas.
 *
 * @function toCleanStringList
 * @param {unknown} value - Valor que deve representar uma lista.
 * @returns {string[]} Lista segura para validações.
 */
function toCleanStringList(value) {
    return (Array.isArray(value) ? value : [])
        .map((item) => String(item ?? "").trim())
        .filter(Boolean);
}

/**
 * Encontra fontes técnicas que usam atributos sensíveis.
 *
 * @function findSensitiveSourceSignals
 * @param {string[]} sourceSignals - Fontes técnicas da recomendação.
 * @returns {string[]} Fontes bloqueadas por RNF24.
 */
function findSensitiveSourceSignals(sourceSignals) {
    const sensitivePrefixes = new Set(SENSITIVE_SOURCE_PREFIXES.map(normalizePolicyText));

    return toCleanStringList(sourceSignals).filter((signal) => {
        const [prefix] = signal.split(":");
        return sensitivePrefixes.has(normalizePolicyText(prefix));
    });
}

/**
 * Valida texto público contra padrões discriminatórios.
 *
 * @function assertRespectfulPublicText
 * @param {string} text - Texto devolvido ao frontend.
 * @returns {void}
 * @throws {AppError} Quando o texto discrimina por atributo sensível.
 */
export function assertRespectfulPublicText(text) {
    const normalizedText = normalizePolicyText(text);
    const match = DISCRIMINATORY_TEXT_PATTERNS.find(({ pattern }) =>
        pattern.test(normalizedText),
    );

    if (match) {
        throw new AppError(400, match.message);
    }
}

/**
 * Valida uma recomendação explicável contra RNF24.
 *
 * @function assertRecommendationFairness
 * @param {{ reasonCodes?: string[], sourceSignals?: string[], explanation?: string, limitations?: string[], profile?: object|null }} recommendation - Dados da recomendação antes do DTO público.
 * @returns {{ status: "checked", protectedAttributes: string[] }} Resultado público mínimo.
 * @throws {AppError} Quando a recomendação usa atributo sensível como motivo, fonte ou texto discriminatório.
 */
export function assertRecommendationFairness(recommendation) {
    const reasonCodes = toCleanStringList(recommendation?.reasonCodes);
    const sourceSignals = toCleanStringList(recommendation?.sourceSignals);
    const limitations = toCleanStringList(recommendation?.limitations);
    // Normalizamos a política e os dados recebidos para evitar bypass por acentos, espaços ou capitalização.
    const sensitiveReasonCodes = new Set(SENSITIVE_REASON_CODES.map(normalizePolicyText));
    const invalidReasonCodes = reasonCodes.filter((code) =>
        sensitiveReasonCodes.has(normalizePolicyText(code)),
    );
    const invalidSourceSignals = findSensitiveSourceSignals(sourceSignals);

    if (reasonCodes.length === 0 || sourceSignals.length === 0) {
        // Sem motivos e fontes não existe evidence suficiente para provar que a recomendação é cosmética.
        throw new AppError(400, "Fairness exige motivos e fontes cosméticas verificáveis");
    }

    if (invalidReasonCodes.length > 0) {
        throw new AppError(400, "Recomendação usa atributo sensível como motivo");
    }

    if (invalidSourceSignals.length > 0) {
        throw new AppError(400, "Recomendação usa atributo sensível como fonte");
    }

    // A explicação e as limitações são validadas juntas porque ambas são texto público.
    [recommendation?.explanation, ...limitations].forEach(assertRespectfulPublicText);

    return {
        status: "checked",
        protectedAttributes: [...PROTECTED_ATTRIBUTES],
    };
}
```

5. Explicação do código.

`PROTECTED_ATTRIBUTES` guarda os atributos que este BK protege. Ele aparece no resultado público para deixar claro que o guard foi executado, mas não mostra valores do perfil.

`SENSITIVE_REASON_CODES` bloqueia motivos técnicos proibidos, como `age_match` ou `gender_match`. Isto evita que uma recomendação seja justificada por uma característica pessoal em vez de um sinal cosmético.

`SENSITIVE_SOURCE_PREFIXES` bloqueia fontes técnicas como `genero:feminino`, `idade:45` ou `tomPele:claro`. Estes campos podem existir no perfil ou na app, mas não devem ser a fonte de ranking de produto neste BK.

`assertRespectfulPublicText` valida a frase pública. A normalização remove acentos só para comparação interna. O texto original continua a ser escrito em português correto.

`assertRecommendationFairness` é o ponto de entrada principal. Ele valida listas, bloqueia motivo sensível, bloqueia fonte sensível e percorre explicação e limitações. Se passar, devolve apenas `status: "checked"` e a lista de atributos protegidos. Não guarda género, idade nem tom de pele.

6. Validação do passo.

Confirma que o ficheiro exporta `assertRespectfulPublicText` e `assertRecommendationFairness`.

7. Cenário negativo/erro esperado.

Chamar `assertRecommendationFairness` com `sourceSignals: ["genero:feminino"]` deve lançar `"Recomendação usa atributo sensível como fonte"`.

### Passo 4 - Integrar o guard no service de recomendações

1. Objetivo funcional do passo no contexto da app.

Garantir que uma recomendação só é persistida e devolvida se passar pela explicabilidade de `BK-MF8-05` e pela validação ética deste BK.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/recommendation.service.js`
    - REVER: `apps/api/src/services/recommendation-reason.service.js`
    - REVER: `apps/api/src/models/product-recommendation.model.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o conteúdo de `apps/api/src/services/recommendation.service.js` pelo ficheiro completo abaixo. Mantém os endpoints existentes: o controller continua a responder `201` em `POST /api/recommendations/generate` e `200` em `GET /api/recommendations`.

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
import { assertRecommendationFairness } from "./ai-fairness-guard.service.js";
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
    // Também validamos dados já persistidos para evitar devolver recomendações antigas que violem RNF24.
    const fairness = assertRecommendationFairness({
        reasonCodes: recommendation.reasonCodes,
        sourceSignals: recommendation.sourceSignals,
        explanation: recommendation.explanation,
        limitations: recommendation.limitations,
    });

    return {
        id: recommendation._id.toString(),
        product: toProductSnapshot(recommendation.productId),
        score: recommendation.score,
        reasonCodes: recommendation.reasonCodes,
        explanation: recommendation.explanation,
        sourceLabels: buildPublicSourceLabels(recommendation.sourceSignals),
        limitations: recommendation.limitations,
        fairnessStatus: fairness.status,
        protectedAttributesChecked: fairness.protectedAttributes,
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
    // O ranking combina apenas texto do produto e sinais da análise cosmética, sem género, idade ou tom de pele.
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
    // O perfil pertence ao utilizador autenticado e traz restrições cosméticas usadas antes do ranking final.
    const profile = await Profile.findOne({ userId });

    if (!profile) {
        throw new AppError(400, "Perfil cosmético obrigatório");
    }

    const products = await Product.find({ stock: { $gt: 0 } })
        .select(PRODUCT_SELECT)
        .limit(60);
    // As restrições de alergias e ingredientes bloqueiam produtos antes de qualquer pontuação.
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
            // O guard corre antes da persistência para impedir que uma recomendação injusta entre na base de dados.
            assertRecommendationFairness({
                reasonCodes: reason.reasonCodes,
                sourceSignals: reason.sourceSignals,
                explanation: reason.explanation,
                limitations: [...new Set([...reason.limitations, ...(report.limitations ?? [])])],
                profile,
            });

            return ProductRecommendation.findOneAndUpdate(
                {
                    // A chave composta evita duplicar recomendações para o mesmo produto e análise do utilizador.
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

    // O resultado público volta a passar pelo guard para proteger dados antigos persistidos.
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
    // A listagem usa sempre o userId da sessão, preservando ownership no backend.
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

O import de `assertRecommendationFairness` liga o novo service a um fluxo real. Não há endpoint novo: os controllers existentes continuam a chamar `generateRecommendationsForUser`, `listRecommendationsForUser` e `submitRecommendationFeedback`.

`toRecommendationDto` valida recomendações já persistidas antes de as devolver. Isto protege o cliente se uma recomendação antiga ou criada por outro teste tiver fonte sensível. O DTO devolve `fairnessStatus` e `protectedAttributesChecked`, mas não devolve valores de género, idade ou tom de pele.

`scoreProductForAnalysis` continua a usar apenas sinais cosméticos: tipo de pele, oleosidade, acne, manchas e rugas. Estes sinais vêm da análise facial e do domínio da Orélle. O código não pontua por género, idade ou tom de pele.

`generateRecommendationsForUser` primeiro filtra produtos incompatíveis com `RF40`, depois cria a explicação de `BK-MF8-05` e só depois chama o guard de fairness. A ordem é importante: não faz sentido validar fairness numa recomendação sem motivo, fonte ou limitação.

A chamada a `assertRecommendationFairness` acontece antes de persistir. Mesmo que neste ficheiro o resultado não seja guardado como campo no modelo, a chamada é importante porque lança erro se houver violação. O comentário antes do `return` final explica a segunda validação no DTO, que evita devolver dados antigos inseguros.

6. Validação do passo.

Executa:

```bash
rg -n "assertRecommendationFairness|fairnessStatus|sourceLabels|sourceSignals" apps/api/src/services/recommendation.service.js apps/api/src/services/ai-fairness-guard.service.js
```

7. Cenário negativo/erro esperado.

Se `sourceSignals` incluir `idade:45`, a geração de recomendação deve falhar com erro controlado antes de devolver resposta pública.

### Passo 5 - Criar teste focal de RNF24

1. Objetivo funcional do passo no contexto da app.

Provar que o guard aceita recomendação com sinais cosméticos e bloqueia três violações materiais de fairness.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.fairness-guard.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Estes testes são unitários para não dependerem de servidor HTTP, provider externo ou base de dados. O objetivo é fechar o contrato ético do service com rapidez e previsibilidade.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.fairness-guard.test.js
/**
 * Testes de RNF24 para o guard de fairness de recomendações.
 */
import { describe, expect, it } from "vitest";
import {
    assertRecommendationFairness,
    assertRespectfulPublicText,
} from "../src/services/ai-fairness-guard.service.js";

/**
 * Cria uma recomendação segura suficiente para testar RNF24.
 *
 * @function makeSafeRecommendation
 * @param {object} [overrides={}] - Campos a substituir no cenário base.
 * @returns {object} Recomendação de teste.
 */
function makeSafeRecommendation(overrides = {}) {
    // A fixture segura usa apenas sinais cosméticos permitidos para servir de base aos negativos.
    return {
        reasonCodes: ["skin_type_match", "oiliness_support"],
        sourceSignals: ["skinType:mista", "oleosidade:moderada", "report:relatorio_cosmetico"],
        explanation:
            "Gel controlo oleosidade foi recomendado porque é compatível com sinais cosméticos autorizados.",
        limitations: [
            "A sugestão é cosmética e deve ser confirmada pelo cliente antes da compra.",
        ],
        ...overrides,
    };
}

describe("BK-MF8-06 - fairness guard RNF24", () => {
    it("aceita recomendação baseada apenas em sinais cosméticos", () => {
        const result = assertRecommendationFairness(makeSafeRecommendation());

        // O resultado não devolve valores sensíveis; devolve só a confirmação de que o guard correu.
        expect(result).toEqual({
            status: "checked",
            protectedAttributes: ["genero", "idade", "tom_de_pele"],
        });
    });

    it("bloqueia fonte sensível usada como origem da recomendação", () => {
        // Cada negativo altera uma dimensão de cada vez para mostrar exatamente que regra falhou.
        expect(() =>
            assertRecommendationFairness(
                makeSafeRecommendation({
                    sourceSignals: ["skinType:mista", "genero:feminino"],
                }),
            ),
        ).toThrow("Recomendação usa atributo sensível como fonte");
    });

    it("bloqueia motivo técnico baseado em atributo sensível", () => {
        expect(() =>
            assertRecommendationFairness(
                makeSafeRecommendation({
                    reasonCodes: ["skin_type_match", "age_match"],
                }),
            ),
        ).toThrow("Recomendação usa atributo sensível como motivo");
    });

    it("bloqueia texto público discriminatório", () => {
        expect(() =>
            assertRespectfulPublicText(
                "Mulheres não devem usar este produto por serem inadequadas para esta rotina.",
            ),
        ).toThrow("Texto público discrimina por género");
    });
});
```

5. Explicação do código.

O teste positivo prova que sinais cosméticos permitidos passam: tipo de pele, oleosidade e relatório cosmético. Isto é importante porque fairness não deve bloquear a personalização legítima da Orélle.

O primeiro negativo usa `genero:feminino` em `sourceSignals`. Esse valor pode existir no perfil, mas não deve ser fonte da recomendação de produto.

O segundo negativo usa `age_match` como motivo técnico. Isto simula um erro comum: transformar idade em critério de recomendação sem contrato documental.

O terceiro negativo valida texto público. Mesmo que os motivos técnicos estejam corretos, a frase apresentada ao cliente também precisa de respeito e limite ético.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- mf8.fairness-guard.test.js
```

7. Cenário negativo/erro esperado.

Se trocares `genero:feminino` por `skinType:mista`, o primeiro negativo deixa de falhar porque tipo de pele é sinal cosmético permitido.

### Passo 6 - Validar a MF8 contra linguagem proibida e caminhos privados

1. Objetivo funcional do passo no contexto da app.

Confirmar que o BK não introduz domínio de outra PAP, linguagem interna, caminhos privados ou padrões inseguros.

2. Ficheiros envolvidos:
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-06-o-sistema-deve-garantir-nao-discriminacao-por-genero-idade-ou-tom-de-pele.md`
    - REVER: `docs/planificacao/guias-bk/MF8/*.md`
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - LOCALIZAÇÃO: pesquisas estáticas e scripts reais.

3. Instruções do que fazer.

Executa as pesquisas combinadas definidas pela equipa e os comandos finais. Se uma ocorrência for falso positivo, regista a justificação no relatório da equipa. Evita escrever no guia os termos proibidos que estão a ser pesquisados; esses padrões pertencem ao relatório técnico e às ferramentas de validação.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix apps/api test -- mf8.fairness-guard.test.js
npm --prefix apps/api test
npm --prefix apps/web run build
git diff --check
bash scripts/validate-planificacao.sh
```

5. Explicação do código.

Estes comandos são de validação, não de implementação. As pesquisas combinadas da equipa procuram linguagem proibida, drift de domínio e caminhos privados sem escrever esses termos no guia de aluno. O teste focal valida o service novo. A suite da API confirma que o fluxo existente não ficou partido. O build web confirma que o DTO novo não quebrou a app. O `git diff --check` apanha whitespace em ficheiros seguidos pelo Git. O validador de planificação confirma matriz, backlog, guias e nomes.

6. Validação do passo.

Regista no relatório:

- comando;
- diretoria;
- exit code;
- resultado;
- falso positivo ou bloqueio de ambiente, se existir.

7. Cenário negativo/erro esperado.

Se `npm --prefix apps/api test` falhar com `listen EPERM` em sandbox, repete fora do sandbox e regista o primeiro erro como bloqueio de ambiente.

### Passo 7 - Fechar evidence e handoff para BK-MF8-07

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com provas objetivas e preparar a ligação ao próximo BK, que trata privacidade de imagens em providers externos.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/services/ai-fairness-guard.service.js`
    - REVER: `apps/api/src/services/recommendation.service.js`
    - REVER: `apps/api/tests/mf8.fairness-guard.test.js`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-07-as-imagens-processadas-nao-devem-ser-usadas-para-treinar-modelos-externos-sem-consentimento.md`
    - LOCALIZAÇÃO: evidence final do PR/defesa.

3. Instruções do que fazer.

No PR/defesa, inclui:

- print ou output do teste `mf8.fairness-guard.test.js`;
- confirmação de que `POST /api/recommendations/generate` continua a devolver recomendações;
- exemplo de DTO com `fairnessStatus: "checked"`;
- três negativos: fonte sensível, motivo sensível e texto discriminatório;
- nota de handoff para `BK-MF8-07`.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. A implementação já ficou nos passos 3, 4 e 5. Este fecho transforma a alteração em evidence defensável: mostra que o requisito foi implementado, testado e ligado ao próximo BK.

6. Validação do passo.

Confirma que a evidence prova estes pontos:

- `RNF24` validado por teste;
- recomendações continuam explicáveis;
- nenhum valor de género, idade ou tom de pele é usado como motivo ou fonte de ranking;
- DTO público não expõe fotografias, prompts, storage keys, cookies, tokens ou caminhos internos;
- `BK-MF8-07` pode avançar para privacidade de imagens sem reescrever fairness.

7. Cenário negativo/erro esperado.

Se o próximo BK precisar de usar imagens com provider externo, ele deve reutilizar o princípio deste BK: a imagem pode ser processada apenas com consentimento e finalidade, mas não pode ser transformada em fonte discriminatória para recomendação.

#### Expected results

- `apps/api/src/services/ai-fairness-guard.service.js` existe e exporta `assertRecommendationFairness` e `assertRespectfulPublicText`.
- `apps/api/src/services/recommendation.service.js` chama o guard antes de persistir e antes de devolver recomendações.
- `POST /api/recommendations/generate` continua a responder `201` com `{ recommendations }` quando os dados são válidos.
- `GET /api/recommendations` continua a responder `200` com recomendações do próprio utilizador.
- Cada recomendação pública inclui `fairnessStatus: "checked"` e `protectedAttributesChecked`.
- Fontes como `genero:feminino`, `idade:45` ou `tomPele:claro` são bloqueadas como origem de recomendação.
- Motivos como `age_match`, `gender_match` ou `skin_tone_match` são bloqueados.
- Texto público discriminatório é bloqueado com erro controlado.
- Produtos não são adicionados automaticamente ao carrinho.
- Executar cenarios negativos obrigatorios (minimo 3) com resultado controlado.

#### Critérios de aceite

- `RNF24` está coberto por service dedicado e teste focal.
- O BK não cria endpoint duplicado de recomendação.
- O guard usa apenas backend; o frontend não decide fairness.
- `reasonCodes` e `sourceSignals` continuam alinhados com `BK-MF8-05`.
- O DTO público não devolve valores de género, idade ou tom de pele.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- ### Matriz minima de testes por prioridade
- Testes por prioridade respeitados: `P0` exige unit + integration + e2e + 3 negativos; `P1` exige unit/integration + 2 negativos; `P2` exige teste focal + 1 negativo.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisão técnica e defesa PAP.

#### Validação final

- [ ] Smoke: `POST /api/recommendations/generate` continua a gerar recomendações válidas.
- [ ] Unitário: `npm --prefix apps/api test -- mf8.fairness-guard.test.js`.
- [ ] Suite API: `npm --prefix apps/api test`.
- [ ] Build web: `npm --prefix apps/web run build`.
- [ ] Estático: sem caminhos privados em BKs de aluno.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Técnico: imports, services, DTO e testes sem nomes contraditórios.
- [ ] Segurança/privacidade: sem género, idade ou tom de pele como fonte pública de ranking.
- [ ] Handoff: `BK-MF8-07` documentado.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite`, `## Evidence para PR/defesa`.

#### Evidence para PR/defesa

- `pr`: referência de commit/PR e resumo técnico da alteração.
- `proof_tecnico`: output de `npm --prefix apps/api test -- mf8.fairness-guard.test.js`.
- `proof_api`: exemplo de resposta de recomendação com `fairnessStatus: "checked"`.
- `proof_negativos`: fonte sensível bloqueada; motivo sensível bloqueado; texto público discriminatório bloqueado.
- `proof_privacidade`: confirmação de que DTO público não devolve valores de género, idade ou tom de pele.
- `proof_handoff`: nota curta a explicar como `BK-MF8-07` continua a fronteira ética para imagens e providers externos.

#### Handoff

- Próximo BK recomendado: `BK-MF8-07`.
- O `BK-MF8-07` deve manter a mesma regra de fronteira: imagem facial e provider externo só podem ser usados com consentimento, finalidade e minimização.
- O guard deste BK protege recomendações; o próximo BK protege o uso de imagens processadas.
- Risco a vigiar: qualquer novo sinal criado em `BK-MF8-08`, `BK-MF8-09` ou `BK-MF8-10` deve ser acrescentado ao guard apenas se for sinal cosmético permitido.

#### Changelog

- `2026-07-02`: guia corrigido em modo `corrigir_apenas`, substituindo contrato genérico de evidence por service de fairness, integração em recomendações, teste Vitest focal, negativos `P0` e handoff para `BK-MF8-07`.
