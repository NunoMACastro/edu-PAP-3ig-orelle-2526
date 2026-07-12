# GUIAS-BK-README

## Header
- `doc_id`: `GUIAS-BK-README`
- `path`: `docs/planificacao/guias-bk/README.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-07-11`

## Estado de cobertura por fase
| Fase | Macros | BK totais | Guias existentes | Cobertura |
| --- | --- | --- | --- | --- |
| Fase 1 | MF0, MF1, MF2 | 24 | 24 | 100% |
| Fase 2 | MF3, MF4, MF5 | 19 | 19 | 100% |
| Fase 3 | MF6, MF7, MF8 | 31 | 31 | 100% |

## Contrato editorial
Todos os guias seguem `_TEMPLATE-BK.md` com:
- header canónico completo (16 campos),
- bloco pedagogico + bloco operacional,
- snippet tecnico aplicavel,
- criterios mensuraveis,
- evidence e handoff coerente.

Os guias do núcleo IA devem ser lidos como um único fluxo OpenAI-only: sete objetivos, consentimento v2, fotografia/qualidade, 5–8 perguntas, jobs retomáveis, catálogo allowlisted, relatório v2, revisão/freeze, 10% simulado/voucher e edição `gpt-image-2`. Os nomes históricos dos ficheiros são preservados para não quebrar links; o título e o contrato dentro de cada guia são canónicos.

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
- [BK-MF1-05 - Recolher frontal e perfil com consentimento e controlo de qualidade.](MF1/BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md)
- [BK-MF1-06 - Analisar fotografias exclusivamente com OpenAI no job da consulta cosmética.](MF1/BK-MF1-06-o-sistema-deve-analisar-as-fotos-com-ia-para-detetar-tipo-de-pele-acne-manchas-rugas-e-oleosidade.md)
- [BK-MF1-07 - Gerar relatório OpenAI v2, revisão/freeze e desbloqueio simulado de 10% com voucher.](MF1/BK-MF1-07-gerar-um-relatorio-personalizado-com-diagnostico-e-sugestoes-de-rotina.md)
- [BK-MF1-08 - Guardar histórico próprio sem expor relatórios bloqueados.](MF1/BK-MF1-08-a-analise-deve-ser-guardada-no-historico-pessoal-para-futuras-comparacoes.md)

### MF2
- [BK-MF2-01 - O utilizador pode consultar evolução da pele ao longo do tempo através de gráficos.](MF2/BK-MF2-01-o-utilizador-pode-consultar-evolucao-da-pele-ao-longo-do-tempo-atraves-de-graficos.md)
- [BK-MF2-02 - Gerar no relatório recomendações de produtos/variantes validados.](MF2/BK-MF2-02-com-base-na-analise-e-historico-o-sistema-recomenda-produtos-personalizados-para-o-utilizador.md)
- [BK-MF2-03 - Explicar motivo, utilização e cautelas das recomendações.](MF2/BK-MF2-03-as-recomendacoes-devem-indicar-motivo-da-sugestao-ex-ajuda-a-reduzir-oleosidade.md)
- [BK-MF2-04 - Registar feedback sobre recomendações úteis ou não relevantes, sem treino automático.](MF2/BK-MF2-04-o-utilizador-pode-marcar-recomendacoes-como-uteis-ou-nao-relevantes-para-treinar-o-modelo.md)
- [BK-MF2-05 - Sugerir rotina do relatório com instruções e cautelas.](MF2/BK-MF2-05-o-sistema-deve-sugerir-rotinas-diarias-manha-noite-com-base-nos-produtos-adquiridos.md)
- [BK-MF2-06 - Rever opcionalmente o relatório e preservar `machineResult`.](MF2/BK-MF2-06-consultores-podem-rever-recomendacoes-e-sugerir-ajustes-manuais.md)
- [BK-MF2-07 - Gerar edição OpenAI de maquilhagem após desbloqueio.](MF2/BK-MF2-07-permitir-simular-aplicacao-de-maquilhagem-virtual-com-base-na-fotografia-enviada.md)
- [BK-MF2-08 - Mostrar original e preview OpenAI lado a lado.](MF2/BK-MF2-08-a-ia-deve-gerar-uma-visualizacao-antes-depois-com-os-produtos-recomendados.md)

### MF3
- [BK-MF3-01 - O sistema deve permitir comparar imagens (antes vs após 30 dias de uso).](MF3/BK-MF3-01-o-sistema-deve-permitir-comparar-imagens-antes-vs-apos-30-dias-de-uso.md)
- [BK-MF3-02 - Adicionar/remover produtos do carrinho de compras.](MF3/BK-MF3-02-adicionar-remover-produtos-do-carrinho-de-compras.md)
- [BK-MF3-03 - Registar encomendas com o método único Pagamento simulado.](MF3/BK-MF3-03-registar-encomendas-com-pagamento-simulado.md)
- [BK-MF3-04 - Histórico de compras com data, total, produtos e estado (pendente, enviado, entregue).](MF3/BK-MF3-04-historico-de-compras-com-data-total-produtos-e-estado-pendente-enviado-entregue.md)
- [BK-MF3-06 - O cliente pode recomprar produtos anteriores com um clique.](MF3/BK-MF3-06-o-cliente-pode-recomprar-produtos-anteriores-com-um-clique.md)
- [BK-MF3-07 - Dashboard de estatísticas (vendas, produtos mais vendidos, utilizadores ativos).](MF3/BK-MF3-07-dashboard-de-estatisticas-vendas-produtos-mais-vendidos-utilizadores-ativos.md)
- [BK-MF3-08 - Gestão de stock (alertas de baixo stock, atualização automática após compra).](MF3/BK-MF3-08-gestao-de-stock-alertas-de-baixo-stock-atualizacao-automatica-apos-compra.md)

### MF4
- [BK-MF4-01 - Gestão de utilizadores (ativar, suspender e desativar reversivelmente; eliminação terminal só pelo titular).](MF4/BK-MF4-01-gestao-de-utilizadores-ativar-suspender-eliminar-contas.md)
- [BK-MF4-02 - Moderação de comentários e avaliações.](MF4/BK-MF4-02-moderacao-de-comentarios-e-avaliacoes.md)
- [BK-MF4-03 - Exportação administrativa para Excel/PDF, com relatórios IA apenas em metadados.](MF4/BK-MF4-03-exportacao-de-dados-para-excel-pdf-vendas-relatorios-de-ia-utilizadores.md)
- [BK-MF4-04 - Enviar notificações sobre promoções, novos produtos e estado das encomendas.](MF4/BK-MF4-04-enviar-notificacoes-sobre-promocoes-novos-produtos-e-estado-das-encomendas.md)
- [BK-MF4-05 - Enviar alertas personalizados (“Está na hora da sua rotina noturna”).](MF4/BK-MF4-05-enviar-alertas-personalizados-esta-na-hora-da-sua-rotina-noturna.md)
- [BK-MF4-08 - Guardar alergias, ingredientes a evitar e restrições médicas leves no perfil e impedir recomendações que violem regras.](MF4/BK-MF4-08-guardar-alergias-ingredientes-a-evitar-e-restricoes-medicas-leves-no-perfil-e-impedir-recomendacoes-que-violem-regras.md)

### MF5
- [BK-MF5-01 - Painel administrativo para rever, decidir e repetir pedidos de eliminação/anonymização de fotografias e relatórios.](MF5/BK-MF5-01-painel-para-consultores-admins-reverem-e-aprovarem-pedidos-de-eliminacao-anonymizacao-de-fotografias-e-relatorios.md)
- [BK-MF5-04 - Registo/auditoria de acessos a dados biométricos, com alertas para usos indevidos.](MF5/BK-MF5-04-registo-auditoria-de-acessos-a-dados-biometricos-com-alertas-para-usos-indevidos.md)
- [BK-MF5-05 - Interface moderna, intuitiva e _responsive_ (desktop e mobile).](MF5/BK-MF5-05-interface-moderna-intuitiva-e-responsive-desktop-e-mobile.md)
- [BK-MF5-06 - Design coerente com estética da marca (cores suaves, tipografia moderna).](MF5/BK-MF5-06-design-coerente-com-estetica-da-marca-cores-suaves-tipografia-moderna.md)
- [BK-MF5-07 - Mensagens claras, ícones acessíveis e feedback imediato em formulários.](MF5/BK-MF5-07-mensagens-claras-icones-acessiveis-e-feedback-imediato-em-formularios.md)
- [BK-MF5-08 - Modo escuro e contraste ajustado.](MF5/BK-MF5-08-modo-escuro-e-contraste-ajustado.md)

### MF6
- [BK-MF6-01 - Executar operações OpenAI como jobs retomáveis com deadlines configurados.](MF6/BK-MF6-01-processar-analise-de-fotografia-em-menos-de-10-segundos.md)
- [BK-MF6-02 - Páginas principais devem carregar em ≤ 3 segundos.](MF6/BK-MF6-02-paginas-principais-devem-carregar-em-3-segundos.md)
- [BK-MF6-03 - Suportar mínimo 50 utilizadores simultâneos sem falhas.](MF6/BK-MF6-03-suportar-minimo-50-utilizadores-simultaneos-sem-falhas.md)
- [BK-MF6-04 - Imagens otimizadas (lazy loading e compressão automática).](MF6/BK-MF6-04-imagens-otimizadas-lazy-loading-e-compressao-automatica.md)
- [BK-MF6-05 - Todas as comunicações via HTTPS (TLS 1.2+).](MF6/BK-MF6-05-todas-as-comunicacoes-via-https-tls-1-2.md)
- [BK-MF6-06 - Palavras-passe com hash seguro (bcrypt).](MF6/BK-MF6-06-palavras-passe-com-hash-seguro-bcrypt.md)
- [BK-MF6-07 - Fotografias e relatórios de análise armazenados de forma encriptada.](MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md)

### MF7
- [BK-MF7-01 - Consentimento v2 e propósitos separados para consulta OpenAI.](MF7/BK-MF7-01-consentimento-explicito-para-analise-facial-rgpd.md)
- [BK-MF7-02 - Direito a pedidos canónicos de privacidade e eliminação terminal da própria conta; decisões destrutivas só por administrador.](MF7/BK-MF7-02-direito-a-eliminar-conta-e-dados-incluindo-fotos.md)
- [BK-MF7-03 - Sessões autenticadas com cookies HttpOnly.](MF7/BK-MF7-03-sessoes-autenticadas-com-cookies-httponly.md)
- [BK-MF7-04 - Compatível com Chrome, Safari, Edge e Firefox.](MF7/BK-MF7-04-compativel-com-chrome-safari-edge-e-firefox.md)
- [BK-MF7-05 - Exportação PDF administrativa minimizada; relatórios IA apenas em metadados.](MF7/BK-MF7-05-exportacao-de-relatorios-em-pdf.md)
- [BK-MF7-06 - Validar Pagamento simulado sem integração financeira externa.](MF7/BK-MF7-06-validar-pagamento-simulado-sem-integracao-externa.md)
- [BK-MF7-07 - Integração OpenAI-only resiliente e degradável.](MF7/BK-MF7-07-suporte-para-api-de-ia-externa-ex-azure-face-api-ou-tensorflow.md)

### MF8
- [Arranque local da Orélle antes dos BKs da MF8.](MF8/00-ARRANQUE-LOCAL.md)
- [BK-MF8-01 - Código modular (MVC) com documentação e _docstrings_.](MF8/BK-MF8-01-codigo-modular-mvc-com-documentacao-e-docstrings.md)
- [BK-MF8-02 - Logs de erros e métricas de desempenho.](MF8/BK-MF8-02-logs-de-erros-e-metricas-de-desempenho.md)
- [BK-MF8-03 - Ambiente de testes separado do ambiente de produção.](MF8/BK-MF8-03-ambiente-de-testes-separado-do-ambiente-de-producao.md)
- [BK-MF8-04 - Snapshot diário EJSON cifrado, recuperável e verificado da base académica local.](MF8/BK-MF8-04-base-de-dados-com-backups-automaticos-diarios.md)
- [BK-MF8-05 - Explicabilidade e provenance do relatório OpenAI.](MF8/BK-MF8-05-a-ia-deve-indicar-como-chegou-as-recomendacoes-explicabilidade.md)
- [BK-MF8-06 - Pré-filtro autoritativo e testes de invariância.](MF8/BK-MF8-06-o-sistema-deve-garantir-nao-discriminacao-por-genero-idade-ou-tom-de-pele.md)
- [BK-MF8-07 - Minimização e consentimento dos dados enviados à OpenAI.](MF8/BK-MF8-07-as-imagens-processadas-nao-devem-ser-usadas-para-treinar-modelos-externos-sem-consentimento.md)
- [BK-MF8-08 - Consulta OpenAI dinâmica de 5–8 perguntas.](MF8/BK-MF8-08-sessao-guiada-de-avaliacao-cosmetica-com-ia.md)
- [BK-MF8-09 - Histórico cifrado, minimizado e retomável da consulta.](MF8/BK-MF8-09-historico-seguro-da-interacao-cliente-ia.md)
- [BK-MF8-10 - Recomendações allowlisted enriquecidas pelas respostas da consulta.](MF8/BK-MF8-10-recomendacoes-enriquecidas-com-respostas-da-avaliacao-guiada.md)
- [BK-MF8-11 - Revisão humana opcional, auditada e com CAS.](MF8/BK-MF8-11-revisao-humana-de-sessoes-ia-por-consultores.md)
- [BK-MF8-12 - Ajustes públicos do consultor na versão final do relatório.](MF8/BK-MF8-12-insights-correcoes-do-consultor-visiveis-para-o-cliente.md)
- [BK-MF8-13 - Interface integrada da consulta por `flowState`.](MF8/BK-MF8-13-interface-integrada-cliente-consultor-para-consulta-assistida.md)
- [BK-MF8-14 - Aproximação da UI à UI do mockup.](MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md)
- [BK-MF8-15 - Verificação dos testes atuais e criação dos testes em falta.](MF8/BK-MF8-15-verificacao-dos-testes-atuais-e-criacao-dos-testes-em-falta.md)
- [BK-MF8-16 - Execução final de testes com evidências.](MF8/BK-MF8-16-execucao-final-de-testes-com-evidencias.md)
- [BK-MF8-17 - Correção dos erros encontrados e reexecução dos testes afetados.](MF8/BK-MF8-17-correcao-dos-erros-encontrados-e-reexecucao-dos-testes-afetados.md)

## Changelog
- `2026-07-11`: índice alinhado ao fluxo OpenAI-only integrado; os filenames históricos permanecem estáveis para compatibilidade de links.
- `2026-07-09`: índice de BK-MF8-04 alinhado ao contrato recuperável EJSON/AES-GCM com restore isolado.
- `2026-07-09`: índice canónico atualizado para os guias renomeados de Pagamento simulado.
- `2026-07-03`: adicionado guia operacional de arranque local para a MF8.
- `2026-06-30`: índice MF8 expandido para 17 guias e Fase 3 recalculada para 31 guias.
- `2026-06-29`: índice MF8 expandido na primeira versão de fecho.
- `2026-04-12`: indice inicial dos guias BK Orelle.
- `2026-04-14`: indice atualizado para naming semantico e contrato canónico comum.
- `2026-04-17`: removidos guias BK fora do escopo PAP e recalculada cobertura por fase.
