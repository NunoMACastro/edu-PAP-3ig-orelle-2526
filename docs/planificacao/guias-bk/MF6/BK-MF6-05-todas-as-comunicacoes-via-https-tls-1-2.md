# BK-MF6-05 - Todas as comunicações via HTTPS (TLS 1.2+)

## Header
- `doc_id`: `GUIA-BK-MF6-05`
- `bk_id`: `BK-MF6-05`
- `macro`: `MF6`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF09`
- `fase_documental`: `Fase 3`
- `sprint`: `S10-S11`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `SUPORTE`
- `eixo_primario`: `FundacaoQualidade`
- `kpi_primario`: `taxa_incidentes_criticos`
- `kpi_secundario`: `taxa_conformidade_gates`
- `proximo_bk`: `BK-MF6-06`
- `guia_path`: `docs/planificacao/guias-bk/MF6/BK-MF6-05-todas-as-comunicacoes-via-https-tls-1-2.md`
- `last_updated`: `2026-07-10`

> **Contrato vigente:** `X-Forwarded-Proto` só pode influenciar `req.secure` quando o socket remoto pertence à allowlist explícita `TRUSTED_PROXY_CIDRS`. O arranque recusa `true`, `1`, `*`, IPs e CIDRs inválidos; sem allowlist, `trust proxy=false`. O middleware lê apenas `req.secure`, nunca o header bruto. Liveness e readiness usam `/api/health/live` e `/api/health/ready`.

#### Objetivo

Neste BK vais preparar a API e o frontend da Orélle para exigir comunicação HTTPS em ambientes publicados, cumprindo `RNF09`.

O resultado observável é uma app que aceita HTTP em desenvolvimento local, mas exige `https` quando `NODE_ENV=production`, devolve erro controlado para pedidos inseguros e usa cookies seguros em produção.

#### Importância

A Orélle processa sessão, perfil, fotografias, relatórios e checkout. Sem HTTPS, esses dados podem ser intercetados em trânsito. Este BK é suporte de qualidade e segurança para toda a aplicação.

#### Scope-in

- Criar middleware que exige HTTPS em produção.
- Configurar `trust proxy` para ambientes com reverse proxy.
- Enviar header HSTS em produção.
- Usar `/api` same-origin no bundle e proxy Vite apenas no desenvolvimento local.
- Criar testes para desenvolvimento, produção segura e produção insegura.

#### Scope-out

- Não gerar certificados TLS dentro da app.
- Não escolher fornecedor de alojamento.
- Não configurar DNS.
- Não alterar rotas funcionais.
- Não guardar segredos no repositório.

#### Estado antes e depois

- Antes: a API funciona em HTTP local e não documenta gate HTTPS para produção.
- Depois: produção exige HTTPS via proxy/plataforma, desenvolvimento continua simples e há testes para o gate.

#### Pre-requisitos

- `BK-MF0-02`: sessão com cookie HttpOnly.
- `BK-MF6-03`: timeout e health check.
- `RNF09`: HTTPS/TLS 1.2+.
- `apps/api/src/config/env.js`: ambiente centralizado.
- `apps/web/src/services/apiClient.js`: base URL do frontend.

#### Glossário

- HTTPS: HTTP protegido por TLS.
- TLS: camada criptográfica de transporte.
- Reverse proxy: componente que recebe HTTPS e encaminha para Node.
- HSTS: header que instrui o browser a preferir HTTPS no domínio.
- `x-forwarded-proto`: header interpretado pelo Express apenas quando o emissor pertence à allowlist de proxies confiáveis.
- `TRUSTED_PROXY_CIDRS`: lista explícita de IPs/CIDRs autorizados a fornecer headers de proxy.

#### Conceitos teóricos essenciais

Numa aplicação Node publicada, o certificado TLS costuma ficar numa plataforma ou proxy. A API Express deve validar que o pedido original chegou por HTTPS e deve marcar cookies como seguros em produção.

Localhost pode usar HTTP para desenvolvimento. O gate deve distinguir `development` de `production`, caso contrário os alunos bloqueiam o próprio ambiente local.

`CANONICO`: `RNF09` exige HTTPS/TLS 1.2+. `DERIVADO`: validar uma allowlist de proxies, usar `req.secure` e aplicar HSTS são decisões técnicas padrão para Express atrás de proxy.

O aluno deve perceber que a app não "inventa TLS" no controller. O código valida ambiente, proxy, cookies e URL pública; o certificado real fica fora da app, na plataforma ou reverse proxy.

Erros a evitar neste BK: obrigar HTTPS no servidor local, assumir que CORS substitui HTTPS, embutir host/porta de desenvolvimento no bundle e devolver detalhes internos quando há pedido inseguro.

#### Arquitetura do BK

- `apps/api/src/middlewares/secure-transport.middleware.js`: gate HTTPS e HSTS.
- `apps/api/src/app.js`: aplica proxy e middleware.
- `apps/web/src/services/apiClient.js`: valida base URL pública.
- `apps/api/tests/mf6.secure-transport.test.js`: cobre produção segura/insegura.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/src/middlewares/secure-transport.middleware.js`
- EDITAR: `apps/api/src/app.js`
- EDITAR: `apps/web/src/services/apiClient.js`
- CRIAR: `apps/api/tests/mf6.secure-transport.test.js`
- REVER: `apps/api/src/services/session.service.js`
- REVER: `apps/api/src/config/env.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar o contrato HTTPS da MF6

1. Objetivo funcional do passo no contexto da app.

Confirmar que `RNF09` protege comunicação em trânsito e não substitui autenticação, consentimento, ownership ou encriptação em repouso.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/guias-bk/MF6/BK-MF6-04-imagens-otimizadas-lazy-loading-e-compressao-automatica.md`
    - REVER: `docs/planificacao/guias-bk/MF6/BK-MF6-06-palavras-passe-com-hash-seguro-bcrypt.md`
    - LOCALIZAÇÃO: linhas de `RNF09`, `BK-MF6-05`, handoff de `BK-MF6-04` e pre-requisitos de `BK-MF6-06`.

3. Instruções do que fazer.

Revê os documentos antes de escrever código. Garante que o objetivo é exigir HTTPS/TLS em ambientes publicados, mantendo HTTP local para desenvolvimento e sem criar certificados dentro da aplicação.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é documental e preparatório porque uma decisão errada aqui pode bloquear `localhost`, duplicar regras de segurança ou prometer configuração TLS que pertence à plataforma de alojamento.

5. Explicação do código.

Não há código para explicar. A decisão importante é separar responsabilidades: a plataforma ou reverse proxy termina TLS; a API Express valida que o pedido original chegou por HTTPS; o frontend publicado aponta para uma URL `https://`; os BKs seguintes continuam a tratar passwords e dados guardados.

6. Validação do passo.

Confirma que `RNF09` está ligado a `BK-MF6-05`, prioridade `P0`, sprint `S10-S11` e classe `SUPORTE`.

7. Cenário negativo/erro esperado.

Se o aluno tentar resolver `RNF09` apenas com CORS ou cookies, a solução deve ser rejeitada porque CORS não encripta tráfego.

### Passo 2 - Rever ambiente, proxy e cookies de sessão

1. Objetivo funcional do passo no contexto da app.

Preparar a aplicação para distinguir desenvolvimento local de produção publicada antes de ativar o gate HTTPS.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/config/env.js`
    - REVER: `apps/api/src/services/session.service.js`
    - REVER: `apps/api/src/app.js`
    - LOCALIZAÇÃO: export `env`, configuração de cookie e início de `createApp`.

3. Instruções do que fazer.

Confirma que `env.nodeEnv` existe, que os cookies ficam `secure` em produção e que `createApp` é o ponto único onde middlewares globais entram.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é de revisão porque o código existente de ambiente e sessão deve ser preservado; o BK só vai acrescentar o gate HTTPS.

5. Explicação do código.

Não há código novo. A revisão evita dois erros comuns: forçar HTTPS também em `development` e esquecer que cookies de sessão precisam de `secure: true` quando a app é publicada. `BK-MF6-06` depende deste canal seguro para que credenciais não viajem por HTTP em produção.

6. Validação do passo.

Confirma que `apps/api/src/services/session.service.js` não guarda tokens no browser e que a sessão continua baseada em cookie HttpOnly.

7. Cenário negativo/erro esperado.

Se `NODE_ENV=production` usar cookies sem flag `secure`, a sessão fica desalinhada com `RNF09` e deve ser corrigida antes de publicar.

### Passo 3 - Criar o helper que deteta pedidos seguros

1. Objetivo funcional do passo no contexto da app.

Isolar a regra que decide se o pedido original chegou por HTTPS.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/middlewares/secure-transport.middleware.js`
    - LOCALIZAÇÃO: topo do ficheiro.

3. Instruções do que fazer.

Cria o ficheiro do middleware e começa por exportar `isSecureRequest`. A função usa exclusivamente `req.secure`: HTTPS direto ativa-o pelo socket; HTTPS terminado num proxy só o ativa depois de o Express validar o emissor contra `TRUSTED_PROXY_CIDRS`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/middlewares/secure-transport.middleware.js
import { AppError } from "./error.middleware.js";

/**
 * Confirma se o pedido original chegou por HTTPS.
 *
 * @function isSecureRequest
 * @param {import("express").Request} req - Pedido HTTP recebido pela API.
 * @returns {boolean} Verdadeiro quando Express validou o transporte como HTTPS.
 */
export function isSecureRequest(req) {
    // Express só considera X-Forwarded-Proto quando o socket remoto é confiável.
    return req.secure;
}
```

5. Explicação do código.

`isSecureRequest` não cria TLS. `req.secure` cobre HTTPS direto e, quando existe proxy, só incorpora `X-Forwarded-Proto` depois da validação do endereço remoto pelo Express. Ler o header bruto permitiria a qualquer cliente fingir que usou HTTPS.

6. Validação do passo.

Num teste unitário, `isSecureRequest` deve devolver `true` apenas quando `req.secure` é verdadeiro. Num teste HTTP, um header `X-Forwarded-Proto: https` enviado por origem não confiável não pode tornar o pedido seguro.

7. Cenário negativo/erro esperado.

Um pedido HTTP direto com `X-Forwarded-Proto: https` deve continuar inseguro quando não existe proxy confiável configurado.

### Passo 4 - Criar middleware HTTPS e HSTS

1. Objetivo funcional do passo no contexto da app.

Bloquear HTTP em produção sem bloquear desenvolvimento local.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/middlewares/secure-transport.middleware.js`
    - LOCALIZAÇÃO: abaixo de `isSecureRequest`.

3. Instruções do que fazer.

Acrescenta `requireHttps(env)`. Em desenvolvimento, o middleware deixa passar. Em produção insegura, devolve erro controlado. Em produção segura, aplica HSTS.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/middlewares/secure-transport.middleware.js
import { AppError } from "./error.middleware.js";

/**
 * Confirma se o pedido original chegou por HTTPS.
 *
 * @function isSecureRequest
 * @param {import("express").Request} req - Pedido HTTP recebido pela API.
 * @returns {boolean} Verdadeiro quando Express validou o transporte como HTTPS.
 */
export function isSecureRequest(req) {
    return req.secure;
}

/**
 * Exige HTTPS em produção e aplica HSTS quando o pedido é seguro.
 *
 * @function requireHttps
 * @param {{nodeEnv: string}} env - Configuração normalizada da aplicação.
 * @returns {import("express").RequestHandler} Middleware Express.
 */
export function requireHttps(env) {
    return (req, res, next) => {
        if (env.nodeEnv !== "production") {
            return next();
        }

        if (!isSecureRequest(req)) {
            // A mensagem não revela topologia interna, nomes de proxy ou portas privadas.
            return next(new AppError(426, "HTTPS obrigatório para comunicações Orélle."));
        }

        // HSTS só é enviado depois de confirmar HTTPS para reforçar o browser em produção.
        res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
        return next();
    };
}
```

5. Explicação do código.

`requireHttps` recebe `env` para ser testável sem alterar variáveis globais. Em `development`, o aluno continua a usar `http://localhost`. Em `production`, pedidos sem HTTPS são bloqueados com `426` e mensagem segura. Quando o pedido é seguro, HSTS reduz o risco de o browser voltar a usar HTTP naquele domínio. O middleware não lê cookies, headers brutos de proxy, paths internos nem rotas funcionais.

6. Validação do passo.

Em produção simulada, um proxy pertencente à allowlist com `x-forwarded-proto: https` deve produzir `req.secure=true` e a resposta deve receber `Strict-Transport-Security`.

7. Cenário negativo/erro esperado.

Sem proxy confiável, ou com transporte efetivo HTTP, a API deve devolver `426` com a mensagem segura definida no middleware, mesmo que o cliente tente enviar `x-forwarded-proto: https`.

### Passo 5 - Aplicar o middleware na app

1. Objetivo funcional do passo no contexto da app.

Ativar validação HTTPS no ponto de entrada comum da API.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/app.js`
    - LOCALIZAÇÃO: início de `createApp`.

3. Instruções do que fazer.

Valida `TRUSTED_PROXY_CIDRS`, configura `trust proxy` com a lista explícita ou `false` e aplica `requireHttps(env)` antes das rotas. Mantém as rotas e health checks separados definidos no BK anterior.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/app.js
import mongoose from "mongoose";
import { env, parseTrustedProxyCidrs } from "./config/env.js";
import { requireHttps } from "./middlewares/secure-transport.middleware.js";

export function createApp({
    trustedProxies = env.trustedProxyCidrs,
    readinessCheck = () => mongoose.connection.readyState === 1,
} = {}) {
    const app = express();
    const validatedTrustedProxies = parseTrustedProxyCidrs(
        trustedProxies.join(","),
    );

    app.set(
        "trust proxy",
        validatedTrustedProxies.length > 0 ? validatedTrustedProxies : false,
    );
    app.use(requireHttps(env));
    app.use(cors({ origin: env.clientOrigin, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());

    app.get("/api/health/live", (req, res) => {
        res.json({ status: "ok", app: "orelle", checks: { http: "ok" } });
    });
    app.get("/api/health/ready", async (req, res) => {
        const mongoReady = await readinessCheck();
        res.status(mongoReady ? 200 : 503).json({
            status: mongoReady ? "ready" : "not_ready",
            app: "orelle",
            checks: { mongodb: mongoReady ? "ok" : "unavailable" },
        });
    });

    return app;
}
```

5. Explicação do código.

`parseTrustedProxyCidrs` recusa configurações amplas ou inválidas. O default `false` impede spoofing local; uma lista explícita permite ao Express interpretar headers apenas desses proxies. O middleware fica antes das rotas e os dois health checks mantêm responsabilidades diferentes.

6. Validação do passo.

Liveness local continua a funcionar com `NODE_ENV=development`; readiness devolve `503` quando a dependência não está pronta.

7. Cenário negativo/erro esperado.

Configurações `true`, `1`, `*`, IP/CIDR inválido ou header de origem não confiável devem falhar no arranque ou continuar inseguros; nunca devem ser aceites por conveniência.

### Passo 6 - Fixar o cliente same-origin e o proxy apenas no desenvolvimento

1. Objetivo funcional do passo no contexto da app.

Evitar que o frontend publicado contenha qualquer host ou porta de desenvolvimento.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/services/apiClient.js`
    - EDITAR: `apps/web/vite.config.js`
    - LOCALIZAÇÃO: definição de `API_BASE_URL` e proxy de desenvolvimento.

3. Instruções do que fazer.

Usa sempre `/api` no código enviado ao browser. O Vite encaminha esse prefixo para a API local apenas no dev server; a configuração do proxy não entra no bundle.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/src/services/apiClient.js
export const API_BASE_URL = "/api";
```

```js
// apps/web/vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    const localEnv = loadEnv(mode, process.cwd(), "VITE_API_PROXY_TARGET");

    return {
        plugins: [react()],
        server: {
            proxy: {
                "/api": {
                    target: localEnv.VITE_API_PROXY_TARGET || "http://127.0.0.1:3001",
                    changeOrigin: false,
                },
            },
        },
    };
});
```

5. Explicação do código.

O browser chama sempre a própria origem. Em desenvolvimento, o dev server trata o proxy local; em build, não existe fallback absoluto nem variável `VITE_API_BASE_URL` embutida. Cookies, CSRF e Origin ficam coerentes com o contrato same-origin.

6. Validação do passo.

Build e preview devem funcionar sem `VITE_API_BASE_URL`; pesquisa no `dist` não pode encontrar `localhost`, `127.0.0.1` nem `VITE_API_PROXY_TARGET`.

7. Cenário negativo/erro esperado.

Se o cliente voltar a conter uma URL absoluta ou se o bundle incluir o target do proxy, o scan pós-build deve falhar.

### Passo 7 - Criar testes de transporte seguro

1. Objetivo funcional do passo no contexto da app.

Provar desenvolvimento local, produção segura e produção insegura.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf6.secure-transport.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Testa o middleware diretamente e acrescenta um pedido Supertest para o cenário de spoofing, sem depender de certificados reais.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf6.secure-transport.test.js
import { describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { requireHttps } from "../src/middlewares/secure-transport.middleware.js";

function buildReq(secure = false) {
    // O middleware consome apenas a decisão já validada pelo Express.
    return { secure };
}

describe("BK-MF6-05 transporte seguro", () => {
    it("permite desenvolvimento local por HTTP", () => {
        const next = vi.fn();
        requireHttps({ nodeEnv: "development" })(buildReq(false), {}, next);
        expect(next).toHaveBeenCalledWith();
    });

    it("permite produção quando proxy indica HTTPS", () => {
        const next = vi.fn();
        const res = { setHeader: vi.fn() };
        requireHttps({ nodeEnv: "production" })(buildReq(true), res, next);
        // HSTS só deve surgir no caminho seguro para não mascarar pedidos de produção inseguros.
        expect(res.setHeader).toHaveBeenCalledWith(
            "Strict-Transport-Security",
            expect.stringContaining("max-age"),
        );
    });

    it("bloqueia produção insegura", () => {
        const next = vi.fn();
        requireHttps({ nodeEnv: "production" })(buildReq(false), {}, next);
        // O erro é controlado e não revela detalhes da infraestrutura.
        expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 426 });
    });

    it("não confia em X-Forwarded-Proto sem proxy autorizado", async () => {
        const app = express();
        app.set("trust proxy", false);
        app.use(requireHttps({ nodeEnv: "production" }));
        app.get("/probe", (_req, res) => res.sendStatus(204));
        app.use((error, _req, res, _next) => {
            res.status(error.statusCode ?? 500).json({ message: error.message });
        });

        await request(app)
            .get("/probe")
            .set("X-Forwarded-Proto", "https")
            .expect(426);
    });
});
```

5. Explicação do código.

Os testes validam a regra sem certificado real. A produção segura recebe HSTS; a insegura é bloqueada; desenvolvimento continua simples. O teste Supertest prova que um cliente direto não transforma HTTP em HTTPS ao falsificar `X-Forwarded-Proto`.

6. Validação do passo.

Executa `npm --prefix apps/api test -- mf6.secure-transport.test.js`.

7. Cenário negativo/erro esperado.

Se produção insegura não devolver erro, o BK falha `RNF09`.

### Passo 8 - Preparar evidence e handoff para passwords e encriptação

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com provas suficientes para a defesa e com handoff claro para `BK-MF6-06` e `BK-MF6-07`.

2. Ficheiros envolvidos:
    - REVER: `apps/api/tests/mf6.secure-transport.test.js`
    - REVER: `apps/web/src/services/apiClient.js`
    - REVER: `docs/planificacao/guias-bk/MF6/BK-MF6-06-palavras-passe-com-hash-seguro-bcrypt.md`
    - REVER: `docs/planificacao/guias-bk/MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md`
    - LOCALIZAÇÃO: testes, critérios de aceite, evidence e handoff.

3. Instruções do que fazer.

Guarda no PR ou na defesa os outputs dos comandos finais, o negativo de produção HTTP, a validação de build web e a confirmação de que os BKs seguintes partem de canal seguro.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é de validação e evidence porque a implementação já ficou completa nos passos anteriores.

5. Explicação do código.

Não há código novo. A evidence mostra que `RNF09` foi aplicado no backend e no frontend. O handoff é importante porque passwords do `BK-MF6-06`, fotografias e relatórios do `BK-MF6-07` são dados sensíveis; eles continuam a precisar de hash e encriptação, mas já assumem comunicação segura em produção.

6. Validação do passo.

Confirma que existem pelo menos três negativos registados: produção HTTP bloqueada, `X-Forwarded-Proto` falsificado por origem não confiável bloqueado e scan do bundle a rejeitar host/porta de desenvolvimento.

7. Cenário negativo/erro esperado.

Se a evidence só mostrar build web e não mostrar o negativo HTTPS, o BK não deve ser marcado como `OK`.

#### Expected results

- Desenvolvimento local permite HTTP.
- Produção através de proxy pertencente à allowlist e transporte HTTPS segue.
- Header `x-forwarded-proto: https` vindo de origem não confiável não contorna o bloqueio `426`.
- `TRUSTED_PROXY_CIDRS=true|1|*` ou CIDR inválido é recusado.
- HSTS aparece em produção segura.

#### Critérios de aceite

##### Matriz minima de testes por prioridade

- Cenarios negativos concluidos: minimo `3`.
- Matriz minima de testes por prioridade: `P0 = unit + integration + e2e/smoke + minimo 3 negativos`.
- Evidencia de testes por camada: unit do middleware, integração de spoofing, build frontend e scan do bundle.
- Gate HTTPS não quebra localhost.
- Cookies de sessão continuam HttpOnly e seguros em produção.
- Frontend publicado usa `/api` same-origin e não contém host/porta local.
- Evidence inclui testes do middleware e validação de build.

#### Validação final

Executar cenarios negativos obrigatorios (minimo 3) antes de fechar o BK.

- [ ] Negativos: minimo `3` cenarios.

```bash
npm --prefix apps/api test
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
```

#### Evidence para PR/defesa

- `proof_tecnico`: output dos testes de transporte seguro.
- `proof_negativos`: produção HTTP bloqueada, spoof de proxy bloqueado e bundle sem host/porta de desenvolvimento.
- `proof_privacidade`: sessão, fotografias, relatórios e checkout exigem canal seguro em produção.

#### Handoff

`BK-MF6-06` deve continuar a proteger passwords com bcrypt e assumir que, em produção, credenciais viajam apenas por HTTPS.

#### Changelog

- `2026-07-10`: frontend alinhado a `/api` same-origin com proxy apenas em Vite; teste HTTPS passou a consumir só `req.secure` e inclui spoof negativo de `X-Forwarded-Proto`.
- `2026-06-24`: removidas secções estruturais antigas, preservados conceitos essenciais dentro do contrato `####` e reforçados comentários didáticos no teste de transporte.
- `2026-06-22`: guia reescrito para gate HTTPS/TLS, HSTS, validação de base URL e testes de `RNF09`.

## Suplemento de validacao documental
Este suplemento fecha lacunas formais detetadas pelo validador de planificacao sem alterar o contrato funcional original do guia.

## Bloco pedagogico
### Objetivo
O aluno deve completar `Todas as comunicações via HTTPS (TLS 1.2+).` com rastreabilidade direta a `RNF09`, mantendo evidence objetiva, negativos por prioridade e handoff claro.

### Pre-requisitos
- Rever `RNF09` nos documentos RF/RNF aplicáveis.
- Confirmar dependencias declaradas: `-`.
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
- BK: `BK-MF6-05`
- Requisito: `RNF09`
- Dependencias: `-`
- Sprint: `S10-S11`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF6-05` e do requisito `RNF09`.
2. Validar pre-condicoes e dependencias declaradas (`-`).
3. Rever ficheiros reais ligados ao BK e identificar o fluxo principal.
4. Consolidar contrato de entrada/saida com validacao, ownership e erros controlados.
5. Executar smoke test do caminho principal e validar integracao com BKs adjacentes.
6. Registar evidencia tecnica objetiva antes do handoff.
7. Executar cenarios negativos obrigatorios (minimo 3) e registar o resultado.
8. Reexecutar validacao afetada e guardar evidence final para defesa/PR.

### Validacao
- [ ] Smoke: fluxo principal executa sem erro bloqueante.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: metadados alinhados entre guia, backlog, matriz e anexos.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF6-06`
- Registar riscos, dependencias pendentes e validacoes executadas antes do fecho.

## Criterios de aceite
- Entrega funcional especifica de `Todas as comunicações via HTTPS (TLS 1.2+).` validada contra `RNF09`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Metadados do guia alinhados com matriz, backlog e anexos.

## Evidence para PR/defesa
- `proof_tecnico`: output, log, screenshot ou request/response do fluxo principal.
- `proof_negativos`: cenarios negativos executados e resultados observados.
- `proof_handoff`: estado final, riscos e proximo BK.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF6-05';
const MIN_NEGATIVOS = 3;

export function validarEvidenceDocumental(evidence) {
  const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;

  if (evidence?.bkId !== BK_ID) {
    throw new Error('Evidence fora do contrato do BK');
  }

  if (negativos < 3) {
    throw new Error('Cenarios negativos abaixo do minimo exigido');
  }

  return { bkId: BK_ID, estado: 'validado' };
}
```

## Changelog
- `2026-07-10`: proxy endurecido com allowlist CIDR explícita, `req.secure`, negativos de spoofing e health live/ready.
- `2026-06-30`: suplemento documental adicionado para cumprir validador de planificacao.
