# BK-MF4-03 - Exportação de dados para Excel/PDF (vendas, relatórios de IA, utilizadores)

## Header
- `doc_id`: `GUIA-BK-MF4-03`
- `bk_id`: `BK-MF4-03`
- `macro`: `MF4`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF3-07`
- `rf_rnf`: `RF35`
- `fase_documental`: `Fase 2`
- `sprint`: `S08-S09`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF4-04`
- `guia_path`: `docs/planificacao/guias-bk/MF4/BK-MF4-03-exportacao-de-dados-para-excel-pdf-vendas-relatorios-de-ia-utilizadores.md`
- `last_updated`: `2026-06-15`

#### Objetivo
Criar exportação administrativa de vendas, relatórios de IA e utilizadores em formatos descarregáveis, sem expor fotografias, caminhos internos, `passwordHash`, cookies ou relatórios completos com dados sensíveis.

#### Importância
`RF35` ajuda a defesa PAP e a gestão da loja, mas exportar dados é uma zona de risco. Um ficheiro descarregado pode circular fora da app, por isso deve conter apenas campos necessários, minimizados e adequados à finalidade.

#### Scope-in
- Criar exportação `CSV` compatível com Excel.
- Criar exportação `PDF` textual mínimo sem dependências novas.
- Exportar vendas agregadas a partir de `Order`.
- Exportar resumo de relatórios de IA sem fotografias nem texto sensível integral.
- Exportar utilizadores sem `passwordHash` e sem dados biométricos.
- Criar página admin para descarregar ficheiros.

#### Scope-out
- Não criar dashboards novos; `BK-MF3-07` já entregou métricas.
- Não exportar imagens faciais.
- Não exportar ficheiros originais de relatórios completos.
- Não adicionar biblioteca externa de PDF/Excel neste BK.
- Não criar envios por email.

#### Estado antes e depois
- Antes: existia dashboard admin, mas não havia endpoints de exportação.
- Depois: admin consegue descarregar CSV e PDF textual com dados minimizados e rastreáveis.

#### Pre-requisitos
- `BK-MF3-07`: dashboard admin e agregados comerciais.
- `BK-MF3-03`: modelo `Order` com total, estado e pagamento.
- `BK-MF1-07`: modelo `FaceReport`.
- `BK-MF4-01`: proteção admin consolidada.

#### Glossário
- CSV: ficheiro de texto tabular que o Excel abre sem dependência adicional.
- PDF textual mínimo: documento PDF gerado com texto simples, suficiente para evidência e defesa.
- Minimização: exportar apenas campos necessários.
- Agregado: valor resumido, como total de vendas por estado.
- Conteúdo sensível: imagens, relatórios integrais, caminhos internos, hashes e identificadores técnicos desnecessários.

#### Conceitos teóricos essenciais
Exportar dados muda o risco: a informação sai da interface protegida e passa para um ficheiro. Por isso, o backend deve escolher campos explicitamente e nunca serializar documentos Mongoose completos.

CSV é uma forma segura e simples de cumprir o uso em Excel sem dependência nova. Para PDF, este BK usa um gerador textual mínimo no backend. `RNF16` volta ao tema de PDF em `BK-MF7-05`, onde pode haver uma solução mais rica se for aprovada.

Relatórios de IA podem conter dados derivados de análise facial. Neste BK, exporta-se apenas resumo operacional: data, estado e contagens ou limitações públicas, nunca fotografias, storage keys ou texto completo sensível.

#### Arquitetura do BK
- `admin-export.validator.js`: valida dataset e formato.
- `admin-export.service.js`: recolhe dados minimizados e gera CSV/PDF.
- `admin-export.controller.js`: define headers de download.
- `admin-export.routes.js`: protege endpoints por admin.
- `AdminExportsPage.jsx`: UI de exportação.
- `app.js` e `App.jsx`: ligam backend/frontend.

#### Ficheiros a criar/editar/rever
- CRIAR: `apps/api/src/validators/admin-export.validator.js`
- CRIAR: `apps/api/src/services/admin-export.service.js`
- CRIAR: `apps/api/src/controllers/admin-export.controller.js`
- CRIAR: `apps/api/src/routes/admin-export.routes.js`
- EDITAR: `apps/api/src/app.js`
- CRIAR: `apps/web/src/pages/AdminExportsPage.jsx`
- EDITAR: `apps/web/src/App.jsx`
- REVER: `apps/api/src/models/order.model.js`
- REVER: `apps/api/src/models/face-report.model.js`
- REVER: `apps/api/src/models/user.model.js`

#### Tutorial técnico linear
### Passo 1 - Confirmar contrato de exportação

1. Objetivo funcional do passo no contexto da app.

separar exportação administrativa de dashboard visual.
2. Ficheiros envolvidos:
   - REVER: `docs/RF.md`
   - REVER: `docs/RNF.md`
   - REVER: `docs/planificacao/guias-bk/MF3/BK-MF3-07-dashboard-de-estatisticas-vendas-produtos-mais-vendidos-utilizadores-ativos.md`
   - LOCALIZAÇÃO: `RF35`, `RNF16`, `BK-MF4-03`.
3. Instruções do que fazer.

assumir `CSV` para Excel e PDF textual mínimo sem nova dependência.
4. Código completo, correto e integrado com a app final.

```text
Decisão DERIVADO: Excel é entregue por CSV; PDF é textual e minimizado. Exportação PDF avançada volta em RNF16.
```

5. Explicação do código.

Esta decisão evita dependências novas e mantém o foco do BK no mais importante: que dados podem sair da aplicação e em que formato. Para alunos, é melhor começar com CSV e PDF simples, controlados pelo próprio código, do que instalar uma biblioteca antes de perceber o risco. O objetivo pedagógico é mostrar que exportar não é "descarregar a base de dados"; é escolher campos mínimos, validar o dataset e criar um ficheiro que não exponha dados sensíveis.
6. Validação do passo.

o PR deve justificar por que não instala biblioteca externa.
7. Cenário negativo/erro esperado.

prometer exportação visual avançada sem contrato cria risco de atraso e drift.

### Passo 2 - Criar validator

1. Objetivo funcional do passo no contexto da app.

aceitar só datasets e formatos previstos.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/src/validators/admin-export.validator.js`
   - LOCALIZAÇÃO: ficheiro completo.
3. Instruções do que fazer.

validar params e query.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/admin-export.validator.js
import { AppError } from "../middlewares/error.middleware.js";

const DATASETS = ["sales", "ai-reports", "users"];
const FORMATS = ["csv", "pdf"];

/**
 * Valida pedido de exportação administrativa.
 *
 * @function validateAdminExportRequest
 * @param {Record<string, string>} params - Params da route.
 * @param {Record<string, unknown>} query - Query string.
 * @returns {{dataset: "sales"|"ai-reports"|"users", format: "csv"|"pdf"}} Pedido normalizado.
 * @throws {AppError} Quando dataset ou formato não são suportados.
 */
export function validateAdminExportRequest(params, query) {
    const dataset = String(params.dataset ?? "").trim();
    const format = String(query.format ?? "csv").trim();

    if (!DATASETS.includes(dataset)) {
        throw new AppError(400, "Dataset de exportação invalido");
    }

    if (!FORMATS.includes(format)) {
        throw new AppError(400, "Formato de exportação invalido");
    }

    return { dataset, format };
}
```

5. Explicação do código.

O validator funciona como uma lista branca. Isto significa que a API só aceita datasets previstos (`sales`, `users`, `ai-reports`) e formatos previstos (`csv`, `pdf`). O aluno deve reparar que não existe um parâmetro livre como `collection=users` ou `model=FacePhoto`, porque isso permitiria tentar exportar qualquer coleção. Este padrão é muito usado em segurança: quando o domínio é limitado, valida-se por valores permitidos em vez de tentar bloquear todos os valores perigosos.
6. Validação do passo.

`/api/admin/exports/secrets?format=csv` deve devolver `400`.
7. Cenário negativo/erro esperado.

aceitar nome de coleção por query abre risco de exposição de dados.

### Passo 3 - Criar helpers de CSV e PDF

1. Objetivo funcional do passo no contexto da app.

gerar ficheiros sem dependência nova.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/src/services/admin-export.service.js`
   - LOCALIZAÇÃO: início do ficheiro.
3. Instruções do que fazer.

criar `buildCsv` e `buildTextPdf`.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/admin-export.service.js
import { FaceReport } from "../models/face-report.model.js";
import { Order, PAYMENT_STATUS } from "../models/order.model.js";
import { User } from "../models/user.model.js";

/**
 * Escapa valor para célula CSV.
 *
 * @function escapeCsvValue
 * @param {unknown} value - Valor bruto.
 * @returns {string} Valor seguro para CSV.
 */
function escapeCsvValue(value) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
}

/**
 * Constrói CSV compatível com Excel.
 *
 * @function buildCsv
 * @param {string[]} headers - Cabeçalhos.
 * @param {Array<Record<string, unknown>>} rows - Linhas normalizadas.
 * @returns {Buffer} Conteúdo CSV em UTF-8 com BOM.
 */
function buildCsv(headers, rows) {
    const lines = [
        headers.map(escapeCsvValue).join(","),
        ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
    ];

    return Buffer.from(`\uFEFF${lines.join("\n")}`, "utf8");
}

/**
 * Escapa texto para uma stream PDF simples.
 *
 * @function escapePdfText
 * @param {unknown} value - Valor bruto.
 * @returns {string} Texto escapado para PDF.
 */
function escapePdfText(value) {
    return String(value ?? "")
        .replaceAll("\\", "\\\\")
        .replaceAll("(", "\\(")
        .replaceAll(")", "\\)");
}

/**
 * Gera PDF textual mínimo para defesa e operação.
 *
 * @function buildTextPdf
 * @param {string} title - Título do documento.
 * @param {string[]} lines - Linhas de texto.
 * @returns {Buffer} PDF mínimo.
 */
function buildTextPdf(title, lines) {
    const content = [`BT /F1 14 Tf 50 780 Td (${escapePdfText(title)}) Tj`];

    lines.slice(0, 40).forEach((line, index) => {
        content.push(`0 -${index === 0 ? 28 : 18} Td (${escapePdfText(line)}) Tj`);
    });

    content.push("ET");
    const stream = content.join("\n");
    const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream
${stream}
endstream endobj
trailer << /Root 1 0 R >>
%%EOF`;

    return Buffer.from(pdf, "utf8");
}
```

5. Explicação do código.

O CSV é construído com cuidado para ser aberto pelo Excel sem perder acentos, por isso começa com BOM (`\uFEFF`). A função também escapa aspas e quebras de linha, evitando ficheiros partidos quando um campo textual tem vírgulas. O PDF é simples de propósito: serve para demonstrar um ficheiro PDF válido sem introduzir uma dependência nova nem criar relatórios visuais complexos. Em ambos os casos, a lição é a mesma: o formato é secundário; a seleção segura dos dados é a parte crítica.
6. Validação do passo.

abrir CSV no Excel/LibreOffice e PDF no browser.
7. Cenário negativo/erro esperado.

gerar CSV sem escaping permite quebrar colunas com vírgulas ou aspas.

### Passo 4 - Recolher dados minimizados

1. Objetivo funcional do passo no contexto da app.

criar linhas exportáveis sem documentos completos.
2. Ficheiros envolvidos:
   - EDITAR: `apps/api/src/services/admin-export.service.js`
   - LOCALIZAÇÃO: após os helpers.
3. Instruções do que fazer.

criar funções para `sales`, `ai-reports` e `users`.
4. Código completo, correto e integrado com a app final.

```js
/**
 * Obtém linhas minimizadas para exportação.
 *
 * @async
 * @function getExportRows
 * @param {"sales"|"ai-reports"|"users"} dataset - Conjunto pedido.
 * @returns {Promise<{title: string, headers: string[], rows: Array<Record<string, unknown>>}>} Dados seguros.
 */
async function getExportRows(dataset) {
    if (dataset === "sales") {
        const orders = await Order.find({})
            .select("status payment.status totalCents createdAt")
            .sort({ createdAt: -1 })
            .limit(200);

        return {
            title: "Exportação de vendas",
            headers: ["createdAt", "status", "paymentStatus", "totalEuros"],
            rows: orders.map((order) => ({
                createdAt: order.createdAt?.toISOString() ?? "",
                status: order.status,
                paymentStatus: order.payment.status,
                totalEuros: (order.totalCents / 100).toFixed(2),
                paid: order.payment.status === PAYMENT_STATUS.PAID ? "sim" : "nao",
            })),
        };
    }

    if (dataset === "ai-reports") {
        const reports = await FaceReport.find({})
            .select("analysisId limitations createdAt")
            .sort({ createdAt: -1 })
            .limit(100);

        return {
            title: "Exportação de relatórios IA",
            headers: ["createdAt", "analysisId", "limitationsCount"],
            rows: reports.map((report) => ({
                createdAt: report.createdAt?.toISOString() ?? "",
                analysisId: report.analysisId.toString(),
                limitationsCount: report.limitations?.length ?? 0,
            })),
        };
    }

    const users = await User.find({})
        .select("email role accountStatus isActive createdAt")
        .sort({ createdAt: -1 })
        .limit(200);

    return {
        title: "Exportação de utilizadores",
        headers: ["createdAt", "email", "role", "accountStatus", "isActive"],
        rows: users.map((user) => ({
            createdAt: user.createdAt?.toISOString() ?? "",
            email: user.email,
            role: user.role,
            accountStatus: user.accountStatus,
            isActive: user.isActive ? "sim" : "nao",
        })),
    };
}
```

5. Explicação do código.

Cada query usa `.select(...)` para aproximar o código do princípio da minimização: pedir à base de dados só aquilo que a exportação precisa. O export de utilizadores não pede `passwordHash`; o export de relatórios IA transforma relatórios em linhas resumidas e não devolve fotografias, `storageKey` ou relatório facial integral. Isto ensina que segurança também se faz antes de montar a resposta, reduzindo a quantidade de dados sensíveis que sequer entram na memória da função.
6. Validação do passo.

procurar no ficheiro exportado por `passwordHash`, `storageKey`, `image`, `cookie`; não deve haver matches.
7. Cenário negativo/erro esperado.

usar `find({})` sem `.select(...)` pode exportar campos privados por acidente.

### Passo 5 - Criar função pública do service e controller

1. Objetivo funcional do passo no contexto da app.

devolver buffer, tipo e nome de ficheiro.
2. Ficheiros envolvidos:
   - EDITAR: `apps/api/src/services/admin-export.service.js`
   - CRIAR: `apps/api/src/controllers/admin-export.controller.js`
3. Instruções do que fazer.

criar `buildAdminExport` e controller com headers corretos.
4. Código completo, correto e integrado com a app final.

```js
/**
 * Gera exportação administrativa.
 *
 * @async
 * @function buildAdminExport
 * @param {{dataset: "sales"|"ai-reports"|"users", format: "csv"|"pdf"}} input - Pedido validado.
 * @returns {Promise<{buffer: Buffer, contentType: string, filename: string}>} Ficheiro pronto para resposta.
 */
export async function buildAdminExport(input) {
    const data = await getExportRows(input.dataset);

    if (input.format === "pdf") {
        const lines = data.rows.map((row) =>
            data.headers.map((header) => `${header}: ${row[header]}`).join(" | "),
        );

        return {
            buffer: buildTextPdf(data.title, lines),
            contentType: "application/pdf",
            filename: `${input.dataset}.pdf`,
        };
    }

    return {
        buffer: buildCsv(data.headers, data.rows),
        contentType: "text/csv; charset=utf-8",
        filename: `${input.dataset}.csv`,
    };
}
```

```js
// apps/api/src/controllers/admin-export.controller.js
import { buildAdminExport } from "../services/admin-export.service.js";
import { validateAdminExportRequest } from "../validators/admin-export.validator.js";

/**
 * Descarrega exportação administrativa.
 *
 * @async
 * @function downloadAdminExportController
 */
export async function downloadAdminExportController(req, res, next) {
    try {
        const input = validateAdminExportRequest(req.params, req.query);
        const file = await buildAdminExport(input);

        res.setHeader("Content-Type", file.contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
        return res.status(200).send(file.buffer);
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código.

O controller fica pequeno porque a responsabilidade pesada está no service. Esta separação ajuda o aluno a testar: o validator decide se o pedido é permitido, o service constrói o ficheiro, e o controller só liga isso ao HTTP com `Content-Type`, `Content-Disposition` e status correto. Quando controllers começam a montar CSV/PDF diretamente, ficam difíceis de testar e misturam protocolo HTTP com regra de negócio.
6. Validação do passo.

confirmar `Content-Disposition` e nome de ficheiro.
7. Cenário negativo/erro esperado.

devolver JSON em vez de ficheiro não cumpre o fluxo de exportação.

### Passo 6 - Criar route e página de exportação

1. Objetivo funcional do passo no contexto da app.

permitir download a partir da UI admin.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/src/routes/admin-export.routes.js`
   - EDITAR: `apps/api/src/app.js`
   - CRIAR: `apps/web/src/pages/AdminExportsPage.jsx`
   - EDITAR: `apps/web/src/App.jsx`
3. Instruções do que fazer.

proteger route e criar links de download.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/routes/admin-export.routes.js
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { downloadAdminExportController } from "../controllers/admin-export.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/**
 * Router Express para exportações administrativas.
 *
 * @type {import("express").Router}
 */
export const adminExportRoutes = Router();

adminExportRoutes.get(
    "/exports/:dataset",
    requireAuth,
    requireRole(ROLES.ADMIN),
    downloadAdminExportController,
);
```

```jsx
// apps/web/src/pages/AdminExportsPage.jsx
import React from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

/**
 * Página de exportações administrativas.
 *
 * @function AdminExportsPage
 * @returns {JSX.Element} Ligações para CSV e PDF.
 */
export function AdminExportsPage() {
    const datasets = [
        { id: "sales", label: "Vendas" },
        { id: "ai-reports", label: "Relatórios IA" },
        { id: "users", label: "Utilizadores" },
    ];

    return (
        <section className="page-section">
            <h2>Exportações administrativas</h2>
            <ul>
                {datasets.map((dataset) => (
                    <li key={dataset.id}>
                        <strong>{dataset.label}</strong>
                        <a href={`${API_BASE_URL}/admin/exports/${dataset.id}?format=csv`}>
                            CSV
                        </a>
                        <a href={`${API_BASE_URL}/admin/exports/${dataset.id}?format=pdf`}>
                            PDF
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
}
```

5. Explicação do código.

A página usa links normais porque, para um ficheiro, o browser já sabe iniciar o download. A parte importante é que esses links continuam a apontar para endpoints protegidos por sessão e role admin; não são ficheiros públicos numa pasta estática. O aluno deve perceber que a UI não recebe `passwordHash`, `storageKey` nem dados biométricos e depois "filtra": a API já envia um ficheiro minimizado desde a origem.
6. Validação do passo.

clicar nos links como admin e confirmar download; como cliente, a resposta deve ser erro.
7. Cenário negativo/erro esperado.

criar exportação no frontend com dados já carregados pode misturar permissões e expor campos indevidos.

### Passo 7 - Validar negativos e evidência

1. Objetivo funcional do passo no contexto da app.

provar segurança e formato.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `apps/api/tests/mf4.admin-exports.test.js`
   - REVER: ficheiros descarregados de teste.
3. Instruções do que fazer.

testar autorização, validação e ausência de campos proibidos.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf4.admin-exports.test.js
import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateAdminExportRequest } from "../src/validators/admin-export.validator.js";
import { buildAdminExport } from "../src/services/admin-export.service.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { User } from "../src/models/user.model.js";

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: { find: vi.fn() },
}));

vi.mock("../src/models/order.model.js", () => ({
    PAYMENT_STATUS: Object.freeze({ PAID: "paid" }),
    Order: { find: vi.fn() },
}));

vi.mock("../src/models/user.model.js", () => ({
    User: { find: vi.fn() },
}));

// Os services convertem ObjectId para texto antes de criar o ficheiro.
// Este helper simula só essa parte, mantendo o teste independente do MongoDB.
function objectId(value) {
    return { toString: () => value };
}

// Simula a chain Mongoose usada nas queries de exportação.
// Assim o teste confirma `.select().sort().limit()` sem precisar de base de dados real.
function queryRows(rows) {
    return {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(rows),
    };
}

describe("BK-MF4-03 admin exports", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("bloqueia datasets desconhecidos no validator", () => {
        expect(() =>
            validateAdminExportRequest(
                { dataset: "raw-users" },
                { format: "csv" },
            ),
        ).toThrow("Dataset de exportação invalido");
    });

    it("gera CSV de utilizadores sem campos sensíveis", async () => {
        // O mock inclui campos proibidos de propósito.
        // O teste só passa se o service os excluir do ficheiro final.
        User.find.mockReturnValueOnce(
            queryRows([
                {
                    email: "cliente@orelle.local",
                    role: "cliente",
                    accountStatus: "active",
                    isActive: true,
                    passwordHash: "nunca-exportar",
                    storageKey: "private/path",
                    createdAt: new Date("2026-06-15T10:00:00.000Z"),
                },
            ]),
        );

        const result = await buildAdminExport({ dataset: "users", format: "csv" });
        const text = result.buffer.toString("utf8");

        expect(result.contentType).toBe("text/csv; charset=utf-8");
        expect(text).toContain("createdAt");
        expect(text).toContain("cliente@orelle.local");
        // Estes asserts são a evidência de minimização para a defesa.
        expect(text).not.toContain("passwordHash");
        expect(text).not.toContain("nunca-exportar");
        expect(text).not.toContain("storageKey");
        expect(text).not.toContain("private/path");
    });

    it("gera PDF de relatórios IA apenas com resumo minimizado", async () => {
        // O relatório falso tem `storageKey` privado para provar que o PDF final
        // não exporta caminhos internos nem ficheiros de análise facial.
        FaceReport.find.mockReturnValueOnce(
            queryRows([
                {
                    analysisId: objectId("analysis-1"),
                    limitations: ["Luz irregular", "Resultado indicativo"],
                    storageKey: "faces/raw/report.json",
                    createdAt: new Date("2026-06-15T10:00:00.000Z"),
                },
            ]),
        );

        const result = await buildAdminExport({
            dataset: "ai-reports",
            format: "pdf",
        });
        const text = result.buffer.toString("utf8");

        expect(result.contentType).toBe("application/pdf");
        expect(text).toContain("%PDF-1.4");
        expect(text).toContain("limitationsCount");
        expect(text).not.toContain("storageKey");
        expect(text).not.toContain("faces/raw/report.json");
    });
});
```

5. Explicação do código.

Os testes cobrem duas ideias. Primeiro, o validator recusa datasets fora da lista branca, mostrando que a API não exporta coleções arbitrárias. Segundo, os exports são inspecionados como texto para confirmar ausência de campos sensíveis. Isto é didático porque transforma segurança em prova concreta: não basta dizer "não exporta `passwordHash`"; o teste coloca `passwordHash` no mock e confirma que ele não aparece no ficheiro final.
6. Validação do passo.

abrir ficheiros e procurar termos sensíveis antes de anexar evidence.
7. Cenário negativo/erro esperado.

validar apenas status `200` não prova minimização.

#### Expected results
- `GET /api/admin/exports/sales?format=csv` devolve `200` e `text/csv`.
- `GET /api/admin/exports/users?format=pdf` devolve `200` e `application/pdf`.
- Cliente sem role admin recebe `403`.
- Dataset ou formato inválido devolve `400`.
- Ficheiros não incluem `passwordHash`, fotografias, paths internos, cookies ou relatórios faciais integrais.

#### Critérios de aceite
- Entrega funcional especifica de `Exportação de dados para Excel/PDF (vendas, relatórios de IA, utilizadores)` validada contra `RF35`.
- Cenários negativos concluídos: mínimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).
- CSV abre no Excel ou ferramenta compatível.
- PDF textual abre no browser e contém apenas dados minimizados.

#### Validação final
- Executar testes de API.
- Descarregar pelo menos um CSV e um PDF.
- Fazer pesquisa textual nos ficheiros gerados por campos sensíveis.
- Executar `bash scripts/validate-planificacao.sh`.

#### Evidence para PR/defesa
- `proof_tecnico`: headers HTTP e ficheiros descarregados.
- `proof_negativos`: `403`, `400` e ausência de campos sensíveis.
- `proof_privacidade`: lista de campos exportados por dataset.
- `proof_ui`: screenshot da página de exportações.

#### Handoff
`BK-MF4-04` pode usar dados de encomendas para notificações, mas não deve enviar exports por mensagens. `BK-MF7-05` pode evoluir o PDF, mantendo a mesma regra de minimização.

#### Changelog
- `2026-06-15`: guia reescrito para exportação admin segura em CSV/PDF textual, sem dependências novas e com negativos `P1`.
