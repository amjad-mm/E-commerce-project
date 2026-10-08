import { CartItem } from './cart.model';

export interface Order {
  id: string;
  userId: string | number;
  userEmail: string;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  city?: string;
  state?: string;
  pincode?: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash-on-delivery' | 'online-payment';
  status: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}
