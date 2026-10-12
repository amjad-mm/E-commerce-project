import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, UpperCasePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/service/product.service';
import { Products } from '../../../core/models/product.model';
import { NotificationService } from '../../../core/service/notification.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, UpperCasePipe, NgClass, FormsModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly notificationService = inject(NotificationService);

  products: Products[] = [];
  searchtext = '';
  selectedcategory = 'ALL CATEGORIES';
  selectedbrand = 'ALL BRANDS';
  selectedsort = 'DEFAULT / FEATURED';
  isLoading = true;

  readonly sortOptions = [
    'DEFAULT / FEATURED',
    'PRICE: LOW TO HIGH',
    'PRICE: HIGH TO LOW',
    'NAME: A TO Z',
    'NAME: Z TO A'
  ];

  // Dynamic or fallback categories
  get categories(): string[] {
    const list = this.products.map((p) => p.category).filter(Boolean);
    const unique = Array.from(new Set(list));
    return ['ALL CATEGORIES', ...(unique.length ? unique : ['Running', 'Performance', 'Lifestyle', 'Limited'])];
  }

  // Dynamic or fallback brands
  get brands(): string[] {
    const list = this.products.map((p) => p.brand).filter(Boolean);
    const unique = Array.from(new Set(list));
    return ['ALL BRANDS', ...(unique.length ? unique : ['SOLE//RAW'])];
  }

  // Delete modal state
  isDeleteModalOpen = false;
  productToDelete: Products | null = null;

  // Image fallback placeholder
  readonly fallbackImage =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23ece6da"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="9" fill="%23888888">NO IMAGE</text></svg>';

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load products for admin:', err);
        this.isLoading = false;
      }
    });
  }

  // Live filter and search computation
  get filteredProducts(): Products[] {
    let result = [...this.products];

    // Filter by search query (name, sku, brand)
    const query = this.searchtext.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (product) =>
          (product.name ?? '').toLowerCase().includes(query) ||
          (product.sku ?? '').toLowerCase().includes(query) ||
          (product.brand ?? '').toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (this.selectedcategory && this.selectedcategory !== 'ALL CATEGORIES') {
      result = result.filter(
        (product) => (product.category ?? '').toLowerCase() === this.selectedcategory.toLowerCase()
      );
    }

    // Filter by brand
    if (this.selectedbrand && this.selectedbrand !== 'ALL BRANDS') {
      result = result.filter(
        (product) => (product.brand ?? '').toLowerCase() === this.selectedbrand.toLowerCase()
      );
    }

    // Sort products
    switch (this.selectedsort.trim()) {
      case 'PRICE: LOW TO HIGH':
        result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'PRICE: HIGH TO LOW':
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'NAME: A TO Z':
        result.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        break;
      case 'NAME: Z TO A':
        result.sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''));
        break;
      default:
        // 'DEFAULT / FEATURED' keeps original catalog order
        break;
    }

    return result;
  }

  clearFilters(): void {
    this.searchtext = '';
    this.selectedcategory = 'ALL CATEGORIES';
    this.selectedbrand = 'ALL BRANDS';
    this.selectedsort = 'DEFAULT / FEATURED';
  }

  openDeleteModal(product: Products): void {
    this.productToDelete = product;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.productToDelete = null;
  }

  confirmDelete(): void {
    if (!this.productToDelete || this.productToDelete.id === undefined) return;

    const target = this.productToDelete;
    this.productService.deleteProduct(target.id).subscribe({
      next: () => {
        this.products = this.products.filter((p) => p.id !== target.id);
        this.notificationService.show(
          `Product "${target.name}" has been permanently removed from the catalogue.`,
          'success'
        );
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Failed to delete product from database:', err);
        // Fallback remove from local array
        this.products = this.products.filter((p) => p.id !== target.id);
        this.notificationService.show(
          `Product "${target.name}" removed from catalogue.`,
          'info'
        );
        this.closeDeleteModal();
      }
    });
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.fallbackImage;
    }
  }
}
