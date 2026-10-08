import { AsyncPipe, CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem, CartService } from '../../core/service/cart.service';
import { NotificationService } from '../../core/service/notification.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, AsyncPipe, CurrencyPipe, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  private readonly cartService = inject(CartService);
  private readonly notificationService = inject(NotificationService);

  readonly items$ = this.cartService.items$;
  readonly maxItemQuantity = this.cartService.maxItemQuantity;

  getItemCount(items: CartItem[]): number {
    return this.cartService.getTotalQuantity(items);
  }

  getSubtotal(items: CartItem[]): number {
    return this.cartService.getSubtotal(items);
  }

  updateQuantity(productId: number, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  applyCoupon(): void {
    this.notificationService.show('Invalid access code or passkey', 'error');
  }

  trackByProductId(_: number, item: CartItem): number {
    return item.product.id;
  }

}
