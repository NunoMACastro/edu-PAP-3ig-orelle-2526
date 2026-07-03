# BK-MF8-07 - As imagens processadas não devem ser usadas para treinar modelos externos sem consentimento

## Header
- `doc_id`: `GUIA-BK-MF8-07`
- `bk_id`: `BK-MF8-07`
- `macro`: `MF8`
- `owner`: `Izelicks`
- `apoio`: `Daniel Bulica`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF7-01, BK-MF7-07`
- `rf_rnf`: `RNF25`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-08`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-07-as-imagens-processadas-nao-devem-ser-usadas-para-treinar-modelos-externos-sem-consentimento.md`
- `last_updated`: `2026-07-02`

#### Objetivo

Neste BK vais limitar o uso de fotografias faciais à finalidade cosmética aceite pelo cliente e impedir que um provider de terceiros receba imagens para aprendizagem de modelos sem consentimento separado.

#### Importância

Fotografias faciais são dados sensíveis. A Orélle pode processá-las para análise cosmética porque o cliente deu consentimento explícito para essa finalidade, mas esse consentimento não autoriza automaticamente reutilização por modelos de terceiros. Esta fronteira tem de existir no backend, porque é o backend que conhece a sessão autenticada, o consentimento ativo, as fotografias privadas e o provider configurado.

Este BK fecha `RNF25` e reforça o trabalho do `BK-MF7-01` e do `BK-MF7-07`: primeiro foi criado consentimento explícito, depois foi isolado o provider externo, e agora o envio de imagem passa a transportar finalidade, retenção e uma negação explícita de aprendizagem por terceiros.

#### Scope-in

- Centralizar a finalidade autorizada para análise facial cosmética.
- Consultar consentimento ativo pela finalidade correta antes de processar imagens.
- Preparar fotografias cifradas apenas no backend e em memória temporária.
- Enviar ao provider externo um payload minimizado, sem `storageKey`, `consentId`, tokens ou paths internos.
- Bloquear pedidos que indiquem finalidade diferente da análise facial cosmética.
- Bloquear qualquer flag que permita aprendizagem por modelos de terceiros.
- Preservar o fallback local do `BK-MF7-07`.
- Criar teste Vitest material para finalidade, payload minimizado e bloqueios de privacidade.

#### Scope-out

- Não criar fluxo de consentimento separado para aprendizagem por modelos de terceiros.
- Não criar novo endpoint de análise facial.
- Não expor fotografias por URL pública.
- Não guardar imagem em claro fora do processamento em memória.
- Não alterar checkout, pagamentos, carrinho ou stock.
- Não alterar fairness de recomendações; isso pertence ao `BK-MF8-06`.
- Não criar chat livre ou sessão guiada; isso pertence ao `BK-MF8-08`.

#### Estado antes e depois

- Antes: a app tem consentimento facial, fotografias protegidas, análise cosmética local e fronteira para provider externo.
- Depois: a análise facial exige consentimento com a finalidade `analise_facial_cosmetica`, o provider externo recebe apenas payload minimizado e a política bloqueia reutilização de imagens por modelos de terceiros.

#### Pre-requisitos

- `BK-MF6-07`: fotografias e relatórios guardados de forma cifrada.
- `BK-MF7-01`: consentimento explícito para análise facial.
- `BK-MF7-07`: provider externo isolado, fallback local e variáveis `AI_PROVIDER_MODE`, `AI_PROVIDER_URL`, `AI_PROVIDER_KEY`.
- `BK-MF8-06`: fronteira ética para recomendações, sem misturar atributos sensíveis com decisão cosmética.

#### Glossário

- Finalidade: motivo específico autorizado para tratar uma fotografia facial.
- Consentimento ativo: consentimento sem `revokedAt`, associado ao utilizador autenticado.
- Payload minimizado: corpo do pedido externo com apenas os campos necessários.
- Provider de terceiros: serviço remoto configurado para análise cosmética.
- Retenção: regra comunicada ao provider sobre uso imediato e não reutilização das imagens.
- DTO público: resposta devolvida à interface sem segredos, paths internos ou metadados privados.

#### Conceitos teóricos essenciais

Consentimento não é genérico. Na Orélle, o cliente aceita a análise facial cosmética para obter relatório, recomendações e acompanhamento da rotina. Isso não equivale a aceitar que imagens sejam usadas por modelos de terceiros para outro fim. Por isso, a finalidade tem de ser um valor técnico explícito e reutilizado em service, provider e testes.

A proteção deve estar no backend. O frontend pode explicar a política ao utilizador, mas não pode ser a única barreira: uma chamada direta à API, um teste ou uma integração futura poderia ignorar a interface. O service `face-analysis.service.js` deve consultar `FaceConsent` com `purpose: "analise_facial_cosmetica"` e o provider deve rejeitar qualquer tentativa de mudar a finalidade.

O provider externo não precisa de saber `storageKey`, `consentId`, paths privados, token de sessão ou chave da API dentro do body. Ele recebe apenas bytes temporários em base64, `mimeType`, `sizeBytes`, `purpose`, `retention` e `modelLearningAllowed: false`. A chave do provider fica no header `Authorization`, nunca no JSON.

O fallback local continua importante. Se `AI_PROVIDER_MODE` não for `external`, a app usa a baseline local. Mesmo assim, o input passa pela mesma validação de finalidade para impedir que código futuro reintroduza reutilização indevida.

Antes de implementares, evita estes erros comuns:

- Aceitar qualquer `purpose` vindo do request do cliente.
- Consultar `FaceConsent` apenas por `userId`, sem filtrar a finalidade.
- Enviar `storageKey`, `consentId`, caminho local, cookie ou token no payload externo.
- Colocar a chave do provider no body do pedido.
- Usar HTTP externo para transportar fotografia facial ou chave da API.
- Transformar a análise cosmética em avaliação clínica.
- Adicionar uma flag positiva de aprendizagem de modelos sem fluxo documental e consentimento separado.

No final do BK deves conseguir responder a estas perguntas de compreensão:

- Porque é que `purpose` deve ser fixado pelo backend e não pelo frontend?
- Que diferença existe entre consentimento para análise facial e autorização para outro uso por modelos de terceiros?
- Que campos nunca devem sair para o provider externo?
- Porque é que o teste precisa de provar bloqueio antes do `fetch`?
- Como é que `BK-MF8-08` beneficia desta fronteira ao criar a sessão guiada?

#### Arquitetura do BK

- `bk_id`: `BK-MF8-07`
- `flow_id`: `FLOW-MF8-NO-TRAINING`
- `requisitos`: `RNF25`
- `dependências`: `BK-MF7-01, BK-MF7-07`
- `tema técnico`: governação de imagens e finalidade de consentimento
- `destino dos alunos`: `apps/api`
- `endpoint existente`: `POST /api/face-analysis`
- `modelo consumido`: `FaceConsent`
- `service editado`: `face-analysis.service.js`
- `provider editado`: `skin-analysis.provider.js`
- `adapter editado`: `external-skin-analysis.provider.js`
- `constante criada`: `face-consent.js`
- `teste novo`: `mf8.image-purpose-limit.test.js`
- `decisão CANONICO`: `RNF25` exige que imagens processadas não sejam usadas para treinar modelos externos sem consentimento.
- `decisão CANONICO`: `BK-MF8-07` depende do consentimento explícito e do provider externo já isolado.
- `decisão DERIVADO`: a app não ativa novo consentimento de aprendizagem; bloqueia essa possibilidade até existir contrato próprio.
- `decisão DERIVADO`: o provider recebe `modelLearningAllowed: false` e retenção imediata para tornar a política testável.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/src/constants/face-consent.js`
- EDITAR: `apps/api/src/services/face-analysis.service.js`
- EDITAR: `apps/api/src/providers/skin-analysis.provider.js`
- EDITAR: `apps/api/src/providers/external-skin-analysis.provider.js`
- CRIAR: `apps/api/tests/mf8.image-purpose-limit.test.js`
- REVER: `apps/api/src/models/face-consent.model.js`
- REVER: `apps/api/src/models/face-photo.model.js`
- REVER: `apps/api/src/services/face-secure-storage.service.js`
- REVER: `apps/api/src/config/env.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato RNF25 e dependências

1. Objetivo funcional do passo no contexto da app.

Confirmar que este BK fecha apenas a política de uso de imagens e que depende do consentimento e do provider externo já criados.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/BACKLOG-MVP.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
    - REVER: `docs/planificacao/guias-bk/MF7/BK-MF7-01-consentimento-explicito-para-analise-facial-rgpd.md`
    - REVER: `docs/planificacao/guias-bk/MF7/BK-MF7-07-suporte-para-api-de-ia-externa-ex-azure-face-api-ou-tensorflow.md`

3. Instruções do que fazer.

Confirma estes pontos no teu apontamento técnico:

- `CANONICO`: `RNF25` pertence a privacidade e é requisito `Must`.
- `CANONICO`: `BK-MF8-07` é `P0`, sprint `S12`, `Reforco`, owner `Izelicks`, apoio `Daniel Bulica`.
- `CANONICO`: o BK depende de `BK-MF7-01` e `BK-MF7-07`.
- `DERIVADO`: o backend deve bloquear qualquer finalidade que não seja análise facial cosmética.
- `DERIVADO`: sem contrato documental próprio, a app não permite aprendizagem por modelos de terceiros.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. Esta confirmação impede que a implementação invente um novo produto, endpoint ou fluxo de consentimento. O BK é uma fronteira de privacidade dentro do fluxo de análise facial existente.

6. Validação do passo.

Executa:

```bash
rg -n "RNF25|BK-MF8-07|BK-MF7-01|BK-MF7-07" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/BACKLOG-MVP.md docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md
```

7. Cenário negativo/erro esperado.

Se `RNF25` não estiver ligado ao `BK-MF8-07`, pára a implementação e regista o bloqueio no relatório da equipa.

### Passo 2 - Centralizar a finalidade autorizada

1. Objetivo funcional do passo no contexto da app.

Criar uma constante única para a finalidade de análise facial e para a retenção comunicada ao provider externo.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/constants/face-consent.js`
    - REVER: `apps/api/src/models/face-consent.model.js`

3. Instruções do que fazer.

Cria o ficheiro abaixo. Ele não chama base de dados e não lê request do cliente; apenas centraliza valores que serão usados pelo service, provider e testes.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/constants/face-consent.js
/**
 * Contratos de finalidade para fotografias faciais.
 *
 * Estes valores são reutilizados por service, provider e testes para impedir
 * strings divergentes entre consentimento, payload externo e DTO público.
 */

/**
 * Finalidade aceite para processar fotografia facial na Orélle.
 *
 * @type {"analise_facial_cosmetica"}
 */
export const FACE_ANALYSIS_CONSENT_PURPOSE = "analise_facial_cosmetica";

/**
 * Finalidade sensível que a app não ativa neste BK.
 *
 * @type {"aprendizagem_modelos_terceiros"}
 */
export const THIRD_PARTY_MODEL_LEARNING_PURPOSE =
    "aprendizagem_modelos_terceiros";

/**
 * Retenção enviada ao provider externo para limitar uso das imagens.
 *
 * @type {"processamento_imediato_sem_aprendizagem_terceiros"}
 */
export const FACE_IMAGE_PROVIDER_RETENTION =
    "processamento_imediato_sem_aprendizagem_terceiros";

/**
 * Política pública mínima que pode ser reutilizada em testes e DTOs.
 *
 * @type {{purpose: string, retention: string, modelLearningAllowed: boolean}}
 */
export const FACE_IMAGE_PURPOSE_POLICY = Object.freeze({
    purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
    retention: FACE_IMAGE_PROVIDER_RETENTION,
    // A flag é sempre falsa porque este BK não cria consentimento separado para aprendizagem por terceiros.
    modelLearningAllowed: false,
});
```

5. Explicação do código.

`FACE_ANALYSIS_CONSENT_PURPOSE` deve coincidir com o valor por defeito do modelo `FaceConsent`. Ao importar a constante nos services, evitas bugs por strings escritas de forma diferente.

`THIRD_PARTY_MODEL_LEARNING_PURPOSE` existe para testes negativos e para deixar claro o que está bloqueado. O ficheiro não cria autorização nova; apenas dá nome técnico à finalidade que não é permitida neste BK.

`FACE_IMAGE_PURPOSE_POLICY` torna a resposta testável: finalidade fixa, retenção imediata e `modelLearningAllowed: false`.

6. Validação do passo.

Executa:

```bash
rg -n "FACE_ANALYSIS_CONSENT_PURPOSE|FACE_IMAGE_PURPOSE_POLICY" apps/api/src/constants/face-consent.js apps/api/src/models/face-consent.model.js
```

7. Cenário negativo/erro esperado.

Se o modelo `FaceConsent` tiver outra finalidade por defeito, alinha primeiro o modelo com o contrato do `BK-MF7-01` antes de avançar.

### Passo 3 - Exigir consentimento pela finalidade correta

1. Objetivo funcional do passo no contexto da app.

Garantir que a análise facial só começa se existir consentimento ativo para `analise_facial_cosmetica`.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/face-analysis.service.js`
    - REVER: `apps/api/src/services/face-secure-storage.service.js`
    - REVER: `apps/api/src/models/face-photo.model.js`

3. Instruções do que fazer.

Substitui o service de análise facial pelo ficheiro completo abaixo. Ele preserva o orçamento de performance, lê fotografias cifradas através do storage seguro e passa finalidade fixa ao provider.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/face-analysis.service.js
/**
 * Service de análise facial cosmética.
 *
 * A análise consome consentimento ativo, fotografias privadas cifradas e uma
 * política explícita de finalidade antes de chamar provider local ou externo.
 */
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../constants/face-consent.js";
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { analyzeSkinPhotos } from "../providers/skin-analysis.provider.js";
import { readEncryptedFacePhotoFile } from "./face-secure-storage.service.js";
import {
    assertPerformanceBudgetActive,
    FACE_ANALYSIS_BUDGET_MS,
    FACE_ANALYSIS_OPERATION,
    runWithPerformanceBudget,
} from "./performance-budget.service.js";

export { FACE_ANALYSIS_BUDGET_MS };

/**
 * Encontra a fotografia ativa mais recente de um tipo.
 *
 * @function latestByKind
 * @param {object[]} photos - Fotografias ordenadas por data descrescente.
 * @param {"frontal"|"perfil"} kind - Tipo pretendido.
 * @returns {object|undefined} Fotografia mais recente.
 */
function latestByKind(photos, kind) {
    return photos.find((photo) => photo.kind === kind);
}

/**
 * Converte análise para resposta pública sem metadados privados.
 *
 * @function toFaceAnalysisResponse
 * @param {object} analysis - Documento Mongoose ou mock equivalente.
 * @returns {object} DTO seguro para frontend.
 */
function toFaceAnalysisResponse(analysis) {
    return {
        id: analysis._id.toString(),
        providerName: analysis.providerName,
        findings: analysis.findings,
        sources: analysis.sources,
        limitations: analysis.limitations,
        performance: analysis.performance,
        status: analysis.status,
        createdAt: analysis.createdAt,
        imageUse: {
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
            modelLearningAllowed: false,
        },
    };
}

/**
 * Prepara uma fotografia cifrada para provider interno ou externo.
 *
 * @async
 * @function preparePhotoForProvider
 * @param {object} photo - Documento `FacePhoto` com `storageKey` e `encryption` selecionados.
 * @returns {Promise<{storageKey: string, mimeType: string, sizeBytes: number, imageBase64: string}>} Entrada temporária para provider.
 */
async function preparePhotoForProvider(photo) {
    const imageBuffer = await readEncryptedFacePhotoFile(photo);

    return {
        storageKey: photo.storageKey,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        // A imagem fica em memória apenas durante a chamada ao provider e nunca entra no DTO público.
        imageBase64: imageBuffer.toString("base64"),
    };
}

/**
 * Cria uma análise para o utilizador autenticado.
 *
 * @async
 * @function createFaceAnalysisForUser
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} Análise criada e minimizada.
 */
export async function createFaceAnalysisForUser(userId) {
    const { value: analysis, durationMs, budgetMs } =
        await runWithPerformanceBudget({
            operation: FACE_ANALYSIS_OPERATION,
            budgetMs: FACE_ANALYSIS_BUDGET_MS,
            task: async ({ signal }) => {
                const consent = await FaceConsent.findOne({
                    userId,
                    purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
                    revokedAt: null,
                });

                if (!consent) {
                    throw new AppError(403, "Consentimento facial em falta");
                }

                const photos = await FacePhoto.find({
                    userId,
                    status: "active",
                })
                    .sort({ createdAt: -1 })
                    .select("+storageKey +encryption +encryption.iv +encryption.authTag");

                const frontalPhoto = latestByKind(photos, "frontal");
                const perfilPhoto = latestByKind(photos, "perfil");

                if (!frontalPhoto || !perfilPhoto) {
                    throw new AppError(
                        400,
                        "Fotografias frontal e de perfil obrigatórias",
                    );
                }

                const result = await analyzeSkinPhotos({
                    frontalPhoto: await preparePhotoForProvider(frontalPhoto),
                    perfilPhoto: await preparePhotoForProvider(perfilPhoto),
                    requestedPurpose: FACE_ANALYSIS_CONSENT_PURPOSE,
                    allowModelLearning: false,
                });

                assertPerformanceBudgetActive(signal);

                const createdAnalysis = await FaceAnalysis.create({
                    userId,
                    photoIds: [frontalPhoto._id, perfilPhoto._id],
                    consentId: consent._id,
                    providerName: result.providerName,
                    findings: result.findings,
                    sources: result.sources,
                    limitations: result.limitations,
                });

                assertPerformanceBudgetActive(signal);

                return toFaceAnalysisResponse(createdAnalysis);
            },
        });

    return {
        ...analysis,
        performance: {
            durationMs,
            budgetMs,
        },
    };
}
```

5. Explicação do código.

A query a `FaceConsent.findOne` passa a filtrar `purpose: FACE_ANALYSIS_CONSENT_PURPOSE`. Isto evita aceitar um consentimento ativo que exista para outra finalidade.

`preparePhotoForProvider` lê o ficheiro cifrado no backend e converte para base64 apenas para a chamada ao provider. O DTO final nunca devolve `storageKey`, `encryption`, `consentId` ou ids das fotografias.

`analyzeSkinPhotos` recebe `requestedPurpose` e `allowModelLearning: false`. Estes campos não vêm do frontend; são definidos pelo backend a partir do contrato do BK.

6. Validação do passo.

Executa:

```bash
rg -n "purpose: FACE_ANALYSIS_CONSENT_PURPOSE|allowModelLearning: false|storageKey" apps/api/src/services/face-analysis.service.js
```

7. Cenário negativo/erro esperado.

Sem consentimento ativo para a finalidade cosmética, `createFaceAnalysisForUser` deve lançar `Consentimento facial em falta` antes de ler provider externo.

### Passo 4 - Propagar a política no provider local e externo

1. Objetivo funcional do passo no contexto da app.

Validar a política antes de escolher provider, mantendo o fallback local e impedindo que a fronteira externa receba finalidade insegura.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/providers/skin-analysis.provider.js`
    - EDITAR: `apps/api/src/providers/external-skin-analysis.provider.js`
    - REVER: `apps/api/src/config/env.js`

3. Instruções do que fazer.

Primeiro substitui `skin-analysis.provider.js`. Depois cria ou substitui `external-skin-analysis.provider.js`. Se `env.aiProviderMode`, `env.aiProviderUrl` e `env.aiProviderKey` ainda não existirem, volta ao `BK-MF7-07` antes deste passo.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/providers/skin-analysis.provider.js
/**
 * Provider local isolado de análise cosmética da pele.
 *
 * O dispatcher valida finalidade e fotografias antes de escolher entre a
 * baseline local e o adapter externo configurado no BK-MF7-07.
 */
import { env } from "../config/env.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../constants/face-consent.js";
import { AppError } from "../middlewares/error.middleware.js";
import { analyzeSkinPhotosExternally } from "./external-skin-analysis.provider.js";

const MIN_CONFIDENCE = 0.45;
const MAX_CONFIDENCE = 0.62;

/**
 * Cria um finding estruturado.
 *
 * @function createFinding
 * @param {string} label - Etiqueta do achado.
 * @param {number} confidence - Confiança entre 0 e 1.
 * @param {string} explanation - Explicação curta.
 * @returns {{label: string, confidence: number, explanation: string}} Finding.
 */
function createFinding(label, confidence, explanation) {
    return { label, confidence, explanation };
}

/**
 * Limita um valor numérico ao intervalo de confiança permitido.
 *
 * @function clampConfidence
 * @param {number} value - Valor candidato.
 * @returns {number} Confiança normalizada entre limites conservadores.
 */
function clampConfidence(value) {
    return Math.min(MAX_CONFIDENCE, Math.max(MIN_CONFIDENCE, value));
}

/**
 * Calcula uma confiança técnica estável a partir dos metadados de upload.
 *
 * @function calculateTechnicalConfidence
 * @param {object} frontalPhoto - Fotografia frontal validada.
 * @param {object} perfilPhoto - Fotografia de perfil validada.
 * @returns {number} Confiança baixa a moderada.
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
 * Valida que a análise usa apenas a finalidade cosmética autorizada.
 *
 * @function assertImagePurposeAllowed
 * @param {{requestedPurpose?: string, allowModelLearning?: boolean}} input - Política recebida do service.
 * @returns {void}
 * @throws {AppError} Quando a finalidade não é permitida.
 */
function assertImagePurposeAllowed(input) {
    if (input.requestedPurpose !== FACE_ANALYSIS_CONSENT_PURPOSE) {
        throw new AppError(403, "Finalidade de imagem facial não autorizada");
    }

    if (input.allowModelLearning === true) {
        // Nenhum provider deve receber imagem com autorização positiva de aprendizagem neste BK.
        throw new AppError(403, "Uso de imagem facial por modelos de terceiros não autorizado");
    }
}

/**
 * Valida fotografias antes de qualquer análise local ou externa.
 *
 * @function assertValidAnalysisPhotos
 * @param {{frontalPhoto?: object, perfilPhoto?: object, requestedPurpose?: string, allowModelLearning?: boolean}|undefined} input - Fotografias escolhidas pelo backend.
 * @returns {object} Fotografias e política validadas.
 * @throws {AppError} Quando falta storage privado validado.
 */
function assertValidAnalysisPhotos(input) {
    const {
        frontalPhoto,
        perfilPhoto,
        requestedPurpose = FACE_ANALYSIS_CONSENT_PURPOSE,
        allowModelLearning = false,
    } = input ?? {};

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

    const validInput = {
        frontalPhoto,
        perfilPhoto,
        requestedPurpose,
        allowModelLearning,
    };

    assertImagePurposeAllowed(validInput);

    return validInput;
}

/**
 * Analisa fotografias faciais já validadas com baseline local.
 *
 * @async
 * @function analyzeSkinPhotosLocally
 * @param {{frontalPhoto?: object, perfilPhoto?: object}} input - Fotos escolhidas pelo backend.
 * @returns {Promise<object>} Resultado estruturado da análise.
 */
async function analyzeSkinPhotosLocally(input) {
    const { frontalPhoto, perfilPhoto } = input;
    const confidence = calculateTechnicalConfidence(frontalPhoto, perfilPhoto);

    return {
        providerName: "local-skin-analysis-v1",
        findings: {
            skinType: createFinding(
                "mista",
                confidence,
                "Estimativa cosmética inicial produzida por baseline local controlado.",
            ),
            acne: createFinding(
                "baixo",
                clampConfidence(confidence - 0.02),
                "Sinal cosmético conservador para acne visível, sem valor clínico.",
            ),
            manchas: createFinding(
                "baixo",
                clampConfidence(confidence - 0.04),
                "Sinal cosmético conservador para manchas, adequado apenas a recomendações gerais.",
            ),
            rugas: createFinding(
                "baixo",
                clampConfidence(confidence - 0.05),
                "Sinal cosmético conservador para rugas, sem finalidade clínica.",
            ),
            oleosidade: createFinding(
                "moderada",
                clampConfidence(confidence + 0.03),
                "Estimativa cosmética inicial para orientar rotina e relatório.",
            ),
        },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: [
            "Resultado cosmético de provider local controlado.",
            "Qualidade de luz, enquadramento e resolução podem afetar a análise.",
            "A imagem é usada apenas para a finalidade cosmética aceite.",
        ],
    };
}

/**
 * Analisa fotografias com o provider configurado e fallback local explícito.
 *
 * @async
 * @function analyzeSkinPhotos
 * @param {{frontalPhoto?: object, perfilPhoto?: object, requestedPurpose?: string, allowModelLearning?: boolean}} input - Fotos já validadas pelo backend.
 * @returns {Promise<object>} Resultado estruturado da análise.
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
            // Erros de finalidade ou input são falhas de contrato e não podem virar fallback silencioso.
            throw err;
        }

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

```js
// apps/api/src/providers/external-skin-analysis.provider.js
/**
 * Adapter para provider externo de análise cosmética da pele.
 *
 * A fronteira externa recebe apenas bytes temporários preparados no backend.
 * O payload fixa finalidade, retenção e negação de aprendizagem por terceiros.
 */
import { env } from "../config/env.js";
import {
    FACE_ANALYSIS_CONSENT_PURPOSE,
    FACE_IMAGE_PROVIDER_RETENTION,
} from "../constants/face-consent.js";
import { AppError } from "../middlewares/error.middleware.js";

const EXTERNAL_PROVIDER_TIMEOUT_MS = 6_000;
const ALLOWED_FINDINGS = ["skinType", "acne", "manchas", "rugas", "oleosidade"];
const LOCAL_PROVIDER_HOSTS = new Set(["localhost", "127.0.0.1"]);

/**
 * Bloqueia finalidades que não pertencem à análise facial cosmética.
 *
 * @function assertExternalImagePurposePolicy
 * @param {{requestedPurpose?: string, allowModelLearning?: boolean}|undefined} input - Política recebida do service.
 * @returns {void}
 * @throws {AppError} Quando a finalidade ou a flag de aprendizagem não são aceites.
 */
export function assertExternalImagePurposePolicy(input = {}) {
    if (input.requestedPurpose !== FACE_ANALYSIS_CONSENT_PURPOSE) {
        throw new AppError(403, "Finalidade de imagem facial não autorizada");
    }

    if (input.allowModelLearning === true) {
        // O bloqueio acontece antes de preparar o request remoto e antes de chamar fetch.
        throw new AppError(403, "Uso de imagem facial por modelos de terceiros não autorizado");
    }
}

/**
 * Confirma que as fotografias foram preparadas pelo backend antes do provider.
 *
 * @function assertExternalAnalysisPayloadInput
 * @param {object|undefined} input - Fotografias preparadas e política de finalidade.
 * @returns {object} Fotografias validadas para request externo.
 * @throws {AppError} Quando falta conteúdo temporário ou metadados mínimos.
 */
function assertExternalAnalysisPayloadInput(input) {
    const { frontalPhoto, perfilPhoto } = input ?? {};

    assertExternalImagePurposePolicy(input);

    if (
        !frontalPhoto?.mimeType ||
        !perfilPhoto?.mimeType ||
        !frontalPhoto?.sizeBytes ||
        !perfilPhoto?.sizeBytes ||
        !frontalPhoto?.imageBase64 ||
        !perfilPhoto?.imageBase64
    ) {
        throw new AppError(
            400,
            "Fotografias preparadas obrigatórias para provider externo",
        );
    }

    return { frontalPhoto, perfilPhoto };
}

/**
 * Constrói uma fotografia minimizada para o provider remoto.
 *
 * @function buildProviderPhoto
 * @param {"frontal"|"perfil"} kind - Tipo de fotografia facial.
 * @param {{mimeType: string, sizeBytes: number, imageBase64: string}} photo - Fotografia preparada.
 * @returns {{kind: string, mimeType: string, sizeBytes: number, contentBase64: string}} Fotografia para request externo.
 */
function buildProviderPhoto(kind, photo) {
    return {
        kind,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        // Só o conteúdo temporário segue para o provider; storageKey e paths internos ficam na API.
        contentBase64: photo.imageBase64,
    };
}

/**
 * Constrói o payload externo com finalidade e retenção explícitas.
 *
 * @function buildExternalAnalysisPayload
 * @param {object} input - Fotografias preparadas e política de finalidade.
 * @returns {{photos: object[], purpose: string, retention: string, modelLearningAllowed: boolean}} Payload remoto minimizado.
 */
export function buildExternalAnalysisPayload(input) {
    const { frontalPhoto, perfilPhoto } = assertExternalAnalysisPayloadInput(input);

    return {
        photos: [
            buildProviderPhoto("frontal", frontalPhoto),
            buildProviderPhoto("perfil", perfilPhoto),
        ],
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        retention: FACE_IMAGE_PROVIDER_RETENTION,
        modelLearningAllowed: false,
    };
}

/**
 * Valida transporte seguro antes de enviar imagem facial ou API key.
 *
 * @function assertSecureExternalProviderUrl
 * @param {string|undefined} value - Valor de `AI_PROVIDER_URL`.
 * @returns {string} URL seguro para chamada `fetch`.
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
        throw new AppError(503, "Provider de IA externo deve usar HTTPS");
    }

    return providerUrl.href;
}

/**
 * Normaliza um finding remoto sem permitir confiança extrema ou texto excessivo.
 *
 * @function normalizeFinding
 * @param {object|undefined} value - Finding devolvido pelo provider remoto.
 * @returns {{label: string, confidence: number, explanation: string}} Finding público.
 */
function normalizeFinding(value) {
    const confidence = Number(value?.confidence ?? 0);

    return {
        label: String(value?.label ?? "indeterminado").slice(0, 80),
        confidence: Math.min(0.95, Math.max(0.1, confidence)),
        explanation: String(
            value?.explanation ?? "Resultado cosmético sem detalhe adicional.",
        ).slice(0, 240),
    };
}

/**
 * Converte resposta remota no contrato público da Orélle.
 *
 * @function normalizeExternalResult
 * @param {object|undefined} data - JSON devolvido pelo provider remoto.
 * @returns {{providerName: string, findings: object, sources: string[], limitations: string[]}} Resultado normalizado.
 */
function normalizeExternalResult(data) {
    const findings = {};

    for (const key of ALLOWED_FINDINGS) {
        findings[key] = normalizeFinding(data?.findings?.[key]);
    }

    return {
        providerName: String(data?.providerName ?? "external-skin-provider").slice(
            0,
            80,
        ),
        findings,
        sources: [
            "fotografia_frontal",
            "fotografia_perfil",
            "provider_remoto_configurado",
        ],
        limitations: [
            "Análise cosmética assistida por provider configurado.",
            "Resultado não substitui avaliação profissional.",
            "Qualidade de luz, enquadramento e resolução podem afetar a análise.",
            "As fotografias são usadas apenas para a finalidade cosmética aceite.",
        ],
    };
}

/**
 * Chama o provider remoto de análise cosmética.
 *
 * @async
 * @function analyzeSkinPhotosExternally
 * @param {object} input - Fotografias já autorizadas e preparadas.
 * @returns {Promise<object>} Resultado normalizado para a API Orélle.
 * @throws {AppError} Quando configuração, transporte, timeout ou provider falham.
 */
export async function analyzeSkinPhotosExternally(input) {
    if (!env.aiProviderUrl || !env.aiProviderKey) {
        throw new AppError(503, "Provider de IA externo não configurado");
    }

    const providerUrl = assertSecureExternalProviderUrl(env.aiProviderUrl);
    const controller = new AbortController();
    const timeout = setTimeout(
        () => controller.abort(),
        EXTERNAL_PROVIDER_TIMEOUT_MS,
    );

    try {
        const response = await fetch(providerUrl, {
            method: "POST",
            headers: {
                // A API key autentica o servidor Orélle; nunca entra no body nem no frontend.
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
            throw new AppError(
                504,
                "Provider de IA externo excedeu o tempo limite",
            );
        }

        throw new AppError(502, "Provider de IA externo indisponível");
    } finally {
        clearTimeout(timeout);
    }
}
```

5. Explicação do código.

`skin-analysis.provider.js` passa a validar a finalidade antes de escolher provider. Se alguém tentar ativar `allowModelLearning`, a chamada falha como erro de contrato e não faz fallback silencioso.

`buildExternalAnalysisPayload` é exportado de propósito para testes. Ele monta o JSON que sai da API e torna verificável que não existem `storageKey`, `consentId`, paths privados ou chave do provider no body.

`assertSecureExternalProviderUrl` mantém a regra do `BK-MF7-07`: HTTPS é obrigatório para provider externo, exceto `localhost` e `127.0.0.1` em desenvolvimento controlado.

6. Validação do passo.

Executa:

```bash
rg -n "assertExternalImagePurposePolicy|buildExternalAnalysisPayload|modelLearningAllowed|FACE_IMAGE_PROVIDER_RETENTION" apps/api/src/providers apps/api/src/constants
```

7. Cenário negativo/erro esperado.

Se `allowModelLearning: true` chegar ao provider externo, a função deve lançar erro antes de chamar `fetch`.

### Passo 5 - Criar teste material para RNF25

1. Objetivo funcional do passo no contexto da app.

Provar que a política de finalidade bloqueia pedidos inseguros e que o payload externo fica minimizado.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.image-purpose-limit.test.js`

3. Instruções do que fazer.

Cria o teste abaixo. Ele usa Vitest, altera `env` apenas em memória e restaura mocks no fim de cada teste.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.image-purpose-limit.test.js
/**
 * Testes BK-MF8-07 para finalidade e minimização de imagens faciais.
 *
 * A suite prova RNF25 na fronteira de provider externo: finalidade fixa,
 * bloqueio de aprendizagem por terceiros e payload sem metadados privados.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env.js";
import {
    FACE_ANALYSIS_CONSENT_PURPOSE,
    FACE_IMAGE_PROVIDER_RETENTION,
    THIRD_PARTY_MODEL_LEARNING_PURPOSE,
} from "../src/constants/face-consent.js";
import {
    analyzeSkinPhotosExternally,
    assertExternalImagePurposePolicy,
    buildExternalAnalysisPayload,
} from "../src/providers/external-skin-analysis.provider.js";

const frontalPhoto = {
    storageKey: "private/front.enc",
    consentId: "consent-private-id",
    mimeType: "image/png",
    sizeBytes: 1200,
    imageBase64: Buffer.from("frontal-test-image").toString("base64"),
};
const perfilPhoto = {
    storageKey: "private/profile.enc",
    consentId: "consent-private-id",
    mimeType: "image/png",
    sizeBytes: 1300,
    imageBase64: Buffer.from("perfil-test-image").toString("base64"),
};
const validInput = {
    frontalPhoto,
    perfilPhoto,
    requestedPurpose: FACE_ANALYSIS_CONSENT_PURPOSE,
    allowModelLearning: false,
};
const originalEnv = { ...env };

afterEach(() => {
    Object.assign(env, originalEnv);
    vi.restoreAllMocks();
});

describe("BK-MF8-07 - limite de finalidade de imagem", () => {
    it("constrói payload externo com finalidade, retenção e imagem minimizada", () => {
        const payload = buildExternalAnalysisPayload(validInput);
        const serializedPayload = JSON.stringify(payload);

        expect(payload.purpose).toBe(FACE_ANALYSIS_CONSENT_PURPOSE);
        expect(payload.retention).toBe(FACE_IMAGE_PROVIDER_RETENTION);
        expect(payload.modelLearningAllowed).toBe(false);

        // O provider recebe bytes temporários, mas não recebe chaves internas da API.
        expect(payload.photos[0].contentBase64).toBe(frontalPhoto.imageBase64);
        expect(serializedPayload).not.toContain("storageKey");
        expect(serializedPayload).not.toContain("consentId");
        expect(serializedPayload).not.toContain("private/front.enc");
    });

    it("bloqueia finalidade diferente da análise facial cosmética", () => {
        expect(() =>
            assertExternalImagePurposePolicy({
                ...validInput,
                requestedPurpose: THIRD_PARTY_MODEL_LEARNING_PURPOSE,
            }),
        ).toThrow("Finalidade de imagem facial não autorizada");
    });

    it("bloqueia aprendizagem por terceiros antes de chamar fetch", async () => {
        env.aiProviderUrl = "https://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        const fetchSpy = vi.spyOn(globalThis, "fetch");

        await expect(
            analyzeSkinPhotosExternally({
                ...validInput,
                allowModelLearning: true,
            }),
        ).rejects.toThrow("Uso de imagem facial por modelos de terceiros não autorizado");

        // A falha acontece antes de transportar fotografia ou chave para fora da API.
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("não coloca API key nem metadados privados no body externo", async () => {
        env.aiProviderUrl = "https://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({
                providerName: "external-test-provider",
                findings: {
                    skinType: {
                        label: "mista",
                        confidence: 0.7,
                        explanation: "Resultado cosmético remoto.",
                    },
                },
            }),
        });

        const result = await analyzeSkinPhotosExternally(validInput);
        const [, options] = fetchSpy.mock.calls[0];
        const body = JSON.parse(options.body);
        const serializedBody = JSON.stringify(body);

        expect(result.providerName).toBe("external-test-provider");
        expect(options.headers.Authorization).toBe("Bearer secret-test-key");
        expect(body.modelLearningAllowed).toBe(false);
        expect(serializedBody).not.toContain("secret-test-key");
        expect(serializedBody).not.toContain("storageKey");
        expect(serializedBody).not.toContain("consent-private-id");
        expect(serializedBody).not.toContain("private/profile.enc");
    });

    it("recusa imagem não preparada antes de enviar pedido remoto", async () => {
        env.aiProviderUrl = "https://ia.example.test/analyze";
        env.aiProviderKey = "secret-test-key";
        const fetchSpy = vi.spyOn(globalThis, "fetch");

        await expect(
            analyzeSkinPhotosExternally({
                ...validInput,
                frontalPhoto: {
                    storageKey: "private/front.enc",
                    mimeType: "image/png",
                    sizeBytes: 1200,
                },
            }),
        ).rejects.toThrow("Fotografias preparadas obrigatórias para provider externo");

        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
```

5. Explicação do código.

O primeiro teste prova o caminho positivo: payload com finalidade fixa, retenção explícita e `modelLearningAllowed: false`.

O segundo e o terceiro teste provam negativos materiais de `RNF25`: finalidade indevida e tentativa de ativar aprendizagem por terceiros.

O quarto teste confirma que a API key fica no header e que o body não transporta metadados privados. O quinto teste impede enviar fotografia sem `imageBase64`, que é o sinal de preparação segura no backend.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- mf8.image-purpose-limit.test.js
```

7. Cenário negativo/erro esperado.

Se removeres `modelLearningAllowed: false` ou permitires `allowModelLearning: true`, pelo menos um teste deve falhar.

### Passo 6 - Validar integração com MF7 e handoff para MF8-08

1. Objetivo funcional do passo no contexto da app.

Confirmar que este BK consome corretamente o provider externo do `BK-MF7-07` e entrega uma fronteira segura para a sessão guiada do `BK-MF8-08`.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/config/env.js`
    - REVER: `apps/api/src/providers/skin-analysis.provider.js`
    - REVER: `apps/api/src/providers/external-skin-analysis.provider.js`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-08-sessao-guiada-de-avaliacao-cosmetica-com-ia.md`

3. Instruções do que fazer.

Confirma que:

- `AI_PROVIDER_MODE=local` continua a usar provider local.
- `AI_PROVIDER_MODE=external` usa adapter externo com HTTPS.
- A policy é validada antes de `fetch`.
- `BK-MF8-08` pode iniciar sessão guiada sem criar nova regra de finalidade de imagem.
- O DTO de análise continua sem `storageKey`, `consentId`, `encryption`, cookie, token ou path privado.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. A integração já foi materializada nos passos anteriores. Aqui estás a confirmar que não criaste contrato paralelo e que a próxima feature consome a fronteira existente.

6. Validação do passo.

Executa:

```bash
rg -n "AI_PROVIDER_MODE|analyzeSkinPhotosExternally|FACE_ANALYSIS_CONSENT_PURPOSE|modelLearningAllowed" apps/api/src docs/planificacao/guias-bk/MF8/BK-MF8-08-sessao-guiada-de-avaliacao-cosmetica-com-ia.md
```

7. Cenário negativo/erro esperado.

Se encontrares outro valor de finalidade hardcoded fora da constante, corrige antes de fechar o BK.

### Passo 7 - Executar validação final e evidence

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com comandos reais, negativos e prova objetiva para revisão técnica.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - ATUALIZAR: evidence técnica do PR ou relatório da equipa

3. Instruções do que fazer.

Executa os comandos abaixo, guarda o resultado observado e associa cada prova a `RNF25`.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix apps/api test -- mf8.image-purpose-limit.test.js
npm --prefix apps/api test
npm --prefix apps/web run build
rg -n "FACE_ANALYSIS_CONSENT_PURPOSE|modelLearningAllowed|storageKey|consentId" apps/api/src apps/api/tests/mf8.image-purpose-limit.test.js
git diff --check
```

5. Explicação do código.

O primeiro comando valida o BK de forma focal. O segundo confirma que a suite existente continua verde. O build do frontend garante que a app continua compilável, mesmo sem mexer na UI. O `rg` final ajuda a rever se `storageKey` e `consentId` aparecem apenas em locais internos ou em testes negativos, nunca no payload público.

6. Validação do passo.

A evidence deve conter:

- comando executado;
- diretoria;
- exit code;
- resumo do output;
- impacto em `RNF25`;
- negativos observados.

7. Cenário negativo/erro esperado.

Se `npm --prefix apps/api test` falhar por `listen EPERM` em ambiente bloqueado, volta a executar num ambiente que permita sockets locais e regista a primeira falha como bloqueio ambiental.

#### Expected results

- `FaceConsent.findOne` filtra `purpose: FACE_ANALYSIS_CONSENT_PURPOSE`.
- `face-analysis.service.js` prepara imagens no backend e não devolve metadados privados no DTO.
- `skin-analysis.provider.js` bloqueia finalidade indevida antes de escolher provider.
- `external-skin-analysis.provider.js` exporta `buildExternalAnalysisPayload` e `assertExternalImagePurposePolicy` para teste.
- O payload externo contém `purpose`, `retention`, `modelLearningAllowed: false` e fotografias minimizadas.
- O payload externo não contém `storageKey`, `consentId`, path privado, cookie, token ou chave do provider no body.
- `apps/api/tests/mf8.image-purpose-limit.test.js` prova caminho positivo e pelo menos três negativos.
- `BK-MF8-08` recebe handoff sem precisar de inventar nova política de finalidade de imagem.
- Executar cenarios negativos obrigatorios (minimo 3) com resultado controlado.

#### Critérios de aceite

- Entrega funcional específica de `As imagens processadas não devem ser usadas para treinar modelos externos sem consentimento` validada contra `RNF25`.
- `apps/api/src/constants/face-consent.js` criado com finalidade, retenção e política pública.
- `apps/api/src/services/face-analysis.service.js` consulta consentimento pela finalidade correta.
- `apps/api/src/providers/skin-analysis.provider.js` valida finalidade antes de provider local ou externo.
- `apps/api/src/providers/external-skin-analysis.provider.js` minimiza payload e bloqueia aprendizagem por terceiros antes de `fetch`.
- `apps/api/tests/mf8.image-purpose-limit.test.js` cobre positivo, finalidade indevida, flag proibida, body sem segredos e imagem não preparada.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).
- ### Matriz minima de testes por prioridade

- Testes por prioridade respeitados: `P0` exige unit + integration + e2e + 3 negativos; `P1` exige unit/integration + 2 negativos; `P2` exige teste focal + 1 negativo.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisão técnica e defesa PAP.

#### Validação final

- [ ] Smoke: `POST /api/face-analysis` continua a criar análise quando há consentimento e fotografias válidas.
- [ ] Unit/focal: `npm --prefix apps/api test -- mf8.image-purpose-limit.test.js`.
- [ ] Integração backend: `npm --prefix apps/api test`.
- [ ] Build frontend: `npm --prefix apps/web run build`.
- [ ] Negativos: minimo `3` cenarios com resultado controlado; finalidade indevida, flag proibida, imagem não preparada e payload sem metadados privados.
- [ ] Segurança/privacidade: sem `storageKey`, `consentId`, token, cookie, path privado ou chave de provider no body externo.
- [ ] Handoff: `BK-MF8-08` documentado como consumidor da fronteira de finalidade.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite`, `## Evidence para PR/defesa`.

#### Evidence para PR/defesa

- `pr`: referência de commit/PR e resumo técnico da alteração.
- `proof_tecnico`: teste focal `mf8.image-purpose-limit.test.js`, suite backend e build frontend.
- `proof_negativos`: finalidade diferente recusada; `allowModelLearning: true` recusado antes de `fetch`; imagem sem `imageBase64` recusada; body externo sem `storageKey`, `consentId` e chave do provider.
- `proof_privacidade`: confirmação de que DTO e payload externo não expõem dados sensíveis.
- `proof_handoff`: nota curta a explicar como `BK-MF8-08` consome finalidade, retenção e minimização já definidas.

#### Handoff

- Próximo BK recomendado: `BK-MF8-08`
- O `BK-MF8-08` pode criar sessão guiada e respostas estruturadas sem voltar a definir política de uso de fotografias.
- A sessão guiada deve consumir apenas a análise cosmética resultante, nunca `storageKey`, imagem bruta, chave de provider ou finalidade alternativa.
- Risco a vigiar: qualquer novo provider, modelo ou automação que trate imagens deve reutilizar `FACE_ANALYSIS_CONSENT_PURPOSE` e bloquear aprendizagem por terceiros até existir consentimento separado e documentado.

#### Changelog

- `2026-07-02`: guia corrigido para fechar `ORELLE-MF8-BK07-P1-001`, com código completo para finalidade, service, providers, teste focal de `RNF25`, negativos materiais e handoff para `BK-MF8-08`.
- `2026-06-30`: guia revisto para a estrutura tutorial MF8, com caminhos públicos `apps/...`, contrato de evidence, negativos mínimos e handoff explícito.
