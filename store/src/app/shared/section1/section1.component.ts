import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CurrencyPipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Products } from '../../core/models/product.model';
import { ProductService } from '../../core/service/product.service';

const FALLBACK_PRODUCTS: Products[] = [
  {
    id: 1,
    name: 'RAW-01 RUNNER',
    brand: 'SOLE//RAW',
    price: 8999,
    image: '/asset/products/product1.png',
    description: 'Lightweight performance runner with a lattice sole chassis.',
    category: 'Running',
    tag: 'FLAGSHIP DROP',
    sku: 'RAW-2026-01',
    weight: '480G',
    colorway: 'BLACK / ACID GREEN',
    spec: 'LATTICE SOLE CHASSIS',
    theme: 'lime'
  },
  {
    id: 2,
    name: 'RAW-02 VELOCITY',
    brand: 'SOLE//RAW',
    price: 11499,
    image: '/asset/products/product2.png',
    description: 'High-performance sneaker engineered with Aero-Pod traction.',
    category: 'Performance',
    tag: 'PERFORMANCE LAB',
    sku: 'RAW-2026-02',
    weight: '390G',
    colorway: 'ELECTRIC BLUE / ONYX',
    spec: 'AERO-POD TRACTION',
    theme: 'blue'
  },
  {
    id: 3,
    name: 'RAW-03 ARCHIVE',
    brand: 'SOLE//RAW',
    price: 9499,
    image: '/asset/products/product3.png',
    description: 'Classic archive-inspired sneaker with a durable vulcanized compound.',
    category: 'Lifestyle',
    tag: 'ARCHIVE SERIES',
    sku: 'RAW-2026-03',
    weight: '430G',
    colorway: 'SAND / ORANGE',
    spec: 'VULCANIZED COMPOUND',
    theme: 'peach'
  },
  {
    id: 4,
    name: 'RAW-04 MONO',
    brand: 'SOLE//RAW',
    price: 7999,
    image: '/asset/products/product4.png',
    description: 'Minimal triple-black sneaker built with reinforced ripstop construction.',
    category: 'Lifestyle',
    tag: 'RESTOCK ALLOTMENT',
    sku: 'RAW-2026-04',
    weight: '375G',
    colorway: 'TRIPLE BLACK / VOLT',
    spec: 'REINFORCED RIPSTOP',
    theme: 'dark'
  },
  {
    id: 5,
    name: 'RAW-05 HYBRID',
    brand: 'SOLE//RAW',
    price: 12999,
    image: '/asset/products/product5.png',
    description: 'Experimental hybrid silhouette with dual-density foam chassis.',
    category: 'Lifestyle',
    tag: 'EXPERIMENTAL DROP',
    sku: 'RAW-2026-05',
    weight: '410G',
    colorway: 'GREY / PURPLE',
    spec: 'DUAL DENSITY CHASSIS',
    theme: 'purple'
  }
];

@Component({
  selector: 'app-section1',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, UpperCasePipe],
  templateUrl: './section1.component.html',
  styleUrl: './section1.component.css'
})
export class Section1Component implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);

  products: Products[] = FALLBACK_PRODUCTS;
  currentIndex = 0;
  transitionState: 'entering' | 'active' | 'exiting' = 'active';
  isPaused = false;
  private isTransitioning = false;
  private cycleTimer: ReturnType<typeof setInterval> | null = null;
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;

  get currentProduct(): Products {
    return this.products[this.currentIndex] || this.products[0];
  }

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.products = data;
          if (this.currentIndex >= this.products.length) {
            this.currentIndex = 0;
          }
        }
      },
      error: () => {
        // Retain fallback products
      }
    });

    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
  }

  startAutoplay(): void {
    this.stopAutoplay();
    this.cycleTimer = setInterval(() => {
      if (!this.isPaused) {
        this.nextSlide();
      }
    }, 4600);
  }

  stopAutoplay(): void {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
  }

  nextSlide(): void {
    if (this.isTransitioning || this.products.length <= 1) return;
    this.executeTransition((this.currentIndex + 1) % this.products.length);
  }

  prevSlide(): void {
    if (this.isTransitioning || this.products.length <= 1) return;
    this.executeTransition((this.currentIndex - 1 + this.products.length) % this.products.length);
  }

  goToSlide(index: number): void {
    if (this.isTransitioning || index === this.currentIndex) return;
    this.executeTransition(index);
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  private executeTransition(targetIndex: number): void {
    this.isTransitioning = true;
    this.transitionState = 'exiting';

    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }

    this.transitionTimer = setTimeout(() => {
      this.currentIndex = targetIndex;
      this.transitionState = 'entering';

      this.transitionTimer = setTimeout(() => {
        this.transitionState = 'active';
        this.isTransitioning = false;
      }, 50);
    }, 450);
  }
}
