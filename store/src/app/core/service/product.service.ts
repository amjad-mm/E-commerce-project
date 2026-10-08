import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Products } from '../models/product.model';

const FALLBACK_CATALOG: Products[] = [
  {
    id: 1,
    name: 'RAW-01 RUNNER',
    brand: 'SOLE//RAW',
    price: 8999,
    image: '/asset/products/product1.png',
    images: [
      '/asset/products/product1.png',
      '/asset/products/product1-1.jpg',
      '/asset/products/product1-2.jpg'
    ],
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
    name: 'RAW-05 GHOST',
    brand: 'SOLE//RAW',
    price: 10299,
    image: '/asset/products/product5.png',
    description: 'Limited capsule sneaker featuring a lightweight knit mono upper.',
    category: 'Limited',
    tag: 'LIMITED CAPSULE',
    sku: 'RAW-2026-05',
    weight: '410G',
    colorway: 'GHOST WHITE / LILAC',
    spec: 'KNIT MONO UPPER',
    theme: 'purple'
  }
];

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/products';

  getProducts(): Observable<Products[]> {
    return this.http.get<Products[]>(this.apiUrl).pipe(
      map((products) => {
        if (!products || products.length === 0) return FALLBACK_CATALOG;
        return products.map((p) => ({ ...p, id: Number(p.id) }));
      }),
      catchError(() => of(FALLBACK_CATALOG))
    );
  }

  getProductById(id: number): Observable<Products> {
    const numericId = Number(id);
    return this.http.get<Products>(`${this.apiUrl}/${id}`).pipe(
      map((p) => ({ ...p, id: Number(p.id) })),
      catchError(() => {
        const found = FALLBACK_CATALOG.find((p) => p.id === numericId) || FALLBACK_CATALOG[0];
        return of(found);
      })
    );
  }
}