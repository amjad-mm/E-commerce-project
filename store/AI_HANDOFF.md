# SOLE//RAW Store - AI Handoff

This document describes the current Angular application in this folder. Use it as context when asking another AI to continue development.

> **Current-state update (2026-09-15):** The sections below were originally written before authentication, wishlist, checkout, order creation, notifications, product details routing, and NgRx auth/order/wishlist state were completed. The authoritative current architecture is summarized here. When an older section conflicts with this update, follow this update and inspect the linked source files.

## Current Architecture

```text
Angular bootstrap
  -> AppComponent
  -> Navbar + storefront sections + Products + Footer
  -> protected router-outlet pages when the URL is an auth/protected route

JSON Server
  -> ProductService -> ProductsComponent -> existing ProductDetailsComponent card
  -> AuthService -> Login/Register
  -> OrderService -> CheckoutComponent -> OrderSuccessComponent

NgRx Store
  -> auth state
  -> cart state
  -> wishlist state
  -> orders state
```

### Current source areas

```text
src/app/
├── core/
│   ├── guards/auth.guard.ts, guest.guard.ts
│   ├── interceptors/auth.interceptor.ts
│   ├── models/cart.model.ts, order.model.ts, product.model.ts, user.models.ts
│   ├── service/
│   │   ├── auth.service.ts
│   │   ├── cart.service.ts
│   │   ├── notification.service.ts
│   │   ├── order.service.ts
│   │   ├── product.service.ts
│   │   └── wishlist.service.ts
│   └── store/
│       ├── auth.actions/reducer/selectors
│       ├── cart.actions/reducer/selectors
│       ├── order.actions/reducer/selectors
│       └── wishlist.actions/reducer/selectors
├── features/
│   ├── account/
│   ├── cart/
│   ├── checkout/
│   ├── home/
│   ├── login/
│   ├── order-success/
│   ├── orders/
│   ├── product-details/       # existing product card; do not rename
│   ├── product-view/          # full /product/:id page
│   ├── products/
│   ├── register/
│   └── wishlist/
└── shared/
    ├── catagories/
    ├── footer/
    ├── navbar/
    ├── notification/
    ├── protected-page/
    └── section1/
```

### Current routes

`src/app/app.routes.ts` currently defines:

```text
/cart                 CartComponent       authGuard
/product/:id          ProductViewComponent authGuard
/login                LoginComponent      guestGuard
/register             RegisterComponent   guestGuard
/checkout             CheckoutComponent   authGuard
/order-success/:id    OrderSuccessComponent authGuard
/account              AccountComponent    authGuard
/orders               OrdersComponent     authGuard
/wishlist             WishlistComponent   authGuard
```

### Current API collections

JSON Server must be started from the `store` project database:

```bash
cd /Users/max/Desktop/Angluar/E-commerce/store
npx json-server --watch db.json --port 3000
```

Available endpoints:

```text
GET/POST     http://localhost:3000/users
GET          http://localhost:3000/products
GET          http://localhost:3000/products/:id
GET/POST     http://localhost:3000/orders
GET          http://localhost:3000/orders/:id
```

The `orders` collection exists in `db.json`. Starting JSON Server from the parent `E-commerce` folder can load the wrong or missing `db.json` and cause `/orders` to return 404.

## Project

- Application: `store`
- Framework: Angular 18 standalone components
- Language: TypeScript 5.5
- Styling: component CSS; Tailwind 3.4 is installed but its directives are currently commented out in `src/styles.css`
- Data source: JSON Server at `http://localhost:3000/products`
- Build command: `npm run build`
- Development command: `npm start`
- API command, if needed: `npx json-server db.json`
- Source root: `src`
- Static assets: `public`, served from the site root

## Folder Structure

```text
store/
├── .editorconfig
├── .gitignore
├── .vscode/
│   ├── extensions.json
│   ├── launch.json
│   └── tasks.json
├── README.md
├── angular.json
├── db.json
├── package.json
├── package-lock.json
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── public/
│   ├── favicon.ico
│   └── asset/
│       ├── home                         # current file has no extension
│       └── products/
│           ├── product1.png
│           ├── product2.png
│           ├── product3.png
│           ├── product4.png
│           └── product5.png
└── src/
    ├── index.html
    ├── main.ts
    ├── styles.css
    └── app/
        ├── app.component.css
        ├── app.component.html
        ├── app.component.spec.ts
        ├── app.component.ts
        ├── app.config.ts
        ├── app.routes.ts
        ├── core/
        │   ├── models/
        │   │   └── product.model.ts
        │   └── service/
        │       └── product.service.ts
        ├── features/
        │   ├── cart/
        │   │   ├── cart.component.css
        │   │   ├── cart.component.html
        │   │   ├── cart.component.spec.ts
        │   │   └── cart.component.ts
        │   ├── home/
        │   │   ├── home.component.css
        │   │   ├── home.component.html
        │   │   ├── home.component.spec.ts
        │   │   └── home.component.ts
        │   ├── login/
        │   │   ├── login.component.css
        │   │   ├── login.component.html
        │   │   ├── login.component.spec.ts
        │   │   └── login.component.ts
        │   ├── product-details/
        │   │   ├── product-details.component.css
        │   │   ├── product-details.component.html
        │   │   ├── product-details.component.spec.ts
        │   │   └── product-details.component.ts
        │   ├── products/
        │   │   ├── products.component.css
        │   │   ├── products.component.html
        │   │   ├── products.component.spec.ts
        │   │   └── products.component.ts
        │   └── register/
        │       ├── register.component.css
        │       ├── register.component.html
        │       ├── register.component.spec.ts
        │       └── register.component.ts
        └── shared/
            ├── footer/
            │   ├── footer.component.css
            │   ├── footer.component.html
            │   ├── footer.component.spec.ts
            │   └── footer.component.ts
            └── navbar/
                ├── navbar.component.css
                ├── navbar.component.html
                ├── navbar.component.spec.ts
                └── navbar.component.ts
```

Generated folders intentionally omitted: `node_modules`, `.angular`, and `dist`.

## Application Bootstrap

### `src/main.ts`

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

### `src/app/app.config.ts`

```ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

### `src/app/app.routes.ts`

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [];
```

Routing is implemented for cart, product details, auth, checkout, order success, account, orders, and wishlist. The root component keeps the storefront shell and uses a router outlet for protected/auth routes.

### `src/app/app.component.ts`

```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './shared/footer/footer.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { ProductsComponent } from './features/products/products.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, RouterOutlet, FooterComponent, NavbarComponent, ProductsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'store';
}
```

### `src/app/app.component.html`

```html
<app-navbar></app-navbar>
<app-products></app-products>
<app-footer></app-footer>
```

## Product Data Layer

### `src/app/core/models/product.model.ts`

```ts
export interface Products {
  id: number;
  name: string;
  brand: string;
  price: number;
  image: string;
  description: string;
  category: string;
  tag: string;
  sku: string;
  weight: string;
  colorway: string;
  spec: string;
  theme: 'lime' | 'blue' | 'peach' | 'dark' | 'purple';
}
```

### `src/app/core/service/product.service.ts`

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Products } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/products';

  getProducts(): Observable<Products[]> {
    return this.http.get<Products[]>(this.apiUrl);
  }
}
```

### `db.json`

The database contains five products. Each product has this shape:

```json
{
  "id": 1,
  "name": "RAW-01 RUNNER",
  "brand": "SOLE//RAW",
  "price": 8999,
  "image": "/asset/products/product1.png",
  "description": "Lightweight performance runner with a lattice sole chassis.",
  "category": "Running",
  "tag": "FLAGSHIP DROP",
  "sku": "RAW-2026-01",
  "weight": "480G",
  "colorway": "BLACK / ACID GREEN",
  "spec": "LATTICE SOLE CHASSIS",
  "theme": "lime"
}
```

The other products use `product2.png` through `product5.png` and themes `blue`, `peach`, `dark`, and `purple`.

## Products Feature

### `src/app/features/products/products.component.ts`

```ts
import { ProductService } from '../../core/service/product.service';
import { Products } from '../../core/models/product.model';
import { CartComponent } from '../cart/cart.component';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CartComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  products: Products[] = [];

  constructor(private productservice: ProductService) {}

  ngOnInit(): void {
    this.productservice.getProducts().subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (error) => {
        console.log('error loading products', error);
      }
    });
  }
}
```

### `src/app/features/products/products.component.html`

```html
<section class="sr-drops">
  <div class="sr-drops-inner">
    <div class="sr-drops-header">
      <div class="sr-drops-title-row">
        <h2 class="sr-drops-title">NEW DROPS</h2>
        <span class="sr-tag-available">[AVAILABLE NOW]</span>
      </div>

      <div class="sr-sort-row">
        <span class="sr-sort-label">SORT:</span>
        <button class="sr-sort-btn sr-sort-btn--active">LATEST DEPLOYMENT</button>
        <button class="sr-sort-btn">SPEC WEIGHT</button>
      </div>
    </div>

    <div class="sr-grid">
      @for (product of products; track product.id) {
        <app-product-details [product]="product"></app-product-details>
      }
    </div>
  </div>
</section>
```

### Product feature styling

`products.component.css` defines the responsive `NEW DROPS` section, product grid, card image area, labels, prices, buttons, and color themes. Important current rules:

```css
.sr-drops {
  width: 100%;
  max-width: 100%;
  background-color: #faf7f2;
  padding: clamp(32px, 6vw, 48px) clamp(16px, 5vw, 24px) clamp(48px, 8vw, 80px);
  overflow: hidden;
}

.sr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: clamp(16px, 3vw, 24px);
}

.sr-card-image-wrap {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.sr-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

## Shared Navbar

### `src/app/shared/navbar/navbar.component.ts`

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {}
```

The navbar HTML contains:

- Animated ticker: `RAW ENGINEERING [EST. 2026]`
- SOLE//RAW brand and `[ARCHIVE_SYS]` badge
- Navigation links: NEW, MEN, WOMEN, SNEAKERS, COLLECTIONS
- Search, account, bag, and avatar buttons

`navbar.component.css` uses a sticky header, a lime scrolling ticker, responsive desktop navigation, and mobile-hidden search/account controls.

## Shared Footer

### `src/app/shared/footer/footer.component.ts`

```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  email = '';

  onSignUp(): void {
    if (!this.email.trim()) {
      return;
    }

    this.email = '';
  }
}
```

The footer HTML contains a newsletter form bound with `[(ngModel)]="email"` and `(ngSubmit)="onSignUp()"`, followed by Shop, About, Social, brand, legal, and `Move Different.` sections.

`footer.component.css` uses responsive `clamp()` sizing, a two-column mobile layout, a four-column tablet layout, and a full-width black footer. It also prevents horizontal overflow with `:host`, `max-width`, and `overflow: hidden`.

## Feature Status

- `features/home`: component exists but is not the primary storefront route.
- `features/products`: loads products from JSON Server and renders the existing `ProductDetailsComponent` as the card.
- `features/product-details`: existing product card with Quick Add and wishlist behavior; do not rename it.
- `features/product-view`: full protected `/product/:id` page loaded through `ProductService.getProductById()`.
- `features/cart`: live NgRx-backed cart with quantity controls and checkout navigation.
- `features/checkout`: reactive checkout form and order POST flow.
- `features/order-success`: loads and displays the saved order from `/orders/:id`.
- `features/login` and `features/register`: JSON Server-backed authentication forms.
- `features/account`, `features/orders`, and `features/wishlist`: protected user pages.
- `shared/notification`: global auto-dismissing toast notification.

## Global HTML and CSS

### `src/index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Store</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

### `src/styles.css`

```css
html,
body {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  margin: 0;
  overflow-x: hidden;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

img,
svg {
  max-width: 100%;
}

button,
input {
  font: inherit;
}
```

Tailwind directives are currently commented out in the live file. The project still has Tailwind 3.4, PostCSS, and Autoprefixer installed, with this configuration:

```js
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: { extend: {} },
  plugins: []
};
```

## Package and Build Configuration

The important `package.json` scripts are:

```json
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  }
}
```

Angular serves every file under `public` from `/`. Therefore product image URLs must look like `/asset/products/product1.png`, not `/store/public/asset/products/product1.png`.

The production component stylesheet budget is currently:

```json
{
  "type": "anyComponentStyle",
  "maximumWarning": "6kB",
  "maximumError": "8kB"
}
```

## Current Known Issues / Next Work

1. The root layout is hybrid: the cart is conditionally rendered with `isCartRoute()`, while other protected pages use `<router-outlet>`.
2. `ProductDetailsComponent` is the existing product card despite its name; `ProductViewComponent` is the actual full product page.
3. `db.json` contains duplicate product IDs. Clean IDs are important because product templates track by `product.id`.
4. JSON Server must be started from the `store` database path. A server started from the parent folder can expose the wrong collections and make `/orders` return 404.
5. Tailwind is installed, but the live global Tailwind directives are commented out; the application mainly uses plain component CSS.
6. Cart and wishlist persistence use subscriptions inside root services. This works, but an NgRx effect or meta-reducer would be a cleaner future persistence boundary.
7. Some generated tests only check component creation; reducer, selector, checkout, auth, and persistence behavior need focused tests.
8. Online payment is currently a demo option and does not integrate with a payment provider.
