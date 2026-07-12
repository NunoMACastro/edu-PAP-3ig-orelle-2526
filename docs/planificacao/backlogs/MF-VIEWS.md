# MF-VIEWS

## Header
- `doc_id`: `MF-VIEWS`
- `path`: `docs/planificacao/backlogs/MF-VIEWS.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-07-11`

## Criterio de pronto pedagogico por macro
- Macro fecha apenas com 100% dos BK com guia valido, checklist completa e evidence verificavel.
- Nenhum BK pode fechar sem negativos minimos por prioridade.
- O único método permitido é `Pagamento simulado`, sem integração financeira externa ou movimentação de dinheiro. Existem duas simulações separadas: checkout de encomenda e desbloqueio académico do relatório; ambas são inequívocas, idempotentes e sem cobrança.
- `RNF26` está em `ACEITE_RISCO`: a revisão manual/Figma foi dispensada no alvo académico/local; a árvore disponível não prova aprovação nem alinhamento da interface.

## Contrato transversal da consulta OpenAI

- O runtime de IA usa exclusivamente OpenAI: não existem modos `demo` ou providers alternativos. Sem `OPENAI_API_KEY`, a aplicação arranca degradada e mantém conta, catálogo e loja; apenas novas operações IA ficam indisponíveis.
- A consulta integra objetivo principal e até dois secundários entre sete objetivos, consentimento OpenAI v2, fotografia frontal + perfil/ângulo lateral, controlo de qualidade e uma conversa de 5–8 perguntas estruturadas.
- Análise, pergunta seguinte, relatório e edição de maquilhagem executam como jobs duráveis, idempotentes e retomáveis. Falha total de análise/relatório/imagem fica `failed_retryable`; só a pergunta seguinte pode usar o banco canónico.
- O backend pré-filtra no máximo 15 produtos/variantes, valida a allowlist devolvida pela OpenAI e congela o relatório v2 antes do desbloqueio. A revisão humana é opcional e preserva `machineResult` em separado de `humanOverride`.
- O desbloqueio simula 10% do total congelado dos produtos disponíveis e cria voucher do mesmo valor. A edição `gpt-image-2` é opcional, posterior ao desbloqueio, consentida e limitada às variantes de maquilhagem congeladas.

## Sequencia macro
MF0 -> MF1 -> MF2 -> MF3 -> MF4 -> MF5 -> MF6 -> MF7 -> MF8

## MF0 - Fundamentos e governance
### Sequencia por macro
BK-MF0-01, BK-MF0-02, BK-MF0-03, BK-MF0-04, BK-MF0-05, BK-MF0-06, BK-MF0-07, BK-MF0-08

### Guias disponiveis
- [BK-MF0-01 - Registo de utilizadores com email e password.](../guias-bk/MF0/BK-MF0-01-registo-de-utilizadores-com-email-e-password.md)
- [BK-MF0-02 - Login e logout com sessão segura (cookie HttpOnly).](../guias-bk/MF0/BK-MF0-02-login-e-logout-com-sessao-segura-cookie-httponly.md)
- [BK-MF0-03 - Criação de perfil personalizado com nome, idade, tipo de pele, género e objetivos (ex: hidratar, antiacne).](../guias-bk/MF0/BK-MF0-03-criacao-de-perfil-personalizado-com-nome-idade-tipo-de-pele-genero-e-objetivos-ex-hidratar-antiacne.md)
- [BK-MF0-04 - Possibilidade de editar o perfil e atualizar fotografias periodicamente.](../guias-bk/MF0/BK-MF0-04-possibilidade-de-editar-o-perfil-e-atualizar-fotografias-periodicamente.md)
- [BK-MF0-05 - Criação de roles: Cliente, Consultor, Administrador.](../guias-bk/MF0/BK-MF0-05-criacao-de-roles-cliente-consultor-administrador.md)
- [BK-MF0-06 - Cada utilizador pode guardar preferências de produtos e marcas favoritas.](../guias-bk/MF0/BK-MF0-06-cada-utilizador-pode-guardar-preferencias-de-produtos-e-marcas-favoritas.md)
- [BK-MF0-07 - Registar produtos com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock.](../guias-bk/MF0/BK-MF0-07-registar-produtos-com-nome-descricao-ingredientes-tipo-de-pele-indicado-imagem-preco-e-stock.md)
- [BK-MF0-08 - Associar categorias (limpeza, maquilhagem, tratamento, protetor solar, etc.).](../guias-bk/MF0/BK-MF0-08-associar-categorias-limpeza-maquilhagem-tratamento-protetor-solar-etc.md)

### Step-by-step macro
1. Confirmar dependencias desbloqueadas antes de iniciar a macro.
2. Executar BK por prioridade (`P0 > P1 > P2`) mantendo sequencia tecnica.
3. Validar smoke, negativos e evidence por BK antes do handoff.
4. Atualizar backlog, matriz e anexo de sprint/owner no mesmo ciclo.
5. Fechar macro apenas quando 100% dos BK tiverem criterios de aceite e evidence validada.

### Pronto da macro
- Todos os BK da macro com guia canónico atualizado.
- Sem dependencias invalidas para a macro seguinte.

## MF1 - Nucleo funcional I
### Sequencia por macro
BK-MF1-01, BK-MF1-02, BK-MF1-03, BK-MF1-04, BK-MF1-05, BK-MF1-06, BK-MF1-07, BK-MF1-08

### Guias disponiveis
- [BK-MF1-01 - Permitir pesquisa e filtragem por categoria, preço, tipo de pele, marca.](../guias-bk/MF1/BK-MF1-01-permitir-pesquisa-e-filtragem-por-categoria-preco-tipo-de-pele-marca.md)
- [BK-MF1-02 - Página de detalhes do produto com descrição completa, imagem, notas de utilizadores e recomendações.](../guias-bk/MF1/BK-MF1-02-pagina-de-detalhes-do-produto-com-descricao-completa-imagem-notas-de-utilizadores-e-recomendacoes.md)
- [BK-MF1-03 - Permitir ao cliente avaliar produtos (1–5 estrelas) e deixar comentários.](../guias-bk/MF1/BK-MF1-03-permitir-ao-cliente-avaliar-produtos-1-5-estrelas-e-deixar-comentarios.md)
- [BK-MF1-04 - Mostrar produtos semelhantes e complementares (“quem comprou isto também comprou…”).](../guias-bk/MF1/BK-MF1-04-mostrar-produtos-semelhantes-e-complementares-quem-comprou-isto-tambem-comprou.md)
- [BK-MF1-05 - Recolher frontal e perfil com consentimento e controlo de qualidade.](../guias-bk/MF1/BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md)
- [BK-MF1-06 - Analisar fotografias exclusivamente com OpenAI no job da consulta cosmética.](../guias-bk/MF1/BK-MF1-06-o-sistema-deve-analisar-as-fotos-com-ia-para-detetar-tipo-de-pele-acne-manchas-rugas-e-oleosidade.md)
- [BK-MF1-07 - Gerar relatório OpenAI v2, revisão/freeze e desbloqueio simulado de 10% com voucher.](../guias-bk/MF1/BK-MF1-07-gerar-um-relatorio-personalizado-com-diagnostico-e-sugestoes-de-rotina.md)
- [BK-MF1-08 - Guardar histórico próprio sem expor relatórios bloqueados.](../guias-bk/MF1/BK-MF1-08-a-analise-deve-ser-guardada-no-historico-pessoal-para-futuras-comparacoes.md)

### Step-by-step macro
1. Confirmar dependencias desbloqueadas antes de iniciar a macro.
2. Executar BK por prioridade (`P0 > P1 > P2`) mantendo sequencia tecnica.
3. Validar smoke, negativos e evidence por BK antes do handoff.
4. Atualizar backlog, matriz e anexo de sprint/owner no mesmo ciclo.
5. Fechar macro apenas quando 100% dos BK tiverem criterios de aceite e evidence validada.

### Pronto da macro
- Todos os BK da macro com guia canónico atualizado.
- Sem dependencias invalidas para a macro seguinte.

## MF2 - Nucleo funcional II
### Sequencia por macro
BK-MF2-01, BK-MF2-02, BK-MF2-03, BK-MF2-04, BK-MF2-05, BK-MF2-06, BK-MF2-07, BK-MF2-08

### Guias disponiveis
- [BK-MF2-01 - O utilizador pode consultar evolução da pele ao longo do tempo através de gráficos.](../guias-bk/MF2/BK-MF2-01-o-utilizador-pode-consultar-evolucao-da-pele-ao-longo-do-tempo-atraves-de-graficos.md)
- [BK-MF2-02 - Gerar no relatório recomendações de produtos/variantes validados.](../guias-bk/MF2/BK-MF2-02-com-base-na-analise-e-historico-o-sistema-recomenda-produtos-personalizados-para-o-utilizador.md)
- [BK-MF2-03 - Explicar motivo, utilização e cautelas das recomendações.](../guias-bk/MF2/BK-MF2-03-as-recomendacoes-devem-indicar-motivo-da-sugestao-ex-ajuda-a-reduzir-oleosidade.md)
- [BK-MF2-04 - Registar feedback sobre recomendações úteis ou não relevantes, sem treino automático.](../guias-bk/MF2/BK-MF2-04-o-utilizador-pode-marcar-recomendacoes-como-uteis-ou-nao-relevantes-para-treinar-o-modelo.md)
- [BK-MF2-05 - Sugerir rotina do relatório com instruções e cautelas.](../guias-bk/MF2/BK-MF2-05-o-sistema-deve-sugerir-rotinas-diarias-manha-noite-com-base-nos-produtos-adquiridos.md)
- [BK-MF2-06 - Rever opcionalmente o relatório e preservar `machineResult`.](../guias-bk/MF2/BK-MF2-06-consultores-podem-rever-recomendacoes-e-sugerir-ajustes-manuais.md)
- [BK-MF2-07 - Gerar edição OpenAI de maquilhagem após desbloqueio.](../guias-bk/MF2/BK-MF2-07-permitir-simular-aplicacao-de-maquilhagem-virtual-com-base-na-fotografia-enviada.md)
- [BK-MF2-08 - Mostrar original e preview OpenAI lado a lado.](../guias-bk/MF2/BK-MF2-08-a-ia-deve-gerar-uma-visualizacao-antes-depois-com-os-produtos-recomendados.md)

### Step-by-step macro
1. Confirmar dependencias desbloqueadas antes de iniciar a macro.
2. Executar BK por prioridade (`P0 > P1 > P2`) mantendo sequencia tecnica.
3. Validar smoke, negativos e evidence por BK antes do handoff.
4. Atualizar backlog, matriz e anexo de sprint/owner no mesmo ciclo.
5. Fechar macro apenas quando 100% dos BK tiverem criterios de aceite e evidence validada.

### Pronto da macro
- Todos os BK da macro com guia canónico atualizado.
- Sem dependencias invalidas para a macro seguinte.

## MF3 - Capacidades de produto I
### Sequencia por macro
BK-MF3-01, BK-MF3-02, BK-MF3-03, BK-MF3-04, BK-MF3-06, BK-MF3-07, BK-MF3-08

### Guias disponiveis
- [BK-MF3-01 - O sistema deve permitir comparar imagens (antes vs após 30 dias de uso).](../guias-bk/MF3/BK-MF3-01-o-sistema-deve-permitir-comparar-imagens-antes-vs-apos-30-dias-de-uso.md)
- [BK-MF3-02 - Adicionar/remover produtos do carrinho de compras.](../guias-bk/MF3/BK-MF3-02-adicionar-remover-produtos-do-carrinho-de-compras.md)
- [BK-MF3-03 - Registar encomendas com o método único Pagamento simulado.](../guias-bk/MF3/BK-MF3-03-registar-encomendas-com-pagamento-simulado.md)
- [BK-MF3-04 - Histórico de compras com data, total, produtos e estado (pendente, enviado, entregue).](../guias-bk/MF3/BK-MF3-04-historico-de-compras-com-data-total-produtos-e-estado-pendente-enviado-entregue.md)
- [BK-MF3-06 - O cliente pode recomprar produtos anteriores com um clique.](../guias-bk/MF3/BK-MF3-06-o-cliente-pode-recomprar-produtos-anteriores-com-um-clique.md)
- [BK-MF3-07 - Dashboard de estatísticas (vendas, produtos mais vendidos, utilizadores ativos).](../guias-bk/MF3/BK-MF3-07-dashboard-de-estatisticas-vendas-produtos-mais-vendidos-utilizadores-ativos.md)
- [BK-MF3-08 - Gestão de stock (alertas de baixo stock, atualização automática após compra).](../guias-bk/MF3/BK-MF3-08-gestao-de-stock-alertas-de-baixo-stock-atualizacao-automatica-apos-compra.md)

### Step-by-step macro
1. Confirmar dependencias desbloqueadas antes de iniciar a macro.
2. Executar BK por prioridade (`P0 > P1 > P2`) mantendo sequencia tecnica.
3. Validar smoke, negativos e evidence por BK antes do handoff.
4. Atualizar backlog, matriz e anexo de sprint/owner no mesmo ciclo.
5. Fechar macro apenas quando 100% dos BK tiverem criterios de aceite e evidence validada.

### Pronto da macro
- Todos os BK da macro com guia canónico atualizado.
- Sem dependencias invalidas para a macro seguinte.

## MF4 - Capacidades de produto II
### Sequencia por macro
BK-MF4-01, BK-MF4-02, BK-MF4-03, BK-MF4-04, BK-MF4-05, BK-MF4-08

### Guias disponiveis
- [BK-MF4-01 - Gestão de utilizadores: ativar, suspender e desativar reversivelmente (`suspended` + revogação de sessões); sem eliminação terminal de dados.](../guias-bk/MF4/BK-MF4-01-gestao-de-utilizadores-ativar-suspender-eliminar-contas.md)
- [BK-MF4-02 - Moderação de comentários e avaliações.](../guias-bk/MF4/BK-MF4-02-moderacao-de-comentarios-e-avaliacoes.md)
- [BK-MF4-03 - Exportação administrativa para Excel/PDF, com relatórios IA apenas em metadados.](../guias-bk/MF4/BK-MF4-03-exportacao-de-dados-para-excel-pdf-vendas-relatorios-de-ia-utilizadores.md)
- [BK-MF4-04 - Enviar notificações sobre promoções, novos produtos e estado das encomendas.](../guias-bk/MF4/BK-MF4-04-enviar-notificacoes-sobre-promocoes-novos-produtos-e-estado-das-encomendas.md)
- [BK-MF4-05 - Enviar alertas personalizados (“Está na hora da sua rotina noturna”).](../guias-bk/MF4/BK-MF4-05-enviar-alertas-personalizados-esta-na-hora-da-sua-rotina-noturna.md)
- [BK-MF4-08 - Guardar alergias, ingredientes a evitar e restrições médicas leves no perfil e impedir recomendações que violem regras.](../guias-bk/MF4/BK-MF4-08-guardar-alergias-ingredientes-a-evitar-e-restricoes-medicas-leves-no-perfil-e-impedir-recomendacoes-que-violem-regras.md)

### Step-by-step macro
1. Confirmar dependencias desbloqueadas antes de iniciar a macro.
2. Executar BK por prioridade (`P0 > P1 > P2`) mantendo sequencia tecnica.
3. Validar smoke, negativos e evidence por BK antes do handoff.
4. Atualizar backlog, matriz e anexo de sprint/owner no mesmo ciclo.
5. Fechar macro apenas quando 100% dos BK tiverem criterios de aceite e evidence validada.

### Pronto da macro
- Todos os BK da macro com guia canónico atualizado.
- Sem dependencias invalidas para a macro seguinte.

## MF5 - Operacao e fluxos transversais
### Sequencia por macro
BK-MF5-01, BK-MF5-04, BK-MF5-05, BK-MF5-06, BK-MF5-07, BK-MF5-08

### Guias disponiveis
- [BK-MF5-01 - Painel administrativo para rever, decidir e repetir pedidos de eliminação/anonymização de fotografias e relatórios.](../guias-bk/MF5/BK-MF5-01-painel-para-consultores-admins-reverem-e-aprovarem-pedidos-de-eliminacao-anonymizacao-de-fotografias-e-relatorios.md)
- [BK-MF5-04 - Registo/auditoria de acessos a dados biométricos, com alertas para usos indevidos.](../guias-bk/MF5/BK-MF5-04-registo-auditoria-de-acessos-a-dados-biometricos-com-alertas-para-usos-indevidos.md)
- [BK-MF5-05 - Interface moderna, intuitiva e _responsive_ (desktop e mobile).](../guias-bk/MF5/BK-MF5-05-interface-moderna-intuitiva-e-responsive-desktop-e-mobile.md)
- [BK-MF5-06 - Design coerente com estética da marca (cores suaves, tipografia moderna).](../guias-bk/MF5/BK-MF5-06-design-coerente-com-estetica-da-marca-cores-suaves-tipografia-moderna.md)
- [BK-MF5-07 - Mensagens claras, ícones acessíveis e feedback imediato em formulários.](../guias-bk/MF5/BK-MF5-07-mensagens-claras-icones-acessiveis-e-feedback-imediato-em-formularios.md)
- [BK-MF5-08 - Modo escuro e contraste ajustado.](../guias-bk/MF5/BK-MF5-08-modo-escuro-e-contraste-ajustado.md)

### Step-by-step macro
1. Confirmar dependencias desbloqueadas antes de iniciar a macro.
2. Executar BK por prioridade (`P0 > P1 > P2`) mantendo sequencia tecnica.
3. Validar smoke, negativos e evidence por BK antes do handoff.
4. Atualizar backlog, matriz e anexo de sprint/owner no mesmo ciclo.
5. Fechar macro apenas quando 100% dos BK tiverem criterios de aceite e evidence validada.

### Pronto da macro
- Todos os BK da macro com guia canónico atualizado.
- Sem dependencias invalidas para a macro seguinte.

## MF6 - Qualidade e robustez
### Sequencia por macro
BK-MF6-01, BK-MF6-02, BK-MF6-03, BK-MF6-04, BK-MF6-05, BK-MF6-06, BK-MF6-07

### Guias disponiveis
- [BK-MF6-01 - Executar operações OpenAI como jobs retomáveis com deadlines configurados.](../guias-bk/MF6/BK-MF6-01-processar-analise-de-fotografia-em-menos-de-10-segundos.md)
- [BK-MF6-02 - Páginas principais devem carregar em ≤ 3 segundos.](../guias-bk/MF6/BK-MF6-02-paginas-principais-devem-carregar-em-3-segundos.md)
- [BK-MF6-03 - Suportar mínimo 50 utilizadores simultâneos sem falhas.](../guias-bk/MF6/BK-MF6-03-suportar-minimo-50-utilizadores-simultaneos-sem-falhas.md)
- [BK-MF6-04 - Imagens otimizadas (lazy loading e compressão automática).](../guias-bk/MF6/BK-MF6-04-imagens-otimizadas-lazy-loading-e-compressao-automatica.md)
- [BK-MF6-05 - Todas as comunicações via HTTPS (TLS 1.2+).](../guias-bk/MF6/BK-MF6-05-todas-as-comunicacoes-via-https-tls-1-2.md)
- [BK-MF6-06 - Palavras-passe com hash seguro (bcrypt).](../guias-bk/MF6/BK-MF6-06-palavras-passe-com-hash-seguro-bcrypt.md)
- [BK-MF6-07 - Fotografias e relatórios de análise armazenados de forma encriptada.](../guias-bk/MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md)

### Step-by-step macro
1. Confirmar dependencias desbloqueadas antes de iniciar a macro.
2. Executar BK por prioridade (`P0 > P1 > P2`) mantendo sequencia tecnica.
3. Validar smoke, negativos e evidence por BK antes do handoff.
4. Atualizar backlog, matriz e anexo de sprint/owner no mesmo ciclo.
5. Fechar macro apenas quando 100% dos BK tiverem criterios de aceite e evidence validada.

### Pronto da macro
- Todos os BK da macro com guia canónico atualizado.
- Sem dependencias invalidas para a macro seguinte.

## MF7 - Privacidade, seguranca e controlo
### Sequencia por macro
BK-MF7-01, BK-MF7-02, BK-MF7-03, BK-MF7-04, BK-MF7-05, BK-MF7-06, BK-MF7-07

### Guias disponiveis
- [BK-MF7-01 - Consentimento v2 e propósitos separados para consulta OpenAI.](../guias-bk/MF7/BK-MF7-01-consentimento-explicito-para-analise-facial-rgpd.md)
- [BK-MF7-02 - Direito a pedidos canónicos de privacidade e eliminação terminal da própria conta; decisões destrutivas só por administrador.](../guias-bk/MF7/BK-MF7-02-direito-a-eliminar-conta-e-dados-incluindo-fotos.md)
- [BK-MF7-03 - Sessões autenticadas com cookies HttpOnly.](../guias-bk/MF7/BK-MF7-03-sessoes-autenticadas-com-cookies-httponly.md)
- [BK-MF7-04 - Compatível com Chrome, Safari, Edge e Firefox.](../guias-bk/MF7/BK-MF7-04-compativel-com-chrome-safari-edge-e-firefox.md)
- [BK-MF7-05 - Exportação PDF administrativa minimizada; relatórios IA apenas em metadados.](../guias-bk/MF7/BK-MF7-05-exportacao-de-relatorios-em-pdf.md)
- [BK-MF7-06 - Validar Pagamento simulado sem integração financeira externa.](../guias-bk/MF7/BK-MF7-06-validar-pagamento-simulado-sem-integracao-externa.md)
- [BK-MF7-07 - Integração OpenAI-only resiliente e degradável.](../guias-bk/MF7/BK-MF7-07-suporte-para-api-de-ia-externa-ex-azure-face-api-ou-tensorflow.md)

### Step-by-step macro
1. Confirmar dependencias desbloqueadas antes de iniciar a macro.
2. Executar BK por prioridade (`P0 > P1 > P2`) mantendo sequencia tecnica.
3. Validar smoke, negativos e evidence por BK antes do handoff.
4. Atualizar backlog, matriz e anexo de sprint/owner no mesmo ciclo.
5. Fechar macro apenas quando 100% dos BK tiverem criterios de aceite e evidence validada.

### Pronto da macro
- Todos os BK da macro com guia canónico atualizado.
- Sem dependencias invalidas para a macro seguinte.

## MF8 - Consulta IA guiada, revisão humana, UI e testes finais
### Sequencia por macro
BK-MF8-01, BK-MF8-02, BK-MF8-03, BK-MF8-04, BK-MF8-05, BK-MF8-06, BK-MF8-07, BK-MF8-08, BK-MF8-09, BK-MF8-10, BK-MF8-11, BK-MF8-12, BK-MF8-13, BK-MF8-14, BK-MF8-15, BK-MF8-16, BK-MF8-17

### Guias disponiveis
- [BK-MF8-01 - Código modular (MVC) com documentação e _docstrings_.](../guias-bk/MF8/BK-MF8-01-codigo-modular-mvc-com-documentacao-e-docstrings.md)
- [BK-MF8-02 - Logs de erros e métricas de desempenho.](../guias-bk/MF8/BK-MF8-02-logs-de-erros-e-metricas-de-desempenho.md)
- [BK-MF8-03 - Ambiente de testes isolado da base local principal da demonstração académica.](../guias-bk/MF8/BK-MF8-03-ambiente-de-testes-separado-do-ambiente-de-producao.md)
- [BK-MF8-04 - Snapshot diário EJSON cifrado, recuperável e verificado da base académica local.](../guias-bk/MF8/BK-MF8-04-base-de-dados-com-backups-automaticos-diarios.md)
- [BK-MF8-05 - Explicabilidade e provenance do relatório OpenAI.](../guias-bk/MF8/BK-MF8-05-a-ia-deve-indicar-como-chegou-as-recomendacoes-explicabilidade.md)
- [BK-MF8-06 - Pré-filtro autoritativo e testes de invariância.](../guias-bk/MF8/BK-MF8-06-o-sistema-deve-garantir-nao-discriminacao-por-genero-idade-ou-tom-de-pele.md)
- [BK-MF8-07 - Minimização e consentimento dos dados enviados à OpenAI.](../guias-bk/MF8/BK-MF8-07-as-imagens-processadas-nao-devem-ser-usadas-para-treinar-modelos-externos-sem-consentimento.md)
- [BK-MF8-08 - Consulta OpenAI dinâmica de 5–8 perguntas.](../guias-bk/MF8/BK-MF8-08-sessao-guiada-de-avaliacao-cosmetica-com-ia.md)
- [BK-MF8-09 - Histórico cifrado, minimizado e retomável da consulta.](../guias-bk/MF8/BK-MF8-09-historico-seguro-da-interacao-cliente-ia.md)
- [BK-MF8-10 - Recomendações allowlisted enriquecidas pelas respostas da consulta.](../guias-bk/MF8/BK-MF8-10-recomendacoes-enriquecidas-com-respostas-da-avaliacao-guiada.md)
- [BK-MF8-11 - Revisão humana opcional, auditada e com CAS.](../guias-bk/MF8/BK-MF8-11-revisao-humana-de-sessoes-ia-por-consultores.md)
- [BK-MF8-12 - Ajustes públicos do consultor na versão final do relatório.](../guias-bk/MF8/BK-MF8-12-insights-correcoes-do-consultor-visiveis-para-o-cliente.md)
- [BK-MF8-13 - Interface integrada da consulta por `flowState`.](../guias-bk/MF8/BK-MF8-13-interface-integrada-cliente-consultor-para-consulta-assistida.md)
- [BK-MF8-14 - Aproximação da UI ao mockup (`ACEITE_RISCO`; revisão manual/Figma dispensada, paridade não demonstrada).](../guias-bk/MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md)
- [BK-MF8-15 - Verificação dos testes atuais e criação dos testes em falta.](../guias-bk/MF8/BK-MF8-15-verificacao-dos-testes-atuais-e-criacao-dos-testes-em-falta.md)
- [BK-MF8-16 - Execução final de testes com evidências.](../guias-bk/MF8/BK-MF8-16-execucao-final-de-testes-com-evidencias.md)
- [BK-MF8-17 - Correção dos erros encontrados e reexecução dos testes afetados.](../guias-bk/MF8/BK-MF8-17-correcao-dos-erros-encontrados-e-reexecucao-dos-testes-afetados.md)

### Step-by-step macro
1. Confirmar dependencias desbloqueadas antes de iniciar a macro.
2. Fechar base tecnica, operacional, privacidade e explicabilidade da IA.
3. Implementar consulta guiada, histórico seguro, recomendações enriquecidas e revisão humana.
4. Integrar a experiência cliente/consultor antes do polimento visual.
5. Executar os gates automatizados de responsive/acessibilidade e registar o risco residual: a comparação manual/Figma foi dispensada e não pode ser apresentada como aprovação/paridade.
6. Completar testes em falta, executar bateria final e registar evidence.
7. Corrigir erros encontrados e reexecutar testes afetados antes do fecho.
8. Atualizar backlog, matriz e anexo de sprint/owner no mesmo ciclo.

### Pronto da macro
- Todos os BK da macro com guia canónico atualizado.
- RNF21 só fecha depois de `create -> restore _restore -> verify` passar num replica set local; testes unitários e o export `backup:daily` legado não substituem essa prova.
- Consulta OpenAI-only com sete objetivos, 5–8 perguntas, jobs retomáveis, relatório v2 e histórico seguro validada end-to-end.
- Recomendações allowlisted, revisão humana opcional, congelamento, desbloqueio simulado de 10% e voucher validados sem cobrança.
- Edição `gpt-image-2` restrita a maquilhagem, posterior ao desbloqueio e protegida por consentimento generativo próprio.
- UI principal responsiva é validada pelos gates locais; RNF26/BK-MF8-14 permanece `ACEITE_RISCO`, sem confirmação do estatuto do artefacto nem paridade manual.
- Testes finais executados, erros corrigidos/revalidados e evidence pronta para defesa.



## Changelog
- `2026-07-11`: contrato transversal sincronizado com OpenAI-only, sete objetivos, 5–8 perguntas, jobs retomáveis, consentimento v2, relatório/revisão/freeze, desbloqueio simulado de 10%, voucher e edição `gpt-image-2`.
- `2026-07-09`: MF3/MF7 alinhadas ao Pagamento simulado, RNF21 concretizado como snapshot EJSON cifrado com prova replica-set pendente, scope operacional MF8 tornado académico/local e RNF26 marcado `BLOQUEADO_EXTERNO`.
- `2026-07-10`: RNF26/BK-MF8-14 reabertos para comparação manual após a disponibilização de `mockup/`, sem alegação de aprovação ou alinhamento.
- `2026-07-10`: estado corrente sobrepõe a linha anterior: RNF26/BK-MF8-14 em `ACEITE_RISCO`, revisão manual/Figma dispensada, sem alegação de aprovação ou paridade.
- `2026-06-30`: MF8 revista para 17 BKs com consulta IA guiada, revisão humana e testes finais em BK-MF8-15..17.
- `2026-06-29`: MF8 revista na primeira versão de fecho visual e QA final.
- `2026-04-12`: MF-VIEWS inicial da Orelle.
- `2026-04-14`: MF-VIEWS alinhado ao naming semantico e contrato canónico comum.
- `2026-04-17`: removidos BK fora do escopo PAP e atualizado encadeamento por macro.
