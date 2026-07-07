# Seções da Interface - Orelle

Este documento detalha cada seção visual da interface, suas características e propósitos.

---

## 1. Header (Cabeçalho)

### Posicionamento
- Fixo no topo (`sticky top-0`)
- Z-index: 50
- Sempre visível durante scroll

### Cor de Fundo
- Borgonha (#591C21)
- Texto branco areia (#F5EFE7)

### Elementos

#### Logo (Esquerda)
```
"Orelle"
```
- Tamanho: H1
- Cor: #F5EFE7

#### Barra de Pesquisa (Centro)
- Largura máxima: `max-w-xl`
- Ícone de lupa à esquerda
- Placeholder: "Pesquisar produtos..."
- Fundo: Branco areia (#F5EFE7)
- Texto: Preto carvão (#1E1E1E)
- **Visibilidade:** Desktop only (`hidden md:flex`)

#### Navegação (Direita)
Da esquerda para direita:

1. **Botão "Consultora IA"**
   - Fundo dourado (#9B7E3C)
   - Ícone Sparkles
   - Ação: Abre modal de chat
   - Visibilidade: Desktop only

2. **Link "Produtos"**
   - Vai para `#produtos`
   - Hover: Rosa metálico
   - Visibilidade: Desktop only

3. **Link "Sobre"**
   - Vai para `#sobre`
   - Hover: Rosa metálico
   - Visibilidade: Desktop only

4. **Botão Perfil/Login**
   - Ícone: User
   - Ghost variant
   - Hover: Rosa metálico

5. **Botão Carrinho**
   - Ícone: ShoppingCart
   - Badge: "3" (dourado)
   - Ghost variant
   - Hover: Rosa metálico

### Altura
- Padding vertical: `py-4`

---

## 2. Hero Banner (Banner Principal)

### Dimensões
- Altura: 500px em mobile, 600px em desktop
- `h-[500px] md:h-[600px]`

### Background
- **Imagem:** Mulher aplicando maquiagem/cosméticos
- **URL:** Unsplash image
- Posicionamento: `bg-cover bg-center`
- **Sem gradiente overlay** (removido para visibilidade)

### Conteúdo (Alinhado à Esquerda)

#### Badge "Novo na Orelle"
- Fundo dourado (#9B7E3C)
- Texto branco areia (#F5EFE7)

#### Título Principal
```
"Descubra a Beleza com Inteligência"
```
- Tamanho: `text-4xl md:text-6xl`
- Cor: Preto (#1E1E1E)
- Peso: Definido em globals.css

#### Subtítulo
```
"Consultoria personalizada de cosméticos com IA. 
Encontre os produtos perfeitos para você."
```
- Tamanho: `text-lg md:text-xl`
- Cor: Preto (#1E1E1E)

#### Botões de Ação

1. **Botão "Consultar IA"**
   - Fundo borgonha
   - Ícone Sparkles
   - Tamanho: Large
   - Ação: Abre modal de chat

2. **Botão "Explorar Produtos"**
   - Variant: Outline
   - Fundo: Branco 90% opaco
   - Borda: Borgonha
   - Texto: Borgonha
   - Hover: Fundo borgonha, texto branco

### Largura do Conteúdo
- Max-width: `max-w-2xl`
- Container: `container mx-auto px-4`

---

## 3. AI Consultant Banner (Seção de Consultora IA)

### Background
- Gradiente: `from-[#F5EFE7] via-white to-[#F5EFE7]`
- Elementos decorativos blur (rosa e borgonha)

### Padding
- Vertical: `py-20`

### Layout
- Grid de 2 colunas em desktop
- 1 coluna em mobile
- Gap: 12 (`gap-12`)

### Coluna Esquerda - Informações

#### Badge "Consultora Virtual Disponível"
- Gradiente dourado
- Ícone Sparkles
- Sombra média

#### Título
```
"Encontre Seus Produtos Ideais com IA"
```
- Tamanho: `text-3xl md:text-5xl`
- Cor: Preto carvão

#### Descrição
Parágrafo explicativo sobre a consultora virtual.

#### 3 Cards de Features
Cada card contém:
- Ícone em círculo borgonha
- Título em negrito
- Descrição pequena
- Fundo: Branco 80% + backdrop blur
- Borda: Rosa metálico 30%

Features:
1. **Análise de Pele por Foto** (Sparkles)
2. **Recomendações Personalizadas** (Award)
3. **Consultoria Gratuita 24/7** (Heart)

#### Call-to-Action
Botão grande com gradiente dourado:
```
"Iniciar Consulta Gratuita Agora"
```

### Coluna Direita - Demo do Chat

#### Container
- Fundo branco
- Border radius: `rounded-2xl`
- Padding: 8
- Borda: Rosa metálico 30%
- Sombra: XL

#### Mensagens de Exemplo
3 mensagens simuladas:
1. **IA:** "Olá! Qual é o seu tipo de pele?"
2. **Usuário:** "Tenho pele mista e estou procurando um sérum iluminador"
3. **IA:** "Perfeito! Recomendo o Sérum Iluminador Radiance..."

#### Indicador de Digitação
3 pontos animados com pulse e delay sequencial.

---

## 4. Features Section (Por Que Escolher a Orelle?)

### Background
- Gradiente: `from-white via-[#F5EFE7]/30 to-white`

### Padding
- Vertical: `py-20`

### Cabeçalho Centralizado

#### Título
```
"Por Que Escolher a Orelle?"
```

#### Subtítulo
```
"Tecnologia e beleza se encontram para oferecer a melhor experiência"
```

### Grid de Features
- 4 colunas em desktop
- 2 colunas em tablet
- 1 coluna em mobile
- Gap: 6

### Card de Feature (4 cards)

#### Estrutura
1. **Ícone Container**
   - Tamanho: 14x14 (`w-14 h-14`)
   - Fundo: Gradiente borgonha
   - Cor do ícone: Branco areia
   - Border radius: `rounded-xl`
   - Hover: Scale 110%

2. **Título**
   - Cor: Preto carvão

3. **Descrição**
   - Texto pequeno
   - Cor: Preto 60% opacidade

#### Hover Effect
- Escala: 105%
- Sombra: MD → XL
- Transição: 300ms

#### Features Listadas
1. **IA Personalizada** (Sparkles)
   - "Recomendações baseadas no seu tipo de pele e preferências"

2. **Tendências** (TrendingUp)
   - "Produtos mais populares e lançamentos exclusivos"

3. **Qualidade Premium** (Award)
   - "Produtos certificados e de marcas reconhecidas"

4. **Consulta Gratuita** (Heart)
   - "Assistência personalizada com nossa consultora virtual"

---

## 5. Products Section (Produtos em Destaque)

### ID
`#produtos` - Para navegação por âncora

### Padding
- Vertical: `py-16`

### Background
- Branco areia (#F5EFE7)

### Cabeçalho Centralizado

#### Título
```
"Produtos em Destaque"
```

#### Subtítulo
```
"Explore nossa seleção exclusiva de cosméticos premium. 
Use nossa IA para encontrar produtos ideais para você."
```
- Cor: #D9D9D9 (cinza claro)

### Sistema de Tabs

#### TabsList
- 3 tabs horizontais
- Largura máxima: `max-w-md`
- Centralizado
- Fundo: Branco
- Borda: Rosa metálico

#### Tabs
1. **Todos** - Mostra todos os 6 produtos
2. **Cuidado Facial** - Filtra por categoria
3. **Maquiagem** - Filtra por categoria

#### Tab Ativo
- Fundo: Borgonha
- Texto: Branco areia

### Grid de Produtos
- 3 colunas em desktop
- 2 colunas em tablet
- 1 coluna em mobile
- Gap: 6

### Produtos (6 cards)

Ver seção de ProductCard em COMPONENTS.md para detalhes completos.

**Lista de Produtos:**
1. Sérum Iluminador Radiance - €45.99 (de €59.99) ⭐ NOVO
2. Paleta Luxury Rose Gold - €52.00 ⭐ NOVO
3. Creme Hidratante Velvet - €38.50
4. Óleo Reparador Night Glow - €48.99 (de €62.00)
5. Base Liquid Silk - €42.00 ⭐ NOVO
6. Máscara Revitalizante - €29.90

---

## 6. CTA Section (Call-to-Action)

### Background
- Fundo sólido borgonha (#591C21)
- Texto branco areia (#F5EFE7)

### Padding
- Vertical: `py-20`

### Conteúdo (Centralizado)

#### Ícone Sparkles
- Tamanho: 16x16
- Cor: Dourado (#9B7E3C)
- Margin bottom: 6

#### Título
```
"Experimente Nossa Consultora IA"
```
- Cor: Branco areia

#### Descrição
```
"Envie uma foto ou descreva suas necessidades. 
Nossa IA analisará e recomendará os produtos perfeitos para você."
```
- Cor: Rosa metálico (#E7BFBF)
- Max-width: `max-w-2xl`

#### Botão
```
"Iniciar Consulta Gratuita"
```
- Fundo: Dourado (#9B7E3C)
- Tamanho: Large
- Ícone: Sparkles
- Ação: Abre modal de chat

---

## 7. Footer (Rodapé)

### Background
- Preto carvão (#1E1E1E)
- Texto: Branco areia (#F5EFE7)

### Padding
- Vertical: `py-12`

### Layout
- Grid de 4 colunas em desktop
- 1 coluna em mobile
- Gap: 8

### Colunas

#### 1. Orelle (Informação da Marca)
```
Título: "Orelle"
Descrição: "Plataforma de venda e consultoria de 
cosméticos com IA personalizada."
```

#### 2. Produtos
Links:
- Cuidado Facial
- Maquiagem
- Tratamentos
- Novidades

#### 3. Ajuda
Links:
- FAQ
- Envios
- Devoluções
- Contacto

#### 4. Sobre
Links:
- Quem Somos
- Consultora IA
- Privacidade
- Termos

### Hover em Links
- Cor: Rosa metálico (#E7BFBF)

### Copyright
```
"© 2025 Orelle. Todos os direitos reservados."
```
- Borda superior: Cinza 20% opacidade
- Padding top: 8
- Centralizado
- Texto pequeno
- Cor: #D9D9D9

---

## 8. Floating AI Chat Button (Botão Flutuante)

### Posicionamento
- Fixo no canto inferior direito
- `fixed bottom-6 right-6`
- Z-index: 40

### Estrutura

#### Efeito Pulsante
- Ring animado com `animate-ping`
- Fundo dourado 20% opacidade
- Border radius: Full

#### Botão Principal
- Tamanho: 16x16 (`w-16 h-16`)
- Forma: Circular (`rounded-full`)
- Fundo: Borgonha
- Borda: Dourado 2px
- Sombra: 2XL
- Ícone: Sparkles (6x6)

#### Badge "IA"
- Posição: Canto superior direito
- Fundo: Dourado
- Texto: Branco areia
- Tamanho: 6x6
- Animação: Bounce

### Tooltip (Hover)
```
"Consultora IA disponível"
```
- Fundo: Borgonha
- Texto: Branco areia
- Posição: Acima do botão
- Seta apontando para baixo
- Opacity: 0 → 100% on hover
- Pointer events: none

### Ação
Clique abre o modal AIChat.

---

## 9. AI Chat Dialog (Modal)

Ver seção de AIChat em COMPONENTS.md para detalhes completos.

### Resumo Visual

#### Dimensões
- Largura máxima: `max-w-2xl`
- Altura: `h-[600px]`

#### Header
- Fundo: Borgonha
- Título: "Consultora IA Orelle"
- Descrição: "Assistente pessoal de beleza"
- Avatar da IA (Sparkles)
- Botão de fechar (X)

#### Body
- Área de scroll
- Fundo: Branco areia
- Mensagens alternadas (usuário/IA)
- Sugestões rápidas (inicial)

#### Footer
- Fundo: Branco
- Botão câmera
- Input de texto
- Botão enviar

---

## Fluxo de Navegação

### Entrada na Página
1. Header sempre visível
2. Hero banner com impacto visual
3. Scroll para baixo revela seções

### Interação com IA (5 pontos de acesso)
1. Botão no header (desktop)
2. Botão no hero banner
3. Botão na seção AI Consultant
4. Botão flutuante (sempre visível)
5. Botão na seção CTA

### Navegação de Produtos
1. Link "Produtos" no header → scroll para #produtos
2. Botão "Explorar Produtos" no hero → scroll para #produtos
3. Tabs para filtrar por categoria

### Footer
1. Scroll até o final
2. Links organizados por tópicos
3. Copyright e informações legais

---

## Responsividade Resumida

### Mobile (< 768px)
- Header simplificado
- Hero banner 500px altura
- Grids em 1 coluna
- Botão IA apenas flutuante

### Tablet (768px - 1024px)
- Header expandido
- Grids em 2 colunas
- Alguns elementos ainda ocultos

### Desktop (> 1024px)
- Layout completo
- Todas funcionalidades visíveis
- Grids em 3-4 colunas
- Melhor uso do espaço horizontal

---

## Hierarquia Visual

### Ordem de Importância (Top → Bottom)

1. **Header** - Navegação principal e ações rápidas
2. **Hero Banner** - Primeiro impacto, CTA principal
3. **AI Consultant** - Diferencial da plataforma
4. **Features** - Benefícios e confiança
5. **Products** - Conversão (compra)
6. **CTA** - Última chance de engajamento
7. **Footer** - Informações de suporte

### Elementos Sempre Visíveis
- Header (sticky)
- Botão flutuante de IA (fixed)

### Elementos de Maior Destaque
- Botões de ação (bordados em dourado ou borgonha)
- Títulos principais (tamanho grande)
- Badges "Novo" (dourado)
- Preços promocionais (destaque visual)
