import { AsyncPipe, CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem, CartService } from '../../core/service/cart.service';
import { NotificationService } from '../../core/service/notification.service';
import { SettingsService } from '../../core/service/settings.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, AsyncPipe, CurrencyPipe, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly notificationService = inject(NotificationService);
  private readonly settingsService = inject(SettingsService);

  readonly items$ = this.cartService.items$;
  readonly maxItemQuantity = this.cartService.maxItemQuantity;

  standardShippingFee = 250;
  freeShippingThreshold = 10000;
  couponCode = '';

  ngOnInit(): void {
    this.settingsService.settings$.subscribe((settings) => {
      if (settings?.shipping) {
        this.standardShippingFee = settings.shipping.standardShippingFee;
        this.freeShippingThreshold = settings.shipping.freeShippingThreshold;
      }
    });
  }

  getItemCount(items: CartItem[]): number {
    return this.cartService.getTotalQuantity(items);
  }

  getSubtotal(items: CartItem[]): number {
    return this.cartService.getSubtotal(items);
  }

  getShippingFee(items: CartItem[]): number {
    const subtotal = this.getSubtotal(items);
    if (subtotal === 0 || subtotal >= this.freeShippingThreshold) {
      return 0;
    }
    return this.standardShippingFee;
  }

  getTotal(items: CartItem[]): number {
    return this.getSubtotal(items) + this.getShippingFee(items);
  }

  getShippingProgress(items: CartItem[]): number {
    const subtotal = this.getSubtotal(items);
    if (this.freeShippingThreshold <= 0) return 100;
    return Math.min(100, Math.round((subtotal / this.freeShippingThreshold) * 100));
  }

  updateQuantity(productId: string | number, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeFromCart(productId: string | number): void {
    this.cartService.removeFromCart(productId);
    this.notificationService.show('Item removed from your bag', 'info');
  }

  applyCoupon(): void {
    this.notificationService.show('Access pass or promotional voucher rejected', 'error');
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = '/asset/products/product1.png';
    }
  }

  trackByProductId(_: number, item: CartItem): string | number {
    return item.product.id;
  }
}
