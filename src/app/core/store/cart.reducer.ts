import { createReducer, on } from '@ngrx/store';
import { CartItem } from '../models/cart.model';
import * as CartActions from './cart.actions';

export interface CartState {
  items: CartItem[];
}

export const initialCartState: CartState = {
  items: []
};

export const cartReducer = createReducer(
  initialCartState,
  on(CartActions.hydrateCart, (_state, { items }) => ({ items })),
  on(CartActions.addToCart, (state, { product }) => {
    const existingItem = state.items.find((item) => item.product.id === product.id);

    return existingItem
      ? {
          ...state,
          items: state.items.map((item) => item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item)
        }
      : { ...state, items: [...state.items, { product, quantity: 1 }] };
  }),
  on(CartActions.updateQuantity, (state, { productId, quantity }) => quantity <= 0
    ? { ...state, items: state.items.filter((item) => item.product.id !== productId) }
    : {
        ...state,
        items: state.items.map((item) => item.product.id === productId
          ? { ...item, quantity }
          : item)
      }),
  on(CartActions.removeFromCart, (state, { productId }) => ({
    ...state,
    items: state.items.filter((item) => item.product.id !== productId)
  })),
  on(CartActions.clearCart, (state) => ({ ...state, items: [] }))
);
