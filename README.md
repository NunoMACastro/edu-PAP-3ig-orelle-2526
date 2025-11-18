# Orélle - Consultoria Cosmética Inteligente

A Orélle é uma plataforma de consultoria cosmética inteligente que combina análise facial por IA, rotinas de skincare personalizadas e comércio eletrónico especializado. O sistema permite que clientes recebam diagnósticos de pele rápidos e rigorosos, baseados em fotografias e modelos avançados de deteção de imperfeições e obtenham recomendações de produtos alinhadas com os seus objetivos, preferências e histórico evolutivo.

Além do diagnóstico automático, a Orélle integra consultores reais que podem validar relatórios, ajustar rotinas, acompanhar clientes e gerir campanhas. A aplicação inclui catálogo detalhado de produtos, recomendação inteligente, rotinas personalizadas, simulação virtual antes/depois, carrinho e checkout completos, e um painel administrativo para gestão de stock, campanhas e privacidade.

O projeto foi desenvolvido no âmbito da PAP de Informática de Gestão (2025/2026), com foco em experiência premium, privacidade rigorosa de dados biométricos e integração ética de IA aplicada à cosmética.

---

**Índice**

1. [Contexto do Projeto](#contexto-do-projeto)
2. [Visão e Objetivos](#visão-e-objetivos)
3. [Público-Alvo e Stakeholders](#público-alvo-e-stakeholders)
4. [Funcionalidades Principais](#funcionalidades-principais)
5. [Requisitos Não Funcionais Essenciais](#requisitos-não-funcionais-essenciais)
6. [Stack e Arquitetura Recomendada](#stack-e-arquitetura-recomendada)
7. [Roadmap para o MVP (inclui todos os RF)](#roadmap-para-o-mvp-inclui-todos-os-rf)
8. [Identificação e Créditos](#identificação-e-créditos)
9. [Licença](#licença)
10. [Changelog](#changelog)

---

## Contexto do Projeto

-   Consultoria digital para cuidados da pele orientada para clientes que procuram recomendações personalizadas.
-   Junta diagnóstico automático, acompanhamento de consultores e experiências de compra com storytelling da marca.
-   Diferencia-se pela componente ética/privacidade nos dados biométricos e por experiências de simulação virtual.

---

## Visão e Objetivos

1. Oferecer diagnósticos de pele rápidos, precisos e compreensíveis, suportados por IA.
2. Criar rotinas e kits personalizadas com base em objetivos e evolução do cliente.
3. Reforçar a relação cliente-consultor com ferramentas digitais (chat, alertas e relatórios).
4. Garantir segurança e consentimento explícito em todos os processos envolvendo imagens faciais.

---

## Público-Alvo e Stakeholders

-   **Clientes finais** – procuram recomendações personalizadas e acompanhamento contínuo.
-   **Consultores/dermoconselheiros** – validam relatórios, ajustam rotinas e gerem contactos.
-   **Administradores da marca** – gerem catálogo, campanhas, stock e políticas de privacidade.
-   **Equipa técnica** – responsável pela IA, integração de pagamentos e conformidade legal.

---

## Funcionalidades Principais

### Utilizadores, Perfis e Preferências

-   Registo/login seguro, perfis detalhados (nome, idade, género, objetivos, histórico médico simplificado) e atualização periódica de fotografias (RF01–RF06).
-   Preferências de marcas, alergias, ingredientes a evitar e preferências de comunicação.

### Catálogo e Conteúdo

-   Produtos com ingredientes, etiquetas (tipo de pele, rotina, estação), relações entre artigos complementares e avaliações de clientes (RF07–RF12).
-   Pesquisa e filtros avançados, páginas detalhadas com notas de consultores e recomendações cruzadas.

### IA de Análise e Relatórios

-   Upload de fotografias frontal/perfil, deteção de acne, manchas, rugas, oleosidade e tipo de pele (RF13–RF17).
-   Relatórios personalizados com diagnóstico, justificações, nível de prioridade e histórico evolutivo.
-   Comparação temporal via gráficos e alertas para repetir avaliação após X semanas.

### Recomendação e Personalização

-   Motor que cruza diagnóstico, objetivos, feedback e preferências para sugerir rotinas completas (RF18–RF22).
-   Possibilidade de marcar “não relevante” para refinar recomendações e criar planos semanais.
-   Kits automáticos agrupados por manhã/noite, com instruções passo a passo.

### Simulação Virtual e Experiências

-   Ferramenta de antes/depois para maquilhagem ou aplicação de determinados produtos (RF23–RF25).
-   Partilha opcional nas redes sociais e armazenamento para comparação futura.

### Commerce e Atendimento

-   Carrinho, check-out, métodos de pagamento (Stripe, PayPal, MBWay), gestão de encomendas e histórico (RF26–RF30).
-   Painel administrativo para stock, alertas de ruturas, campanhas e códigos promocionais (RF31–RF35).
-   Chat opcional cliente ↔ consultor, notificações e acompanhamento pós-venda (RF36–RF39).

> Detalhes completos em [`docs/RF.md`](docs/RF.md#índice).

---

## Requisitos Não Funcionais Essenciais

-   **Usabilidade/Design** – UI responsiva, alinhada com estética da marca, feedback imediato e modo escuro (RNF01–RNF04).
-   **Performance** – Páginas ≤3s, análise fotográfica ≤10s, otimização de imagens via compressão e lazy loading (RNF05–RNF08).
-   **Segurança/Privacidade** – HTTPS, hashing seguro, encriptação de fotos/relatórios, consentimento explícito e direito ao esquecimento (RNF09–RNF14).
-   **Compatibilidade/Integração** – Browsers modernos, exportação PDF de relatórios, gateways de pagamento e APIs de IA (RNF15–RNF18).
-   **Manutenção/Operação** – Código modular documentado, logs de erros, backups diários e ambientes separados (RNF19–RNF22).
-   **Ética IA** – Explicabilidade das recomendações, não discriminação por género/idade/tom de pele e restrição no uso de imagens para treino (RNF23–RNF25).

> Detalhes completos em [`docs/RNF.md`](docs/RNF.md#índice).

---

## Stack e Arquitetura Recomendada

```
frontend/   # React + Vite, TypeScript, Tailwind, componentes reutilizáveis com modo claro/escuro
backend/    # Node.js (Express) com Multer para upload e módulos para utilizadores, análises e encomendas
docs/       # RF, RNF, arquitetura, decisões e guidelines de privacidade
scripts/    # Automação de ingestão de catálogo, seeds, tarefas DevOps
```

-   **Base de dados:** MongoDB para perfis, análises e histórico; CDN/cloud storage para imagens encriptadas.
-   **IA:** Azure Face API ou microserviço FastAPI + TensorFlow treinado para detetar problemas de pele.
-   **Pagamentos:** Stripe/PayPal/MBWay com webhooks de encomendas.
-   **DevOps:** Render/Railway, CDN (Cloudflare/AWS) para imagens, monitorização e backups automáticos.

---

## Roadmap para o MVP (inclui todos os RF)

1. **Fase 1 - Diagnóstico e Catálogo:** onboarding, upload/análise básica, catálogo navegável e relatórios iniciais.
2. **Fase 2 - Personalização e Commerce:** motor de recomendações, carrinho/pagamentos, histórico e painel administrativo.
3. **Fase 3 - Experiência Premium:** simulação virtual, chat com consultor, alertas, evolução visual e campanhas.
4. **Fase 4 - Operação e Escala:** otimizações de desempenho, integrações avançadas de IA e reforço de privacidade.

---

## Identificação e Créditos

> **Projeto:** Orélle - Consultoria Cosmética Inteligente  
> **Tipo:** PAP - Curso Profissional de Informática de Gestão  
> **Áreas:** Programação · Gestão · Base de Dados  
> **Ano letivo:** 2025/2026  
> **Versão:** 1.0  
> **Equipa:** [Bruna, Izelicks, Aline, Daniel Bulica]  
> **Professor Orientador:** Nuno Castro e Cláudia Marques

---

## Licença

Projeto académico. Uso restrito a fins educativos.

---

## Changelog

-   **2024-04-27** – README atualizado com estrutura uniforme, funcionalidades detalhadas e roadmap.
