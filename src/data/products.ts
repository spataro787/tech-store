import type { Product } from '../types/product'

export const products: Product[] = [
  {
    id: 'keyboard-01',
    name: 'Teclado mecánico',
    description: 'Teclado con conexión USB para trabajo y juegos.',
    price: 65000,
    category: 'Periféricos',
    stock: 10,
    imageUrl: '',
  },
  {
    id: 'mouse-01',
    name: 'Mouse inalámbrico',
    description: 'Mouse compacto para uso diario.',
    price: 25000,
    category: 'Periféricos',
    stock: 15,
    imageUrl: '',
  },
  {
    id: 'monitor-01',
    name: 'Monitor de 24 pulgadas',
    description: 'Monitor Full HD para estudiar y trabajar.',
    price: 220000,
    category: 'Monitores',
    stock: 5,
    imageUrl: '',
  },
]