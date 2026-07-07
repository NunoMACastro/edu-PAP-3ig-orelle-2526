import { Star, ShoppingCart } from 'lucide-react@0.263.1';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

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

export function ProductCard({
  name,
  description,
  price,
  originalPrice,
  rating,
  reviews,
  image,
  category,
  isNew
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
      <div className="relative aspect-square overflow-hidden bg-[#F5EFE7]">
        <ImageWithFallback
          src={image}
          alt={name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {isNew && (
          <Badge className="absolute top-3 right-3 bg-[#9B7E3C] text-[#F5EFE7] hover:bg-[#9B7E3C]/90">
            Novo
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs text-[#8C8C8C] uppercase tracking-wide">{category}</span>
        </div>
        
        <h3 className="text-[#1E1E1E] mb-2">{name}</h3>
        
        <p className="text-sm text-[#6B6B6B] mb-3 line-clamp-2">{description}</p>
        
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(rating)
                  ? 'fill-[#9B7E3C] text-[#9B7E3C]'
                  : 'fill-none text-[#BFBFBF]'
              }`}
            />
          ))}
          <span className="text-sm text-[#6B6B6B] ml-1">({reviews})</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            {originalPrice && (
              <span className="text-sm text-[#8C8C8C] line-through mr-2">
                €{originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-primary">€{price.toFixed(2)}</span>
          </div>
          
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-[#F5EFE7]">
            <ShoppingCart className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}