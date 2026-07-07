import { ShoppingCart, User, Search, Sparkles } from 'lucide-react@0.263.1';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface HeaderProps {
  onOpenChat?: () => void;
}

export function Header({ onOpenChat }: HeaderProps) {
  return (
    <header className="bg-primary text-[#F5EFE7] sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <h1 className="text-[#F5EFE7]">Orelle</h1>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1E1E1E] h-4 w-4" />
              <Input
                type="text"
                placeholder="Pesquisar produtos..."
                className="w-full pl-10 bg-[#F5EFE7] border-none text-[#1E1E1E] placeholder:text-[#D9D9D9]"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            {/* AI Consultant Button in Header */}
            <Button
              onClick={onOpenChat}
              className="hidden md:flex items-center gap-2 bg-[#9B7E3C] hover:bg-[#9B7E3C]/90 text-[#F5EFE7]"
            >
              <Sparkles className="h-4 w-4" />
              Consultora IA
            </Button>
            
            <a href="#produtos" className="hidden lg:block hover:text-[#E7BFBF] transition-colors">
              Produtos
            </a>
            <a href="#sobre" className="hidden lg:block hover:text-[#E7BFBF] transition-colors">
              Sobre
            </a>
            
            <Button variant="ghost" size="icon" className="text-[#F5EFE7] hover:text-[#E7BFBF] hover:bg-primary/80">
              <User className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="text-[#F5EFE7] hover:text-[#E7BFBF] hover:bg-primary/80 relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-[#9B7E3C] text-[#F5EFE7] rounded-full w-5 h-5 flex items-center justify-center text-xs">
                3
              </span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}