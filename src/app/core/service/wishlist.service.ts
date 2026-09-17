import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Products } from '../models/product.model';
import * as WishlistActions from '../store/wishlist.actions';
import { WishlistState } from '../store/wishlist.reducer';
import { selectWishlistProducts } from '../store/wishlist.selectors';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private activeUserKey: string | null = null;
  readonly products$: Observable<Products[]>;

  constructor(private readonly store: Store<{ wishlist: WishlistState }>) {
    this.products$ = this.store.select(selectWishlistProducts);
    this.products$.subscribe((products) => {
      if (this.activeUserKey) {
        localStorage.setItem(this.activeUserKey, JSON.stringify(products));
      }
    });
  }

  setUser(email: string | null): void {
    this.activeUserKey = email ? this.getStorageKey(email) : null;
    this.store.dispatch(WishlistActions.hydrateWishlist({
      products: this.activeUserKey ? this.loadProducts(this.activeUserKey) : []
    }));
  }

  clearCurrentUser(): void {
    if (this.activeUserKey) {
      localStorage.removeItem(this.activeUserKey);
    }

    this.activeUserKey = null;
    this.store.dispatch(WishlistActions.clearWishlist());
  }

  toggle(product: Products): void {
    this.store.dispatch(WishlistActions.toggleWishlist({ product }));
  }

  remove(productId: number): void {
    this.store.dispatch(WishlistActions.removeFromWishlist({ productId }));
  }

  isSaved(products: Products[], productId: number): boolean {
    return products.some((product) => product.id === productId);
  }

  private getStorageKey(email: string): string {
    return `sole-raw-wishlist:${email.toLowerCase()}`;
  }

  private loadProducts(storageKey: string): Products[] {
    const storedProducts = localStorage.getItem(storageKey);

    if (!storedProducts) {
      return [];
    }

    try {
      return JSON.parse(storedProducts) as Products[];
    } catch {
      localStorage.removeItem(storageKey);
      return [];
    }
  }
}
