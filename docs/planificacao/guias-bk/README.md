# GUIAS-BK-README

## Header
- `doc_id`: `GUIAS-BK-README`
- `path`: `docs/planificacao/guias-bk/README.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-14`

## Estado de cobertura por fase
| Fase | Macros | BK totais | Guias existentes | Cobertura |
| --- | --- | --- | --- | --- |
| Fase 1 | MF0, MF1, MF2 | 24 | 24 | 100% |
| Fase 2 | MF3, MF4, MF5 | 24 | 24 | 100% |
| Fase 3 | MF6, MF7, MF8 | 21 | 21 | 100% |

## Contrato editorial
Todos os guias seguem `_TEMPLATE-BK.md` com:
- header canónico completo (16 campos),
- bloco pedagogico + bloco operacional,
- snippet tecnico aplicavel,
- criterios mensuraveis,
- evidence e handoff coerente.

## Ordem de leitura
1. `../backlogs/MATRIZ-CANONICA-BK.md`
2. `../backlogs/BACKLOG-MVP.md`
3. `../backlogs/MF-VIEWS.md`
4. Guias BK por macro (`MF0..MF8`)

## Indice completo por macro
### MF0
- [BK-MF0-01 - Registo de utilizadores com email e password.](MF0/BK-MF0-01-registo-de-utilizadores-com-email-e-password.md)
- [BK-MF0-02 - Login e logout com sessão segura (cookie HttpOnly).](MF0/BK-MF0-02-login-e-logout-com-sessao-segura-cookie-httponly.md)
- [BK-MF0-03 - Criação de perfil personalizado com nome, idade, tipo de pele, género e objetivos (ex: hidratar, antiacne).](MF0/BK-MF0-03-criacao-de-perfil-personalizado-com-nome-idade-tipo-de-pele-genero-e-objetivos-ex-hidratar-antiacne.md)
- [BK-MF0-04 - Possibilidade de editar o perfil e atualizar fotografias periodicamente.](MF0/BK-MF0-04-possibilidade-de-editar-o-perfil-e-atualizar-fotografias-periodicamente.md)
- [BK-MF0-05 - Criação de roles: Cliente, Consultor, Administrador.](MF0/BK-MF0-05-criacao-de-roles-cliente-consultor-administrador.md)
- [BK-MF0-06 - Cada utilizador pode guardar preferências de produtos e marcas favoritas.](MF0/BK-MF0-06-cada-utilizador-pode-guardar-preferencias-de-produtos-e-marcas-favoritas.md)
- [BK-MF0-07 - Registar produtos com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock.](MF0/BK-MF0-07-registar-produtos-com-nome-descricao-ingredientes-tipo-de-pele-indicado-imagem-preco-e-stock.md)
- [BK-MF0-08 - Associar categorias (limpeza, maquilhagem, tratamento, protetor solar, etc.).](MF0/BK-MF0-08-associar-categorias-limpeza-maquilhagem-tratamento-protetor-solar-etc.md)

### MF1
- [BK-MF1-01 - Permitir pesquisa e filtragem por categoria, preço, tipo de pele, marca.](MF1/BK-MF1-01-permitir-pesquisa-e-filtragem-por-categoria-preco-tipo-de-pele-marca.md)
- [BK-MF1-02 - Página de detalhes do produto com descrição completa, imagem, notas de utilizadores e recomendações.](MF1/BK-MF1-02-pagina-de-detalhes-do-produto-com-descricao-completa-imagem-notas-de-utilizadores-e-recomendacoes.md)
- [BK-MF1-03 - Permitir ao cliente avaliar produtos (1–5 estrelas) e deixar comentários.](MF1/BK-MF1-03-permitir-ao-cliente-avaliar-produtos-1-5-estrelas-e-deixar-comentarios.md)
- [BK-MF1-04 - Mostrar produtos semelhantes e complementares (“quem comprou isto também comprou…”).](MF1/BK-MF1-04-mostrar-produtos-semelhantes-e-complementares-quem-comprou-isto-tambem-comprou.md)
- [BK-MF1-05 - Permitir upload de fotografias do rosto (frontal e perfil).](MF1/BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md)
- [BK-MF1-06 - O sistema deve analisar as fotos com IA para detetar tipo de pele, acne, manchas, rugas e oleosidade.](MF1/BK-MF1-06-o-sistema-deve-analisar-as-fotos-com-ia-para-detetar-tipo-de-pele-acne-manchas-rugas-e-oleosidade.md)
- [BK-MF1-07 - Gerar um relatório personalizado com diagnóstico e sugestões de rotina.](MF1/BK-MF1-07-gerar-um-relatorio-personalizado-com-diagnostico-e-sugestoes-de-rotina.md)
- [BK-MF1-08 - A análise deve ser guardada no histórico pessoal para futuras comparações.](MF1/BK-MF1-08-a-analise-deve-ser-guardada-no-historico-pessoal-para-futuras-comparacoes.md)

### MF2
- [BK-MF2-01 - O utilizador pode consultar evolução da pele ao longo do tempo através de gráficos.](MF2/BK-MF2-01-o-utilizador-pode-consultar-evolucao-da-pele-ao-longo-do-tempo-atraves-de-graficos.md)
- [BK-MF2-02 - Com base na análise e histórico, o sistema recomenda produtos personalizados para o utilizador.](MF2/BK-MF2-02-com-base-na-analise-e-historico-o-sistema-recomenda-produtos-personalizados-para-o-utilizador.md)
- [BK-MF2-03 - As recomendações devem indicar motivo da sugestão (ex: “ajuda a reduzir oleosidade”).](MF2/BK-MF2-03-as-recomendacoes-devem-indicar-motivo-da-sugestao-ex-ajuda-a-reduzir-oleosidade.md)
- [BK-MF2-04 - O utilizador pode marcar recomendações como “úteis” ou “não relevantes” para treinar o modelo.](MF2/BK-MF2-04-o-utilizador-pode-marcar-recomendacoes-como-uteis-ou-nao-relevantes-para-treinar-o-modelo.md)
- [BK-MF2-05 - O sistema deve sugerir rotinas diárias (manhã / noite) com base nos produtos adquiridos.](MF2/BK-MF2-05-o-sistema-deve-sugerir-rotinas-diarias-manha-noite-com-base-nos-produtos-adquiridos.md)
- [BK-MF2-06 - Consultores podem rever recomendações e sugerir ajustes manuais.](MF2/BK-MF2-06-consultores-podem-rever-recomendacoes-e-sugerir-ajustes-manuais.md)
- [BK-MF2-07 - Permitir simular aplicação de maquilhagem virtual com base na fotografia enviada.](MF2/BK-MF2-07-permitir-simular-aplicacao-de-maquilhagem-virtual-com-base-na-fotografia-enviada.md)
- [BK-MF2-08 - A IA deve gerar uma visualização antes/depois com os produtos recomendados.](MF2/BK-MF2-08-a-ia-deve-gerar-uma-visualizacao-antes-depois-com-os-produtos-recomendados.md)

### MF3
- [BK-MF3-01 - O sistema deve permitir comparar imagens (antes vs após 30 dias de uso).](MF3/BK-MF3-01-o-sistema-deve-permitir-comparar-imagens-antes-vs-apos-30-dias-de-uso.md)
- [BK-MF3-02 - Adicionar/remover produtos do carrinho de compras.](MF3/BK-MF3-02-adicionar-remover-produtos-do-carrinho-de-compras.md)
- [BK-MF3-03 - Registar encomendas e pagamentos (gateway Stripe/PayPal/MBWay).](MF3/BK-MF3-03-registar-encomendas-e-pagamentos-gateway-stripe-paypal-mbway.md)
- [BK-MF3-04 - Histórico de compras com data, total, produtos e estado (pendente, enviado, entregue).](MF3/BK-MF3-04-historico-de-compras-com-data-total-produtos-e-estado-pendente-enviado-entregue.md)
- [BK-MF3-05 - Permitir devoluções ou trocas com registo do motivo.](MF3/BK-MF3-05-permitir-devolucoes-ou-trocas-com-registo-do-motivo.md)
- [BK-MF3-06 - O cliente pode recomprar produtos anteriores com um clique.](MF3/BK-MF3-06-o-cliente-pode-recomprar-produtos-anteriores-com-um-clique.md)
- [BK-MF3-07 - Dashboard de estatísticas (vendas, produtos mais vendidos, utilizadores ativos).](MF3/BK-MF3-07-dashboard-de-estatisticas-vendas-produtos-mais-vendidos-utilizadores-ativos.md)
- [BK-MF3-08 - Gestão de stock (alertas de baixo stock, atualização automática após compra).](MF3/BK-MF3-08-gestao-de-stock-alertas-de-baixo-stock-atualizacao-automatica-apos-compra.md)

### MF4
- [BK-MF4-01 - Gestão de utilizadores (ativar, suspender, eliminar contas).](MF4/BK-MF4-01-gestao-de-utilizadores-ativar-suspender-eliminar-contas.md)
- [BK-MF4-02 - Moderação de comentários e avaliações.](MF4/BK-MF4-02-moderacao-de-comentarios-e-avaliacoes.md)
- [BK-MF4-03 - Exportação de dados para Excel/PDF (vendas, relatórios de IA, utilizadores).](MF4/BK-MF4-03-exportacao-de-dados-para-excel-pdf-vendas-relatorios-de-ia-utilizadores.md)
- [BK-MF4-04 - Enviar notificações sobre promoções, novos produtos e estado das encomendas.](MF4/BK-MF4-04-enviar-notificacoes-sobre-promocoes-novos-produtos-e-estado-das-encomendas.md)
- [BK-MF4-05 - Enviar alertas personalizados (“Está na hora da sua rotina noturna”).](MF4/BK-MF4-05-enviar-alertas-personalizados-esta-na-hora-da-sua-rotina-noturna.md)
- [BK-MF4-06 - Sistema de mensagens entre cliente e consultor (chat interno).](MF4/BK-MF4-06-sistema-de-mensagens-entre-cliente-e-consultor-chat-interno.md)
- [BK-MF4-07 - Configuração de preferências de comunicação (email, app, push).](MF4/BK-MF4-07-configuracao-de-preferencias-de-comunicacao-email-app-push.md)
- [BK-MF4-08 - Guardar alergias, ingredientes a evitar e restrições médicas leves no perfil e impedir recomendações que violem regras.](MF4/BK-MF4-08-guardar-alergias-ingredientes-a-evitar-e-restricoes-medicas-leves-no-perfil-e-impedir-recomendacoes-que-violem-regras.md)

### MF5
- [BK-MF5-01 - Painel para consultores/admins reverem e aprovarem pedidos de eliminação/anonymização de fotografias e relatórios.](MF5/BK-MF5-01-painel-para-consultores-admins-reverem-e-aprovarem-pedidos-de-eliminacao-anonymizacao-de-fotografias-e-relatorios.md)
- [BK-MF5-02 - Gestão de campanhas e storytelling (banner, segmento, período, consultor responsável).](MF5/BK-MF5-02-gestao-de-campanhas-e-storytelling-banner-segmento-periodo-consultor-responsavel.md)
- [BK-MF5-03 - Configurar e aplicar códigos promocionais com limites por cliente, canal e datas.](MF5/BK-MF5-03-configurar-e-aplicar-codigos-promocionais-com-limites-por-cliente-canal-e-datas.md)
- [BK-MF5-04 - Registo/auditoria de acessos a dados biométricos, com alertas para usos indevidos.](MF5/BK-MF5-04-registo-auditoria-de-acessos-a-dados-biometricos-com-alertas-para-usos-indevidos.md)
- [BK-MF5-05 - Interface moderna, intuitiva e _responsive_ (desktop e mobile).](MF5/BK-MF5-05-interface-moderna-intuitiva-e-responsive-desktop-e-mobile.md)
- [BK-MF5-06 - Design coerente com estética da marca (cores suaves, tipografia moderna).](MF5/BK-MF5-06-design-coerente-com-estetica-da-marca-cores-suaves-tipografia-moderna.md)
- [BK-MF5-07 - Mensagens claras, ícones acessíveis e feedback imediato em formulários.](MF5/BK-MF5-07-mensagens-claras-icones-acessiveis-e-feedback-imediato-em-formularios.md)
- [BK-MF5-08 - Modo escuro e contraste ajustado.](MF5/BK-MF5-08-modo-escuro-e-contraste-ajustado.md)

### MF6
- [BK-MF6-01 - Processar análise de fotografia em menos de 10 segundos.](MF6/BK-MF6-01-processar-analise-de-fotografia-em-menos-de-10-segundos.md)
- [BK-MF6-02 - Páginas principais devem carregar em ≤ 3 segundos.](MF6/BK-MF6-02-paginas-principais-devem-carregar-em-3-segundos.md)
- [BK-MF6-03 - Suportar mínimo 50 utilizadores simultâneos sem falhas.](MF6/BK-MF6-03-suportar-minimo-50-utilizadores-simultaneos-sem-falhas.md)
- [BK-MF6-04 - Imagens otimizadas (lazy loading e compressão automática).](MF6/BK-MF6-04-imagens-otimizadas-lazy-loading-e-compressao-automatica.md)
- [BK-MF6-05 - Todas as comunicações via HTTPS (TLS 1.2+).](MF6/BK-MF6-05-todas-as-comunicacoes-via-https-tls-1-2.md)
- [BK-MF6-06 - Palavras-passe com hash seguro (bcrypt).](MF6/BK-MF6-06-palavras-passe-com-hash-seguro-bcrypt.md)
- [BK-MF6-07 - Fotografias e relatórios de análise armazenados de forma encriptada.](MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md)

### MF7
- [BK-MF7-01 - Consentimento explícito para análise facial (RGPD).](MF7/BK-MF7-01-consentimento-explicito-para-analise-facial-rgpd.md)
- [BK-MF7-02 - Direito a eliminar conta e dados (incluindo fotos).](MF7/BK-MF7-02-direito-a-eliminar-conta-e-dados-incluindo-fotos.md)
- [BK-MF7-03 - Sessões autenticadas com cookies HttpOnly.](MF7/BK-MF7-03-sessoes-autenticadas-com-cookies-httponly.md)
- [BK-MF7-04 - Compatível com Chrome, Safari, Edge e Firefox.](MF7/BK-MF7-04-compativel-com-chrome-safari-edge-e-firefox.md)
- [BK-MF7-05 - Exportação de relatórios em PDF.](MF7/BK-MF7-05-exportacao-de-relatorios-em-pdf.md)
- [BK-MF7-06 - Integração com gateways de pagamento (Stripe, PayPal, MBWay).](MF7/BK-MF7-06-integracao-com-gateways-de-pagamento-stripe-paypal-mbway.md)
- [BK-MF7-07 - Suporte para API de IA externa (ex: Azure Face API ou TensorFlow).](MF7/BK-MF7-07-suporte-para-api-de-ia-externa-ex-azure-face-api-ou-tensorflow.md)

### MF8
- [BK-MF8-01 - Código modular (MVC) com documentação e _docstrings_.](MF8/BK-MF8-01-codigo-modular-mvc-com-documentacao-e-docstrings.md)
- [BK-MF8-02 - Logs de erros e métricas de desempenho.](MF8/BK-MF8-02-logs-de-erros-e-metricas-de-desempenho.md)
- [BK-MF8-03 - Base de dados com backups automáticos diários.](MF8/BK-MF8-03-base-de-dados-com-backups-automaticos-diarios.md)
- [BK-MF8-04 - Ambiente de testes separado do ambiente de produção.](MF8/BK-MF8-04-ambiente-de-testes-separado-do-ambiente-de-producao.md)
- [BK-MF8-05 - A IA deve indicar como chegou às recomendações (explicabilidade).](MF8/BK-MF8-05-a-ia-deve-indicar-como-chegou-as-recomendacoes-explicabilidade.md)
- [BK-MF8-06 - O sistema deve garantir não discriminação por género, idade ou tom de pele.](MF8/BK-MF8-06-o-sistema-deve-garantir-nao-discriminacao-por-genero-idade-ou-tom-de-pele.md)
- [BK-MF8-07 - As imagens processadas não devem ser usadas para treinar modelos externos sem consentimento.](MF8/BK-MF8-07-as-imagens-processadas-nao-devem-ser-usadas-para-treinar-modelos-externos-sem-consentimento.md)

## Changelog
- `2026-04-12`: indice inicial dos guias BK Orelle.
- `2026-04-14`: indice atualizado para naming semantico e contrato canónico comum.
