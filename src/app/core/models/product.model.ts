export interface Products {
  id: number;
  name: string;
  brand: string;
  price: number;
  image: string;
  images?: string[];
  description: string;
  category: string;

  tag: string;
  sku: string;
  weight: string;
  colorway: string;
  spec: string;

  theme: 'lime' | 'blue' | 'peach' | 'dark' | 'purple';
}
