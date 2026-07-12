# BK-MF4-03 - Exportação administrativa para Excel/PDF, com relatórios IA apenas em metadados

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
- `last_updated`: `2026-07-11`

> **Estado atual da implementação de referência — 2026-07-10:** a neutralização de CSV Formula Injection tem prova para `=`, `+`, `-`, `@`, TAB e CR. O writer manual foi substituído por `pdf-lib@1.17.1`; `13/13` testes focais passaram e uma amostra PDF 1.7/A4 de duas páginas passou `pdfinfo` com exit code `0` e sem warnings. Esta evidence valida a correção de `ORELLE-AUD-P3-002` no runtime de referência; a checklist abaixo continua a ser trabalho executável no projeto dos alunos.

> **Contrato de privacidade reconciliado — 2026-07-11:** o dataset `ai-reports` é estritamente `metadata-only`. Pode exportar `id`, `schemaVersion`, `lifecycleStatus`, contagem de recomendações, estados de revisão/desbloqueio/pagamento simulado, depósito e data. Não pode selecionar nem serializar `userId`, `analysisId`, objetivos, provider/modelo, resumo cosmético, fontes, limitações, `machineResult`, `humanOverride` ou qualquer conteúdo do relatório. A rota continua exclusivamente administrativa e as respostas CSV/PDF usam `Cache-Control: private, no-store, max-age=0`.

#### Objetivo
Criar exportação administrativa de vendas, metadados operacionais de relatórios IA e utilizadores em formatos descarregáveis, sem expor fotografias, identificadores do titular/análise, conteúdo cosmético, caminhos internos, `passwordHash` ou cookies.

#### Importância
`RF35` ajuda a defesa PAP e a gestão da loja, mas exportar dados é uma zona de risco. Um ficheiro descarregado pode circular fora da app, por isso deve conter apenas campos necessários, minimizados e adequados à finalidade.

#### Scope-in
- Criar exportação `CSV` compatível com Excel e neutralizar prefixos interpretados como fórmulas.
- Criar exportação `PDF` estruturalmente válida com `pdf-lib`.
- Exportar vendas agregadas a partir de `Order`.
- Exportar apenas metadados operacionais de relatórios IA, sem `userId`, `analysisId` ou conteúdo do relatório.
- Exportar utilizadores sem `passwordHash` e sem dados biométricos.
- Criar página admin para descarregar ficheiros.

#### Scope-out
- Não criar dashboards novos; `BK-MF3-07` já entregou métricas.
- Não exportar imagens faciais.
- Não exportar ficheiros originais de relatórios completos.
- Não exportar objetivos, provider/modelo, resumo, fontes, limitações, resultados da máquina ou revisão humana.
- Não construir objetos PDF, xref ou trailers manualmente.
- Não criar envios por email.

#### Estado antes e depois
- Antes: existia dashboard admin, mas não havia endpoints de exportação.
- Depois: admin consegue descarregar CSV neutralizado e PDF estruturalmente válido com dados minimizados e rastreáveis.

#### Pre-requisitos
- `BK-MF3-07`: dashboard admin e agregados comerciais.
- `BK-MF3-03`: modelo `Order` com total, estado e pagamento.
- `BK-MF1-07`: modelo `FaceReport`.
- `BK-MF4-01`: proteção admin consolidada.

#### Glossário
- CSV: ficheiro de texto tabular que o Excel abre sem dependência adicional.
- PDF estruturalmente válido: documento criado por uma biblioteca PDF e aceite por `pdfinfo` sem warnings.
- Minimização: exportar apenas campos necessários.
- Agregado: valor resumido, como total de vendas por estado.
- Conteúdo sensível: imagens, relatórios integrais, caminhos internos, hashes e identificadores técnicos desnecessários.

#### Conceitos teóricos essenciais
Exportar dados muda o risco: a informação sai da interface protegida e passa para um ficheiro. Por isso, o backend deve escolher campos explicitamente e nunca serializar documentos Mongoose completos.

CSV é uma forma simples de cumprir o uso tabular, desde que os valores controlados sejam neutralizados antes do escape. Para PDF, o conteúdo pode ser textual, mas a estrutura deve ser criada por `pdf-lib` e validada com `pdfinfo`; um gerador manual não é suficiente.

Relatórios IA podem conter dados derivados de análise facial. Neste BK, a exportação administrativa contém apenas metadados operacionais que não revelam o titular, a análise ou o conteúdo: versão do schema, estado do ciclo de vida, contagens, estados de revisão/desbloqueio/pagamento simulado, depósito e data. `userId`, `analysisId`, objetivos, provider/modelo, resumo, fontes, limitações e payloads cifrados ficam sempre fora da projeção e das linhas.

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

assumir `CSV` neutralizado para Excel e PDF textual gerado por `pdf-lib`.
4. Código completo, correto e integrado com a app final.

```text
Decisão DERIVADO: Excel é entregue por CSV neutralizado; PDF é textual e minimizado, mas estruturalmente válido por `pdf-lib`.
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

gerar CSV neutralizado e PDF através da dependência justificada `pdf-lib`.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/src/services/admin-export.service.js`
   - LOCALIZAÇÃO: início do ficheiro.
3. Instruções do que fazer.

criar `buildCsv` e `buildTextPdf`.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/admin-export.service.js
import { PDFDocument, StandardFonts } from "pdf-lib";
import { AiConsultationReview } from "../models/ai-consultation-review.model.js";
import { PAYMENT_STATUS } from "../constants/domain.constants.js";
import { FaceReport } from "../models/face-report.model.js";
import { Order } from "../models/order.model.js";
import { ReportUnlock } from "../models/report-unlock.model.js";
import { User } from "../models/user.model.js";

/**
 * Escapa valor para célula CSV.
 *
 * @function escapeCsvValue
 * @param {unknown} value - Valor bruto.
 * @returns {string} Valor seguro para CSV.
 */
function neutralizeSpreadsheetFormula(value) {
    const text = String(value ?? "");
    return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function escapeCsvValue(value) {
    const text = neutralizeSpreadsheetFormula(value);
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
export function buildCsv(headers, rows) {
    const lines = [
        headers.map(escapeCsvValue).join(","),
        ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
    ];

    return Buffer.from(`\uFEFF${lines.join("\n")}`, "utf8");
}

/**
async function buildTextPdf(title, lines) {
    const document = await PDFDocument.create();
    const page = document.addPage([595, 842]);
    const font = await document.embedFont(StandardFonts.Helvetica);

    page.drawText(String(title), { x: 50, y: 790, size: 14, font });
    lines.slice(0, 40).forEach((line, index) => {
        page.drawText(String(line).slice(0, 120), {
            x: 50,
            y: 755 - index * 17,
            size: 9,
            font,
        });
    });

    return Buffer.from(await document.save());
}
```

5. Explicação do código.

O CSV começa com BOM (`\uFEFF`), neutraliza os seis prefixos de fórmula e só depois aplica escape RFC 4180. `pdf-lib` gera a estrutura interna, xref e trailer; não basta um buffer começar por `%PDF`. A seleção segura dos dados continua a ser obrigatória nos dois formatos.
6. Validação do passo.

abrir CSV no Excel/LibreOffice e validar o PDF com `pdfinfo`.
7. Cenário negativo/erro esperado.

gerar CSV sem neutralização permite executar uma fórmula ao abrir o ficheiro; construir PDF manualmente pode produzir um ficheiro que o browser tolera mas `pdfinfo` rejeita.

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
            headers: ["createdAt", "status", "paymentStatus", "simulatedPaid", "totalEuros"],
            rows: orders.map((order) => ({
                createdAt: order.createdAt?.toISOString() ?? "",
                status: order.status,
                paymentStatus: order.payment.status,
                totalEuros: (order.totalCents / 100).toFixed(2),
                simulatedPaid:
                    order.payment.status === PAYMENT_STATUS.SIMULATED_PAID
                        ? "sim"
                        : "nao",
            })),
        };
    }

    if (dataset === "ai-reports") {
        const reports = await FaceReport.find({ privacyStatus: "active" })
            .select("schemaVersion lifecycleStatus finalRecommendationIds createdAt")
            .sort({ createdAt: -1 })
            .limit(100);

        const reportIds = reports.map(({ _id }) => _id);
        const [reviews, unlocks] = reportIds.length
            ? await Promise.all([
                  AiConsultationReview.find({ reportId: { $in: reportIds } })
                      .select("reportId status")
                      .lean(),
                  ReportUnlock.find({ reportId: { $in: reportIds } })
                      .select("reportId status depositCents simulatedPayment.status")
                      .lean(),
              ])
            : [[], []];
        const reviewsByReport = new Map(
            reviews.map((review) => [review.reportId.toString(), review]),
        );
        const unlocksByReport = new Map(
            unlocks.map((unlock) => [unlock.reportId.toString(), unlock]),
        );

        return {
            title: "Exportação de relatórios IA",
            headers: [
                "id",
                "schemaVersion",
                "lifecycleStatus",
                "recommendationCount",
                "reviewStatus",
                "unlockStatus",
                "simulatedPaymentStatus",
                "depositCents",
                "createdAt",
            ],
            rows: reports.map((report) => {
                const id = report._id.toString();
                const review = reviewsByReport.get(id);
                const unlock = unlocksByReport.get(id);

                return {
                    id,
                    schemaVersion: Number(report.schemaVersion ?? 1),
                    lifecycleStatus: report.lifecycleStatus ?? "legacy",
                    recommendationCount: Array.isArray(report.finalRecommendationIds)
                        ? report.finalRecommendationIds.length
                        : 0,
                    reviewStatus: review?.status ?? "not_requested",
                    unlockStatus: unlock?.status ?? "not_created",
                    simulatedPaymentStatus:
                        unlock?.simulatedPayment?.status ?? "not_started",
                    depositCents: Number(unlock?.depositCents ?? 0),
                    createdAt: report.createdAt?.toISOString() ?? "",
                };
            }),
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

Cada query usa `.select(...)` como barreira de minimização. O export de utilizadores não pede `passwordHash`. O dataset `ai-reports` não pede campos cifrados nem os identificadores `userId`/`analysisId`: cruza apenas estados de revisão e desbloqueio através do `reportId` interno e produz metadados operacionais. Assim, os getters sensíveis nem sequer precisam de ser executados durante a exportação.
6. Validação do passo.

procurar no ficheiro exportado por `passwordHash`, `storageKey`, `userId`, `analysisId`, `cosmeticSummary`, `machineResult`, `humanOverride`, `image` e `cookie`; não deve haver matches.
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
            buffer: await buildTextPdf(data.title, lines),
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
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Orelle-Export-Rows", String(file.rowCount));
        res.setHeader("Cache-Control", "private, no-store, max-age=0");
        res.setHeader("Pragma", "no-cache");
        return res.status(200).send(file.buffer);
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código.

O controller fica pequeno porque a responsabilidade pesada está no service. Esta separação ajuda o aluno a testar: o validator decide se o pedido é permitido, o service constrói o ficheiro, e o controller só liga isso ao HTTP com headers de download, `nosniff` e proibição explícita de cache. Quando controllers começam a montar CSV/PDF diretamente, ficam difíceis de testar e misturam protocolo HTTP com regra de negócio.
6. Validação do passo.

confirmar `Content-Disposition`, nome de ficheiro, `Cache-Control: private, no-store, max-age=0` e `Pragma: no-cache`.
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

// Downloads usam a mesma origem; o proxy Vite resolve /api apenas em desenvolvimento.
const API_BASE_URL = "/api";

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
import { PDFDocument } from "pdf-lib";
import { validateAdminExportRequest } from "../src/validators/admin-export.validator.js";
import {
    buildAdminExport,
    buildCsv,
} from "../src/services/admin-export.service.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import { User } from "../src/models/user.model.js";

vi.mock("../src/models/ai-consultation-review.model.js", () => ({
    AiConsultationReview: { find: vi.fn() },
}));

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: { find: vi.fn() },
}));

vi.mock("../src/models/report-unlock.model.js", () => ({
    ReportUnlock: { find: vi.fn() },
}));

vi.mock("../src/constants/domain.constants.js", () => ({
    PAYMENT_STATUS: Object.freeze({ SIMULATED_PAID: "simulated_paid" }),
}));

vi.mock("../src/models/order.model.js", () => ({
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

function queryMetadata(rows) {
    return {
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(rows),
    };
}

describe("BK-MF4-03 admin exports", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1:A2)", "\tformula", "\rformula"])(
        "mantém payload CSV perigoso como texto: %s",
        (payload) => {
            const csv = buildCsv(["value"], [{ value: payload }]).toString("utf8");
            expect(csv).toContain(`"'${payload}"`);
        },
    );

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

    it("gera PDF de relatórios IA estritamente metadata-only", async () => {
        const reportId = objectId("report-1");
        // O fixture inclui deliberadamente conteúdo proibido. A projeção segura
        // e o mapping metadata-only impedem que esse conteúdo chegue ao ficheiro.
        const reportQuery = queryRows([
                {
                    _id: reportId,
                    userId: objectId("owner-1"),
                    analysisId: objectId("analysis-1"),
                    schemaVersion: 2,
                    lifecycleStatus: "unlocked",
                    finalRecommendationIds: [objectId("recommendation-1")],
                    cosmeticSummary: "conteúdo-cosmético-proibido",
                    limitations: ["limitação-proibida"],
                    storageKey: "faces/raw/report.json",
                    createdAt: new Date("2026-06-15T10:00:00.000Z"),
                },
            ]);
        FaceReport.find.mockReturnValueOnce(reportQuery);
        AiConsultationReview.find.mockReturnValueOnce(
            queryMetadata([{ reportId, status: "approved" }]),
        );
        ReportUnlock.find.mockReturnValueOnce(
            queryMetadata([
                {
                    reportId,
                    status: "unlocked",
                    depositCents: 250,
                    simulatedPayment: { status: "simulated_paid" },
                },
            ]),
        );

        const result = await buildAdminExport({
            dataset: "ai-reports",
            format: "pdf",
        });
        const pdfDocument = await PDFDocument.load(result.buffer);

        expect(result.contentType).toBe("application/pdf");
        expect(pdfDocument.getPageCount()).toBeGreaterThan(0);
        expect(reportQuery.select).toHaveBeenCalledWith(
            "schemaVersion lifecycleStatus finalRecommendationIds createdAt",
        );
        expect(result.buffer.includes(Buffer.from("storageKey"))).toBe(false);
        expect(result.buffer.includes(Buffer.from("faces/raw/report.json"))).toBe(false);
        expect(result.buffer.includes(Buffer.from("owner-1"))).toBe(false);
        expect(result.buffer.includes(Buffer.from("analysis-1"))).toBe(false);
        expect(result.buffer.includes(Buffer.from("conteúdo-cosmético-proibido"))).toBe(false);
    });

    it("prova em CSV que ai-reports não contém IDs pessoais nem conteúdo", async () => {
        const reportId = objectId("report-safe-id");
        FaceReport.find.mockReturnValueOnce(
            queryRows([
                {
                    _id: reportId,
                    userId: "private-user-marker",
                    analysisId: "private-analysis-marker",
                    schemaVersion: 2,
                    lifecycleStatus: "frozen_locked",
                    finalRecommendationIds: [],
                    cosmeticSummary: "private-content-marker",
                    createdAt: new Date("2026-07-11T10:00:00.000Z"),
                },
            ]),
        );
        AiConsultationReview.find.mockReturnValueOnce(queryMetadata([]));
        ReportUnlock.find.mockReturnValueOnce(queryMetadata([]));

        const result = await buildAdminExport({
            dataset: "ai-reports",
            format: "csv",
        });
        const csv = result.buffer.toString("utf8");

        expect(csv).toContain("schemaVersion");
        expect(csv).toContain("lifecycleStatus");
        expect(csv).toContain("recommendationCount");
        expect(csv).not.toContain("userId");
        expect(csv).not.toContain("analysisId");
        expect(csv).not.toContain("private-user-marker");
        expect(csv).not.toContain("private-analysis-marker");
        expect(csv).not.toContain("private-content-marker");
    });
});
```

5. Explicação do código.

Os testes cobrem quatro ideias. Primeiro, o validator recusa datasets fora da lista branca. Segundo, o CSV de utilizadores exclui segredos. Terceiro, a projeção de `FaceReport` contém apenas campos metadata-only e o PDF abre com `PDFDocument.load`. Quarto, o CSV de `ai-reports` permite inspecionar diretamente headers/linhas e prova que `userId`, `analysisId` e conteúdo cosmético não saem. A prova externa com `pdfinfo` completa a validação estrutural.
6. Validação do passo.

abrir ficheiros e procurar termos sensíveis antes de anexar evidence.
7. Cenário negativo/erro esperado.

validar apenas status `200` não prova minimização.

#### Expected results
- `GET /api/admin/exports/sales?format=csv` devolve `200` e `text/csv`.
- `GET /api/admin/exports/users?format=pdf` devolve `200` e `application/pdf`.
- Cliente sem role admin recebe `403`.
- Dataset ou formato inválido devolve `400`.
- `ai-reports` contém apenas metadados operacionais e não inclui `userId`, `analysisId`, objetivos, provider/modelo, resumo, fontes, limitações ou payloads do relatório.
- Ficheiros não incluem `passwordHash`, fotografias, paths internos, cookies ou relatórios faciais integrais.
- Células iniciadas por `=`, `+`, `-`, `@`, TAB ou CR permanecem texto.
- Na implementação de referência, o PDF é aceite porque é gerado por `pdf-lib` e passou `pdfinfo` sem warnings; no projeto dos alunos, a mesma prova continua obrigatória.

#### Critérios de aceite
- Entrega funcional específica de `Exportação administrativa para Excel/PDF, com relatórios IA apenas em metadados` validada contra `RF35`.
- Cenários negativos concluídos: mínimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).
- CSV abre no Excel ou ferramenta compatível sem interpretar payloads controlados como fórmulas.
- PDF contém apenas dados minimizados e `pdfinfo` não emite warnings.
- Testes negativos colocam `userId`, `analysisId` e conteúdo no fixture e provam que nenhum desses campos/valores entra no CSV/PDF.
- O runtime de referência já não usa o builder manual e a correção de `ORELLE-AUD-P3-002` tem evidence focal e estrutural válida.

#### Validação final
- Executar testes de API.
- Descarregar pelo menos um CSV e um PDF.
- Fazer pesquisa textual nos ficheiros gerados por campos sensíveis.
- Executar `pdfinfo <ficheiro.pdf>` e guardar exit code `0` sem warnings.
- Executar `bash scripts/validate-planificacao.sh`.

#### Evidence para PR/defesa
- `proof_tecnico`: headers HTTP e ficheiros descarregados.
- `proof_negativos`: `403`, `400` e ausência de campos sensíveis.
- `proof_privacidade`: allowlist de campos por dataset e asserts negativos para `userId`, `analysisId` e conteúdo de relatório.
- `proof_ui`: screenshot da página de exportações.

#### Handoff
`BK-MF4-04` pode usar dados de encomendas para notificações, mas não deve enviar exports por mensagens. `BK-MF7-05` pode evoluir o PDF, mantendo a mesma regra de minimização.

#### Changelog
- `2026-07-11`: `ai-reports` alinhado ao runtime metadata-only: removidos `userId`, `analysisId`, limitações e qualquer conteúdo; adicionada prova CSV/PDF com fixtures hostis.
- `2026-07-10` (histórico, substituído em 2026-07-11): a projeção então incluía `userId` para decifra de limitações; o contrato atual já não seleciona nem exporta esse conteúdo.
- `2026-07-10`: links de download alinhados a `/api` same-origin, sem fallback localhost no bundle.
- `2026-07-10`: estado PDF reconciliado com a implementação de referência: `pdf-lib@1.17.1`, `13/13` testes e `pdfinfo` sem warnings numa amostra PDF 1.7/A4 de duas páginas.
- `2026-07-09`: CSV alinhado à neutralização de `= + - @ TAB CR`; builder PDF manual marcado como não conforme e alvo atualizado para `pdf-lib` + `pdfinfo`, sem fechar antecipadamente P3-002.
- `2026-06-15`: guia reescrito para exportação admin segura em CSV/PDF textual, sem dependências novas e com negativos `P1`.

## Suplemento de validacao documental
Este suplemento fecha lacunas formais detetadas pelo validador de planificacao sem alterar o contrato funcional original do guia.

## Bloco pedagogico
### Objetivo
O aluno deve completar `Exportação administrativa para Excel/PDF, com relatórios IA apenas em metadados.` com rastreabilidade direta a `RF35`, mantendo evidence objetiva, negativos por prioridade e handoff claro.

### Pre-requisitos
- Rever `RF35` nos documentos RF/RNF aplicáveis.
- Confirmar dependencias declaradas: `BK-MF3-07`.
- Consultar `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md` e o guia atual antes de implementar.

### Erros comuns
- Fechar o BK sem negativos minimos por prioridade.
- Alterar comportamento sem alinhar matriz, backlog, anexos e guia.
- Registar evidence sem output, screenshot, request/response ou teste verificavel.

### Check de compreensao
- [ ] Sei explicar o objetivo do BK e o requisito associado.
- [ ] Sei quais sao entradas, saidas, dependencias e criterio de sucesso.
- [ ] Sei executar o smoke principal e os negativos obrigatorios.

## Bloco operacional
### Entrada
- BK: `BK-MF4-03`
- Requisito: `RF35`
- Dependencias: `BK-MF3-07`
- Sprint: `S08-S09`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF4-03` e do requisito `RF35`.
2. Validar pre-condicoes e dependencias declaradas (`BK-MF3-07`).
3. Rever ficheiros reais ligados ao BK e identificar o fluxo principal.
4. Consolidar contrato de entrada/saida com validacao, ownership e erros controlados.
5. Executar cenarios negativos obrigatorios (minimo 2) e registar o resultado.
6. Reexecutar validacao afetada e guardar evidence final para defesa/PR.

### Validacao
- [ ] Smoke: fluxo principal executa sem erro bloqueante.
- [ ] Negativos: minimo `2` cenarios com resultado controlado.
- [ ] Tecnico: metadados alinhados entre guia, backlog, matriz e anexos.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF4-04`
- Registar riscos, dependencias pendentes e validacoes executadas antes do fecho.

## Criterios de aceite
- Entrega funcional específica de `Exportação administrativa para Excel/PDF, com relatórios IA apenas em metadados.` validada contra `RF35`.
- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).
- Metadados do guia alinhados com matriz, backlog e anexos.

## Evidence para PR/defesa
- `proof_tecnico`: output, log, screenshot ou request/response do fluxo principal.
- `proof_negativos`: cenarios negativos executados e resultados observados.
- `proof_handoff`: estado final, riscos e proximo BK.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF4-03';
const MIN_NEGATIVOS = 2;

export function validarEvidenceDocumental(evidence) {
  const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;

  if (evidence?.bkId !== BK_ID) {
    throw new Error('Evidence fora do contrato do BK');
  }

  if (negativos < 2) {
    throw new Error('Cenarios negativos abaixo do minimo exigido');
  }

  return { bkId: BK_ID, estado: 'validado' };
}
```

## Changelog
- `2026-07-10`: fixture alinhada a `SIMULATED_PAID`; PDF passou a ser validado estruturalmente com `PDFDocument.load`/`pdfinfo`, sem assumir `%PDF-1.4`.
- `2026-06-30`: suplemento documental adicionado para cumprir validador de planificacao.
