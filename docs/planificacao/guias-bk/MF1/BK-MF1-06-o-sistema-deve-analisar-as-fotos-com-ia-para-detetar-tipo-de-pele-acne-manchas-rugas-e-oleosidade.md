# BK-MF1-06 - Analisar fotografias exclusivamente com OpenAI no job da consulta cosmética

## Header

- `doc_id`: `GUIA-BK-MF1-06`
- `bk_id`: `BK-MF1-06`
- `macro`: `MF1`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF1-05`
- `rf_rnf`: `RF14`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF1-07`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-06-o-sistema-deve-analisar-as-fotos-com-ia-para-detetar-tipo-de-pele-acne-manchas-rugas-e-oleosidade.md`
- `last_updated`: `2026-07-11`

> **Contrato canónico OpenAI-only:** a análise nasce na sessão da consulta através de um job durável `analyze_photos`. O modelo primário e o fallback pertencem ambos à OpenAI. Se ambos falharem, a sessão fica `failed_retryable`; a aplicação não troca de provider nem inventa uma análise.

## Contexto do BK

A análise já não é uma página nem um endpoint de geração isolado. É uma etapa do fluxo:

`sessão → fotografias validadas → analyze_photos → qualidade OpenAI → observações → 5–8 perguntas`

O backend controla consentimento, ownership, quotas, jobs e schema. A OpenAI interpreta as imagens e devolve uma resposta estruturada dentro de limites cosméticos não médicos.

## Objetivo

Analisar o par frontal/perfil exclusivamente com a OpenAI, persistir provenance e qualidade fotográfica e preparar a conversa dinâmica orientada pelos objetivos escolhidos.

## Importância

Esta etapa é o núcleo de IA da PAP. Para ser demonstrável e robusta, tem de usar o provider real, sobreviver a reload/restart, rejeitar respostas fora do schema e falhar de forma honesta quando o serviço não está disponível.

## Scope-in

- Expor disponibilidade em `GET /api/ai-consultation/capabilities`.
- Disponibilizar os sete objetivos em `GET /api/ai-consultation/goals`.
- Criar uma sessão com um objetivo principal e até dois secundários.
- Criar/reutilizar o job `analyze_photos`.
- Enviar as duas imagens e contexto mínimo para a OpenAI Responses API.
- Exigir Structured Outputs validados pelo backend.
- Guardar modelo pedido/efetivo, request ID, versões de prompt/schema e tentativa.
- Repetir o modelo primário uma vez e usar um modelo OpenAI de fallback uma vez.
- Persistir `pass`, `warning` ou `inconclusive` para a qualidade fotográfica.
- Iniciar uma conversa com 5–8 perguntas quando a análise é utilizável.

## Scope-out

- Não gerar o relatório final; fica em `BK-MF1-07`.
- Não recomendar produtos nesta chamada.
- Não diagnosticar doença, prescrever tratamento ou prometer cura.
- Não enviar nome, email, ObjectId ou outros identificadores à OpenAI.
- Não fazer fallback para resultados locais ou fictícios.
- Não chamar diretamente endpoints antigos de análise facial.

## Pré-requisitos

- `BK-MF1-05` concluído com consentimento v2 e fotografias cifradas.
- `OPENAI_API_KEY` para novas operações de IA.
- `DATA_ENCRYPTION_KEY` para dados sensíveis.
- MongoDB replica set para claims, leases e transações.
- Rate limit e quotas funcionais ativos.

## Configuração

```dotenv
OPENAI_API_KEY=
OPENAI_ANALYSIS_MODEL=gpt-5.4-mini
OPENAI_FALLBACK_MODEL=gpt-5.4
OPENAI_NOTICE_VERSION=openai-cosmetic-consultation-v2
OPENAI_PROMPT_VERSION=cosmetic-consultation-v2
OPENAI_SCHEMA_VERSION=cosmetic-consultation-schema-v2
OPENAI_QUESTION_TIMEOUT_MS=30000
OPENAI_ANALYSIS_TIMEOUT_MS=60000
OPENAI_REPORT_TIMEOUT_MS=60000
```

Sem chave, catálogo, conta, histórico e loja continuam disponíveis. A capability de IA indica indisponibilidade com motivo sanitizado e a UI bloqueia apenas novas operações de IA.

## Glossário

- **Structured Outputs:** resposta obrigada a cumprir um JSON Schema.
- **Job durável:** registo MongoDB com claim atómico, lease, tentativas e idempotência.
- **Fallback OpenAI:** segunda escolha de modelo OpenAI, nunca um resultado local.
- **Provenance:** metadados que permitem saber qual modelo, prompt e schema produziram a saída.
- **Inconclusive:** fotografia insuficiente; não cria findings e exige novo par.

## Conceitos teóricos

O controller não deve esperar 60 segundos pela OpenAI. O pedido HTTP cria ou reutiliza um job e devolve rapidamente. Um worker reclama o job atomicamente, renova a lease e atualiza a sessão. Se o processo reiniciar, outro worker pode recuperar uma lease expirada sem duplicar o resultado.

O provider recebe imagens e texto na mesma entrada, mas apenas dados minimizados: objetivos, vistas já autorizadas e instruções cosméticas. A resposta é validada em duas camadas: JSON Schema na API da OpenAI e validação semântica local. Um JSON formalmente válido ainda pode ser incorreto, por exemplo devolver um objetivo não selecionado.

O sistema suporta sete objetivos:

1. acne e imperfeições;
2. hidratação e barreira;
3. controlo de oleosidade;
4. sensibilidade e vermelhidão;
5. manchas, tom e luminosidade;
6. proteção solar;
7. maquilhagem.

Cada sessão tem um objetivo principal e até dois secundários. O backend define os slots permitidos. A OpenAI escolhe a próxima pergunta, não inventa o tipo, opções ou limites. Só são aceites `single_select`, `multi_select`, `scale`, `number` e `short_text`.

## Arquitetura do BK

- `POST /api/ai-consultation/sessions`
- `POST /api/ai-consultation/sessions/:sessionId/analysis`
- `POST /api/ai-consultation/sessions/:sessionId/answers`
- `POST /api/ai-consultation/sessions/:sessionId/retry`
- `AiConsultationSession` + `AiJob` + `FaceAnalysis`
- worker → `openai-responses.provider` → schema/semântica → sessão

## Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/constants/ai-consultation-goals.js`
- EDITAR: `apps/api/src/models/ai-consultation-session.model.js`
- EDITAR: `apps/api/src/models/ai-job.model.js`
- EDITAR: `apps/api/src/models/face-analysis.model.js`
- EDITAR: `apps/api/src/providers/openai-responses.provider.js`
- EDITAR: `apps/api/src/services/ai-consultation.service.js`
- EDITAR: `apps/api/src/services/ai-job.service.js`
- EDITAR: `apps/api/src/routes/ai-consultation.routes.js`
- EDITAR: `apps/web/src/features/consultation/ActiveConsultationPage.jsx`
- EDITAR: `apps/web/src/features/consultation/consultationApi.js`
- EDITAR: `apps/web/src/features/consultation/consultationModel.js`

## Bloco pedagogico

### Objetivo

Perceber como integrar uma API de IA real sem colocar regras de negócio, retries ou segurança no frontend.

### Pre-requisitos

- Saber usar `async/await`, `AbortSignal` e validação de objetos.
- Compreender idempotência, filas e leases.
- Distinguir schema estrutural de regra semântica.

### Erros comuns

- Esperar pela OpenAI dentro do mesmo pedido HTTP.
- Tratar qualquer JSON como resultado válido.
- Guardar prompts, respostas ou fotografias sensíveis em claro no job.
- Repetir infinitamente um erro ou contar retry interno como nova consulta.
- Mostrar linguagem clínica ou uma certeza que o modelo não pode garantir.

### Check de compreensao

- Porque é que a sessão aponta para um job, em vez de guardar o trabalho só em memória?
- O que distingue retry do primário, fallback OpenAI e retoma manual?
- Porque é que a validação local continua necessária com Structured Outputs?
- O que acontece quando a qualidade é `inconclusive`?

### Tempo estimado

`M` — provider, worker, persistência e integração React.

## Bloco operacional

### Entrada

- Sessão do próprio utilizador em `collecting_photos`.
- Consentimento OpenAI v2 ativo.
- Par frontal/perfil pertencente ao snapshot da sessão.

### Saída

- `FaceAnalysis` versionada e cifrada.
- Qualidade `pass`, `warning` ou `inconclusive`.
- Sessão em `asking_questions`, `collecting_photos` ou `failed_retryable`.

### Passos

Executar cenarios negativos obrigatorios (minimo 3).

#### Passo 1 - Expor capabilities e objetivos

Devolve disponibilidade sanitizada, limites e os sete objetivos. Nunca devolvas a chave, stack interna ou detalhes do provider que revelem segredos.

#### Passo 2 - Criar a sessão

Valida um objetivo principal e até dois secundários sem duplicados. Permite apenas uma sessão aberta por utilizador e aplica a quota de três novas consultas por 24 horas.

#### Passo 3 - Criar o job idempotente

`POST .../analysis` cria ou reutiliza `analyze_photos`. Usa uma chave lógica por sessão, revisão e tipo de job para que duplo clique ou reload não originem duas chamadas OpenAI.

#### Passo 4 - Preparar input minimizado

Decifra as duas imagens apenas durante a execução, pela ordem frontal/perfil. Não inclui nome, email, IDs MongoDB ou texto livre não necessário. Limita a dimensão da resposta.

#### Passo 5 - Chamar a OpenAI com schema estrito

Usa o modelo primário, `AbortSignal` e timeout. Valida estrutura e semântica antes de aceitar. Um `429` respeita `Retry-After` até 30 s; erros transitórios repetem uma vez o primário e depois tentam o fallback OpenAI.

```js
const response = await client.requestStructured({
    schemaName: "orelle_skin_analysis_v2",
    schema: OPENAI_SKIN_ANALYSIS_SCHEMA,
    systemPrompt,
    userInput: {
        objectives,
        imageOrder: ["fotografia_frontal", "fotografia_perfil"],
        purpose: FACE_IMAGE_PURPOSE_POLICY.purpose,
        retention: FACE_IMAGE_PURPOSE_POLICY.retention,
        modelLearningAllowed: false,
        photoQualityProfile: {
            version: "face-photo-quality-v1",
            exactlyOneFace: true,
            faceFrameRatio: { min: 0.3, max: 0.85 },
            maxCenterDeviation: 0.2,
            frontalMaxYawDegrees: 20,
            lateralYawDegrees: { min: 35, max: 75 },
            luminanceMean: { min: 45, max: 210 },
            maxClippedPixelRatio: 0.2,
            blurIsHardFailure: true,
        },
    },
    images: [frontalPhoto, perfilPhoto],
    timeoutMs: env.openAiAnalysisTimeoutMs,
    signal,
    validateValue: (value) =>
        assertAnalysisMatchesObjectives(value, objectives),
});
assertAnalysisMatchesObjectives(response.value, objectives);
```

#### Passo 6 - Tratar qualidade remota

`inconclusive` não cria findings e fixa os IDs rejeitados, obrigando um novo par. `warning` exige confirmação antes de escolher a primeira pergunta. `pass` avança normalmente.

#### Passo 7 - Iniciar a conversa

O backend oferece apenas slots permitidos e ainda não respondidos. A OpenAI escolhe um `slotCode`; o backend materializa a pergunta canónica e cifra transcript, respostas e factos derivados. Há no mínimo cinco e no máximo oito perguntas.

#### Passo 8 - Projetar o estado no frontend

`ActiveConsultationPage` usa `flowState` do backend, faz polling de 2 s até 10 s e preserva o transcript durante timeout, `401`, `409` ou falha OpenAI. Não mostra animação de typing falsa.

### Cenarios negativos recomendados

- Sem chave: capability indisponível e operação de IA bloqueada sem afetar a loja.
- Consentimento revogado ou fotografias trocadas: job cancelado/bloqueado.
- Structured Output inválido ou semanticamente incompatível: retry/fallback.
- Timeout, `429` ou `5xx`: estado recuperável, sem análise inventada.
- Duas respostas à mesma revisão: uma é aceite e a outra recebe `409`.
- Prompt injection numa resposta: texto limitado e tratado como dados, não instrução.
- Lease perdida/restart: recuperação sem duas análises persistidas.

### Validacao

- [ ] Negativos: minimo 3 cenarios materiais executados.
- Gate documental: falhar se `negativos < 3`.
- Transport OpenAI injetado apenas em `NODE_ENV=test`.
- Testes de schema, semântica, retry, fallback e falha total.
- Testes de lease expirada, restart e idempotência.
- Testes de 5–8 perguntas e tipos/slots permitidos.
- `test:ai:live` é opt-in; sem chave é `SKIP/BLOQUEADO`, nunca `PASS`.

### Matriz minima de testes por prioridade

| Prioridade | Cenário | Resultado esperado |
|---|---|---|
| P0 | primário e fallback falham | `failed_retryable`, sem resultado falso |
| P0 | schema/semântica inválidos | saída rejeitada e não persistida |
| P0 | restart/lease expirada | job recuperado uma vez |
| P1 | qualidade inconclusiva | novas fotografias obrigatórias |
| P1 | warning remoto | confirmação antes da pergunta |
| P1 | resposta concorrente | CAS protege revisão e devolve `409` |

### Evidencia de testes por camada

- Unit: goals, schemas, semântica e política de retry/fallback.
- Integração: jobs, leases, cifra e sessão MongoDB.
- Frontend/E2E: análise, polling, 5–8 perguntas e retoma.
- Live opt-in: OpenAI real com dados sintéticos/consentidos, ou blocker explícito.

### Handoff

Quando os factos mínimos estiverem completos ou forem atingidas oito perguntas, a sessão fica pronta para o job `generate_report` de `BK-MF1-07`.

## Expected results

- Só a OpenAI produz análise cosmética.
- A aplicação continua útil sem chave, mas novas operações de IA ficam indisponíveis.
- Jobs sobrevivem a reload, duplo clique e restart.
- Falhas não criam resultados fictícios.
- A conversa respeita objetivos, slots, limites e linguagem não médica.

## Snippet tecnico aplicavel

O snippet do Passo 5 mostra o boundary correto: o provider trata transporte; a função semântica continua sob controlo do backend.

## Criterios de aceite

- Cenarios negativos concluidos: minimo 3.
- Apenas modelos OpenAI configurados podem produzir resultados cosméticos; não existe fallback sintético.
- Todas as chamadas OpenAI têm timeout e cancelamento cooperativo.
- Provenance inclui modelo pedido/efetivo, request ID e versões.
- A qualidade inconclusiva não produz findings.
- Cada sessão tem 5–8 perguntas e apenas slots permitidos.
- A UI retoma o estado pelo backend.
- O conteúdo é cosmético e inclui limitações não médicas.

## Validação final

Executa testes unitários, contratos, integração, worker/restart, frontend e build. O live smoke só conta quando usa credenciais próprias e imagens sintéticas ou consentidas.

## Evidence para PR/defesa

- Resultado sanitizado de capability com e sem chave.
- Estado de job antes/depois de restart.
- Provenance sem prompts, imagens, respostas ou segredos.
- Teste de falha total a provar ausência de resultado sintético.

## Handoff

`BK-MF1-07` recebe a análise e o transcript cifrado pelo ID interno da sessão; o frontend não escolhe uma análise para gerar relatório.

## Changelog

- `2026-05-31`: guia inicial de análise facial isolada.
- `2026-07-10`: clarificação dos antigos modos de provider e dados derivados cifrados.
- `2026-07-11`: substituição pelo fluxo OpenAI-only com jobs duráveis, Structured Outputs, sete objetivos e 5–8 perguntas.
