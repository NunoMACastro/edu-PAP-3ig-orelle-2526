# BK-MF2-07 - Gerar edição OpenAI de maquilhagem após desbloqueio

## Header

- `doc_id`: `GUIA-BK-MF2-07`
- `bk_id`: `BK-MF2-07`
- `macro`: `MF2`
- `owner`: `Daniel Bulica`
- `apoio`: `Aline`
- `prioridade`: `P2`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF1-05`
- `rf_rnf`: `RF23`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-08`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-07-permitir-simular-aplicacao-de-maquilhagem-virtual-com-base-na-fotografia-enviada.md`
- `last_updated`: `2026-07-11`

> **Contrato canónico OpenAI-only:** a simulação é uma edição real da fotografia frontal com `gpt-image-2`, pedida explicitamente depois do relatório estar congelado e desbloqueado. Não existe representação gerada localmente nem prompt livre. A edição usa apenas o `simulationSpec` e as variantes recomendadas na versão final.

## Contexto do BK

A edição de maquilhagem é opcional e separada da análise da pele. Só faz sentido quando `makeup` é objetivo principal ou secundário e o relatório final inclui pelo menos uma variante adequada à simulação.

Fluxo:

`relatório frozen + unlocked → consentimento generativo → generate_makeup_preview → OpenAI image edit → WebP cifrado (TTL 7 dias)`

## Objetivo

Gerar uma pré-visualização fotorrealista de maquilhagem sobre a fotografia frontal autorizada, preservando identidade e contexto, com job durável, consentimento pontual, quotas e armazenamento privado temporário.

## Importância

Uma edição generativa usa novamente dados faciais e pode variar do resultado real. O sistema deve controlar quando acontece, quais produtos são usados, durante quanto tempo o resultado existe e como é eliminado.

## Scope-in

- Mostrar a ação apenas após freeze e unlock.
- Exigir objetivo `makeup` e variantes recomendadas.
- Recolher consentimento generativo no momento do pedido.
- Criar/reutilizar o job `generate_makeup_preview`.
- Usar fotografia frontal do snapshot e `simulationSpec` congelado.
- Chamar exclusivamente o modelo OpenAI configurado em `OPENAI_IMAGE_MODEL`.
- Guardar modelo, request ID e versões de prompt/schema.
- Re-encodar a saída para WebP sem EXIF, cifrar e aplicar TTL de sete dias.
- Permitir retry sem afetar relatório, unlock ou voucher.

## Scope-out

- Não aceitar prompt livre, produto adicional ou variant ID escolhido manualmente.
- Não gerar “pele futura” para acne, hidratação, manchas ou outros objetivos.
- Não usar MediaPipe para desenhar maquilhagem.
- Não devolver data URI, storage key ou bytes no DTO de estado.
- Não considerar a imagem uma previsão exata do resultado real.
- Não executar antes do desbloqueio.

## Pré-requisitos

- Relatório final congelado e desbloqueado.
- Objetivo de maquilhagem selecionado.
- `simulationSpec.enabled=true` com pelo menos uma variante final.
- Fotografia frontal ainda existente e consentimento facial ativo.
- `OPENAI_API_KEY` e `OPENAI_IMAGE_MODEL=gpt-image-2` configurados.
- Storage privado, cifra e worker ativos.

## Configuração

```dotenv
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_PROMPT_VERSION=makeup-image-edit-v1
OPENAI_IMAGE_SCHEMA_VERSION=makeup-image-contract-v1
OPENAI_IMAGE_TIMEOUT_MS=150000
```

## Glossário

- **Image edit:** geração condicionada por uma imagem de entrada.
- **Simulation spec:** regiões, look e regras permitidas fixadas no relatório.
- **Consentimento generativo:** aceitação específica desta edição, separada da análise.
- **Output derivado:** imagem nova que continua ligada a dados faciais e ao lifecycle de privacidade.
- **TTL:** prazo máximo de armazenamento antes da expiração/eliminação.

## Conceitos teóricos

O backend constrói o prompt; o utilizador não escreve instruções livres. O prompt identifica as variantes congeladas e pede preservação de identidade, estrutura facial, cabelo, fundo e características naturais da pele, alterando apenas a maquilhagem solicitada.

Mesmo com boa instrução, um modelo generativo pode variar cores, detalhes ou consistência. A UI comunica sempre:

> “Pré-visualização gerada por IA — o resultado real poderá variar.”

O pedido HTTP não espera pelo modelo de imagem. Cria uma `MakeupSimulation` em `queued`, associa um job e devolve um ID. O frontend faz polling até `completed`, `failed_retryable`, `expired` ou `cancelled`.

O output é decifrado apenas no endpoint de imagem do titular, com `Cache-Control: private, no-store`. Expiração, revogação de consentimento, eliminação das fotografias/relatório/conta removem fisicamente os bytes através do mecanismo idempotente de file deletion.

## Arquitetura do BK

- `POST /api/face-reports/:reportId/makeup-simulations`
- `GET /api/makeup-simulations/:simulationId`
- `DELETE /api/makeup-simulations/:simulationId/consent`
- `GET /api/makeup-simulations/:simulationId/image`
- `MakeupSimulation` + `AiJob`
- `openai-makeup-edit.provider` → normalização WebP → cifra/storage

## Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/models/makeup-simulation.model.js`
- EDITAR: `apps/api/src/models/makeup-simulation-quota.model.js`
- EDITAR: `apps/api/src/providers/openai-makeup-edit.provider.js`
- EDITAR: `apps/api/src/services/makeup-simulation.service.js`
- EDITAR: `apps/api/src/services/makeup-simulation-storage.service.js`
- EDITAR: `apps/api/src/validators/makeup-simulation.validator.js`
- EDITAR: `apps/api/src/routes/makeup-simulation.routes.js`
- EDITAR: `apps/web/src/features/consultation/ConsultationReportPage.jsx`

## Bloco pedagogico

### Objetivo

Aprender a tratar uma geração de imagem como job privado e temporário, não como URL pública ou resposta síncrona.

### Pre-requisitos

- Conhecer o relatório frozen/unlocked.
- Saber usar jobs, polling e `AbortSignal`.
- Compreender cifra, TTL e cleanup idempotente.

### Erros comuns

- Aceitar prompt livre ou produto fora do relatório.
- Gerar antes de obter consentimento generativo.
- Guardar data URI/base64 na base de dados.
- Expor output em diretório público.
- Renovar indefinidamente a TTL a cada leitura.
- Tratar falha da imagem como falha do relatório/voucher.

### Check de compreensao

- Porque é que a edição só pode usar a versão congelada?
- O que deve acontecer quando o consentimento é revogado durante o job?
- Porque é que o DTO de estado não inclui os bytes?
- Que diferenças existem entre expiração e falha retryable?

### Tempo estimado

`S` — provider de imagem, job, storage e UI.

## Bloco operacional

### Entrada

- `reportId` próprio, frozen e unlocked.
- Consentimento generativo explícito e versionado.
- `simulationSpec` congelado e fotografia frontal existente.

### Saída

- Simulação com estado público.
- WebP cifrado e privado durante no máximo sete dias.
- Provenance sanitizada da OpenAI.

### Passos

Executar cenarios negativos obrigatorios (minimo 1).

#### Passo 1 - Verificar elegibilidade

Confirma ownership, unlock, objetivo de maquilhagem, fotografia frontal, `simulationSpec.enabled` e variantes finais. Se o ajuste humano removeu todas as variantes, a ação não aparece.

#### Passo 2 - Recolher consentimento pontual

Mostra finalidade, provider, prazo e aviso de variação. O POST envia `{ generativeEditAccepted: true, generativeEditNoticeVersion }`, usando exatamente `report.consentNotices.generativeMakeup`; o validator rejeita ausência ou versão diferente. Guarda versão e data; não reutiliza silenciosamente o consentimento da análise.

```js
await createMakeupSimulation(reportId, {
    generativeEditAccepted: true,
    generativeEditNoticeVersion: report.consentNotices.generativeMakeup,
});
```

#### Passo 3 - Aplicar quota e idempotência

Permite três edições por 24 horas. Duplo clique/reload reutiliza a operação ativa pela chave de geração; retries internos não consomem nova quota funcional.

#### Passo 4 - Criar o job

Persiste `MakeupSimulation` e `AiJob` com referências sanitizadas. Não guarda fotografia, prompt completo ou recommendation snapshot sensível em claro.

#### Passo 5 - Construir a edição OpenAI

Decifra a frontal durante a execução, usa apenas variantes e regiões congeladas e chama `gpt-image-2` com timeout de 150 s e cancelamento cooperativo.

```js
const prompt = buildControlledPrompt(
    report.simulationSpec,
    frozenRecommendationSnapshots,
);
```

`buildControlledPrompt` é privado do provider: recebe apenas regiões e snapshots de produto/variante já congelados e acrescenta as invariantes de identidade, estrutura facial, cabelo, fundo e características da pele. O browser nunca fornece prompt ou lista de produtos.

#### Passo 6 - Normalizar e cifrar output

Valida a imagem devolvida, re-encoda para WebP sem EXIF, cifra com AAD e grava no storage privado. Define `expiresAt` para sete dias sem sliding expiration.

#### Passo 7 - Projetar estado e retry

O DTO expõe `queued`, `processing`, `completed`, `failed_retryable`, `expired` ou `cancelled`, datas e provenance segura. Uma falha retryable pode criar nova tentativa sem alterar relatório/unlock/voucher.

#### Passo 8 - Revogar/expirar/eliminar

Revogação cancela job ainda ativo e agenda eliminação do output. O worker periódico expira outputs. Eliminação de relatório, fotografias ou conta remove imediatamente todas as imagens derivadas.

### Cenarios negativos recomendados

- Relatório locked ou alheio: não criar simulação.
- Sem objetivo/variante de maquilhagem: operação indisponível.
- Consentimento ausente/revogado: `403` e job cancelado.
- Prompt/produto extra enviado pelo cliente: ignorar/rejeitar.
- Duplo clique: uma operação ativa.
- Timeout/erro OpenAI: `failed_retryable`, relatório continua unlocked.
- Output expirado: bytes ausentes; regeneração exige novo consentimento.

### Validacao

- [ ] Negativos: minimo 1 cenarios materiais executados.
- Gate documental: falhar se `negativos < 1`.
- Testes de ownership, unlock e eligibility.
- Testes de consentimento/revogação e cancelamento de job.
- Teste de quota e 25 pedidos concorrentes.
- Teste de prompt fixo com apenas variantes congeladas.
- Teste WebP sem EXIF, cifra, TTL e eliminação física.
- Teste de falha OpenAI sem regressão no voucher.

### Matriz minima de testes por prioridade

| Prioridade | Cenário | Resultado esperado |
|---|---|---|
| P0 | relatório locked/alheio | nenhum job nem byte criado |
| P0 | consentimento revogado | job cancelado e output eliminado |
| P0 | concorrência/replay | uma operação ativa |
| P1 | falha OpenAI | `failed_retryable`, relatório/voucher intactos |
| P1 | sete dias | estado expired e bytes ausentes |
| P1 | eliminação de conta | outputs derivados fisicamente removidos |

### Evidencia de testes por camada

- Unit: elegibilidade, prompt fixo, quota e estados.
- Integração: job, consentimento, cifra, TTL e file deletion.
- Frontend/E2E: pedido, polling, retry, revogação e expiração.
- Live opt-in: image edit OpenAI com imagem sintética/consentida.

### Handoff

`BK-MF2-08` apresenta a fotografia original e o output concluído lado a lado, sem copiar os bytes para storage do browser.

## Expected results

- Edição OpenAI usa a frontal e as variantes congeladas.
- Consentimento é específico e revogável.
- Output é privado, cifrado, sem EXIF e temporário.
- Falhas da imagem não afetam relatório, unlock ou voucher.
- Não existem imagens fictícias, overlays locais ou prompts livres.

## Snippet tecnico aplicavel

O snippet do Passo 5 mostra que o prompt é construído a partir do snapshot congelado e regras de preservação, nunca de texto arbitrário do cliente.

## Criterios de aceite

- Cenarios negativos concluidos: minimo 1.
- Só `gpt-image-2`/modelo OpenAI configurado gera o output.
- Relatório tem de estar frozen e unlocked.
- Maquilhagem e variantes finais são obrigatórias.
- Consentimento generativo é explícito no momento do pedido.
- Job é idempotente, recuperável e sujeito a quota.
- WebP é cifrado, sem EXIF e expira em sete dias.
- Ownership e `no-store` protegem o endpoint da imagem.
- Falha não invalida relatório nem voucher.

## Validação final

Executa testes unitários/integrados, lifecycle de storage, frontend e `test:ai:live` opt-in. Sem chave/créditos, o live test é `SKIP/BLOQUEADO`, não `PASS`.

## Evidence para PR/defesa

- Estados sanitizados do job.
- Provenance sem prompt ou imagem.
- Metadata do WebP sem EXIF.
- Prova de expiração/eliminação física usando ficheiro sintético.
- Não anexar fotografia real à evidência.

## Handoff

A UI seguinte lê original e output apenas através de endpoints autenticados `no-store` e mantém o aviso de variação sempre visível.

## Changelog

- `2026-07-10`: contrato anterior de pré-visualização local.
- `2026-07-11`: substituição integral por edição OpenAI após unlock, consentimento pontual, job durável, cifra e TTL.
