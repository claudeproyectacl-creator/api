import {
  BookOpen,
  Bus,
  Coffee,
  Gamepad2,
  Heart,
  Home,
  Laptop,
  Music,
  Plane,
  Repeat,
  Shirt,
  Tag,
  Utensils,
  Wallet,
} from 'lucide-react';
import type { CategoryIconKey } from '../types/finance';

interface CategoryIconProps {
  icon: CategoryIconKey;
  className?: string;
}

export const AVAILABLE_CATEGORY_ICONS: { key: CategoryIconKey; label: string }[] = [
  { key: 'utensils', label: 'Comida' },
  { key: 'bus', label: 'Transporte' },
  { key: 'gamepad', label: 'Ocio' },
  { key: 'shirt', label: 'Ropa' },
  { key: 'book', label: 'Estudios' },
  { key: 'repeat', label: 'Suscripciones' },
  { key: 'coffee', label: 'Café' },
  { key: 'music', label: 'Música' },
  { key: 'laptop', label: 'Tech' },
  { key: 'home', label: 'Casa' },
  { key: 'plane', label: 'Viaje' },
  { key: 'heart', label: 'Salud' },
  { key: 'wallet', label: 'Paga' },
  { key: 'tag', label: 'Otros' },
];

export function CategoryIcon({ icon, className = 'w-4 h-4' }: CategoryIconProps) {
  switch (icon) {
    case 'utensils':
      return <Utensils className={className} strokeWidth={1.75} />;
    case 'bus':
      return <Bus className={className} strokeWidth={1.75} />;
    case 'gamepad':
      return <Gamepad2 className={className} strokeWidth={1.75} />;
    case 'shirt':
      return <Shirt className={className} strokeWidth={1.75} />;
    case 'book':
      return <BookOpen className={className} strokeWidth={1.75} />;
    case 'repeat':
      return <Repeat className={className} strokeWidth={1.75} />;
    case 'coffee':
      return <Coffee className={className} strokeWidth={1.75} />;
    case 'music':
      return <Music className={className} strokeWidth={1.75} />;
    case 'laptop':
      return <Laptop className={className} strokeWidth={1.75} />;
    case 'home':
      return <Home className={className} strokeWidth={1.75} />;
    case 'plane':
      return <Plane className={className} strokeWidth={1.75} />;
    case 'heart':
      return <Heart className={className} strokeWidth={1.75} />;
    case 'wallet':
      return <Wallet className={className} strokeWidth={1.75} />;
    case 'tag':
    default:
      return <Tag className={className} strokeWidth={1.75} />;
  }
}
