import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { Products } from '../../core/models/product.model';
import { CartService } from '../../core/service/cart.service';
import { AuthState } from '../../core/store/auth.reducer';
import { selectIsAuthenticated } from '../../core/store/auth.selectors';
import { WishlistState } from '../../core/store/wishlist.reducer';
import { WishlistService } from '../../core/service/wishlist.service';
import { selectWishlistProducts } from '../../core/store/wishlist.selectors';
import { NotificationService } from '../../core/service/notification.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent {

  @Input() product!: Products;

  wishlistProductIds = new Set<number>();

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly store: Store<{ auth: AuthState; wishlist: WishlistState }>,
    private readonly wishlistService: WishlistService,
    private readonly notificationService: NotificationService
  ) {
    this.store.select(selectWishlistProducts).subscribe((products) => {
      this.wishlistProductIds = new Set(products.map((product) => product.id));
    });
  }

  isWishlisted(productId: number): boolean {
    return this.wishlistProductIds.has(productId);
  }

  addtocart(): void {
    this.store.select(selectIsAuthenticated).pipe(take(1)).subscribe((isAuthenticated) => {
      if (!isAuthenticated) {
        void this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/cart' }
        });
        return;
      }

      this.cartService.addToCart(this.product);
      this.notificationService.show(`${this.product.name} added to cart`);
    });
  }

  toggleWishlist(): void {
    this.store.select(selectIsAuthenticated).pipe(take(1)).subscribe((isAuthenticated) => {
      if (!isAuthenticated) {
        void this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/wishlist' }
        });
        return;
      }

      const isAlreadyWishlisted = this.isWishlisted(this.product.id);
      this.wishlistService.toggle(this.product);
      this.notificationService.show(
        isAlreadyWishlisted
          ? `${this.product.name} removed from wishlist`
          : `${this.product.name} added to wishlist`
      );
    });
  }
}