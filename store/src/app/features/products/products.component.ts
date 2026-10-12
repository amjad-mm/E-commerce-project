import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ProductService } from '../../core/service/product.service';
import { Products } from '../../core/models/product.model';
import { ProductDetailsComponent } from '../product-details/product-details.component';
import { AuthState } from '../../core/store/auth.reducer';
import { selectCurrentUser } from '../../core/store/auth.selectors';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [ProductDetailsComponent, RouterLink, AsyncPipe, CurrencyPipe],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly store = inject(Store<{ auth: AuthState }>);

  readonly currentUser$ = this.store.select(selectCurrentUser);

  products: Products[] = [];
  activeSort: 'latest' | 'price-asc' | 'price-desc' = 'latest';

  get displayedProducts(): Products[] {
    const list = [...this.products];
    if (this.activeSort === 'price-asc') {
      return list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    }
    if (this.activeSort === 'price-desc') {
      return list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    // 'latest': Show newest arrivals first (json-server appends to end of list)
    return list.slice().reverse();
  }

  setSort(sort: 'latest' | 'price-asc' | 'price-desc'): void {
    this.activeSort = sort;
  }

  openProduct(id: string | number, event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    const clickedControl = clickedElement.closest('button, a');

    if (clickedControl) {
      return;
    }

    void this.router.navigate(['/product', id]);
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data || [];
      },
      error: (error) => {
        console.error('Error loading products for storefront:', error);
      }
    });
  }
}
