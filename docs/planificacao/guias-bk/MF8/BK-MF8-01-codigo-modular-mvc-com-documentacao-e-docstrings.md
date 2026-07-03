# BK-MF8-01 - Código modular (MVC) com documentação e _docstrings_

## Header
- `doc_id`: `GUIA-BK-MF8-01`
- `bk_id`: `BK-MF8-01`
- `macro`: `MF8`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF19`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-02`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-01-codigo-modular-mvc-com-documentacao-e-docstrings.md`
- `last_updated`: `2026-07-01`

#### Objetivo

Neste BK vais consolidar a organização MVC da API e garantir que os módulos principais têm documentação técnica suficiente para manutenção, revisão e defesa.

#### Importância

A Orélle já tem muitos fluxos sensíveis, como sessão, fotografias faciais, recomendações, carrinho, pagamentos e exportações. Sem fronteiras claras entre model, validator, service, controller e route, qualquer correção final fica arriscada e difícil de explicar.

#### Scope-in

- Inventariar os módulos existentes em `apps/api/src`.
- Confirmar responsabilidades MVC nos fluxos principais.
- Adicionar ou completar JSDoc em unidades públicas relevantes.
- Registar evidence de modularidade e documentação.

#### Scope-out

- Não reescrever funcionalidades já estáveis.
- Não alterar endpoints públicos sem finding técnico confirmado.
- Não criar nova framework ou nova arquitetura paralela.

#### Estado antes e depois

- Antes: a app tem módulos funcionais, mas a defesa precisa de uma verificação final de fronteiras, nomes e documentação.
- Depois: a equipa consegue apontar ficheiros por responsabilidade, explicar a cadeia `route -> controller -> service -> model` e provar que os módulos críticos estão documentados.

#### Pre-requisitos

- MF0 a MF7 executadas ou revistas.
- `apps/api/src/app.js` como entrada das rotas.
- `apps/api/src/services` e `apps/api/src/controllers` como fronteiras principais.

#### Glossário

- MVC: separação entre dados, regras de negócio e entrada HTTP.
- JSDoc: comentário estruturado que explica responsabilidade, parâmetros, retorno e riscos.
- Boundary: limite técnico que impede que uma camada assuma trabalho da outra.

#### Conceitos teóricos essenciais

- Um controller traduz HTTP para chamada de service. Não deve decidir regras profundas de negócio.
- Um service concentra validações de domínio, ownership, consentimento e efeitos persistentes.
- A documentação técnica ajuda a defender escolhas sem transformar o código numa explicação solta.
- Conceito de validação: cada BK precisa de smoke, negativos e evidence por camada para evitar progresso apenas documental.
- Conceito de segurança: ownership, consentimento, roles, privacidade e minimização pertencem ao backend sempre que dados pessoais, biométricos, IA ou comércio estiverem envolvidos.

#### Arquitetura do BK

- `bk_id`: `BK-MF8-01`
- `flow_id`: `FLOW-MF8-MODULARIDADE`
- `requisitos`: `RNF19`
- `dependências`: `-`
- `tema técnico`: `manutenção modular`
- `destino dos alunos`: `apps/api` e `apps/web`
- `decisão CANONICO`: o requisito e a prioridade vêm da matriz/backlog.
- `decisão DERIVADO`: nomes de testes/evidence usam prefixo `mf8` para fechar a macrofase sem criar nova stack.

#### Ficheiros a criar/editar/rever

- REVER: `apps/api/src/app.js`
- CRIAR: `apps/api/src/constants/domain.constants.js`
- CRIAR: `apps/api/src/utils/encryption.util.js`
- EDITAR: `apps/api/src/services/encryption.service.js`
- EDITAR: `apps/api/src/models/face-report.model.js`
- EDITAR: `apps/api/src/models/product.model.js`
- EDITAR: `apps/api/src/models/profile.model.js`
- EDITAR: `apps/api/src/models/order.model.js`
- EDITAR: `apps/api/src/models/notification.model.js`
- EDITAR: `apps/api/src/models/biometric-data-request.model.js`
- EDITAR: `apps/api/src/services/order.service.js`
- EDITAR: `apps/api/src/services/admin-dashboard.service.js`
- EDITAR: `apps/api/src/services/stock.service.js`
- EDITAR: `apps/api/src/services/notification.service.js`
- EDITAR: `apps/api/src/services/routine-alert.service.js`
- EDITAR: `apps/api/src/services/biometric-data-request.service.js`
- EDITAR: `apps/api/src/providers/payment.provider.js`
- REVER: `apps/api/src/routes/*.js`
- REVER: `apps/api/src/controllers/*.js`
- REVER: `apps/api/src/services/*.js`
- REVER: `apps/api/src/models/*.js`
- REVER: `apps/api/src/validators/*.js`
- REVER: `apps/api/src/middlewares/*.js`
- REVER: `apps/api/src/providers/*.js`
- CRIAR: `apps/api/tests/mf8.modularidade.contract.test.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato e fronteiras

1. Objetivo funcional do passo no contexto da app.

Confirmar que o BK-MF8-01 implementa apenas RNF19 e encaixa na sequência da MF8.

2. Ficheiros envolvidos:
    - REVER: `docs/RF.md`
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: linhas do requisito e linha canónica do BK.

3. Instruções do que fazer.

Lê os requisitos associados, confirma dependências (-) e escreve no teu apontamento de trabalho o que é CANONICO e o que é DERIVADO.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. Esta decisão evita começar a programar com requisitos inventados ou com caminhos privados que não pertencem aos alunos.

6. Validação do passo.

Executa `rg -n "RNF19|BK-MF8-01" docs/RF.md docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`.

7. Cenário negativo/erro esperado.

Se o requisito não aparecer nos documentos canónicos, o BK fica bloqueado até a matriz ser corrigida.

### Passo 2 - Mapear ficheiros e contratos existentes

1. Objetivo funcional do passo no contexto da app.

Perceber que módulos já existem e que nomes devem ser reutilizados sem duplicar conceitos.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src`
    - REVER: `apps/web/src`
    - REVER: `apps/api/src/app.js`
    - REVER: `apps/api/src/controllers/*.js`
    - REVER: `apps/api/src/services/*.js`
    - LOCALIZAÇÃO: ficheiros completos ou funções/componentes indicados na lista de ficheiros do BK.

3. Instruções do que fazer.

Percorre os ficheiros alvo e confirma imports, exports, endpoints, DTOs, models, services, componentes e regras de sessão/role/ownership que o BK consome.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. O mapa impede criar uma segunda versão do mesmo endpoint, schema ou componente.

6. Validação do passo.

A lista de ficheiros deve indicar claramente o que é CRIAR, EDITAR e REVER.

7. Cenário negativo/erro esperado.

controller com regra de negócio profunda é recusado na revisão

### Passo 3 - Criar o contrato automatizado de modularidade

1. Objetivo funcional do passo no contexto da app.

Criar um teste Vitest que confirma a existência das camadas MVC, protege fronteiras entre módulos e exige documentação técnica nas unidades públicas críticas.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/app.js`
    - REVER: `apps/api/src/routes/*.js`
    - REVER: `apps/api/src/controllers/*.js`
    - REVER: `apps/api/src/services/*.js`
    - REVER: `apps/api/src/models/*.js`
    - REVER: `apps/api/src/validators/*.js`
    - REVER: `apps/api/src/middlewares/*.js`
    - REVER: `apps/api/src/providers/*.js`
    - CRIAR: `apps/api/tests/mf8.modularidade.contract.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo sem mudar nomes de camadas. Depois executa o teste. Se ele falhar por falta de documentação ou por imports que atravessam camadas indevidas, corrige o ficheiro real indicado pelo erro antes de avançar para o handoff.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.modularidade.contract.test.js
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC_ROOT = path.resolve(process.cwd(), "src");

const REQUIRED_DIRECTORIES = [
    "controllers",
    "services",
    "models",
    "routes",
    "validators",
    "middlewares"
];

const LAYER_RULES = [
    {
        layer: "controllers",
        forbiddenImports: ["../models/", "../routes/"],
        reason: "controllers devem orquestrar request/response e delegar regras em services"
    },
    {
        layer: "routes",
        forbiddenImports: ["../models/", "../services/"],
        reason: "routes devem ligar middleware e controller sem conter regras de domínio"
    },
    {
        layer: "models",
        forbiddenImports: ["../controllers/", "../services/", "../routes/"],
        reason: "models representam persistência e não devem depender das camadas HTTP"
    },
    {
        layer: "validators",
        forbiddenImports: ["../controllers/", "../services/", "../models/"],
        reason: "validators validam input sem executar regras de negócio ou persistência"
    }
];

const DOMAIN_CONSTANT_NAMES = new Set([
    "SKIN_TYPES",
    "GENDERS",
    "BIOMETRIC_REQUEST_ACTIONS",
    "BIOMETRIC_REQUEST_RESOURCES",
    "BIOMETRIC_REQUEST_STATUSES",
    "ORDER_STATUS",
    "PAYMENT_GATEWAYS",
    "PAYMENT_STATUS",
    "NOTIFICATION_TYPES",
    "NOTIFICATION_TYPE_VALUES"
]);

const FUNCTION_OR_CLASS_PATTERNS = [
    /export\s+async\s+function\s+([A-Za-z0-9_]+)/g,
    /export\s+function\s+([A-Za-z0-9_]+)/g,
    /export\s+class\s+([A-Za-z0-9_]+)/g
];

const ROUTER_OR_MODEL_PATTERNS = [
    /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*Router\s*\(/g,
    /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*model\s*\(/g
];

/**
 * Lista todos os ficheiros JavaScript dentro de uma camada da API.
 *
 * @param {string} relativeDirectory - Diretoria relativa a `src`.
 * @returns {string[]} Caminhos relativos dos ficheiros `.js` encontrados.
 */
function listJavaScriptFiles(relativeDirectory) {
    const absoluteDirectory = path.join(SRC_ROOT, relativeDirectory);

    if (!existsSync(absoluteDirectory)) {
        return [];
    }

    return readdirSync(absoluteDirectory)
        .flatMap((entry) => {
            const absoluteEntry = path.join(absoluteDirectory, entry);
            const relativeEntry = path.join(relativeDirectory, entry);

            if (statSync(absoluteEntry).isDirectory()) {
                return listJavaScriptFiles(relativeEntry);
            }

            return entry.endsWith(".js") ? [relativeEntry] : [];
        })
        .sort();
}

/**
 * Lê um ficheiro de `src` como texto UTF-8.
 *
 * @param {string} relativeFile - Caminho relativo a `src`.
 * @returns {string} Conteúdo do ficheiro.
 */
function readSourceFile(relativeFile) {
    return readFileSync(path.join(SRC_ROOT, relativeFile), "utf8");
}

/**
 * Confirma que existe um bloco JSDoc junto de um export público.
 *
 * @param {string} source - Código fonte completo.
 * @param {number} exportIndex - Índice onde começa o `export`.
 * @returns {boolean} `true` quando o export está documentado.
 */
function hasJsDocBeforeExport(source, exportIndex) {
    const nearbySource = source.slice(Math.max(0, exportIndex - 700), exportIndex);

    return /\/\*\*[\s\S]*?\*\/\s*$/.test(nearbySource);
}

/**
 * Confirma se o ficheiro tem JSDoc de módulo no topo.
 *
 * @param {string} source - Código fonte completo.
 * @returns {boolean} `true` quando o ficheiro começa com documentação técnica.
 */
function hasFileLevelJsDoc(source) {
    return /^\s*\/\*\*[\s\S]*?\*\//.test(source);
}

/**
 * Deteta constantes de domínio que ainda estão publicadas a partir de models.
 *
 * @returns {{ file: string, constantName: string, reason: string }[]} Violações encontradas.
 */
function collectModelConstantExports() {
    return listJavaScriptFiles("models").flatMap((relativeFile) => {
        const source = readSourceFile(relativeFile);

        return [...DOMAIN_CONSTANT_NAMES]
            .filter((constantName) => {
                const exportPattern = new RegExp(`export\\s+const\\s+${constantName}\\b`);
                return exportPattern.test(source);
            })
            .map((constantName) => ({
                file: relativeFile,
                constantName,
                reason: "constantes de domínio partilhadas pertencem a constants/domain.constants.js"
            }));
    });
}

/**
 * Deteta imports de constantes de domínio a partir de models.
 *
 * @returns {{ file: string, constantName: string, from: string, reason: string }[]} Violações encontradas.
 */
function collectModelConstantImports() {
    const filesToInspect = [
        ...listJavaScriptFiles("models"),
        ...listJavaScriptFiles("validators"),
        ...listJavaScriptFiles("services"),
        ...listJavaScriptFiles("providers")
    ];

    return filesToInspect.flatMap((relativeFile) => {
        const source = readSourceFile(relativeFile);
        const violations = [];
        const importPathPattern = String.raw`([^"']*model\.js)`;
        const importPattern = new RegExp(
            String.raw`import\s*\{([^}]+)\}\s*from\s*["']` +
                importPathPattern +
                String.raw`["'];?`,
            "g"
        );

        for (const match of source.matchAll(importPattern)) {
            const importedNames = match[1]
                .split(",")
                .map((name) => name.trim().split(/\s+as\s+/)[0])
                .filter(Boolean);

            for (const constantName of importedNames) {
                if (DOMAIN_CONSTANT_NAMES.has(constantName)) {
                    violations.push({
                        file: relativeFile,
                        constantName,
                        from: match[2],
                        reason: "constantes de domínio devem vir de constants/domain.constants.js"
                    });
                }
            }
        }

        return violations;
    });
}

/**
 * Recolhe funções, classes, routers e models públicos que precisam de documentação.
 *
 * @param {string} relativeFile - Caminho relativo a `src`.
 * @returns {{ file: string, name: string, documented: boolean }[]} Unidades públicas encontradas.
 */
function collectPublicUnits(relativeFile) {
    const source = readSourceFile(relativeFile);
    const units = [];

    for (const pattern of FUNCTION_OR_CLASS_PATTERNS) {
        pattern.lastIndex = 0;

        for (const match of source.matchAll(pattern)) {
            units.push({
                file: relativeFile,
                name: match[1],
                documented: hasJsDocBeforeExport(source, match.index)
            });
        }
    }

    for (const pattern of ROUTER_OR_MODEL_PATTERNS) {
        pattern.lastIndex = 0;

        for (const match of source.matchAll(pattern)) {
            units.push({
                file: relativeFile,
                name: match[1],
                documented:
                    hasJsDocBeforeExport(source, match.index) || hasFileLevelJsDoc(source)
            });
        }
    }

    return units;
}

describe("BK-MF8-01 modularidade MVC e JSDoc", () => {
    it("mantém as diretorias técnicas esperadas para RNF19", () => {
        const missingDirectories = REQUIRED_DIRECTORIES.filter((directory) => {
            return !existsSync(path.join(SRC_ROOT, directory));
        });

        expect(missingDirectories).toEqual([]);
    });

    it("mantém app.js como ponto de composição da API", () => {
        const appSource = readSourceFile("app.js");

        // O teste procura sinais de composição HTTP e não aceita lógica de domínio escondida no bootstrap.
        expect(appSource).toContain("createApp");
        expect(appSource).toContain("app.use");
        expect(appSource).toMatch(/routes?/i);
        expect(appSource).toContain("errorMiddleware");
    });

    it("mantém fronteiras entre routes, controllers, services, validators e models", () => {
        const violations = LAYER_RULES.flatMap(({ layer, forbiddenImports, reason }) => {
            return listJavaScriptFiles(layer).flatMap((relativeFile) => {
                const source = readSourceFile(relativeFile);

                // Cada regra impede saltos diretos de camada que tornam a manutenção insegura.
                return forbiddenImports
                    .filter((forbiddenImport) => source.includes(forbiddenImport))
                    .map((forbiddenImport) => ({
                        file: relativeFile,
                        forbiddenImport,
                        reason
                    }));
            });
        });

        expect(violations).toEqual([]);
    });

    it("mantém constantes de domínio fora dos models", () => {
        expect([
            ...collectModelConstantExports(),
            ...collectModelConstantImports()
        ]).toEqual([]);
    });

    it("documenta unidades públicas críticas com JSDoc ou documentação de módulo", () => {
        const filesToInspect = [
            ...listJavaScriptFiles("controllers"),
            ...listJavaScriptFiles("services"),
            ...listJavaScriptFiles("models"),
            ...listJavaScriptFiles("routes"),
            ...listJavaScriptFiles("validators"),
            ...listJavaScriptFiles("middlewares")
        ];

        const undocumentedUnits = filesToInspect
            .flatMap((relativeFile) => collectPublicUnits(relativeFile))
            .filter((unit) => !unit.documented);

        expect(undocumentedUnits).toEqual([]);
    });
});
```

5. Explicação do código.

O teste começa por confirmar que a API mantém as camadas esperadas para RNF19. Depois verifica se `app.js` continua a ser o ponto de composição da aplicação, ou seja, o local onde se ligam middlewares e routes sem concentrar regras profundas.

A lista `LAYER_RULES` impede saltos perigosos entre camadas. Por exemplo, uma route não deve importar models ou services diretamente, porque isso mistura transporte HTTP com regras de domínio. Um controller também não deve depender de models, porque a persistência deve passar por services.

A regra das constantes de domínio impede que enums partilhados continuem a ser exportados por models ou importados a partir de models. Assim, `Profile`, `Order`, `Notification` e `BiometricDataRequest` ficam responsáveis por persistência, enquanto `domain.constants.js` fica responsável por contratos reutilizados por models, validators, services e providers.

A função `collectPublicUnits` procura exports públicos relevantes e valida se existe um bloco JSDoc imediatamente antes deles. Assim, o teste não obriga a documentar cada constante interna, mas exige documentação nas funções, classes, routers e models que outros módulos consomem.

6. Validação do passo.

Executa `npm --prefix apps/api test -- tests/mf8.modularidade.contract.test.js`. Se o projeto preferir correr a suíte completa, executa `npm --prefix apps/api test`.

7. Cenário negativo/erro esperado.

Uma route que importa diretamente um model deve falhar com indicação do ficheiro e do import proibido.

### Passo 4 - Corrigir fronteiras e JSDoc apontados pelo teste

1. Objetivo funcional do passo no contexto da app.

Atualizar os pontos reais que o contrato de modularidade acusa: constantes de domínio partilhadas, encriptação usada por schemas e JSDoc nas funções exportadas.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/constants/domain.constants.js`
    - CRIAR: `apps/api/src/utils/encryption.util.js`
    - EDITAR: `apps/api/src/services/encryption.service.js`
    - EDITAR: `apps/api/src/models/face-report.model.js`
    - EDITAR: `apps/api/src/models/product.model.js`
    - EDITAR: `apps/api/src/models/profile.model.js`
    - EDITAR: `apps/api/src/models/order.model.js`
    - EDITAR: `apps/api/src/models/notification.model.js`
    - EDITAR: `apps/api/src/models/biometric-data-request.model.js`
    - EDITAR: `apps/api/src/validators/*.js`
    - EDITAR: `apps/api/src/services/order.service.js`
    - EDITAR: `apps/api/src/services/admin-dashboard.service.js`
    - EDITAR: `apps/api/src/services/stock.service.js`
    - EDITAR: `apps/api/src/services/notification.service.js`
    - EDITAR: `apps/api/src/services/routine-alert.service.js`
    - EDITAR: `apps/api/src/services/biometric-data-request.service.js`
    - EDITAR: `apps/api/src/providers/payment.provider.js`
    - EDITAR: `apps/api/src/controllers/notification.controller.js`
    - EDITAR: `apps/api/src/controllers/routine-alert.controller.js`
    - LOCALIZAÇÃO: ficheiros completos novos, cabeçalhos de imports, remoção dos exports de constantes nos models e JSDoc nos controllers indicados.

3. Instruções do que fazer.

Primeiro cria contratos neutros que podem ser importados por models, validators, services e providers sem atravessar a fronteira de persistência. Usa uma estratégia única: `apps/api/src/constants/domain.constants.js` passa a ser a fonte dos enums partilhados e os models deixam de exportar esses enums. Depois move a encriptação usada por schemas para `utils`, mantendo `services/encryption.service.js` como fachada compatível. Por fim adiciona JSDoc diretamente antes das funções exportadas que o teste acusou.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/constants/domain.constants.js

/**
 * Contratos de domínio reutilizados por models, validators e services.
 * Este ficheiro evita que validators importem models apenas para ler enums.
 */
export const SKIN_TYPES = ["oleosa", "seca", "mista", "normal", "sensivel"];

export const GENDERS = [
    "feminino",
    "masculino",
    "nao_binario",
    "prefiro_nao_dizer"
];

export const BIOMETRIC_REQUEST_ACTIONS = Object.freeze({
    DELETE: "delete",
    ANONYMIZE: "anonymize"
});

export const BIOMETRIC_REQUEST_RESOURCES = Object.freeze({
    PHOTOS: "photos",
    REPORTS: "reports"
});

export const BIOMETRIC_REQUEST_STATUSES = Object.freeze({
    PENDING: "pending",
    PROCESSING: "processing",
    FAILED: "failed",
    REJECTED: "rejected",
    COMPLETED: "completed"
});

// Pagamentos continuam separados de encomendas para preservar o contrato da MF3.
export const ORDER_STATUS = Object.freeze({
    PENDENTE: "pendente",
    ENVIADO: "enviado",
    ENTREGUE: "entregue"
});

export const PAYMENT_GATEWAYS = Object.freeze({
    STRIPE: "stripe",
    PAYPAL: "paypal",
    MBWAY: "mbway"
});

export const PAYMENT_STATUS = Object.freeze({
    REQUIRES_PAYMENT: "requires_payment",
    PENDING_MANUAL_CONFIRMATION: "pending_manual_confirmation",
    PAID: "paid",
    FAILED: "failed"
});

export const NOTIFICATION_TYPES = Object.freeze({
    PROMOTION: "promotion",
    NEW_PRODUCT: "new_product",
    ORDER_STATUS: "order_status",
    ROUTINE_ALERT: "routine_alert"
});

// A lista derivada evita repetir Object.values(...) em validators e schemas.
export const NOTIFICATION_TYPE_VALUES = Object.freeze(
    Object.values(NOTIFICATION_TYPES)
);
```

```js
// apps/api/src/utils/encryption.util.js
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";

export const DATA_ENCRYPTION_ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;

/**
 * Confirma se um valor já tem o formato cifrado interno.
 *
 * @param {unknown} value - Valor candidato.
 * @returns {boolean} Verdadeiro quando parece payload cifrado da Orélle.
 */
export function isEncryptedPayload(value) {
    return (
        Boolean(value) &&
        typeof value === "object" &&
        value.encrypted === true &&
        value.algorithm === DATA_ENCRYPTION_ALGORITHM &&
        typeof value.iv === "string" &&
        typeof value.authTag === "string" &&
        typeof value.ciphertext === "string"
    );
}

/**
 * Converte uma chave textual numa chave AES-256.
 *
 * @param {string|undefined} rawKey - Chave em base64, hex ou texto forte.
 * @returns {Buffer} Chave com 32 bytes.
 * @throws {AppError} Quando a chave está ausente ou é fraca.
 */
export function parseDataEncryptionKey(rawKey) {
    const value = String(rawKey ?? "").trim();

    if (!value) {
        throw new AppError(500, "Chave de encriptação inválida.");
    }

    const base64Candidate = Buffer.from(value, "base64");
    if (base64Candidate.length === KEY_BYTES) return base64Candidate;

    const hexCandidate = /^[a-f0-9]+$/i.test(value)
        ? Buffer.from(value, "hex")
        : Buffer.alloc(0);
    if (hexCandidate.length === KEY_BYTES) return hexCandidate;

    if (Buffer.byteLength(value, "utf8") >= KEY_BYTES) {
        return createHash("sha256").update(value).digest();
    }

    throw new AppError(500, "Chave de encriptação inválida.");
}

/**
 * Resolve a chave ativa, exigindo segredo dedicado em produção.
 *
 * @returns {Buffer} Chave AES-256 para cifra/decifra.
 * @throws {AppError} Quando a configuração de produção não tem chave.
 */
function getActiveDataEncryptionKey() {
    if (env.dataEncryptionKey) {
        return parseDataEncryptionKey(env.dataEncryptionKey);
    }

    if (env.nodeEnv === "production") {
        throw new AppError(500, "DATA_ENCRYPTION_KEY obrigatória em produção.");
    }

    // A chave de desenvolvimento vem de outro segredo local e nunca deve ser usada para produção.
    return createHash("sha256")
        .update(`orelle-dev-data-key:${env.sessionSecret}`)
        .digest();
}

/**
 * Encripta bytes sensíveis com AES-256-GCM.
 *
 * @param {Buffer} plainBuffer - Conteúdo a cifrar.
 * @returns {{encrypted: true, algorithm: string, iv: string, authTag: string, ciphertext: string}} Payload cifrado.
 */
export function encryptBuffer(plainBuffer) {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(
        DATA_ENCRYPTION_ALGORITHM,
        getActiveDataEncryptionKey(),
        iv
    );
    const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);

    return {
        encrypted: true,
        algorithm: DATA_ENCRYPTION_ALGORITHM,
        iv: iv.toString("base64"),
        authTag: cipher.getAuthTag().toString("base64"),
        ciphertext: ciphertext.toString("base64")
    };
}

/**
 * Decifra bytes previamente cifrados pela Orélle.
 *
 * @param {object} payload - Payload AES-256-GCM.
 * @returns {Buffer} Conteúdo original.
 * @throws {AppError} Quando o payload é inválido ou foi adulterado.
 */
export function decryptBuffer(payload) {
    if (!isEncryptedPayload(payload)) {
        throw new AppError(500, "Payload de encriptação inválido.");
    }

    try {
        const decipher = createDecipheriv(
            DATA_ENCRYPTION_ALGORITHM,
            getActiveDataEncryptionKey(),
            Buffer.from(payload.iv, "base64")
        );
        decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

        return Buffer.concat([
            decipher.update(Buffer.from(payload.ciphertext, "base64")),
            decipher.final()
        ]);
    } catch {
        throw new AppError(500, "Conteúdo encriptado inválido.");
    }
}

/**
 * Encripta um valor JSON mantendo tipo lógico na decifra.
 *
 * @param {unknown} value - Valor serializável a proteger.
 * @returns {object} Payload cifrado.
 */
export function encryptJson(value) {
    if (isEncryptedPayload(value)) return value;

    // Os schemas usam este setter para proteger relatórios sem chamar services.
    return encryptBuffer(Buffer.from(JSON.stringify(value), "utf8"));
}

/**
 * Decifra um valor JSON, aceitando dados antigos ainda em claro.
 *
 * @param {unknown} value - Valor cifrado ou legado em claro.
 * @returns {unknown} Valor lógico para services e DTOs.
 */
export function decryptJson(value) {
    if (!isEncryptedPayload(value)) return value;

    return JSON.parse(decryptBuffer(value).toString("utf8"));
}
```

```js
// apps/api/src/services/encryption.service.js
export {
    DATA_ENCRYPTION_ALGORITHM,
    decryptBuffer,
    decryptJson,
    encryptBuffer,
    encryptJson,
    isEncryptedPayload,
    parseDataEncryptionKey
} from "../utils/encryption.util.js";
```

Substitui os imports nos models para usarem os contratos neutros. Remove dos models os blocos `export const SKIN_TYPES`, `export const GENDERS`, `export const ORDER_STATUS`, `export const PAYMENT_GATEWAYS`, `export const PAYMENT_STATUS`, `export const NOTIFICATION_TYPES`, `export const NOTIFICATION_TYPE_VALUES`, `export const BIOMETRIC_REQUEST_ACTIONS`, `export const BIOMETRIC_REQUEST_RESOURCES` e `export const BIOMETRIC_REQUEST_STATUSES`.

```js
// apps/api/src/models/face-report.model.js
import { decryptJson, encryptJson } from "../utils/encryption.util.js";

// apps/api/src/models/product.model.js
import { SKIN_TYPES } from "../constants/domain.constants.js";

// apps/api/src/models/profile.model.js
import { GENDERS, SKIN_TYPES } from "../constants/domain.constants.js";

// apps/api/src/models/order.model.js
import {
    ORDER_STATUS,
    PAYMENT_GATEWAYS,
    PAYMENT_STATUS
} from "../constants/domain.constants.js";

// apps/api/src/models/notification.model.js
import {
    NOTIFICATION_TYPES,
    NOTIFICATION_TYPE_VALUES
} from "../constants/domain.constants.js";

// apps/api/src/models/biometric-data-request.model.js
import {
    BIOMETRIC_REQUEST_ACTIONS,
    BIOMETRIC_REQUEST_RESOURCES,
    BIOMETRIC_REQUEST_STATUSES
} from "../constants/domain.constants.js";
```

Depois substitui os imports nos validators, services e provider que só precisavam dos enums dos models. Quando o ficheiro também precisar do model Mongoose, mantém esse model num import separado e importa as constantes de `domain.constants.js`.

```js
// apps/api/src/validators/profile.validator.js
import { GENDERS, SKIN_TYPES } from "../constants/domain.constants.js";

// apps/api/src/validators/product.validator.js
import { SKIN_TYPES } from "../constants/domain.constants.js";

// apps/api/src/validators/catalog-query.validator.js
import { SKIN_TYPES } from "../constants/domain.constants.js";

// apps/api/src/validators/checkout.validator.js
import { PAYMENT_GATEWAYS } from "../constants/domain.constants.js";

// apps/api/src/validators/notification.validator.js
import {
    NOTIFICATION_TYPES,
    NOTIFICATION_TYPE_VALUES
} from "../constants/domain.constants.js";

// apps/api/src/validators/biometric-data-request.validator.js
import {
    BIOMETRIC_REQUEST_ACTIONS,
    BIOMETRIC_REQUEST_RESOURCES
} from "../constants/domain.constants.js";

// apps/api/src/services/order.service.js
import { ORDER_STATUS } from "../constants/domain.constants.js";
import { Order } from "../models/order.model.js";

// apps/api/src/services/admin-dashboard.service.js
import { PAYMENT_STATUS } from "../constants/domain.constants.js";
import { Order } from "../models/order.model.js";

// apps/api/src/services/stock.service.js
import { PAYMENT_STATUS } from "../constants/domain.constants.js";
import { Order } from "../models/order.model.js";

// apps/api/src/services/notification.service.js
import { NOTIFICATION_TYPES } from "../constants/domain.constants.js";
import { Notification } from "../models/notification.model.js";
import { Order } from "../models/order.model.js";

// apps/api/src/services/routine-alert.service.js
import { NOTIFICATION_TYPES } from "../constants/domain.constants.js";
import { Notification } from "../models/notification.model.js";

// apps/api/src/services/biometric-data-request.service.js
import {
    BIOMETRIC_REQUEST_ACTIONS,
    BIOMETRIC_REQUEST_RESOURCES,
    BIOMETRIC_REQUEST_STATUSES
} from "../constants/domain.constants.js";
import { BiometricDataRequest } from "../models/biometric-data-request.model.js";

// apps/api/src/providers/payment.provider.js
import {
    PAYMENT_GATEWAYS,
    PAYMENT_STATUS
} from "../constants/domain.constants.js";
```

Adiciona JSDoc direto aos controllers acusados pelo teste:

```js
// apps/api/src/controllers/notification.controller.js
import {
    createCampaignNotification,
    listMyNotifications,
    markMyNotificationAsRead,
    updateOrderStatusAndNotify
} from "../services/notification.service.js";
import {
    validateCampaignNotificationInput,
    validateNotificationIdParam,
    validateOrderStatusNotificationInput
} from "../validators/notification.validator.js";

/**
 * Lista as notificações do utilizador autenticado.
 *
 * @param {import("express").Request} req - Pedido com `req.user.id` definido pelo middleware de sessão.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros para o middleware global.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com notificações próprias.
 */
export async function listMyNotificationsController(req, res, next) {
    try {
        // O userId vem da sessão para impedir leitura de notificações de outro cliente.
        const notifications = await listMyNotifications(req.user.id);
        return res.status(200).json({ notifications });
    } catch (err) {
        return next(err);
    }
}

/**
 * Marca uma notificação própria como lida.
 *
 * @param {import("express").Request} req - Pedido com params e sessão autenticada.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros controlados.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com a notificação atualizada.
 */
export async function markMyNotificationAsReadController(req, res, next) {
    try {
        const { notificationId } = validateNotificationIdParam(req.params);
        const notification = await markMyNotificationAsRead(req.user.id, notificationId);
        return res.status(200).json({ notification });
    } catch (err) {
        return next(err);
    }
}

/**
 * Cria uma campanha de notificação interna para uma role alvo.
 *
 * @param {import("express").Request} req - Pedido admin com body validado.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros para o middleware global.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com resumo da campanha.
 */
export async function createCampaignNotificationController(req, res, next) {
    try {
        // A validação fica no backend para impedir campanhas com tipo ou role fora do contrato.
        const input = validateCampaignNotificationInput(req.body);
        const result = await createCampaignNotification(input);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza o estado de uma encomenda e notifica o cliente.
 *
 * @param {import("express").Request} req - Pedido admin com `orderId` e novo estado.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros controlados.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com resultado da atualização.
 */
export async function updateOrderStatusAndNotifyController(req, res, next) {
    try {
        const { status } = validateOrderStatusNotificationInput(req.body);
        const result = await updateOrderStatusAndNotify(req.params.orderId, status);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
```

```js
// apps/api/src/controllers/routine-alert.controller.js
import {
    createDueRoutineAlerts,
    getMyRoutineAlertPreference,
    updateMyRoutineAlertPreference
} from "../services/routine-alert.service.js";
import {
    validateRoutineAlertPreferenceInput,
    validateRoutineAlertRunInput
} from "../validators/routine-alert.validator.js";

/**
 * Devolve a preferência de alerta de rotina do utilizador autenticado.
 *
 * @param {import("express").Request} req - Pedido com sessão autenticada.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros para o middleware global.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com a preferência própria.
 */
export async function getMyRoutineAlertPreferenceController(req, res, next) {
    try {
        // O service recebe apenas o userId da sessão, preservando ownership no backend.
        const preference = await getMyRoutineAlertPreference(req.user.id);
        return res.status(200).json({ preference });
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza a preferência de alerta de rotina do utilizador autenticado.
 *
 * @param {import("express").Request} req - Pedido com body de preferência.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros controlados.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com a preferência atualizada.
 */
export async function updateMyRoutineAlertPreferenceController(req, res, next) {
    try {
        const input = validateRoutineAlertPreferenceInput(req.body);
        const preference = await updateMyRoutineAlertPreference(req.user.id, input);
        return res.status(200).json({ preference });
    } catch (err) {
        return next(err);
    }
}

/**
 * Executa a criação administrativa de alertas de rotina devidos.
 *
 * @param {import("express").Request} req - Pedido admin com data opcional.
 * @param {import("express").Response} res - Resposta HTTP.
 * @param {import("express").NextFunction} next - Encaminha erros controlados.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com contagem de alertas criados.
 */
export async function runRoutineAlertsController(req, res, next) {
    try {
        // O `now` validado permite testar a rotina sem depender do relógio real.
        const input = validateRoutineAlertRunInput(req.body);
        const result = await createDueRoutineAlerts(input.now);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código.

`domain.constants.js` retira enums partilhados de dentro dos models. Assim, models, validators, services e providers usam o mesmo contrato sem depender da camada de persistência para ler constantes. Isto evita duplicação, impede imports partidos e mantém alinhados schemas, DTOs, services e provider de pagamento.

`encryption.util.js` fica fora de `services` porque os schemas usam `encryptJson` e `decryptJson` em getters/setters. O model pode depender de um utilitário técnico neutro, mas não deve depender de um service de regra de negócio. A fachada `services/encryption.service.js` preserva imports antigos de services sem obrigar uma migração ampla no mesmo BK.

Os controllers de notificações e alertas passam a ter JSDoc junto de cada função exportada. A explicação deixa claro que o userId vem da sessão, que a validação é feita no backend e que os erros seguem para o middleware global.

6. Validação do passo.

Repete `npm --prefix apps/api test -- tests/mf8.modularidade.contract.test.js` até a lista de violações de camada, a lista de constantes vindas de models e a lista de unidades públicas sem documentação ficarem vazias.

7. Cenário negativo/erro esperado.

Se um validator, service ou provider voltar a importar `PAYMENT_STATUS`, `SKIN_TYPES`, `NOTIFICATION_TYPES` ou outra constante de um model, o teste deve falhar e indicar o ficheiro exato.

### Passo 5 - Validar e preparar handoff

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com comandos reais, evidence e passagem explícita para o próximo BK.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - CRIAR/ATUALIZAR: evidence técnica do BK
    - LOCALIZAÇÃO: secção de evidence do PR/defesa e ficheiro de relatório da equipa.

3. Instruções do que fazer.

Executa os comandos relevantes existentes em `apps/api` e `apps/web`, regista outputs, negativos e riscos. Depois confirma o handoff para BK-MF8-02.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo. A validação final transforma implementação em prova defensável, separando sucesso, falha real e bloqueio de ambiente.

6. Validação do passo.

A evidence deve conter comando, diretoria, resultado observado e impacto.

7. Cenário negativo/erro esperado.

Se um comando não existir ou falhar por ambiente, regista o motivo em vez de marcar sucesso.

#### Expected results

- O fluxo principal de `manutenção modular` fica verificável contra `RNF19`.
- O teste `mf8.modularidade.contract.test.js` termina sem violações de fronteira entre models, validators, services, controllers e routes.
- As constantes de domínio partilhadas ficam fora dos models, em `apps/api/src/constants/domain.constants.js`.
- Models, validators, services e providers importam enums partilhados de `domain.constants.js`, sem exports de constantes a partir dos models.
- As respostas públicas não expõem passwords, tokens, cookies, storage interno, fotografias, relatórios sensíveis ou detalhes internos de servidor.
- Executar cenários negativos obrigatórios (mínimo 3) com resultado controlado.
- O próximo BK consegue consumir o handoff sem criar contrato paralelo.

#### Critérios de aceite

- Entrega funcional específica de `Código modular (MVC) com documentação e _docstrings_` validada contra `RNF19`.
- Imports de validators, models, services, controllers e routes sem saltos de camada proibidos pelo teste.
- Constantes de domínio partilhadas centralizadas em `apps/api/src/constants/domain.constants.js`, sem consumidores a importarem esses enums a partir de models.
- Exports públicos críticos documentados com JSDoc direto ou documentação de módulo aceite pelo contrato.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).

### Matriz minima de testes por prioridade

- Testes por prioridade respeitados: `P0` exige unit + integration + e2e + 3 negativos; `P1` exige unit/integration + 2 negativos; `P2` exige teste focal + 1 negativo.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisão técnica e defesa PAP.

#### Validação final

- [ ] Smoke: fluxo principal executa sem erro bloqueante.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Técnico: imports, endpoints, DTOs, schemas, services e componentes sem duplicação ou nomes contraditórios.
- [ ] Modularidade: `npm --prefix apps/api test -- tests/mf8.modularidade.contract.test.js` sem violações de fronteira, constantes vindas de models nem documentação em falta.
- [ ] Segurança/privacidade: regras de sessão, role, ownership, consentimento e minimização validadas nos fluxos alterados.
- [ ] Handoff: próximo BK documentado e risco restante registado.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite`, `## Evidence para PR/defesa`.

#### Evidence para PR/defesa

- `pr`: referência de commit/PR e resumo técnico da alteração.
- `proof_tecnico`: comandos, outputs, screenshots ou requests/responses que provem o caminho principal, o teste `mf8.modularidade.contract.test.js` e a separação `constants/utils/models/validators/services/providers`.
- `proof_negativos`: route que importa model diretamente é recusada; service que importa enum a partir de model é recusado; unidade pública sem JSDoc fica marcada para correção.
- `proof_privacidade`: confirmação de que DTOs e logs não expõem dados sensíveis.
- `proof_handoff`: nota curta a explicar como `BK-MF8-02` consome esta entrega.

#### Handoff

- Próximo BK recomendado: `BK-MF8-02`
- O BK-MF8-02 usa este mapa para ligar logs e métricas aos pontos certos da API.
- Risco a vigiar: regressões de segurança, privacidade, IA, pagamentos ou evidence devem ficar registadas antes de avançar.

#### Changelog

- `2026-06-30`: guia revisto para a estrutura tutorial MF8, com caminhos públicos `apps/...`, teste de modularidade, negativos mínimos e handoff explícito.
- `2026-07-01`: guia completado para fechar o finding `ORELLE-MF8-BK01-P1-003`, com constantes partilhadas, utilitário de encriptação neutro, imports corrigidos e JSDoc nos controllers acusados.
- `2026-07-01`: guia completado para fechar o finding `ORELLE-MF8-BK01-P1-004`, cobrindo todos os consumidores reais de enums em models, validators, services e providers.
