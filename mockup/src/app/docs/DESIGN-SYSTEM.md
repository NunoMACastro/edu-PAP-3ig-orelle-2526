# Sistema de Design - Orelle

## Paleta de Cores

### Cores Principais

#### Borgonha (Primary)
- **HEX:** `#591C21`
- **Uso:** Cor primária da marca, cabeçalho, botões principais, elementos de destaque
- **CSS Variable:** `--color-primary` ou `--primary`
- **Tailwind Class:** `bg-primary`, `text-primary`, `border-primary`

#### Rosa Metálico (Secondary)
- **HEX:** `#E7BFBF`
- **Uso:** Cor secundária, bordas, hover states, elementos decorativos
- **Tailwind Class:** `bg-[#E7BFBF]`, `text-[#E7BFBF]`, `border-[#E7BFBF]`

#### Branco Areia (Background)
- **HEX:** `#F5EFE7`
- **Uso:** Cor de fundo principal da página, backgrounds secundários
- **Tailwind Class:** `bg-[#F5EFE7]`, `text-[#F5EFE7]`

#### Preto Carvão (Text Primary)
- **HEX:** `#1E1E1E`
- **Uso:** Texto principal, títulos, conteúdo importante
- **Tailwind Class:** `bg-[#1E1E1E]`, `text-[#1E1E1E]`

#### Cinza (Text Secondary)
- **HEX:** `#6B6B6B`
- **Uso:** Descrições de produtos, texto secundário, legendas
- **Tailwind Class:** `text-[#6B6B6B]`

#### Dourado (Alerts/Highlights)
- **HEX:** `#9B7E3C`
- **Uso:** Alertas, badges especiais, destaques importantes, botões de ação secundários
- **Tailwind Class:** `bg-[#9B7E3C]`, `text-[#9B7E3C]`

### Cores Auxiliares

#### Cinza Claro
- **HEX:** `#D9D9D9`
- **Uso:** Legendas, texto de suporte no footer
- **Tailwind Class:** `text-[#D9D9D9]`

#### Cinza Médio
- **HEX:** `#8C8C8C`
- **Uso:** Categoria dos produtos, preços riscados
- **Tailwind Class:** `text-[#8C8C8C]`

#### Cinza de Bordas
- **HEX:** `#BFBFBF`
- **Uso:** Estrelas não preenchidas, elementos inativos
- **Tailwind Class:** `text-[#BFBFBF]`

#### Branco
- **HEX:** `#FFFFFF` ou `white`
- **Uso:** Cards de produtos, fundos de seções, modais
- **Tailwind Class:** `bg-white`, `text-white`

## Tipografia

### Hierarquia de Fontes

A tipografia está definida em `/styles/globals.css` através de tokens CSS. **IMPORTANTE:** Não usar classes Tailwind de tamanho de fonte, peso ou line-height, pois existem estilos padrão para cada elemento HTML.

#### H1 (Título Principal)
```css
/* Usado no banner hero */
font-size: responsive
/* Tailwind: text-4xl md:text-6xl */
```

#### H2 (Títulos de Seção)
```css
/* Usado em títulos de seções */
font-size: responsive
/* Tailwind: text-3xl md:text-5xl */
```

#### H3 (Subtítulos)
```css
/* Usado em cards de features */
font-size: responsive
```

#### H4 (Títulos Menores)
```css
/* Usado em items específicos */
font-size: responsive
```

#### Body Text
```css
/* Texto padrão */
/* Tailwind: text-sm, text-base, text-lg */
```

### Regras de Tipografia

⚠️ **IMPORTANTE:**
- NÃO usar classes Tailwind de font-size (ex: `text-2xl`, `text-xl`)
- NÃO usar classes Tailwind de font-weight (ex: `font-bold`)
- NÃO usar classes Tailwind de line-height (ex: `leading-none`)

Exceção: Apenas quando o utilizador solicitar explicitamente alteração de tamanho, peso ou altura de linha.

## Espaçamento

### Padding e Margin

#### Container
```css
container mx-auto px-4
```

#### Seções
```css
py-16  /* Seção normal */
py-20  /* Seção com mais destaque */
```

#### Cards
```css
p-4   /* Padding interno de cards */
p-6   /* Padding interno de cards maiores */
```

#### Gaps
```css
gap-2   /* Gap pequeno */
gap-4   /* Gap médio */
gap-6   /* Gap grande */
gap-12  /* Gap entre seções */
```

## Bordas e Sombras

### Border Radius

```css
rounded-lg     /* Cards de produtos, botões */
rounded-xl     /* Cards maiores, seções especiais */
rounded-2xl    /* Elementos decorativos */
rounded-full   /* Avatares, badges circulares */
```

### Sombras

```css
shadow-md      /* Sombra padrão de cards */
shadow-lg      /* Sombra de elementos elevados */
shadow-xl      /* Sombra de modais e elementos importantes */
shadow-2xl     /* Sombra do botão flutuante de IA */
```

### Bordas

```css
border             /* Borda padrão 1px */
border-2           /* Borda mais grossa */
border-4           /* Borda destacada */
border-[#E7BFBF]   /* Borda rosa metálico */
border-primary     /* Borda borgonha */
```

## Componentes de Design

### Botões

#### Botão Primário
```tsx
className="bg-primary hover:bg-primary/90 text-[#F5EFE7]"
```

#### Botão Secundário (Outline)
```tsx
className="bg-white/90 border-primary text-primary hover:bg-primary hover:text-[#F5EFE7]"
```

#### Botão Dourado (Call-to-Action)
```tsx
className="bg-[#9B7E3C] hover:bg-[#9B7E3C]/90 text-[#F5EFE7]"
```

#### Botão com Gradiente
```tsx
className="bg-gradient-to-r from-[#9B7E3C] to-[#8B6E2C] hover:from-[#8B6E2C] hover:to-[#7B5E1C]"
```

### Badges

#### Badge Novo Produto
```tsx
className="bg-[#9B7E3C] text-[#F5EFE7] hover:bg-[#9B7E3C]/90"
```

### Cards

#### Card de Produto
```tsx
className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
```

#### Card de Feature
```tsx
className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-[#E7BFBF]/20"
```

## Gradientes

### Gradiente de Fundo
```css
bg-gradient-to-br from-[#F5EFE7] via-white to-[#F5EFE7]
```

### Gradiente Dourado
```css
bg-gradient-to-r from-[#9B7E3C] to-[#9B7E3C]/80
```

### Gradiente Primary
```css
bg-gradient-to-br from-primary to-primary/80
```

## Transições e Animações

### Hover Effects
```css
transition-shadow duration-300      /* Para cards */
transition-all duration-300         /* Para elementos complexos */
transition-transform               /* Para scaling */
transition-opacity                 /* Para fade effects */
```

### Scaling
```css
hover:scale-105                    /* Cards e features */
group-hover:scale-110              /* Ícones dentro de grupos */
```

### Animações Especiais

#### Pulse (Botão IA Flutuante)
```css
animate-pulse
```

#### Bounce (Badge IA)
```css
animate-bounce
```

#### Ping (Efeito de ring pulsante)
```css
animate-ping opacity-20
```

## Responsividade

### Breakpoints Tailwind

```css
sm:  640px   /* Small devices */
md:  768px   /* Medium devices */
lg:  1024px  /* Large devices */
xl:  1280px  /* Extra large devices */
2xl: 1536px  /* 2X Extra large devices */
```

### Padrões de Grid

#### Grid de Produtos
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

#### Grid de Features
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
```

#### Grid de Footer
```css
grid grid-cols-1 md:grid-cols-4 gap-8
```

## Opacidade

### Transparências Comuns

```css
opacity-20      /* Elementos muito transparentes */
opacity-60      /* Texto secundário */
opacity-80      /* Fundos semi-transparentes */
opacity-90      /* Hover states */

/* Com cor */
bg-white/80     /* Branco 80% opaco */
bg-primary/90   /* Primary 90% opaco */
text-[#1E1E1E]/70  /* Texto 70% opaco */
```

## Tokens CSS Customizados

Os tokens estão definidos em `/styles/globals.css`:

```css
:root {
  --color-primary: #591C21;
  --primary: #591C21;
}
```

Estes tokens podem ser alterados dinamicamente para testar diferentes paletas de cores através do componente `ColorSwitcher`.
