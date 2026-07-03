# BK-MF8-03 - Ambiente de testes separado do ambiente de produção

## Header
- `doc_id`: `GUIA-BK-MF8-03`
- `bk_id`: `BK-MF8-03`
- `macro`: `MF8`
- `owner`: `Daniel Bulica`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `-`
- `rf_rnf`: `RNF22`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF8-04`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-03-ambiente-de-testes-separado-do-ambiente-de-producao.md`
- `last_updated`: `2026-07-01`

#### Objetivo

Neste BK vais garantir que os testes da API correm sempre em ambiente isolado, com `NODE_ENV=test`, base de dados de teste e bloqueio de credenciais reais durante a execução da suite.

#### Importância

Testes que usam configuração de produção podem escrever em dados reais, enviar pedidos externos ou esconder falhas porque dependem de estado que a equipa não controla. O `RNF22` existe para tornar a validação segura, repetível e defensável na PAP.

#### Scope-in

- Atualizar o exemplo público de variáveis da API com configuração explícita para testes.
- Centralizar a regra de ambiente em `apps/api/src/config/env.js`.
- Criar um teste Vitest que prova que a configuração de teste é isolada.
- Cobrir pelo menos dois negativos: `NODE_ENV` errado, URI sem marca de teste e credencial real em modo de teste.
- Executar cenarios negativos obrigatorios (minimo 2) com resultado controlado.
- Deixar evidence objetiva para o `BK-MF8-04`, que depende deste isolamento antes de simular backups.

#### Scope-out

- Não criar deploy real.
- Não executar pedidos contra serviços pagos.
- Não alterar a configuração de produção para além das validações defensivas.
- Não criar scripts novos se o script `test` existente já executar Vitest.
- Não mexer em frontend, porque este BK é operacional/backend.

#### Estado antes e depois

- Antes: `apps/api/src/config/env.js` centraliza variáveis, mas a URI por defeito é a base local normal e não há guard específico que prove isolamento em teste.
- Depois: o backend usa uma URI de teste por defeito quando `NODE_ENV=test`, recusa ambientes misturados e a suite tem um contrato Vitest para provar `RNF22`.

#### Pre-requisitos

- Ter o `BK-MF8-02` fechado ou, pelo menos, logs de erro minimamente estáveis para perceber falhas de arranque.
- Ter dependências instaladas em `apps/api`.
- Confirmar que `apps/api/package.json` contém o script `test` com Vitest.
- Saber editar ficheiros ESM em Node.js.

#### Glossário

- Ambiente: conjunto de variáveis, base de dados e serviços usados pela aplicação num contexto concreto.
- Ambiente de produção: configuração usada por utilizadores reais ou dados reais.
- Ambiente de teste: configuração local e descartável usada pela suite automatizada.
- Guard: validação defensiva que bloqueia uma configuração insegura antes de a aplicação continuar.
- Evidence: prova objetiva do comando executado, resultado observado e negativos testados.

#### Conceitos teóricos essenciais

- Um teste deve ser repetível. Se depende de uma base real ou de credenciais reais, o resultado deixa de ser controlado.
- `NODE_ENV=test` deve activar defaults seguros para a suite, mas não deve esconder variáveis perigosas passadas pelo terminal ou pelo ficheiro `.env`.
- Uma base de dados de teste deve ter uma marca explícita no nome, como `_test` ou `-test`, para evitar confusão com a base local normal.
- Credenciais reais não devem ser obrigatórias para testes automatizados. Para contratos e fluxos locais, usa valores `test`, `fake`, `stub`, `dummy` ou `sandbox`.
- Para uma prioridade `P1`, a planificação exige evidence de teste unit/integration e pelo menos dois cenários negativos.

#### Arquitetura do BK

- `bk_id`: `BK-MF8-03`
- `flow_id`: `FLOW-MF8-TEST-ENV`
- `requisitos`: `RNF22`
- `dependências`: `-`
- `tema técnico`: `isolamento de ambiente`
- `destino dos alunos`: `apps/api`
- `decisão CANONICO`: `RNF22` pede ambiente de testes separado do ambiente de produção.
- `decisão DERIVADO`: o contrato chama-se `mf8.test-env.contract.test.js` para ficar rastreável à MF8 e ao requisito operacional.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/.env.example`
- EDITAR: `apps/api/src/config/env.js`
- CRIAR: `apps/api/tests/mf8.test-env.contract.test.js`
- REVER: `apps/api/package.json`

#### Tutorial técnico linear

### Passo 1 - Confirmar o contrato canónico

1. Objetivo funcional do passo no contexto da app.

Confirmar que o BK implementa apenas o `RNF22` e que a entrega prepara o handoff para `BK-MF8-04`.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - LOCALIZAÇÃO: script `test`.

3. Instruções do que fazer.

Consulta a matriz/backlog e o RNF associado. Confirma estes factos no teu apontamento de trabalho:

- `BK-MF8-03` pertence à `MF8`.
- A prioridade é `P1`.
- O requisito é `RNF22`.
- O próximo BK é `BK-MF8-04`.
- Para `P1`, precisas de unit/integration e pelo menos dois negativos.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. A decisão importante é não programar regras que não pertencem ao requisito alvo.

6. Validação do passo.

Executa uma pesquisa local por `RNF22` e `BK-MF8-03` nos documentos de planificação. O resultado deve apontar para o requisito e para a linha canónica do BK.

7. Cenário negativo/erro esperado.

Se o requisito ou o handoff não coincidirem com a matriz, pára o BK e corrige primeiro a planificação. Não cries uma regra técnica com base em memória ou suposição.

### Passo 2 - Mapear a configuração real da API

1. Objetivo funcional do passo no contexto da app.

Perceber onde a API lê variáveis e como a suite é executada.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/api/src/config/env.js`
    - REVER: `apps/api/.env.example`

3. Instruções do que fazer.

Abre os ficheiros indicados e confirma:

- `apps/api/package.json` usa Vitest no script `test`.
- `apps/api/src/config/env.js` exporta o objecto `env`.
- `apps/api/.env.example` documenta `NODE_ENV`, `MONGODB_URI` e chaves opcionais.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. O objectivo é reaproveitar o ponto central de configuração em vez de criar leituras soltas de `process.env` noutros módulos.

6. Validação do passo.

Confirma que não existem imports duplicados de configuração para o mesmo objectivo. A regra de ambiente deve ficar concentrada em `apps/api/src/config/env.js`.

7. Cenário negativo/erro esperado.

Se encontrares outro ficheiro a calcular `MONGODB_URI` de forma paralela, regista o risco e integra a regra no módulo central antes de avançar.

### Passo 3 - Documentar defaults seguros no exemplo de ambiente

1. Objetivo funcional do passo no contexto da app.

Dar ao aluno uma referência pública segura para desenvolvimento local e testes.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/.env.example`

3. Instruções do que fazer.

Atualiza o ficheiro `apps/api/.env.example` para documentar a base local normal, a base de teste e exemplos de chaves que não usam credenciais reais.

4. Código completo, correto e integrado com a app final.

```dotenv
# API runtime
NODE_ENV=development
PORT=3001
# Primary frontend origin used for payment redirects.
CLIENT_ORIGIN=http://127.0.0.1:5173
# Accepted browser origins for CORS with HttpOnly cookies in local dev.
CLIENT_ORIGINS=http://127.0.0.1:5173,http://localhost:5173

# MongoDB
# Local development:
MONGODB_URI=mongodb://127.0.0.1:27017/orelle
# Automated tests must use a database name with _test or -test.
# Example for test runs:
# NODE_ENV=test
# MONGODB_URI=mongodb://127.0.0.1:27017/orelle_test
# Remote example, do not commit real credentials:
# MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/orelle?retryWrites=true&w=majority

# Auth/session
# Use a long random value in real environments.
SESSION_SECRET=change-me-use-a-long-random-string
SESSION_TTL=2h

# Security / published environments
# Set true when the API is served behind HTTPS or a reverse proxy.
FORCE_HTTPS=false
# Required in production. Use a strong base64/hex value with 32 bytes or
# another long random secret; never commit the real value.
# DATA_ENCRYPTION_KEY=replace-with-strong-32-byte-secret

# Payments
# Optional. Required only to test Stripe checkout with Stripe test mode.
# STRIPE_SECRET_KEY=sk_test_replace_me

# Admin seed script
# Optional. Required only when running src/scripts/seed-admin.js.
# ADMIN_EMAIL=admin@example.com
# ADMIN_PASSWORD=replace-with-local-admin-password

# MF6 concurrency smoke
# Optional. Defaults to a local 50-request smoke.
# ORELLE_CONCURRENCY_TARGET=50
# ORELLE_CONCURRENCY_BASE_URL=http://127.0.0.1:3001
# ORELLE_ALLOW_REMOTE_CONCURRENCY=false
```

5. Explicação do código.

O ficheiro continua a ser apenas exemplo, por isso não contém segredos reais. A diferença importante está nas linhas de teste: `NODE_ENV=test` e `MONGODB_URI=mongodb://127.0.0.1:27017/orelle_test` mostram a convenção que o guard do próximo passo vai exigir. O exemplo remoto fica comentado para evitar que alguém copie credenciais para o repositório.

6. Validação do passo.

Confirma que o exemplo de teste contém `_test` ou `-test` no nome da base. Confirma também que `STRIPE_SECRET_KEY` usa prefixo de teste.

7. Cenário negativo/erro esperado.

Se alguém usar `MONGODB_URI=mongodb://127.0.0.1:27017/orelle` com `NODE_ENV=test`, o guard do passo seguinte deve bloquear a execução.

### Passo 4 - Implementar o guard de ambiente na configuração central

1. Objetivo funcional do passo no contexto da app.

Garantir que a API arranca em teste apenas com uma configuração isolada.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/config/env.js`

3. Instruções do que fazer.

Atualiza o ficheiro completo. Mantém os exports existentes e adiciona funções pequenas para validar o ambiente de teste. Não cries dependências novas.

4. Código completo, correto e integrado com a app final.

```js
/**
 * Configuracao central da API Orélle.
 *
 * Este ficheiro existe desde o BK-MF0-01 e foi estendido no BK-MF0-02 para
 * incluir os parametros da sessao HttpOnly. A regra pedagogica aqui e simples:
 * o resto da aplicacao importa `env` e nao lê `process.env` diretamente.
 */
import "dotenv/config";

export const ENVIRONMENT_NAMES = Object.freeze({
    DEVELOPMENT: "development",
    TEST: "test",
    PRODUCTION: "production",
});

const INSECURE_SESSION_SECRETS = new Set([
    "dev-only-change-me",
    "change-me",
    "change-me-use-a-long-random-string",
    "secret",
    "session-secret",
]);
const DEFAULT_CLIENT_ORIGIN = "http://127.0.0.1:5173";
const DEFAULT_CLIENT_ORIGINS = [
    DEFAULT_CLIENT_ORIGIN,
    "http://localhost:5173",
];
const DEFAULT_DEV_MONGO_URI = "mongodb://127.0.0.1:27017/orelle";
const DEFAULT_TEST_MONGO_URI = "mongodb://127.0.0.1:27017/orelle_test";
const TEST_DATABASE_MARKERS = [/(^|[_-])test($|[_-])/, /testing/];
const PRODUCTION_DATABASE_MARKERS = [/^orelle$/, /prod/, /production/, /live/];
const SENSITIVE_TEST_ENV_KEYS = [
    "STRIPE_SECRET_KEY",
    "AZURE_FACE_API_KEY",
    "DATA_ENCRYPTION_KEY",
];
const SAFE_TEST_SECRET_MARKERS = [/test/i, /fake/i, /stub/i, /dummy/i, /sandbox/i];
const LIVE_SECRET_MARKERS = [/^sk_live_/i, /^pk_live_/i, /live/i, /prod/i, /production/i];

/**
 * Converte a lista CSV de origens permitidas em valores aceites pelo CORS.
 *
 * `CLIENT_ORIGIN` continua a representar a origem principal usada em redirects,
 * enquanto `CLIENT_ORIGINS` permite aceitar localhost e 127.0.0.1 em dev.
 *
 * @function parseClientOrigins
 * @param {string} rawValue - Lista CSV de origens HTTP/HTTPS.
 * @returns {string[]} Origens limpas e sem entradas vazias.
 */
function parseClientOrigins(rawValue) {
    return rawValue
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}

/**
 * Extrai o nome da base de dados de uma URI MongoDB.
 *
 * @function getMongoDatabaseName
 * @param {string|undefined} mongoUri - URI MongoDB configurada.
 * @returns {string} Nome da base normalizado em minúsculas.
 */
export function getMongoDatabaseName(mongoUri) {
    const normalizedUri = String(mongoUri ?? "").trim().toLowerCase();
    const withoutQuery = normalizedUri.split("?")[0];
    const pathWithoutHost = withoutQuery.replace(/^mongodb(\+srv)?:\/\/[^/]+\/?/, "");

    return pathWithoutHost.split("/").filter(Boolean).at(0) ?? "";
}

/**
 * Indica se uma URI parece apontar para base de produção ou para uma base sem
 * marca explícita de teste.
 *
 * @function isProductionLikeMongoUri
 * @param {string|undefined} mongoUri - URI MongoDB configurada.
 * @returns {boolean} Verdadeiro quando a URI não é segura para testes.
 */
export function isProductionLikeMongoUri(mongoUri) {
    const databaseName = getMongoDatabaseName(mongoUri);
    const hasTestMarker = TEST_DATABASE_MARKERS.some((pattern) =>
        pattern.test(databaseName),
    );
    const hasProductionMarker = PRODUCTION_DATABASE_MARKERS.some((pattern) =>
        pattern.test(databaseName),
    );

    return !databaseName || !hasTestMarker || hasProductionMarker;
}

/**
 * Identifica valores de segredo que parecem reais e não devem ser usados em
 * testes automatizados.
 *
 * @function looksLikeLiveSecret
 * @param {string|undefined} value - Valor de uma variável sensível.
 * @returns {boolean} Verdadeiro quando o valor parece real.
 */
export function looksLikeLiveSecret(value) {
    const normalizedValue = String(value ?? "").trim();

    if (!normalizedValue) {
        return false;
    }

    if (SAFE_TEST_SECRET_MARKERS.some((pattern) => pattern.test(normalizedValue))) {
        return false;
    }

    return LIVE_SECRET_MARKERS.some((pattern) => pattern.test(normalizedValue));
}

/**
 * Lista variáveis sensíveis que parecem reais em modo de teste.
 *
 * @function getUnsafeTestSecretNames
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} source - Fonte das variáveis.
 * @returns {string[]} Nomes das variáveis inseguras.
 */
export function getUnsafeTestSecretNames(source = process.env) {
    return SENSITIVE_TEST_ENV_KEYS.filter((key) => looksLikeLiveSecret(source[key]));
}

/**
 * Identifica segredos de sessao que nao sao aceitaveis em producao.
 *
 * @function isUnsafeProductionSessionSecret
 * @param {string|undefined} secret - Valor de SESSION_SECRET.
 * @returns {boolean} Verdadeiro quando o segredo e ausente, fraco ou temporario.
 */
export function isUnsafeProductionSessionSecret(secret) {
    const normalizedSecret = String(secret ?? "").trim();

    return (
        normalizedSecret.length < 32 ||
        INSECURE_SESSION_SECRETS.has(normalizedSecret.toLowerCase())
    );
}

/**
 * Garante que a configuração de teste não aponta para produção.
 *
 * @function assertTestEnvironmentIsIsolated
 * @param {{ nodeEnv?: string, mongoUri?: string, source?: NodeJS.ProcessEnv|Record<string, string|undefined> }} options - Configuração a validar.
 * @returns {{ nodeEnv: string, mongoDatabaseName: string, unsafeSecretNames: string[] }} Resumo seguro para evidence.
 * @throws {Error} Quando o ambiente de teste não está isolado.
 */
export function assertTestEnvironmentIsIsolated(options = {}) {
    const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV ?? ENVIRONMENT_NAMES.DEVELOPMENT;
    const mongoUri = options.mongoUri ?? process.env.MONGODB_URI ?? DEFAULT_TEST_MONGO_URI;

    if (nodeEnv !== ENVIRONMENT_NAMES.TEST) {
        throw new Error("NODE_ENV=test é obrigatório para executar testes automatizados");
    }

    if (isProductionLikeMongoUri(mongoUri)) {
        throw new Error("MONGODB_URI de teste deve apontar para uma base isolada com sufixo _test ou -test");
    }

    const unsafeSecretNames = getUnsafeTestSecretNames(options.source ?? process.env);

    if (unsafeSecretNames.length > 0) {
        throw new Error(`Credenciais reais não são permitidas em testes: ${unsafeSecretNames.join(", ")}`);
    }

    return {
        nodeEnv,
        mongoDatabaseName: getMongoDatabaseName(mongoUri),
        unsafeSecretNames,
    };
}

const configuredClientOrigin =
    process.env.CLIENT_ORIGIN ?? DEFAULT_CLIENT_ORIGIN;
const configuredClientOrigins =
    process.env.CLIENT_ORIGINS ??
    (process.env.CLIENT_ORIGIN
        ? configuredClientOrigin
        : DEFAULT_CLIENT_ORIGINS.join(","));
const configuredNodeEnv = process.env.NODE_ENV ?? ENVIRONMENT_NAMES.DEVELOPMENT;
const defaultMongoUri =
    configuredNodeEnv === ENVIRONMENT_NAMES.TEST
        ? DEFAULT_TEST_MONGO_URI
        : DEFAULT_DEV_MONGO_URI;

/**
 * Variaveis de ambiente normalizadas usadas pelo backend.
 *
 * @type {{
 *   nodeEnv: string,
 *   port: number,
 *   mongoUri: string,
 *   clientOrigin: string,
 *   clientOrigins: string[],
 *   sessionSecret: string,
 *   sessionTtl: string,
 *   stripeSecretKey: string|undefined,
 *   dataEncryptionKey: string|undefined,
 *   forceHttps: boolean
 * }}
 */
export const env = {
    nodeEnv: configuredNodeEnv,
    port: Number(process.env.PORT ?? 3001),
    mongoUri: process.env.MONGODB_URI ?? defaultMongoUri,
    clientOrigin: configuredClientOrigin,
    clientOrigins: parseClientOrigins(configuredClientOrigins),
    sessionSecret: process.env.SESSION_SECRET ?? "dev-only-change-me",
    sessionTtl: process.env.SESSION_TTL ?? "2h",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY,
    forceHttps:
        process.env.FORCE_HTTPS === "true" ||
        process.env.NODE_ENV === ENVIRONMENT_NAMES.PRODUCTION,
};

// Em producao, uma sessao assinada com o segredo de desenvolvimento seria uma
// falha grave. Por isso, a aplicacao bloqueia logo no arranque.
if (
    env.nodeEnv === ENVIRONMENT_NAMES.PRODUCTION &&
    isUnsafeProductionSessionSecret(env.sessionSecret)
) {
    throw new Error("SESSION_SECRET forte obrigatorio em producao");
}

// Em teste, a API deve falhar cedo se alguém apontar a suite para dados reais
// ou configurar credenciais de ambientes publicados.
if (env.nodeEnv === ENVIRONMENT_NAMES.TEST) {
    assertTestEnvironmentIsIsolated({
        nodeEnv: env.nodeEnv,
        mongoUri: env.mongoUri,
        source: process.env,
    });
}
```

5. Explicação do código.

`ENVIRONMENT_NAMES` evita strings espalhadas. `DEFAULT_TEST_MONGO_URI` muda o default de teste para `orelle_test`, sem alterar o default de desenvolvimento. `getMongoDatabaseName` extrai o nome da base a partir da URI. `isProductionLikeMongoUri` recusa bases sem marca de teste e nomes que pareçam produção. `looksLikeLiveSecret` e `getUnsafeTestSecretNames` protegem contra chaves reais em testes. `assertTestEnvironmentIsIsolated` junta as três regras: `NODE_ENV=test`, base isolada e ausência de credenciais reais. No final do ficheiro, o guard corre automaticamente apenas quando a API está em modo de teste.

6. Validação do passo.

Executa a suite depois de criares o teste do próximo passo. Se a tua `.env` local tiver `MONGODB_URI` sem `_test` ou `-test`, a falha é esperada e deve ser resolvida alterando a variável local de teste.

7. Cenário negativo/erro esperado.

Com `NODE_ENV=test` e `MONGODB_URI=mongodb://127.0.0.1:27017/orelle`, a aplicação deve lançar erro antes de executar testes contra a base normal.

### Passo 5 - Criar o contrato Vitest de isolamento

1. Objetivo funcional do passo no contexto da app.

Provar automaticamente que a configuração de teste cumpre `RNF22`.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.test-env.contract.test.js`

3. Instruções do que fazer.

Cria o teste abaixo. Ele valida o caminho seguro e três negativos relevantes para a prioridade `P1`.

4. Código completo, correto e integrado com a app final.

```js
import { describe, expect, it } from "vitest";

import {
    ENVIRONMENT_NAMES,
    assertTestEnvironmentIsIsolated,
    getMongoDatabaseName,
    getUnsafeTestSecretNames,
    isProductionLikeMongoUri,
    looksLikeLiveSecret,
} from "../src/config/env.js";

/**
 * Contrato MF8 para provar que a suite automatizada não usa configuração de
 * produção. Este teste fecha RNF22 e dá evidence objetiva para a defesa.
 */
describe("BK-MF8-03 test environment isolation", () => {
    it("accepts an explicit test environment with an isolated MongoDB database", () => {
        const result = assertTestEnvironmentIsIsolated({
            nodeEnv: ENVIRONMENT_NAMES.TEST,
            mongoUri: "mongodb://127.0.0.1:27017/orelle_test",
            source: {
                STRIPE_SECRET_KEY: "sk_test_local_contract",
                AZURE_FACE_API_KEY: "fake-azure-key",
            },
        });

        expect(result).toEqual({
            nodeEnv: "test",
            mongoDatabaseName: "orelle_test",
            unsafeSecretNames: [],
        });
    });

    it("rejects automated tests outside NODE_ENV=test", () => {
        expect(() =>
            assertTestEnvironmentIsIsolated({
                nodeEnv: ENVIRONMENT_NAMES.DEVELOPMENT,
                mongoUri: "mongodb://127.0.0.1:27017/orelle_test",
                source: {},
            }),
        ).toThrow("NODE_ENV=test");
    });

    it("rejects MongoDB databases without an explicit test marker", () => {
        expect(getMongoDatabaseName("mongodb://127.0.0.1:27017/orelle")).toBe("orelle");
        expect(isProductionLikeMongoUri("mongodb://127.0.0.1:27017/orelle")).toBe(true);

        expect(() =>
            assertTestEnvironmentIsIsolated({
                nodeEnv: ENVIRONMENT_NAMES.TEST,
                mongoUri: "mongodb://127.0.0.1:27017/orelle",
                source: {},
            }),
        ).toThrow("MONGODB_URI de teste");
    });

    it("rejects production-like database names even when NODE_ENV is test", () => {
        expect(isProductionLikeMongoUri("mongodb://127.0.0.1:27017/orelle-prod")).toBe(true);

        expect(() =>
            assertTestEnvironmentIsIsolated({
                nodeEnv: ENVIRONMENT_NAMES.TEST,
                mongoUri: "mongodb://127.0.0.1:27017/orelle-prod",
                source: {},
            }),
        ).toThrow("MONGODB_URI de teste");
    });

    it("rejects real external credentials in automated tests", () => {
        expect(looksLikeLiveSecret("sk_live_real_value")).toBe(true);
        expect(getUnsafeTestSecretNames({ STRIPE_SECRET_KEY: "sk_live_real_value" })).toEqual([
            "STRIPE_SECRET_KEY",
        ]);

        expect(() =>
            assertTestEnvironmentIsIsolated({
                nodeEnv: ENVIRONMENT_NAMES.TEST,
                mongoUri: "mongodb://127.0.0.1:27017/orelle_test",
                source: { STRIPE_SECRET_KEY: "sk_live_real_value" },
            }),
        ).toThrow("Credenciais reais");
    });
});
```

5. Explicação do código.

O primeiro teste prova o caminho seguro: `NODE_ENV=test`, base `orelle_test` e chaves de teste. Os três negativos principais cobrem ambiente errado, base sem marca de teste e credencial real. O quarto negativo, com `orelle-prod`, impede que alguém tente contornar a regra usando `NODE_ENV=test` mas mantendo um nome de base com sinal de produção. O teste importa apenas funções públicas de `env.js`, por isso valida o contrato real usado pelo backend.

6. Validação do passo.

Executa `npm --prefix apps/api test -- mf8.test-env.contract.test.js`. O teste deve passar sem tocar em qualquer serviço externo.

7. Cenário negativo/erro esperado.

Se trocares a URI segura por `mongodb://127.0.0.1:27017/orelle`, o teste deve falhar com mensagem sobre `MONGODB_URI de teste`.

### Passo 6 - Executar a validação técnica do BK

1. Objetivo funcional do passo no contexto da app.

Confirmar que a alteração compila, que a suite focal passa e que não ficaram sinais inseguros nos ficheiros do BK.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/api/src/config/env.js`
    - REVER: `apps/api/tests/mf8.test-env.contract.test.js`

3. Instruções do que fazer.

Executa os comandos a partir da raiz do repositório. Guarda o comando, diretoria, exit code e resumo do resultado.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix apps/api test -- mf8.test-env.contract.test.js
npm --prefix apps/api test
```

5. Explicação do código.

O primeiro comando executa apenas o contrato do BK e acelera a validação durante o desenvolvimento. O segundo comando garante que a nova regra não quebrou o resto da API. Como o script já existe em `apps/api/package.json`, não é preciso adicionar outro script.

6. Validação do passo.

Os dois comandos devem terminar com exit code `0`. Se a suite completa falhar por causa de uma variável local insegura, corrige a configuração de teste e volta a executar.

7. Cenário negativo/erro esperado.

Com uma credencial real, como uma chave que comece por `sk_live_`, a validação deve bloquear e apontar o nome da variável.

### Passo 7 - Fechar evidence e handoff

1. Objetivo funcional do passo no contexto da app.

Transformar a implementação em evidence clara para PR, defesa e para o `BK-MF8-04`.

2. Ficheiros envolvidos:
    - REVER: `apps/api/.env.example`
    - REVER: `apps/api/src/config/env.js`
    - REVER: `apps/api/tests/mf8.test-env.contract.test.js`

3. Instruções do que fazer.

Regista no PR ou no relatório da equipa:

- O comando focal executado.
- O comando da suite completa.
- O nome da base usada em teste.
- Os negativos cobertos.
- A nota de handoff para `BK-MF8-04`.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. A evidence mostra que o contrato está fechado e que o próximo BK pode simular backups sem tocar em dados reais.

6. Validação do passo.

A evidence deve mencionar `NODE_ENV=test`, `orelle_test`, `mf8.test-env.contract.test.js` e pelo menos dois negativos.

7. Cenário negativo/erro esperado.

Se a evidence só disser "testes passaram" sem comando, diretoria e negativos, o BK ainda não está pronto para revisão.

#### Expected results

- `apps/api/src/config/env.js` define default de teste separado da base local normal.
- `apps/api/tests/mf8.test-env.contract.test.js` prova diretamente `RNF22`.
- A suite bloqueia `NODE_ENV` errado, URI sem marca de teste e credenciais reais em modo de teste.
- `apps/api/.env.example` orienta a equipa sem expor segredos.
- O `BK-MF8-04` consegue consumir o handoff para simular backups numa base de teste.

#### Critérios de aceite

- Entrega funcional específica de `Ambiente de testes separado do ambiente de produção` validada contra `RNF22`.
- O ficheiro `apps/api/src/config/env.js` exporta `assertTestEnvironmentIsIsolated`.
- O ficheiro `apps/api/tests/mf8.test-env.contract.test.js` cobre caminho seguro e pelo menos dois negativos.
- `apps/api/.env.example` documenta uma URI de teste com `_test` ou `-test`.
- Evidencia de testes por camada conforme prioridade (`P1`).
- Cenarios negativos concluidos: minimo `2` com resultado controlado.

### Matriz minima de testes por prioridade

- Testes por prioridade respeitados: `P0` exige unit + integration + e2e + 3 negativos; `P1` exige unit/integration + 2 negativos; `P2` exige teste focal + 1 negativo.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisão técnica e defesa PAP.

#### Validação final

- [ ] Smoke: `npm --prefix apps/api test -- mf8.test-env.contract.test.js`.
- [ ] Suite API: `npm --prefix apps/api test`.
- [ ] Negativos: minimo `2` cenários com resultado controlado.
- [ ] Técnico: imports e exports de `apps/api/src/config/env.js` sem duplicação de configuração.
- [ ] Segurança/privacidade: testes não exigem credenciais reais nem base sem marca de teste.
- [ ] Handoff: `BK-MF8-04` documentado e risco restante registado.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite`, `## Evidence para PR/defesa`.

#### Evidence para PR/defesa

- `pr`: referência de commit/PR e resumo técnico da alteração.
- `proof_tecnico`: `npm --prefix apps/api test -- mf8.test-env.contract.test.js` e `npm --prefix apps/api test`.
- `proof_negativos`: `NODE_ENV` diferente de `test` é bloqueado; base sem `_test`/`-test` é recusada; credencial real em teste é recusada.
- `proof_privacidade`: confirmação de que a suite usa base local de teste e valores externos seguros.
- `proof_handoff`: nota curta a explicar como `BK-MF8-04` usa esta entrega para simular backups sem tocar em dados reais.

#### Handoff

- Próximo BK recomendado: `BK-MF8-04`
- O `BK-MF8-04` deve executar qualquer simulação de backup contra a base `orelle_test` ou equivalente com marca de teste.
- Risco a vigiar: se a equipa definir `MONGODB_URI` manualmente para testes, o nome da base tem de manter `_test` ou `-test`.

#### Changelog

- `2026-06-30`: guia revisto para a estrutura tutorial MF8, com caminhos públicos `apps/...`, contrato de evidence, negativos mínimos e handoff explícito.
- `2026-07-01`: corrigido o guia para incluir implementação completa de isolamento de ambiente, guard em `env.js`, exemplo `.env` seguro e teste Vitest focal para `RNF22`.
