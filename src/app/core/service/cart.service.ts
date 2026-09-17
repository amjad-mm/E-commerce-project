import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Products } from '../models/product.model';
import { CartItem } from '../models/cart.model';
import * as CartActions from '../store/cart.actions';
import { CartState } from '../store/cart.reducer';
import { selectCartItems } from '../store/cart.selectors';

export type { CartItem } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private activeUserKey: string | null = null;
  readonly items$: Observable<CartItem[]>;

  constructor(private readonly store: Store<{ cart: CartState }>) {
    this.items$ = this.store.select(selectCartItems);
    this.items$.subscribe((items) => {
      if (this.activeUserKey) {
        localStorage.setItem(this.activeUserKey, JSON.stringify(items));
      }
    });
  }

  setUser(email: string | null): void {
    this.activeUserKey = email ? this.getStorageKey(email) : null;
    this.store.dispatch(CartActions.hydrateCart({
      items: this.activeUserKey ? this.loadItems(this.activeUserKey) : []
    }));
  }

  clearCurrentUser(): void {
    if (this.activeUserKey) {
      localStorage.removeItem(this.activeUserKey);
    }

    this.activeUserKey = null;
    this.store.dispatch(CartActions.clearCart());
  }

  addToCart(product: Products): void {
    this.store.dispatch(CartActions.addToCart({ product }));
  }

  updateQuantity(productId: number, quantity: number): void {
    this.store.dispatch(CartActions.updateQuantity({ productId, quantity }));
  }

  removeFromCart(productId: number): void {
    this.store.dispatch(CartActions.removeFromCart({ productId }));
  }

  clearCart(): void {
    this.store.dispatch(CartActions.clearCart());
  }

  getTotalQuantity(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  getSubtotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }

  private getStorageKey(email: string): string {
    return `sole-raw-cart:${email.toLowerCase()}`;
  }

  private loadItems(storageKey: string): CartItem[] {
    const storedItems = localStorage.getItem(storageKey);

    if (!storedItems) {
      return [];
    }

    try {
      return JSON.parse(storedItems) as CartItem[];
    } catch {
      localStorage.removeItem(storageKey);
      return [];
    }
  }
}
