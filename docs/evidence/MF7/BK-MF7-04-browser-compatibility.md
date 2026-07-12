<!-- A evidence separa browsers e fluxos para provar compatibilidade sem prometer pixel-perfect. -->
# Evidence BK-MF7-04 - Compatibilidade

> **Nota de atualização (2026-07-11):** esta página preserva a evidence histórica abaixo, mas as alegações manuais originais não constituem o estado atual. A bateria automatizada vigente executa Playwright em Chromium, Firefox e WebKit. Safari e Edge reais continuam a exigir validação manual externa e não podem ser declarados `PASS` sem registo datado, versão do browser, plataforma e resultados por fluxo. Para o estado consolidado, consultar o [plano canónico da consulta OpenAI](../../planificacao/PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md).

## Estado atual verificável

- Automatizado: Chromium, Firefox e WebKit através do orquestrador isolado `npm --prefix real_dev/api run test:e2e`.
- Manual externo pendente: Safari real e Edge real.
- O motor WebKit automatizado reduz risco de compatibilidade, mas não é prova de uma sessão manual no Safari.
- O motor Chromium automatizado não substitui uma sessão manual no Edge.

## Regra de fecho

O BK só pode alegar compatibilidade automatizada nos três engines. Safari/Edge reais permanecem `BLOQUEADO_EXTERNO` ou pendentes enquanto não existir evidence manual atual; a ausência dessa evidence nunca é convertida em `PASS`.

## Comandos
- `npm --prefix real_dev/api run test:e2e`
- `npm --prefix real_dev/web run smoke:mf7-compat`
- `npm --prefix real_dev/web run build`

## Browsers testados

> Registo histórico anterior, substituído pela secção “Estado atual verificável”.

- Chrome: login, upload facial, pedido de privacidade, exportação, checkout.
- Safari: login, upload facial, pedido de privacidade, exportação, checkout.
- Edge: login, upload facial, pedido de privacidade, exportação, checkout.
- Firefox: login, upload facial, pedido de privacidade, exportação, checkout.

## Resultado
- Sem ramificações por nome de browser.
- Build Vite concluído.
- Fluxos críticos validados manualmente.
