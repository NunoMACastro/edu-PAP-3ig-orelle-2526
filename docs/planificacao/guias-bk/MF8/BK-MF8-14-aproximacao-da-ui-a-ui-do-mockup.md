# BK-MF8-14 - Aproximação da UI à UI do mockup

## Header
- `doc_id`: `GUIA-BK-MF8-14`
- `bk_id`: `BK-MF8-14`
- `macro`: `MF8`
- `owner`: `Aline`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `ACEITE_RISCO`
- `esforco`: `M`
- `dependencias`: `BK-MF5-05, BK-MF5-06, BK-MF5-07, BK-MF8-13`
- `rf_rnf`: `RNF26`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-15`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md`
- `last_updated`: `2026-07-11`

> **Decisão vigente:** existe uma referência visual no checkout, mas não existe confirmação de versão aprovada nem revisão manual comparativa. Por decisão do projeto académico/local, essa validação é passada à frente e o requisito fica `ACEITE_RISCO`. Build, Playwright, Axe, viewports e budgets provam qualidade técnica; não provam paridade pixel-perfect. Não se inventam screenshots ou aprovação.

#### Objetivo

Aplicar um acabamento coerente e acessível às rotas canónicas da consulta, preservando o fluxo OpenAI-only, o paywall real no servidor e a separação de roles.

#### Importância

A apresentação ajuda o utilizador a compreender consentimento, espera, revisão, pagamento simulado e limitações. O acabamento não pode esconder estados nem transformar uma pré-visualização gerada por IA numa promessa de resultado.

#### Scope-in

- Hierarquia visual comum nas páginas de consulta.
- Responsive sem overflow a 320, 375, 768 e 1280 px.
- Skip-link, um único `main`, foco após navegação e focus trap.
- Touch targets de 44 × 44 px e contraste mínimo 4,5:1.
- `prefers-reduced-motion` e estados não transmitidos apenas por cor.
- Imagens responsivas AVIF/WebP com dimensões explícitas.
- Comparação lado a lado da fotografia original e makeup OpenAI.
- Títulos por rota e linguagem de produto.

#### Scope-out

- Não alegar aprovação manual do artefacto visual.
- Não alterar endpoints, roles ou regras de desbloqueio.
- Não criar uma cara genérica, SVG ilustrativo ou “pele futura”.
- Não guardar fotografias ou landmarks no browser.
- Não executar edição de imagem antes do unlock e consentimento específico.

#### Estado antes e depois

- Antes: o fluxo podia ter layout fragmentado, copy interna e uma simulação genérica.
- Depois: as rotas partilham componentes e estados visuais consistentes; o preview de maquilhagem usa a fotografia consentida e inclui aviso explícito.

#### Pre-requisitos

- Rotas do `BK-MF8-13` funcionais.
- Tokens e componentes comuns da MF5.
- Endpoint de imagem autenticado e `no-store`.
- Decisão `ACEITE_RISCO` registada para a validação manual dispensada.

#### Glossário

- **Responsive:** layout que se adapta sem esconder funcionalidade.
- **Focus trap:** confinamento de foco dentro de um modal aberto.
- **CLS/LCP:** métricas de estabilidade e carregamento visual.
- **Preview OpenAI:** edição fotográfica consentida, não previsão clínica.
- **Risco aceite:** ausência conhecida que não é apresentada como sucesso.

#### Conceitos teóricos essenciais

Acessibilidade não é uma camada final de CSS. Estrutura semântica, ordem de foco, nomes de controlos e mensagens de erro pertencem aos componentes. A validação automatizada encontra parte dos problemas; navegação por teclado continua a ser um cenário obrigatório.

O preview de maquilhagem altera apenas a aparência pedida no `simulationSpec` congelado. Deve preservar identidade, estrutura facial, cabelo, fundo e características naturais, mostrando sempre original e resultado.

#### Arquitetura do BK

- `AppLayouts.jsx` fornece skip-link, menu por role e um `main`.
- Componentes de consulta reutilizam notices, cards, dialogs e estados assíncronos.
- `ConsultationReportPage` mostra teaser, relatório e preview sem páginas paralelas.
- CSS usa breakpoints pequenos, motion reduzido e dimensões de imagem.
- Testes Playwright cobrem viewports, teclado, Axe e conteúdo bloqueado.

#### Ficheiros a criar/editar/rever

- REVER: `apps/web/src/components/AppLayouts.jsx`
- REVER: `apps/web/src/features/consultation/*.jsx`
- REVER: `apps/web/src/styles.css`
- REVER: `apps/web/src/services/routePresentation.js`
- REVER: `apps/web/src/assets/`
- REVER: `apps/web/tests/e2e/`
- CRIAR/REVER: testes de acessibilidade, responsive e budgets.

#### Tutorial técnico linear

### Passo 1 - Inventariar os estados reais

Revê loading, vazio, erro, retry, pergunta ativa, revisão pendente, bloqueado, desbloqueado, voucher e preview. Remove copy de implementação, referências a IDs, nomes de BKs e qualquer badge de simulação de IA.

### Passo 2 - Unificar estrutura e foco

Garante skip-link, um `main` e foco no título após cada navegação. Modais de confirmação usam focus trap, Escape e devolução do foco ao controlo de origem.

### Passo 3 - Corrigir responsive e imagens

Testa desde 320 px. Usa `picture`, `srcset`, `sizes`, largura/altura e fallback. A imagem crítica pode ser eager; as restantes mantêm lazy loading.

### Passo 4 - Respeitar motion e contraste

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        scroll-behavior: auto !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

.consultation-action {
    min-width: 44px;
    min-height: 44px;
}
```

### Passo 5 - Apresentar o preview OpenAI com honestidade

Mostra original e resultado lado a lado, ambos através de endpoints autenticados. Usa o aviso “Pré-visualização gerada por IA — o resultado real poderá variar”. Não chama à imagem análise, antes/depois ou evolução da pele.

### Passo 6 - Medir budgets e acessibilidade

Valida LCP ≤ 3 s, CLS ≤ 0,1, JS inicial comprimido ≤ 200 KiB, thumbnail ≤ 120 KiB e imagem crítica ≤ 300 KiB no perfil definido. Executa Axe nas rotas principais e verifica overflow nos quatro viewports.

### Passo 7 - Executar cenários negativos obrigatórios (mínimo 3)

1. Abrir cada rota a 320 px e falhar o teste se existir overflow horizontal.
2. Navegar apenas por teclado, incluindo modal e conversa.
3. Ativar motion reduzido e confirmar ausência de animações longas.
4. Inspecionar preview e confirmar aviso, ownership e ausência de SVG/cara genérica.

#### Expected results

- Consulta legível e navegável em todos os viewports definidos.
- Axe sem violações serious/critical nas rotas principais.
- Preview usa apenas fotografia consentida e relatório desbloqueado.
- Nenhum estado depende apenas de cor.
- A dispensa manual continua explicitamente marcada como risco aceite.

#### Critérios de aceite

- Sem overflow e com touch targets adequados.
- Foco e teclado cobrem fluxo integral.
- Budgets medidos com metodologia reproduzível.
- Preview real, autenticado e honestamente identificado.
- Cenarios negativos concluídos: mínimo `3`.
- Evidencia de testes por camada: componente, E2E, Axe e performance.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P0 | E2E/Axe | Rotas principais sem violações serious/critical |
| P0 | Responsive | 320/375/768/1280 sem overflow |
| P1 | Performance | LCP, CLS, JS e imagens dentro dos budgets |

#### Validação final

- [ ] Um único `main` e skip-link funcional.
- [ ] Focus trap e retorno de foco comprovados.
- [ ] Axe e viewports verdes.
- [ ] Preview OpenAI inclui original, resultado e aviso.
- [ ] Negativos: mínimo `3` cenários.
- [ ] Validação manual dispensada continua `ACEITE_RISCO`.

#### Evidence para PR/defesa

- Outputs automatizados de Axe, viewports e budgets.
- Screenshots apenas quando realmente gerados pelo runner e sem PII.
- Lista de desvios conhecidos da referência visual.
- Prova estática da remoção da preview genérica.

#### Handoff

O `BK-MF8-15` inventaria os testes existentes e cria as coberturas em falta, sem converter o risco visual aceite em `PASS` manual.

## Bloco pedagogico

### Objetivo

Relacionar acabamento visual com acessibilidade, performance e comunicação honesta sobre IA.

### Pre-requisitos

Rever HTML semântico, CSS responsive, foco, imagens responsivas e Playwright.

### Erros comuns

- Confundir ausência de overflow com acessibilidade completa.
- Guardar imagens no storage do browser.
- Chamar “resultado” a uma previsão que não existe.
- Inventar aprovação visual.

### Check de compreensao

1. O que os testes Axe não conseguem provar?
2. Por que se mostra a fotografia original?
3. Como se regista uma validação manual dispensada?

## Bloco operacional

### Entrada

Fluxo integrado funcional, referência visual disponível e decisão de risco aceite.

### Passos

Inventariar, estruturar, estilizar, otimizar, medir e testar.

### Validacao

Executar unitários/componentes, build, Playwright, Axe e page budgets.

### Handoff

Entregar UI tecnicamente validada e uma limitação visual documentada sem alegações falsas.

## Criterios de aceite

- Responsive, acessibilidade e budgets reproduzíveis.
- Preview OpenAI substitui a representação genérica.
- Validação manual não é inventada.
- Cenarios negativos concluidos: minimo `3`.
- Evidencia de testes por camada registada.

## Evidence para PR/defesa

Apresentar os gates técnicos, o aviso de preview e a decisão `ACEITE_RISCO` como resultados distintos.

## Snippet tecnico aplicavel

```sh
npm --prefix apps/web run test:e2e
npm --prefix apps/web run build
```

#### Changelog

- `2026-07-11`: acabamento alinhado com as rotas OpenAI-only, preview fotográfico real, acessibilidade/budgets e risco visual aceite sem prova inventada.
