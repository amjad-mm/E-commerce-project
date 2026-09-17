import { Products } from './product.model';

export interface CartItem {
  product: Products;
  quantity: number;
}
