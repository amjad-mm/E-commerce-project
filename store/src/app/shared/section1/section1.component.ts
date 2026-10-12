import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CurrencyPipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Products } from '../../core/models/product.model';
import { ProductService } from '../../core/service/product.service';

const FALLBACK_PRODUCTS: Products[] = [
  {
    id: 1,
    name: 'Pegasus Trail 4 GORE-TEX',
    brand: 'Nike',
    price: 14495,
    image: '/asset/products/product1.png',
    description: 'Waterproof trail runner engineered for transitions between road and rugged terrain. Built with a GORE-TEX membrane, responsive Nike React foam cushioning, and an all-terrain lugged rubber outsole.',
    category: 'Running',
    tag: 'TRAIL ESSENTIAL',
    sku: 'NK-DJ7926-001',
    weight: '298G',
    colorway: 'BLACK / REFLECTIVE / VOLT',
    spec: 'REACT FOAM // GORE-TEX MEMBRANE',
    theme: 'lime'
  },
  {
    id: 2,
    name: 'Ultraboost Light',
    brand: 'Adidas',
    price: 18999,
    image: '/asset/products/product2.png',
    description: 'High-mileage performance road runner engineered with 30% lighter Light Boost cushioning. Features a foot-wrapping PRIMEKNIT+ textile upper and a Continental™ Better Rubber outsole for superior traction.',
    category: 'Running',
    tag: 'MAX CUSHIONING',
    sku: 'AD-HQ6339-WHT',
    weight: '293G',
    colorway: 'CLOUD WHITE / CORE BLACK / MINT',
    spec: 'LIGHT BOOST // CONTINENTAL™ RUBBER',
    theme: 'blue'
  },
  {
    id: 3,
    name: 'Dunk Low Retro',
    brand: 'Nike',
    price: 8695,
    image: '/asset/products/product3.png',
    description: 'Iconic basketball shoe turned streetwear staple with crisp leather overlays and vintage styling. Finished with a padded low-cut collar, perforated toe box ventilation, and classic rubber cupsole traction.',
    category: 'Lifestyle',
    tag: 'HERITAGE CLASSIC',
    sku: 'NK-DD1391-100',
    weight: '410G',
    colorway: 'WHITE / BLACK / NEUTRAL',
    spec: 'PREMIUM LEATHER // RUBBER CUPSOLE',
    theme: 'peach'
  },
  {
    id: 4,
    name: '2002R Triple Black',
    brand: 'New Balance',
    price: 13999,
    image: '/asset/products/product4.png',
    description: 'Modern technical runner clad in a stealth monochromatic execution. Combines premium suede and breathable mesh uppers with an ABZORB midsole and Stability Web arch support for exceptional shock absorption.',
    category: 'Lifestyle',
    tag: 'STREETWEAR STAPLE',
    sku: 'NB-ML2002RK-BLK',
    weight: '385G',
    colorway: 'TRIPLE BLACK / PHANTOM',
    spec: 'ABZORB MIDSOLE // N-ERGY OUTSOLE',
    theme: 'dark'
  },
  {
    id: 5,
    name: 'GEL-Kayano 14',
    brand: 'ASICS',
    price: 14999,
    image: '/asset/products/product5.png',
    description: 'Late-2000s technical running silhouette reimagined for lifestyle wear. Delivers signature retro aesthetics alongside visible rearfoot and forefoot GEL™ technology cushioning and a TRUSSTIC™ support chassis.',
    category: 'Lifestyle',
    tag: 'ARCHIVE RUNNER',
    sku: 'AS-1201A019-105',
    weight: '330G',
    colorway: 'CREAM / PURE SILVER / PLUM',
    spec: 'GEL™ TECHNOLOGY // TRUSSTIC™ SUPPORT',
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
