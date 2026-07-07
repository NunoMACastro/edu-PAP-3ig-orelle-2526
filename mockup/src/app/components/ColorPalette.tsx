import { Check } from 'lucide-react@0.263.1';

interface ColorPaletteProps {
  colors: Array<{
    name: string;
    hex: string;
    emoji: string;
  }>;
  activeIndex?: number;
}

export function ColorPalette({ colors, activeIndex = 0 }: ColorPaletteProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {colors.map((color, index) => (
        <div
          key={index}
          className={`relative group transition-all ${
            activeIndex === index ? 'scale-105' : 'hover:scale-105'
          }`}
        >
          <div className="text-center">
            <div
              className={`w-full aspect-square rounded-xl mb-2 flex items-center justify-center text-2xl transition-all border-4 ${
                activeIndex === index
                  ? 'border-[#9B7E3C] shadow-lg'
                  : 'border-white shadow-md'
              }`}
              style={{ backgroundColor: color.hex }}
            >
              {color.emoji}
              {activeIndex === index && (
                <div className="absolute top-1 right-1 bg-[#9B7E3C] rounded-full p-1">
                  <Check className="h-3 w-3 text-[#F5EFE7]" />
                </div>
              )}
            </div>
            <p className={`text-xs ${activeIndex === index ? 'text-primary' : 'text-[#1E1E1E]'}`}>
              {color.name}
            </p>
            <p className="text-xs text-[#D9D9D9] font-mono">{color.hex}</p>
          </div>
        </div>
      ))}
    </div>
  );
}