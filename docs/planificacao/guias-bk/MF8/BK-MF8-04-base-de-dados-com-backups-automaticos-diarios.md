# BK-MF8-04 - Base de dados com backups automáticos diários

## Header
- `doc_id`: `GUIA-BK-MF8-04`
- `bk_id`: `BK-MF8-04`
- `macro`: `MF8`
- `owner`: `Daniel Bulica`
- `apoio`: `Aline`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF8-03`
- `rf_rnf`: `RNF21`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF8-05`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-04-base-de-dados-com-backups-automaticos-diarios.md`
- `last_updated`: `2026-07-01`

#### Objetivo

Neste BK vais implementar um procedimento seguro de backup diário para a base de dados MongoDB da Orélle, validado em ambiente de teste e sem publicar artefactos sensíveis no repositório.

#### Importância

A Orélle guarda perfis cosméticos, histórico de análise facial, encomendas, pedidos de privacidade e dados associados a decisões de recomendação. Um erro de base de dados pode apagar evidence, impedir auditoria e afectar dados pessoais. O `RNF21` existe para garantir que a equipa tem uma rotina mínima de cópia, validação e prova técnica antes da entrega final da PAP.

#### Scope-in

- Criar um script Node.js para gerar backups locais controlados da base de dados.
- Bloquear backups fora de `NODE_ENV=test` e fora da base isolada entregue pelo `BK-MF8-03`.
- Guardar os artefactos em `storage/private/backups`, fora de pastas públicas.
- Redigir campos sensíveis no backup pedagógico: passwords, tokens, cookies, chaves, storage interno, fotografias, relatórios e dados biométricos crus.
- Criar um teste Vitest para provar destino seguro, ausência de segredos no output e negativos mínimos `P1`.
- Documentar como simular a execução diária sem contratar infraestrutura externa.

#### Scope-out

- Não criar infraestrutura cloud, S3, cron real de servidor, webhooks ou serviços pagos.
- Não executar restore destrutivo sobre ambiente real.
- Não publicar ficheiros de backup no Git.
- Não alterar modelos, controllers, routes, permissões ou fluxo de negócio da aplicação.
- Não criar frontend, porque este BK é operacional/backend.

#### Estado antes e depois

- Antes: o `BK-MF8-03` prepara ambiente de teste isolado, mas a equipa ainda não tem um procedimento de backup verificável.
- Depois: existe um script de backup local controlado, um comando npm, um destino privado ignorado pelo Git, um teste de contrato e evidence objectiva para `RNF21`.

#### Pre-requisitos

- Ter concluído o `BK-MF8-03`, incluindo `assertTestEnvironmentIsIsolated` em `apps/api/src/config/env.js`.
- Ter `apps/api/package.json` com Vitest no script `test`.
- Ter MongoDB local disponível para validação completa, ou usar `--dry-run` para validar o contrato sem abrir ligação.
- Saber executar comandos a partir da raiz do repositório.
- Saber distinguir dados reais, dados de teste e artefactos que nunca devem entrar no Git.

#### Glossário

- Backup: cópia técnica que permite recuperar ou, nesta fase, provar o procedimento de recuperação de dados.
- Manifesto de backup: ficheiro JSON com metadados seguros da execução, como `backupId`, data, modo e colecções processadas.
- Artefacto privado: ficheiro gerado localmente que não pode ser versionado nem servido pelo frontend.
- Dry-run: execução de simulação que valida configuração e destino sem ler documentos da base de dados.
- Redacção de campos sensíveis: substituição controlada de valores privados por `[redigido]`.
- Retenção: período durante o qual uma cópia é mantida antes de ser apagada por política operacional.

#### Conceitos teóricos essenciais

Um backup não é só "copiar ficheiros". Para ser útil, precisa de três sinais: destino seguro, execução repetível e evidence de que não expõe dados sensíveis. Se a cópia for guardada em `public/`, `apps/web/` ou `dist/`, pode ficar acessível ao utilizador final. Se for gerada com a base errada, pode recolher dados reais durante testes. Se for versionada, passa a existir risco de exposição permanente no Git.

O `BK-MF8-03` criou a fronteira de ambiente: `NODE_ENV=test`, `MONGODB_URI` com base `orelle_test` ou equivalente e bloqueio de credenciais reais. Este BK consome essa fronteira. A regra é simples: a rotina de backup da PAP só pode ser validada contra dados de teste. Assim, o aluno prova o procedimento sem tocar nos dados de produção nem em dados pessoais reais.

Como a Orélle trata fotografias, relatórios cosméticos, pedidos de privacidade, encomendas e recomendações, o backup pedagógico não deve despejar tudo para um ficheiro legível sem controlo. O script abaixo redige campos com nomes sensíveis, escreve os ficheiros numa pasta privada e devolve no terminal apenas um resumo minimizado. O manifesto serve para defesa técnica; não substitui uma política profissional de disaster recovery, mas fecha o requisito PAP com uma implementação executável e segura.

Em testes, a prioridade `P1` exige `unit/integration` e pelo menos dois negativos. Neste BK os negativos principais são: recusar backup sem `MONGODB_URI`, recusar destino público e recusar output que exponha URI, password, token, cookie, secret ou caminho interno.

#### Arquitetura do BK

- `bk_id`: `BK-MF8-04`
- `flow_id`: `FLOW-MF8-BACKUPS`
- `requisitos`: `RNF21`
- `dependências`: `BK-MF8-03`
- `tema técnico`: `fiabilidade de dados`
- `destino dos alunos`: `apps/api`
- `decisão CANONICO`: `RNF21` pede backups automáticos diários da base de dados.
- `decisão CANONICO`: `BK-MF8-04` depende de `BK-MF8-03`, porque backups de validação não podem tocar em produção.
- `decisão DERIVADO`: o backup é local e controlado em `storage/private/backups`, sem infraestrutura externa, para manter o BK executável no contexto PAP.
- `decisão DERIVADO`: o comando `backup:daily` simula a rotina diária; a activação por cron real fica fora deste BK.

#### Ficheiros a criar/editar/rever

- EDITAR: `.gitignore`
- EDITAR: `apps/api/package.json`
- CRIAR: `apps/api/scripts/backup-daily.mjs`
- CRIAR: `apps/api/tests/mf8.backup.contract.test.js`
- REVER: `apps/api/src/config/env.js`
- REVER: `apps/api/src/config/db.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato, dependência e limites do backup

1. Objetivo funcional do passo no contexto da app.

Confirmar que o BK implementa apenas `RNF21`, consome o isolamento do `BK-MF8-03` e não cria infraestrutura externa.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
    - REVER: `docs/planificacao/sprints/PLANO-SPRINTS.md`
    - LOCALIZAÇÃO: linhas de `RNF21`, linha canónica de `BK-MF8-04` e matriz mínima de testes por prioridade.

3. Instruções do que fazer.

Confirma estes factos antes de programar:

- `RNF21` é "Base de dados com backups automáticos diários".
- `BK-MF8-04` é `P1`, sprint `S11-S12`, depende de `BK-MF8-03` e entrega handoff para `BK-MF8-05`.
- Para `P1`, precisas de evidence `unit/integration` e pelo menos `2` cenários negativos.
- O backup deste BK é local e pedagógico; não contrata serviços externos nem executa restore real.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. A decisão técnica importante é evitar começar pelo script sem confirmar primeiro a base canónica e os limites de segurança. Backups podem expor muitos dados de uma só vez; por isso, este BK só avança depois de confirmar ambiente de teste, destino privado e negativos.

6. Validação do passo.

Executa:

```bash
rg -n "RNF21|BK-MF8-04|Matriz minima de testes" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md docs/planificacao/sprints/PLANO-SPRINTS.md
```

7. Cenário negativo/erro esperado.

Se `RNF21` ou `BK-MF8-04` não aparecerem nos documentos canónicos, pára a implementação e regista o bloqueio. Não cries uma política de backup inventada.

### Passo 2 - Proteger o destino dos backups no Git

1. Objetivo funcional do passo no contexto da app.

Garantir que os ficheiros gerados pelo backup ficam fora do Git e fora de pastas públicas.

2. Ficheiros envolvidos:
    - EDITAR: `.gitignore`
    - LOCALIZAÇÃO: fim do ficheiro.

3. Instruções do que fazer.

No fim de `.gitignore`, acrescenta as regras abaixo. Elas ignoram o destino principal do BK e também uma pasta temporária usada pelo teste.

4. Código completo, correto e integrado com a app final.

```gitignore
# Backups locais da API Orélle
storage/private/backups/
storage/private/backups-test/
apps/api/storage/private/backups/
*.backup.json
*.backup.jsonl
```

5. Explicação do código.

Estas regras protegem os artefactos de backup de dois erros comuns: commit acidental e exposição pública. A pasta `storage/private/backups/` é o destino normal do script. A pasta `storage/private/backups-test/` é usada pelo teste Vitest para validar a escrita sem sujar o destino real. O padrão `apps/api/storage/private/backups/` protege equipas que executem o script a partir da pasta da API e criem o destino localmente por engano.

6. Validação do passo.

Executa:

```bash
git check-ignore storage/private/backups/teste.backup.json
git check-ignore storage/private/backups-test/teste.backup.json
```

Ambos os comandos devem devolver o caminho ignorado.

7. Cenário negativo/erro esperado.

Se `git check-ignore` não devolver nada, o backup ainda pode ser versionado. Corrige `.gitignore` antes de criares o script.

### Passo 3 - Adicionar o comando npm de backup

1. Objetivo funcional do passo no contexto da app.

Criar um comando claro para executar o script de backup sem memorizar o caminho do ficheiro.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/package.json`
    - LOCALIZAÇÃO: objecto `scripts`.

3. Instruções do que fazer.

Adiciona `backup:daily` ao objecto `scripts`, mantendo os comandos existentes.

4. Código completo, correto e integrado com a app final.

```json
{
    "scripts": {
        "dev": "node --watch src/server.js",
        "start": "node src/server.js",
        "test": "vitest run --no-cache",
        "backup:daily": "node scripts/backup-daily.mjs"
    }
}
```

5. Explicação do código.

O comando `backup:daily` aponta para `apps/api/scripts/backup-daily.mjs`. Ele não altera a forma como a API arranca nem a forma como os testes correm. A palavra `daily` torna explícita a intenção operacional do `RNF21`: este script é o ponto que, num ambiente profissional, seria chamado por uma tarefa agendada.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api run
```

Confirma que `backup:daily` aparece na lista de scripts.

7. Cenário negativo/erro esperado.

Se correres `npm --prefix apps/api run backup:daily` antes de criares `apps/api/scripts/backup-daily.mjs`, o Node deve falhar com ficheiro inexistente. Esta falha é esperada neste momento.

### Passo 4 - Criar o script de backup seguro

1. Objetivo funcional do passo no contexto da app.

Criar o script que valida ambiente, valida destino, redige campos sensíveis e gera um manifesto de backup.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/scripts/backup-daily.mjs`
    - REVER: `apps/api/src/config/env.js`
    - REVER: `apps/api/src/config/db.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. O script usa `assertTestEnvironmentIsIsolated` do `BK-MF8-03`, reutiliza a ligação MongoDB existente e permite `--dry-run` para validar o contrato sem abrir ligação à base.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/scripts/backup-daily.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import mongoose from "mongoose";

import {
    assertTestEnvironmentIsIsolated,
    env,
    getMongoDatabaseName,
} from "../src/config/env.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const API_ROOT = path.resolve(path.dirname(SCRIPT_FILE), "..");
const REPO_ROOT = path.resolve(API_ROOT, "..", "..");
const PRIVATE_STORAGE_ROOT = path.join(REPO_ROOT, "storage", "private");

export const DEFAULT_BACKUP_ROOT = path.join(PRIVATE_STORAGE_ROOT, "backups");

const SENSITIVE_KEY_PATTERNS = [
    /password/i,
    /token/i,
    /cookie/i,
    /secret/i,
    /api[_-]?key/i,
    /^storageKey$/i,
    /filePath/i,
    /path$/i,
    /photo/i,
    /image/i,
    /report/i,
    /biometric/i,
];

const PUBLIC_DESTINATION_PATTERNS = [
    `${path.sep}public${path.sep}`,
    `${path.sep}dist${path.sep}`,
    `${path.sep}build${path.sep}`,
    `${path.sep}node_modules${path.sep}`,
    `${path.sep}apps${path.sep}web${path.sep}`,
];

/**
 * Resolve e valida a pasta onde os backups podem ser escritos.
 *
 * @function resolveBackupRoot
 * @param {string|undefined} rawRoot - Pasta recebida por BACKUP_ROOT ou por teste.
 * @returns {string} Caminho absoluto dentro de storage/private.
 * @throws {Error} Quando o destino é vazio, público ou fora da área privada.
 */
export function resolveBackupRoot(rawRoot = process.env.BACKUP_ROOT) {
    const backupRoot = rawRoot
        ? path.resolve(REPO_ROOT, rawRoot)
        : DEFAULT_BACKUP_ROOT;
    const relativeToPrivate = path.relative(PRIVATE_STORAGE_ROOT, backupRoot);
    const isOutsidePrivate =
        relativeToPrivate.startsWith("..") || path.isAbsolute(relativeToPrivate);
    const normalizedRoot = `${path.normalize(backupRoot)}${path.sep}`;

    if (!String(rawRoot ?? DEFAULT_BACKUP_ROOT).trim()) {
        throw new Error("BACKUP_ROOT não pode estar vazio");
    }

    if (isOutsidePrivate) {
        throw new Error("BACKUP_ROOT deve ficar dentro de storage/private");
    }

    if (PUBLIC_DESTINATION_PATTERNS.some((pattern) => normalizedRoot.includes(pattern))) {
        throw new Error("BACKUP_ROOT não pode apontar para pasta pública ou de build");
    }

    return backupRoot;
}

/**
 * Indica se uma chave de documento deve ser redigida no backup pedagógico.
 *
 * @function isSensitiveKey
 * @param {string} key - Nome do campo no documento MongoDB.
 * @returns {boolean} Verdadeiro quando o campo pode conter dado sensível.
 */
export function isSensitiveKey(key) {
    return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Redige campos sensíveis em documentos antes de escrever o backup.
 *
 * @function redactSensitiveFields
 * @param {unknown} value - Valor a preparar para o backup.
 * @returns {unknown} Valor seguro para serialização.
 */
export function redactSensitiveFields(value) {
    if (Array.isArray(value)) {
        return value.map((item) => redactSensitiveFields(item));
    }

    if (value && typeof value === "object") {
        const plainValue = JSON.parse(JSON.stringify(value));

        return Object.fromEntries(
            Object.entries(plainValue).map(([key, item]) => {
                if (isSensitiveKey(key)) {
                    // Redigimos o valor, não a chave, para a equipa perceber que o campo existia sem expor o seu conteúdo.
                    return [key, "[redigido]"];
                }

                return [key, redactSensitiveFields(item)];
            }),
        );
    }

    return value;
}

/**
 * Cria um identificador estável e legível para a execução de backup.
 *
 * @function createBackupId
 * @param {Date} now - Data usada na evidence.
 * @returns {string} Identificador sem caracteres problemáticos para ficheiros.
 */
export function createBackupId(now = new Date()) {
    return `bk-mf8-04-${now.toISOString().replace(/[:.]/g, "-")}`;
}

/**
 * Constrói o nome do ficheiro de uma colecção.
 *
 * @function createCollectionBackupFileName
 * @param {string} collectionName - Nome da colecção MongoDB.
 * @param {Date} now - Data usada na evidence.
 * @returns {string} Nome de ficheiro seguro.
 */
export function createCollectionBackupFileName(collectionName, now = new Date()) {
    const safeCollectionName = collectionName.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();

    return `${createBackupId(now)}-${safeCollectionName}.backup.json`;
}

/**
 * Valida ambiente e destino antes de qualquer leitura da base de dados.
 *
 * @function validateBackupConfiguration
 * @param {{ nodeEnv?: string, mongoUri?: string, source?: NodeJS.ProcessEnv|Record<string, string|undefined>, backupRoot?: string }} options - Configuração a validar.
 * @returns {{ backupRoot: string, mongoDatabaseName: string }} Resumo seguro da configuração.
 * @throws {Error} Quando o ambiente ou destino podem tocar em dados reais.
 */
export function validateBackupConfiguration(options = {}) {
    const nodeEnv = options.nodeEnv ?? env.nodeEnv;
    const mongoUri = options.mongoUri ?? env.mongoUri;
    const backupRoot = resolveBackupRoot(options.backupRoot);

    if (!mongoUri) {
        throw new Error("MONGODB_URI de teste é obrigatório para executar backup");
    }

    const isolation = assertTestEnvironmentIsIsolated({
        nodeEnv,
        mongoUri,
        source: options.source ?? process.env,
    });

    return {
        backupRoot,
        mongoDatabaseName: isolation.mongoDatabaseName,
    };
}

/**
 * Garante que o resumo público não contém segredos nem caminhos internos.
 *
 * @function assertPublicOutputDoesNotExposeSecrets
 * @param {unknown} output - Resumo a escrever no terminal ou na evidence.
 * @returns {void}
 * @throws {Error} Quando o output contém dados sensíveis.
 */
export function assertPublicOutputDoesNotExposeSecrets(output) {
    const serializedOutput = JSON.stringify(output);
    const forbiddenPatterns = [
        /mongodb(\+srv)?:\/\//i,
        /password/i,
        /token/i,
        /cookie/i,
        /secret/i,
        /storageKey/i,
        /\/Users\//,
        /storage\/private/i,
    ];

    if (forbiddenPatterns.some((pattern) => pattern.test(serializedOutput))) {
        throw new Error("Resumo público do backup não pode expor segredos ou caminhos internos");
    }
}

/**
 * Lê todos os documentos de uma colecção e escreve um ficheiro JSON redigido.
 *
 * @async
 * @function writeCollectionBackup
 * @param {{ collectionName: string, collection: import("mongodb").Collection, backupRoot: string, now: Date }} options - Dados da colecção.
 * @returns {Promise<{ name: string, count: number, fileName: string }>} Metadados seguros da colecção.
 */
export async function writeCollectionBackup({ collectionName, collection, backupRoot, now }) {
    const documents = await collection.find({}).toArray();
    const safeDocuments = redactSensitiveFields(documents);
    const fileName = createCollectionBackupFileName(collectionName, now);
    const destination = path.join(backupRoot, fileName);

    // O ficheiro fica no destino privado validado antes da leitura da base, reduzindo o risco de exposição acidental.
    await writeFile(destination, `${JSON.stringify(safeDocuments, null, 2)}\n`, "utf8");

    return {
        name: collectionName,
        count: documents.length,
        fileName,
    };
}

/**
 * Executa o backup ou a simulação segura do BK-MF8-04.
 *
 * @async
 * @function runBackup
 * @param {{ dryRun?: boolean, now?: Date, backupRoot?: string, nodeEnv?: string, mongoUri?: string, source?: NodeJS.ProcessEnv|Record<string, string|undefined> }} options - Opções de execução.
 * @returns {Promise<{ backupId: string, status: string, dryRun: boolean, databaseName: string, collections: Array<{ name: string, count: number, fileName: string }> }>} Resumo seguro para PR/defesa.
 */
export async function runBackup(options = {}) {
    const dryRun = options.dryRun ?? process.argv.includes("--dry-run");
    const now = options.now ?? new Date();
    const backupId = createBackupId(now);
    const { backupRoot, mongoDatabaseName } = validateBackupConfiguration(options);
    const collections = [];
    let connected = false;

    await mkdir(backupRoot, { recursive: true });

    try {
        if (!dryRun) {
            await connectDB();
            connected = true;

            for (const [collectionName, collection] of Object.entries(mongoose.connection.collections)) {
                collections.push(
                    await writeCollectionBackup({
                        collectionName,
                        collection,
                        backupRoot,
                        now,
                    }),
                );
            }
        }
    } finally {
        if (connected) {
            await disconnectDB();
        }
    }

    const manifest = {
        backupId,
        bkId: "BK-MF8-04",
        requirement: "RNF21",
        generatedAt: now.toISOString(),
        dryRun,
        databaseName: getMongoDatabaseName(options.mongoUri ?? env.mongoUri),
        collections,
    };
    const manifestFileName = `${backupId}-manifest.backup.json`;

    await writeFile(
        path.join(backupRoot, manifestFileName),
        `${JSON.stringify(manifest, null, 2)}\n`,
        "utf8",
    );

    const publicSummary = {
        backupId,
        status: "ok",
        dryRun,
        databaseName: mongoDatabaseName,
        collections,
    };

    assertPublicOutputDoesNotExposeSecrets(publicSummary);

    return publicSummary;
}

if (process.argv[1] === SCRIPT_FILE) {
    runBackup()
        .then((summary) => {
            console.log(JSON.stringify(summary, null, 2));
        })
        .catch((error) => {
            console.error(`Backup BK-MF8-04 falhou: ${error.message}`);
            process.exitCode = 1;
        });
}
```

5. Explicação do código.

O script começa por calcular a raiz da API e do repositório a partir de `import.meta.url`, por isso funciona mesmo quando o comando é executado com `npm --prefix apps/api`. `resolveBackupRoot` só aceita destinos dentro de `storage/private`, impedindo pastas servidas pelo frontend, `public`, `dist`, `build` ou `node_modules`. `validateBackupConfiguration` consome o guard do `BK-MF8-03`: se `NODE_ENV` não for `test`, se a URI não apontar para uma base de teste ou se houver credenciais reais, o backup falha antes de ler documentos.

`redactSensitiveFields` percorre objectos e arrays para substituir valores privados por `[redigido]`. Isto protege campos como `passwordHash`, tokens, cookies, storage interno, fotografias e relatórios. `writeCollectionBackup` grava um ficheiro JSON por colecção, mas sempre no destino validado. `runBackup` junta tudo: cria a pasta, executa `--dry-run` sem base de dados ou, sem `--dry-run`, liga ao MongoDB, escreve os ficheiros e gera um manifesto. O output final é minimizado e validado por `assertPublicOutputDoesNotExposeSecrets`, para não mostrar URI MongoDB, paths internos ou segredos no terminal.

6. Validação do passo.

Depois de criares o teste do próximo passo, executa o modo de simulação:

```bash
NODE_ENV=test MONGODB_URI=mongodb://127.0.0.1:27017/orelle_test npm --prefix apps/api run backup:daily -- --dry-run
```

O comando deve devolver JSON com `status: "ok"`, `dryRun: true`, `databaseName: "orelle_test"` e sem paths internos.

7. Cenário negativo/erro esperado.

Com `NODE_ENV=development`, o comando deve falhar com mensagem sobre `NODE_ENV=test`. Com `BACKUP_ROOT=apps/web/public/backups`, deve falhar com mensagem sobre destino privado.

### Passo 5 - Criar o contrato Vitest do backup

1. Objetivo funcional do passo no contexto da app.

Provar automaticamente que o backup cumpre `RNF21`, usa destino privado e não expõe segredos.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.backup.contract.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o teste abaixo. Ele cobre um caminho seguro e quatro negativos: destino público, URI em falta, campo sensível e output inseguro.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.backup.contract.test.js
import { rm, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    assertPublicOutputDoesNotExposeSecrets,
    createBackupId,
    redactSensitiveFields,
    resolveBackupRoot,
    runBackup,
    validateBackupConfiguration,
} from "../scripts/backup-daily.mjs";

const SAFE_TEST_ENV = {
    STRIPE_SECRET_KEY: "sk_test_backup_contract",
    AZURE_FACE_API_KEY: "fake-azure-key",
};

/**
 * Contrato MF8 para provar que a rotina de backup do RNF21 é segura, repetível
 * e validável sem tocar em dados reais.
 */
describe("BK-MF8-04 backup diário", () => {
    it("gera manifesto dry-run em destino privado", async () => {
        const backupRoot = resolveBackupRoot("storage/private/backups-test");
        const now = new Date("2026-07-01T10:00:00.000Z");

        await rm(backupRoot, { recursive: true, force: true });

        const summary = await runBackup({
            dryRun: true,
            now,
            backupRoot: "storage/private/backups-test",
            nodeEnv: "test",
            mongoUri: "mongodb://127.0.0.1:27017/orelle_test",
            source: SAFE_TEST_ENV,
        });
        const manifestPath = path.join(backupRoot, `${createBackupId(now)}-manifest.backup.json`);
        const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

        expect(summary).toMatchObject({
            status: "ok",
            dryRun: true,
            databaseName: "orelle_test",
            collections: [],
        });
        expect(manifest).toMatchObject({
            bkId: "BK-MF8-04",
            requirement: "RNF21",
            dryRun: true,
            databaseName: "orelle_test",
        });

        await rm(backupRoot, { recursive: true, force: true });
    });

    it("recusa destino fora de storage/private", () => {
        expect(() => resolveBackupRoot("apps/web/public/backups")).toThrow("storage/private");
    });

    it("recusa backup sem MONGODB_URI de teste", () => {
        expect(() =>
            validateBackupConfiguration({
                nodeEnv: "test",
                mongoUri: "",
                backupRoot: "storage/private/backups-test",
                source: SAFE_TEST_ENV,
            }),
        ).toThrow("MONGODB_URI");
    });

    it("redige campos sensíveis antes de escrever ficheiros", () => {
        const redacted = redactSensitiveFields({
            email: "cliente@orelle.test",
            passwordHash: "$2a$12$hash",
            profile: {
                skinType: "oleosa",
                storageKey: "private/faces/user-1/front.png",
            },
            recommendations: [{ productName: "Gel suave", reason: "oleosidade" }],
        });

        expect(redacted).toEqual({
            email: "cliente@orelle.test",
            passwordHash: "[redigido]",
            profile: {
                skinType: "oleosa",
                storageKey: "[redigido]",
            },
            recommendations: [{ productName: "Gel suave", reason: "oleosidade" }],
        });
    });

    it("bloqueia resumo público com segredos ou paths internos", () => {
        expect(() =>
            assertPublicOutputDoesNotExposeSecrets({
                mongoUri: "mongodb://127.0.0.1:27017/orelle_test",
            }),
        ).toThrow("Resumo público");

        expect(() =>
            assertPublicOutputDoesNotExposeSecrets({
                filePath: "/Users/aluno/orelle/storage/private/backups/a.backup.json",
            }),
        ).toThrow("Resumo público");
    });
});
```

5. Explicação do código.

O primeiro teste executa `runBackup` em `dryRun`, com `NODE_ENV=test`, URI `orelle_test` e destino privado. Depois lê o manifesto escrito em `storage/private/backups-test` para provar que o ficheiro existe e que contém `BK-MF8-04` e `RNF21`. Os negativos fecham os riscos principais do BK: destino público, falta de URI de teste, campos sensíveis sem redacção e output com URI ou path interno. O teste não precisa de MongoDB real porque valida o contrato crítico de segurança e evidence; a execução sem `--dry-run` fica para a validação manual controlada da equipa.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- mf8.backup.contract.test.js
```

O resultado esperado é o ficheiro `mf8.backup.contract.test.js` passar com todos os testes.

7. Cenário negativo/erro esperado.

Se mudares `backupRoot` para `apps/web/public/backups`, o teste deve falhar porque esse destino pode ser servido pelo frontend.

### Passo 6 - Executar simulação, teste e validação da planificação

1. Objetivo funcional do passo no contexto da app.

Transformar a implementação em evidence técnica verificável para PR e defesa.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/api/scripts/backup-daily.mjs`
    - REVER: `apps/api/tests/mf8.backup.contract.test.js`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-04-base-de-dados-com-backups-automaticos-diarios.md`
    - LOCALIZAÇÃO: comandos de validação e outputs.

3. Instruções do que fazer.

Executa os comandos abaixo a partir da raiz do repositório. Guarda os outputs principais na tua evidence.

4. Código completo, correto e integrado com a app final.

```bash
NODE_ENV=test MONGODB_URI=mongodb://127.0.0.1:27017/orelle_test npm --prefix apps/api run backup:daily -- --dry-run
npm --prefix apps/api test -- mf8.backup.contract.test.js
npm --prefix apps/api test
bash scripts/validate-planificacao.sh
git diff --check
```

5. Explicação do código.

O primeiro comando prova a execução controlada do script sem abrir ligação à base. O segundo comando valida o contrato `RNF21`. O terceiro confirma que o novo teste não quebrou a suite existente. O quarto garante que a planificação continua coerente com matriz, backlog, links e qualidade dos guias. O último evita whitespace inválido no diff.

6. Validação do passo.

A validação mínima do BK está fechada quando:

- `backup:daily -- --dry-run` devolve `status: "ok"`.
- `mf8.backup.contract.test.js` passa.
- `npm --prefix apps/api test` passa ou, se falhar por ambiente, fica registado com erro exacto.
- `bash scripts/validate-planificacao.sh` passa.
- `git diff --check` passa.

7. Cenário negativo/erro esperado.

Se os testes HTTP falharem com `listen EPERM` dentro de uma sandbox, regista o bloqueio de ambiente e reexecuta fora da sandbox. Não marques o BK como validado só com a falha.

### Passo 7 - Preparar evidence e handoff para a MF8

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com evidence clara, riscos restantes e ligação ao `BK-MF8-05`.

2. Ficheiros envolvidos:
    - REVER: `storage/private/backups-test/`
    - REVER: `apps/api/tests/mf8.backup.contract.test.js`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-05-a-ia-deve-indicar-como-chegou-as-recomendacoes-explicabilidade.md`
    - LOCALIZAÇÃO: secção de evidence do PR/defesa.

3. Instruções do que fazer.

Na evidence, regista:

- comando `backup:daily -- --dry-run`;
- `backupId` devolvido pelo script;
- resultado do teste focal;
- dois negativos executados;
- confirmação de que `storage/private/backups-test/` é ignorado pelo Git;
- nota de que o `BK-MF8-05` pode avançar sem depender tecnicamente do backup, mas a MF8 fica mais defensável com `RNF21` fechado.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. Aqui o trabalho é transformar a implementação em prova. A defesa PAP precisa de mostrar que a equipa não criou apenas um ficheiro: criou um procedimento, validou negativos e evitou exposição de dados sensíveis.

6. Validação do passo.

Confirma que a evidence inclui comando, directoria, resultado observado, negativos e impacto. Confirma também que não há ficheiros de backup no `git status`.

7. Cenário negativo/erro esperado.

Se `git status --short --untracked-files=all` mostrar ficheiros em `storage/private/backups` ou `storage/private/backups-test`, `.gitignore` ainda não está a proteger os artefactos.

#### Expected results

- `apps/api/scripts/backup-daily.mjs` existe, valida ambiente de teste e escreve apenas em destino privado.
- `apps/api/package.json` contém o script `backup:daily`.
- `.gitignore` impede commits acidentais de backups locais.
- `apps/api/tests/mf8.backup.contract.test.js` prova destino privado, URI obrigatória, redacção de campos sensíveis e output público minimizado.
- Executar cenarios negativos obrigatorios (minimo 2) com resultado controlado.
- O `BK-MF8-05` consegue continuar a cadeia MF8 sem herdar um requisito de fiabilidade em aberto.

#### Critérios de aceite

- Entrega funcional específica de `Base de dados com backups automáticos diários` validada contra `RNF21`.
- `backup:daily -- --dry-run` devolve `status: "ok"` sem expor URI MongoDB, paths internos, passwords, tokens, cookies ou chaves.
- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).

### Matriz minima de testes por prioridade

- Testes por prioridade respeitados: `P0` exige unit + integration + e2e + 3 negativos; `P1` exige unit/integration + 2 negativos; `P2` exige teste focal + 1 negativo.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Nenhum backup local aparece em `git status`.
- Evidence pronta para revisão técnica e defesa PAP.

#### Validação final

- [ ] `git check-ignore storage/private/backups/teste.backup.json` devolve o caminho ignorado.
- [ ] `NODE_ENV=test MONGODB_URI=mongodb://127.0.0.1:27017/orelle_test npm --prefix apps/api run backup:daily -- --dry-run` passa.
- [ ] `npm --prefix apps/api test -- mf8.backup.contract.test.js` passa.
- [ ] Executar cenarios negativos obrigatorios (minimo 2) com resultado controlado.
- [ ] Negativos: minimo 2 cenarios com resultado controlado.
- [ ] `npm --prefix apps/api test` passa ou fica registado como bloqueio de ambiente com erro exacto.
- [ ] `bash scripts/validate-planificacao.sh` passa.
- [ ] `git diff --check` passa.
- [ ] Handoff para `BK-MF8-05` documentado.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite`, `## Evidence para PR/defesa`.

#### Evidence para PR/defesa

- `pr`: referência de commit/PR e resumo técnico da alteração.
- `proof_tecnico`: output de `backup:daily -- --dry-run` com `status: "ok"` e `databaseName: "orelle_test"`.
- `proof_testes`: output de `npm --prefix apps/api test -- mf8.backup.contract.test.js`.
- `proof_negativos`: destino público recusado; `MONGODB_URI` vazia recusada; output com URI/path interno bloqueado.
- `proof_privacidade`: campos como `passwordHash` e `storageKey` aparecem redigidos como `[redigido]`.
- `proof_git`: `git check-ignore` confirma que backups locais não são versionados.
- `proof_handoff`: nota curta a explicar que `BK-MF8-05` avança para explicabilidade IA com a camada de fiabilidade `RNF21` fechada.

#### Handoff

- Próximo BK recomendado: `BK-MF8-05`.
- O `BK-MF8-05` trata explicabilidade de recomendações IA. Ele não consome ficheiros de backup directamente, mas beneficia de a MF8 já ter evidence operacional para ambiente de teste, backup e fiabilidade.
- Risco a vigiar: se a equipa transformar o `--dry-run` em execução real, tem de continuar a usar base de teste, destino privado e output minimizado.

#### Changelog

- `2026-07-01`: guia reescrito em modo `corrigir_apenas`, com script `backup-daily.mjs`, teste `mf8.backup.contract.test.js`, `.gitignore`, comando `backup:daily`, negativos `P1`, validação final e handoff coerente para `BK-MF8-05`.
- `2026-06-30`: guia revisto para a estrutura tutorial MF8, com caminhos públicos `apps/...`, contrato de evidence, negativos mínimos e handoff explícito.
