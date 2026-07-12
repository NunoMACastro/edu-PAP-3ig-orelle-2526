# MF8 - Arranque local da Orélle

## Header
- `doc_id`: `GUIA-MF8-ARRANQUE-LOCAL`
- `macro`: `MF8`
- `tipo`: `guia_operacional`
- `publico_alvo`: `alunos`
- `path`: `docs/planificacao/guias-bk/MF8/00-ARRANQUE-LOCAL.md`
- `last_updated`: `2026-07-11`

> **Contrato atual:** o arranque académico canónico usa `npm run dev:local`, limpa variáveis herdadas, não carrega o `.env` da aplicação e cria um `MongoMemoryReplSet` efémero em loopback. `npm run dev` passa pelo mesmo runner isolado, acrescentando apenas watch mode; `dev:local` continua a ser o comando de demonstração/reteste por ser determinístico e não reiniciar durante a recolha de evidence. Readiness só fica verde quando MongoDB suporta transações. O frontend usa `/api` same-origin através do proxy Vite local.
> O scheduler diário recuperável é uma capacidade distinta do arranque: só `dev:local` o pode iniciar e apenas quando `ORELLE_LOCAL_BACKUP_ENABLED=true`. `npm run dev` nunca o ativa, mesmo que a flag esteja presente.
> A integração de IA é exclusivamente OpenAI. O runner remove credenciais herdadas por defeito e arranca com capability degradada; mediante `ORELLE_LOCAL_OPENAI_ENABLED=true`, preserva apenas a configuração OpenAI explicitamente fornecida. Depois das migrações faz bootstrap idempotente de 8 contas, 4 categorias e 25 produtos, sem `deleteMany`, reset de stock ou ligação remota. A prova live é opt-in e nunca pertence a `verify:all`.
>
> **Validação runtime atual (2026-07-10):** live/ready responderam no arranque real e o ciclo start→stop imediato passou depois de `startServer` aguardar `listening`; o focal shutdown/listening/bind ficou 4/4. O runtime continuou isolado em loopback, sem carregar `.env` ou URI remota.

## Objetivo

Este ficheiro explica como arrancar a Orélle localmente antes de começar qualquer BK da MF8.

No final deste guia deves conseguir:

- ter a API a correr em `http://127.0.0.1:3001`;
- ter o frontend a correr em `http://127.0.0.1:5173`;
- confirmar liveness em `/api/health/live` e readiness transacional em `/api/health/ready`;
- confirmar a capability OpenAI em `/api/ai-consultation/capabilities` sem expor segredos;
- encontrar 25 produtos, categorias e contas locais para cliente/consultor/admin;
- executar os comandos mínimos de validação antes de começares uma tarefa.

## Regra principal

A Orélle tem duas aplicações separadas:

- `apps/api`: backend/API em Node.js + Express + MongoDB;
- `apps/web`: frontend em React + Vite.

Os comandos devem ser executados dentro da pasta certa. Não assumas que um comando executado na raiz do projeto arranca a aplicação toda.

## Pré-requisitos

Antes de começares, confirma que tens instalado:

- Node.js `24.11.1`, conforme `.nvmrc`/`engines`;
- npm;
- terminal integrado do VS Code, Terminal, PowerShell ou equivalente.

Não precisas de Docker, `mongod` ou acesso a MongoDB remoto. `mongodb-memory-server` descarrega/arranca o binário local necessário ao replica set efémero; a primeira execução pode demorar mais.

Para confirmar Node.js e npm:

```bash
node --version
npm --version
```

Se algum destes comandos falhar, resolve primeiro a instalação do Node.js antes de continuar.

## 1. Preparar a API

Abre um terminal na raiz do projeto e entra na pasta da API:

```bash
cd apps/api
```

Instala as dependências:

```bash
npm install
```

Não copies nem carregues o `.env` existente para este fluxo. O script `dev:local` fornece uma allowlist explícita de configuração académica, cria segredo efémero e injeta a URI do replica set apenas no processo filho. Se o script não existir, conclui primeiro o contrato do `BK-MF8-03`; não substituas essa lacuna por uma URI remota.

## 2. Preparar o frontend

Abre outro terminal na raiz do projeto e entra na pasta do frontend:

```bash
cd apps/web
```

Instala as dependências:

```bash
npm install
```

Não configures `VITE_API_BASE_URL`. O código enviado ao browser usa sempre `/api`; `apps/web/vite.config.js` encaminha esse prefixo para a API apenas durante desenvolvimento. Um build que contenha `localhost`, `127.0.0.1` ou a variável do target do proxy falha o gate.

## 3. Confirmar o replica set efémero

A API precisa de transações MongoDB. `dev:local` cria `MongoMemoryReplSet`, espera pelo estado primário e só depois arranca a aplicação. A URI é efémera, loopback, sem credenciais e nunca é lida do `.env`. Não a copies para documentação, screenshots ou evidence.

Se o replica set não ficar pronto, o script deve terminar com erro e fazer cleanup. Não existe fallback para Mongo standalone nem para a URI de ambiente.

Esta base vive apenas durante o processo: ao parar/reiniciar `dev:local`, consultas, encomendas e outras alterações desse arranque desaparecem. No arranque seguinte são criadas uma base nova e as seeds idempotentes. Isto não limpa nem consulta a base remota — explica apenas porque dados locais não persistem entre execuções.

Depois das migrações, o runner prepara automaticamente:

- 8 contas locais (`admin`, 2 consultores e 5 clientes);
- 4 categorias;
- 25 produtos curados para os sete objetivos, com stock/variantes coerentes.

Credenciais exclusivamente locais de demonstração (nunca produção):

| Role | Email | Password local |
|---|---|---|
| Admin | `admin@orelle.test` | `OrelleDemo123!` |
| Consultor | `consultor@orelle.test` | `OrelleDemo123!` |
| Cliente | `cliente@orelle.test` | `OrelleDemo123!` |

O runner não imprime a password. Estas contas desaparecem com a base efémera.

## 4. Arrancar a API

No terminal da API:

```bash
cd apps/api
npm run dev:local
```

Quando estiver tudo bem, a API deve indicar que ficou ativa na porta `3001`.

Noutro terminal, valida o endpoint de saúde:

```bash
curl http://127.0.0.1:3001/api/health/live
curl http://127.0.0.1:3001/api/health/ready
```

Resposta esperada:

```json
{"status":"ok","app":"orelle","checks":{"http":"ok"}}
{"status":"ready","app":"orelle","checks":{"mongodb":"ok","transactions":"ok"}}
```

Liveness prova apenas que o processo HTTP responde. Readiness prova separadamente que a base está ligada como replica set e aceita transações; sem isso devolve `503` sanitizado.

Confirma também a degradação controlada da IA:

```bash
curl http://127.0.0.1:3001/api/ai-consultation/capabilities
```

Sem opt-in, a resposta deve indicar `available: false` e `reason: "AI_NOT_CONFIGURED"`. Isto é um estado esperado, não uma falha da loja nem uma prova live da OpenAI.

Para demonstrar a consulta real dentro do mesmo replica set efémero, fornece a chave apenas ao processo e ativa o opt-in. Exemplo Unix sem colocar a chave na linha de comandos/histórico:

```bash
cd apps/api
read -s OPENAI_API_KEY
export OPENAI_API_KEY
export ORELLE_LOCAL_OPENAI_ENABLED=true
npm run dev:local
```

O runner cria `DATA_ENCRYPTION_KEY` efémera forte, ignora `MONGODB_URI`/`.env` herdados e só copia a chave, modelos, versões e timeouts OpenAI allowlisted. No fim, executa `unset OPENAI_API_KEY ORELLE_LOCAL_OPENAI_ENABLED`. Nunca uses esta opção com fotografias sem consentimento v2. A edição `gpt-image-2` pode ainda depender de API Organization Verification na conta OpenAI; trata essa exigência como blocker externo, não como fallback.

## 5. Arrancar o frontend

No terminal do frontend:

```bash
cd apps/web
npm run dev
```

Por defeito, o Vite deve abrir em:

```text
http://127.0.0.1:5173
```

Se a porta `5173` já estiver ocupada, o Vite pode escolher outra porta. Nesse caso, usa o endereço mostrado no terminal.

## 6. Checklist antes de começares um BK da MF8

Antes de alterares código para um BK, confirma:

- `npm run dev:local` arrancou sem carregar `.env` e reportou 8 contas, 4 categorias e 25 produtos;
- o `MongoMemoryReplSet` está pronto e será terminado no shutdown;
- API responde em `/api/health/live` e `/api/health/ready`;
- frontend abre no browser;
- a consola do browser não mostra erros de ligação à API;
- `/api/ai-consultation/capabilities` distingue claramente IA disponível/indisponível;
- sabes que BK estás a implementar e qual é o requisito associado.

## 7. Validações mínimas

Depois de uma alteração na API, executa:

```bash
cd apps/api
npm test
```

Depois de uma alteração no frontend, executa:

```bash
cd apps/web
npm run build
```

Testes de integração/transações usam o seu próprio `MongoMemoryReplSet` e eliminam a base no teardown. Se alterares API e frontend, executa ambos; o fecho global usa `npm run verify:all` na API.

### 7.1 Configuração e smoke OpenAI opt-in

O código reconhece apenas estas variáveis de IA no servidor:

```dotenv
OPENAI_API_KEY=
OPENAI_ANALYSIS_MODEL=gpt-5.4-mini
OPENAI_FALLBACK_MODEL=gpt-5.4
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_NOTICE_VERSION=openai-cosmetic-consultation-v2
OPENAI_PROMPT_VERSION=cosmetic-consultation-v2
OPENAI_SCHEMA_VERSION=cosmetic-consultation-schema-v2
OPENAI_IMAGE_PROMPT_VERSION=makeup-image-edit-v1
OPENAI_IMAGE_SCHEMA_VERSION=makeup-image-contract-v1
OPENAI_QUESTION_TIMEOUT_MS=30000
OPENAI_ANALYSIS_TIMEOUT_MS=60000
OPENAI_REPORT_TIMEOUT_MS=60000
OPENAI_IMAGE_TIMEOUT_MS=150000
```

Nunca coloques a chave em `apps/web`, num ficheiro versionado, screenshot ou evidence. O fallback é outro modelo OpenAI: uma repetição transitória do modelo primário e uma tentativa do fallback; não existe resultado cosmético local.

O smoke live é uma prova opt-in separada que executa vision sobre dois retratos vetoriais sintéticos, relatório estruturado e edição `gpt-image-2`. Consome créditos e a etapa de imagem pode exigir Organization Verification; executa-o apenas com credencial/conta explicitamente autorizadas:

```bash
cd apps/api
read -s OPENAI_API_KEY
export OPENAI_API_KEY
npm run test:ai:live
unset OPENAI_API_KEY
```

Interpretação obrigatória:

- chave válida + comando executado com sucesso: regista o resultado sanitizado;
- chave ausente: `SKIP` ou `BLOQUEADO_EXTERNO`;
- quota/rede/credencial recusada: falha real ou `BLOQUEADO_EXTERNO`, conforme a causa;
- nunca converter ausência de chave num `PASS`.

### 7.2 Validação do backup recuperável de RNF21

Esta validação só se aplica depois de implementares o `BK-MF8-04`. O contrato recuperável usa quatro comandos separados e não carrega o `.env` da aplicação. Sem MongoDB instalado, a prova obrigatória é a integração que cria o seu próprio `MongoMemoryReplSet`:

```bash
npm test -- backup-local.replset.integration.test.js
```

Os comandos operacionais abaixo só são usados quando já tens uma URI loopback de um replica set local isolado. Nunca uses a URI remota do `.env`. Dentro de `apps/api`, define apenas para o terminal atual:

```bash
export ORELLE_LOCAL_MONGODB_URI='<uri-loopback-efemera-do-replica-set-local>'
export ORELLE_BACKUP_KEY='<chave-local-de-32-bytes-em-base64>'
```

Usa uma chave dedicada ao backup, diferente de `SESSION_SECRET` e de qualquer chave de dados da aplicação. Não coloques o valor em documentação, screenshots, commits ou evidence.

Executa o ciclo operacional:

```bash
node scripts/backup-create.mjs
node scripts/backup-verify.mjs
node scripts/backup-prune.mjs
```

Para testar um restore manual, o destino tem obrigatoriamente de terminar em `_restore`:

```bash
ORELLE_RESTORE_DATABASE=orelle_manual_restore node scripts/backup-restore.mjs
```

O pipeline só aceita uma URI MongoDB `mongodb://` em loopback, sem credenciais, com nome explícito de base e capacidade de replica set. Os snapshots ficam numa subpasta de `storage/private`, usam Extended JSON integral, AES-256-GCM com AAD, checksums e índices, e a retenção mantém sete cópias. A criação escreve primeiro numa pasta staging privada e só publica o snapshot por rename atómico depois de validar payloads, manifest e checksums; falhas removem staging.

> **Gate runtime atual:** `backup-local.core` passou 10/10 e a integração `MongoMemoryReplSet` 3/3. Foram provados staging 0700, ficheiros 0600, verificação antes do rename, zero final parcial/órfão sob falha, snapshots anteriores preservados, drift de índice recusado e um único ponto temporal sob escritas concorrentes.

> **Estado da prova:** o ciclo `create -> restore _restore -> verify`, índices/checksums e cleanup passou no mesmo replica set local. A evidence guardada deve continuar sanitizada, sem URI, chave ou caminhos privados.
>
> **Comando legado removido:** o manifest operacional já não publica `backup:daily`, porque `scripts/backup-daily.mjs` gera apenas um export pedagógico redigido e não recuperável. Usa exclusivamente os quatro comandos acima. O scheduler diário só pode chamar o fluxo recuperável com opt-in explícito em `dev:local`.

Para autorizar o scheduler apenas na sessão local de demonstração, define placeholders/valores locais no terminal e arranca `dev:local`:

```bash
export ORELLE_LOCAL_BACKUP_ENABLED=true
export ORELLE_BACKUP_KEY='<chave-local-dedicada-de-32-bytes>'
export ORELLE_BACKUP_ROOT='storage/private/backups'
npm run dev:local
```

`ORELLE_BACKUP_ROOT` é opcional e tem de continuar dentro de `storage/private`. A chave só é lida quando a flag é exatamente `true`, não entra no ambiente da API nem no output. O scheduler evita execuções sobrepostas, e `stop()` limpa o timer e aguarda o job em curso antes de desligar API/replica set. Usa `npm run dev` quando queres watch mode sem scheduler, mesmo que estas variáveis permaneçam no shell.

## 8. Erros comuns

### `EADDRINUSE` ou porta ocupada

Significa que a porta já está a ser usada.

Soluções:

- fecha o terminal antigo que ainda está a correr;
- confirma se já existe outro servidor na porta `3001` ou `5173`;
- volta a executar o comando.

### Erro ao arrancar o replica set local

Se `dev:local` falhar antes da API, normalmente o binário efémero não ficou disponível, o replica set não elegeu primário ou o processo anterior não terminou corretamente.

Soluções:

- confirma a mensagem sanitizada do orchestrator local;
- volta a executar `npm run dev:local` com rede disponível na primeira instalação do binário;
- confirma que não definiste `MONGODB_URI` nem autorizaste leitura do `.env` neste fluxo;
- não contornes a falha com Mongo standalone ou uma base remota.

### Frontend diz que não consegue contactar a API

Confirma:

- a API está a correr;
- o frontend chama `/api` e o proxy Vite aponta para a API local apenas no dev server;
- a API responde em `/api/health/live` e `/api/health/ready`;
- o bundle não contém host/porta de desenvolvimento.

### Nova consulta indica `AI_NOT_CONFIGURED`

Este estado é esperado sem opt-in. Confirma que catálogo, conta e loja continuam operacionais. Para demonstrar o fluxo real no ambiente efémero, usa `ORELLE_LOCAL_OPENAI_ENABLED=true` com `OPENAI_API_KEY` explicitamente exportada como descrito acima; o runner nunca herda a chave silenciosamente. Para smoke isolado usa `test:ai:live`. Não cries um resultado falso.

### Backup recusa a URI ou a chave

- confirma que a URI usa apenas loopback, não contém utilizador/password e indica uma base;
- confirma que `ORELLE_BACKUP_KEY` representa exatamente 32 bytes em base64 ou 64 caracteres hexadecimais;
- confirma que o destino de restore termina em `_restore`;
- não contornes estas guardas apontando os scripts para uma base remota.

### `SESSION_SECRET` fraco em produção

Os comandos `dev`/`dev:local` geram um segredo efémero forte e não dependem de um valor copiado do exemplo. Em produção, a API exige um segredo explícito forte. Nunca uses valores reais em documentação ou commits.

### Alterei `.env.example` por engano

O `.env.example` é o modelo partilhado com a equipa. Valores pessoais, tokens e credenciais devem ficar apenas no `.env` local.

## 9. Segurança

Durante a MF8, trata a configuração local como parte do projeto:

- não commits ficheiros `.env`;
- não coloques passwords, tokens ou chaves de serviços externos no frontend;
- não publiques screenshots com credenciais;
- não uses base remota nem o `.env` da aplicação em desenvolvimento/testes locais;
- não envies fotografias reais à OpenAI sem consentimento v2, qualidade validada e finalidade prevista;
- mantém `store: false`, payload minimizado e jobs/logs sem conteúdo sensível.

## 10. Quando pedir ajuda

Pede ajuda antes de continuar se:

- `dev:local` não consegue criar o replica set efémero ou readiness fica em `503`;
- a capability OpenAI diz disponível sem chave ou expõe detalhes de configuração;
- o frontend abre mas não consegue fazer chamadas à API;
- os testes falham e não percebes se a falha vem da tua alteração;
- o BK pede uma alteração que parece contradizer os requisitos ou a segurança da aplicação.

Quando pedires ajuda, envia sempre:

- o BK em que estás a trabalhar;
- o comando que executaste;
- a mensagem de erro completa;
- se a API e o frontend estavam ligados.

## Changelog

- `2026-07-11`: acrescentados capability degradada, configuração OpenAI-only e `test:ai:live` opt-in; falta de chave fica `SKIP`/`BLOQUEADO_EXTERNO`, nunca `PASS`.
- `2026-07-11`: `dev:local` passou a executar seed idempotente (8 contas, 4 categorias, 25 produtos), documentou a natureza descartável da base e ganhou opt-in OpenAI allowlist-only.
- `2026-07-10`: estado corrente posterior: start→stop imediato passou sem `ERR_SERVER_NOT_RUNNING`; backup staging/snapshot passou 10/10 core + 3/3 replica-set.
- `2026-07-10`: live/ready registados como parciais; corrida `ERR_SERVER_NOT_RUNNING` em shutdown imediato mantém validação runtime pendente.
- `2026-07-10`: arranque canónico migrado para `dev:local` scrubbed com `MongoMemoryReplSet`, health live/ready, readiness transacional e frontend `/api` same-origin; removidas instruções para carregar `.env`/Mongo remoto.
