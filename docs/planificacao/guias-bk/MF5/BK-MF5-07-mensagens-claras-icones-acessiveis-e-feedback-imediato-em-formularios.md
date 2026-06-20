# BK-MF5-07 - Mensagens claras, ícones acessíveis e feedback imediato em formulários

## Header
- `doc_id`: `GUIA-BK-MF5-07`
- `bk_id`: `BK-MF5-07`
- `macro`: `MF5`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF03`
- `fase_documental`: `Fase 2`
- `sprint`: `S09-S10`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF5-08`
- `guia_path`: `docs/planificacao/guias-bk/MF5/BK-MF5-07-mensagens-claras-icones-acessiveis-e-feedback-imediato-em-formularios.md`
- `last_updated`: `2026-06-20`

#### Objetivo

Neste BK vais criar um padrão reutilizável de feedback para formulários da Orélle, com mensagens claras, ícones acessíveis, estado ocupado durante submissões e validação mínima para evitar erros silenciosos.

#### Importância

`CANONICO`: `RNF03` exige mensagens claras, ícones acessíveis e feedback imediato em formulários. Isto é especialmente importante na Orélle porque os formulários tratam conta, perfil cosmético, fotografias faciais, preferências, carrinho, checkout e privacidade. Uma mensagem vaga como "falhou" não diz ao utilizador o que corrigir; uma mensagem demasiado técnica pode expor detalhes internos ou assustar quem só precisa de orientação simples.

#### Scope-in

- Criar o componente `FeedbackMessage` em `real_dev/web`.
- Criar o componente `SubmitButton` em `real_dev/web`.
- Criar estilos reutilizáveis para feedback, ícones textuais e botões ocupados.
- Aplicar o padrão em `RegisterPage.jsx`.
- Aplicar o padrão em `FacePhotoUploadPage.jsx`, porque é um formulário sensível com consentimento e fotografias.
- Criar um script de smoke sem dependências novas para confirmar que os ficheiros essenciais foram integrados.
- Definir matriz mínima de testes P0 com unit/static, integração/smoke, E2E/manual e 3 cenários negativos.

#### Scope-out

- Não criar uma biblioteca de design completa.
- Não instalar pacote de ícones.
- Não alterar endpoints, controllers, services, schemas, validators, roles ou permissões.
- Não alterar mensagens internas devolvidas pelo backend sem necessidade documental.
- Não expor stack trace, caminhos internos, cookies, tokens, fotografias, relatórios ou dados pessoais em mensagens visíveis.
- Não substituir validação backend por validação frontend.
- Não mudar modo escuro ou alto contraste; isso fica para `BK-MF5-08`.

#### Estado antes e depois

- Antes: páginas como `RegisterPage.jsx` e `FacePhotoUploadPage.jsx` já tinham estados `loading`, `error` e `success`, mas cada uma tratava mensagens, botões ocupados e roles acessíveis de forma isolada.
- Depois: formulários passam a reutilizar `FeedbackMessage` e `SubmitButton`, mantendo mensagens consistentes, roles acessíveis, estado ocupado, proteção contra duplo envio e uma matriz de validação P0.

#### Pre-requisitos

- `BK-MF5-05`: estrutura responsiva e grelha base em `real_dev/web`.
- `BK-MF5-06`: tokens visuais `--brand-*`, `--surface-*`, `--line`, `--ink`, `--focus-ring` e estados de foco.
- `real_dev/web/src/services/apiClient.js`: cliente HTTP com `credentials: "include"` para preservar a sessão por cookie HttpOnly.
- `real_dev/web/src/pages/RegisterPage.jsx`: formulário de registo criado em MF0.
- `real_dev/web/src/pages/FacePhotoUploadPage.jsx`: formulário de consentimento e upload facial criado em MF1.
- `real_dev/web/package.json`: frontend React + Vite com script `build`.
- `RNF03`: mensagens claras, ícones acessíveis e feedback imediato em formulários.

#### Glossário

- Feedback imediato: resposta visual e textual logo após uma ação do utilizador, como submeter um formulário.
- Erro recuperável: problema que o utilizador pode corrigir, como email inválido, falta de consentimento ou fotografias em falta.
- Estado ocupado: período em que o formulário está a aguardar resposta da API e deve evitar duplo envio.
- Mensagem segura: texto útil que não revela stack trace, paths internos, tokens, cookies, dados pessoais ou dados biométricos.
- Ícone acessível: símbolo que não depende apenas da cor; se for decorativo, deve usar `aria-hidden`.
- `role="alert"`: atributo que pede a leitores de ecrã para anunciarem erro ou aviso importante.
- `role="status"`: atributo que anuncia sucesso ou informação sem interromper tanto a navegação.
- Smoke test: verificação rápida que confirma se os ficheiros e integrações essenciais existem antes de defesa ou PR.

#### Conceitos teóricos essenciais

`CANONICO`: `RNF03` é um requisito de usabilidade. Ele não cria nova entidade, endpoint, role, pagamento ou regra biométrica; melhora a forma como os formulários já existentes comunicam estados ao utilizador.

Frontend ajuda o utilizador, mas não substitui backend. O frontend pode bloquear um botão, mostrar uma mensagem ou indicar que falta uma fotografia. Mesmo assim, a API continua responsável por validar permissões, ownership, consentimento, uploads, pagamentos, dados pessoais e dados biométricos.

Mensagens precisam de três partes: tipo, texto e próximo passo. O tipo ajuda a escolher `alert` ou `status`; o texto explica o que aconteceu; o próximo passo diz o que o utilizador pode fazer. Esta estrutura evita mensagens vagas e reduz pedidos repetidos.

Ícones acessíveis não são apenas desenhos. Como este projeto não tem biblioteca de ícones configurada, este BK usa símbolos textuais simples com `aria-hidden="true"` e mantém o significado em texto. Assim, quem usa leitor de ecrã recebe a label "Erro", "Sucesso", "Aviso" ou "Informação", e não depende da cor.

Estado ocupado evita duplicação. Em registo, checkout, upload ou privacidade, clicar duas vezes pode criar pedidos repetidos. `SubmitButton` centraliza `disabled` e `aria-busy`, para que o comportamento seja consistente sem duplicar lógica em todas as páginas.

Mensagens seguras protegem a aplicação. A UI não deve mostrar stack traces, paths internos, nomes de coleções, cookies, tokens, fotografias ou relatórios. O `apiRequest` já transforma erros HTTP em mensagens controladas; este BK mantém essa fronteira e ensina a não expor detalhes sensíveis no componente.

`DERIVADO`: os nomes `FeedbackMessage`, `SubmitButton`, `feedback--error`, `feedback--success`, `feedback--warning`, `feedback--info` e `button--busy` são decisões técnicas mínimas para cumprir `RNF03` sem introduzir dependências novas.

#### Arquitetura do BK

- `real_dev/web/src/components/FeedbackMessage.jsx`: recebe tipo e conteúdo, calcula role acessível e mostra label textual.
- `real_dev/web/src/components/SubmitButton.jsx`: recebe `isBusy`, bloqueia duplo envio e anuncia estado ocupado.
- `real_dev/web/src/styles.css`: adiciona estilos para mensagens, ícones textuais, foco e botão ocupado.
- `real_dev/web/src/pages/RegisterPage.jsx`: integra os componentes num formulário simples de conta.
- `real_dev/web/src/pages/FacePhotoUploadPage.jsx`: integra os componentes num formulário sensível com consentimento e fotografias.
- `real_dev/web/scripts/check-mf5-feedback.mjs`: valida por smoke/static que os componentes, estilos e integrações existem.
- `real_dev/web/package.json`: adiciona o script `smoke:mf5-feedback`.
- `BK-MF5-08`: reutiliza os componentes e classes deste BK ao aplicar modo escuro e contraste ajustado.

#### Ficheiros a criar/editar/rever

- CRIAR: `real_dev/web/src/components/FeedbackMessage.jsx`
- CRIAR: `real_dev/web/src/components/SubmitButton.jsx`
- EDITAR: `real_dev/web/src/styles.css`
- EDITAR: `real_dev/web/src/pages/RegisterPage.jsx`
- EDITAR: `real_dev/web/src/pages/FacePhotoUploadPage.jsx`
- CRIAR: `real_dev/web/scripts/check-mf5-feedback.mjs`
- EDITAR: `real_dev/web/package.json`
- REVER: `real_dev/web/src/services/apiClient.js`
- REVER: `docs/RNF.md`
- REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
- REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
- REVER: `docs/planificacao/guias-bk/MF5/BK-MF5-06-design-coerente-com-estetica-da-marca-cores-suaves-tipografia-moderna.md`
- REVER: `docs/planificacao/guias-bk/MF5/BK-MF5-08-modo-escuro-e-contraste-ajustado.md`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato e vocabulário de feedback

1. Objetivo funcional do passo no contexto da app.

Confirmar que `BK-MF5-07` trata usabilidade de formulários e definir o vocabulário que será usado em todos os componentes.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
    - REVER: `docs/planificacao/guias-bk/MF5/BK-MF5-06-design-coerente-com-estetica-da-marca-cores-suaves-tipografia-moderna.md`
    - REVER: `docs/planificacao/guias-bk/MF5/BK-MF5-08-modo-escuro-e-contraste-ajustado.md`
    - LOCALIZAÇÃO: entradas `RNF03`, `BK-MF5-07`, `BK-MF5-06` e `BK-MF5-08`.

3. Instruções do que fazer.

Confirma que `RNF03` pede mensagens claras, ícones acessíveis e feedback imediato. Usa quatro tipos: `error`, `success`, `warning` e `info`. Cada mensagem deve explicar o estado e orientar o próximo passo sem revelar detalhes técnicos internos.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Não há código porque esta decisão é documental e semântica. Primeiro defines o vocabulário; depois o código aplica esse vocabulário de forma consistente. Esta ordem evita que cada página invente nomes, cores e roles diferentes. O contrato vem de `RNF03`, consome os tokens visuais de `BK-MF5-06` e prepara `BK-MF5-08`, que vai verificar os mesmos estados em modo escuro e contraste.

6. Validação do passo.

Consegues classificar mensagens reais da app como erro, sucesso, aviso ou informação e explicar que role acessível cada tipo deve usar.

7. Cenário negativo/erro esperado.

Mensagem como "falhou" deve ser rejeitada, porque não explica o que aconteceu nem o próximo passo.

### Passo 2 - Criar o componente FeedbackMessage

1. Objetivo funcional do passo no contexto da app.

Criar uma peça reutilizável para mostrar mensagens seguras, legíveis e acessíveis em qualquer formulário.

2. Ficheiros envolvidos:
    - CRIAR: `real_dev/web/src/components/FeedbackMessage.jsx`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria a pasta `real_dev/web/src/components` se ainda não existir. Depois cria `FeedbackMessage.jsx` com o código abaixo.

4. Código completo, correto e integrado com a app final.

```jsx
// real_dev/web/src/components/FeedbackMessage.jsx
const FEEDBACK_CONFIG = Object.freeze({
    error: {
        label: "Erro",
        role: "alert",
        ariaLive: "assertive",
        icon: "!",
    },
    success: {
        label: "Sucesso",
        role: "status",
        ariaLive: "polite",
        icon: "✓",
    },
    warning: {
        label: "Aviso",
        role: "alert",
        ariaLive: "assertive",
        icon: "!",
    },
    info: {
        label: "Informação",
        role: "status",
        ariaLive: "polite",
        icon: "i",
    },
});

/**
 * Mostra uma mensagem acessível e consistente para formulários da Orélle.
 *
 * @function FeedbackMessage
 * @param {{id?: string, type?: "error"|"success"|"warning"|"info", children: import("react").ReactNode}} props - Identificador opcional, tipo e conteúdo seguro da mensagem.
 * @returns {JSX.Element|null} Mensagem formatada ou null quando não existe conteúdo.
 */
export function FeedbackMessage({ id, type = "info", children }) {
    if (!children) {
        return null;
    }

    // A configuração concentra labels e roles para que todas as páginas anunciem estados da mesma forma.
    const config = FEEDBACK_CONFIG[type] ?? FEEDBACK_CONFIG.info;

    return (
        <p
            id={id}
            className={`feedback feedback--${type}`}
            role={config.role}
            aria-live={config.ariaLive}
        >
            {/* O símbolo é decorativo; o significado real está na label textual. */}
            <span className="feedback__icon" aria-hidden="true">
                {config.icon}
            </span>
            <span className="feedback__body">
                <strong className="feedback__label">{config.label}:</strong>{" "}
                {children}
            </span>
        </p>
    );
}
```

5. Explicação do código.

Este ficheiro cria uma tabela de configuração para os quatro tipos de feedback. A entrada é `type`, `id` e `children`; a saída é um parágrafo com classe CSS, `role`, `aria-live`, ícone decorativo e label textual. O componente existe neste BK porque `RNF03` exige mensagens claras e acessíveis, e porque várias páginas precisam do mesmo padrão. Ele consome os tokens visuais de `BK-MF5-06` através das classes CSS que serão criadas no passo 4 e prepara `BK-MF5-08`, que só precisará adaptar cores por tema.

O componente não recebe nem transforma respostas HTTP completas. Recebe apenas texto seguro, normalmente vindo de `apiRequest` ou de validação local simples. Isso evita que dados sensíveis, paths internos, cookies, tokens, fotografias ou detalhes de base de dados sejam mostrados por engano. Ao adaptar este componente, podes mudar labels e estilos, mas não deves remover `role`, `aria-live` nem a label textual, porque isso quebraria acessibilidade.

6. Validação do passo.

Renderizar `<FeedbackMessage id="email-feedback" type="error">Email obrigatório.</FeedbackMessage>` deve produzir uma mensagem com `role="alert"`, label "Erro:" e símbolo decorativo ignorado por tecnologia assistiva.

7. Cenário negativo/erro esperado.

Se a mensagem depender apenas de cor vermelha, o feedback falha para utilizadores que não distinguem cores ou que usam leitor de ecrã.

### Passo 3 - Criar o componente SubmitButton

1. Objetivo funcional do passo no contexto da app.

Criar um botão de submissão que mostra estado ocupado e evita duplo envio durante chamadas à API.

2. Ficheiros envolvidos:
    - CRIAR: `real_dev/web/src/components/SubmitButton.jsx`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria `SubmitButton.jsx` na mesma pasta de componentes. Usa `isBusy` para indicar submissão em curso e `disabled` para bloquear o botão por regras do formulário.

4. Código completo, correto e integrado com a app final.

```jsx
// real_dev/web/src/components/SubmitButton.jsx
/**
 * Botão de submissão com estado ocupado e proteção contra duplo envio.
 *
 * @function SubmitButton
 * @param {{isBusy?: boolean, busyText?: string, disabled?: boolean, className?: string, children: import("react").ReactNode}} props - Estado do envio, texto de espera, bloqueio externo, classe opcional e conteúdo visível.
 * @returns {JSX.Element} Botão acessível para formulários.
 */
export function SubmitButton({
    isBusy = false,
    busyText = "A guardar...",
    disabled = false,
    className = "",
    children,
}) {
    // O botão fica bloqueado se o formulário estiver inválido ou se já existir uma submissão em curso.
    const isDisabled = disabled || isBusy;
    const classNames = ["submit-button", isBusy ? "button--busy" : "", className]
        .filter(Boolean)
        .join(" ");

    return (
        <button
            className={classNames}
            type="submit"
            disabled={isDisabled}
            aria-busy={isBusy}
        >
            {/* O texto ocupado torna o estado visível em vez de deixar o utilizador sem resposta. */}
            {isBusy ? busyText : children}
        </button>
    );
}
```

5. Explicação do código.

Este componente recebe estado ocupado, texto alternativo, bloqueio externo, classe opcional e conteúdo. A saída é um `<button type="submit">` que fica desativado quando o formulário está inválido ou quando a API ainda não respondeu. `aria-busy` comunica o estado a tecnologias assistivas, enquanto `busyText` mostra a ação em curso.

O componente cumpre `RNF03` porque dá feedback imediato durante submissões. Também evita pedidos duplicados em formulários como registo, upload facial ou checkout. Ao adaptar este botão, podes mudar `busyText`, mas não deves remover `disabled` nem `aria-busy`, porque isso reabriria o risco de duplo envio e feedback silencioso.

6. Validação do passo.

Durante `status === "loading"`, o botão deve ficar desativado, mostrar o texto ocupado e expor `aria-busy="true"`.

7. Cenário negativo/erro esperado.

Sem estado ocupado, o utilizador pode clicar várias vezes e criar pedidos repetidos enquanto a API ainda está a responder.

### Passo 4 - Atualizar estilos de feedback e botões

1. Objetivo funcional do passo no contexto da app.

Dar uma apresentação visual consistente aos componentes sem depender apenas da cor.

2. Ficheiros envolvidos:
    - EDITAR: `real_dev/web/src/styles.css`
    - LOCALIZAÇÃO: adicionar no fim das regras de estados visuais criadas em `BK-MF5-06`.

3. Instruções do que fazer.

Acrescenta o bloco abaixo ao CSS global. Ele usa tokens de `BK-MF5-06`, por isso não cria nova paleta nem biblioteca visual.

4. Código completo, correto e integrado com a app final.

```css
/* real_dev/web/src/styles.css */
.feedback {
    align-items: flex-start;
    border: 1px solid var(--line);
    border-left-width: 0.35rem;
    border-radius: 0.65rem;
    display: flex;
    gap: 0.65rem;
    margin: 0.85rem 0;
    padding: 0.8rem 0.9rem;
    overflow-wrap: anywhere;
}

.feedback__icon {
    align-items: center;
    border-radius: 999px;
    display: inline-flex;
    flex: 0 0 1.45rem;
    font-size: 0.9rem;
    font-weight: 800;
    height: 1.45rem;
    justify-content: center;
    margin-top: 0.1rem;
}

.feedback__body {
    min-width: 0;
}

.feedback__label {
    color: var(--ink);
    font-weight: 800;
}

/* Cada modificador combina cor, label e ícone para que a mensagem não dependa só da cor. */
.feedback--error {
    background: var(--brand-blush);
    border-left-color: var(--brand-primary);
    color: var(--brand-primary-strong);
}

.feedback--error .feedback__icon {
    background: var(--brand-primary);
    color: var(--surface);
}

.feedback--success {
    background: #eefaf4;
    border-left-color: #2f7d5b;
    color: #1f5d42;
}

.feedback--success .feedback__icon {
    background: #2f7d5b;
    color: #ffffff;
}

.feedback--warning {
    background: #fff6e8;
    border-left-color: #a46316;
    color: #6f430e;
}

.feedback--warning .feedback__icon {
    background: #a46316;
    color: #ffffff;
}

.feedback--info {
    background: var(--surface-soft);
    border-left-color: var(--brand-accent);
    color: var(--brand-depth);
}

.feedback--info .feedback__icon {
    background: var(--brand-accent);
    color: var(--surface);
}

.submit-button {
    min-height: 2.75rem;
}

/* Cursor e opacidade deixam claro que a submissão já está em curso. */
.button--busy {
    cursor: progress;
    opacity: 0.78;
}
```

5. Explicação do código.

O CSS define layout, espaçamento, quebra de texto, ícone decorativo, label e quatro variações de estado. A entrada são as classes geradas por `FeedbackMessage` e `SubmitButton`; a saída é feedback visível, legível e consistente. `overflow-wrap: anywhere` impede que uma mensagem longa rebente cartões ou formulários em mobile. Os modificadores usam tokens de marca quando existem e cores fixas apenas para estados semânticos simples.

Este bloco cumpre `RNF03` porque torna mensagens e estado ocupado visíveis sem depender apenas da cor. Também prepara `BK-MF5-08`, porque as classes usam tokens que podem mudar por tema. Ao adaptar, podes ajustar espaçamentos e tons, mas não deves remover label, contraste, quebra de texto ou estados de foco já definidos em `BK-MF5-06`.

6. Validação do passo.

Mostra uma mensagem longa num formulário e confirma que o texto quebra dentro do contentor, o ícone fica alinhado e a label continua visível.

7. Cenário negativo/erro esperado.

Uma mensagem com path interno ou stack trace deve ser trocada por texto seguro antes de chegar à UI; o CSS não pode ser usado para esconder erro inseguro.

### Passo 5 - Aplicar feedback ao formulário de registo

1. Objetivo funcional do passo no contexto da app.

Integrar os componentes num formulário simples e real, sem mudar o contrato da API de registo.

2. Ficheiros envolvidos:
    - EDITAR: `real_dev/web/src/pages/RegisterPage.jsx`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o conteúdo de `RegisterPage.jsx` pelo código abaixo. Mantém `apiRequest("/auth/register")` e a validação HTML5 do email e da palavra-passe.

4. Código completo, correto e integrado com a app final.

```jsx
// real_dev/web/src/pages/RegisterPage.jsx
/**
 * Página de registo do BK-MF0-01 com feedback acessível do BK-MF5-07.
 */
import { useState } from "react";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { SubmitButton } from "../components/SubmitButton.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formulário de registo com email, palavra-passe e feedback imediato.
 *
 * @function RegisterPage
 * @returns {JSX.Element} UI de registo com mensagens seguras e botão ocupado.
 */
export function RegisterPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    /**
     * Atualiza um campo do formulário sem alterar os restantes.
     *
     * @function updateField
     * @param {import("react").ChangeEvent<HTMLInputElement>} event - Evento do input.
     * @returns {void}
     */
    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    /**
     * Submete o registo para a API e traduz o resultado para feedback de UI.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulário.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();
        // O estado loading limpa mensagens antigas e bloqueia novo submit até a API responder.
        setStatus("loading");
        setMessage("");

        try {
            await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify(form),
            });

            setStatus("success");
            setMessage("Conta criada. Já podes iniciar sessão.");
            setForm({ email: "", password: "" });
        } catch (err) {
            // A mensagem vem do apiRequest/backend; não exibimos objetos técnicos nem detalhes internos.
            setStatus("error");
            setMessage(err.message);
        }
    }

    const isBusy = status === "loading";
    const feedbackType = status === "error" ? "error" : "success";

    return (
        <main>
            <h1>Registo Orélle</h1>
            <form
                aria-describedby={message ? "register-feedback" : undefined}
                onSubmit={handleSubmit}
            >
                <label>
                    Email
                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={updateField}
                        autoComplete="email"
                        required
                    />
                </label>

                <label>
                    Palavra-passe
                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={updateField}
                        autoComplete="new-password"
                        minLength={8}
                        required
                    />
                </label>

                <SubmitButton isBusy={isBusy} busyText="A criar conta...">
                    Criar conta
                </SubmitButton>
            </form>

            <FeedbackMessage id="register-feedback" type={feedbackType}>
                {message}
            </FeedbackMessage>
        </main>
    );
}
```

5. Explicação do código.

O ficheiro continua a receber `email` e `password`, mantém `apiRequest("/auth/register")` e deixa o backend validar regras definitivas. A saída visual passa a ser `SubmitButton` durante submissão e `FeedbackMessage` quando existe mensagem. `aria-describedby` liga o formulário à mensagem ativa, ajudando tecnologias assistivas a perceber que o feedback pertence àquele formulário.

O código existe neste BK porque mostra a aplicação real do padrão num formulário simples. Usa o cliente HTTP existente, que envia cookies HttpOnly com `credentials: "include"`, e não guarda sessão no browser. A validação HTML5 ajuda o utilizador, mas não substitui a validação backend. Ao adaptar para outro formulário, mantém o ciclo `idle -> loading -> success/error`, limpa mensagens antigas antes do pedido e nunca mostres objetos técnicos no feedback.

6. Validação do passo.

Submete com email inválido e confirma que o browser bloqueia antes da API. Submete com dados válidos num ambiente preparado e confirma que o botão mostra "A criar conta..." até a resposta chegar. Em erro HTTP, a mensagem deve aparecer como `role="alert"`.

7. Cenário negativo/erro esperado.

Se o botão não ficar desativado em `loading`, o utilizador pode duplicar o pedido de registo antes da resposta da API.

### Passo 6 - Aplicar feedback ao formulário de fotografias faciais

1. Objetivo funcional do passo no contexto da app.

Aplicar o mesmo padrão num formulário sensível, onde consentimento e fotografias exigem mensagens claras e seguras.

2. Ficheiros envolvidos:
    - EDITAR: `real_dev/web/src/pages/FacePhotoUploadPage.jsx`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o conteúdo de `FacePhotoUploadPage.jsx` pelo código abaixo. Mantém os endpoints `/face-consent` e `/face-photos`, e nunca mostres nomes internos de ficheiros, paths do servidor ou detalhes técnicos de upload.

4. Código completo, correto e integrado com a app final.

```jsx
// real_dev/web/src/pages/FacePhotoUploadPage.jsx
/**
 * Página de consentimento e upload facial MF1 com feedback acessível MF5.
 */
import { useState } from "react";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { SubmitButton } from "../components/SubmitButton.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Envia consentimento e duas fotografias por FormData.
 *
 * @function FacePhotoUploadPage
 * @returns {JSX.Element} Formulário de upload facial com feedback seguro.
 */
export function FacePhotoUploadPage() {
    const [accepted, setAccepted] = useState(false);
    const [frontal, setFrontal] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    /**
     * Aceita consentimento e envia fotografias para a API.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulário.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();
        // Sem consentimento e duas fotografias, o formulário não deve iniciar o fluxo sensível.
        if (!accepted || !frontal || !perfil) {
            setStatus("error");
            setMessage("Aceita o consentimento e escolhe as duas fotografias.");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            await apiRequest("/face-consent", {
                method: "POST",
                body: JSON.stringify({
                    accepted,
                    version: "face-analysis-v1",
                }),
            });

            const formData = new FormData();
            formData.append("frontal", frontal);
            formData.append("perfil", perfil);

            // O apiRequest deteta FormData e evita forçar Content-Type errado no upload.
            const data = await apiRequest("/face-photos", {
                method: "POST",
                body: formData,
            });

            setStatus("success");
            setMessage(`${data.photos.length} fotografias guardadas com segurança.`);
        } catch (err) {
            // A UI mostra uma mensagem controlada e não expõe paths, cookies ou detalhes dos ficheiros.
            setStatus("error");
            setMessage(err.message);
        }
    }

    const isBusy = status === "loading";
    const isSubmitDisabled = !accepted || !frontal || !perfil || isBusy;
    const feedbackType = status === "error" ? "error" : "success";

    return (
        <section>
            <h1>Fotografias para análise facial</h1>
            <form
                aria-describedby={message ? "face-photo-feedback" : undefined}
                onSubmit={handleSubmit}
            >
                <label>
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(event) => setAccepted(event.target.checked)}
                    />
                    Aceito o tratamento destas fotografias para análise facial cosmética.
                </label>

                <label>
                    Fotografia frontal
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) =>
                            setFrontal(event.target.files[0] ?? null)
                        }
                    />
                </label>

                <label>
                    Fotografia de perfil
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) =>
                            setPerfil(event.target.files[0] ?? null)
                        }
                    />
                </label>

                <SubmitButton
                    isBusy={isBusy}
                    busyText="A enviar fotografias..."
                    disabled={isSubmitDisabled}
                >
                    Enviar fotografias
                </SubmitButton>
            </form>

            <FeedbackMessage id="face-photo-feedback" type={feedbackType}>
                {message}
            </FeedbackMessage>
        </section>
    );
}
```

5. Explicação do código.

Este ficheiro recebe consentimento, fotografia frontal e fotografia de perfil. Antes de chamar a API, valida localmente se os três elementos existem, porque isso dá feedback imediato e evita um pedido inútil. Mesmo assim, o backend continua a ser a autoridade sobre consentimento, ownership, tipo, tamanho e número de ficheiros.

O primeiro pedido guarda consentimento; o segundo envia `FormData` para fotografias. O `apiRequest` já tem lógica para não forçar `Content-Type` JSON quando o body é `FormData`, por isso o upload mantém o boundary correto do browser. As mensagens de sucesso e erro saem por `FeedbackMessage`, que usa `alert` em erro e `status` em sucesso. Ao adaptar este padrão para outros formulários sensíveis, mantém a regra: a UI orienta o utilizador, mas não decide ownership nem mostra dados biométricos ou detalhes internos.

6. Validação do passo.

Tenta submeter sem consentimento e confirma que aparece uma mensagem de erro sem chamada útil à API. Depois escolhe duas imagens válidas num ambiente preparado e confirma que o botão mostra "A enviar fotografias..." durante o envio.

7. Cenário negativo/erro esperado.

Se a UI mostrar o path local ou interno da fotografia numa mensagem de erro, a mensagem não é segura e deve ser substituída.

### Passo 7 - Criar smoke test sem dependências novas

1. Objetivo funcional do passo no contexto da app.

Criar uma verificação rápida para garantir que os componentes, estilos e integrações essenciais foram adicionados ao frontend real.

2. Ficheiros envolvidos:
    - CRIAR: `real_dev/web/scripts/check-mf5-feedback.mjs`
    - EDITAR: `real_dev/web/package.json`
    - LOCALIZAÇÃO: ficheiro de script completo e bloco `scripts` do package.

3. Instruções do que fazer.

Cria a pasta `real_dev/web/scripts` se ainda não existir. Depois cria o script abaixo e acrescenta `smoke:mf5-feedback` ao `package.json`.

4. Código completo, correto e integrado com a app final.

```js
// real_dev/web/scripts/check-mf5-feedback.mjs
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "..");

const checks = [
    {
        file: "src/components/FeedbackMessage.jsx",
        required: ["role={config.role}", "aria-live={config.ariaLive}", "feedback__label"],
    },
    {
        file: "src/components/SubmitButton.jsx",
        required: ["disabled={isDisabled}", "aria-busy={isBusy}", "button--busy"],
    },
    {
        file: "src/pages/RegisterPage.jsx",
        required: ["FeedbackMessage", "SubmitButton", "apiRequest(\"/auth/register\""],
    },
    {
        file: "src/pages/FacePhotoUploadPage.jsx",
        required: ["FeedbackMessage", "SubmitButton", "FormData", "/face-photos"],
    },
    {
        file: "src/styles.css",
        required: [".feedback", ".feedback--error", ".button--busy"],
    },
];

/**
 * Garante que um ficheiro contém todos os fragmentos esperados.
 *
 * @async
 * @function assertContains
 * @param {{file: string, required: string[]}} check - Ficheiro relativo e fragmentos obrigatórios.
 * @returns {Promise<void>} Termina sem erro quando o contrato está presente.
 */
async function assertContains(check) {
    const absolutePath = resolve(webRoot, check.file);
    const content = await readFile(absolutePath, "utf8");

    for (const fragment of check.required) {
        // A verificação é textual para não exigir dependências novas de testes frontend.
        if (!content.includes(fragment)) {
            throw new Error(`${check.file} não contém: ${fragment}`);
        }
    }
}

for (const check of checks) {
    await assertContains(check);
}

console.log("BK-MF5-07 feedback smoke: PASS");
```

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
        "smoke:mf5-feedback": "node scripts/check-mf5-feedback.mjs"
    },
    "dependencies": {
        "@vitejs/plugin-react": "^4.3.1",
        "vite": "^5.3.5",
        "react": "^18.3.1",
        "react-dom": "^18.3.1"
    }
}
```

5. Explicação do código.

O script lê cinco ficheiros esperados e confirma fragmentos mínimos: roles acessíveis, `aria-busy`, componentes integrados nas páginas e classes CSS. A entrada é a lista `checks`; a saída é `BK-MF5-07 feedback smoke: PASS` ou um erro com o ficheiro e fragmento em falta. Esta abordagem evita dependências novas porque `real_dev/web/package.json` ainda não tem test runner frontend.

O script não substitui teste visual nem E2E, mas fecha uma camada de integração leve para este BK. Ele prova que o aluno criou os ficheiros no root correto, integrou componentes em formulários reais e adicionou CSS. Ao adaptar o script, podes acrescentar ficheiros, mas não deves remover as verificações de `role`, `aria-live`, `disabled`, `aria-busy` e integração com `apiRequest`.

6. Validação do passo.

Depois de criares os ficheiros, executa `npm --prefix real_dev/web run smoke:mf5-feedback`. O comando deve terminar com `BK-MF5-07 feedback smoke: PASS`.

7. Cenário negativo/erro esperado.

Se `SubmitButton.jsx` não tiver `aria-busy={isBusy}`, o script deve falhar e indicar o fragmento em falta.

### Passo 8 - Executar validações e cenários negativos

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com evidência técnica, visual e pedagógica adequada a uma prioridade `P0`.

2. Ficheiros envolvidos:
    - REVER: `real_dev/web/package.json`
    - REVER: `real_dev/web/src/components/FeedbackMessage.jsx`
    - REVER: `real_dev/web/src/components/SubmitButton.jsx`
    - REVER: `real_dev/web/src/pages/RegisterPage.jsx`
    - REVER: `real_dev/web/src/pages/FacePhotoUploadPage.jsx`
    - REVER: `real_dev/web/src/styles.css`
    - LOCALIZAÇÃO: comandos e evidência final do BK.

3. Instruções do que fazer.

Executa as validações abaixo e guarda a evidência para PR/defesa. Executar cenários negativos obrigatórios (mínimo 3): mensagem vaga, duplo submit e upload facial sem consentimento.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix real_dev/web run build
npm --prefix real_dev/web run smoke:mf5-feedback
```

5. Explicação do código.

O primeiro comando confirma que Vite compila JSX e CSS depois da criação dos componentes. O segundo comando confirma que os ficheiros essenciais existem no root `real_dev/web` e que contêm fragmentos mínimos de acessibilidade, estado ocupado e integração. Estes comandos cumprem a camada de build e smoke da matriz P0.

Os testes manuais completam a evidência: no registo, testa sucesso, erro e duplo clique; no upload facial, testa falta de consentimento, falta de fotografia frontal e falta de fotografia de perfil. As entradas são ações do utilizador; as saídas esperadas são mensagens claras, sem detalhes internos e com botão ocupado quando há chamada à API.

6. Validação do passo.

Regista no PR/defesa: output do build, output do smoke, captura de erro acessível, captura de sucesso, nota de duplo submit bloqueado e nota dos 3 negativos executados.

7. Cenário negativo/erro esperado.

Se os negativos forem menos de 3, a evidência P0 fica incompleta e o BK não deve ser dado como fechado.

#### Expected results

- `FeedbackMessage` existe em `real_dev/web/src/components/FeedbackMessage.jsx`.
- `SubmitButton` existe em `real_dev/web/src/components/SubmitButton.jsx`.
- `RegisterPage.jsx` usa `FeedbackMessage`, `SubmitButton` e mantém `apiRequest("/auth/register")`.
- `FacePhotoUploadPage.jsx` usa `FeedbackMessage`, `SubmitButton`, consentimento e `FormData`.
- `styles.css` contém `.feedback`, modificadores por tipo, `.feedback__icon`, `.feedback__label`, `.submit-button` e `.button--busy`.
- `npm --prefix real_dev/web run build` termina sem erro.
- `npm --prefix real_dev/web run smoke:mf5-feedback` termina com `BK-MF5-07 feedback smoke: PASS`.
- Mensagens de erro usam `role="alert"` e mensagens de sucesso/informação usam `role="status"`.
- Erros técnicos continuam protegidos por `apiRequest` e backend; a UI não expõe detalhes internos.

#### Critérios de aceite

- O guia usa apenas paths `real_dev/web` para frontend operativo.
- Existe evidência de que `RNF03` foi cumprido em pelo menos dois formulários reais.
- `FeedbackMessage` tem label textual, role acessível, `aria-live` e ícone decorativo.
- `SubmitButton` bloqueia duplo submit com `disabled` e anuncia estado com `aria-busy`.
- O CSS não depende apenas de cor: há label, ícone textual e layout de mensagem.
- `RegisterPage.jsx` mantém validação HTML5 e chamada ao backend.
- `FacePhotoUploadPage.jsx` mantém consentimento antes do envio de fotografias.
- Evidência de testes por camada: unit/static por `check-mf5-feedback.mjs`, integration/smoke por `npm --prefix real_dev/web run smoke:mf5-feedback`, E2E/manual por submissão válida, inválida e duplo clique no browser.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.

#### Validação final

### Matriz mínima de testes por prioridade

| Prioridade | Camadas obrigatórias | Negativos mínimos | Evidência esperada |
| --- | --- | ---: | --- |
| `P0` | unit/static + integration/smoke + E2E/manual | 3 | build, smoke, capturas e notas de execução |
| `P1` | unit/static + integration/smoke | 2 | build, smoke e negativos relevantes |
| `P2` | smoke ou validação manual guiada | 1 | nota de validação e negativo essencial |

- [ ] Build: `npm --prefix real_dev/web run build`.
- [ ] Smoke: `npm --prefix real_dev/web run smoke:mf5-feedback`.
- [ ] Unit/static: o script confirma componentes, roles, estado ocupado e CSS.
- [ ] Integration/smoke: o script confirma integração em `RegisterPage.jsx` e `FacePhotoUploadPage.jsx`.
- [ ] E2E/manual: testar registo válido, registo inválido, duplo clique, upload sem consentimento e upload com duas fotografias.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Segurança: confirmar que nenhuma mensagem mostra paths internos, cookies, tokens, fotografias, relatórios ou detalhes de base de dados.

#### Evidence para PR/defesa

- Output de `npm --prefix real_dev/web run build`.
- Output de `npm --prefix real_dev/web run smoke:mf5-feedback`.
- Captura de erro de registo com `role="alert"`.
- Captura de sucesso de registo ou nota de ambiente se a API não estiver disponível.
- Captura de upload facial bloqueado sem consentimento.
- Nota de duplo submit: o botão ficou desativado enquanto `status === "loading"`.
- Lista dos 3 cenários negativos executados e resultado observado.

#### Handoff

`BK-MF5-08` deve reutilizar `FeedbackMessage`, `SubmitButton`, `.feedback`, `.feedback__icon`, `.feedback__label` e `.button--busy` ao aplicar modo escuro e contraste ajustado. O próximo BK não deve recriar estes componentes; deve garantir que os tokens de tema mantêm contraste suficiente nos quatro tipos de feedback.

#### Changelog

- `2026-06-18`: guia reescrito para RNF03 com componentes de feedback, botão ocupado, CSS de mensagens e exemplo integrado em formulário.
- `2026-06-20`: paths corrigidos para `real_dev/web`, 8 passos P0 adicionados, comentários didáticos incluídos nos blocos de código, explicações expandidas, integração em formulário sensível, smoke sem dependências novas e matriz mínima de testes acrescentada.
