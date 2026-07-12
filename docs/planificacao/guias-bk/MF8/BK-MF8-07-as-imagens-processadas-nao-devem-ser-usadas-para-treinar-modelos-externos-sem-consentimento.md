# BK-MF8-07 - Minimização e consentimento dos dados enviados à OpenAI

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
- `last_updated`: `2026-07-11`

#### Objetivo

Fechar `RNF25`: a Orélle só envia à OpenAI dados necessários para a consulta cosmética autorizada e não autoriza a sua utilização para treino. Cada chamada exige consentimento v2 ativo, ownership, fotografias validadas, payload minimizado, `store: false`, cancelamento e auditoria sem conteúdo.

#### Importância

Consentir “análise facial” não autoriza todos os usos possíveis. O backend fixa a finalidade e controla exatamente o que sai: fotografias autorizadas, respostas/factos necessários, perfil cosmético mínimo e candidatos de catálogo filtrados. Nome, email, IDs pessoais/operacionais, cookies, paths, chaves e prompts internos não saem; apenas `productId`/`variantId` comerciais opacos da allowlist podem acompanhar os candidatos.

#### Scope-in

- Revalidar consentimento v2 antes e depois da chamada OpenAI.
- Recusar fotos com hard failure de qualidade antes do provider.
- Construir payload por allowlist e remover identificadores pessoais/operacionais, preservando apenas IDs comerciais candidatos.
- Desencriptar fotografias apenas em memória durante a operação.
- Usar `store: false`, deadline, limite incremental e `AbortSignal`.
- Cancelar jobs queued/processing após revogação.
- Auditar tipo de operação, decisão e request ID sem conteúdo sensível.
- Incluir jobs, fotografias e outputs derivados em privacidade/eliminação.

#### Scope-out

- Não criar consentimento para treino.
- Não aceitar prompt livre, URL de fotografia ou provider escolhidos pelo browser.
- Não guardar payload OpenAI completo em jobs, logs ou auditoria.
- Não prometer retenção zero só por usar `store: false`; documentar as limitações aplicáveis do serviço.
- Não enviar dados clínicos nem apresentar diagnóstico.

#### Estado antes e depois

- Antes: os dados podem ser minimizados de forma informal ou apenas na UI.
- Depois: existe uma única fronteira backend, testada, que autoriza, minimiza, envia e audita cada operação.

#### Pre-requisitos

- `BK-MF7-01`: consentimento v2 e propósitos separados.
- `BK-MF7-07`: provider OpenAI-only e jobs duráveis.
- Fotografias normalizadas WebP, cifradas e associadas ao titular.
- `RNF11`, `RNF12`, `RNF25` e `RF13`–`RF15`.

#### Glossário

- Minimização: enviar apenas dados indispensáveis ao objetivo atual.
- Purpose limitation: impedir reutilização fora da finalidade aceite.
- `store: false`: pedido para não armazenar a Response como recurso recuperável; não substitui consentimento nem política de retenção.
- AAD: contexto que liga ciphertext ao titular/campo correto.
- Audit log minimizado: prova de operação sem imagem, resposta ou prompt.

#### Conceitos teóricos essenciais

Cifra em repouso protege a base, mas os bytes precisam de existir em memória para envio. Por isso, o código deve encurtar a janela de vida, não criar ficheiros temporários públicos e propagar cancelamento. A minimização acontece antes do provider, não depois de receber a resposta.

#### Arquitetura do BK

- Consentimento: `apps/api/src/models/face-consent.model.js`.
- Fotos: `apps/api/src/services/face-photo.service.js` e secure storage.
- Qualidade: normalização Sharp + preflight local do frontend.
- Orquestração: `apps/api/src/services/ai-consultation.service.js`.
- Provider: `apps/api/src/providers/openai-responses.provider.js`.
- Provenance: análises, perguntas e relatórios guardam apenas provider/modelo/request ID e versões; acessos humanos às fotografias usam `biometric-audit.service.js`.
- Endpoint: `POST /api/ai-consultation/sessions/:sessionId/analysis`.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/constants/face-consent.js`
- EDITAR: `apps/api/src/services/face-photo.service.js`
- EDITAR: `apps/api/src/services/ai-consultation.service.js`
- EDITAR: `apps/api/src/providers/openai-responses.provider.js`
- EDITAR: `apps/api/src/services/biometric-audit.service.js`
- EDITAR: `apps/api/src/services/account-erasure.service.js`
- CRIAR/EDITAR: `apps/api/tests/mf8.image-purpose-limit.test.js`
- CRIAR/EDITAR: `apps/api/tests/face-consent.replset.integration.test.js`

#### Tutorial técnico linear

### Passo 1 - Fixar a política no servidor

1. Objetivo: impedir que o body altere finalidade/retenção.
2. Ficheiro: constantes de consentimento.
3. Código:

```js
/** Política fechada para fotografias e contexto da consulta. */
export const FACE_ANALYSIS_CONSENT_PURPOSE = "analise_facial_cosmetica";
export const FACE_IMAGE_PROVIDER_RETENTION =
    "processamento_imediato_sem_aprendizagem_terceiros";
export const FACE_IMAGE_PURPOSE_POLICY = Object.freeze({
    purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
    retention: FACE_IMAGE_PROVIDER_RETENTION,
    modelLearningAllowed: false,
});
```

Explicação do código: estes valores não vêm do frontend e acompanham todos os handlers.

Validação: tentativa de os substituir no body não muda a política.

Cenário negativo: `modelLearningAllowed: true` é rejeitado antes de ler bytes.

### Passo 2 - Revalidar consentimento no job

1. Objetivo: fechar a corrida entre enfileirar e executar.
2. Ficheiro: `ai-consultation.service.js`.
3. Regra: consulta v2 ativa, notice atual, purpose OpenAI e titular da sessão/fotos.

```js
/** Falha fechado se a decisão mudou enquanto o job aguardava. */
export async function assertCurrentOpenAiConsent({ userId, session }) {
    const consent = await FaceConsent.findOne({
        userId,
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        version: "face-analysis-v2",
        revokedAt: null,
    }).session(session);
    const providerConsent = consent?.externalProviderConsent;
    if (
        consent?.purposes?.openAiAnalysis !== true ||
        !providerConsent ||
        providerConsent.revokedAt ||
        providerConsent.provider !== "openai"
    ) {
        throw new AppError(403, "OPENAI_CONSENT_REQUIRED");
    }
    assertFaceConsentAllowsConfiguredProvider(consent);
    return consent;
}
```

Explicação do código: chama antes de decifrar e novamente antes de persistir resultado.

Validação: revogação durante provider faz rollback/cancela o job.

Cenário negativo: consentimento antigo ou revogado produz zero chamadas de rede.

### Passo 3 - Aplicar qualidade antes da OpenAI

1. Objetivo: não enviar fotografia tecnicamente recusada.
2. Ficheiros: upload/normalização e consulta.
3. Hard failures: formato/resolução, rosto ausente/múltiplo, pose incompatível, luz/exposição e blur. Warnings exigem confirmação.

```js
if (photos.some((photo) => photo.quality?.status === "fail")) {
    throw new AppError(
        422,
        "As fotografias não cumprem a qualidade técnica mínima",
        { code: "FACE_PHOTO_QUALITY_FAILED" },
    );
}
const hasWarnings = photos.some(
    (photo) => photo.quality?.status === "warning",
);
if (hasWarnings && !acknowledgePhotoWarnings) {
    throw new AppError(
        409,
        "Confirma os avisos de qualidade antes de iniciar a análise.",
        { code: "PHOTO_WARNINGS_CONFIRMATION_REQUIRED" },
    );
}
```

Explicação do código: métricas do browser ajudam a UI, mas o backend repete validações técnicas.

Validação: rejeição técnica não invoca provider.

Cenário negativo: MediaPipe indisponível não bloqueia tudo; o backend mantém as verificações próprias.

### Passo 4 - Construir payload por allowlist

1. Objetivo: remover PII e IDs pessoais/operacionais antes do provider, mantendo apenas `productId`/`variantId` allowlisted.
2. Ficheiro: builder de input OpenAI.
3. Código:

```js
/** Devolve apenas contexto cosmético aprovado para a operação. */
export function buildOpenAiConsultationInput({ goals, facts, profile, candidates }) {
    return {
        goals: { primary: goals.primary, secondary: goals.secondary },
        facts: pickAllowedFacts(facts),
        profile: pick(profile, ["skinType", "allergies", "avoidIngredients", "budgetCents"]),
        candidates: candidates.slice(0, 15).map(toMinimizedCandidate),
    };
}
```

Explicação do código: não inclui nome, email, IDs de utilizador/sessão/fotografia/consentimento, storage key ou texto livre não autorizado. A única exceção de identificadores é a lista opaca de `productId`/`variantId` dos candidatos comerciais allowlisted, necessária para a OpenAI devolver escolhas que o backend volta a validar.

Validação: snapshot do payload usa candidatos conhecidos e no máximo 15.

Cenário negativo: chave desconhecida ou prompt injection não atravessa a allowlist.

### Passo 5 - Ler fotografias apenas em memória

1. Objetivo: decifrar o par exato usado pela análise sem criar URL pública.
2. Ficheiro: secure storage/face photo service.
3. Regra: ownership → consentimento → leitura privada → decifra com AAD → uso → libertar referências.

```js
const frontalBytes = await readDecryptedOwnedPhoto({ userId, photoId, kind: "frontal" });
try {
    return await operation(frontalBytes);
} finally {
    // Não guardar o Buffer em cache, job, erro ou audit log.
    frontalBytes.fill(0);
}
```

Explicação do código: limpar o Buffer reduz exposição, sem prometer remoção perfeita da memória gerida.

Validação: nenhum ficheiro temporário ou path público é criado.

Cenário negativo: foto de outro titular devolve `403` antes de decifrar.

### Passo 6 - Enviar com limites e `store: false`

1. Objetivo: restringir retenção e cancelar I/O.
2. Ficheiro: provider OpenAI.
3. Corpo inclui modelo configurado, `store: false`, input multimodal e JSON Schema; o fetch usa endpoint fixo, `redirect: "error"`, deadline total e leitura incremental até ao limite.

```js
const requestBody = {
    model: config.analysisModel,
    store: false,
    input: minimizedMultimodalInput,
    text: { format: structuredOutputSchema },
};
```

Explicação do código: não registar `requestBody`. Persistir apenas provenance sanitizada devolvida pelo provider.

Validação: spy prova `store: false` e cancelamento do reader ao exceder o limite.

Cenário negativo: timeout, redirect ou body grande deixa o job retomável sem output parcial.

### Passo 7 - Guardar provenance e reagir à revogação

1. Objetivo: provar qual execução produziu cada recurso sem copiar conteúdo sensível.
2. Ficheiros: análises/turnos/relatórios, jobs e auditoria de acessos humanos.
3. Campos permitidos nos recursos OpenAI: provider, modelo pedido/efetivo, request ID, versões de prompt/schema e tentativas. `AiJob` guarda apenas referências, estado e erro sanitizado. Fotografias, respostas, prompt, candidatos completos e erro bruto são proibidos.

```js
await cancelAiJobsForUser(userId, {
    session: mongoSession,
    now: revokedAt,
});
```

Explicação do código: revogar cancela jobs ainda sem commit. `BiometricAccessLog` não recebe uma ação OpenAI inventada; usa o enum fechado apenas para acessos como `VIEW_RESOURCE` de uma fotografia por consultor com grant válido. A redaction continua obrigatória nos erros.

Validação: dump/log não contém campos cosméticos em claro.

Cenário negativo: audit falhado numa fronteira transacional impede confirmar a operação sensível.

### Passo 8 - Testar finalidade e minimização

1. Objetivo: provar positivos/negativos sem chave nem imagens reais.
2. Ficheiros: testes de purpose, consent e provider.
3. Comandos:

```bash
npm --prefix apps/api test -- tests/mf8.image-purpose-limit.test.js
npm --prefix apps/api test -- tests/face-consent.replset.integration.test.js
```

Explicação do código: o transport injetado existe apenas em teste e captura o payload sanitizado.

Validação: consentimento, quality gate, minimização, `store: false`, cancelamento e audit.

Cenário negativo: sem consentimento, foto cruzada e revogação durante operação fazem zero persistências.

Executar cenarios negativos obrigatorios (minimo 3): consentimento ausente; ownership cruzado; fotografia rejeitada. Acrescenta revogação concorrente e resposta excessiva.

#### Expected results

- Só dados consentidos/minimizados chegam à OpenAI.
- Nenhum identificador pessoal/operacional, segredo ou path sai da aplicação; a única exceção são `productId`/`variantId` comerciais opacos da allowlist.
- Revogação bloqueia/cancela trabalho futuro.
- A aplicação não autoriza treino e documenta honestamente limitações de retenção.

#### Critérios de aceite

- [ ] Consentimento v2 revalidado no momento do job e antes do commit.
- [ ] Hard failure de foto produz zero chamadas OpenAI.
- [ ] Payload por allowlist, no máximo 15 candidatos, sem PII/IDs pessoais e apenas com IDs comerciais candidatos necessários.
- [ ] `store: false`, deadline/abort, limite de corpo e audit minimizado.
- [ ] Evidencia de testes por camada: unit payload/policy + integração consent/job/storage + contrato provider.
- [ ] Cenarios negativos concluidos: minimo `3`.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P0 | unit | policy e payload minimizado |
| P0 | integração | consentimento/revogação/storage/ownership |
| P0 | provider | `store: false`, abort e limite |
| P0 | privacidade | logs/jobs/dump sem conteúdo sensível |

#### Validação final

- [ ] Negativos: minimo `3` cenarios executados e registados.
- [ ] Testes normais sem internet, créditos ou imagens reais.
- [ ] Live smoke ausente fica `SKIP`/`BLOQUEADO`, nunca prova indireta.

#### Evidence para PR/defesa

- Payload capturado e sanitizado sem PII/IDs.
- Prova de zero provider call nos negativos prévios.
- Prova de cancelamento/revogação e audit minimizado.

#### Handoff

O `BK-MF8-08` pode iniciar a consulta dinâmica com fotografias e contexto cujo uso foi autorizado e minimizado.

## Bloco pedagogico

### Objetivo

Compreender que consentimento, minimização, cifra e retenção são controlos complementares.

### Pre-requisitos

- RGPD básico, Buffer, AES-GCM/AAD, `fetch` e `AbortSignal`.

### Erros comuns

- Enviar o documento Mongoose inteiro.
- Registar o body para “debug”.
- Tratar `store: false` como garantia de zero retenção.

### Check de compreensao

- [ ] Sei listar exatamente os dados permitidos.
- [ ] Sei provar que a fotografia é recusada antes da rede.

## Bloco operacional

### Entrada

Consentimento v2, par normalizado, sessão própria e job válido.

### Passos

Autorizar → quality gate → minimizar → decifrar em memória → enviar/cancelar → validar → auditar.

### Validacao

Executar testes determinísticos de purpose, ownership, payload e abort.

### Handoff

Boundary OpenAI seguro para a conversa de 5–8 perguntas.

## Criterios de aceite

- Finalidade e minimização impostas no backend.
- Evidencia de testes por camada presente.
- Cenarios negativos concluidos: minimo `3`.

## Evidence para PR/defesa

Guardar apenas asserts e metadados sanitizados; nunca payload multimodal ou chave.

#### Changelog

- `2026-07-11`: guia alinhado a consentimento v2, qualidade, minimização OpenAI-only, `store: false`, cancelamento e limitações honestas.
