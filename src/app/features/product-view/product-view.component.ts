import { AsyncPipe, CurrencyPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { Products } from '../../core/models/product.model';
import { ProductService } from '../../core/service/product.service';
import { CartService } from '../../core/service/cart.service';
import { NotificationService } from '../../core/service/notification.service';

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, NgIf, RouterLink],
  templateUrl: './product-view.component.html',
  styleUrl: './product-view.component.css'
})
export class ProductViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly notificationService = inject(NotificationService);

  readonly product$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    map((idText) => idText ? Number(idText) : 0),
    switchMap((id) => {
      const hasValidId = Number.isInteger(id) && id > 0;

      if (!hasValidId) {
        return of(null);
      }

      return this.productService.getProductById(id);
    }),
    catchError(() => of(null))
  );

  addToCart(product: Products): void {
    this.cartService.addToCart(product);
    this.notificationService.show(`${product.name} added to cart`);
  }
}
