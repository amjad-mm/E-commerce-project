import { createReducer, on } from '@ngrx/store';
import { Products } from '../models/product.model';
import * as WishlistActions from './wishlist.actions';

export interface WishlistState {
  products: Products[];
}

export const initialWishlistState: WishlistState = {
  products: []
};

export const wishlistReducer = createReducer(
  initialWishlistState,
  on(WishlistActions.hydrateWishlist, (_state, { products }) => ({ products })),
  on(WishlistActions.toggleWishlist, (state, { product }) => ({
    products: state.products.some((item) => item.id === product.id)
      ? state.products.filter((item) => item.id !== product.id)
      : [...state.products, product]
  })),
  on(WishlistActions.removeFromWishlist, (state, { productId }) => ({
    products: state.products.filter((product) => product.id !== productId)
  })),
  on(WishlistActions.clearWishlist, () => initialWishlistState)
);
