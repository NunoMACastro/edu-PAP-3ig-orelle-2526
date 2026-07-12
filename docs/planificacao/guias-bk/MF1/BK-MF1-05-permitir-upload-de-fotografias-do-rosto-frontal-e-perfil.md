# BK-MF1-05 - Recolher frontal e perfil com consentimento e controlo de qualidade

## Header

- `doc_id`: `GUIA-BK-MF1-05`
- `bk_id`: `BK-MF1-05`
- `macro`: `MF1`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `DONE`
- `esforco`: `M`
- `dependencias`: `BK-MF0-02, BK-MF0-03`
- `rf_rnf`: `RF13`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF1-06`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md`
- `last_updated`: `2026-07-11`

> **Contrato canónico OpenAI-only:** as fotografias são recolhidas dentro de uma consulta em `/consulta/nova`, depois da escolha dos objetivos e da aceitação do consentimento v2. O browser faz um preflight local com MediaPipe quando o módulo está disponível; o backend repete as verificações técnicas com Sharp. A OpenAI faz a decisão final de qualidade cosmética antes de produzir observações. O preflight nunca substitui consentimento, autorização ou validação no servidor.

## Contexto do BK

Este BK prepara a entrada sensível do fluxo:

`objetivos → consentimento v2 → guia fotográfico → frontal + perfil → qualidade técnica → análise OpenAI`

As fotografias não são anexos genéricos. São dados privados ligados ao titular, à versão do consentimento e à sessão da consulta que as vai utilizar.

## Objetivo

Implementar o upload autenticado de uma fotografia frontal e uma fotografia de perfil/lateral, com instruções claras, preflight no browser, normalização no backend, cifra e substituição segura do par anterior.

## Importância

Uma imagem com pose errada, pouca luz, blur ou mais do que um rosto reduz a qualidade da consulta. Uma imagem armazenada sem controlo de ownership, sem remoção de EXIF ou sem cifra cria um risco de privacidade. Este BK resolve os dois problemas antes de qualquer chamada à OpenAI.

## Scope-in

- Pedir consentimento v2 para fotografias, respostas, perfil mínimo e envio à OpenAI.
- Explicar como tirar as fotografias frontal e lateral.
- Fazer preflight local com MediaPipe carregado dinamicamente e assets servidos pela aplicação.
- Tratar falhas duras e warnings confirmáveis.
- Receber apenas os campos multipart `frontal` e `perfil`.
- Validar formato, bytes, dimensões e número de píxeis.
- Auto-orientar, re-encodar para WebP e remover EXIF com Sharp.
- Cifrar os bytes e guardar apenas metadados mínimos na base de dados.
- Associar o par à sessão de consulta do próprio utilizador.

## Scope-out

- Não executar análise cosmética neste BK; fica em `BK-MF1-06`.
- Não guardar landmarks, vetores faciais ou resultados MediaPipe.
- Não enviar fotografias para a OpenAI durante o preflight.
- Não permitir upload anónimo, URL pública ou escolha de `userId`/`photoId` pelo frontend.
- Não promover consentimentos v1 para v2 automaticamente.

## Pré-requisitos

- Sessão opaca autenticada e proteção CSRF.
- `DATA_ENCRYPTION_KEY` configurada no backend.
- Storage privado e serviço de cifra disponíveis.
- Dependências `busboy` e `sharp` na API.
- `@mediapipe/tasks-vision` e assets locais no frontend.

## Glossário

- **Preflight:** verificação rápida antes do upload para ajudar o utilizador a corrigir a fotografia.
- **Falha dura:** condição que impede avançar, por exemplo rosto ausente, múltiplos rostos, pose errada, blur ou resolução insuficiente.
- **Warning:** condição que pode avançar depois de confirmação explícita, por exemplo óculos, cabelo sobre o rosto ou luz desigual.
- **Normalização:** descodificar, auto-orientar e voltar a codificar a imagem num formato controlado.
- **Consentimento v2:** autorização explícita para o fluxo OpenAI, sem reaproveitamento silencioso de versões antigas.

## Conceitos teóricos

O browser melhora a experiência, mas não é uma fronteira de segurança. MediaPipe pode indicar presença, quantidade, posição e pose do rosto; esses valores ajudam o utilizador a corrigir a fotografia antes de gastar rede. Como JavaScript pode ser alterado pelo cliente, o backend tem de voltar a validar tudo o que consegue observar tecnicamente.

Sharp valida o ficheiro realmente descodificado, não apenas o MIME declarado. Deve limitar a imagem a 25 MP, exigir pelo menos 720 px no lado menor, auto-orientar e produzir WebP sem metadados. O original tem no máximo 5 MiB. A quota persistida continua a ser aplicada ao resultado normalizado e não ao nome ou tipo fornecido pelo browser.

O perfil de qualidade v1 usa estes limites:

- exatamente um rosto, confiança mínima `0,70`;
- rosto entre `30%` e `85%` do enquadramento;
- desvio do centro até `20%`;
- pose frontal até `20°` e lateral entre `35°` e `75°`;
- luminosidade média entre `45` e `210`;
- no máximo `20%` de píxeis subexpostos ou sobre-expostos;
- blur abaixo do limiar versionado é rejeitado.

Se MediaPipe não carregar, a consulta não fica inutilizada: a UI informa a limitação, executa as verificações nativas disponíveis e deixa a decisão final de qualidade à OpenAI. Isto é degradação controlada, não uma aprovação fictícia.

## Arquitetura do BK

- `GET|POST|DELETE /api/face-consent`
- `POST /api/face-photos`
- `FaceConsent` e `FacePhoto`
- Busboy → Sharp → cifra → storage privado
- `NewConsultationPage` → `mediapipeFacePreflight` → `consultationApi`

## Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/models/face-consent.model.js`
- EDITAR: `apps/api/src/models/face-photo.model.js`
- EDITAR: `apps/api/src/middlewares/face-photo-upload.middleware.js`
- EDITAR: `apps/api/src/services/face-photo-normalization.service.js`
- EDITAR: `apps/api/src/services/face-photo.service.js`
- EDITAR: `apps/api/src/routes/face-photo.routes.js`
- EDITAR: `apps/web/src/features/consultation/NewConsultationPage.jsx`
- EDITAR: `apps/web/src/features/consultation/mediapipeFacePreflight.js`
- EDITAR: `apps/web/src/features/consultation/photoPreflight.js`
- EDITAR: `apps/web/src/features/consultation/consultationApi.js`
- REVER: `apps/web/public/mediapipe/models/face_landmarker.task`
- REVER: `apps/web/public/mediapipe/wasm/`

## Bloco pedagogico

### Objetivo

Perceber como uma funcionalidade de upload combina UX, validação, privacidade e consistência transacional.

### Pre-requisitos

- Saber enviar `FormData` sem definir manualmente o boundary.
- Distinguir validação no cliente de validação autoritativa no servidor.
- Conhecer `try/catch/finally`, streams e operações assíncronas.

### Erros comuns

- Confiar no atributo `accept` ou no MIME enviado pelo browser.
- Guardar landmarks ou fotografias em `localStorage`.
- Carregar o modelo MediaPipe a partir de CDN sem necessidade.
- Enviar o multipart antes de confirmar consentimento ativo.
- Substituir fotografias usadas por uma consulta em curso sem reset coerente.

### Check de compreensao

- Porque é que o backend precisa de Sharp mesmo depois do preflight?
- Qual é a diferença entre warning e falha dura?
- O que deve acontecer se o módulo MediaPipe não carregar?
- Porque é que um consentimento antigo não pode ser promovido automaticamente?

### Tempo estimado

`M` — implementação e testes de integração.

## Bloco operacional

### Entrada

- Utilizador autenticado.
- Objetivo principal e até dois objetivos secundários já escolhidos.
- Consentimento v2 aceite.
- Ficheiros `frontal` e `perfil` em JPEG, PNG ou WebP.

### Saída

- Par WebP normalizado, cifrado e privado.
- DTO mínimo com IDs, vistas e métricas não sensíveis necessárias ao fluxo.
- Sessão em `collecting_photos`, pronta para criar o job de análise.

### Passos

Executar cenarios negativos obrigatorios (minimo 3).

#### Passo 1 - Apresentar o guia de captura

Explica: luz natural uniforme, lente limpa, sem filtros/beauty mode, expressão neutra, rosto centrado, cabelo afastado e, para análise de pele, sem maquilhagem. Mostra exemplos textuais; não inventes screenshots ou aprovação visual.

#### Passo 2 - Recolher consentimento v2

Obtém primeiro `providerConsentRequirement` por `GET /api/face-consent` e envia `POST /api/face-consent` com o contrato v2 completo: `{ accepted: true, version: "face-analysis-v2", providerConsentAccepted: true, provider: "openai", noticeVersion }`. O `noticeVersion` é exatamente o publicado pelo backend; `generativeEditAccepted` e `consultantPhotoAccessAccepted` começam `false` e são pedidos nos fluxos próprios. `GET` retoma o estado e `DELETE` revoga. A revogação impede novas operações e cancela jobs ainda não concluídos.

#### Passo 3 - Carregar MediaPipe localmente

Faz import dinâmico de `@mediapipe/tasks-vision` apenas na etapa das fotografias. Usa o WASM e o modelo em `apps/web/public/mediapipe/`; não persistas landmarks nem os envies para a API.

#### Passo 4 - Classificar a qualidade no browser

Aplica os limites versionados a cada vista. Uma falha dura bloqueia o botão. Um warning exige confirmação visível e registada apenas como decisão da sessão, nunca como biometria adicional.

```js
export function mayUploadPhoto(preflight) {
    if (preflight.hardFailures.length > 0) return false;
    return preflight.warnings.length === 0 || preflight.warningsConfirmed === true;
}
```

#### Passo 5 - Enviar o par em multipart

Usa os nomes exatos `frontal` e `perfil`. Não envies `userId`, paths, landmarks ou IDs escolhidos manualmente.

#### Passo 6 - Validar e normalizar no backend

Busboy limita campos, partes e bytes e limpa temporários em erro/abort. Sharp descodifica com limite de píxeis, valida dimensões, rejeita imagem animada/multipágina, auto-orienta e re-encoda para WebP sem EXIF.

#### Passo 7 - Substituir o par de forma coerente

Guarda o novo par numa transação. Se a consulta ainda só recolhe fotografias, cancela jobs da tentativa anterior e limpa a análise associada. Se a consulta já avançou, bloqueia uma substituição que tornaria o snapshot incoerente. A eliminação física do par anterior usa outbox idempotente.

#### Passo 8 - Integrar a navegação

Depois do upload bem-sucedido, mantém o utilizador no fluxo canónico e encaminha-o para `/consulta/ativa`. Um reload obtém o estado pelo backend; os `File` e landmarks nunca ficam em storage do browser.

### Cenarios negativos recomendados

- Sem sessão: `401`.
- Sem consentimento v2 ativo: `403`.
- Campo extra, duplicado ou falta de uma vista: `400`/`422`.
- MIME falso, ficheiro corrompido, mais de 5 MiB ou mais de 25 MP: rejeição e cleanup.
- Zero ou dois rostos, pose errada, blur ou luz extrema: não iniciar análise normal.
- Falha de MediaPipe: warning de degradação, sem fingir que o preflight passou.
- Duplo clique/reload: não criar pares ativos duplicados.

### Validacao

- [ ] Negativos: minimo 3 cenarios materiais executados.
- Gate documental: falhar se `negativos < 3`.
- Testes unitários dos limiares de qualidade.
- Testes de integração multipart com ficheiros válidos e inválidos.
- Teste de ausência de EXIF no WebP normalizado.
- Teste de substituição/rollback e ausência de ficheiros órfãos.
- Teste frontend com MediaPipe indisponível.

### Matriz minima de testes por prioridade

| Prioridade | Cenário | Resultado esperado |
|---|---|---|
| P0 | consentimento ausente/revogado | nenhum byte é persistido nem enviado à OpenAI |
| P0 | imagem tecnicamente inválida | erro controlado e temporários eliminados |
| P0 | par válido | duas vistas cifradas e associadas ao titular/sessão |
| P1 | warning confirmado | upload permitido com estado explícito |
| P1 | MediaPipe indisponível | fluxo degradado, nunca aprovação fictícia |
| P1 | upload concorrente | no máximo um par ativo e snapshot coerente |

### Evidencia de testes por camada

- Unit: classificação de falhas duras e warnings.
- Integração: multipart, Sharp, cifra, transação e cleanup.
- Frontend/E2E: guia, preflight, fallback e navegação.
- Segurança: ownership, consentimento e ausência de EXIF/órfãos.

### Handoff

`BK-MF1-06` recebe apenas referências às fotografias validadas do próprio utilizador. Nunca recebe paths públicos nem IDs escolhidos pela UI.

## Expected results

- A UI ensina a tirar as duas fotografias.
- O preflight melhora a qualidade sem se tornar autoridade de segurança.
- O backend normaliza, remove EXIF, cifra e aplica ownership.
- O fluxo recupera de reload e falhas sem perder coerência.

## Snippet tecnico aplicavel

O snippet completo relevante está no Passo 4. O detalhe do parser e da cifra pertence aos módulos indicados; não dupliques essa lógica no controller.

## Criterios de aceite

- Cenarios negativos concluidos: minimo 3.
- Consentimento v2 explícito precede o upload.
- Apenas `frontal` e `perfil` são aceites.
- Originais têm no máximo 5 MiB e imagens até 25 MP.
- O lado menor tem pelo menos 720 px.
- WebP persistido não contém EXIF.
- MediaPipe é local, dinâmico e não persiste landmarks.
- Falhas não deixam temporários, bytes órfãos ou pares duplicados.

## Validação final

Executa os testes focais da API e frontend, o lint e o build. A ausência de browser real ou de mockup é registada como blocker externo; não é convertida em `PASS`.

## Evidence para PR/defesa

- Comandos e exit codes dos testes.
- DTO sanitizado do consentimento e do upload.
- Metadata Sharp do WebP sem EXIF.
- Resultado do cenário MediaPipe indisponível.
- Nunca anexar fotografias reais, cookies, chaves ou URI MongoDB.

## Handoff

O próximo BK cria o job `analyze_photos` e pede à OpenAI uma avaliação cosmética estruturada, preservando o par e o consentimento usados no snapshot da sessão.

## Changelog

- `2026-05-31`: guia inicial de consentimento e upload privado.
- `2026-07-10`: alinhamento com Busboy, Sharp, WebP, remoção de EXIF e cleanup.
- `2026-07-11`: integração no fluxo OpenAI-only, consentimento v2 e qualidade MediaPipe + Sharp + OpenAI.
