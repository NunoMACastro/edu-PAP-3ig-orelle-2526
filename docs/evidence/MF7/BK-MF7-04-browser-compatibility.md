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