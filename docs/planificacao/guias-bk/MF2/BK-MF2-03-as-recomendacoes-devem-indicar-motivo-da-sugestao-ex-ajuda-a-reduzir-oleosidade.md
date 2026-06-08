# BK-MF2-03 - As recomendações devem indicar motivo da sugestão

## Header
- `doc_id`: `GUIA-BK-MF2-03`
- `bk_id`: `BK-MF2-03`
- `macro`: `MF2`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `DONE`
- `esforco`: `S`
- `dependencias`: `BK-MF2-02`
- `rf_rnf`: `RF19`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-04`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-03-as-recomendacoes-devem-indicar-motivo-da-sugestao-ex-ajuda-a-reduzir-oleosidade.md`
- `last_updated`: `2026-06-08`

## Contexto do BK
- Entrega alvo: implementar `RF19`, garantindo que cada recomendação tem motivo claro e verificável.
- CANONICO: `RF19` depende de `RF18`, já materializado em `ProductRecommendation`.
- DERIVADO: os motivos são construídos no backend a partir dos sinais produto-análise já validados pelo ranking do BK anterior; o frontend apenas apresenta o texto.
- Este BK atualiza o service de recomendações criado no BK anterior, sem criar outro endpoint de geração.

## Objetivo
Neste BK vais criar uma função de explicação de recomendação e integrá-la no fluxo existente.

## Importância
Uma recomendação sem motivo é difícil de confiar e difícil de defender. O cliente precisa de perceber a ligação entre pele, produto e limitação cosmética, sem receber linguagem clínica nem frases vagas.

## Scope-in
- Criar `recommendation-reason.service.js`.
- Garantir `reasonCodes` e `explanation` não vazios.
- Atualizar `recommendation.service.js` para usar a nova função.
- Atualizar a página para mostrar códigos de motivo de forma legível.

## Scope-out
- Não alterar o endpoint `POST /api/recommendations/generate`.
- Não chamar provider externo.
- Não criar diagnóstico médico.
- Não expor dados biométricos internos no motivo.

## Estado antes
`PARCIAL`: havia campos de motivo, mas a lógica era limitada e não estava integrada de forma robusta.

## Estado depois
`OK`: motivos passam a ser gerados por função dedicada, validados antes da persistência e apresentados na UI.

## Pré-requisitos
- `BK-MF2-02`: `ProductRecommendation` e `recommendation.service.js`.
- `BK-MF1-06`: `FaceAnalysis.findings` com tipo de pele, acne, manchas, rugas e oleosidade.
- `BK-MF0-07`: `Product` com dados de catálogo.

## Glossário
- `reasonCodes`: lista técnica curta, útil para testes e relatórios.
- `explanation`: frase pública para o cliente.
- `explicabilidade`: capacidade de ligar decisão, fonte e resultado.
- `guardrail`: regra que impede afirmações clínicas ou motivos sem fonte.

## Conceitos teóricos
Explicar uma recomendação não é enfeitar uma resposta. O motivo deve nascer dos dados usados no cálculo. Se a análise indica oleosidade moderada e o produto é indicado para pele mista, a explicação deve dizer isso de forma cosmética e limitada.

O service de motivos não deve acrescentar findings a todos os produtos. Ele deve validar os `reasonCodes` e `sourceSignals` que vieram do ranking, porque esses sinais já representam a ligação entre produto e análise.

O backend é o local certo para gerar motivos, porque é onde estão análise, relatório e catálogo. O frontend não deve inventar explicação nem alterar score. Assim, a mesma recomendação aparece com a mesma razão em página, revisão de consultor e evidência técnica.

Também é importante separar explicação curta de justificativa técnica. `reasonCodes` ajudam testes e métricas; `explanation` ajuda o cliente a ler a recomendação.

## Arquitetura do BK
- `recommendation-reason.service.js`: constrói e valida motivos.
- `recommendation.service.js`: passa a consumir a função de motivo.
- `ProductRecommendationsPage.jsx`: mostra texto e códigos sem JSON bruto.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/services/recommendation-reason.service.js`
- CRIAR: `server/tests/recommendation-reason.test.js`
- EDITAR: `server/src/services/recommendation.service.js`
- EDITAR: `client/src/pages/ProductRecommendationsPage.jsx`
- REVER: `server/src/models/product-recommendation.model.js`

## Bloco pedagógico
### Objetivo
Implementar `RF19` sem duplicar endpoints nem quebrar `RF18`.

### Pré-requisitos
- Ler o modelo `ProductRecommendation`.
- Confirmar que `generateRecommendationsForUser` já persiste `reasonCodes` e `explanation`.
- Confirmar que a UI já lista recomendações.

### Erros comuns
- Escrever sempre a mesma frase para todos os produtos.
- Criar motivo no frontend.
- Usar labels internas sem texto compreensível.
- Revelar detalhes sensíveis da análise no texto público.

### Check de compreensão
- [ ] Sei distinguir `reasonCodes` de `explanation`.
- [ ] Sei explicar por que o motivo nasce no backend.
- [ ] Sei testar recomendação sem motivo.

### Tempo estimado
- `P1`: 60-90 minutos, incluindo testes de integração.

## Bloco operacional
### Entrada
- BK: `BK-MF2-03`
- Requisito: `RF19`
- Endpoint principal: `POST /api/recommendations/generate`

### Passos
1. Confirmar contrato funcional e limites.
2. Criar service de motivos.
3. Integrar motivos no service de recomendações.
4. Atualizar UI.
5. Criar teste unitário dos motivos.
6. Executar cenários negativos obrigatórios (mínimo 2).

### Cenários negativos recomendados
- Recomendação sem motivo deve falhar em validação de modelo.
- Produto sem compatibilidade suficiente não deve gerar explicação vaga.

### Validação
- [ ] Smoke: cada recomendação devolve `reasonCodes` e `explanation`.
- [ ] Negativos: mínimo `2` cenários com resultado controlado.
- [ ] Segurança: a explicação não devolve fotografia, consentimento ou path.

### Matriz mínima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF2-04` deve reutilizar `id`, `status`, `reasonCodes` e `explanation` para registar feedback sobre recomendações existentes.

## Passos lineares
### Passo 1 - Confirmar contrato e limites

1. Explicação simples do objetivo: garantir que `RF19` melhora recomendação existente.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RF-PARA-BKS.md`
    - LOCALIZAÇÃO: linhas `RF19` e `BK-MF2-03`.
3. O que fazer: confirma que o BK depende de `BK-MF2-02`.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: este passo evita criar outro fluxo de recomendação.
6. Como validar este passo: o endpoint continua a ser `/api/recommendations/generate`.
7. Erros comuns ou cenário negativo: criar endpoint paralelo gera drift e confunde o frontend.

### Passo 2 - Criar service de motivos

1. Explicação simples do objetivo: centralizar a explicação de recomendações.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/recommendation-reason.service.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar função que transforma análise e produto em motivo público.
4. Código completo, correto e integrado.

```js
// server/src/services/recommendation-reason.service.js
import { AppError } from "../middlewares/error.middleware.js";

const PUBLIC_LABELS = {
    baixo: "baixo",
    baixa: "baixa",
    moderado: "moderado",
    moderada: "moderada",
    alto: "alto",
    alta: "alta",
    mista: "mista",
    oleosa: "oleosa",
    seca: "seca",
    sensivel: "sensível",
    normal: "normal",
    nao_conclusivo: "não conclusivo",
};

const COMMERCIAL_REASON_CODES = new Set(["stock_available"]);
const SIGNAL_LABELS = {
    skinType: "tipo de pele",
    acne: "acne",
    manchas: "manchas",
    rugas: "rugas",
    oleosidade: "oleosidade",
};

function normalizeLabel(value) {
    return String(value ?? "nao_conclusivo")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function publicLabel(value) {
    const key = normalizeLabel(value);
    return PUBLIC_LABELS[key] ?? key.replaceAll("_", " ");
}

function findingLabel(analysis, key) {
    return normalizeLabel(analysis.findings?.[key]?.label);
}

function uniqueStrings(values) {
    return Array.from(new Set((values ?? []).filter(Boolean)));
}

function buildReasonCodes(ranking) {
    const codes = uniqueStrings(ranking.reasonCodes);
    const cosmeticCodes = codes.filter((code) => !COMMERCIAL_REASON_CODES.has(code));

    if (cosmeticCodes.length === 0) {
        throw new AppError(400, "A recomendação precisa de pelo menos um motivo cosmético");
    }

    return cosmeticCodes;
}

function buildSourceSignals(ranking) {
    const sourceSignals = uniqueStrings(ranking.sourceSignals);

    if (sourceSignals.length === 0) {
        throw new AppError(400, "A recomendação precisa de pelo menos uma fonte verificável");
    }

    return sourceSignals;
}

function buildSignalText(sourceSignals) {
    return sourceSignals.map((signal) => SIGNAL_LABELS[signal] ?? signal).join(", ");
}

export function buildRecommendationReason({ analysis, product, ranking }) {
    const skinType = publicLabel(findingLabel(analysis, "skinType"));
    const reasonCodes = buildReasonCodes(ranking);
    const sourceSignals = buildSourceSignals(ranking);
    const signalText = buildSignalText(sourceSignals);

    return {
        reasonCodes,
        sourceSignals,
        explanation: [
            `${product.name} foi recomendado porque o ranking encontrou compatibilidade entre o produto e ${signalText}.`,
            `A análise registou pele ${skinType}; a explicação usa sinais do relatório e do catálogo, não uma decisão do frontend.`,
            "A sugestão é informativa, não é diagnóstico médico e não cria compra automática.",
        ].join(" "),
    };
}
```

5. Explicação do código: a função recebe dados já calculados pelo service de recomendações, remove motivos comerciais isolados, exige uma fonte verificável e devolve códigos mais uma frase pública. A frase usa labels seguras e evita promessas clínicas.
6. Como validar este passo: chamar com `reasonCodes: ["stock_available"]` ou `sourceSignals: []` deve lançar `400`.
7. Erros comuns ou cenário negativo: acrescentar findings genéricos dentro deste service cria explicações iguais para produtos sem compatibilidade real.

### Passo 3 - Integrar motivos no service de recomendações

1. Explicação simples do objetivo: usar a função nova no fluxo de `RF18`.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/services/recommendation.service.js`
    - LOCALIZAÇÃO: import e função `generateRecommendationsForUser`.
3. O que fazer: importar `buildRecommendationReason` e persistir o resultado.
4. Código completo, correto e integrado.

```js
// server/src/services/recommendation.service.js
import { buildRecommendationReason } from "./recommendation-reason.service.js";

export async function generateRecommendationsForUser(userId) {
    const { analysis, report } = await getLatestInputs(userId);

    const products = await Product.find({ stock: { $gt: 0 } })
        .select("name brandName description ingredients skinTypes imageUrl priceCents stock")
        .limit(POSITIVE_STOCK_LIMIT);

    const rankedProducts = products
        .map((product) => ({
            product,
            ranking: calculateProductScore(product, analysis),
        }))
        .filter(({ ranking }) => ranking.reasonCodes.length > 0 && ranking.sourceSignals.length > 0)
        .sort((a, b) => b.ranking.score - a.ranking.score)
        .slice(0, MAX_RECOMMENDATIONS);

    if (rankedProducts.length < MIN_RECOMMENDATIONS) {
        throw new AppError(404, "Não existem produtos compatíveis suficientes");
    }

    const recommendations = await Promise.all(
        rankedProducts.map(async ({ product, ranking }) => {
            const reason = buildRecommendationReason({ analysis, product, ranking });

            return ProductRecommendation.findOneAndUpdate(
                {
                    userId,
                    analysisId: analysis._id,
                    productId: product._id,
                },
                {
                    $set: {
                        reportId: report._id,
                        score: ranking.score,
                        reasonCodes: reason.reasonCodes,
                        explanation: reason.explanation,
                        sourceSignals: reason.sourceSignals,
                        status: "active",
                    },
                    $setOnInsert: {
                        feedback: { value: null, submittedAt: null },
                    },
                },
                { upsert: true, new: true, runValidators: true },
            );
        }),
    );

    return {
        recommendations: recommendations.map((recommendation, index) =>
            toRecommendationDto(recommendation, rankedProducts[index].product),
        ),
        limitations: [
            ...(analysis.limitations ?? []),
            ...(report.limitations ?? []),
            "Recomendação cosmética baseada em análise e catálogo; não cria compra automática.",
        ],
    };
}
```

5. Explicação do código: a geração continua no mesmo endpoint, mas agora o motivo vem de um módulo dedicado. `runValidators: true` garante que uma recomendação sem `reasonCodes` ou `explanation` não é guardada, e o filtro exige sinais de origem antes de persistir.
6. Como validar este passo: gerar recomendações e confirmar que cada item tem `reasonCodes.length > 0` e `sourceSignals.length > 0`.
7. Erros comuns ou cenário negativo: manter a função antiga criaria duas regras de explicação diferentes.

### Passo 4 - Atualizar UI para mostrar motivos

1. Explicação simples do objetivo: apresentar os motivos sem expor JSON bruto.
2. Ficheiros envolvidos.
    - EDITAR: `client/src/pages/ProductRecommendationsPage.jsx`
    - LOCALIZAÇÃO: card de recomendação.
3. O que fazer: acrescentar lista de códigos no card.
4. Código completo, correto e integrado.

```jsx
// client/src/pages/ProductRecommendationsPage.jsx
function RecommendationReasonList({ reasonCodes }) {
    if (!reasonCodes?.length) {
        return <p>Motivo indisponível.</p>;
    }

    return (
        <ul aria-label="Motivos da recomendação">
            {reasonCodes.map((code) => (
                <li key={code}>{code.replaceAll("_", " ")}</li>
            ))}
        </ul>
    );
}

// Dentro do card de cada recomendação:
<p>{recommendation.explanation}</p>
<RecommendationReasonList reasonCodes={recommendation.reasonCodes} />
```

5. Explicação do código: a explicação principal continua em texto natural; os códigos ficam visíveis para transparência e testes. A UI não calcula motivos.
6. Como validar este passo: uma recomendação gerada deve mostrar frase e lista de motivos.
7. Erros comuns ou cenário negativo: apresentar apenas score deixa o cliente sem contexto.

### Passo 5 - Criar teste unitário dos motivos

1. Explicação simples do objetivo: provar que a função de motivos devolve explicação pública e bloqueia recomendações sem fonte.
2. Ficheiros envolvidos.
    - CRIAR: `server/tests/recommendation-reason.test.js`
    - REVER: `server/src/services/recommendation-reason.service.js`
    - LOCALIZAÇÃO: ficheiro completo de teste.
3. O que fazer: criar testes com `vitest` para caminho válido e cenário sem motivo.
4. Código completo, correto e integrado.

```js
// server/tests/recommendation-reason.test.js
import { describe, expect, it } from "vitest";
import { buildRecommendationReason } from "../src/services/recommendation-reason.service.js";

const baseProduct = {
    name: "Gel Seborregulador",
};

function createAnalysis(overrides = {}) {
    return {
        findings: {
            skinType: { label: "oleosa" },
            acne: { label: "moderada" },
            manchas: { label: "nao_conclusivo" },
            rugas: { label: "nao_conclusivo" },
            oleosidade: { label: "alta" },
            ...overrides,
        },
    };
}

describe("BK-MF2-03 / RF19 - motivos de recomendação", () => {
    it("gera códigos e explicação pública a partir do ranking verificado", () => {
        const reason = buildRecommendationReason({
            analysis: createAnalysis(),
            product: baseProduct,
            ranking: {
                reasonCodes: ["skin_type_oleosa", "oleosidade_alta"],
                sourceSignals: ["skinType", "oleosidade"],
            },
        });

        expect(reason.reasonCodes).toContain("skin_type_oleosa");
        expect(reason.sourceSignals).toContain("oleosidade");
        expect(reason.explanation).toContain("Gel Seborregulador");
        expect(reason.explanation).toContain("não é diagnóstico médico");
    });

    it("bloqueia recomendação com motivo apenas comercial", () => {
        expect(() =>
            buildRecommendationReason({
                analysis: createAnalysis(),
                product: baseProduct,
                ranking: {
                    reasonCodes: ["stock_available"],
                    sourceSignals: ["stock"],
                },
            }),
        ).toThrow("A recomendação precisa de pelo menos um motivo cosmético");
    });

    it("bloqueia recomendação sem fonte verificável", () => {
        expect(() =>
            buildRecommendationReason({
                analysis: createAnalysis(),
                product: baseProduct,
                ranking: {
                    reasonCodes: ["skin_type_oleosa"],
                    sourceSignals: [],
                },
            }),
        ).toThrow("A recomendação precisa de pelo menos uma fonte verificável");
    });
});
```

5. Explicação do código: o primeiro teste confirma que existem códigos, sinais e texto público. O segundo bloqueia motivo apenas comercial. O terceiro prova que uma explicação sem fonte de ranking não entra no backend.
6. Como validar este passo: executar `npm test -- recommendation-reason.test.js` a partir de `server` ou o comando de testes definido no projeto e confirmar três testes verdes.
7. Erros comuns ou cenário negativo: testar apenas o caso feliz não prova que explicação vazia fica bloqueada.

### Passo 6 - Validar negativos obrigatórios

1. Explicação simples do objetivo: garantir que motivo vazio não entra no sistema.
2. Ficheiros envolvidos.
    - REVER: `server/src/services/recommendation-reason.service.js`
    - REVER: `server/src/models/product-recommendation.model.js`
    - LOCALIZAÇÃO: validação de `reasonCodes` e `explanation`.
3. O que fazer: testar motivo vazio e geração normal.
4. Código completo, correto e integrado.

```bash
curl -i -X POST http://localhost:3001/api/recommendations/generate -H "Cookie: orelle_session=COOKIE_COM_DADOS"
curl -i -X POST http://localhost:3001/api/recommendations/generate -H "Cookie: orelle_session=COOKIE_SEM_PRODUTOS_COMPATIVEIS"
curl -i -X POST http://localhost:3001/api/recommendations/generate -H "Cookie: orelle_session=COOKIE_SO_COM_STOCK"
```

5. Explicação do código: o primeiro pedido deve devolver motivos; os outros impedem explicação vaga quando não há produto compatível ou quando há apenas disponibilidade comercial.
6. Como validar este passo: registar `201` com motivos e `404` sem produtos compatíveis.
7. Erros comuns ou cenário negativo: aceitar frase fixa para qualquer produto quebra explicabilidade.

## Expected results
- Cada recomendação gerada tem `reasonCodes` não vazio.
- Cada recomendação gerada tem `explanation` com texto público.
- Cada recomendação gerada tem `sourceSignals` não vazio no backend.
- Produto sem compatibilidade suficiente não gera recomendação vaga.
- Produto apenas disponível em stock não gera motivo cosmético.
- A página mostra motivo textual e lista de códigos.

## Critérios de aceite
- Entrega funcional de `RF19` concluída.
- Cenários negativos concluídos: mínimo `2`.
- Evidência de testes por camada conforme prioridade `P1`.
- Motivos criados no backend, não no frontend.
- Nenhum motivo expõe fotografia, consentimento ou path interno.
- O endpoint de geração continua único.
- O service de motivos não acrescenta findings que o ranking não validou contra o produto.

## Validação final
- Gerar recomendações e verificar `reasonCodes`.
- Confirmar que `sourceSignals` existe antes da persistência.
- Confirmar que a UI mostra motivos sem `JSON.stringify`.
- Confirmar que `ProductRecommendation` rejeita motivo vazio.
- Executar o teste unitário de `recommendation-reason.service.js`.
- Executar `git diff --check` antes do PR.

## Evidence para PR/defesa
- `proof_tecnico`: resposta com `reasonCodes` e `explanation`.
- `proof_negativos`: falha controlada sem produtos compatíveis.
- `proof_negocio`: screenshot de card com motivo legível.

## Handoff
`BK-MF2-04` deve usar `recommendation.id` para registar feedback do cliente sobre recomendações já explicadas.

## Changelog
- `2026-06-08`: guia reescrito com service de motivos, integração no service de recomendações e UI com explicação.
- `2026-06-08`: acrescentado passo unitário para cumprir o mínimo pedagógico `P1` e provar motivo válido/ausente.
- `2026-06-08`: corrigido service de motivos para não transformar findings genéricos em compatibilidade de produto.
