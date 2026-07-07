# Documentação Técnica - Orelle

## Stack Tecnológico

### Frontend Framework
- **React 18+**
- **TypeScript** para tipagem estática
- Arquitetura baseada em componentes funcionais
- Hooks para gestão de estado

### Styling
- **Tailwind CSS v4.0**
  - Utility-first CSS framework
  - Classes customizadas em `/styles/globals.css`
  - CSS variables para tokens de design
  - Sem necessidade de `tailwind.config.js`

### Componentes UI
- **Shadcn/UI**
  - Biblioteca de componentes React
  - Componentes totalmente customizáveis
  - Localização: `/components/ui/`
  - Componentes usados:
    - Dialog, Button, Input, Badge
    - Tabs, ScrollArea, Avatar
    - Label, Checkbox, Select (disponíveis mas não usados)

### Ícones
- **Lucide React v0.263.1**
  - Biblioteca de ícones SVG
  - Importação específica de versão para evitar erros de memória
  - ~20 ícones utilizados no projeto

### Imagens
- **Unsplash** via ferramenta de busca
- **Component ImageWithFallback** para carregamento seguro

---

## Estrutura de Arquivos

```
/
├── App.tsx                              # Componente raiz da aplicação
├── components/
│   ├── Header.tsx                       # Cabeçalho com navegação
│   ├── ProductCard.tsx                  # Card individual de produto
│   ├── AIChat.tsx                       # Modal de chat com IA
│   ├── ColorSwitcher.tsx                # Ferramenta de teste de cores
│   ├── ColorPalette.tsx                 # Visualizador de paletas
│   ├── figma/
│   │   └── ImageWithFallback.tsx        # 🔒 Componente protegido
│   └── ui/                              # Componentes Shadcn/UI
│       ├── dialog.tsx
│       ├── button.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       ├── tabs.tsx
│       ├── scroll-area.tsx
│       ├── avatar.tsx
│       └── [outros componentes UI]
├── styles/
│   └── globals.css                      # Estilos globais e tokens CSS
└── docs/                                # 📚 Documentação
    ├── README.md                        # Visão geral do projeto
    ├── DESIGN-SYSTEM.md                 # Sistema de design e tokens
    ├── COMPONENTS.md                    # Documentação de componentes
    ├── FEATURES.md                      # Funcionalidades e requisitos
    ├── SECTIONS.md                      # Detalhamento das seções
    └── TECHNICAL.md                     # Este arquivo
```

---

## Componentes React

### App.tsx

#### Responsabilidades
- Componente principal que renderiza toda a aplicação
- Gestão de estado do chat IA
- Definição de dados estáticos (produtos e features)
- Estruturação da página em seções

#### Estado
```typescript
const [chatOpen, setChatOpen] = useState<boolean>(false);
```

#### Dados
```typescript
// Array de 6 produtos
const products = [...];

// Array de 4 features
const features = [...];
```

#### Renderização
Retorna uma `<div>` com todas as seções da página.

---

### Header.tsx

#### Props Interface
```typescript
interface HeaderProps {
  onOpenChat?: () => void;
}
```

#### Funcionalidades
- Logo clicável
- Barra de pesquisa (UI only)
- Botão de consultora IA
- Links de navegação
- Botão de perfil
- Botão de carrinho com badge

#### Estado
Nenhum estado interno (stateless component).

#### Responsividade
Usa classes Tailwind para adaptar layout:
- `hidden md:flex` - Oculta em mobile, mostra em tablet+
- `hidden lg:block` - Oculta até desktop

---

### ProductCard.tsx

#### Props Interface
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

#### Renderização Condicional
```typescript
{isNew && <Badge>Novo</Badge>}
{originalPrice && <span>{originalPrice}</span>}
```

#### Lógica de Estrelas
```typescript
{[...Array(5)].map((_, i) => (
  <Star
    key={i}
    className={i < Math.floor(rating) 
      ? 'fill-[#9B7E3C] text-[#9B7E3C]' 
      : 'fill-none text-[#BFBFBF]'}
  />
))}
```

#### Uso de ImageWithFallback
```typescript
<ImageWithFallback
  src={image}
  alt={name}
  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
/>
```

---

### AIChat.tsx

#### Props Interface
```typescript
interface AIChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

#### Message Interface
```typescript
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}
```

#### Estado Interno
```typescript
const [messages, setMessages] = useState<Message[]>([
  {
    id: '1',
    text: 'Olá! Sou a consultora virtual...',
    sender: 'ai',
    timestamp: new Date()
  }
]);

const [inputValue, setInputValue] = useState<string>('');
```

#### Funções Principais

##### handleSend()
```typescript
const handleSend = () => {
  if (!inputValue.trim()) return;
  
  // Adiciona mensagem do usuário
  const newMessage: Message = {
    id: Date.now().toString(),
    text: inputValue,
    sender: 'user',
    timestamp: new Date()
  };
  
  setMessages([...messages, newMessage]);
  setInputValue('');
  
  // Simula resposta da IA após 1s
  setTimeout(() => {
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Obrigada pela sua mensagem!...',
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiResponse]);
  }, 1000);
};
```

##### handleKeyPress()
```typescript
const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};
```

#### Sugestões Rápidas
```typescript
const quickActions = [
  'Analisar foto da minha pele',
  'Produtos para pele seca',
  'Sugestões para evento noturno',
  'Rotina de cuidados diária'
];
```

---

### ColorSwitcher.tsx

#### Estado
```typescript
const [selectedColor, setSelectedColor] = useState<number>(0);
const [isMinimized, setIsMinimized] = useState<boolean>(false);
const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
```

#### ColorOption Interface
```typescript
interface ColorOption {
  name: string;
  description: string;
  primary: string;
  emoji: string;
  recommended?: boolean;
}
```

#### Alteração de Cores
```typescript
const handleColorChange = (index: number) => {
  setSelectedColor(index);
  const color = colorOptions[index].primary;
  
  // Atualiza CSS variables
  document.documentElement.style.setProperty('--color-primary', color);
  document.documentElement.style.setProperty('--primary', color);
};
```

#### 12 Opções de Cores
Array `colorOptions` com 12 paletas pré-definidas.

---

## Gestão de Estado

### Estado Local (useState)

#### No App.tsx
```typescript
const [chatOpen, setChatOpen] = useState(false);
```
- Controla visibilidade do modal de chat
- Passado para AIChat via props

#### No AIChat.tsx
```typescript
const [messages, setMessages] = useState<Message[]>([...]);
const [inputValue, setInputValue] = useState('');
```
- Estado das mensagens do chat
- Valor do campo de input

#### No ColorSwitcher.tsx
```typescript
const [selectedColor, setSelectedColor] = useState(0);
const [isMinimized, setIsMinimized] = useState(false);
const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
```
- Cor selecionada atualmente
- Estado de minimização do painel
- Modo de visualização (lista ou grade)

### Props Drilling
Estado `chatOpen` é passado do App para AIChat:
```
App → setChatOpen → Header → onOpenChat → Header onClick
App → chatOpen → AIChat → open
```

### Futura Implementação
Para escalar a aplicação, considerar:
- **Context API** para estado global
- **Redux** ou **Zustand** para state management complexo
- **React Query** para cache de dados da API

---

## Styling e CSS

### Tailwind CSS v4.0

#### Configuração
Não há arquivo `tailwind.config.js`. A versão 4.0 usa configuração em CSS.

#### Globals.css
Localização: `/styles/globals.css`

```css
@import "tailwindcss";

:root {
  --color-primary: #591C21;
  --primary: #591C21;
}
```

#### Classes Customizadas
A maior parte do styling usa utility classes do Tailwind:

```tsx
className="bg-primary text-[#F5EFE7] rounded-lg shadow-md hover:shadow-xl"
```

#### Cores Arbitrárias
```tsx
className="bg-[#591C21] text-[#F5EFE7]"
```

#### Responsividade
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

### Tipografia

⚠️ **IMPORTANTE:** Não usar classes Tailwind de tipografia a menos que especificamente solicitado.

Estilos de tipografia estão definidos em `globals.css` para cada elemento HTML:
- `h1`, `h2`, `h3`, `h4` têm estilos padrão
- `p`, `span`, etc. também têm estilos base

### Animações

#### Tailwind Built-in
```css
animate-pulse
animate-bounce
animate-ping
```

#### Transições Customizadas
```css
transition-all duration-300
transition-shadow duration-300
transition-transform
```

#### Hover Effects
```css
hover:scale-105
hover:shadow-xl
group-hover:scale-110
```

---

## Boas Práticas Implementadas

### TypeScript

#### Interfaces para Props
Todos os componentes têm interfaces definidas:
```typescript
interface HeaderProps {
  onOpenChat?: () => void;
}
```

#### Tipagem de Estado
```typescript
const [messages, setMessages] = useState<Message[]>([]);
```

### React

#### Functional Components
Todos os componentes são funcionais (não classes).

#### Hooks
- `useState` para estado local
- Oportunidade para `useEffect`, `useCallback`, `useMemo` no futuro

#### Keys em Listas
```typescript
{products.map(product => (
  <ProductCard key={product.id} {...product} />
))}
```

#### Conditional Rendering
```typescript
{isNew && <Badge>Novo</Badge>}
{messages.length === 1 && <div>Sugestões...</div>}
```

### Componentização

#### Separação de Responsabilidades
- Header → Navegação
- ProductCard → Exibição de produto
- AIChat → Interação com IA

#### Reusabilidade
`ProductCard` é reutilizável para qualquer produto.

#### Props para Configuração
Componentes configuráveis via props, não hardcoded.

---

## Performance

### Otimizações Atuais

#### Imagens
- Uso de `ImageWithFallback` para carregamento seguro
- Unsplash com parâmetros de otimização (`w=1080`)

#### CSS
- Tailwind CSS produz CSS mínimo em produção
- Utility-first reduz repetição

#### Lazy Loading
Não implementado ainda, mas recomendado para:
- Imagens de produtos
- Modal de chat (code splitting)

### Otimizações Futuras

#### React
```typescript
import { lazy, Suspense } from 'react';

const AIChat = lazy(() => import('./components/AIChat'));

// No uso:
<Suspense fallback={<Loading />}>
  <AIChat />
</Suspense>
```

#### Memoization
```typescript
import { useMemo, useCallback } from 'react';

const sortedProducts = useMemo(() => {
  return products.sort((a, b) => b.rating - a.rating);
}, [products]);

const handleClick = useCallback(() => {
  // função...
}, [dependencies]);
```

#### Virtual Scrolling
Para listas grandes de produtos, usar bibliotecas como:
- `react-window`
- `react-virtualized`

---

## Acessibilidade (A11y)

### Implementações Atuais

#### Semantic HTML
```tsx
<header>, <nav>, <section>, <footer>
```

#### Alt Text em Imagens
```tsx
<ImageWithFallback src={image} alt={name} />
```

#### Keyboard Navigation
```typescript
onKeyPress={(e) => {
  if (e.key === 'Enter') handleSend();
}}
```

#### ARIA (Parcial)
Alguns componentes Shadcn/UI têm ARIA labels.

### Melhorias Futuras

#### ARIA Labels Completos
```tsx
<button aria-label="Abrir carrinho de compras">
  <ShoppingCart />
</button>
```

#### Focus Management
```typescript
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (chatOpen) {
    inputRef.current?.focus();
  }
}, [chatOpen]);
```

#### Skip Links
```tsx
<a href="#main-content" className="sr-only">
  Pular para conteúdo principal
</a>
```

---

## Versionamento de Bibliotecas

### Versões Específicas Obrigatórias

#### Lucide React
```typescript
import { Sparkles } from 'lucide-react@0.263.1';
```
⚠️ Versão 0.552.0 causa erro de memória. SEMPRE usar 0.263.1.

#### React Hook Form (se usado)
```typescript
import { useForm } from 'react-hook-form@7.55.0';
```

### Importações Sem Versão

Outras bibliotecas não precisam de versão específica:
```typescript
import { Button } from './components/ui/button';
import { useState } from 'react';
```

---

## Debugging e Desenvolvimento

### Console Logs
Atualmente não há logs de debug. Em desenvolvimento, adicionar:

```typescript
useEffect(() => {
  console.log('Messages updated:', messages);
}, [messages]);
```

### React DevTools
Útil para:
- Inspeção de componentes
- Visualização de estado
- Performance profiling

### Ferramentas Recomendadas

#### ESLint
Para linting de código TypeScript/React.

#### Prettier
Para formatação consistente.

#### TypeScript Compiler
Para verificação de tipos:
```bash
tsc --noEmit
```

---

## Build e Deploy (Futuro)

### Build de Produção
```bash
npm run build
# ou
yarn build
```

### Variáveis de Ambiente
```
REACT_APP_API_URL=https://api.orelle.com
REACT_APP_STRIPE_KEY=pk_live_...
```

### Otimizações de Build
- Minificação de JS/CSS
- Code splitting
- Tree shaking
- Image optimization

### Hospedagem Recomendada
- **Vercel** - Otimizado para React
- **Netlify** - CI/CD fácil
- **AWS S3 + CloudFront** - Escalável
- **Firebase Hosting** - Simples e rápido

---

## Limitações Atuais

### 1. Sem Backend
- Dados são estáticos
- Não há persistência
- IA é simulada

### 2. Sem Autenticação
- Login não funcional
- Sem gestão de sessão

### 3. Carrinho Não Funcional
- Badge com valor fixo
- Botão adicionar sem ação

### 4. Sem API
- Produtos hardcoded
- Sem busca real
- Sem checkout

### 5. IA Simulada
- Resposta automática genérica
- Não analisa realmente fotos
- Sem personalização real

---

## Roadmap Técnico

### Fase 1: Backend Básico
- [ ] Setup de API (Node.js/Express ou Python/Flask)
- [ ] Base de dados (PostgreSQL)
- [ ] Autenticação JWT
- [ ] CRUD de produtos

### Fase 2: Funcionalidades Core
- [ ] Carrinho funcional
- [ ] Checkout e pagamentos
- [ ] Gestão de pedidos
- [ ] Histórico de compras

### Fase 3: IA Real
- [ ] Integração com modelo de ML
- [ ] Computer Vision para análise de pele
- [ ] Sistema de recomendação
- [ ] Processamento de linguagem natural

### Fase 4: Otimizações
- [ ] Cache e CDN
- [ ] Lazy loading
- [ ] Code splitting
- [ ] Performance monitoring

### Fase 5: Features Avançadas
- [ ] Wishlist
- [ ] Reviews de clientes
- [ ] Programa de fidelidade
- [ ] App mobile

---

## Testes (Futuro)

### Unit Tests
```typescript
// ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

test('renders product name', () => {
  render(<ProductCard name="Test Product" {...otherProps} />);
  expect(screen.getByText('Test Product')).toBeInTheDocument();
});
```

### Integration Tests
Testar fluxos completos como adicionar ao carrinho.

### E2E Tests
Com Cypress ou Playwright para testar user journeys.

---

## Segurança

### Considerações Importantes

⚠️ **Figma Make NÃO é adequado para:**
- Processar pagamentos reais
- Armazenar PII (Personally Identifiable Information)
- Dados de saúde ou médicos
- Informações financeiras sensíveis

### Em Produção

#### Frontend
- Sanitização de inputs
- Validação client-side
- HTTPS obrigatório
- Content Security Policy

#### Backend
- Validação server-side
- SQL injection prevention
- XSS protection
- Rate limiting
- CORS configurado corretamente

#### Dados
- Encriptação em trânsito (HTTPS)
- Encriptação em repouso
- Backup regular
- Conformidade GDPR/LGPD

---

## Conclusão

Este projeto demonstra:
- ✅ Arquitetura React moderna
- ✅ TypeScript para type safety
- ✅ Design system consistente
- ✅ Componentização eficaz
- ✅ UI/UX polida
- ✅ Base sólida para expansão

Próximos passos envolvem implementação de backend, IA real, e funcionalidades de e-commerce completas.
