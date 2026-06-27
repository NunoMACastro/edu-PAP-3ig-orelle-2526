# BK-MF7-05 - Exportação de relatórios em PDF

## Header
- `doc_id`: `GUIA-BK-MF7-05`
- `bk_id`: `BK-MF7-05`
- `macro`: `MF7`
- `owner`: `Daniel Bulica`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `-`
- `rf_rnf`: `RNF16`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Core`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF7-06`
- `guia_path`: `docs/planificacao/guias-bk/MF7/BK-MF7-05-exportacao-de-relatorios-em-pdf.md`
- `last_updated`: `2026-06-26`

#### Objetivo

Neste BK vais reforçar a exportação administrativa em PDF para dados minimizados, incluindo relatórios IA. O trabalho continua o módulo `admin-export` já introduzido por `BK-MF4-03` para `RF35` e fecha a exigência de `RNF16` com prova de PDF, autorização, headers e exclusão de relatórios não ativos.

O endpoint final deve continuar a ser `GET /api/admin/exports/:dataset?format=pdf`, protegido por sessão HttpOnly e role de administrador. A exportação não pode conter fotografias, relatórios completos, tokens, cookies, paths internos, `passwordHash` ou dados de relatórios com `privacyStatus` diferente de `active`.

#### Importância

Exportar dados ajuda na operação e na defesa do projeto, mas é uma das zonas com maior risco de fuga de informação. O backend tem de controlar a origem dos dados, escolher campos mínimos e devolver um ficheiro com headers corretos. O frontend deve descarregar o ficheiro recebido sem renderizar o conteúdo sensível no DOM.

Este BK também evita duplicação técnica: `BK-MF4-03` já definiu a exportação administrativa para CSV/PDF. Aqui vais consolidar essa base para que a exportação PDF de relatórios IA seja segura, testável e coerente com os direitos de eliminação/anonimização trabalhados em MF6.

#### Scope-in

- Preservar o módulo `admin-export` criado para `RF35`.
- Validar formato `pdf` e datasets fechados: `sales`, `users`, `ai-reports`.
- Gerar PDF textual mínimo no backend sem dependência nova.
- Proteger a rota com sessão válida e role `administrador`.
- Excluir relatórios IA sem `privacyStatus: "active"`.
- Devolver `Content-Type`, `Content-Disposition`, `X-Content-Type-Options` e `X-Orelle-Export-Rows`.
- Descarregar ficheiro no frontend sem expor conteúdo exportado no DOM.
- Criar prova automática para builder, validator, service, headers, autorização e negativos.

#### Scope-out

- Não gerar PDF visual avançado.
- Não exportar fotografia facial.
- Não exportar campos criptográficos.
- Não criar novo dashboard.
- Não criar novo módulo paralelo de exportações.
- Não alterar dados de vendas, utilizadores ou relatórios.
- Não introduzir dependência externa de PDF.

#### Estado antes e depois

- Antes: `BK-MF4-03` já criou a base de exportação administrativa para `RF35`, com endpoint `admin-export`, datasets fechados, UI `AdminExportsPage` e suporte CSV/PDF textual. A base, porém, ainda precisa de reforço específico para `RNF16`: filtro `privacyStatus`, headers PDF, negativos de autorização e prova por camada.
- Depois: o mesmo módulo `admin-export` passa a demonstrar PDF minimizado para `RNF16`, mantém compatibilidade com `RF35`, exclui relatórios apagados/anonimizados e deixa evidence clara para backend, frontend e defesa.

#### Pre-requisitos

- `BK-MF4-03`: exportação administrativa para `RF35`, incluindo CSV/PDF, datasets fechados e `AdminExportsPage`.
- `BK-MF5-04`: auditoria e proteção de dados biométricos.
- `BK-MF6-07`: relatórios com `privacyStatus` e armazenamento protegido.
- `BK-MF7-03`: sessão HttpOnly e role de utilizador.
- `BK-MF7-04`: downloads compatíveis nos browsers alvo.

#### Glossário

- Dataset: conjunto fechado de dados exportáveis, como `sales`, `users` ou `ai-reports`.
- PDF textual mínimo: ficheiro PDF simples criado em backend sem biblioteca adicional.
- Content-Disposition: header HTTP que indica ao browser que deve descarregar o ficheiro e qual o nome sugerido.
- Minimização: exportar apenas os campos necessários para a finalidade.
- Nosniff: header que reduz interpretação errada do tipo de conteúdo pelo browser.
- `privacyStatus`: estado de privacidade do relatório IA, usado para excluir dados apagados ou anonimizados.

#### Conceitos teóricos essenciais

Exportar não é dar acesso total à base de dados. O service escolhe campos específicos e limita quantidades. Relatórios IA devem ser tratados com especial cuidado porque podem conter dados cosméticos sensíveis ou derivados de fotografia facial.

O backend gera o ficheiro. O frontend apenas descarrega o `Blob` recebido. Esta separação evita reconstruir PDF no browser, reduz exposição de dados no DOM e mantém autorização no servidor.

`CANONICO`: `RNF16` exige exportação de relatórios em PDF. `RF35` já definiu exportação de dados para Excel/PDF, incluindo vendas, relatórios de IA e utilizadores. Por isso, este BK não começa do zero: reforça o contrato técnico anterior e acrescenta evidence específica para PDF.

`DERIVADO`: para o MVP PAP, um PDF textual mínimo com `Buffer` é suficiente. A decisão evita uma dependência nova e mantém o foco em autorização, minimização, headers e testes.

#### Arquitetura do BK

- Validator: `apps/api/src/validators/admin-export.validator.js`.
- Service: `apps/api/src/services/admin-export.service.js`.
- Controller: `apps/api/src/controllers/admin-export.controller.js`.
- Route: `GET /api/admin/exports/:dataset?format=pdf`.
- Frontend: `apps/web/src/pages/AdminExportsPage.jsx`.
- Testes: `apps/api/tests/mf7.admin-export-pdf.test.js`.
- Handoff: `BK-MF7-06` usa a mesma disciplina de dados controlados, role e ação explícita do utilizador antes de checkout/pagamento.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/validators/admin-export.validator.js`
- EDITAR: `apps/api/src/services/admin-export.service.js`
- EDITAR: `apps/api/src/controllers/admin-export.controller.js`
- EDITAR: `apps/api/src/routes/admin-export.routes.js`
- EDITAR: `apps/web/src/pages/AdminExportsPage.jsx`
- CRIAR: `apps/api/tests/mf7.admin-export-pdf.test.js`
- REVER: `apps/api/src/models/face-report.model.js`
- REVER: `apps/api/src/services/biometric-audit.service.js`
- REVER: `apps/api/tests/mf4.integration.test.js`

#### Tutorial técnico linear

### Passo 1 - Reconciliar contrato `RF35` e `RNF16`

1. Objetivo funcional do passo no contexto da app.

Confirmar que este BK evolui a exportação administrativa existente e fecha a exigência PDF de `RNF16`, sem criar outro módulo.

2. Ficheiros envolvidos:
    - REVER: `docs/RF.md`
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/guias-bk/MF4/BK-MF4-03-exportacao-de-dados-para-excel-pdf-vendas-relatorios-de-ia-utilizadores.md`
    - REVER: `docs/planificacao/guias-bk/MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md`

3. Instruções do que fazer.

Confirma que `RF35` já criou a exportação admin para vendas, utilizadores e relatórios IA. Depois confirma que `RNF16` pede a garantia PDF. O resultado esperado é manter `admin-export`, preservar os datasets fechados e acrescentar filtro `privacyStatus` para relatórios IA.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Esta é uma verificação de contrato e de continuidade arquitetural.

5. Explicação do código.

Sem código. A decisão técnica é não duplicar controllers, routes ou páginas. O mesmo endpoint administrativo deve ganhar prova e regras mais fortes para PDF.

6. Validação do passo.

Executa `rg -n "RF35|RNF16|admin-export|AdminExportsPage|privacyStatus" docs/RF.md docs/RNF.md docs/planificacao/guias-bk/MF4 docs/planificacao/guias-bk/MF6 docs/planificacao/guias-bk/MF7/BK-MF7-05-exportacao-de-relatorios-em-pdf.md`.

7. Cenário negativo/erro esperado.

Se criares outro endpoint para o mesmo contrato, ficas com duas fontes de exportação e aumenta o risco de uma delas não aplicar minimização ou autorização.

### Passo 2 - Validar dataset e formato com lista fechada

1. Objetivo funcional do passo no contexto da app.

Aceitar apenas datasets e formatos autorizados antes de qualquer consulta à base de dados.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/validators/admin-export.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o ficheiro pelo conteúdo abaixo. Mantém `csv` por defeito para compatibilidade com `RF35` e exige `?format=pdf` para o PDF de `RNF16`.

4. Código completo, correto e integrado com a app final.

```js
/**
 * Validadores de exportação administrativa.
 */
import { AppError } from "../middlewares/error.middleware.js";

export const EXPORT_DATASETS = Object.freeze(["sales", "users", "ai-reports"]);
export const EXPORT_FORMATS = Object.freeze(["csv", "pdf"]);

/**
 * Valida dataset e formato de exportação.
 *
 * @function validateAdminExportRequest
 * @param {Record<string, unknown>} params - Parâmetros da rota.
 * @param {Record<string, unknown>} query - Query string.
 * @returns {{dataset: string, format: string}} Pedido normalizado.
 * @throws {AppError} Quando dataset ou formato não são suportados.
 */
export function validateAdminExportRequest(params, query) {
    const dataset = String(params?.dataset ?? "").trim();
    const format = String(query?.format ?? "csv").trim().toLowerCase();
    const errors = {};

    // A lista fechada impede que o cliente escolha nomes livres de coleções.
    if (!EXPORT_DATASETS.includes(dataset)) {
        errors.dataset = `Dataset deve ser um destes: ${EXPORT_DATASETS.join(", ")}`;
    }

    // O formato fechado evita respostas HTML/JSON inesperadas neste endpoint de ficheiros.
    if (!EXPORT_FORMATS.includes(format)) {
        errors.format = `Formato deve ser um destes: ${EXPORT_FORMATS.join(", ")}`;
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Pedido de exportação inválido", errors);
    }

    return { dataset, format };
}
```

5. Explicação do código.

O validator normaliza strings recebidas por route params e query string. Se o dataset ou formato não estiverem nas listas autorizadas, lança `AppError` com `400`. O import de `AppError` é obrigatório porque este ficheiro é completo e deve compilar sem adivinhação.

6. Validação do passo.

Chama `/api/admin/exports/unknown?format=pdf` e espera `400`. Chama `/api/admin/exports/sales?format=html` e espera `400`.

7. Cenário negativo/erro esperado.

Um pedido para `dataset=users&format=html` nunca deve devolver conteúdo renderizável pelo browser.

### Passo 3 - Gerar CSV/PDF a partir de datasets minimizados

1. Objetivo funcional do passo no contexto da app.

Construir o ficheiro de exportação sem dependência nova e sem expor campos sensíveis.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/admin-export.service.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o service pelo conteúdo abaixo. A diferença crítica face à base anterior é o filtro `FaceReport.find({ privacyStatus: "active" })` para relatórios IA.

4. Código completo, correto e integrado com a app final.

```js
/**
 * Service de exportações administrativas minimizadas.
 */
import { FaceReport } from "../models/face-report.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";

/**
 * Escapa valor CSV para manter compatibilidade com Excel.
 *
 * @function escapeCsv
 * @param {unknown} value - Valor a serializar.
 * @returns {string} Campo CSV seguro.
 */
function escapeCsv(value) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
}

/**
 * Constrói CSV a partir de linhas simples.
 *
 * @function buildCsvText
 * @param {string[]} headers - Cabeçalhos.
 * @param {Array<Record<string, unknown>>} rows - Linhas.
 * @returns {string} Conteúdo CSV.
 */
function buildCsvText(headers, rows) {
    return [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
    ].join("\n");
}

/**
 * Constrói CSV descarregável a partir de linhas simples.
 *
 * @function buildCsv
 * @param {string[]} headers - Cabeçalhos.
 * @param {Array<Record<string, unknown>>} rows - Linhas.
 * @returns {Buffer} Conteúdo CSV em UTF-8 com BOM para Excel.
 */
export function buildCsv(headers, rows) {
    return Buffer.from(`\uFEFF${buildCsvText(headers, rows)}`, "utf8");
}

/**
 * Constrói um PDF textual mínimo sem dependências externas.
 *
 * @function buildSimplePdf
 * @param {string} title - Título do documento.
 * @param {string} body - Conteúdo textual minimizado.
 * @returns {Buffer} Representação PDF simples.
 */
export function buildSimplePdf(title, body) {
    const text = `${title}\n\n${body}`.replace(/[()\\]/g, "");

    // A sanitização remove caracteres que quebram a string simples do PDF.
    // O limite reduz risco de gerar ficheiros enormes a partir de dados administrativos.
    const stream = `BT /F1 12 Tf 72 720 Td (${text.slice(0, 1200)}) Tj ET`;
    const pdf = `%PDF-1.1
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream
${stream}
endstream endobj
xref
0 5
0000000000 65535 f
trailer << /Root 1 0 R >>
%%EOF`;

    return Buffer.from(pdf, "utf8");
}

/**
 * Lê dados minimizados do dataset pedido.
 *
 * @async
 * @function getDatasetRows
 * @param {string} dataset - Dataset canónico.
 * @returns {Promise<{headers: string[], rows: object[]}>} Dados exportáveis.
 */
async function getDatasetRows(dataset) {
    if (dataset === "sales") {
        const orders = await Order.find({}).sort({ createdAt: -1 }).limit(200);

        return {
            headers: ["id", "totalCents", "status", "paymentStatus", "createdAt"],
            rows: orders.map((order) => ({
                id: order._id.toString(),
                totalCents: order.totalCents,
                status: order.status,
                paymentStatus: order.payment?.status,
                createdAt: order.createdAt?.toISOString?.() ?? "",
            })),
        };
    }

    if (dataset === "users") {
        const users = await User.find({})
            .select("email role isActive accountStatus createdAt")
            .sort({ createdAt: -1 })
            .limit(200);

        // A projeção exclui passwordHash e qualquer outro segredo da conta.
        return {
            headers: ["id", "email", "role", "isActive", "accountStatus", "createdAt"],
            rows: users.map((user) => ({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                accountStatus: user.accountStatus ?? "active",
                createdAt: user.createdAt?.toISOString?.() ?? "",
            })),
        };
    }

    const reports = await FaceReport.find({ privacyStatus: "active" })
        .select("userId analysisId cosmeticSummary sources limitations createdAt")
        .sort({ createdAt: -1 })
        .limit(100);

    // Relatórios apagados ou anonimizados ficam fora da exportação administrativa.
    return {
        headers: ["id", "userId", "analysisId", "summary", "sources", "limitations", "createdAt"],
        rows: reports.map((report) => ({
            id: report._id.toString(),
            userId: report.userId.toString(),
            analysisId: report.analysisId.toString(),
            summary: report.cosmeticSummary,
            sources: (report.sources ?? []).join("; "),
            limitations: (report.limitations ?? []).join("; "),
            createdAt: report.createdAt?.toISOString?.() ?? "",
        })),
    };
}

/**
 * Gera uma exportação administrativa minimizada.
 *
 * @async
 * @function buildAdminExport
 * @param {{dataset: string, format: string}} input - Pedido validado.
 * @returns {Promise<{filename: string, contentType: string, buffer: Buffer, rowCount: number}>} Exportação descarregável.
 */
export async function buildAdminExport({ dataset, format }) {
    const { headers, rows } = await getDatasetRows(dataset);
    const csvText = buildCsvText(headers, rows);

    if (format === "pdf") {
        return {
            filename: `${dataset}.pdf`,
            contentType: "application/pdf",
            buffer: buildSimplePdf(`Orelle ${dataset}`, csvText),
            rowCount: rows.length,
        };
    }

    return {
        filename: `${dataset}.csv`,
        contentType: "text/csv; charset=utf-8",
        buffer: buildCsv(headers, rows),
        rowCount: rows.length,
    };
}
```

5. Explicação do código.

O service mantém CSV e PDF no mesmo contrato. A exportação de utilizadores usa `select` para evitar `passwordHash`. A exportação de relatórios IA usa `privacyStatus: "active"` para respeitar eliminação/anonimização. O PDF é simples, mas suficiente para o requisito porque a parte mais importante é controlar dados, role e headers.

6. Validação do passo.

Cria um teste para `buildAdminExport({ dataset: "ai-reports", format: "pdf" })` e confirma que `FaceReport.find` é chamado com `{ privacyStatus: "active" }`.

7. Cenário negativo/erro esperado.

Um relatório com `privacyStatus: "deleted"` ou `privacyStatus: "anonymized"` não pode entrar no ficheiro exportado.

### Passo 4 - Devolver ficheiro por controller e rota protegida

1. Objetivo funcional do passo no contexto da app.

Enviar o PDF como download autenticado, com headers seguros e acesso apenas para administradores.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/controllers/admin-export.controller.js`
    - EDITAR: `apps/api/src/routes/admin-export.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.

3. Instruções do que fazer.

Mantém o controller pequeno: valida input, chama service, define headers e devolve o buffer. A rota deve continuar montada em `/api/admin` pelo `app.js`, logo o path local é `/exports/:dataset`.

4. Código completo, correto e integrado com a app final.

```js
/**
 * Controllers de exportação administrativa.
 */
import { buildAdminExport } from "../services/admin-export.service.js";
import { validateAdminExportRequest } from "../validators/admin-export.validator.js";

/**
 * Gera exportação minimizada para admin.
 *
 * @async
 * @function exportAdminDatasetController
 */
export async function exportAdminDatasetController(req, res, next) {
    try {
        const input = validateAdminExportRequest(req.params, req.query);
        const exportResult = await buildAdminExport(input);

        // Os headers dizem ao browser que a resposta é um ficheiro para descarregar.
        res.setHeader("Content-Type", exportResult.contentType);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${exportResult.filename}"`,
        );
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Orelle-Export-Rows", String(exportResult.rowCount));

        return res.status(200).send(exportResult.buffer);
    } catch (err) {
        return next(err);
    }
}
```

```js
/**
 * Rotas de exportação administrativa.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { exportAdminDatasetController } from "../controllers/admin-export.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

export const adminExportRoutes = Router();

adminExportRoutes.get(
    // A exportação agregada pode conter dados pessoais minimizados, por isso exige ADMIN.
    "/exports/:dataset",
    requireAuth,
    requireRole(ROLES.ADMIN),
    exportAdminDatasetController,
);
```

5. Explicação do código.

`Content-Type` permite identificar PDF ou CSV. `Content-Disposition` força download. `nosniff` reduz risco de interpretação errada pelo browser. `X-Orelle-Export-Rows` dá evidence operacional sem expor conteúdo do ficheiro. `requireAuth` e `requireRole(ROLES.ADMIN)` bloqueiam visitantes e clientes.

6. Validação do passo.

Com sessão admin, pede `/api/admin/exports/ai-reports?format=pdf` e confirma `200`, `application/pdf`, `attachment; filename="ai-reports.pdf"` e `X-Content-Type-Options: nosniff`.

7. Cenário negativo/erro esperado.

Um cliente autenticado sem role admin deve receber `403`. Um visitante sem sessão deve receber `401`.

### Passo 5 - Descarregar PDF no frontend sem expor conteúdo

1. Objetivo funcional do passo no contexto da app.

Permitir que o administrador descarregue PDF/CSV sem imprimir dados exportados no DOM.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/pages/AdminExportsPage.jsx`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui a página pelo conteúdo abaixo. Usa `apiDownload`, `response.blob()` e link temporário.

4. Código completo, correto e integrado com a app final.

```jsx
/**
 * Página de exportações administrativas minimizadas.
 */
import { useState } from "react";
import { apiDownload } from "../services/apiClient.js";

/**
 * Resolve o nome do ficheiro indicado pelo backend.
 *
 * @function getDownloadFilename
 * @param {string|null} contentDisposition - Header Content-Disposition.
 * @param {string} fallback - Nome local quando o header não existe.
 * @returns {string} Nome seguro para download.
 */
function getDownloadFilename(contentDisposition, fallback) {
    const utf8Match = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i);
    const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
    const encodedFilename = utf8Match?.[1] ?? filenameMatch?.[1];

    if (!encodedFilename) return fallback;

    return decodeURIComponent(encodedFilename);
}

/**
 * Descarrega um Blob no browser sem expor o conteúdo no DOM.
 *
 * @function downloadBlob
 * @param {Blob} blob - Conteúdo binário recebido da API.
 * @param {string} filename - Nome do ficheiro.
 * @returns {void}
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Gera exportações CSV/PDF como ficheiros descarregáveis.
 *
 * @function AdminExportsPage
 * @returns {JSX.Element} UI admin de exportações.
 */
export function AdminExportsPage() {
    const [dataset, setDataset] = useState("sales");
    const [format, setFormat] = useState("csv");
    const [exportResult, setExportResult] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function generateExport(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const response = await apiDownload(
                `/admin/exports/${dataset}?format=${format}`,
            );
            const blob = await response.blob();
            const filename = getDownloadFilename(
                response.headers.get("content-disposition"),
                `${dataset}.${format}`,
            );

            // A UI descarrega o ficheiro e mostra apenas metadados seguros.
            downloadBlob(blob, filename);
            setExportResult({
                filename,
                contentType: response.headers.get("content-type") ?? "",
                rowCount: response.headers.get("x-orelle-export-rows") ?? "0",
            });
            setStatus("success");
        } catch (err) {
            // O erro visível vem da API, mas o conteúdo exportado nunca é renderizado.
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Exportações</h1>
            <form onSubmit={generateExport}>
                <label>
                    Dataset
                    <select value={dataset} onChange={(event) => setDataset(event.target.value)}>
                        <option value="sales">Vendas</option>
                        <option value="users">Utilizadores</option>
                        <option value="ai-reports">Relatórios IA</option>
                    </select>
                </label>
                <label>
                    Formato
                    <select value={format} onChange={(event) => setFormat(event.target.value)}>
                        <option value="csv">CSV</option>
                        <option value="pdf">PDF</option>
                    </select>
                </label>
                <button type="submit" disabled={status === "loading"}>
                    Gerar exportação
                </button>
            </form>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && exportResult && (
                <article>
                    <h2>{exportResult.filename}</h2>
                    <p>
                        {exportResult.contentType} · {exportResult.rowCount} linhas
                    </p>
                </article>
            )}
        </section>
    );
}
```

5. Explicação do código.

`apiDownload` mantém cookies de sessão. `response.blob()` trata o ficheiro como binário. O link temporário inicia o download e é removido logo de seguida. A página só mostra nome, tipo e número de linhas, não o conteúdo do PDF.

6. Validação do passo.

Gera PDF de `ai-reports` e confirma que o ficheiro descarrega com extensão `.pdf`.

7. Cenário negativo/erro esperado.

Se a sessão expirar, a API devolve erro e a UI mostra uma mensagem controlada sem imprimir dados exportados.

### Passo 6 - Criar prova automática de PDF, autorização e privacidade

1. Objetivo funcional do passo no contexto da app.

Provar que a exportação PDF existe, que só admin consegue descarregar e que relatórios não ativos ficam excluídos.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf7.admin-export-pdf.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Os testes usam os padrões já existentes da app: `vitest`, `supertest`, `createApp()` e cookie de sessão.

4. Código completo, correto e integrado com a app final.

```js
/**
 * Testes do BK-MF7-05 / RNF16.
 *
 * Validam exportação PDF minimizada, headers, autorização e filtro de privacidade.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { Order } from "../src/models/order.model.js";
import { User } from "../src/models/user.model.js";
import {
    buildAdminExport,
    buildSimplePdf,
} from "../src/services/admin-export.service.js";
import { createSessionToken } from "../src/services/session.service.js";
import { validateAdminExportRequest } from "../src/validators/admin-export.validator.js";

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: {
        find: vi.fn(),
    },
}));

vi.mock("../src/models/order.model.js", () => ({
    Order: {
        find: vi.fn(),
    },
}));

vi.mock("../src/models/user.model.js", () => ({
    User: {
        find: vi.fn(),
    },
}));

/**
 * Cria um identificador mínimo com a interface usada nos DTOs.
 *
 * @function objectId
 * @param {string} value - Valor textual do identificador.
 * @returns {{toString: Function}} Objeto compatível com `toString`.
 */
function objectId(value) {
    return {
        toString() {
            return value;
        },
    };
}

/**
 * Simula uma query Mongoose com `sort().limit()`.
 *
 * @function queryWithSortLimit
 * @param {unknown[]} rows - Linhas a devolver.
 * @returns {{sort: Function}} Query simulada.
 */
function queryWithSortLimit(rows) {
    return {
        sort: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve(rows)),
        })),
    };
}

/**
 * Simula uma query Mongoose com `select().sort().limit()`.
 *
 * @function queryWithSelectSortLimit
 * @param {unknown[]} rows - Linhas a devolver.
 * @returns {{select: Function}} Query simulada.
 */
function queryWithSelectSortLimit(rows) {
    return {
        select: vi.fn(() => ({
            sort: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve(rows)),
            })),
        })),
    };
}

function createAdminCookie() {
    const token = createSessionToken({
        id: "admin-1",
        email: "admin@orelle.test",
        role: ROLES.ADMIN,
    });

    return `orelle_session=${token}`;
}

describe("BK-MF7-05 / RNF16 - exportação PDF", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("gera um buffer PDF mínimo", () => {
        const pdf = buildSimplePdf("Orelle", "relatório minimizado");

        expect(pdf.toString("utf8").startsWith("%PDF")).toBe(true);
    });

    it("recusa formato inválido antes de consultar dados", () => {
        expect(() =>
            validateAdminExportRequest({ dataset: "sales" }, { format: "html" }),
        ).toThrow("Pedido de exportação inválido");
    });

    it("gera PDF de relatórios IA apenas com privacyStatus active", async () => {
        FaceReport.find.mockReturnValueOnce(
            queryWithSelectSortLimit([
                {
                    _id: objectId("report-1"),
                    userId: objectId("user-1"),
                    analysisId: objectId("analysis-1"),
                    cosmeticSummary: "Tom uniforme.",
                    sources: ["analysis"],
                    limitations: ["Sem diagnóstico médico."],
                    createdAt: new Date("2026-06-26T10:00:00.000Z"),
                },
            ]),
        );

        const result = await buildAdminExport({
            dataset: "ai-reports",
            format: "pdf",
        });

        // A chamada ao modelo prova que relatórios apagados/anonimizados não entram.
        expect(FaceReport.find).toHaveBeenCalledWith({ privacyStatus: "active" });
        expect(result.filename).toBe("ai-reports.pdf");
        expect(result.contentType).toBe("application/pdf");
        expect(result.buffer.toString("utf8")).toContain("%PDF");
        expect(result.rowCount).toBe(1);
    });

    it("devolve PDF com headers seguros para admin", async () => {
        User.find.mockReturnValueOnce(
            queryWithSelectSortLimit([
                {
                    _id: objectId("user-1"),
                    email: "cliente@orelle.test",
                    role: ROLES.CLIENTE,
                    isActive: true,
                    accountStatus: "active",
                    createdAt: new Date("2026-06-26T10:00:00.000Z"),
                },
            ]),
        );

        const response = await request(createApp())
            .get("/api/admin/exports/users?format=pdf")
            .set("Cookie", [createAdminCookie()]);

        // A prova HTTP cobre o contrato que o browser vai receber no download.
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("application/pdf");
        expect(response.headers["content-disposition"]).toBe(
            'attachment; filename="users.pdf"',
        );
        expect(response.headers["x-content-type-options"]).toBe("nosniff");
        expect(response.headers["x-orelle-export-rows"]).toBe("1");
    });

    it("bloqueia cliente autenticado em exportação admin", async () => {
        const token = createSessionToken({
            id: "cliente-1",
            email: "cliente@orelle.test",
            role: ROLES.CLIENTE,
        });

        const response = await request(createApp())
            .get("/api/admin/exports/users?format=pdf")
            .set("Cookie", [`orelle_session=${token}`]);

        expect(response.status).toBe(403);
        expect(User.find).not.toHaveBeenCalled();
    });

    it("bloqueia visitante sem sessão", async () => {
        const response = await request(createApp()).get(
            "/api/admin/exports/users?format=pdf",
        );

        expect(response.status).toBe(401);
        expect(User.find).not.toHaveBeenCalled();
    });

    it("recusa dataset desconhecido por HTTP", async () => {
        const response = await request(createApp())
            .get("/api/admin/exports/secrets?format=pdf")
            .set("Cookie", [createAdminCookie()]);

        expect(response.status).toBe(400);
        expect(Order.find).not.toHaveBeenCalled();
        expect(User.find).not.toHaveBeenCalled();
        expect(FaceReport.find).not.toHaveBeenCalled();
    });
});
```

5. Explicação do código.

Os primeiros testes validam builder e validator. O teste do service prova o filtro `privacyStatus: "active"`. Os testes HTTP provam headers e autorização. As consultas simuladas permitem testar a camada sem precisar de dados reais e sem abrir ligação a MongoDB.

6. Validação do passo.

Executa `npm --prefix apps/api test` e confirma que os testes novos passam juntamente com a suite existente.

7. Cenário negativo/erro esperado.

Cliente sem role admin recebe `403`, visitante recebe `401` e dataset desconhecido recebe `400` antes de consultar modelos.

### Passo 7 - Fechar evidence por camada e negativos

1. Objetivo funcional do passo no contexto da app.

Garantir que o BK fica defensável: contrato lido, código aplicado, testes executados e negativos registados.

2. Ficheiros envolvidos:
    - REVER: `apps/api/tests/mf7.admin-export-pdf.test.js`
    - REVER: `apps/api/src/services/admin-export.service.js`
    - REVER: `apps/api/src/controllers/admin-export.controller.js`
    - REVER: `apps/web/src/pages/AdminExportsPage.jsx`

3. Instruções do que fazer.

Regista no PR ou na defesa os comandos executados, os headers observados e os negativos concluídos. Executar cenários negativos obrigatórios (mínimo 2): cliente autenticado sem admin e visitante sem sessão.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. A implementação já ficou completa nos passos anteriores.

5. Explicação do código.

Sem código. Este passo transforma os testes e comandos em evidence verificável para defesa.

6. Validação do passo.

Executa `npm --prefix apps/api test`, `npm --prefix apps/web run build` e `bash scripts/validate-planificacao.sh`.

7. Cenário negativo/erro esperado.

Se `ai-reports.pdf` incluir relatório anonimizado ou apagado, o BK deve voltar a `CRITICO` porque viola direitos de privacidade.

#### Expected results

- Admin descarrega `sales.pdf`, `users.pdf` e `ai-reports.pdf` com `200`.
- Cliente autenticado sem role admin recebe `403`.
- Visitante sem sessão recebe `401`.
- Dataset inválido devolve `400`.
- Formato inválido devolve `400`.
- `ai-reports` consulta apenas `FaceReport.find({ privacyStatus: "active" })`.
- PDF não inclui fotografia, path interno, token, cookie, `passwordHash` ou relatório completo.

#### Critérios de aceite

- `RNF16` coberto por PDF descarregável.
- `RF35` preservado no módulo `admin-export`.
- Exportação protegida por role admin.
- Campos sensíveis excluídos por projeção e mapeamento explícito.
- Relatórios IA filtrados por `privacyStatus: "active"`.
- Sem dependência nova de PDF.
- Headers de download e `nosniff` verificados.
- Cenários negativos concluídos: mínimo `2`.
- Matriz mínima de testes por prioridade documentada abaixo; etiqueta de validação legada preservada como texto: `### Matriz mínima de testes por prioridade`.
- Evidência de testes por camada documentada abaixo.

Matriz mínima de testes por prioridade:

| Prioridade | Teste obrigatório | Evidence esperada |
| --- | --- | --- |
| P1 | PDF gerado por `buildSimplePdf` | Buffer começa por `%PDF` |
| P1 | Admin descarrega PDF | `200`, `application/pdf`, `Content-Disposition`, `nosniff` |
| P1 | Cliente sem admin bloqueado | `403` |
| P1 | Visitante bloqueado | `401` |
| P1 | Dataset/formato inválido bloqueado | `400` antes de consultar modelos |
| P1 | Relatórios IA filtrados | `FaceReport.find({ privacyStatus: "active" })` |

Evidência de testes por camada:

| Camada | Evidence |
| --- | --- |
| Validator | `validateAdminExportRequest` recusa formato e dataset inválidos |
| Service | `buildAdminExport` devolve PDF e filtra `privacyStatus` |
| Controller/route | Headers e role admin validados com `supertest` |
| Frontend | `apiDownload`, `Blob` e link temporário sem renderizar conteúdo |
| Documental | `bash scripts/validate-planificacao.sh` executado e resultado registado |

#### Validação final

- [ ] `rg -n "BK-MF4-03|RF35|RNF16|admin-export|AdminExportsPage|privacyStatus" docs/planificacao/guias-bk/MF7/BK-MF7-05-exportacao-de-relatorios-em-pdf.md`
- [ ] Pesquisa estática dos termos proibidos definidos na prompt ativa contra este BK, com resultado vazio exceto metadados canónicos.
- [ ] `rg -n "buildSimplePdf|application/pdf|Content-Disposition|X-Orelle-Export-Rows|privacyStatus" apps/api/src apps/api/tests`
- [ ] `npm --prefix apps/api test`
- [ ] `npm --prefix apps/web run build`
- [ ] `bash scripts/validate-planificacao.sh`
- [ ] Negativos: mínimo `2` cenários com `401`/`403` ou `400`.

#### Evidence para PR/defesa

- Output de `npm --prefix apps/api test`.
- Output de `npm --prefix apps/web run build`.
- Headers do endpoint PDF.
- Evidence de `FaceReport.find({ privacyStatus: "active" })`.
- Screenshot ou gravação curta do download no browser.
- Negativo de visitante sem sessão.
- Negativo de cliente sem role admin.

#### Handoff

O `BK-MF7-06` deve manter a mesma disciplina: backend decide preço, stock e pagamento; frontend apenas inicia ação explícita do utilizador. Nenhum dado sensível deve ser colocado em query string, DOM ou ficheiro descarregado fora de uma autorização server-side.

#### Changelog

- 2026-06-26: Guia reforçado para `RNF16`, preservando `RF35`/`BK-MF4-03`, adicionando filtro `privacyStatus`, headers, testes HTTP, matriz mínima e evidence por camada.
