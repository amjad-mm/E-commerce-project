import { createAction, props } from '@ngrx/store';
import { Products } from '../models/product.model';
import { CartItem } from '../models/cart.model';

export const hydrateCart = createAction(
  '[Cart] Hydrate Cart',
  props<{ items: CartItem[] }>()
);

export const addToCart = createAction(
  '[Cart] Add To Cart',
  props<{ product: Products }>()
);

export const updateQuantity = createAction(
  '[Cart] Update Quantity',
  props<{ productId: number; quantity: number }>()
);

export const removeFromCart = createAction(
  '[Cart] Remove From Cart',
  props<{ productId: number }>()
);

export const clearCart = createAction('[Cart] Clear Cart');
