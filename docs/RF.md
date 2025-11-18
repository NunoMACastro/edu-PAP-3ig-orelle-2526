# Requisitos Funcionais — Aplicação **Orélle**

> **PAP — Curso Profissional de Informática de Gestão**  
> **Áreas:** Programação · Gestão · Base de Dados  
> **Ano letivo:** 2025/2026  
> **Versão:** 1.0  
> **Elaborado por:** [Nome do Grupo]  
> **Professor Orientador:** Nuno Miguel Almeida Castro

---

## Índice

1. [Utilizadores e Perfis](#1-utilizadores-e-perfis)
2. [Gestão de Produtos e Catálogo](#2-gestão-de-produtos-e-catálogo)
3. [Análise e Consultoria com IA](#3-análise-e-consultoria-com-ia)
4. [Sistema de Recomendação e Personalização](#4-sistema-de-recomendação-e-personalização)
5. [Simulação Virtual e Fotografias](#5-simulação-virtual-e-fotografias)
6. [Carrinho, Pagamentos e Histórico](#6-carrinho-pagamentos-e-histórico)
7. [Gestão Administrativa](#7-gestão-administrativa)
8. [Notificações e Comunicação](#8-notificações-e-comunicação)
9. [Critérios de Aceitação](#9-critérios-de-aceitação)

---

## 1 Utilizadores e Perfis

| Código | Requisito                                                                                                       | Atores  | Prioridade | Dependências |
| :----- | :-------------------------------------------------------------------------------------------------------------- | :------ | :--------- | :----------- |
| RF01   | Registo de utilizadores com email e password.                                                                   | Cliente | Must       | —            |
| RF02   | Login e logout com sessão segura (cookie HttpOnly).                                                             | Cliente | Must       | —            |
| RF03   | Criação de **perfil personalizado** com nome, idade, tipo de pele, género e objetivos (ex: hidratar, antiacne). | Cliente | Must       | RF01         |
| RF04   | Possibilidade de **editar o perfil e atualizar fotografias** periodicamente.                                    | Cliente | Should     | RF03         |
| RF05   | Criação de **roles**: Cliente, Consultor, Administrador.                                                        | Admin   | Must       | RF01         |
| RF06   | Cada utilizador pode guardar **preferências de produtos e marcas favoritas**.                                   | Cliente | Should     | RF03         |

---

## 2 Gestão de Produtos e Catálogo

| Código | Requisito                                                                                                | Atores       | Prioridade | Dependências |
| :----- | :------------------------------------------------------------------------------------------------------- | :----------- | :--------- | :----------- |
| RF07   | Registar produtos com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock.       | Admin        | Must       | —            |
| RF08   | Associar **categorias** (limpeza, maquilhagem, tratamento, protetor solar, etc.).                        | Admin        | Must       | RF07         |
| RF09   | Permitir pesquisa e filtragem por categoria, preço, tipo de pele, marca.                                 | Cliente      | Must       | RF07         |
| RF10   | Página de **detalhes do produto** com descrição completa, imagem, notas de utilizadores e recomendações. | Cliente      | Must       | RF07         |
| RF11   | Permitir ao cliente **avaliar produtos** (1–5 estrelas) e deixar comentários.                            | Cliente      | Should     | RF10         |
| RF12   | Mostrar produtos semelhantes e complementares (“quem comprou isto também comprou…”).                     | Sistema (IA) | Should     | RF07         |

---

## 3 Análise e Consultoria com IA

| Código | Requisito                                                                                                 | Atores           | Prioridade | Dependências |
| :----- | :-------------------------------------------------------------------------------------------------------- | :--------------- | :--------- | :----------- |
| RF13   | Permitir **upload de fotografias** do rosto (frontal e perfil).                                           | Cliente          | Must       | RF03         |
| RF14   | O sistema deve analisar as fotos com IA para **detetar tipo de pele, acne, manchas, rugas e oleosidade**. | Sistema (IA)     | Must       | RF13         |
| RF15   | Gerar um **relatório personalizado** com diagnóstico e sugestões de rotina.                               | Sistema (IA)     | Must       | RF14         |
| RF16   | A análise deve ser guardada no histórico pessoal para futuras comparações.                                | Cliente, Sistema | Should     | RF15         |
| RF17   | O utilizador pode consultar **evolução da pele ao longo do tempo** através de gráficos.                   | Cliente          | Could      | RF16         |

---

## 4 Sistema de Recomendação e Personalização

| Código | Requisito                                                                                           | Atores      | Prioridade | Dependências |
| :----- | :-------------------------------------------------------------------------------------------------- | :---------- | :--------- | :----------- |
| RF18   | Com base na análise e histórico, o sistema recomenda **produtos personalizados** para o utilizador. | IA, Cliente | Must       | RF14, RF15   |
| RF19   | As recomendações devem indicar **motivo da sugestão** (ex: “ajuda a reduzir oleosidade”).           | Sistema     | Should     | RF18         |
| RF20   | O utilizador pode marcar recomendações como **“úteis” ou “não relevantes”** para treinar o modelo.  | Cliente     | Could      | RF18         |
| RF21   | O sistema deve sugerir **rotinas diárias** (manhã / noite) com base nos produtos adquiridos.        | Sistema     | Should     | RF18         |
| RF22   | Consultores podem rever recomendações e sugerir ajustes manuais.                                    | Consultor   | Could      | RF18         |

---

## 5 Simulação Virtual e Fotografias

| Código | Requisito                                                                             | Atores  | Prioridade | Dependências |
| :----- | :------------------------------------------------------------------------------------ | :------ | :--------- | :----------- |
| RF23   | Permitir simular **aplicação de maquilhagem virtual** com base na fotografia enviada. | Cliente | Could      | RF13         |
| RF24   | A IA deve gerar uma **visualização antes/depois** com os produtos recomendados.       | IA      | Should     | RF23         |
| RF25   | O sistema deve permitir **comparar imagens** (antes vs após 30 dias de uso).          | Cliente | Could      | RF16         |

---

## 6 Carrinho, Pagamentos e Histórico

| Código | Requisito                                                                              | Atores           | Prioridade | Dependências |
| :----- | :------------------------------------------------------------------------------------- | :--------------- | :--------- | :----------- |
| RF26   | Adicionar/remover produtos do **carrinho de compras**.                                 | Cliente          | Must       | RF07         |
| RF27   | Registar **encomendas e pagamentos** (gateway Stripe/PayPal/MBWay).                    | Cliente, Sistema | Must       | RF26         |
| RF28   | Histórico de compras com data, total, produtos e estado (pendente, enviado, entregue). | Cliente          | Must       | RF27         |
| RF29   | Permitir **devoluções ou trocas** com registo do motivo.                               | Cliente          | Could      | RF28         |
| RF30   | O cliente pode **recomprar produtos anteriores** com um clique.                        | Cliente          | Should     | RF28         |

---

## 7 Gestão Administrativa

| Código | Requisito                                                                            | Atores | Prioridade | Dependências |
| :----- | :----------------------------------------------------------------------------------- | :----- | :--------- | :----------- |
| RF31   | Dashboard de **estatísticas** (vendas, produtos mais vendidos, utilizadores ativos). | Admin  | Should     | RF27         |
| RF32   | Gestão de stock (alertas de baixo stock, atualização automática após compra).        | Admin  | Must       | RF27         |
| RF33   | Gestão de utilizadores (ativar, suspender, eliminar contas).                         | Admin  | Must       | RF01         |
| RF34   | Moderação de comentários e avaliações.                                               | Admin  | Should     | RF11         |
| RF35   | Exportação de dados para Excel/PDF (vendas, relatórios de IA, utilizadores).         | Admin  | Should     | RF31         |

---

## 8 Notificações e Comunicação

| Código | Requisito                                                                    | Atores             | Prioridade | Dependências |
| :----- | :--------------------------------------------------------------------------- | :----------------- | :--------- | :----------- |
| RF36   | Enviar notificações sobre promoções, novos produtos e estado das encomendas. | Sistema            | Must       | RF27         |
| RF37   | Enviar alertas personalizados (“Está na hora da sua rotina noturna”).        | Sistema (IA)       | Should     | RF21         |
| RF38   | Sistema de mensagens entre cliente e consultor (chat interno).               | Cliente, Consultor | Could      | RF05         |
| RF39   | Configuração de preferências de comunicação (email, app, push).              | Cliente            | Should     | RF36         |

---

## 9 Critérios de Aceitação

> Critérios de aceitção são descrições detalhadas que definem quando um requisito funcional está completo e funciona conforme esperado.

### Análise IA (RF13–RF17)

-   **Quando** o utilizador envia uma fotografia, **então** o sistema processa a imagem, identifica características da pele e apresenta um **relatório em menos de 10 segundos**.
-   O relatório deve conter: tipo de pele, principais problemas e **3 a 5 produtos sugeridos**.

### Recomendação Personalizada (RF18–RF22)

-   **Quando** um novo relatório é criado, **então** o utilizador vê recomendações específicas com descrição e motivo.
-   **Se** o utilizador marcar “não relevante”, o modelo regista esse feedback.

### Simulação Virtual (RF23–RF25)

-   **Ao enviar uma fotografia**, o utilizador pode escolher produtos de maquilhagem e ver a simulação antes/depois.
-   O sistema guarda a comparação e permite visualização futura.

### Compras e Histórico (RF26–RF30)

-   **Quando** o utilizador finaliza o pagamento, **então** é criada uma encomenda com estado “Pendente”.
-   O estado muda para “Entregue” apenas após confirmação do envio.

### Gestão Administrativa (RF31–RF35)

-   **O administrador** pode aceder ao painel com número total de utilizadores, encomendas e produtos em stock.
-   **Quando** um produto tem <5 unidades, **então** o sistema emite alerta de stock.

---
