# BK-MF7-04 - Compatível com Chrome, Safari, Edge e Firefox

## Header
- `doc_id`: `GUIA-BK-MF7-04`
- `bk_id`: `BK-MF7-04`
- `macro`: `MF7`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF15`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF7-05`
- `guia_path`: `docs/planificacao/guias-bk/MF7/BK-MF7-04-compativel-com-chrome-safari-edge-e-firefox.md`
- `last_updated`: `2026-06-26`

#### Objetivo

Neste BK vais criar uma validação de compatibilidade para os browsers alvo: Chrome, Safari, Edge e Firefox. O objetivo é reduzir código dependente de browser, garantir build Vite estável e produzir evidence de que os fluxos principais podem ser testados em browsers modernos.

`CANONICO`: `RNF15` exige compatibilidade com Chrome, Safari, Edge e Firefox.

#### Importância

A Orélle usa formulários, upload de fotografias, downloads, checkout e componentes React. Pequenas diferenças entre browsers podem partir upload, estilos, cookies ou downloads. Compatibilidade não é prometer pixel-perfect: é evitar APIs frágeis, validar build e executar smoke manual orientado.

#### Scope-in

- Rever `vite.config.js`.
- Criar script local de compatibilidade sem dependências novas.
- Validar ausência de ramificações por browser em `src`.
- Validar build de produção.
- Definir checklist manual para Chrome, Safari, Edge e Firefox.
- Confirmar que upload, sessão, pedidos de privacidade e checkout não dependem de browser específico.

#### Scope-out

- Não adicionar Playwright, Cypress ou Selenium.
- Não criar estilos diferentes por browser.
- Não prometer suporte a browsers antigos fora de `RNF15`.
- Não alterar contratos backend.

#### Estado antes e depois

- Antes: a app compila com Vite, mas o guia não explica como provar compatibilidade transversal.
- Depois: existe validação estática, build e checklist de fluxos críticos para browsers modernos.

#### Pre-requisitos

- `BK-MF5-05`: interface responsiva.
- `BK-MF5-07`: feedback acessível em formulários.
- `BK-MF6-02`: páginas principais com carga aceitável.
- `BK-MF7-03`: cookies e cliente API consistentes.

#### Glossário

- Compatibilidade: a funcionalidade principal comporta-se de forma equivalente nos browsers alvo.
- Build de produção: versão gerada por Vite em `dist`.
- Smoke manual: validação curta de fluxos essenciais.
- Feature detection: verificar capacidade da plataforma em vez de assumir browser por nome.
- Browser-specific branch: código que escolhe comportamento por nome de browser.

#### Conceitos teóricos essenciais

React e Vite resolvem grande parte da compatibilidade, mas não protegem contra decisões frágeis no código da app. Evita branches baseadas em browser, usa APIs Web modernas suportadas e mantém mensagens de erro controladas.

Upload, downloads e cookies são os pontos mais sensíveis. Upload usa `FormData`, download usa `Blob` e link temporário, sessão usa cookies HttpOnly enviados por `fetch` com credenciais.

Compatibilidade deve ser provada por build automático e por checklist manual dos quatro browsers, porque Safari e Firefox podem comportar downloads e cookies de forma ligeiramente diferente em desenvolvimento local.

`DERIVADO`: prefixos CSS como `-webkit-font-smoothing` podem existir como compatibilidade visual. O que este BK bloqueia são decisões de JavaScript que mudam comportamento por nome de browser, como `navigator.userAgent`, `navigator.vendor`, `document.all` ou `document.documentMode`.

#### Arquitetura do BK

- Configuração: `apps/web/vite.config.js`.
- Script: `apps/web/scripts/check-mf7-browser-compatibility.mjs`.
- Cliente API: `apps/web/src/services/apiClient.js`.
- Páginas críticas: login, upload facial, pedido de privacidade, exportações, checkout.
- Evidence: output do script, output do build e checklist manual.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/web/scripts/check-mf7-browser-compatibility.mjs`
- EDITAR: `apps/web/package.json`
- REVER: `apps/web/vite.config.js`
- REVER: `apps/web/src/services/apiClient.js`
- REVER: `apps/web/src/pages/FacePhotoUploadPage.jsx`
- REVER: `apps/web/src/pages/AdminExportsPage.jsx`
- REVER: `apps/web/src/pages/CheckoutPage.jsx`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato de compatibilidade

1. Objetivo funcional do passo no contexto da app.

Garantir que `RNF15` fala de browsers modernos alvo, não de suporte universal.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: `RNF15`, `BK-MF7-04`.

3. Instruções do que fazer.

Regista os quatro browsers alvo no PR e associa-os aos fluxos que vais validar.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. É definição de critério de sucesso.

5. Explicação do código.

Sem código. Compatibilidade precisa de uma lista fechada para o aluno saber o que validar.

6. Validação do passo.

Executa `rg -n "RNF15|Chrome|Safari|Edge|Firefox" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`.

7. Cenário negativo/erro esperado.

Declarar “funciona em todos os browsers” é demasiado vago e não é validável.

### Passo 2 - Rever configuração Vite

1. Objetivo funcional do passo no contexto da app.

Confirmar que o frontend usa build moderno e plugin React oficial.

2. Ficheiros envolvidos:
    - REVER: `apps/web/vite.config.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Mantém a configuração simples.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/vite.config.js
/**
 * Configuração Vite do frontend Orélle.
 *
 * O plugin React garante transformação JSX consistente em desenvolvimento e build.
 */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
});
```

5. Explicação do código.

O Vite já usa defaults modernos adequados ao projeto. Não é preciso adicionar dependências ou polyfills sem prova de falha. O plugin React trata JSX de forma consistente.

6. Validação do passo.

Executa `npm --prefix apps/web run build`.

7. Cenário negativo/erro esperado.

Se o build falhar, não avances para checklist manual; primeiro corrige imports ou sintaxe.

### Passo 3 - Criar verificação estática de compatibilidade

1. Objetivo funcional do passo no contexto da app.

Detetar código frágil antes do build.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/scripts/check-mf7-browser-compatibility.mjs`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o script abaixo e mantém a lista de padrões curta e objetiva.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/scripts/check-mf7-browser-compatibility.mjs
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = path.join(WEB_ROOT, "src");
const SOURCE_EXTENSIONS = new Set([".js", ".jsx"]);
const BLOCKED_PATTERNS = [
    { label: "browser-name-branch:userAgent", pattern: /navigator\.userAgent/i },
    { label: "browser-name-branch:vendor", pattern: /navigator\.vendor/i },
    { label: "legacy-ie-branch:document-all", pattern: /document\.all/i },
    { label: "legacy-ie-branch:document-mode", pattern: /document\.documentMode/i },
];

/**
 * Indica se um ficheiro deve ser analisado pelo smoke de compatibilidade.
 *
 * @function isSourceFile
 * @param {string} filename - Nome do ficheiro encontrado dentro de `src`.
 * @returns {boolean} `true` para JavaScript/JSX da app, `false` para CSS/assets.
 */
function isSourceFile(filename) {
    // Prefixos CSS legítimos não são branches por browser; por isso o smoke analisa JS/JSX.
    return SOURCE_EXTENSIONS.has(path.extname(filename));
}

/**
 * Lista recursivamente os ficheiros JavaScript/JSX do frontend.
 *
 * @function listSourceFiles
 * @param {string} dir - Diretoria inicial a percorrer.
 * @returns {Promise<string[]>} Caminhos absolutos dos ficheiros analisáveis.
 */
async function listSourceFiles(dir) {
    const entries = await readdir(dir);
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const info = await stat(fullPath);

        if (info.isDirectory()) {
            files.push(...(await listSourceFiles(fullPath)));
        } else if (isSourceFile(entry)) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Procura decisões frágeis que escolhem comportamento pelo nome do browser.
 *
 * @function findBrowserBranches
 * @param {string[]} files - Ficheiros JavaScript/JSX a analisar.
 * @returns {Promise<string[]>} Lista de findings com caminho relativo e regra violada.
 */
async function findBrowserBranches(files) {
    const findings = [];

    for (const file of files) {
        const content = await readFile(file, "utf8");
        for (const rule of BLOCKED_PATTERNS) {
            if (rule.pattern.test(content)) {
                // O caminho relativo deixa o erro acionável para o aluno sem expor paths internos da máquina.
                findings.push(`${path.relative(WEB_ROOT, file)}: ${rule.label}`);
            }
        }
    }

    return findings;
}

/**
 * Executa o smoke de compatibilidade do BK-MF7-04.
 *
 * @function main
 * @returns {Promise<void>} Termina com exit code `0` quando não há branches por browser.
 */
async function main() {
    const files = await listSourceFiles(SRC_DIR);
    const findings = await findBrowserBranches(files);

    if (findings.length > 0) {
        // Falhar cedo evita soluções específicas para um browser sem necessidade real.
        console.error(findings.join("\n"));
        process.exit(1);
    }

    console.log(`MF7 browser compatibility static check OK (${files.length} ficheiros).`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
```

5. Explicação do código.

O script encontra a raiz `apps/web` a partir do próprio ficheiro, por isso funciona tanto quando é executado pelo `npm --prefix apps/web` como quando é executado dentro de `apps/web`. Depois percorre apenas ficheiros `.js` e `.jsx` em `src`, lê o conteúdo e falha se encontrar decisões por nome de browser. Isto força a equipa a resolver problemas com APIs standard, CSS responsivo e build, em vez de criar caminhos diferentes para cada browser.

O script não reprova prefixos CSS como `-webkit-font-smoothing`, porque esses prefixos são compatibilidade visual e não mudam regras de negócio, sessão, upload, download ou checkout.

6. Validação do passo.

Dentro de `apps/web`, executa `node scripts/check-mf7-browser-compatibility.mjs`. A partir da raiz do repositório, usa `npm --prefix apps/web run smoke:mf7-compat` depois de ligares o script no passo seguinte.

7. Cenário negativo/erro esperado.

Se alguém introduzir `navigator.userAgent` para tratar Safari manualmente, o script deve falhar.

### Passo 4 - Ligar script ao package.json

1. Objetivo funcional do passo no contexto da app.

Permitir execução repetível da verificação.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/package.json`
    - LOCALIZAÇÃO: objeto `scripts`.

3. Instruções do que fazer.

Adiciona o script sem remover os existentes.

4. Código completo, correto e integrado com a app final.

```json
{
    "name": "orelle-web",
    "version": "0.1.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "vite --host 127.0.0.1",
        "build": "vite build",
        "preview": "vite preview",
        "smoke:mf2": "node scripts/smoke-mf2-recommendations.mjs",
        "smoke:mf5-privacy-request": "node scripts/check-mf5-biometric-request-client.mjs",
        "smoke:mf5-feedback": "node scripts/check-mf5-feedback.mjs",
        "smoke:mf5-theme": "node scripts/check-mf5-theme.mjs",
        "smoke:mf7-compat": "node scripts/check-mf7-browser-compatibility.mjs"
    },
    "dependencies": { "@vitejs/plugin-react": "^4.3.1", "vite": "^5.3.5", "react": "^18.3.1", "react-dom": "^18.3.1" }
}
```

5. Explicação do código.

O comando permite repetir a verificação antes da defesa. Mantém `build` separado porque compatibilidade precisa de duas provas: estática e build real.

6. Validação do passo.

Executa `npm --prefix apps/web run smoke:mf7-compat`.

7. Cenário negativo/erro esperado.

Se substituíres todos os scripts do `package.json`, vais apagar comandos já usados por MFs anteriores.

### Passo 5 - Rever fluxos web sensíveis

1. Objetivo funcional do passo no contexto da app.

Confirmar que os pontos críticos usam APIs Web standard.

2. Ficheiros envolvidos:
    - REVER: `apps/web/src/pages/FacePhotoUploadPage.jsx`
    - REVER: `apps/web/src/pages/AdminExportsPage.jsx`
    - REVER: `apps/web/src/pages/CheckoutPage.jsx`
    - LOCALIZAÇÃO: submit de upload, download de exportação e checkout.

3. Instruções do que fazer.

Confirma que upload usa `FormData`, downloads usam `Blob` e checkout usa link normal quando há `checkoutUrl`.

4. Código completo, correto e integrado com a app final.

```jsx
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

    // Revogar o URL temporário evita acumular memória após vários downloads.
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
```

5. Explicação do código.

`Blob`, `URL.createObjectURL` e elemento `<a>` são APIs Web comuns nos browsers alvo. A função não coloca o conteúdo do PDF ou CSV no DOM e limpa o URL temporário depois do clique.

6. Validação do passo.

Faz download de CSV e PDF no browser principal de desenvolvimento e confirma que o ficheiro tem nome e extensão corretos.

7. Cenário negativo/erro esperado.

Se o download abrir texto sensível no DOM, a implementação fica insegura.

### Passo 6 - Executar build e checklist manual

1. Objetivo funcional do passo no contexto da app.

Produzir evidence objetiva e guiar teste nos browsers alvo.

2. Ficheiros envolvidos:
    - REVER: `apps/web/package.json`
    - REVER: `apps/web/dist/`
    - LOCALIZAÇÃO: output de build e checklist da defesa.

3. Instruções do que fazer.

Executa os comandos e preenche checklist manual.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix apps/web run smoke:mf7-compat
npm --prefix apps/web run build
```

5. Explicação do código.

O primeiro comando procura decisões frágeis no código. O segundo confirma que Vite consegue gerar artefactos de produção. Juntos não substituem teste manual, mas evitam fechar o BK sem prova técnica.

6. Validação do passo.

Abre a app em Chrome, Safari, Edge e Firefox e valida login, upload facial, pedido de privacidade, exportação e checkout.

7. Cenário negativo/erro esperado.

Se um browser falhar só num fluxo, regista o fluxo exato, erro observado e ficheiro provável.

### Passo 7 - Registar evidence de compatibilidade

1. Objetivo funcional do passo no contexto da app.

Deixar a prova pronta para PR e defesa.

2. Ficheiros envolvidos:
    - CRIAR: `docs/evidence/MF7/BK-MF7-04-browser-compatibility.md`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria uma evidence curta com comandos, browsers e resultados.

4. Código completo, correto e integrado com a app final.

```md
<!-- A evidence separa browsers e fluxos para provar compatibilidade sem prometer pixel-perfect. -->
# Evidence BK-MF7-04 - Compatibilidade

## Comandos
- `npm --prefix apps/web run smoke:mf7-compat`
- `npm --prefix apps/web run build`

## Browsers testados
- Chrome: login, upload facial, pedido de privacidade, exportação, checkout.
- Safari: login, upload facial, pedido de privacidade, exportação, checkout.
- Edge: login, upload facial, pedido de privacidade, exportação, checkout.
- Firefox: login, upload facial, pedido de privacidade, exportação, checkout.

## Resultado
- Sem ramificações por nome de browser.
- Build Vite concluído.
- Fluxos críticos validados manualmente.
```

5. Explicação do código.

Este ficheiro é evidence documental. Não muda a app. Serve para mostrar, na defesa, que `RNF15` foi testado com critérios claros e não apenas assumido.

6. Validação do passo.

Confirma que o ficheiro tem resultado para os quatro browsers.

7. Cenário negativo/erro esperado.

Se um browser não foi testado, marca esse ponto como pendente em vez de declarar compatibilidade total.

#### Expected results

- `smoke:mf7-compat` passa sem findings.
- `npm --prefix apps/web run build` gera `dist`.
- Fluxos críticos funcionam nos browsers alvo.
- Não existem branches por nome de browser.
- Downloads e upload usam APIs Web standard.

#### Critérios de aceite

- Compatibilidade comprovada por script, build e checklist.
- Sem dependências novas.
- Sem caminhos específicos por browser.
- Upload, sessão, pedidos de privacidade, exportação e checkout validados.
- Evidence guardada em `docs/evidence/MF7/`.
- `### Matriz mínima de testes por prioridade`: `P0 = smoke estático + build frontend + checklist manual nos 4 browsers + mínimo 3 negativos`.
- Cenários negativos concluídos: mínimo `3`, cobrindo branch por `navigator.userAgent`, build falhado e browser não testado marcado como pendente.
- Evidência de testes por camada registada com output do smoke, output do build e checklist manual por browser.

#### Validação final

- `npm --prefix apps/web run smoke:mf7-compat`
- `npm --prefix apps/web run build`
- Checklist manual nos quatro browsers.
- `rg -n "navigator\\.userAgent|navigator\\.vendor|document\\.all|document\\.documentMode" apps/web/src`
- Executar cenários negativos obrigatórios (mínimo 3): inserir temporariamente uma branch por `navigator.userAgent`, simular build falhado por import inválido e deixar um browser da checklist como pendente para confirmar que a evidence não declara compatibilidade total.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- Evidência de testes por camada: smoke estático, build frontend, checklist manual e registo dos negativos.

#### Evidence para PR/defesa

- Output do smoke.
- Output do build.
- Checklist manual preenchida.
- Screenshot ou nota por browser, com data e fluxo testado.

#### Handoff

O `BK-MF7-05` deve usar esta base para garantir que exportação PDF descarrega corretamente nos browsers alvo sem expor conteúdo sensível no DOM.

#### Changelog

- 2026-06-26: Guia reescrito para tutorial técnico linear, com script de compatibilidade, build, checklist manual e evidence de RNF15.
- 2026-06-26: Correção do smoke para evitar falso positivo em prefixos CSS, clarificação dos comandos por diretoria, reforço de JSDoc/comentários didáticos e validação mínima de negativos.
