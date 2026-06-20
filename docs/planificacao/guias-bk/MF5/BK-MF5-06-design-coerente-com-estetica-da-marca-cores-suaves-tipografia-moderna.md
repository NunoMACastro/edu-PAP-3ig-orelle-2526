# BK-MF5-06 - Design coerente com estética da marca (cores suaves, tipografia moderna)

## Header
- `doc_id`: `GUIA-BK-MF5-06`
- `bk_id`: `BK-MF5-06`
- `macro`: `MF5`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `-`
- `rf_rnf`: `RNF02`
- `fase_documental`: `Fase 2`
- `sprint`: `S09-S10`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF5-07`
- `guia_path`: `docs/planificacao/guias-bk/MF5/BK-MF5-06-design-coerente-com-estetica-da-marca-cores-suaves-tipografia-moderna.md`
- `last_updated`: `2026-06-20`

#### Objetivo

Neste BK vais consolidar a linguagem visual da Orélle no frontend `real_dev/web`, criando tokens de marca, estados de interação e pequenas classes reutilizáveis para que a aplicação mantenha cores suaves, tipografia moderna e leitura consistente.

#### Importância

Design consistente não é decoração. Numa aplicação de cosmética, a interface ajuda o utilizador a reconhecer botões, erros, cartões, formulários, painéis de consultoria e áreas administrativas. Também evita que cada página invente cores e sombras diferentes, o que tornaria os próximos BKs mais difíceis de manter.

#### Scope-in

- Definir tokens CSS semânticos para cor, superfície, texto, borda, sombra, foco e estados da marca.
- Manter compatibilidade com os tokens já usados em `real_dev/web/src/styles.css`.
- Uniformizar botões, inputs, foco, alertas e mensagens de estado.
- Criar classes reutilizáveis para painéis, métricas e estados visuais.
- Preservar o layout responsivo criado no `BK-MF5-05`.
- Validar build, contraste básico, foco por teclado e dois cenários negativos.

#### Scope-out

- Não criar logótipo definitivo.
- Não adicionar biblioteca visual.
- Não usar Tailwind CSS sem configuração real no projeto.
- Não alterar textos de negócio, endpoints, services, roles ou permissões.
- Não criar modo escuro; isso fica para `BK-MF5-08`.
- Não transformar este RNF em requisito de IA, pagamentos, biometria ou backend.

#### Estado antes e depois

- Antes: o frontend já tem uma base responsiva, mas o CSS usa tokens antigos como `--bordo`, `--wine`, `--plum`, `--blush`, `--powder` e `--shadow`, misturados com valores diretos.
- Depois: o CSS passa a ter tokens semânticos `--brand-*`, mantendo aliases para os nomes antigos, para não quebrar seletores existentes nem os BKs seguintes.

#### Pre-requisitos

- `BK-MF5-05`: shell responsiva, grelha base e organização visual por grupos.
- `RNF02`: design coerente com estética da marca, cores suaves e tipografia moderna.
- `real_dev/web/src/styles.css` existente.
- `real_dev/web/package.json` com script `build`.
- Conhecimentos básicos de CSS custom properties, estados de foco e inspeção visual em browser.

#### Glossário

- Token visual: variável CSS reutilizável para representar uma decisão visual, como cor principal, fundo, borda ou sombra.
- Alias de token: variável antiga que aponta para uma variável nova, preservando compatibilidade com código já escrito.
- Superfície: fundo visual de página, cartão, painel, lista ou mensagem.
- Contraste: diferença suficiente entre texto e fundo para leitura confortável.
- Tipografia: hierarquia de fonte, tamanho, peso e espaçamento usada para orientar a leitura.
- Estado de foco: indicação visual quando um campo ou botão está ativo por teclado ou clique.
- Classe utilitária: classe pequena e reutilizável que resolve um padrão visual comum sem ficar presa a uma página específica.

#### Conceitos teóricos essenciais

`CANONICO`: `RNF02` pede design coerente com estética da marca, cores suaves e tipografia moderna. Este requisito é transversal: não cria nova entidade, endpoint ou regra de negócio; melhora a forma como a aplicação apresenta funcionalidades já existentes e prepara os BKs seguintes de usabilidade.

Um token visual evita duplicação. Em vez de escrever `#7a1f35` em vários seletores, crias `--brand-primary` e usas esse nome em botões, links, foco e destaques. Se a marca mudar, alteras o token e a interface acompanha a decisão.

Um alias de token é importante nesta fase porque o CSS real já usa nomes como `--bordo` e `--wine`. Se apagasses esses nomes sem atualizar todos os seletores, a app poderia perder cores em zonas antigas. Por isso, este BK cria tokens novos e mantém os antigos a apontar para eles.

Design de marca não deve enfraquecer segurança. O frontend pode esconder painéis por role para melhorar a experiência, mas a autorização real continua no backend. Este BK só mexe em CSS e não altera cookies, sessão, ownership, consentimento, dados biométricos, encomendas ou pagamentos.

Contraste e foco fazem parte da usabilidade. Uma paleta suave pode ser agradável, mas botões, mensagens de erro e campos focados precisam de ser visíveis. O estado de foco evita que um utilizador de teclado perca a posição no formulário.

Evidence visual não substitui build. O build confirma que Vite consegue compilar CSS e JSX; a inspeção visual confirma se o resultado é legível. As duas validações são necessárias porque um CSS pode compilar e ainda assim ter contraste fraco.

`DERIVADO`: os nomes `--brand-primary`, `--brand-accent`, `.brand-panel`, `.metric-strip` e `.status-chip` são decisões técnicas mínimas para aplicar `RNF02` sem introduzir dependências novas nem alterar contratos funcionais.

#### Arquitetura do BK

- `real_dev/web/src/styles.css`: recebe tokens semânticos, aliases de compatibilidade, estados de interação e classes reutilizáveis.
- Páginas React existentes: continuam a usar a estrutura criada no `BK-MF5-05`; este BK não exige alterar JSX para funcionar.
- `BK-MF5-07`: passa a poder reutilizar os tokens para mensagens claras e feedback acessível.
- `BK-MF5-08`: passa a ter uma base de tokens estável para modo escuro e contraste ajustado.
- Build Vite: valida que as alterações de CSS não quebram o frontend.

#### Ficheiros a criar/editar/rever

- EDITAR: `real_dev/web/src/styles.css`
- REVER: `real_dev/web/src/App.jsx`
- REVER: `real_dev/web/src/pages/*.jsx`
- REVER: `real_dev/web/package.json`
- REVER: `docs/RNF.md`
- REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
- REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`

#### Tutorial técnico linear

### Passo 1 - Confirmar o contrato visual do RNF02

1. Objetivo funcional do passo no contexto da app.

Confirmar que este BK trata qualidade visual transversal e não cria uma nova funcionalidade de negócio.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/guias-bk/MF5/BK-MF5-05-interface-moderna-intuitiva-e-responsive-desktop-e-mobile.md`
    - LOCALIZAÇÃO: entradas `RNF02`, `BK-MF5-06` e handoff do `BK-MF5-05`.

3. Instruções do que fazer.

Confirma que `RNF02` pede coerência visual, cores suaves e tipografia moderna. Regista também que o `BK-MF5-05` já preparou a shell responsiva e que este BK deve atuar sobre a linguagem visual, não sobre backend ou fluxos de negócio.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Não há código porque a primeira decisão é documental. O RNF orienta aparência e consistência, mas não autoriza inventar entidades, endpoints, providers externos, permissões ou novas regras de checkout. Esta separação evita scope creep e mantém a sequência da MF5 previsível.

6. Validação do passo.

Consegues explicar por que este BK edita `real_dev/web/src/styles.css`, preserva o trabalho do `BK-MF5-05` e prepara `BK-MF5-07`.

7. Cenário negativo/erro esperado.

Se usares este BK para alterar regras de recomendação, auditoria biométrica ou checkout, estás a misturar domínio funcional com um RNF visual. O resultado esperado é rejeitar essa alteração e manter o foco em CSS.

### Passo 2 - Definir tokens de marca compatíveis

1. Objetivo funcional do passo no contexto da app.

Criar uma base visual reutilizável sem quebrar seletores que ainda usam os tokens antigos.

2. Ficheiros envolvidos:
    - EDITAR: `real_dev/web/src/styles.css`
    - LOCALIZAÇÃO: substituir o bloco `:root` atual.

3. Instruções do que fazer.

Substitui o bloco `:root` pelo código abaixo. Mantém tokens novos com nomes semânticos e aliases para os nomes antigos. Esta estratégia permite que os próximos passos usem `--brand-*` sem partir seletores existentes que ainda usam `--bordo`, `--wine`, `--plum`, `--blush`, `--powder` e `--shadow`.

4. Código completo, correto e integrado com a app final.

```css
/* real_dev/web/src/styles.css */
:root {
    color-scheme: light;
    font-family:
        Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: #2f1f25;
    background: #fff8f5;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;

    /* Estes tokens descrevem intenção visual, não páginas específicas. */
    --surface: #ffffff;
    --surface-soft: #fff5f4;
    --ink: #2f1f25;
    --muted: #725e65;
    --line: #ecd6dc;
    --brand-primary: #7a1f35;
    --brand-primary-strong: #541424;
    --brand-accent: #9a2f49;
    --brand-depth: #5c3147;
    --brand-blush: #fff0f2;
    --brand-powder: #f3e4e8;
    --focus-ring: rgb(154 47 73 / 18%);
    --shadow-soft: 0 18px 42px rgb(122 31 53 / 12%);

    /* Os aliases preservam o CSS criado nos BKs anteriores até todos os seletores serem migrados. */
    --bordo: var(--brand-primary);
    --bordo-dark: var(--brand-primary-strong);
    --wine: var(--brand-accent);
    --plum: var(--brand-depth);
    --blush: var(--brand-blush);
    --powder: var(--brand-powder);
    --shadow: var(--shadow-soft);
}
```

5. Explicação do código.

O bloco define a identidade visual base da Orélle: texto escuro, fundo suave, superfícies brancas e tons bordô controlados. `--brand-primary` representa a ação principal, `--brand-accent` dá destaque, `--focus-ring` cria foco visível e `--shadow-soft` normaliza profundidade.

Os aliases são a parte mais importante para a integração. Como o CSS real já usa `--bordo`, `--wine` e outros nomes antigos, os aliases evitam variáveis indefinidas. Isto permite que o aluno faça a migração por passos, sem rebentar a app no meio do BK.

Este código cumpre `RNF02` porque cria uma linguagem visual consistente. Também prepara `BK-MF5-07`, que precisa de tokens para mensagens, e `BK-MF5-08`, que vai trocar tokens por tema sem duplicar regras de componentes.

6. Validação do passo.

Pesquisa no CSS por `--brand-primary` e por `--bordo`. Os dois devem existir: o primeiro como token novo e o segundo como alias de compatibilidade.

7. Cenário negativo/erro esperado.

Remove temporariamente a linha `--bordo: var(--brand-primary);` e observa que seletores antigos que usam `var(--bordo)` deixam de ter uma cor válida. Depois repõe o alias. Este erro mostra por que a compatibilidade é necessária.

### Passo 3 - Uniformizar botões, inputs, foco e mensagens base

1. Objetivo funcional do passo no contexto da app.

Tornar interações previsíveis e legíveis, usando os tokens definidos no passo anterior.

2. Ficheiros envolvidos:
    - EDITAR: `real_dev/web/src/styles.css`
    - LOCALIZAÇÃO: substituir os seletores `button`, `button:hover:not(:disabled)`, `button:disabled`, `input`, `select`, `textarea`, estados `:focus`, `.app-kicker`, `.session-pill`, `main > h1::before`, `section > h1::before`, `[role="alert"]` e `[role="status"]`.

3. Instruções do que fazer.

Atualiza os seletores abaixo para usarem tokens `--brand-*`. Não mudes classes React nem regras de autorização. O frontend pode organizar a experiência visual, mas o backend continua responsável por permissões e dados sensíveis.

4. Código completo, correto e integrado com a app final.

```css
/* real_dev/web/src/styles.css */
button {
    min-height: 2.65rem;
    border: 0;
    border-radius: 0.5rem;
    padding: 0.7rem 1rem;
    color: #ffffff;
    /* A ação principal usa o token da marca para ficar consistente em toda a app. */
    background: var(--brand-primary);
    box-shadow: 0 10px 20px rgb(122 31 53 / 20%);
    cursor: pointer;
    transition:
        transform 160ms ease,
        box-shadow 160ms ease,
        background-color 160ms ease;
}

button:hover:not(:disabled) {
    background: var(--brand-primary-strong);
    box-shadow: 0 14px 26px rgb(122 31 53 / 26%);
    transform: translateY(-1px);
}

button:disabled {
    cursor: not-allowed;
    opacity: 0.58;
    box-shadow: none;
}

input,
select,
textarea {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 0.5rem;
    padding: 0.72rem 0.8rem;
    color: var(--ink);
    background: var(--surface);
    outline: none;
    transition:
        border-color 160ms ease,
        box-shadow 160ms ease;
}

input:focus,
select:focus,
textarea:focus {
    border-color: var(--brand-accent);
    /* O foco usa halo visível para apoiar navegação por teclado sem depender só da cor da borda. */
    box-shadow: 0 0 0 3px var(--focus-ring);
}

.app-kicker {
    margin: 0 0 0.45rem;
    color: var(--brand-accent);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
}

.session-pill {
    max-width: 100%;
    margin: 0;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.45rem 0.75rem;
    color: var(--brand-primary-strong);
    background: rgb(255 255 255 / 74%);
    font-size: 0.9rem;
    overflow-wrap: anywhere;
}

main > h1::before,
section > h1::before {
    content: "";
    flex: 0 0 auto;
    width: 0.55rem;
    height: 1.6rem;
    border-radius: 999px;
    background: linear-gradient(180deg, var(--brand-accent), var(--brand-depth));
}

[role="alert"] {
    border-left: 0.35rem solid var(--brand-accent);
    border-radius: 0.5rem;
    padding: 0.75rem 0.85rem;
    color: var(--brand-primary-strong);
    /* Alertas mantêm fundo suave para serem visíveis sem expor detalhes técnicos ao utilizador. */
    background: var(--brand-blush);
}

[role="status"],
main > p:not([role]),
section > p:not([role]) {
    border-radius: 0.5rem;
    padding: 0.7rem 0.85rem;
    color: var(--brand-primary-strong);
    background: rgb(255 240 242 / 72%);
}
```

5. Explicação do código.

Botões, campos, foco, títulos e mensagens passam a falar a mesma linguagem visual. Isto reduz repetição e evita que cada página escolha uma cor diferente para ações principais, mensagens ou estados.

O botão disabled fica opaco e sem sombra para mostrar que não pode ser usado. O foco usa `box-shadow` para ser mais visível do que uma simples mudança de borda. As mensagens com `role="alert"` e `role="status"` mantêm cores suaves, mas com contraste suficiente para leitura.

Este passo não muda autenticação nem autorização. Por exemplo, `.session-pill` mostra informação de sessão que já vem da app, mas não decide permissões. A segurança real continua no backend e nos guards já criados nos BKs anteriores.

6. Validação do passo.

Abre a app, usa a tecla Tab nos formulários e confirma que cada campo focado tem halo visível. Depois observa um botão ativo, um botão disabled, uma mensagem de erro e uma mensagem de estado.

7. Cenário negativo/erro esperado.

Remove temporariamente o `box-shadow` dos campos em foco e tenta navegar por teclado. O erro esperado é perderes a indicação visual clara do campo ativo. Repõe o `box-shadow` antes de terminar.

### Passo 4 - Criar classes de marca reutilizáveis

1. Objetivo funcional do passo no contexto da app.

Oferecer padrões reutilizáveis para painéis de destaque, faixas de métricas e estados visuais sem criar uma classe para cada página.

2. Ficheiros envolvidos:
    - EDITAR: `real_dev/web/src/styles.css`
    - LOCALIZAÇÃO: acrescentar as classes depois do bloco `article` e antes das listas, para ficarem perto dos estilos de superfície.

3. Instruções do que fazer.

Acrescenta o código abaixo. Usa estas classes em páginas que precisem de destaque visual, mas evita alterar lógica de negócio. A classe deve organizar apresentação; a regra funcional continua no componente ou no backend.

4. Código completo, correto e integrado com a app final.

```css
/* real_dev/web/src/styles.css */
.brand-panel {
    border: 1px solid var(--line);
    border-radius: 0.5rem;
    padding: 1rem;
    color: var(--ink);
    /* O gradiente usa tokens suaves para destacar conteúdo sem parecer uma landing page. */
    background: linear-gradient(180deg, var(--surface), var(--surface-soft));
    box-shadow: var(--shadow-soft);
}

.metric-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 0.75rem;
    margin: 1rem 0;
}

.metric-strip > * {
    min-width: 0;
}

.status-chip {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.28rem 0.6rem;
    color: var(--brand-primary-strong);
    background: var(--brand-blush);
    font-size: 0.86rem;
    font-weight: 700;
    /* O texto pode vir de estados da API, por isso deve quebrar em vez de rebentar o cartão. */
    overflow-wrap: anywhere;
}
```

5. Explicação do código.

`.brand-panel` serve para blocos de destaque, como resumo de perfil, nota administrativa ou explicação curta. `.metric-strip` organiza indicadores em grelha fluida, útil para painéis administrativos e resumo de dados. `.status-chip` normaliza estados curtos sem depender de uma página concreta.

Estas classes são pequenas de propósito. Elas não conhecem carrinho, encomenda, relatório, utilizador ou fotografia; apenas dão forma visual. Assim, podem ser reutilizadas por `BK-MF5-07` sem duplicar CSS.

6. Validação do passo.

Aplica temporariamente `className="status-chip"` a um estado já visível numa página e confirma que o texto cabe no contentor. Depois remove a alteração temporária se não fizer parte da entrega final desse componente.

7. Cenário negativo/erro esperado.

Cria mentalmente uma classe como `.checkout-red-button`. O erro é a classe ficar presa a uma página e a uma cor solta, dificultando reutilização. A correção é usar `.status-chip`, `.brand-panel` ou tokens semânticos.

### Passo 5 - Validar build, contraste e cenários negativos

1. Objetivo funcional do passo no contexto da app.

Confirmar que a marca compila, mantém leitura confortável e não altera comportamento funcional.

2. Ficheiros envolvidos:
    - REVER: `real_dev/web/src/styles.css`
    - REVER: `real_dev/web/package.json`
    - REVER: `real_dev/web/src/App.jsx`
    - LOCALIZAÇÃO: script `build` e interface em desktop/mobile.

3. Instruções do que fazer.

Executa o build do frontend real. Depois faz inspeção visual em desktop e mobile: texto primário, texto secundário, botões, foco, alertas, estados e cartões. Executar cenários negativos obrigatórios (mínimo 2): foco invisível e token antigo sem alias.

4. Código completo, correto e integrado com a app final.

```bash
npm --prefix real_dev/web run build
```

5. Explicação do código.

O comando usa o root operativo desta PAP, `real_dev/web`. O build confirma que Vite consegue compilar a app depois das alterações de CSS. Ele não mede contraste sozinho; por isso a inspeção visual continua obrigatória.

O primeiro negativo é remover o halo de foco e confirmar que a navegação por teclado fica pior. O segundo negativo é remover um alias como `--bordo` e confirmar que seletores antigos podem perder cor. Estes testes ensinam por que o BK mantém foco visível e aliases.

6. Validação do passo.

O build deve terminar sem erro. Na inspeção visual, botões devem continuar legíveis, inputs focados devem mostrar halo, alertas devem ser distinguíveis e a grelha do `BK-MF5-05` deve continuar responsiva.

7. Cenário negativo/erro esperado.

Se a paleta ficar suave demais, o texto secundário ou as mensagens de alerta podem parecer bonitos mas difíceis de ler. O erro esperado é contraste insuficiente; a correção é ajustar tokens, não criar cores soltas em cada página.

#### Expected results

- `real_dev/web/src/styles.css` tem tokens semânticos de marca em `:root`.
- Tokens antigos continuam definidos como aliases para evitar regressões.
- Botões, inputs, foco, títulos, alertas e mensagens de estado usam tokens consistentes.
- `.brand-panel`, `.metric-strip` e `.status-chip` ficam disponíveis para os BKs seguintes.
- A UI mantém estética Orélle sem dependências novas.
- Texto primário, texto secundário e estados visuais ficam legíveis.
- O layout responsivo do `BK-MF5-05` continua intacto.
- `BK-MF5-07` consegue reutilizar os tokens para mensagens e feedback.

#### Critérios de aceite

- Não existem dependências novas.
- Todos os paths deste BK apontam para `real_dev/web`.
- `styles.css` define `--brand-primary`, `--brand-primary-strong`, `--brand-accent`, `--brand-depth`, `--brand-blush`, `--brand-powder`, `--focus-ring` e `--shadow-soft`.
- `styles.css` mantém aliases para `--bordo`, `--bordo-dark`, `--wine`, `--plum`, `--blush`, `--powder` e `--shadow`.
- Estados de foco e disabled são visíveis.
- A marca não altera permissões, endpoints, payloads, sessão ou regras de negócio.
- Cenários negativos concluídos: mínimo `2` com resultado controlado.

#### Validação final

### Matriz mínima de testes por prioridade

- `P1`: build frontend, inspeção visual desktop/mobile, foco por teclado e 2 negativos.
- [ ] Build: `npm --prefix real_dev/web run build` termina sem erro.
- [ ] Foco: campos `input`, `select` e `textarea` mostram halo visível.
- [ ] Botões: ativo, hover e disabled são distinguíveis.
- [ ] Mensagens: `role="alert"` e `role="status"` ficam legíveis.
- [ ] Compatibilidade: tokens antigos continuam definidos como aliases.
- [ ] Negativos: mínimo `2` cenários com resultado observado e corrigido.

Erros comuns a evitar:

- Apagar aliases antigos antes de migrar todos os seletores.
- Criar uma cor por página em vez de usar tokens.
- Validar apenas o build e esquecer a inspeção visual.
- Alterar lógica de autenticação, autorização ou checkout num BK de design.

#### Evidence para PR/defesa

- Output de `npm --prefix real_dev/web run build`.
- Captura de ecrã de formulário com foco visível.
- Captura de ecrã de painel com `.status-chip` ou `.brand-panel`.
- Nota curta de revisão de contraste em desktop e mobile.
- Evidência de testes por camada: build frontend, inspeção visual, foco por teclado e negativos documentados.

#### Handoff

`BK-MF5-07` deve reutilizar estes tokens para mensagens claras, feedback imediato e estados acessíveis, sem voltar a inventar estilos por página. `BK-MF5-08` deve trocar valores dos tokens para tema escuro e contraste ajustado, preservando as mesmas classes e sem duplicar lógica visual.

#### Changelog

- `2026-06-20`: guia corrigido para `real_dev/web`, tokens compatíveis com o CSS real, comentários didáticos nos blocos CSS, validação por build do frontend real, matriz mínima de testes e acentuação corrigida.
