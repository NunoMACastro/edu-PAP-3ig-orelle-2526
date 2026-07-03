# MF8 - Arranque local da Orélle

## Header
- `doc_id`: `GUIA-MF8-ARRANQUE-LOCAL`
- `macro`: `MF8`
- `tipo`: `guia_operacional`
- `publico_alvo`: `alunos`
- `path`: `docs/planificacao/guias-bk/MF8/00-ARRANQUE-LOCAL.md`
- `last_updated`: `2026-07-03`

## Objetivo

Este ficheiro explica como arrancar a Orélle localmente antes de começar qualquer BK da MF8.

No final deste guia deves conseguir:

- ter a API a correr em `http://127.0.0.1:3001`;
- ter o frontend a correr em `http://127.0.0.1:5173`;
- confirmar que a API responde em `/api/health`;
- executar os comandos mínimos de validação antes de começares uma tarefa.

## Regra principal

A Orélle tem duas aplicações separadas:

- `apps/api`: backend/API em Node.js + Express + MongoDB;
- `apps/web`: frontend em React + Vite.

Os comandos devem ser executados dentro da pasta certa. Não assumas que um comando executado na raiz do projeto arranca a aplicação toda.

## Pré-requisitos

Antes de começares, confirma que tens instalado:

- Node.js numa versão atual;
- npm;
- MongoDB local ou acesso a uma base MongoDB indicada pelo professor;
- terminal integrado do VS Code, Terminal, PowerShell ou equivalente.

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

Cria o ficheiro `.env` local a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell, se `cp` não funcionar, usa:

```powershell
Copy-Item .env.example .env
```

Confirma no ficheiro `apps/api/.env` que existem, pelo menos, estes valores:

```env
NODE_ENV=development
PORT=3001
CLIENT_ORIGIN=http://127.0.0.1:5173
CLIENT_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/orelle
SESSION_SECRET=change-me-use-a-long-random-string
SESSION_TTL=2h
FORCE_HTTPS=false
```

O ficheiro `.env` é local e não deve ser colocado no Git.

## 2. Preparar o frontend

Abre outro terminal na raiz do projeto e entra na pasta do frontend:

```bash
cd apps/web
```

Instala as dependências:

```bash
npm install
```

Cria o ficheiro `.env` local a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Confirma no ficheiro `apps/web/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:3001/api
```

Mantém `127.0.0.1` no frontend e na API para evitar diferenças de origem que possam afetar cookies e CORS.

## 3. Confirmar MongoDB

A API precisa de MongoDB antes de arrancar.

Se usares MongoDB local, confirma que o serviço está ativo. A ligação configurada por defeito é:

```text
mongodb://127.0.0.1:27017/orelle
```

Se o professor indicar outra base de dados, altera apenas `MONGODB_URI` em `apps/api/.env`. Nunca coloques credenciais reais em guias, screenshots, commits ou mensagens públicas.

## 4. Arrancar a API

No terminal da API:

```bash
cd apps/api
npm run dev
```

Quando estiver tudo bem, a API deve indicar que ficou ativa na porta `3001`.

Noutro terminal, valida o endpoint de saúde:

```bash
curl http://127.0.0.1:3001/api/health
```

Resposta esperada:

```json
{"status":"ok","app":"orelle","checks":{"http":"ok"}}
```

Se este pedido responder, o servidor HTTP da API está a correr.

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

- `apps/api/.env` existe;
- `apps/web/.env` existe;
- MongoDB está ativo ou `MONGODB_URI` aponta para uma base válida;
- API responde em `http://127.0.0.1:3001/api/health`;
- frontend abre no browser;
- a consola do browser não mostra erros de ligação à API;
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

Se alterares API e frontend, executa ambos.

## 8. Erros comuns

### `EADDRINUSE` ou porta ocupada

Significa que a porta já está a ser usada.

Soluções:

- fecha o terminal antigo que ainda está a correr;
- confirma se já existe outro servidor na porta `3001` ou `5173`;
- volta a executar o comando.

### Erro de ligação ao MongoDB

Se a API falhar ao arrancar com erro de ligação a `127.0.0.1:27017`, normalmente significa que o MongoDB não está ativo ou que `MONGODB_URI` está errado.

Soluções:

- inicia o serviço MongoDB;
- confirma `MONGODB_URI` em `apps/api/.env`;
- confirma que não estás a usar uma base de dados de produção para testes.

### Frontend diz que não consegue contactar a API

Confirma:

- a API está a correr;
- `VITE_API_BASE_URL=http://127.0.0.1:3001/api`;
- a API responde em `/api/health`;
- não misturaste `localhost` no frontend com `127.0.0.1` na API sem necessidade.

### `SESSION_SECRET` fraco em produção

Em desenvolvimento, o valor do exemplo é suficiente para trabalho local. Em produção, a API exige um segredo forte. Nunca uses valores reais em documentação ou commits.

### Alterei `.env.example` por engano

O `.env.example` é o modelo partilhado com a equipa. Valores pessoais, tokens e credenciais devem ficar apenas no `.env` local.

## 9. Segurança

Durante a MF8, trata a configuração local como parte do projeto:

- não commits ficheiros `.env`;
- não coloques passwords, tokens, chaves Stripe ou chaves de IA no frontend;
- não publiques screenshots com credenciais;
- não uses base de dados de produção para testes;
- não envies fotografias reais para providers externos sem consentimento e sem validação do BK correspondente.

## 10. Quando pedir ajuda

Pede ajuda antes de continuar se:

- a API não arranca depois de confirmares MongoDB e `.env`;
- o frontend abre mas não consegue fazer chamadas à API;
- os testes falham e não percebes se a falha vem da tua alteração;
- o BK pede uma alteração que parece contradizer os requisitos ou a segurança da aplicação.

Quando pedires ajuda, envia sempre:

- o BK em que estás a trabalhar;
- o comando que executaste;
- a mensagem de erro completa;
- se a API e o frontend estavam ligados.
