import { Palette, Grid3x3, List } from 'lucide-react@0.263.1';
import { Button } from './ui/button';
import { useState } from 'react';

interface ColorOption {
  name: string;
  description: string;
  primary: string;
  emoji: string;
  recommended?: boolean;
}

const colorOptions: ColorOption[] = [
  {
    name: 'Borgonha Original',
    description: 'Clássico e profundo - A cor original do projeto',
    primary: '#591C21',
    emoji: '🍷'
  },
  {
    name: 'Rosa Mauve',
    description: 'Feminilidade sofisticada e luxo acessível',
    primary: '#9E5B65',
    emoji: '✨',
    recommended: true
  },
  {
    name: 'Terracota',
    description: 'Naturalidade terrosa e cosmética clean',
    primary: '#A67C7C',
    emoji: '🌹',
    recommended: true
  },
  {
    name: 'Plum',
    description: 'Luxo premium e exclusividade',
    primary: '#7A3E48',
    emoji: '💎',
    recommended: true
  },
  {
    name: 'Rosa Antigo',
    description: 'Romance e suavidade elegante',
    primary: '#B47382',
    emoji: '🎀'
  },
  {
    name: 'Coral Profundo',
    description: 'Vibrante e energético com toque sofisticado',
    primary: '#C5736C',
    emoji: '🌺'
  },
  {
    name: 'Vinho Tinto',
    description: 'Escuro e luxuoso, máxima elegância',
    primary: '#4A1419',
    emoji: '🥂'
  },
  {
    name: 'Rosa Pêssego',
    description: 'Suave e acolhedor, feminilidade delicada',
    primary: '#D4949A',
    emoji: '🍑'
  },
  {
    name: 'Marsala',
    description: 'Tendência fashion, sofisticado e quente',
    primary: '#8B4049',
    emoji: '🌸'
  },
  {
    name: 'Rosa Quartz',
    description: 'Moderno e clean, minimalista chic',
    primary: '#B88A8E',
    emoji: '💗'
  },
  {
    name: 'Burgundy Suave',
    description: 'Equilíbrio perfeito entre intenso e suave',
    primary: '#6B2C33',
    emoji: '🌷'
  },
  {
    name: 'Nude Rosado',
    description: 'Minimalista e atemporal, elegância discreta',
    primary: '#C19A9D',
    emoji: '🤍'
  }
];

export function ColorSwitcher() {
  const [selectedColor, setSelectedColor] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const handleColorChange = (index: number) => {
    setSelectedColor(index);
    const color = colorOptions[index].primary;
    document.documentElement.style.setProperty('--color-primary', color);
    document.documentElement.style.setProperty('--primary', color);
  };

  if (isMinimized) {
    return (
      <Button
        onClick={() => setIsMinimized(false)}
        className="fixed top-20 right-4 z-50 bg-white hover:bg-white/90 text-primary border-2 border-[#E7BFBF] shadow-xl"
      >
        <Palette className="h-5 w-5 mr-2" />
        Testar Cores
      </Button>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-50 bg-white rounded-xl shadow-2xl w-80 border-2 border-[#E7BFBF] max-h-[calc(100vh-6rem)] flex flex-col">
      <div className="p-5 pb-3 border-b border-[#E7BFBF]/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h3 className="text-[#1E1E1E]">Testar Paletas</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="h-6 w-6 text-[#D9D9D9] hover:text-primary"
              title={viewMode === 'list' ? 'Ver em grade' : 'Ver em lista'}
            >
              {viewMode === 'list' ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="h-6 w-6 text-[#D9D9D9] hover:text-primary"
            >
              <span className="text-lg">−</span>
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-[#D9D9D9]">
          12 opções de cores • {viewMode === 'list' ? 'Vista em lista' : 'Vista em grade'}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 pt-3">
        {viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-3 gap-3">
            {colorOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleColorChange(index)}
                className={`relative group transition-all ${
                  selectedColor === index ? 'scale-105' : 'hover:scale-105'
                }`}
              >
                <div
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-xl transition-all border-2 ${
                    selectedColor === index
                      ? 'border-[#9B7E3C] shadow-lg'
                      : 'border-white shadow-md hover:border-[#E7BFBF]'
                  }`}
                  style={{ backgroundColor: option.primary }}
                >
                  {option.emoji}
                  {selectedColor === index && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#9B7E3C] rounded-full border-2 border-white" />
                  )}
                  {option.recommended && (
                    <div className="absolute top-1 left-1 text-xs">⭐</div>
                  )}
                </div>
                <p className={`text-xs mt-1 text-center truncate ${
                  selectedColor === index ? 'text-primary' : 'text-[#1E1E1E]'
                }`}>
                  {option.name}
                </p>
              </button>
            ))}
          </div>
        ) : (
          /* List View */
          <>
            {/* Recommended Colors */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-[#9B7E3C]">⭐ Recomendadas</span>
              </div>
              <div className="space-y-2">
                {colorOptions.filter(c => c.recommended).map((option) => {
                  const actualIndex = colorOptions.indexOf(option);
                  return (
                    <Button
                      key={actualIndex}
                      onClick={() => handleColorChange(actualIndex)}
                      variant="outline"
                      className={`w-full justify-start text-left h-auto py-2.5 px-3 transition-all ${
                        selectedColor === actualIndex 
                          ? 'border-2 border-primary bg-primary/5 shadow-md' 
                          : 'border border-[#E7BFBF] hover:bg-[#E7BFBF]/20 hover:border-[#E7BFBF]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 w-full">
                        <div
                          className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm relative"
                          style={{ backgroundColor: option.primary }}
                        >
                          <span className="text-base">{option.emoji}</span>
                          {selectedColor === actualIndex && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#9B7E3C] rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm text-[#1E1E1E] truncate">{option.name}</span>
                          </div>
                          <p className="text-xs text-[#D9D9D9] line-clamp-1">{option.description}</p>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* All Colors */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-[#D9D9D9]">Todas as opções</span>
              </div>
              <div className="space-y-2">
                {colorOptions.filter(c => !c.recommended).map((option) => {
                  const actualIndex = colorOptions.indexOf(option);
                  return (
                    <Button
                      key={actualIndex}
                      onClick={() => handleColorChange(actualIndex)}
                      variant="outline"
                      className={`w-full justify-start text-left h-auto py-2.5 px-3 transition-all ${
                        selectedColor === actualIndex 
                          ? 'border-2 border-primary bg-primary/5 shadow-md' 
                          : 'border border-[#E7BFBF] hover:bg-[#E7BFBF]/20 hover:border-[#E7BFBF]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 w-full">
                        <div
                          className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm relative"
                          style={{ backgroundColor: option.primary }}
                        >
                          <span className="text-base">{option.emoji}</span>
                          {selectedColor === actualIndex && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#9B7E3C] rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm text-[#1E1E1E] truncate">{option.name}</span>
                          </div>
                          <p className="text-xs text-[#D9D9D9] line-clamp-1">{option.description}</p>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="p-5 pt-3 border-t border-[#E7BFBF]/30">
        <div className="bg-gradient-to-r from-[#E7BFBF]/20 to-[#9B7E3C]/20 rounded-lg p-3">
          <p className="text-xs text-[#1E1E1E] text-center">
            💡 <strong>Cor Ativa:</strong> {colorOptions[selectedColor].name}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div 
              className="w-6 h-6 rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: colorOptions[selectedColor].primary }}
            />
            <span className="text-xs text-[#D9D9D9]">
              {colorOptions[selectedColor].primary}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}