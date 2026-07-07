# Funcionalidades e Requisitos - Orelle

## Requisitos Funcionais

### 1. Sistema de Login
**Status:** Não implementado (UI preparada)

#### Descrição
Sistema de autenticação de utilizadores para acesso personalizado à plataforma.

#### Elementos Visuais Presentes
- Ícone de usuário no header (`<User />`)
- Botão de perfil/login no canto superior direito

#### Implementação Futura
- Modal de login/registro
- Integração com backend de autenticação
- Gestão de sessão
- Recuperação de senha

---

### 2. Recomendações Personalizadas
**Status:** Simulado via Chat IA

#### Descrição
Sistema de recomendação de produtos baseado em:
- Tipo de pele do utilizador
- Preferências pessoais
- Histórico de navegação
- Análise de fotografias

#### Implementação Atual
- Chat interativo com IA
- Resposta automática simulada após 1 segundo
- Sugestões rápidas pré-definidas

#### Fluxo do Usuário
1. Utilizador abre o chat IA (botão flutuante ou header)
2. Pode escolher sugestão rápida ou escrever pergunta
3. Pode enviar foto da pele (botão câmera)
4. IA responde com recomendações personalizadas
5. Produtos sugeridos são apresentados

#### Implementação Futura
- Integração com modelo de IA real
- Análise de imagem com Computer Vision
- Base de dados de produtos e ingredientes
- Sistema de matching inteligente

---

### 3. Simulação Virtual
**Status:** Conceitual (não implementado)

#### Descrição
Funcionalidade para experimentação virtual de produtos de maquiagem.

#### Casos de Uso
- Testar diferentes tons de batom
- Experimentar paletas de sombras
- Visualizar resultado de bases
- Comparar produtos lado a lado

#### Implementação Futura
- Integração com AR (Realidade Aumentada)
- Captura de foto via webcam
- Aplicação virtual de maquiagem
- Guardar looks favoritos

---

### 4. Histórico de Compras
**Status:** Não implementado

#### Descrição
Registo de todas as compras realizadas pelo utilizador.

#### Funcionalidades Planeadas
- Lista de pedidos com status
- Detalhes de cada compra
- Opção de recompra rápida
- Download de faturas
- Tracking de envios

#### Dados a Armazenar
- Data da compra
- Produtos adquiridos
- Valores pagos
- Método de pagamento
- Estado do pedido
- Informações de envio

---

### 5. Carrinho de Compras
**Status:** UI implementada (funcionalidade básica)

#### Elementos Visuais
- Ícone de carrinho no header
- Badge indicando quantidade de itens (atualmente fixo em "3")
- Botão "Adicionar" em cada ProductCard

#### Funcionalidades Atuais
- Exibição visual do carrinho
- Botão de adicionar produto

#### Implementação Futura
- State management do carrinho
- Adicionar/remover produtos
- Atualizar quantidades
- Calcular subtotal e total
- Cupons de desconto
- Modal/página de carrinho completo
- Checkout process
- Integração com pagamento

---

## Funcionalidades Implementadas

### 1. Catálogo de Produtos

#### Características
- **6 produtos** de exemplo
- **3 categorias:** Cuidado Facial, Maquiagem, Tratamentos
- **Sistema de filtros** via tabs
- **Informações completas:**
  - Nome e descrição
  - Preço atual e original (se em promoção)
  - Avaliações (rating + número de reviews)
  - Categoria
  - Badge "Novo" para lançamentos

#### Organização
```typescript
Todos (6 produtos)
├── Cuidado Facial (4 produtos)
├── Maquiagem (2 produtos)
└── [Tratamentos não tem tab próprio, aparece em "Todos"]
```

---

### 2. Chat com IA

#### Características Implementadas
- **Modal responsivo** com altura fixa
- **Histórico de mensagens** com scroll
- **Interface de chat** moderna
  - Mensagens do usuário à direita (borgonha)
  - Mensagens da IA à esquerda (branco areia)
  - Avatares diferenciados
  
- **Sugestões rápidas** (aparecem no início):
  - "Analisar foto da minha pele"
  - "Produtos para pele seca"
  - "Sugestões para evento noturno"
  - "Rotina de cuidados diária"

- **Botões de ação:**
  - Câmera (para upload de foto)
  - Input de texto
  - Enviar mensagem

- **Simulação de IA:**
  - Resposta automática após 1 segundo
  - Indicadores de digitação (3 pontos animados)

#### Pontos de Acesso
1. Botão "Consultora IA" no header (desktop)
2. Botão flutuante no canto inferior direito
3. Botão "Consultar IA" no hero banner
4. Botão "Iniciar Consulta Gratuita" na seção de features
5. Botão "Iniciar Consulta Gratuita" na seção CTA

---

### 3. Interface Responsiva

#### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

#### Adaptações por Dispositivo

**Mobile:**
- Header simplificado (sem barra de pesquisa)
- Grid de produtos em 1 coluna
- Hero banner com altura reduzida
- Navegação principal oculta
- Botão IA apenas flutuante

**Tablet:**
- Grid de produtos em 2 colunas
- Header com mais elementos
- Features em 2 colunas

**Desktop:**
- Grid de produtos em 3 colunas
- Header completo com todos elementos
- Features em 4 colunas
- Duas formas de acessar IA (header + flutuante)

---

### 4. Sistema de Avaliações

#### Implementação
- Rating de 0 a 5 estrelas
- Visualização gráfica (estrelas preenchidas/vazias)
- Número de reviews entre parênteses
- Cores:
  - Estrelas ativas: Dourado (#9B7E3C)
  - Estrelas inativas: Cinza (#BFBFBF)

#### Dados dos Produtos
```typescript
rating: 4.8,     // 0-5
reviews: 234     // número inteiro
```

---

### 5. Promoções e Destaques

#### Badges "Novo"
- Produtos marcados com `isNew: true`
- Badge dourado no canto superior direito da imagem
- Texto "Novo"

#### Preços Promocionais
- `originalPrice`: preço original (opcional)
- `price`: preço atual
- Preço original exibido riscado quando existe
- Economia implícita para o utilizador

#### Produtos em Destaque
Atualmente 3 produtos com promoção:
1. Sérum Iluminador Radiance (€45.99 de €59.99)
2. Óleo Reparador Night Glow (€48.99 de €62.00)

---

### 6. Navegação e Estrutura

#### Header Fixo
- Permanece visível durante scroll (`sticky top-0`)
- Acesso rápido ao carrinho e perfil
- Pesquisa de produtos (UI presente)

#### Âncoras de Navegação
- Link "Produtos" leva para `#produtos`
- Link "Sobre" leva para `#sobre`
- Smooth scroll implementado pelo browser

#### Footer
Organizado em 4 colunas:
1. **Orelle** - Informação da marca
2. **Produtos** - Links de categorias
3. **Ajuda** - Links de suporte
4. **Sobre** - Links institucionais

---

### 7. Testador de Paletas de Cores

#### ColorSwitcher Component
Ferramenta de desenvolvimento para testar diferentes paletas.

#### Funcionalidades
- 12 paletas pré-definidas
- 3 paletas marcadas como "Recomendadas"
- Alteração dinâmica via CSS variables
- Duas visualizações: Lista e Grade
- Minimização do painel
- Indicador da paleta ativa

#### Uso
Permite testar rapidamente como a interface ficaria com diferentes cores primárias sem alterar código.

---

## User Experience (UX)

### 1. Micro-interações

#### Hover Effects
- Cards de produtos: elevação da sombra
- Botões: mudança de cor/opacidade
- Links: mudança de cor
- Imagens de produtos: zoom sutil

#### Animações
- Botão flutuante de IA: ring pulsante
- Badge "IA": bounce animation
- Indicadores de digitação: pulse sequencial
- Transições suaves em todos elementos interativos

### 2. Visual Feedback

#### Estados Interativos
- **Hover:** Mudança visual clara
- **Active:** Feedback imediato
- **Disabled:** Botões desabilitados quando apropriado
- **Loading:** Indicadores de carregamento no chat

#### Indicadores Visuais
- Badge de quantidade no carrinho
- Badge "Novo" em produtos
- Estrelas de avaliação
- Preços promocionais destacados

### 3. Acessibilidade

#### Boas Práticas Implementadas
- Contraste adequado de cores
- Textos alternativos em imagens
- Tamanhos de fonte legíveis
- Áreas de clique adequadas em mobile
- Navegação por teclado (Enter no chat)

#### Áreas de Melhoria Futura
- ARIA labels completos
- Navegação por tab otimizada
- Screen reader optimization
- Modo de alto contraste

---

## Integrações Futuras

### 1. Backend / API
- Sistema de autenticação
- Gestão de produtos
- Processamento de pagamentos
- Gestão de pedidos
- Histórico de utilizador

### 2. IA e Machine Learning
- Modelo de recomendação personalizada
- Computer Vision para análise de pele
- Processamento de linguagem natural (NLP)
- Sistema de tags e categorização inteligente

### 3. Serviços Externos
- Gateway de pagamento (Stripe, PayPal)
- Serviço de envio/tracking
- Email marketing
- Analytics e tracking
- CDN para imagens

### 4. Features Avançadas
- Wishlist/Lista de desejos
- Comparador de produtos
- Reviews e comentários de clientes
- Programa de fidelidade
- Notificações push
- App mobile nativa

---

## Métricas e Analytics (Futuro)

### KPIs Importantes
- Taxa de conversão
- Valor médio do carrinho
- Taxa de abandono do carrinho
- Tempo médio na página
- Produtos mais visualizados
- Eficácia da IA (satisfação)
- Taxa de retorno de clientes

### Tracking de Eventos
- Cliques em produtos
- Uso do chat IA
- Adições ao carrinho
- Início de checkout
- Compras finalizadas
- Uso de filtros
- Pesquisas realizadas

---

## Segurança e Privacidade

### Considerações Importantes
⚠️ **Figma Make não é indicado para:**
- Coleta de PII (Personally Identifiable Information)
- Armazenamento de dados sensíveis
- Processamento de pagamentos reais
- Dados médicos ou de saúde

### Implementação Futura em Produção
- HTTPS obrigatório
- Encriptação de dados sensíveis
- Conformidade com GDPR/LGPD
- Política de privacidade clara
- Termos de uso
- Cookie consent
- Backup regular de dados
