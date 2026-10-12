import { AsyncPipe, CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, take } from 'rxjs';
import { Order } from '../../core/models/order.model';
import { OrderService } from '../../core/service/order.service';
import { AuthState } from '../../core/store/auth.reducer';
import { selectCurrentUser } from '../../core/store/auth.selectors';
import { OrderState } from '../../core/store/order.reducer';
import { selectOrders } from '../../core/store/order.selectors';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe, UpperCasePipe, RouterLink],
  template: `
    <main class="sr-orders">
      <div class="sr-orders__inner">
        <!-- Breadcrumb / Header -->
        <div class="sr-orders__topbar">
          <a routerLink="/account" class="sr-orders__back">← DOSSIER / PROFILE</a>
          <span class="sr-orders__badge">[MANIFEST_ARCHIVE // 2026]</span>
        </div>

        <header class="sr-orders__header">
          <div>
            <p class="sr-orders__eyebrow">// TRANSACTION HISTORY</p>
            <h1>MY <em>ORDERS</em></h1>
            <p class="sr-orders__subtitle">Archived telemetry and fulfillment records for your account.</p>
          </div>
          <a routerLink="/" class="sr-btn sr-btn--lime">
            EXPLORE NEW DROPS →
          </a>
        </header>

        <!-- Orders Listing -->
        @if (isLoading) {
          <div class="sr-loading-state">
            <p>// RETRIEVING DISPATCH RECORDS FROM ARCHIVE...</p>
          </div>
        } @else if (orders.length === 0) {
          <div class="sr-empty-orders">
            <div class="sr-empty-box">
              <span class="sr-empty-code">[EMPTY_VAULT]</span>
              <h2>NO DISPATCHES FOUND</h2>
              <p>You have not authorized any orders yet. Explore our current experimental runs and limited drops.</p>
              <a routerLink="/" class="sr-btn sr-btn--primary sr-mt-4">
                BROWSE ARCHIVE STORE →
              </a>
            </div>
          </div>
        } @else {
          <div class="sr-orders-list">
            @for (order of orders; track order.id) {
              <article class="sr-order-card">
                <div class="sr-order-card__header">
                  <div class="sr-order-card__meta">
                    <span class="sr-order-id">{{ order.id }}</span>
                    <span class="sr-order-date">DISPATCH DATE: {{ order.createdAt | date:'dd MMM yyyy, hh:mm a' }}</span>
                  </div>

                  <div class="sr-order-card__status-wrap">
                    <span class="sr-status-pill sr-status-pill--{{ order.status }}">
                      {{ order.status | uppercase }}
                    </span>
                  </div>
                </div>

                <!-- Product thumbnails preview -->
                <div class="sr-order-card__body">
                  <div class="sr-thumbnails-grid">
                    @for (item of order.items; track item.product.id) {
                      <div class="sr-thumb-item">
                        <img [src]="item.product.image" [alt]="item.product.name" (error)="onImgError($event)" />
                        <div class="sr-thumb-info">
                          <strong class="sr-thumb-name">{{ item.product.name }}</strong>
                          <span class="sr-thumb-brand">{{ item.product.brand || 'SOLE//RAW' }}</span>
                          <span class="sr-thumb-qty">QTY: {{ item.quantity }} × {{ item.product.price | currency:'INR':'symbol':'1.0-0' }}</span>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Order summary box on right -->
                  <div class="sr-order-card__aside">
                    <div class="sr-card-row">
                      <span>TOTAL ITEMS:</span>
                      <strong>{{ order.items.length }}</strong>
                    </div>
                    <div class="sr-card-row">
                      <span>PAYMENT PROTOCOL:</span>
                      <b>{{ order.paymentMethod === 'cash-on-delivery' ? 'COD' : 'ONLINE' }}</b>
                    </div>
                    <div class="sr-card-row sr-card-row--total">
                      <span>VALUATION:</span>
                      <strong>{{ order.total | currency:'INR':'symbol':'1.0-0' }}</strong>
                    </div>

                    <a [routerLink]="['/orders', order.id]" class="sr-btn sr-btn--dark sr-w-full sr-mt-2">
                      VIEW FULL DETAILS →
                    </a>
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .sr-orders {
      min-height: 75vh;
      background: #faf7f2;
      color: #111;
      padding: 36px 24px 96px;
      font-family: Arial, 'Helvetica Neue', sans-serif;
    }
    .sr-orders__inner { max-width: 1300px; margin: 0 auto; }
    .sr-orders__topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .sr-orders__back {
      font: 800 11px 'Courier New', monospace;
      letter-spacing: .06em;
      color: #111;
      text-decoration: none;
      border-bottom: 1px solid #111;
      padding-bottom: 2px;
    }
    .sr-orders__badge {
      font: 700 11px 'Courier New', monospace;
      color: #8a8a85;
      letter-spacing: .05em;
    }
    .sr-orders__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 36px;
      padding-bottom: 24px;
      border-bottom: 2px solid #111;
    }
    .sr-orders__eyebrow {
      font: 800 12px 'Courier New', monospace;
      color: #c2392a;
      letter-spacing: .08em;
      margin: 0 0 8px;
    }
    h1 {
      margin: 0;
      font-size: clamp(38px, 6vw, 68px);
      line-height: .9;
      letter-spacing: -.05em;
      text-transform: uppercase;
      font-weight: 900;
    }
    h1 em { color: #8a8a85; font-style: normal; }
    .sr-orders__subtitle {
      margin: 12px 0 0;
      font-size: 15px;
      color: #555;
    }

    /* Buttons */
    .sr-btn {
      padding: 12px 20px;
      font: 800 11px 'Courier New', monospace;
      letter-spacing: .06em;
      text-transform: uppercase;
      cursor: pointer;
      border: 1px solid #111;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all .15s ease;
    }
    .sr-btn--primary { background: #111; color: #fff; border-bottom: 3px solid #d9f13d; }
    .sr-btn--primary:hover { background: #262626; }
    .sr-btn--lime { background: #d9f13d; color: #111; }
    .sr-btn--lime:hover { background: #111; color: #fff; }
    .sr-btn--dark { background: #111; color: #fff; }
    .sr-btn--dark:hover { background: #262626; color: #d9f13d; }
    .sr-w-full { width: 100%; }
    .sr-mt-2 { margin-top: 8px; }
    .sr-mt-4 { margin-top: 16px; }

    /* Orders List */
    .sr-orders-list { display: grid; gap: 24px; }
    .sr-order-card {
      background: #fff;
      border: 1px solid #111;
      box-shadow: 6px 6px 0 rgba(17,17,17,.9);
    }
    .sr-order-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      background: #faf7f2;
      border-bottom: 1px solid #111;
      flex-wrap: wrap;
      gap: 12px;
    }
    .sr-order-card__meta {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .sr-order-id { font: 900 13px 'Courier New', monospace; color: #111; }
    .sr-order-date { font: 700 11px 'Courier New', monospace; color: #666; }

    /* Status Pills */
    .sr-status-pill {
      font: 800 10px 'Courier New', monospace;
      padding: 4px 10px;
      border: 1px solid #111;
      letter-spacing: .05em;
    }
    .sr-status-pill--placed, .sr-status-pill--confirmed { background: #d9f13d; color: #111; }
    .sr-status-pill--processing, .sr-status-pill--shipped { background: #111; color: #fff; }
    .sr-status-pill--delivered { background: #557d00; color: #fff; border-color: #557d00; }
    .sr-status-pill--cancelled { background: #c2392a; color: #fff; border-color: #c2392a; }

    /* Card Body */
    .sr-order-card__body {
      padding: 20px;
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(240px, 0.7fr);
      gap: 24px;
      align-items: center;
    }
    .sr-thumbnails-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
    }
    .sr-thumb-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: #faf7f2;
      border: 1px solid #e0ded6;
    }
    .sr-thumb-item img {
      width: 56px;
      height: 56px;
      object-fit: cover;
      background: #ebe6dc;
      border: 1px solid #111;
      flex-shrink: 0;
    }
    .sr-thumb-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }
    .sr-thumb-name {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sr-thumb-brand { font: 700 9px 'Courier New', monospace; color: #888; }
    .sr-thumb-qty { font: 700 10px 'Courier New', monospace; color: #444; }

    /* Aside summary */
    .sr-order-card__aside {
      padding: 16px;
      background: #faf7f2;
      border: 1px solid #111;
      display: grid;
      gap: 8px;
    }
    .sr-card-row {
      display: flex;
      justify-content: space-between;
      font: 700 11px 'Courier New', monospace;
      color: #555;
    }
    .sr-card-row--total {
      padding-top: 8px;
      border-top: 1px solid #111;
      color: #111;
      font-size: 12px;
    }
    .sr-card-row--total strong { font-size: 16px; color: #111; }

    /* Empty state */
    .sr-empty-orders {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }
    .sr-empty-box {
      max-width: 560px;
      text-align: center;
      background: #fff;
      border: 1px solid #111;
      padding: 48px 32px;
      box-shadow: 6px 6px 0 rgba(17,17,17,.9);
    }
    .sr-empty-code { font: 800 11px 'Courier New', monospace; color: #c2392a; }
    .sr-empty-box h2 { margin: 12px 0 8px; font-size: 24px; font-weight: 900; }
    .sr-empty-box p { font-size: 14px; color: #555; line-height: 1.5; margin: 0; }
    .sr-loading-state { text-align: center; padding: 48px 0; font: 800 12px 'Courier New', monospace; }

    @media (max-width: 860px) {
      .sr-order-card__body { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .sr-orders { padding: 24px 16px 64px; }
      .sr-orders__header { flex-direction: column; align-items: flex-start; }
      .sr-order-card__header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class OrdersComponent implements OnInit {
  private readonly store = inject(Store<{ auth: AuthState; orders: OrderState }>);
  private readonly orderService = inject(OrderService);

  readonly currentUser$ = this.store.select(selectCurrentUser);
  readonly storeOrders$ = this.store.select(selectOrders);

  orders: Order[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.currentUser$.pipe(take(1)).subscribe((currentUser) => {
      if (currentUser) {
        this.fetchOrders(currentUser.email);
      } else {
        this.isLoading = false;
      }
    });
  }

  fetchOrders(userEmail: string): void {
    this.isLoading = true;
    combineLatest([
      this.orderService.getOrdersByUser(userEmail),
      this.storeOrders$
    ]).pipe(take(1)).subscribe({
      next: ([apiOrders, storeOrders]) => {
        const storeUserOrders = (storeOrders || []).filter((o) => o.userEmail === userEmail);
        const map = new Map<string, Order>();
        [...storeUserOrders, ...(apiOrders || [])].forEach((ord) => map.set(ord.id, ord));
        this.orders = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.isLoading = false;
      },
      error: () => {
        this.storeOrders$.pipe(take(1)).subscribe((storeOrders) => {
          this.orders = (storeOrders || []).filter((o) => o.userEmail === userEmail);
          this.isLoading = false;
        });
      }
    });
  }

  onImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/asset/products/product1.png';
    }
  }
}
