# BK-MF7-07 - Suporte para API de IA externa (ex: Azure Face API ou TensorFlow)

## Header
- `doc_id`: `GUIA-BK-MF7-07`
- `bk_id`: `BK-MF7-07`
- `macro`: `MF7`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `-`
- `rf_rnf`: `RNF18`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Core`
- `classe_core_dual`: `CORE-IA`
- `eixo_primario`: `ConsultoriaInteligente`
- `kpi_primario`: `taxa_recomendacao_util`
- `kpi_secundario`: `tempo_analise_p95`
- `proximo_bk`: `BK-MF8-01`
- `guia_path`: `docs/planificacao/guias-bk/MF7/BK-MF7-07-suporte-para-api-de-ia-externa-ex-azure-face-api-ou-tensorflow.md`
- `last_updated`: `2026-06-27`

#### Objetivo

Neste BK vais preparar a app para usar uma API externa de IA facial de forma isolada, configurável e com fallback honesto. A análise continua cosmética, depende de consentimento ativo, usa fotografias já validadas pelo backend e nunca toma decisões de compra automaticamente.

`CANONICO`: `RNF18` pede suporte para API de IA externa, por exemplo Azure Face API ou TensorFlow. `RF14` define análise de tipo de pele, acne, manchas, rugas e oleosidade. `RNF23`, `RNF24` e `RNF25` ficam preparados para a MF8.

#### Importância

Uma integração de IA não deve ficar espalhada por controllers e services. Se o provider remoto falhar, a app deve responder de forma controlada ou usar baseline local conservadora. Isto mantém a experiência estável, evita claims clínicos e permite evoluir provider sem quebrar o domínio Orélle.

#### Scope-in

- Adicionar configuração de provider de IA.
- Criar adapter externo com `fetch` nativo.
- Validar que o URL do provider externo usa transporte seguro.
- Preparar entrada de imagem minimizada para o provider externo, sem expor paths internos.
- Manter fallback local.
- Normalizar resposta para o mesmo contrato usado por `FaceAnalysis`.
- Propagar limitações e fontes para a UI.
- Criar negativos para provider sem configuração, URL inseguro, timeout e resposta inválida.

#### Scope-out

- Não escolher fornecedor pago definitivo.
- Não enviar imagens para aprendizagem de terceiros.
- Não prometer decisão clínica, cura, melhoria assegurada ou resultado certo.
- Não adicionar produto ao carrinho por recomendação.
- Não substituir consentimento, ownership, encriptação ou auditoria.

#### Estado antes e depois

- Antes: a app tem provider local controlado para análise cosmética.
- Depois: a app tem fronteira para provider remoto, entrada de imagem preparada no backend, fallback local e resposta pública coerente.

#### Pre-requisitos

- `BK-MF1-06`: provider local de análise facial.
- `BK-MF6-01`: orçamento de tempo e fallback controlado.
- `BK-MF6-07`: fotografias e relatórios protegidos.
- `BK-MF7-01`: consentimento explícito.
- `BK-MF7-03`: sessão autenticada.

#### Glossário

- Provider de IA: módulo que recebe fotografias já validadas e devolve achados cosméticos.
- Adapter externo: camada que traduz a resposta remota para o contrato interno da Orélle.
- Fallback: resposta alternativa segura quando a integração remota falha.
- Guardrail: regra que limita claims e impede resultados perigosos.
- Fonte: origem usada para explicar o resultado, por exemplo `fotografia_frontal`.

#### Conceitos teóricos essenciais

O service de análise não deve saber detalhes de Azure, TensorFlow ou outro fornecedor. Ele chama `analyzeSkinPhotos` e recebe sempre o mesmo contrato: `providerName`, `findings`, `sources` e `limitations`.

Uma API externa de análise facial precisa de receber conteúdo de imagem ou uma referência privada equivalente. Neste BK vais usar bytes lidos no backend e convertidos para base64 só no pedido ao provider, porque isto evita expor `storageKey`, paths internos ou URLs públicas. `DERIVADO`: enquanto não existir fornecedor definitivo, base64 em JSON é a opção pedagógica mínima sem dependência nova; numa integração real, o formato pode ser trocado por `multipart/form-data` ou URL assinada privada se isso for documentado.

O pedido ao provider transporta imagem facial e chave de API. Por isso, `CANONICO`: `RNF09` exige HTTPS/TLS 1.2+ também nesta integração. `DERIVADO`: o adapter deve rejeitar `AI_PROVIDER_URL` externo com `http://` antes de chamar `fetch`; só `localhost` e `127.0.0.1` podem usar HTTP em desenvolvimento controlado.

Um provider externo pode falhar por timeout, chave ausente, payload inválido ou indisponibilidade. O fallback local mantém a app utilizável, mas deve dizer claramente que o resultado é conservador.

O frontend apresenta limitações vindas da API. Isto é essencial para transparência: o utilizador deve saber que a análise é cosmética e que pode ter confiança baixa.

Antes de implementares, evita estes erros comuns:

- Colocar chaves reais da API no repositório em vez de variáveis de ambiente.
- Usar `AI_PROVIDER_URL` externo com `http://` para enviar fotografias ou API key.
- Enviar imagens para treino externo ou guardar URLs públicas de fotografias biométricas.
- Tratar uma resposta de IA como diagnóstico médico ou decisão automática de compra.
- Remover o fallback local e deixar a experiência dependente de um fornecedor externo.
- Aceitar fotografias sem `storageKey`, `mimeType` ou `sizeBytes` no provider local.

No final do BK deves conseguir responder a estas perguntas de compreensão:

- Consegues explicar porque o service chama sempre `analyzeSkinPhotos`, independentemente do provider ativo?
- Consegues justificar porque o modo externo só deve ligar com configuração explícita?
- Consegues identificar os negativos mínimos antes de entregar o BK?
- Consegues mostrar ao utilizador uma limitação da análise sem inventar diagnóstico clínico?

#### Arquitetura do BK

Entrada técnica deste BK:

- O backend já tem consentimento, ownership e fotografias protegidas tratados nos BKs anteriores.
- O provider local existe e continua a ser a baseline segura.
- O service de análise lê bytes privados autorizados e prepara `imageBase64` apenas para a chamada ao provider.
- A configuração externa entra por variáveis de ambiente e o URL remoto é validado antes do `fetch`.
- O frontend consome apenas o contrato público normalizado da análise facial.

- Configuração: `env.aiProviderMode`, `env.aiProviderUrl`, `env.aiProviderKey`.
- Provider local: `skin-analysis.provider.js`.
- Provider externo: `external-skin-analysis.provider.js`, incluindo guard de URL seguro.
- Service: `face-analysis.service.js`.
- Storage protegido: `face-secure-storage.service.js`, criado no `BK-MF6-07`.
- Frontend: `FaceAnalysisPage`.
- Testes: fallback, timeout e resposta inválida.
- Handoff: `BK-MF8-01` melhora documentação modular; `BK-MF8-05` reforça explicabilidade.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/config/env.js`
- CRIAR: `apps/api/src/providers/external-skin-analysis.provider.js`
- EDITAR: `apps/api/src/providers/skin-analysis.provider.js`
- REVER: `apps/api/src/services/face-secure-storage.service.js`
- REVER: `apps/api/src/services/face-analysis.service.js`
- REVER: `apps/web/src/pages/FaceAnalysisPage.jsx`
- CRIAR: `apps/api/tests/mf7.external-ai-provider.test.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato RNF18 e limites de IA

1. Objetivo funcional do passo no contexto da app.

Definir que a integração é uma fronteira técnica, não uma mudança de domínio.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/RF.md`
    - LOCALIZAÇÃO: `RNF18`, `RF14`, `RF15`.

3. Instruções do que fazer.

Confirma que a análise continua cosmética, dependente de fotografias frontal/perfil e consentimento.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. É confirmação de fronteira e guardrails.

5. Explicação do código.

Sem código. O risco deste BK é transformar “suporte a API” em promessa clínica ou compra automática. A documentação impede esse drift.

6. Validação do passo.

Executa `rg -n "RNF18|RF14|RF15|RF18|RF19" docs/RNF.md docs/RF.md`.

7. Cenário negativo/erro esperado.

Se uma resposta de IA disser que substitui aconselhamento profissional, o adapter deve normalizar ou rejeitar essa resposta.

### Passo 2 - Adicionar configuração do provider

1. Objetivo funcional do passo no contexto da app.

Controlar provider por variáveis de ambiente sem hardcode.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/config/env.js`
    - LOCALIZAÇÃO: objeto `env`.

3. Instruções do que fazer.

Adiciona campos opcionais para IA.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/config/env.js
/**
 * Configuração central da API Orélle.
 *
 * Este ficheiro existe desde o BK-MF0-01 e foi estendido no BK-MF0-02 para
 * incluir os parâmetros da sessão HttpOnly. Neste BK só acrescentas as opções
 * de IA; os guards de sessão continuam obrigatórios.
 */
import "dotenv/config";

const INSECURE_SESSION_SECRETS = new Set([
    "dev-only-change-me",
    "change-me",
    "change-me-use-a-long-random-string",
    "secret",
    "session-secret",
]);

/**
 * Identifica segredos de sessão que não são aceitáveis em produção.
 *
 * @function isUnsafeProductionSessionSecret
 * @param {string|undefined} secret - Valor de `SESSION_SECRET`.
 * @returns {boolean} Verdadeiro quando o segredo é ausente, fraco ou placeholder.
 */
export function isUnsafeProductionSessionSecret(secret) {
    const normalizedSecret = String(secret ?? "").trim();

    return (
        normalizedSecret.length < 32 ||
        INSECURE_SESSION_SECRETS.has(normalizedSecret.toLowerCase())
    );
}

/**
 * Variáveis de ambiente normalizadas usadas pelo backend.
 *
 * @type {{
 *   nodeEnv: string,
 *   port: number,
 *   mongoUri: string,
 *   clientOrigin: string,
 *   sessionSecret: string,
 *   sessionTtl: string,
 *   stripeSecretKey: string|undefined,
 *   aiProviderMode: "local"|"external",
 *   aiProviderUrl: string|undefined,
 *   aiProviderKey: string|undefined
 * }}
 */
export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3001),
    mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/orelle",
    clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    sessionSecret: process.env.SESSION_SECRET ?? "dev-only-change-me",
    sessionTtl: process.env.SESSION_TTL ?? "2h",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    // O modo local é o padrão para evitar chamadas externas sem configuração explícita.
    aiProviderMode: process.env.AI_PROVIDER_MODE === "external" ? "external" : "local",
    aiProviderUrl: process.env.AI_PROVIDER_URL,
    aiProviderKey: process.env.AI_PROVIDER_KEY,
};

// O BK-MF7-07 não pode enfraquecer a segurança criada na autenticação.
// Em produção, a API deve continuar a bloquear segredos fracos antes de arrancar.
if (
    env.nodeEnv === "production" &&
    isUnsafeProductionSessionSecret(env.sessionSecret)
) {
    throw new Error("SESSION_SECRET forte obrigatório em produção");
}
```

5. Explicação do código.

A app usa provider local por defeito. O modo externo só liga com `AI_PROVIDER_MODE=external`. URL e chave ficam fora do código e podem variar por ambiente. Isto evita acoplar o projeto a um fornecedor específico.

O ficheiro completo preserva `import "dotenv/config"`, `isUnsafeProductionSessionSecret` e o bloqueio de `SESSION_SECRET` fraco em produção. Este BK acrescenta configuração de IA, mas não pode apagar segurança de sessão criada em BKs anteriores.

6. Validação do passo.

Sem variáveis, confirma que `env.aiProviderMode` fica `local`.

7. Cenário negativo/erro esperado.

Não coloques chaves reais em ficheiros do repositório.

### Passo 3 - Criar adapter externo

1. Objetivo funcional do passo no contexto da app.

Traduzir resposta remota para contrato interno.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/providers/external-skin-analysis.provider.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria adapter com timeout, validação de configuração, validação HTTPS e normalização conservadora.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/providers/external-skin-analysis.provider.js
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";

const EXTERNAL_PROVIDER_TIMEOUT_MS = 6_000;
const ALLOWED_FINDINGS = ["skinType", "acne", "manchas", "rugas", "oleosidade"];
const LOCAL_PROVIDER_HOSTS = new Set(["localhost", "127.0.0.1"]);

function assertExternalAnalysisPayloadInput({ frontalPhoto, perfilPhoto } = {}) {
    if (
        !frontalPhoto?.mimeType ||
        !perfilPhoto?.mimeType ||
        !frontalPhoto?.sizeBytes ||
        !perfilPhoto?.sizeBytes ||
        !frontalPhoto?.imageBase64 ||
        !perfilPhoto?.imageBase64
    ) {
        throw new AppError(400, "Fotografias preparadas obrigatórias para provider externo");
    }

    return { frontalPhoto, perfilPhoto };
}

function buildProviderPhoto(kind, photo) {
    return {
        kind,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        // O conteúdo vai apenas no pedido ao provider; storageKey e paths internos nunca saem da API.
        contentBase64: photo.imageBase64,
    };
}

function buildExternalAnalysisPayload(input) {
    const { frontalPhoto, perfilPhoto } = assertExternalAnalysisPayloadInput(input);

    return {
        photos: [
            buildProviderPhoto("frontal", frontalPhoto),
            buildProviderPhoto("perfil", perfilPhoto),
        ],
        purpose: "analise_facial_cosmetica",
        retention: "processamento_imediato_sem_treino_externo",
    };
}

/**
 * Valida o URL remoto antes de enviar API key ou conteúdo biométrico.
 *
 * @function assertSecureExternalProviderUrl
 * @param {string|undefined} value - Valor de `AI_PROVIDER_URL`.
 * @returns {string} URL normalizado e seguro para `fetch`.
 * @throws {AppError} Quando o URL é inválido ou usa HTTP externo.
 */
function assertSecureExternalProviderUrl(value) {
    let providerUrl;

    try {
        providerUrl = new URL(value);
    } catch {
        throw new AppError(503, "URL do provider de IA externo inválido");
    }

    const isLocalDevelopmentUrl =
        env.nodeEnv !== "production" &&
        providerUrl.protocol === "http:" &&
        LOCAL_PROVIDER_HOSTS.has(providerUrl.hostname);

    if (providerUrl.protocol !== "https:" && !isLocalDevelopmentUrl) {
        // Provider externo publicado nunca deve receber imagem facial ou API key por HTTP.
        throw new AppError(503, "Provider de IA externo deve usar HTTPS");
    }

    return providerUrl.href;
}

function normalizeFinding(value) {
    const confidence = Number(value?.confidence ?? 0);

    return {
        label: String(value?.label ?? "indeterminado").slice(0, 80),
        confidence: Math.min(0.95, Math.max(0.1, confidence)),
        explanation: String(value?.explanation ?? "Resultado cosmético sem detalhe adicional.").slice(0, 240),
    };
}

function normalizeExternalResult(data) {
    const findings = {};

    for (const key of ALLOWED_FINDINGS) {
        findings[key] = normalizeFinding(data?.findings?.[key]);
    }

    return {
        providerName: String(data?.providerName ?? "external-skin-provider"),
        findings,
        sources: ["fotografia_frontal", "fotografia_perfil", "provider_remoto_configurado"],
        limitations: [
            "Análise cosmética assistida por provider configurado.",
            "Resultado não substitui avaliação profissional.",
            "Qualidade de luz, enquadramento e resolução podem afetar a análise.",
        ],
    };
}

/**
 * Chama provider remoto de análise cosmética.
 *
 * @async
 * @function analyzeSkinPhotosExternally
 * @param {{frontalPhoto?: object, perfilPhoto?: object}} input - Fotografias já validadas pelo backend.
 * @returns {Promise<object>} Resultado normalizado para o contrato Orélle.
 * @throws {AppError} Quando configuração, timeout ou resposta remota falham.
 */
export async function analyzeSkinPhotosExternally(input) {
    if (!env.aiProviderUrl || !env.aiProviderKey) {
        throw new AppError(503, "Provider de IA externo não configurado");
    }

    const providerUrl = assertSecureExternalProviderUrl(env.aiProviderUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXTERNAL_PROVIDER_TIMEOUT_MS);

    try {
        const response = await fetch(providerUrl, {
            method: "POST",
            headers: {
                // A API key autentica o servidor Orélle no provider; nunca entra no body nem no frontend.
                Authorization: `Bearer ${env.aiProviderKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(buildExternalAnalysisPayload(input)),
            signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new AppError(502, "Provider de IA externo indisponível");
        }

        return normalizeExternalResult(data);
    } catch (err) {
        if (err instanceof AppError) {
            throw err;
        }

        if (err?.name === "AbortError") {
            // Timeout remoto vira erro HTTP controlado para não expor detalhes técnicos do fetch.
            throw new AppError(504, "Provider de IA externo excedeu o tempo limite");
        }

        throw new AppError(502, "Provider de IA externo indisponível");
    } finally {
        // Limpar o timer evita manter handles ativos depois da chamada remota.
        clearTimeout(timeout);
    }
}
```

5. Explicação do código.

O adapter não envia `storageKey`, path interno nem URL pública para o provider. A API key vai apenas no header `Authorization`, porque o provider remoto precisa de autenticar o servidor Orélle; o body não contém token, `storageKey`, path interno ou URL pública. O adapter recebe fotografias já preparadas pelo service, com `imageBase64`, `mimeType` e `sizeBytes`, e constrói um payload mínimo para análise cosmética. Esta decisão fecha o `RNF18`: a API externa passa a ter conteúdo de imagem suficiente para analisar, mas a fronteira continua controlada pelo backend.

A resposta é normalizada para os cinco achados do domínio Orélle. A confiança fica limitada para evitar valores absurdos. Timeout, falha de rede e respostas remotas inválidas viram `AppError`, para que a API não exponha erros técnicos do provider. O guard `assertSecureExternalProviderUrl` aplica o contrato de `RNF09`: provider externo publicado deve usar HTTPS antes de receber API key e imagem facial. O campo `retention` documenta a intenção de processamento imediato sem treino externo; se o fornecedor real exigir outro contrato, isso deve ser validado contra consentimento e `BK-MF8-07`.

6. Validação do passo.

Testa sem `AI_PROVIDER_URL` e espera erro `503`. Testa `AI_PROVIDER_URL=http://ia.example.test/analyze` e confirma que falha antes de chamar `fetch`.

7. Cenário negativo/erro esperado.

Resposta remota sem `findings` deve gerar achados `indeterminado`, não quebrar a API com `undefined`. Fotografia sem `imageBase64` e URL HTTP externo devem falhar antes de qualquer `fetch`.

### Passo 4 - Manter fallback local no provider principal

1. Objetivo funcional do passo no contexto da app.

Usar provider externo só quando configurado e cair para baseline local em falha controlada.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/providers/skin-analysis.provider.js`
    - LOCALIZAÇÃO: export `analyzeSkinPhotos`.

3. Instruções do que fazer.

Preserva a função local e adiciona dispatch por configuração.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/providers/skin-analysis.provider.js
import { AppError } from "../middlewares/error.middleware.js";
import { env } from "../config/env.js";
import { analyzeSkinPhotosExternally } from "./external-skin-analysis.provider.js";

const MIN_CONFIDENCE = 0.45;
const MAX_CONFIDENCE = 0.62;

/**
 * Cria um finding cosmético estruturado.
 *
 * @function createFinding
 * @param {string} label - Etiqueta curta do achado.
 * @param {number} confidence - Confiança normalizada entre 0 e 1.
 * @param {string} explanation - Explicação cosmética curta.
 * @returns {{label: string, confidence: number, explanation: string}} Finding público.
 */
function createFinding(label, confidence, explanation) {
    return { label, confidence, explanation };
}

/**
 * Mantém a confiança dentro de limites conservadores.
 *
 * @function clampConfidence
 * @param {number} value - Valor candidato calculado a partir dos metadados.
 * @returns {number} Confiança final sem valores extremos.
 */
function clampConfidence(value) {
    return Math.min(MAX_CONFIDENCE, Math.max(MIN_CONFIDENCE, value));
}

/**
 * Calcula confiança técnica sem interpretar clinicamente a fotografia.
 *
 * @function calculateTechnicalConfidence
 * @param {object} frontalPhoto - Fotografia frontal validada pelo backend.
 * @param {object} perfilPhoto - Fotografia de perfil validada pelo backend.
 * @returns {number} Confiança baixa a moderada para baseline local.
 */
function calculateTechnicalConfidence(frontalPhoto, perfilPhoto) {
    const totalSizeBytes =
        Number(frontalPhoto.sizeBytes) + Number(perfilPhoto.sizeBytes);
    const sizeSignal = (totalSizeBytes % 1000) / 1000;
    const formatSignal =
        frontalPhoto.mimeType === perfilPhoto.mimeType ? 0.04 : 0.01;

    return clampConfidence(0.48 + sizeSignal * 0.1 + formatSignal);
}

/**
 * Valida fotografias antes de qualquer análise local ou externa.
 *
 * @function assertValidAnalysisPhotos
 * @param {{frontalPhoto?: object, perfilPhoto?: object}|undefined} input - Fotografias escolhidas pelo backend.
 * @returns {{frontalPhoto: object, perfilPhoto: object}} Fotografias com metadados obrigatórios.
 * @throws {AppError} Quando faltam metadados privados obrigatórios.
 */
function assertValidAnalysisPhotos(input) {
    const { frontalPhoto, perfilPhoto } = input ?? {};

    if (
        !frontalPhoto?.storageKey ||
        !perfilPhoto?.storageKey ||
        !frontalPhoto?.mimeType ||
        !perfilPhoto?.mimeType ||
        !frontalPhoto?.sizeBytes ||
        !perfilPhoto?.sizeBytes
    ) {
        throw new AppError(400, "Fotografias válidas obrigatórias para análise");
    }

    return { frontalPhoto, perfilPhoto };
}

/**
 * Analisa fotografias faciais já validadas com baseline local.
 *
 * @async
 * @function analyzeSkinPhotosLocally
 * @param {{frontalPhoto?: object, perfilPhoto?: object}} input - Fotos escolhidas pelo backend.
 * @returns {Promise<object>} Resultado estruturado da análise.
 * @throws {AppError} Quando faltam metadados privados obrigatórios.
 */
async function analyzeSkinPhotosLocally(input) {
    const { frontalPhoto, perfilPhoto } = assertValidAnalysisPhotos(input);

    // A baseline usa só metadados técnicos já validados; não lê paths públicos nem tenta diagnosticar pele.
    const confidence = calculateTechnicalConfidence(frontalPhoto, perfilPhoto);

    return {
        providerName: "local-skin-analysis-v1",
        findings: {
            skinType: createFinding("mista", confidence, "Estimativa cosmética inicial."),
            acne: createFinding("baixo", clampConfidence(confidence - 0.02), "Sinal cosmético conservador."),
            manchas: createFinding("baixo", clampConfidence(confidence - 0.04), "Sinal cosmético conservador."),
            rugas: createFinding("baixo", clampConfidence(confidence - 0.05), "Sinal cosmético conservador."),
            oleosidade: createFinding("moderada", clampConfidence(confidence + 0.03), "Estimativa para orientar rotina."),
        },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        // Estas limitações acompanham sempre a resposta para impedir claims clínicos ou confiança excessiva.
        limitations: [
            "Resultado local conservador.",
            "Qualidade de luz, enquadramento e resolução podem afetar a análise.",
            "As fotografias não são usadas para aprendizagem de terceiros.",
        ],
    };
}

/**
 * Analisa fotografias com provider configurado e fallback local.
 *
 * @async
 * @function analyzeSkinPhotos
 * @param {{frontalPhoto?: object, perfilPhoto?: object}} input - Fotos já validadas.
 * @returns {Promise<object>} Resultado no contrato público da Orélle.
 */
export async function analyzeSkinPhotos(input) {
    const validInput = assertValidAnalysisPhotos(input);

    if (env.aiProviderMode !== "external") {
        return analyzeSkinPhotosLocally(validInput);
    }

    try {
        return await analyzeSkinPhotosExternally(validInput);
    } catch (err) {
        if (err instanceof AppError && err.statusCode < 500) {
            // Erros de input ou consentimento não são indisponibilidade do provider e não podem virar fallback silencioso.
            throw err;
        }

        // O fallback mantém a app utilizável e conserva limitações claras para o utilizador.
        const result = await analyzeSkinPhotosLocally(validInput);
        return {
            ...result,
            limitations: [
                ...result.limitations,
                "Provider configurado indisponível; foi usado fallback local.",
            ],
        };
    }
}
```

5. Explicação do código.

Este ficheiro preserva os helpers do provider local criados no `BK-MF1-06` e acrescenta apenas a decisão de dispatch entre modo local e modo externo. O service continua a importar `analyzeSkinPhotos` sem saber detalhes de Azure, TensorFlow ou outro fornecedor.

A validação comum exige `storageKey`, `mimeType` e `sizeBytes` nas duas fotografias antes de qualquer dispatch. Esses campos vêm depois de upload, consentimento, ownership e storage privado já terem sido tratados pelo backend; sem eles, a confiança técnica poderia ficar inválida. O modo externo tenta a chamada remota quando `AI_PROVIDER_MODE=external`, mas só falhas de provider (`5xx`, rede ou timeout) caem para a baseline local. Erros de input (`400`) continuam a falhar, para não esconder fotografias mal preparadas.

O aluno pode alterar textos cosméticos de `label` e `explanation` se mantiver o domínio Orélle e os limites de IA. Não deve remover a validação de metadados, a fronteira `analyzeSkinPhotosExternally` nem a limitação de fallback, porque isso quebraria segurança, transparência e compatibilidade com `BK-MF8-05`.

6. Validação do passo.

Com `AI_PROVIDER_MODE=external` e URL inválido, a análise deve responder por fallback local com limitação extra.

7. Cenário negativo/erro esperado.

Falha remota não deve devolver stack trace nem bloquear permanentemente o fluxo.

### Passo 5 - Preservar service de análise facial

1. Objetivo funcional do passo no contexto da app.

Confirmar que consentimento e fotografias continuam validados antes do provider.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/services/face-analysis.service.js`
    - REVER: `apps/api/src/services/face-secure-storage.service.js`
    - LOCALIZAÇÃO: import de `readEncryptedFacePhotoFile`, função auxiliar `preparePhotoForProvider` e função `createFaceAnalysisForUser`.

3. Instruções do que fazer.

Não movas validações de consentimento para o provider. O service deve continuar a validar antes, ler a fotografia protegida no backend e preparar `imageBase64` apenas para a chamada de análise.

4. Código completo, correto e integrado com a app final.

```js
import { readEncryptedFacePhotoFile } from "./face-secure-storage.service.js";

/**
 * Prepara uma fotografia privada para provider interno ou externo.
 *
 * @async
 * @function preparePhotoForProvider
 * @param {object} photo - Documento `FacePhoto` com `storageKey` e `encryption` selecionados.
 * @returns {Promise<{storageKey: string, mimeType: string, sizeBytes: number, imageBase64: string}>} Entrada privada temporária para provider.
 */
async function preparePhotoForProvider(photo) {
    const imageBuffer = await readEncryptedFacePhotoFile(photo);

    return {
        storageKey: photo.storageKey,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        // A imagem fica em memória só durante a análise; não é guardada nem enviada ao frontend.
        imageBase64: imageBuffer.toString("base64"),
    };
}

/**
 * Cria uma análise facial para o utilizador autenticado.
 *
 * @async
 * @function createFaceAnalysisForUser
 * @param {string} userId - Utilizador autenticado pela sessão HttpOnly.
 * @returns {Promise<object>} Análise pública sem fotografia, path interno ou chave.
 * @throws {AppError} Quando falta consentimento ativo ou par frontal/perfil.
 */
export async function createFaceAnalysisForUser(userId) {
    const consent = await FaceConsent.findOne({ userId, revokedAt: null });

    if (!consent) {
        throw new AppError(403, "Consentimento facial em falta");
    }

    // A pesquisa filtra por userId e status ativo para impedir analise de fotos apagadas ou alheias.
    const photos = await FacePhoto.find({ userId, status: "active" })
        .sort({ createdAt: -1 })
        .select("+storageKey +encryption");
    const frontalPhoto = latestByKind(photos, "frontal");
    const perfilPhoto = latestByKind(photos, "perfil");

    if (!frontalPhoto || !perfilPhoto) {
        throw new AppError(400, "Fotografias frontal e de perfil obrigatórias");
    }

    const result = await analyzeSkinPhotos({
        frontalPhoto: await preparePhotoForProvider(frontalPhoto),
        perfilPhoto: await preparePhotoForProvider(perfilPhoto),
    });

    // Só depois de consentimento e fotografias válidas é que a análise é persistida.
    const analysis = await FaceAnalysis.create({
        userId,
        photoIds: [frontalPhoto._id, perfilPhoto._id],
        consentId: consent._id,
        providerName: result.providerName,
        findings: result.findings,
        sources: result.sources,
        limitations: result.limitations,
    });

    return toFaceAnalysisResponse(analysis);
}
```

5. Explicação do código.

O service continua a ser a fronteira de segurança: sessão chega do controller, consentimento é obrigatório, fotografias pertencem ao utilizador e só depois o provider é chamado. A query seleciona `+storageKey +encryption` apenas dentro do backend para permitir leitura privada autorizada. `preparePhotoForProvider` usa o helper do `BK-MF6-07`, transforma os bytes em base64 em memória e não cria resposta pública, rota de download, URL assinada ou persistência nova.

A resposta pública devolve achados, fontes e limitações, não fotografias, base64, paths, IV, auth tag ou `storageKey`. Isto fecha a lacuna do adapter externo: o provider recebe conteúdo suficiente para analisar, mas a decisão de ownership e consentimento continua antes da chamada externa.

6. Validação do passo.

Tenta analisar sem consentimento e espera `403`. Tenta analisar sem fotografia de perfil e espera `400`. No teste do provider externo, confirma que `fetch` recebe `contentBase64` e que o body não contém `storageKey`.

7. Cenário negativo/erro esperado.

Provider remoto nunca pode receber fotografias sem consentimento ativo.

### Passo 6 - Mostrar limitações no frontend

1. Objetivo funcional do passo no contexto da app.

Comunicar transparência da análise ao utilizador.

2. Ficheiros envolvidos:
    - REVER: `apps/web/src/pages/FaceAnalysisPage.jsx`
    - LOCALIZAÇÃO: render de `analysis.limitations`.

3. Instruções do que fazer.

Garante que a UI mostra limitações devolvidas pela API.

4. Código completo, correto e integrado com a app final.

```jsx
{status === "success" && analysis && (
    <article>
        {/* A UI mostra limitações vindas da API; não inventa explicações nem claims clínicos. */}
        <p>{analysis.limitations.join(" ")}</p>
        <ul>
            {Object.entries(analysis.findings).map(([key, value]) => (
                <li key={key}>
                    <strong>{key}</strong>: {value.label} (
                    {Math.round(value.confidence * 100)}%)
                </li>
            ))}
        </ul>
    </article>
)}
```

5. Explicação do código.

O frontend não inventa explicação. Mostra limitações vindas do backend, incluindo fallback. Isto ajuda o utilizador a interpretar a análise como apoio cosmético e não como decisão absoluta.

6. Validação do passo.

Força fallback local e confirma que a limitação adicional aparece na UI.

7. Cenário negativo/erro esperado.

Se `limitations` estiver vazio, o teste do provider deve ser revisto antes de fechar o BK.

### Passo 7 - Testar fallback e resposta inválida

1. Objetivo funcional do passo no contexto da app.

Provar que a integração falha de forma controlada.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf7.external-ai-provider.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Testa o adapter sem configuração, a função principal com fallback e o payload externo minimizado. Executar cenários negativos obrigatórios (mínimo 3): provider externo sem configuração, URL HTTP externo, fotografia sem imagem preparada, resposta remota sem `findings` e timeout remoto.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf7.external-ai-provider.test.js
import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env.js";
import { analyzeSkinPhotosExternally } from "../src/providers/external-skin-analysis.provider.js";
import { analyzeSkinPhotos } from "../src/providers/skin-analysis.provider.js";

const frontalPhoto = {
    storageKey: "private/front.enc",
    mimeType: "image/png",
    sizeBytes: 1200,
    imageBase64: Buffer.from("frontal-test-image").toString("base64"),
};
const perfilPhoto = {
    storageKey: "private/profile.enc",
    mimeType: "image/png",
    sizeBytes: 1300,
    imageBase64: Buffer.from("perfil-test-image").toString("base64"),
};
const originalEnv = { ...env };

afterEach(() => {
    Object.assign(env, originalEnv);
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("BK-MF7-07 provider IA externo", () => {
    it("recusa provider externo sem configuração", async () => {
        env.aiProviderUrl = undefined;
        env.aiProviderKey = undefined;

        await expect(
            analyzeSkinPhotosExternally({ frontalPhoto, perfilPhoto }),
        ).rejects.toThrow("Provider de IA externo não configurado");
    });

    it("mantém contrato público no fallback local", async () => {
        env.aiProviderMode = "local";
        const result = await analyzeSkinPhotos({ frontalPhoto, perfilPhoto });

        // O contrato público mantém findings, sources e limitations para a UI.
        expect(result.providerName).toBe("local-skin-analysis-v1");
        expect(result.findings.skinType.label).toBeTruthy();
        expect(result.limitations.length).toBeGreaterThan(0);
    });

    it("envia imagem minimizada ao provider externo sem expor storageKey nem token no body", async () => {
        env.aiProviderUrl = "https://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({
                providerName: "external-test-provider",
                findings: {
                    skinType: { label: "mista", confidence: 0.72 },
                },
            }),
        });

        await analyzeSkinPhotosExternally({ frontalPhoto, perfilPhoto });

        const [, options] = fetchSpy.mock.calls[0];
        const body = JSON.parse(options.body);

        // O header autentica a API; o body fica minimizado e sem segredos.
        expect(options.headers.Authorization).toBe("Bearer secret-test-key");
        expect(body.photos[0].contentBase64).toBe(frontalPhoto.imageBase64);
        expect(body.photos[1].contentBase64).toBe(perfilPhoto.imageBase64);
        expect(JSON.stringify(body)).not.toContain("secret-test-key");
        expect(JSON.stringify(body)).not.toContain("storageKey");
        expect(JSON.stringify(body)).not.toContain("private/front.enc");
    });

    it("recusa URL HTTP externo antes de enviar imagem ou API key", async () => {
        env.aiProviderUrl = "http://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        const fetchSpy = vi.spyOn(globalThis, "fetch");

        // Dados biométricos e API key só podem sair para provider externo por HTTPS.
        await expect(
            analyzeSkinPhotosExternally({ frontalPhoto, perfilPhoto }),
        ).rejects.toThrow("Provider de IA externo deve usar HTTPS");

        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("recusa análise sem imagem preparada antes de chamar provider externo", async () => {
        env.aiProviderMode = "external";
        env.aiProviderUrl = "https://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        const fetchSpy = vi.spyOn(globalThis, "fetch");

        // A validação comum bloqueia payload sem imagem antes de qualquer chamada remota.
        await expect(
            analyzeSkinPhotos({
                frontalPhoto: {
                    storageKey: "private/front.enc",
                    mimeType: "image/png",
                    sizeBytes: 1200,
                },
                perfilPhoto,
            }),
        ).rejects.toThrow("Fotografias preparadas obrigatórias para provider externo");

        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("normaliza resposta remota sem findings em vez de quebrar a API", async () => {
        env.aiProviderUrl = "https://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ providerName: "external-test-provider" }),
        });

        const result = await analyzeSkinPhotosExternally({ frontalPhoto, perfilPhoto });

        // Respostas incompletas do provider remoto viram achados conservadores e previsíveis.
        expect(result.findings.skinType.label).toBe("indeterminado");
        expect(result.limitations.length).toBeGreaterThan(0);
    });

    it("normaliza timeout do provider externo como erro controlado", async () => {
        env.aiProviderUrl = "https://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        vi.useFakeTimers();
        vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
            return new Promise((_resolve, reject) => {
                // O mock simula o comportamento real do fetch quando o AbortController dispara.
                options.signal.addEventListener("abort", () => {
                    const abortError = new Error("aborted");
                    abortError.name = "AbortError";
                    reject(abortError);
                });
            });
        });

        const resultPromise = analyzeSkinPhotosExternally({ frontalPhoto, perfilPhoto });
        await vi.advanceTimersByTimeAsync(6_000);

        await expect(resultPromise).rejects.toThrow(
            "Provider de IA externo excedeu o tempo limite",
        );
    });
});
```

5. Explicação do código.

O primeiro teste prova que provider remoto sem configuração não avança silenciosamente. O segundo garante que o fallback local mantém o contrato público esperado pela UI. O terceiro fecha a fronteira de payload: o provider externo recebe conteúdo de imagem temporário, a API key vai no header e o body não contém segredo, `storageKey` nem path interno. O quarto teste fecha o guard de transporte seguro: URL HTTP externo falha antes de qualquer `fetch`. O quinto confirma que, mesmo em modo externo, fotografias sem `imageBase64` falham antes de qualquer chamada remota. O sexto prova que resposta remota sem `findings` normaliza para `indeterminado`. O sétimo teste confirma que timeout remoto vira erro controlado. As fotografias usadas no teste são metadados e base64 de teste, não ficheiros reais nem paths públicos.

6. Validação do passo.

Executa `npm --prefix apps/api test`.

7. Cenário negativo/erro esperado.

Se o provider remoto devolver formato inesperado, a normalização deve impedir crash e devolver limitações.

#### Expected results

- Sem configuração, provider externo falha com erro controlado.
- URL HTTP externo falha antes de enviar API key ou fotografia.
- Em modo local, análise usa `local-skin-analysis-v1`.
- Em modo externo indisponível, fallback local devolve limitação adicional.
- Em modo externo configurado, o provider recebe `contentBase64` temporário e não recebe `storageKey`.
- A API key é enviada apenas no header `Authorization`; o body e a resposta pública não incluem token.
- Resposta pública mantém `providerName`, `findings`, `sources` e `limitations`.
- Resposta remota sem `findings` normaliza achados como `indeterminado`.
- Fotografias continuam protegidas por consentimento e ownership.

#### Critérios de aceite

- Provider fica isolado em ficheiros `providers`.
- Chaves e URLs vêm de ambiente.
- Provider externo publicado usa HTTPS antes de receber imagem facial.
- Fallback é explícito.
- UI mostra limitações.
- Não há claims clínicos.
- Não há compra automática por recomendação.
- Handoff para `BK-MF8-05` mantém dados suficientes para explicar recomendações.
- Cenários negativos concluídos: mínimo `3`.

#### Validação final

Matriz mínima de testes por prioridade:

- `P1`: unit/integration do adapter externo + fallback local + mínimo 3 negativos concretos.
- `CORE-IA`: evidence técnica do contrato `providerName`, `findings`, `sources`, `limitations` e evidence de negócio para transparência da análise.

Evidência de testes por camada:

- Provider externo: sem `AI_PROVIDER_URL`/`AI_PROVIDER_KEY` devolve erro controlado `503`.
- Provider externo: `AI_PROVIDER_URL=http://ia.example.test/analyze` devolve erro controlado antes de `fetch`.
- Provider externo: request configurado contém API key só no header, contém `contentBase64` no body e não contém `storageKey`, path interno nem token no body/resposta pública.
- Provider externo: resposta remota sem `findings` devolve achados `indeterminado` sem crash.
- Provider local: metadados incompletos (`storageKey` sem `mimeType` ou `sizeBytes`) devolvem `400`.
- Service: consentimento em falta devolve `403` antes de chamar provider.
- Frontend: UI mostra `limitations` devolvidas pela API e não inventa diagnóstico.

Comandos finais:

- `rg -n "AI_PROVIDER_MODE|analyzeSkinPhotosExternally|contentBase64|providerName|limitations" apps/api/src apps/web/src`
- `npm --prefix apps/api test`
- `npm --prefix apps/web run build`
- Smoke manual de análise com provider local.
- [ ] Negativos: mínimo `3` cenários executados e registados em evidence.

Política de negativos:

- Provider externo sem configuração deve falhar com `503`.
- Fotografias sem `mimeType`, `sizeBytes` ou `imageBase64` devem falhar com `400`.
- URL HTTP externo deve falhar antes de enviar imagem ou API key.
- Payload enviado ao provider externo não pode conter `storageKey`, path interno nem token no body.
- Provider indisponível em modo externo deve usar fallback local com limitação explícita.
- Resposta remota sem `findings` deve normalizar achados como `indeterminado` sem crash.

#### Evidence para PR/defesa

- Teste de provider sem configuração.
- Teste de payload externo com `contentBase64` e sem `storageKey`.
- Teste de API key apenas no header e token ausente do body.
- Teste de URL HTTP externo recusado antes de `fetch`.
- Teste de fallback local.
- Teste negativo de imagem preparada em falta.
- Teste de resposta remota sem `findings`.
- Screenshot da UI com limitações.
- Nota técnica: provider isolado, consentimento preservado, sem ação automática de compra.

#### Handoff

O `BK-MF8-01` deve reforçar documentação modular destes providers. O `BK-MF8-05` deve usar `sources`, `limitations` e explicações dos findings para mostrar como a IA chegou às recomendações.

#### Changelog

- 2026-06-26: Guia reescrito para tutorial técnico linear, com adapter externo, configuração, fallback, limitações públicas e negativos de integração IA.
- 2026-06-27: Corrigido Passo 4 para preservar helpers e validação completa do provider local; reforçada validação final com matriz mínima, evidence por camada e negativos mínimos P1.
- 2026-06-27: Corrigida estrutura obrigatória da prompt ativa; reforçada validação comum antes do provider externo, normalização de timeout remoto e preservação do guard de `SESSION_SECRET` em `env.js`.
- 2026-06-27: Corrigida integração externa para receber `contentBase64` preparado no backend sem expor `storageKey`; `BK-MF8-05` ficou apenas como handoff futuro.
- 2026-06-27: Corrigido guard de transporte seguro do provider externo, clarificada a API key no header e acrescentada cobertura para URL HTTP e resposta remota sem `findings`.
