# Orelle - Plataforma de Cosméticos com IA

## Visão Geral

Orelle é uma plataforma inovadora de venda e consultoria de cosméticos que combina e-commerce com inteligência artificial personalizada. A plataforma permite aos utilizadores adquirir produtos de beleza e interagir com uma IA capaz de analisar fotografias para identificar produtos ideais e apresentar sugestões personalizadas.

## Conceito

A plataforma integra tecnologia e beleza para oferecer uma experiência única de compra online, onde a consultoria personalizada por IA ajuda os utilizadores a encontrar os produtos perfeitos para suas necessidades específicas.

## Características Principais

### 1. E-commerce de Cosméticos
- Catálogo de produtos premium organizados por categorias
- Sistema de avaliações e reviews
- Preços promocionais e produtos novos destacados
- Interface responsiva e moderna

### 2. Consultora Virtual com IA
- Análise de fotografias da pele
- Recomendações personalizadas baseadas no tipo de pele
- Chat interativo disponível 24/7
- Sugestões rápidas pré-definidas

### 3. Experiência do Utilizador
- Design limpo e profissional
- Navegação intuitiva
- Paleta de cores sofisticada
- Animações e transições suaves

## Tecnologias Utilizadas

- **React** - Framework JavaScript para UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4.0** - Framework CSS utility-first
- **Shadcn/UI** - Biblioteca de componentes
- **Lucide React** - Biblioteca de ícones

## Estrutura do Projeto

```
/
├── App.tsx                          # Componente principal
├── components/
│   ├── Header.tsx                   # Cabeçalho com navegação
│   ├── ProductCard.tsx              # Card de produto
│   ├── AIChat.tsx                   # Modal de chat com IA
│   ├── ColorSwitcher.tsx            # Testador de paletas
│   ├── ColorPalette.tsx             # Visualizador de cores
│   ├── figma/
│   │   └── ImageWithFallback.tsx    # Componente de imagem
│   └── ui/                          # Componentes Shadcn/UI
├── styles/
│   └── globals.css                  # Estilos globais e tokens
└── docs/                            # Documentação
    ├── README.md                    # Este arquivo
    ├── DESIGN-SYSTEM.md            # Sistema de design e tokens
    ├── COMPONENTS.md               # Documentação de componentes
    └── FEATURES.md                 # Funcionalidades e requisitos
```

## Paleta de Cores

A interface utiliza uma paleta sofisticada e elegante:

- **Borgonha (#591C21)** - Cor primária
- **Rosa Metálico (#E7BFBF)** - Cor secundária
- **Branco Areia (#F5EFE7)** - Fundos
- **Preto Carvão (#1E1E1E)** - Texto principal
- **Cinza (#6B6B6B)** - Texto secundário e descrições
- **Dourado (#9B7E3C)** - Alertas e destaques

## Seções da Interface

### Banner Principal (Hero)
- Imagem de fundo com mulher aplicando cosméticos
- Título e descrição em preto para melhor legibilidade
- Botões de ação para consulta IA e exploração de produtos

### Seção de Consultora IA
- Informações sobre análise de pele por foto
- Demonstração visual do chat
- Call-to-action destacado

### Funcionalidades
- 4 cards apresentando os benefícios da plataforma
- Design com hover effects

### Catálogo de Produtos
- Sistema de tabs para filtrar por categoria
- Grid responsivo de produtos
- 6 produtos de exemplo

### Call-to-Action
- Seção borgonha incentivando uso da IA
- Botão destacado em dourado

### Footer
- Informações organizadas em 4 colunas
- Links de navegação
- Copyright

## Próximos Passos

Para informações detalhadas, consulte:
- [Sistema de Design](./DESIGN-SYSTEM.md) - Cores, tipografia e tokens
- [Componentes](./COMPONENTS.md) - Documentação técnica dos componentes
- [Funcionalidades](./FEATURES.md) - Requisitos funcionais e features
