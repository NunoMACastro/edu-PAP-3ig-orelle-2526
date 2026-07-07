# Componentes - Orelle

## Componentes Principais

### App.tsx

Componente principal da aplicação que orquestra toda a interface.

#### Responsabilidades
- Gerenciamento do estado do chat (aberto/fechado)
- Renderização de todas as seções da página
- Definição dos dados de produtos e features

#### Estado
```typescript
const [chatOpen, setChatOpen] = useState(false);
```

#### Seções Renderizadas
1. Header
2. Hero Banner
3. AI Consultant Banner
4. Features Section
5. Products Section (com Tabs)
6. CTA Section
7. Footer
8. Floating AI Chat Button
9. AI Chat Dialog

---

## Header (`/components/Header.tsx`)

Cabeçalho fixo no topo da página com navegação.

### Props
```typescript
interface HeaderProps {
  onOpenChat?: () => void;
}
```

### Funcionalidades
- **Logo:** "Orelle" no lado esquerdo
- **Barra de Pesquisa:** Campo de pesquisa centralizado (visível em desktop)
- **Botão Consultora IA:** Abre o modal de chat
- **Links de Navegação:** Produtos e Sobre
- **Ícone de Usuário:** Botão de perfil/login
- **Carrinho de Compras:** Com badge indicando 3 itens

### Estilos
- Fundo borgonha (`bg-primary`)
- Texto branco areia (`text-[#F5EFE7]`)
- Sticky positioning (`sticky top-0 z-50`)
- Sombra para separação (`shadow-md`)

### Responsividade
- Barra de pesquisa oculta em mobile (`hidden md:flex`)
- Botão IA oculto em mobile (`hidden md:flex`)
- Links de navegação ocultos em tablets pequenos (`hidden lg:block`)

---

## ProductCard (`/components/ProductCard.tsx`)

Card individual de produto com todas as informações necessárias.

### Props
```typescript
interface ProductCardProps {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  isNew?: boolean;
}
```

### Estrutura
1. **Imagem do Produto**
   - Aspect ratio quadrado
   - Hover effect com zoom (`hover:scale-105`)
   - Badge "Novo" se `isNew === true`
   - Usa `ImageWithFallback` para carregamento seguro

2. **Informações**
   - Categoria em texto pequeno e uppercase
   - Nome do produto
   - Descrição truncada em 2 linhas (`line-clamp-2`)
   
3. **Avaliações**
   - 5 estrelas (preenchidas ou vazias baseado no rating)
   - Número de reviews
   - Cor dourada para estrelas ativas (`fill-[#9B7E3C]`)

4. **Preço e Ação**
   - Preço original riscado (se houver)
   - Preço atual em destaque
   - Botão "Adicionar" com ícone de carrinho

### Cores de Texto
- Categoria: `text-[#8C8C8C]`
- Nome: `text-[#1E1E1E]`
- Descrição: `text-[#6B6B6B]`
- Reviews: `text-[#6B6B6B]`
- Preço original: `text-[#8C8C8C]`
- Preço atual: `text-primary`

---

## AIChat (`/components/AIChat.tsx`)

Modal de chat interativo com a consultora virtual.

### Props
```typescript
interface AIChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### Estado Interno
```typescript
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const [messages, setMessages] = useState<Message[]>([...]);
const [inputValue, setInputValue] = useState('');
```

### Funcionalidades

#### 1. Interface de Chat
- Header com título e botão de fechar
- Área de scroll para mensagens
- Input de texto com botões de ação

#### 2. Mensagens
- **Mensagens da IA:** 
  - Fundo branco areia (`bg-[#F5EFE7]`)
  - Avatar com ícone Sparkles
  - Alinhadas à esquerda
  
- **Mensagens do Usuário:**
  - Fundo borgonha (`bg-primary`)
  - Avatar com inicial "V"
  - Alinhadas à direita

#### 3. Sugestões Rápidas
Aparecem quando há apenas 1 mensagem (mensagem inicial):
- "Analisar foto da minha pele"
- "Produtos para pele seca"
- "Sugestões para evento noturno"
- "Rotina de cuidados diária"

#### 4. Ações
- **Botão Câmera:** Para upload de fotos
- **Input de Texto:** Para mensagens escritas
- **Botão Enviar:** Disabled quando input vazio
- **Enter:** Envia mensagem (sem Shift)

#### 5. Simulação de IA
Após 1 segundo do envio, retorna resposta automática simulada.

### Estilos
- Modal com altura fixa: `h-[600px]`
- Largura máxima: `max-w-2xl`
- Header borgonha: `bg-primary`
- Corpo branco areia: `bg-[#F5EFE7]`
- Footer branco: `bg-white`

---

## ColorSwitcher (`/components/ColorSwitcher.tsx`)

Componente para testar diferentes paletas de cores (ferramentа de desenvolvimento).

### Estado
```typescript
const [selectedColor, setSelectedColor] = useState(0);
const [isMinimized, setIsMinimized] = useState(false);
const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
```

### Opções de Cores
12 paletas pré-definidas:
1. **Borgonha Original** (#591C21) - Cor atual do projeto
2. **Rosa Mauve** (#9E5B65) ⭐ Recomendada
3. **Terracota** (#A67C7C) ⭐ Recomendada
4. **Plum** (#7A3E48) ⭐ Recomendada
5. Rosa Antigo (#B47382)
6. Coral Profundo (#C5736C)
7. Vinho Tinto (#4A1419)
8. Rosa Pêssego (#D4949A)
9. Marsala (#8B4049)
10. Rosa Quartz (#B88A8E)
11. Burgundy Suave (#6B2C33)
12. Nude Rosado (#C19A9D)

### Funcionalidades
- Alteração dinâmica de cores via CSS variables
- Vista em lista ou grade
- Minimização do painel
- Indicador visual da cor ativa
- Emoji e descrição para cada paleta

### Aplicação de Cores
```typescript
const handleColorChange = (index: number) => {
  setSelectedColor(index);
  const color = colorOptions[index].primary;
  document.documentElement.style.setProperty('--color-primary', color);
  document.documentElement.style.setProperty('--primary', color);
};
```

---

## ColorPalette (`/components/ColorPalette.tsx`)

Componente para visualizar paletas de cores (não utilizado atualmente na interface principal).

### Props
```typescript
interface ColorPaletteProps {
  colors: Array<{
    name: string;
    hex: string;
    emoji: string;
  }>;
  activeIndex?: number;
}
```

### Renderização
- Grid responsivo (2-6 colunas)
- Quadrados de cor com emoji
- Nome e código hex
- Indicador check na cor ativa

---

## Componentes Shadcn/UI Utilizados

### Dialog (`/components/ui/dialog.tsx`)
Usado no AIChat para criar o modal.

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
      <DialogDescription>...</DialogDescription>
    </DialogHeader>
    {children}
  </DialogContent>
</Dialog>
```

### Button (`/components/ui/button.tsx`)
Usado em toda a aplicação.

**Variantes:**
- `default` - Fundo sólido
- `outline` - Apenas borda
- `ghost` - Sem fundo

**Tamanhos:**
- `sm` - Pequeno
- `default` - Médio
- `lg` - Grande
- `icon` - Quadrado para ícones

### Input (`/components/ui/input.tsx`)
Campos de texto no Header e AIChat.

### Badge (`/components/ui/badge.tsx`)
Para badges "Novo" nos produtos e outras indicações.

### Tabs (`/components/ui/tabs.tsx`)
Sistema de filtros na seção de produtos.

```tsx
<Tabs defaultValue="todos">
  <TabsList>
    <TabsTrigger value="todos">Todos</TabsTrigger>
    <TabsTrigger value="facial">Cuidado Facial</TabsTrigger>
    <TabsTrigger value="maquiagem">Maquiagem</TabsTrigger>
  </TabsList>
  <TabsContent value="todos">{...}</TabsContent>
  <TabsContent value="facial">{...}</TabsContent>
  <TabsContent value="maquiagem">{...}</TabsContent>
</Tabs>
```

### ScrollArea (`/components/ui/scroll-area.tsx`)
Área de scroll customizada no AIChat.

### Avatar (`/components/ui/avatar.tsx`)
Avatares nas mensagens do chat.

---

## ImageWithFallback (`/components/figma/ImageWithFallback.tsx`)

Componente protegido do sistema para carregar imagens com fallback.

⚠️ **IMPORTANTE:** NÃO modificar este arquivo. É um componente do sistema.

### Uso
```tsx
import { ImageWithFallback } from './components/figma/ImageWithFallback';

<ImageWithFallback
  src={imageUrl}
  alt="Descrição"
  className="w-full h-full object-cover"
/>
```

Funciona exatamente como uma tag `<img>`, mas com tratamento de erro integrado.

---

## Ícones (Lucide React)

### Versão
```typescript
import { IconName } from 'lucide-react@0.263.1';
```

⚠️ **IMPORTANTE:** Sempre usar a versão `0.263.1` para evitar problemas de memória.

### Ícones Utilizados

#### Navegação e Interface
- `ShoppingCart` - Carrinho de compras
- `User` - Perfil do usuário
- `Search` - Pesquisa
- `Send` - Enviar mensagem
- `Camera` - Upload de foto
- `X` - Fechar modal

#### Features e Branding
- `Sparkles` - IA, inovação, destaque
- `TrendingUp` - Tendências
- `Award` - Qualidade premium
- `Heart` - Favoritos, consulta

#### Produtos
- `Star` - Avaliações

---

## Dados Estáticos

### Produtos (6 itens)
```typescript
const products = [
  {
    id: 1,
    name: 'Sérum Iluminador Radiance',
    description: 'Sérum facial com vitamina C...',
    price: 45.99,
    originalPrice: 59.99,
    rating: 4.8,
    reviews: 234,
    image: '...',
    category: 'Cuidado Facial',
    isNew: true
  },
  // ... mais 5 produtos
];
```

**Categorias:**
- Cuidado Facial (4 produtos)
- Maquiagem (2 produtos)
- Tratamentos (1 produto - implícito)

### Features (4 items)
```typescript
const features = [
  {
    icon: Sparkles,
    title: 'IA Personalizada',
    description: 'Recomendações baseadas no seu tipo de pele...'
  },
  // ... mais 3 features
];
```

---

## Hierarquia de Componentes

```
App
├── Header
├── Hero Banner (seção)
├── AI Consultant Banner (seção)
│   └── Features cards inline
├── Features Section (seção)
│   └── 4x Feature cards
├── Products Section (seção)
│   └── Tabs
│       └── ProductCard (6x)
├── CTA Section (seção)
├── Footer (seção)
├── Floating Button
└── AIChat (Dialog)
    └── Messages
        └── Avatar + texto
```
