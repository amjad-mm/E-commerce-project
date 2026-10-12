import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { Products } from '../models/product.model';

const FALLBACK_CATALOG: Products[] = [
  {
    id: '1',
    name: 'Pegasus Trail 4 GORE-TEX',
    brand: 'Nike',
    price: 14495,
    image: '/asset/products/product1.png',
    images: [
      '/asset/products/product1.png',
      '/asset/products/product1-1.jpg',
      '/asset/products/product1-2.jpg'
    ],
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
    id: '2',
    name: 'Ultraboost Light',
    brand: 'Adidas',
    price: 18999,
    image: '/asset/products/product2.png',
    images: [
      '/asset/products/product2.png'
    ],
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
    id: '3',
    name: 'Dunk Low Retro',
    brand: 'Nike',
    price: 8695,
    image: '/asset/products/product3.png',
    images: [
      '/asset/products/product3.png'
    ],
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
    id: '4',
    name: '2002R Triple Black',
    brand: 'New Balance',
    price: 13999,
    image: '/asset/products/product4.png',
    images: [
      '/asset/products/product4.png'
    ],
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
    id: '5',
    name: 'GEL-Kayano 14',
    brand: 'ASICS',
    price: 14999,
    image: '/asset/products/product5.png',
    images: [
      '/asset/products/product5.png'
    ],
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

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/products';

  getProducts(): Observable<Products[]> {
    return this.http.get<Products[]>(this.apiUrl).pipe(
      map((products) => {
        if (!products || products.length === 0) {
          return FALLBACK_CATALOG;
        }
        return products;
      }),
      catchError((error) => {
        console.warn('[ProductService] Backend API not responding, using offline fallback catalog:', error);
        return of(FALLBACK_CATALOG);
      })
    );
  }

  getProductById(id: string | number): Observable<Products> {
    const idStr = String(id);
    return this.http.get<Products>(`${this.apiUrl}/${idStr}`).pipe(
      catchError((error) => {
        // Only return from fallback catalog if the requested ID genuinely matches a fallback item
        const found = FALLBACK_CATALOG.find((p) => String(p.id) === idStr);
        if (found) {
          return of(found);
        }
        // Never return a different product (like FALLBACK_CATALOG[0]) when the record is not found.
        return throwError(() => error);
      })
    );
  }

  createProduct(product: Omit<Products, 'id'> | Products): Observable<Products> {
    // Strip manual ID so json-server generates a unique database ID
    const { id, ...cleanProduct } = product as any;

    const payload = {
      ...cleanProduct,
      price: Number(cleanProduct.price) || 0,
      image: cleanProduct.image || (Array.isArray(cleanProduct.images) && cleanProduct.images[0]) || '/asset/products/product1.png',
      images: Array.isArray(cleanProduct.images) && cleanProduct.images.length > 0
        ? cleanProduct.images
        : [cleanProduct.image || '/asset/products/product1.png'],
      tag: cleanProduct.tag || '',
      theme: cleanProduct.theme || 'lime'
    };

    return this.http.post<Products>(this.apiUrl, payload);
  }

  // Alias for backward compatibility
  createproduct(product: Omit<Products, 'id'> | Products): Observable<Products> {
    return this.createProduct(product);
  }

  updateProduct(id: string | number, product: Partial<Products>): Observable<Products> {
    const idStr = String(id);
    return this.http.put<Products>(`${this.apiUrl}/${idStr}`, product).pipe(
      catchError(() => {
        return this.http.patch<Products>(`${this.apiUrl}/${idStr}`, product);
      })
    );
  }

  deleteProduct(id: string | number): Observable<void> {
    const idStr = String(id);
    return this.http.delete<void>(`${this.apiUrl}/${idStr}`);
  }
}