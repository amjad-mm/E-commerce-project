import { AsyncPipe, CurrencyPipe, NgIf, UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, catchError, map, of, switchMap, take, tap } from 'rxjs';
import { Products } from '../../core/models/product.model';
import { ProductService } from '../../core/service/product.service';
import { CartService } from '../../core/service/cart.service';
import { WishlistService } from '../../core/service/wishlist.service';
import { NotificationService } from '../../core/service/notification.service';
import { MAX_ITEM_QUANTITY } from '../../core/constants/commerce.constants';
import { CartState } from '../../core/store/cart.reducer';
import { selectCartItems } from '../../core/store/cart.selectors';
import { AuthState } from '../../core/store/auth.reducer';
import { selectIsAuthenticated } from '../../core/store/auth.selectors';
import { WishlistState } from '../../core/store/wishlist.reducer';
import { selectWishlistProducts } from '../../core/store/wishlist.selectors';

export interface ShoeSizeOption {
  uk: string;
  eu: string;
  us: string;
  cm: string;
}

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, NgIf, UpperCasePipe, RouterLink],
  templateUrl: './product-view.component.html',
  styleUrl: './product-view.component.css'
})
export class ProductViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly notificationService = inject(NotificationService);
  private readonly store = inject(Store<{ cart: CartState; auth: AuthState; wishlist: WishlistState }>);

  selectedImage = '';
  quantity = 1;
  readonly maxQuantity = MAX_ITEM_QUANTITY;
  cartItemIds = new Set<string>();
  wishlistProductIds = new Set<string>();
  isProcessing = false;

  // Shoe Sizing
  readonly availableSizes: ShoeSizeOption[] = [
    { uk: 'UK 6', eu: 'EU 40', us: 'US 7', cm: '25.0 cm' },
    { uk: 'UK 7', eu: 'EU 41', us: 'US 8', cm: '26.0 cm' },
    { uk: 'UK 8', eu: 'EU 42.5', us: 'US 9', cm: '27.0 cm' },
    { uk: 'UK 9', eu: 'EU 44', us: 'US 10', cm: '28.0 cm' },
    { uk: 'UK 10', eu: 'EU 45', us: 'US 11', cm: '29.0 cm' },
    { uk: 'UK 11', eu: 'EU 46', us: 'US 12', cm: '30.0 cm' },
  ];
  selectedSize = 'UK 8';
  sizeScale: 'UK' | 'EU' | 'US' = 'UK';
  showSizeGuide = false;

  readonly product$: Observable<Products | null> = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    switchMap((idParam) => {
      if (!idParam || idParam.trim() === '' || idParam === '0' || idParam === 'NaN') {
        return of(null);
      }
      return this.productService.getProductById(idParam).pipe(
        tap((prod) => {
          if (prod) {
            this.selectedImage = prod.images?.length ? prod.images[0] : prod.image;
            this.quantity = 1;
            this.selectedSize = 'UK 8';
          }
        }),
        catchError((err) => {
          console.warn('[ProductViewComponent] Product error loading:', err);
          return of(null);
        })
      );
    }),
    catchError(() => of(null))
  );

  readonly relatedProducts$: Observable<Products[]> = this.product$.pipe(
    switchMap((currentProduct) => {
      if (!currentProduct) return of([]);
      return this.productService.getProducts().pipe(
        map((all) => {
          return all
            .filter((p) => String(p.id) !== String(currentProduct.id))
            .sort((a, b) => {
              if (a.category === currentProduct.category && b.category !== currentProduct.category) return -1;
              if (a.category !== currentProduct.category && b.category === currentProduct.category) return 1;
              return 0;
            })
            .slice(0, 4);
        }),
        catchError(() => of([]))
      );
    })
  );

  constructor() {
    this.store.select(selectCartItems).subscribe((items) => {
      this.cartItemIds = new Set(items.map((item) => String(item.product.id)));
    });

    this.store.select(selectWishlistProducts).subscribe((products) => {
      this.wishlistProductIds = new Set(products.map((p) => String(p.id)));
    });
  }

  selectSize(size: string): void {
    this.selectedSize = size;
  }

  setSizeScale(scale: 'UK' | 'EU' | 'US'): void {
    this.sizeScale = scale;
  }

  toggleSizeGuide(): void {
    this.showSizeGuide = !this.showSizeGuide;
  }

  isInCart(productId: number | string): boolean {
    return this.cartItemIds.has(String(productId));
  }

  isWishlisted(productId: number | string): boolean {
    return this.wishlistProductIds.has(String(productId));
  }

  addToCart(product: Products): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    if (this.isInCart(product.id)) {
      this.notificationService.show(`${product.name} is already in your bag`, 'info');
      this.isProcessing = false;
      return;
    }

    for (let count = 0; count < this.quantity; count += 1) {
      this.cartService.addToCart(product);
    }
    this.notificationService.show(`${product.name} [Size: ${this.selectedSize}] added to bag [x${this.quantity}]`, 'success');
    this.isProcessing = false;
  }

  buyNow(product: Products): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.store.select(selectIsAuthenticated).pipe(take(1)).subscribe((isAuthenticated) => {
      if (!this.isInCart(product.id)) {
        for (let count = 0; count < this.quantity; count += 1) {
          this.cartService.addToCart(product);
        }
      }

      if (!isAuthenticated) {
        this.notificationService.show(`Allocated ${product.name} [Size: ${this.selectedSize}]. Please sign in to finalize checkout.`, 'info');
        void this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/checkout' }
        }).then(() => {
          this.isProcessing = false;
        });
      } else {
        this.notificationService.show(`Allocation confirmed [Size: ${this.selectedSize}]. Proceeding to checkout...`, 'success');
        void this.router.navigate(['/checkout']).then(() => {
          this.isProcessing = false;
        });
      }
    });
  }

  toggleWishlist(product: Products): void {
    this.store.select(selectIsAuthenticated).pipe(take(1)).subscribe((isAuthenticated) => {
      if (!isAuthenticated) {
        void this.router.navigate(['/login'], {
          queryParams: { returnUrl: `/product/${product.id}` }
        });
        return;
      }

      const isAlready = this.isWishlisted(product.id);
      this.wishlistService.toggle(product);
      this.notificationService.show(
        isAlready
          ? `${product.name} removed from wishlist`
          : `${product.name} saved to private wishlist`,
        'info'
      );
    });
  }

  getImages(product: Products): string[] {
    return product.images?.length ? product.images : [product.image];
  }

  selectImage(image: string): void {
    this.selectedImage = image;
  }

  updateQuantity(quantity: number): void {
    this.quantity = Math.min(Math.max(1, Math.floor(quantity) || 1), this.maxQuantity);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/asset/products/product1.png';
    }
  }
}
