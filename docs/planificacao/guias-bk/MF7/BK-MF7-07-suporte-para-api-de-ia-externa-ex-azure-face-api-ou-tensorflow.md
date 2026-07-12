# BK-MF7-07 - Integração OpenAI-only resiliente e degradável

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
- `last_updated`: `2026-07-11`

> O slug conserva o título histórico para não quebrar links. O contrato atual é exclusivamente OpenAI e usa apenas o fluxo `/api/ai-consultation/*`.

#### Objetivo

Implementar `RNF18` com a OpenAI Responses API, Structured Outputs validados localmente, cancelamento real, retries limitados, fallback para outro modelo OpenAI e jobs duráveis. A aplicação deve arrancar sem chave: conta, catálogo e loja continuam disponíveis, mas novas operações de IA ficam indisponíveis de forma explícita.

Não existe resultado cosmético local para esconder uma falha. A única degradação funcional permitida é o banco canónico para escolher a pergunta seguinte; análise, relatório e imagem falhados ficam `failed_retryable`.

#### Importância

Este boundary impede que configuração, rede ou respostas inválidas produzam dados inventados. Também separa a tarefa probabilística da OpenAI das decisões autoritativas do backend: consentimento, ownership, catálogo, restrições, preços e vouchers continuam locais.

#### Scope-in

- Configurar chave, modelos, versões e timeouts OpenAI.
- Expor capability degradada sem revelar segredos.
- Usar endpoint fixo, `store: false`, `AbortSignal` e limite de resposta.
- Validar JSON Schema e semântica antes de aceitar uma resposta.
- Repetir uma falha transitória do modelo primário e tentar um fallback OpenAI.
- Enfileirar `analyze_photos`, `select_next_question`, `generate_report` e `generate_makeup_preview` em MongoDB.
- Persistir modelo pedido/efetivo, request ID, versões e tentativas.

#### Scope-out

- Não criar um segundo provider, modo local de produto ou resposta cosmética sintética.
- Não aceitar URL, modelo, chave ou prompt livre vindos do browser.
- Não chamar endpoints diretos antigos de análise/recomendação.
- Não transformar resultados em diagnóstico médico.

#### Estado antes e depois

- Antes: a integração pode estar acoplada ao request HTTP ou a contratos antigos.
- Depois: o runtime é OpenAI-only, degradável sem chave, retomável após falha/restart e verificável sem internet através de transport injetado apenas em `NODE_ENV=test`.

#### Pre-requisitos

- `RNF18`, `RNF25` e o contrato de consentimento do `BK-MF7-01`.
- API Express/Mongoose em `apps/api` e tratamento global de erros.
- MongoDB replica set para claim/lease e transações.

#### Glossário

- Structured Output: resposta obrigada a cumprir um JSON Schema fechado.
- Deadline: limite total que inclui retries e espera por `Retry-After`.
- Fallback OpenAI: segunda configuração de modelo, nunca outro sistema.
- Job durável: operação persistida com claim, lease, heartbeat e replay idempotente.
- Modo degradado: aplicação funcional sem novas operações IA.

#### Conceitos teóricos essenciais

O timeout deve cancelar o `fetch`; devolver apenas um erro ao browser não interrompe o tratamento remoto. `store: false` reduz retenção do pedido na API, mas não substitui consentimento nem minimização. Structured Outputs reduzem ambiguidade, porém o backend ainda valida regras semânticas, por exemplo IDs permitidos e objetivos pedidos.

#### Arquitetura do BK

- Configuração: `apps/api/src/config/env.js` e `apps/api/.env.example`.
- Provider: `apps/api/src/providers/openai-responses.provider.js`.
- Jobs: `apps/api/src/models/ai-job.model.js` e `apps/api/src/services/ai-job.service.js`.
- Capability: `GET /api/ai-consultation/capabilities`.
- Fluxo: `/api/ai-consultation/sessions` e operações da sessão.
- Testes: provider, configuração negativa, jobs, retry/fallback e isolamento de credenciais.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/config/env.js`
- EDITAR: `apps/api/.env.example`
- CRIAR/EDITAR: `apps/api/src/providers/openai-responses.provider.js`
- CRIAR/EDITAR: `apps/api/src/models/ai-job.model.js`
- CRIAR/EDITAR: `apps/api/src/services/ai-job.service.js`
- EDITAR: `apps/api/src/routes/ai-consultation.routes.js`
- CRIAR/EDITAR: `apps/api/tests/openai-consultation-core-v2.test.js`
- CRIAR/EDITAR: `apps/api/tests/ai-job-v2.test.js`

#### Tutorial técnico linear

### Passo 1 - Fixar configuração OpenAI

1. Objetivo: centralizar configuração, sem ler `process.env` nos services.
2. Ficheiros: `apps/api/src/config/env.js` e `apps/api/.env.example`.
3. Implementação:

```js
// Excerto do objeto `env` já existente; não cries um leitor paralelo.
{
    openAiApiKey: readOptionalEnvValue(process.env.OPENAI_API_KEY),
    openAiAnalysisModel:
        readOptionalEnvValue(process.env.OPENAI_ANALYSIS_MODEL) ??
        DEFAULT_OPENAI_ANALYSIS_MODEL,
    openAiFallbackModel:
        readOptionalEnvValue(process.env.OPENAI_FALLBACK_MODEL) ??
        DEFAULT_OPENAI_FALLBACK_MODEL,
    openAiImageModel:
        readOptionalEnvValue(process.env.OPENAI_IMAGE_MODEL) ??
        DEFAULT_OPENAI_IMAGE_MODEL,
    openAiImagePromptVersion:
        readOptionalEnvValue(process.env.OPENAI_IMAGE_PROMPT_VERSION) ??
        DEFAULT_OPENAI_IMAGE_PROMPT_VERSION,
    openAiImageSchemaVersion:
        readOptionalEnvValue(process.env.OPENAI_IMAGE_SCHEMA_VERSION) ??
        DEFAULT_OPENAI_IMAGE_SCHEMA_VERSION,
    openAiNoticeVersion:
        readOptionalEnvValue(process.env.OPENAI_NOTICE_VERSION) ??
        DEFAULT_OPENAI_NOTICE_VERSION,
    openAiPromptVersion:
        readOptionalEnvValue(process.env.OPENAI_PROMPT_VERSION) ??
        DEFAULT_OPENAI_PROMPT_VERSION,
    openAiSchemaVersion:
        readOptionalEnvValue(process.env.OPENAI_SCHEMA_VERSION) ??
        DEFAULT_OPENAI_SCHEMA_VERSION,
    openAiQuestionTimeoutMs: parseBoundedPositiveInteger(
        process.env.OPENAI_QUESTION_TIMEOUT_MS,
        30_000,
        { name: "OPENAI_QUESTION_TIMEOUT_MS", min: 1_000, max: 120_000 },
    ),
    openAiAnalysisTimeoutMs: parseBoundedPositiveInteger(
        process.env.OPENAI_ANALYSIS_TIMEOUT_MS,
        60_000,
        { name: "OPENAI_ANALYSIS_TIMEOUT_MS", min: 1_000, max: 180_000 },
    ),
    openAiReportTimeoutMs: parseBoundedPositiveInteger(
        process.env.OPENAI_REPORT_TIMEOUT_MS,
        60_000,
        { name: "OPENAI_REPORT_TIMEOUT_MS", min: 1_000, max: 180_000 },
    ),
    openAiImageTimeoutMs: parseBoundedPositiveInteger(
        process.env.OPENAI_IMAGE_TIMEOUT_MS,
        150_000,
        { name: "OPENAI_IMAGE_TIMEOUT_MS", min: 1_000, max: 300_000 },
    ),
}
```

Explicação do código: os defaults e versões pertencem ao servidor. `parseBoundedPositiveInteger` rejeita valores vazios, negativos ou fora das janelas indicadas; nunca registes a chave. A capability verifica ainda `DATA_ENCRYPTION_KEY` com pelo menos 32 caracteres fora de teste, porque uma operação IA não pode ficar “disponível” sem storage sensível seguro.

Validação: configuração sem chave não impede o arranque.

Cenário negativo: modelo vazio ou timeout inválido falha a configuração antes de criar jobs.

### Passo 2 - Expor capability degradada

1. Objetivo: permitir que a UI desative apenas “Nova consulta”.
2. Ficheiros: controller/routes de `ai-consultation`.
3. Contrato público:

```js
/** Reutiliza a única decisão de readiness da integração. */
export function getAiConsultationCapabilities() {
    return getOpenAiCapabilities(env);
}
```

Explicação do código: não dupliques `Boolean(apiKey)`. `getOpenAiCapabilities` exige chave (ou transport estritamente de teste), modelos, notice e storage cifrado; devolve `available`, `degraded`, `AI_NOT_CONFIGURED|AI_STORAGE_NOT_CONFIGURED`, versões e quotas sem conhecer ou expor o segredo.

Validação: `GET /api/ai-consultation/capabilities` responde `200` nos dois estados.

Cenário negativo: iniciar análise sem chave devolve `503 AI_NOT_CONFIGURED` e não cria job.

### Passo 3 - Enviar Responses com retenção mínima

1. Objetivo: usar endpoint fixo e schema fechado.
2. Ficheiro: `apps/api/src/providers/openai-responses.provider.js`.
3. Núcleo do pedido:

```js
const client = createOpenAiResponsesClient();
const response = await client.requestStructured({
    schemaName: "orelle_skin_analysis_v2",
    schema: OPENAI_SKIN_ANALYSIS_SCHEMA,
    systemPrompt,
    userInput,
    images: [frontalPhoto, perfilPhoto],
    timeoutMs: env.openAiAnalysisTimeoutMs,
    signal,
    validateValue: (value) =>
        assertAnalysisMatchesObjectives(value, objectives),
});
```

Explicação do código: o browser nunca escolhe host/modelo. O client central fixa `/v1/responses`, `store: false`, `redirect: "error"`, limite incremental, deadline/retry/fallback e JSON Schema; o callback acrescenta a regra semântica dos objetivos antes de persistir.

Validação: o teste confirma `store: false`, endpoint fixo e `redirect: "error"`.

Cenário negativo: resposta demasiado grande ou schema inválido é rejeitado sem criar análise.

### Passo 4 - Implementar retry e fallback OpenAI

1. Objetivo: recuperar apenas falhas transitórias sem ultrapassar o deadline total.
2. Ficheiro: provider OpenAI.
3. Ordem: primário, retry primário, fallback OpenAI. Respeita `Retry-After` até 30 s e apenas dentro do tempo restante.

```js
const attempts = [config.analysisModel, config.analysisModel, config.fallbackModel];
for (const [index, model] of attempts.entries()) {
    // Cada tentativa recebe apenas o tempo ainda disponível no deadline total.
    const result = await tryModel({ model, attempt: index + 1, signal });
    if (result.ok) return result;
    if (!result.transient) throw result.error;
}
throw new Error("OPENAI_RETRY_EXHAUSTED");
```

Explicação do código: erro de autenticação ou input inválido não deve ser repetido. A seleção de pergunta pode usar o banco canónico; nenhuma outra operação inventa output.

Validação: o teste fixa a sequência de modelos e o número máximo de chamadas.

Cenário negativo: três falhas deixam a operação `failed_retryable`.

### Passo 5 - Persistir jobs duráveis

1. Objetivo: desacoplar HTTP do trabalho OpenAI.
2. Ficheiros: model/service de `AiJob`.
3. Invariantes: fingerprint único, claim atómico, lease + heartbeat, payload por referências, replay do mesmo resultado e cancelamento após revogação.

```js
/** O service central reclama e conclui usando o token privado da lease. */
const job = await claimNextAiJob({
    workerId,
    types: [AI_JOB_TYPES.ANALYZE_PHOTOS],
    now: new Date(),
});

if (job) {
    const result = await handleAiJob(job);
    await completeAiJob(job, result);
}
```

Explicação do código: não reimplementes o claim noutro módulo. O helper usa `availableAt`, recupera `lease.expiresAt`, exige `attempts < maxAttempts`, incrementa atomically a tentativa e escreve `lease.{token,workerId,expiresAt}`. `completeAiJob` só faz commit se o token opaco ainda pertencer ao worker; heartbeat usa o mesmo CAS. O job guarda IDs/referências, nunca fotografia, resposta ou prompt sensível em claro.

Validação: restart e lease expirada retomam uma operação sem segunda persistência lógica.

Cenário negativo: worker que perde a lease não pode gravar o resultado.

### Passo 6 - Validar o boundary completo

1. Objetivo: provar configuração, rede, jobs e ausência de contratos removidos.
2. Ficheiros: testes focais API.
3. Comandos:

```bash
npm --prefix apps/api test -- tests/openai-consultation-core-v2.test.js tests/ai-job-v2.test.js
```

Explicação do código: a pesquisa deve terminar sem ocorrências ativas. Testes determinísticos injetam transport apenas em `NODE_ENV=test` e não definem um modo de produto.

Validação: syntax, unit e integração ficam verdes no mesmo estado.

Cenário negativo: uma credencial real herdada pela suite normal deve ser recusada.

Executar cenarios negativos obrigatorios (minimo 2): sem chave; schema inválido. Acrescenta ainda timeout/deadline e lease perdida quando possível.

#### Expected results

- A aplicação arranca sem chave e expõe capability degradada.
- Com chave/consentimento válidos, as operações usam Responses API e jobs.
- Falha total não produz análise, relatório ou imagem local.
- Provenance identifica modelo pedido/efetivo, request ID, versões e tentativas.

#### Critérios de aceite

- [ ] Runtime exclusivamente OpenAI e endpoint fixo.
- [ ] `store: false`, Structured Outputs, validação semântica, deadline e limite de corpo.
- [ ] Retry primário + fallback OpenAI com máximo documentado.
- [ ] Jobs duráveis, idempotentes e recuperáveis.
- [ ] Evidencia de testes por camada: unit provider/config + integração job/restart + contrato HTTP capability.
- [ ] Cenarios negativos concluidos: minimo `2`.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P1 | unit | configuração, schema, retry/fallback e deadline |
| P1 | integração | claim/lease/replay/restart de jobs |
| P1 | HTTP | capability 200 e operação sem chave 503 |
| P1 | segurança | zero segredo/log, endpoint fixo e `store: false` |

#### Validação final

- [ ] `git diff --check` sem erros.
- [ ] Negativos: minimo `2` cenarios executados e registados.
- [ ] Pesquisa sem configuração ou endpoints antigos no código ativo.
- [ ] `test:ai:live` sem chave fica `SKIP`/`BLOQUEADO`, nunca `PASS`.

#### Evidence para PR/defesa

- Resultado sanitizado da capability com e sem chave.
- Sequência de retry/fallback provada por transport de teste.
- Prova de replay/lease sem duplicar provider.
- Ausência de segredo, fotografia, prompt e resposta sensível nos jobs/logs.

#### Handoff

O `BK-MF8-05` reutiliza provenance e respostas estruturadas para explicar o relatório. O `BK-MF8-07` reutiliza `store: false`, consentimento e minimização.

## Bloco pedagogico

### Objetivo

Explicar a diferença entre disponibilidade da aplicação, disponibilidade da IA e resultado cosmético verdadeiro.

### Pre-requisitos

- Async/await, `fetch`, `AbortSignal`, MongoDB e schemas JSON.

### Erros comuns

- Fazer retry infinito, reiniciar o deadline ou guardar o prompt no job.
- Bloquear toda a loja porque falta a chave OpenAI.
- Tratar o transport determinístico de teste como funcionalidade do produto.

### Check de compreensao

- [ ] Consigo explicar por que `store: false` não substitui consentimento.
- [ ] Consigo distinguir retry, fallback OpenAI e replay idempotente.

## Bloco operacional

### Entrada

Configuração, consentimento válido, fotografias normalizadas e job por referências.

### Passos

Validar capability → enfileirar → claim/heartbeat → chamar OpenAI → validar → persistir ou marcar `failed_retryable`.

### Validacao

Executar testes determinísticos e pesquisa estática; o live smoke é separado e opt-in.

### Handoff

Entregar provider estreito, jobs e provenance aos BKs MF8.

## Criterios de aceite

- Contrato OpenAI-only ensinado sem atalhos locais.
- Evidencia de testes por camada presente.
- Cenarios negativos concluidos: minimo `2`.

## Evidence para PR/defesa

Guardar apenas comandos, exit codes e resumos sanitizados; nunca chave, payload ou URI MongoDB.

#### Changelog

- `2026-07-11`: contrato dual substituído por integração OpenAI-only, degradada sem chave, com Responses API, jobs e fallback entre modelos OpenAI.
