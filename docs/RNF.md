# Requisitos Não Funcionais — Aplicação **Orélle**

> **PAP — Curso Profissional de Informática de Gestão**  
> **Áreas:** Programação · Gestão · Base de Dados  
> **Ano letivo:** 2025/2026  
> **Versão:** 1.0  
> **Elaborado por:** [Nome do Grupo]  
> **Professor Orientador:** Nuno Miguel Almeida Castro

---

## Índice

1. [Usabilidade e Design](#1-usabilidade-e-design)
2. [Performance e Escalabilidade](#2-performance-e-escalabilidade)
3. [Segurança e Privacidade](#3-segurança-e-privacidade)
4. [Integração e Compatibilidade](#4-integração-e-compatibilidade)
5. [Manutenção e Qualidade](#5-manutenção-e-qualidade)
6. [Experiência de IA e Ética](#6-experiência-de-ia-e-ética)
7. [Stack Tecnológica Recomendada](#7-stack-tecnológica-recomendada)

---

## 1 Usabilidade e Design

| Código | Requisito                                                                 | Tipo           | Prioridade |
| :----- | :------------------------------------------------------------------------ | :------------- | :--------- |
| RNF01  | Interface moderna, intuitiva e _responsive_ (desktop e mobile).           | Usabilidade    | Must       |
| RNF02  | Design coerente com estética da marca (cores suaves, tipografia moderna). | Usabilidade    | Should     |
| RNF03  | Mensagens claras, ícones acessíveis e feedback imediato em formulários.   | Usabilidade    | Must       |
| RNF04  | Modo escuro e contraste ajustado.                                         | Acessibilidade | Could      |

---

## 2 Performance e Escalabilidade

| Código | Requisito                                                    | Tipo           | Prioridade |
| :----- | :----------------------------------------------------------- | :------------- | :--------- |
| RNF05  | Processar análise de fotografia em menos de **10 segundos**. | Performance    | Must       |
| RNF06  | Páginas principais devem carregar em **≤ 3 segundos**.       | Performance    | Must       |
| RNF07  | Suportar **mínimo 50 utilizadores simultâneos** sem falhas.  | Escalabilidade | Should     |
| RNF08  | Imagens otimizadas (lazy loading e compressão automática).   | Performance    | Should     |

---

## 3 Segurança e Privacidade

| Código | Requisito                                                                | Tipo        | Prioridade |
| :----- | :----------------------------------------------------------------------- | :---------- | :--------- |
| RNF09  | Todas as comunicações via **HTTPS (TLS 1.2+)**.                          | Segurança   | Must       |
| RNF10  | Palavras-passe com **hash seguro (bcrypt)**.                             | Segurança   | Must       |
| RNF11  | Fotografias e relatórios de análise armazenados de forma **encriptada**. | Privacidade | Must       |
| RNF12  | Consentimento explícito para análise facial (RGPD).                      | Privacidade | Must       |
| RNF13  | Direito a eliminar conta e dados (incluindo fotos).                      | Privacidade | Must       |
| RNF14  | Sessões autenticadas com **cookies HttpOnly**.                           | Segurança   | Must       |

---

## 4 Integração e Compatibilidade

| Código | Requisito                                                              | Tipo            | Prioridade |
| :----- | :--------------------------------------------------------------------- | :-------------- | :--------- |
| RNF15  | Compatível com **Chrome, Safari, Edge e Firefox**.                     | Compatibilidade | Must       |
| RNF16  | Exportação de relatórios em **PDF**.                                   | Compatibilidade | Should     |
| RNF17  | Integração com **gateways de pagamento** (Stripe, PayPal, MBWay).      | Integração      | Must       |
| RNF18  | Suporte para **API de IA externa** (ex: Azure Face API ou TensorFlow). | Integração      | Should     |

---

## 5 Manutenção e Qualidade

| Código | Requisito                                             | Tipo        | Prioridade |
| :----- | :---------------------------------------------------- | :---------- | :--------- |
| RNF19  | Código modular (MVC) com documentação e _docstrings_. | Manutenção  | Must       |
| RNF20  | Logs de erros e métricas de desempenho.               | Operação    | Should     |
| RNF21  | Base de dados com backups automáticos diários.        | Fiabilidade | Should     |
| RNF22  | Ambiente de testes separado do ambiente de produção.  | Operação    | Should     |

---

## 6 Experiência de IA e Ética

| Código | Requisito                                                                                    | Tipo                  | Prioridade |
| :----- | :------------------------------------------------------------------------------------------- | :-------------------- | :--------- |
| RNF23  | A IA deve indicar **como chegou às recomendações** (explicabilidade).                        | Ética / Transparência | Must       |
| RNF24  | O sistema deve garantir **não discriminação** por género, idade ou tom de pele.              | Ética                 | Must       |
| RNF25  | As imagens processadas não devem ser usadas para treinar modelos externos sem consentimento. | Privacidade           | Must       |

---

## 7 Stack Tecnológica Recomendada

### Frontend

-   React.js com Vite para construção rápida e eficiente.
-   Tailwind CSS para estilos utilitários.

### Backend

-   Node.js com Express para API RESTful.
-   Multer para upload seguro de imagens.

### Base de Dados

-   MongoDB para armazenamento de perfis, histórico e análises.

### IA

-   Azure Face API para análise facial.  
    ou
-   Microserviço Python (FastAPI + TensorFlow) para deteção de acne, manchas e oleosidade.
-   Modelos treinados com datasets diversificados para evitar viés.
-   APIs seguras para possível análise remota (OpenAI, Hugging Face).

### DevOps

> DevOps é o conjunto de práticas que combina desenvolvimento de software (Dev) e operações de TI (Ops). O objetivo é encurtar o ciclo de vida do desenvolvimento de sistemas, proporcionando entrega contínua com alta qualidade de software.

-   Render ou Railway para deploy simplificado.
-   CDN (Cloudflare, AWS CloudFront) para servir imagens rapidamente.
-   Versionamento com GitHub Classroom para controlo de versões e colaboração.

---
