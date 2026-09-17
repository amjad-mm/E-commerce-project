import { createAction, props } from '@ngrx/store';
import { Products } from '../models/product.model';

export const hydrateWishlist = createAction(
  '[Wishlist] Hydrate Wishlist',
  props<{ products: Products[] }>()
);

export const toggleWishlist = createAction(
  '[Wishlist] Toggle Wishlist',
  props<{ product: Products }>()
);

export const removeFromWishlist = createAction(
  '[Wishlist] Remove From Wishlist',
  props<{ productId: number }>()
);

export const clearWishlist = createAction('[Wishlist] Clear Wishlist');
