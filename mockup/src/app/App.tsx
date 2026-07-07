import { useState } from 'react';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { AIChat } from './components/AIChat';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Sparkles, TrendingUp, Award, Heart } from 'lucide-react@0.263.1';

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);

  const products = [
    {
      id: 1,
      name: 'Sérum Iluminador Radiance',
      description: 'Sérum facial com vitamina C que ilumina e uniformiza o tom da pele',
      price: 45.99,
      originalPrice: 59.99,
      rating: 4.8,
      reviews: 234,
      image: 'https://images.unsplash.com/photo-1699293679015-14bb8c66b34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBzZXJ1bSUyMGJvdHRsZXxlbnwxfHx8fDE3NjIwODcxNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Cuidado Facial',
      isNew: true
    },
    {
      id: 2,
      name: 'Paleta Luxury Rose Gold',
      description: 'Paleta de sombras com 12 tonalidades sofisticadas',
      price: 52.00,
      rating: 4.9,
      reviews: 567,
      image: 'https://images.unsplash.com/photo-1665625771509-072025eb2d47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWtldXAlMjBwYWxldHRlJTIwY29zbWV0aWN8ZW58MXx8fHwxNzYyMTc2ODI3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Maquiagem',
      isNew: true
    },
    {
      id: 3,
      name: 'Creme Hidratante Velvet',
      description: 'Hidratação intensa com textura aveludada para todos os tipos de pele',
      price: 38.50,
      rating: 4.7,
      reviews: 189,
      image: 'https://images.unsplash.com/photo-1643168343047-f1056f97e555?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb3NtZXRpYyUyMHByb2R1Y3R8ZW58MXx8fHwxNzYyMTQzMjQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Cuidado Facial'
    },
    {
      id: 4,
      name: 'Óleo Reparador Night Glow',
      description: 'Óleo facial noturno que restaura e revitaliza a pele durante o sono',
      price: 48.99,
      originalPrice: 62.00,
      rating: 4.6,
      reviews: 145,
      image: 'https://images.unsplash.com/photo-1699293679015-14bb8c66b34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBzZXJ1bSUyMGJvdHRsZXxlbnwxfHx8fDE3NjIwODcxNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Cuidado Facial'
    },
    {
      id: 5,
      name: 'Base Liquid Silk',
      description: 'Base de cobertura média com acabamento natural e duradouro',
      price: 42.00,
      rating: 4.8,
      reviews: 421,
      image: 'https://images.unsplash.com/photo-1643168343047-f1056f97e555?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb3NtZXRpYyUyMHByb2R1Y3R8ZW58MXx8fHwxNzYyMTQzMjQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Maquiagem',
      isNew: true
    },
    {
      id: 6,
      name: 'Máscara Revitalizante',
      description: 'Máscara facial que revitaliza e energiza a pele em 15 minutos',
      price: 29.90,
      rating: 4.5,
      reviews: 98,
      image: 'https://images.unsplash.com/photo-1643168343047-f1056f97e555?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb3NtZXRpYyUyMHByb2R1Y3R8ZW58MXx8fHwxNzYyMTQzMjQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Tratamentos'
    }
  ];

  const features = [
    {
      icon: Sparkles,
      title: 'IA Personalizada',
      description: 'Recomendações baseadas no seu tipo de pele e preferências'
    },
    {
      icon: TrendingUp,
      title: 'Tendências',
      description: 'Produtos mais populares e lançamentos exclusivos'
    },
    {
      icon: Award,
      title: 'Qualidade Premium',
      description: 'Produtos certificados e de marcas reconhecidas'
    },
    {
      icon: Heart,
      title: 'Consulta Gratuita',
      description: 'Assistência personalizada com nossa consultora virtual'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5EFE7]">
      <Header onOpenChat={() => setChatOpen(true)} />

      {/* Hero Banner */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1759693164491-01acd5831b09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGFwcGx5aW5nJTIwbWFrZXVwJTIwY29zbWV0aWNzfGVufDF8fHx8MTc2MjkzNzYwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)'
          }}
        />
        
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-[#1E1E1E]">
            <Badge className="mb-4 bg-[#9B7E3C] text-[#F5EFE7] hover:bg-[#9B7E3C]/90">
              Novo na Orelle
            </Badge>
            <h1 className="text-4xl md:text-6xl text-[#1E1E1E] mb-4">
              Descubra a Beleza com Inteligência
            </h1>
            <p className="text-lg md:text-xl mb-8 text-[#1E1E1E]">
              Consultoria personalizada de cosméticos com IA. Encontre os produtos perfeitos para você.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-[#F5EFE7]"
                onClick={() => setChatOpen(true)}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Consultar IA
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white/90 border-primary text-primary hover:bg-primary hover:text-[#F5EFE7]"
              >
                Explorar Produtos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Consultant Banner - Featured Section */}
      <section className="py-20 bg-gradient-to-br from-[#F5EFE7] via-white to-[#F5EFE7] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E7BFBF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9B7E3C] to-[#9B7E3C]/80 text-[#F5EFE7] px-4 py-2 rounded-full mb-6 shadow-md">
                <Sparkles className="h-5 w-5" />
                <span>Consultora Virtual Disponível</span>
              </div>
              <h2 className="text-3xl md:text-5xl text-[#1E1E1E] mb-6">
                Encontre Seus Produtos Ideais com IA
              </h2>
              <p className="text-lg text-[#1E1E1E]/70 mb-8">
                Nossa consultora virtual analisa suas necessidades e recomenda os produtos perfeitos. Envie uma foto da sua pele ou descreva o que procura.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-[#E7BFBF]/30">
                  <div className="bg-primary rounded-full p-2 flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-[#F5EFE7]" />
                  </div>
                  <div>
                    <h4 className="text-[#1E1E1E] mb-1">Análise de Pele por Foto</h4>
                    <p className="text-sm text-[#1E1E1E]/60">Identifique seu tipo de pele instantaneamente</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-[#E7BFBF]/30">
                  <div className="bg-primary rounded-full p-2 flex-shrink-0">
                    <Award className="h-5 w-5 text-[#F5EFE7]" />
                  </div>
                  <div>
                    <h4 className="text-[#1E1E1E] mb-1">Recomendações Personalizadas</h4>
                    <p className="text-sm text-[#1E1E1E]/60">Produtos selecionados especialmente para você</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-[#E7BFBF]/30">
                  <div className="bg-primary rounded-full p-2 flex-shrink-0">
                    <Heart className="h-5 w-5 text-[#F5EFE7]" />
                  </div>
                  <div>
                    <h4 className="text-[#1E1E1E] mb-1">Consultoria Gratuita 24/7</h4>
                    <p className="text-sm text-[#1E1E1E]/60">Sempre disponível para ajudar</p>
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => setChatOpen(true)}
                className="bg-gradient-to-r from-[#9B7E3C] to-[#8B6E2C] hover:from-[#8B6E2C] hover:to-[#7B5E1C] text-[#F5EFE7] text-lg px-8 py-6 h-auto shadow-lg"
              >
                <Sparkles className="mr-2 h-6 w-6" />
                Iniciar Consulta Gratuita Agora
              </Button>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-[#E7BFBF]/30 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-full p-2 flex-shrink-0 shadow-md">
                      <Sparkles className="h-4 w-4 text-[#F5EFE7]" />
                    </div>
                    <div className="bg-[#F5EFE7] rounded-2xl rounded-tl-none p-4 flex-1 shadow-sm">
                      <p className="text-sm text-[#1E1E1E]">Olá! Qual é o seu tipo de pele?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-primary rounded-2xl rounded-tr-none p-4 flex-1 max-w-[80%] shadow-md">
                      <p className="text-sm text-[#F5EFE7]">Tenho pele mista e estou procurando um sérum iluminador</p>
                    </div>
                    <div className="bg-[#E7BFBF] rounded-full p-2 flex-shrink-0 shadow-md">
                      <span className="text-xs text-primary">V</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-full p-2 flex-shrink-0 shadow-md">
                      <Sparkles className="h-4 w-4 text-[#F5EFE7]" />
                    </div>
                    <div className="bg-[#F5EFE7] rounded-2xl rounded-tl-none p-4 flex-1 shadow-sm">
                      <p className="text-sm text-[#1E1E1E]">Perfeito! Recomendo o Sérum Iluminador Radiance. Ideal para pele mista com vitamina C...</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center gap-2 text-primary text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gradient-to-b from-white via-[#F5EFE7]/30 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-[#1E1E1E] mb-4">Por Que Escolher a Orelle?</h2>
            <p className="text-[#1E1E1E]/60 max-w-2xl mx-auto">
              Tecnologia e beleza se encontram para oferecer a melhor experiência
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="group hover:scale-105 transition-all duration-300">
                <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-[#E7BFBF]/20 h-full">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-[#F5EFE7] mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-[#1E1E1E] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#1E1E1E]/60 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="produtos" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-[#1E1E1E] mb-4">Produtos em Destaque</h2>
            <p className="text-[#D9D9D9] max-w-2xl mx-auto">
              Explore nossa seleção exclusiva de cosméticos premium. Use nossa IA para encontrar produtos ideais para você.
            </p>
          </div>

          <Tabs defaultValue="todos" className="mb-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-white border border-[#E7BFBF]">
              <TabsTrigger value="todos" className="data-[state=active]:bg-primary data-[state=active]:text-[#F5EFE7]">
                Todos
              </TabsTrigger>
              <TabsTrigger value="facial" className="data-[state=active]:bg-primary data-[state=active]:text-[#F5EFE7]">
                Cuidado Facial
              </TabsTrigger>
              <TabsTrigger value="maquiagem" className="data-[state=active]:bg-primary data-[state=active]:text-[#F5EFE7]">
                Maquiagem
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="facial" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.filter(p => p.category === 'Cuidado Facial').map(product => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="maquiagem" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.filter(p => p.category === 'Maquiagem').map(product => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-[#F5EFE7]">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-6 text-[#9B7E3C]" />
          <h2 className="text-[#F5EFE7] mb-4">Experimente Nossa Consultora IA</h2>
          <p className="text-[#E7BFBF] max-w-2xl mx-auto mb-8">
            Envie uma foto ou descreva suas necessidades. Nossa IA analisará e recomendará os produtos perfeitos para você.
          </p>
          <Button 
            size="lg" 
            className="bg-[#9B7E3C] hover:bg-[#9B7E3C]/90 text-[#F5EFE7]"
            onClick={() => setChatOpen(true)}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Iniciar Consulta Gratuita
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E1E1E] text-[#F5EFE7] py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-[#F5EFE7] mb-4">Orelle</h3>
              <p className="text-sm text-[#D9D9D9]">
                Plataforma de venda e consultoria de cosméticos com IA personalizada.
              </p>
            </div>
            <div>
              <h4 className="text-[#F5EFE7] mb-4">Produtos</h4>
              <ul className="space-y-2 text-sm text-[#D9D9D9]">
                <li><a href="#" className="hover:text-[#E7BFBF]">Cuidado Facial</a></li>
                <li><a href="#" className="hover:text-[#E7BFBF]">Maquiagem</a></li>
                <li><a href="#" className="hover:text-[#E7BFBF]">Tratamentos</a></li>
                <li><a href="#" className="hover:text-[#E7BFBF]">Novidades</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#F5EFE7] mb-4">Ajuda</h4>
              <ul className="space-y-2 text-sm text-[#D9D9D9]">
                <li><a href="#" className="hover:text-[#E7BFBF]">FAQ</a></li>
                <li><a href="#" className="hover:text-[#E7BFBF]">Envios</a></li>
                <li><a href="#" className="hover:text-[#E7BFBF]">Devoluções</a></li>
                <li><a href="#" className="hover:text-[#E7BFBF]">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#F5EFE7] mb-4">Sobre</h4>
              <ul className="space-y-2 text-sm text-[#D9D9D9]">
                <li><a href="#" className="hover:text-[#E7BFBF]">Quem Somos</a></li>
                <li><a href="#" className="hover:text-[#E7BFBF]">Consultora IA</a></li>
                <li><a href="#" className="hover:text-[#E7BFBF]">Privacidade</a></li>
                <li><a href="#" className="hover:text-[#E7BFBF]">Termos</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#D9D9D9]/20 pt-8 text-center text-sm text-[#D9D9D9]">
            <p>&copy; 2025 Orelle. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Floating AI Chat Button - Enhanced */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {/* Pulsating ring effect */}
          <div className="absolute inset-0 rounded-full bg-[#9B7E3C] animate-ping opacity-20"></div>
          
          <Button
            size="lg"
            className="relative rounded-full w-16 h-16 shadow-2xl bg-primary hover:bg-primary/90 text-[#F5EFE7] border-2 border-[#9B7E3C]"
            onClick={() => setChatOpen(true)}
          >
            <Sparkles className="h-6 w-6" />
          </Button>
          
          {/* Badge indicator */}
          <div className="absolute -top-1 -right-1 bg-[#9B7E3C] text-[#F5EFE7] rounded-full w-6 h-6 flex items-center justify-center text-xs animate-bounce">
            IA
          </div>
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-20 right-0 bg-primary text-[#F5EFE7] px-4 py-2 rounded-lg whitespace-nowrap shadow-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <p className="text-sm">Consultora IA disponível</p>
          <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-primary"></div>
        </div>
      </div>

      {/* AI Chat Dialog */}
      <AIChat open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}