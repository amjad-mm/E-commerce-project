import { AsyncPipe, CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap } from 'rxjs';
import { OrderService } from '../../core/service/order.service';
import { OrderState } from '../../core/store/order.reducer';
import { selectOrders } from '../../core/store/order.selectors';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe, UpperCasePipe, RouterLink],
  template: `
    <main class="sr-order-details">
      <div class="sr-order-details__inner">
        <!-- Topbar -->
        <div class="sr-order-details__topbar">
          <a routerLink="/orders" class="sr-order-details__back">← RETURN TO ALL ORDERS</a>
          <span class="sr-order-details__badge">[AUTHENTICATED DISPATCH RECORD]</span>
        </div>

        @if (order$ | async; as order) {
          <header class="sr-order-details__header">
            <div>
              <div class="sr-order-eyebrow">
                <span class="sr-order-tag">[DISPATCH MANIFEST]</span>
                <span>ORDER ID // {{ order.id }}</span>
              </div>
              <h1>ORDER <em>DETAILS</em></h1>
              <p class="sr-order-meta">
                AUTHORIZED ON: {{ order.createdAt | date:'fullDate' }} AT {{ order.createdAt | date:'shortTime' }}
              </p>
            </div>

            <div class="sr-status-box">
              <span class="sr-status-label">FULFILLMENT STATUS:</span>
              <span class="sr-status-pill sr-status-pill--{{ order.status }}">
                {{ order.status | uppercase }}
              </span>
            </div>
          </header>

          <div class="sr-order-details__grid">
            <!-- Left: Products Manifest -->
            <div class="sr-details-main">
              <section class="sr-panel">
                <div class="sr-panel__top">
                  <span>01 // ALLOCATED PRODUCTS ({{ order.items.length }})</span>
                  <b>VERIFIED</b>
                </div>

                <div class="sr-panel__body sr-p-0">
                  <div class="sr-items-table">
                    @for (item of order.items; track item.product.id) {
                      <div class="sr-item-row">
                        <img [src]="item.product.image" [alt]="item.product.name" class="sr-item-img" />
                        <div class="sr-item-details">
                          <span class="sr-item-brand">{{ item.product.brand || 'SOLE//RAW' }}</span>
                          <h3 class="sr-item-name">{{ item.product.name }}</h3>
                          <span class="sr-item-sku">SKU: {{ item.product.sku || 'RAW-SPEC-01' }}</span>
                        </div>
                        <div class="sr-item-pricing">
                          <span class="sr-item-unit">{{ item.product.price | currency:'INR':'symbol':'1.0-0' }} × {{ item.quantity }}</span>
                          <strong class="sr-item-subtotal">{{ item.product.price * item.quantity | currency:'INR':'symbol':'1.0-0' }}</strong>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </section>

              <!-- Delivery Coordinates & Payment Panel -->
              <div class="sr-info-panels-grid">
                <section class="sr-panel">
                  <div class="sr-panel__top">
                    <span>02 // DESTINATION COORDINATES</span>
                  </div>
                  <div class="sr-panel__body">
                    <strong class="sr-coord-name">{{ order.customerName }}</strong>
                    <p class="sr-coord-address">{{ order.deliveryAddress }}</p>
                    <p class="sr-coord-phone"><span class="sr-label-tag">CONTACT:</span> {{ order.phone }}</p>
                    <p class="sr-coord-email"><span class="sr-label-tag">RECIPIENT:</span> {{ order.userEmail }}</p>
                  </div>
                </section>

                <section class="sr-panel">
                  <div class="sr-panel__top">
                    <span>03 // PAYMENT PROTOCOL</span>
                  </div>
                  <div class="sr-panel__body">
                    <div class="sr-payment-badge">
                      <span class="sr-dot"></span>
                      {{ order.paymentMethod === 'cash-on-delivery' ? 'CASH ON DELIVERY (COD)' : 'ONLINE AUTHORIZATION (DEMO)' }}
                    </div>
                    <p class="sr-payment-note">
                      Fulfillment handled by RAW_EXPRESS. 256-bit encrypted transaction receipt.
                    </p>
                  </div>
                </section>
              </div>
            </div>

            <!-- Right: Price Breakdown Sidebar -->
            <aside class="sr-details-sidebar">
              <section class="sr-panel">
                <div class="sr-panel__top">
                  <span>FINANCIAL RECAPITULATION</span>
                </div>
                <div class="sr-panel__body">
                  <div class="sr-breakdown-rows">
                    <div class="sr-breakdown-row">
                      <span>ITEMS SUBTOTAL</span>
                      <b>{{ order.total | currency:'INR':'symbol':'1.0-0' }}</b>
                    </div>
                    <div class="sr-breakdown-row">
                      <span>EXPRESS COURIER</span>
                      <b class="sr-lime-bold">COMPLIMENTARY</b>
                    </div>
                    <div class="sr-breakdown-row">
                      <span>GST / TAXES</span>
                      <b>INCLUDED (0%)</b>
                    </div>
                  </div>

                  <div class="sr-total-box">
                    <span>TOTAL VALUATION</span>
                    <strong>{{ order.total | currency:'INR':'symbol':'1.0-0' }}</strong>
                  </div>

                  <div class="sr-sidebar-actions">
                    <a routerLink="/orders" class="sr-btn sr-btn--dark sr-w-full">
                      ← RETURN TO MY ORDERS
                    </a>
                    <a routerLink="/" class="sr-btn sr-btn--lime sr-w-full sr-mt-2">
                      CONTINUE SHOPPING
                    </a>
                  </div>
                </div>
              </section>

              <!-- Security Verification Card -->
              <div class="sr-security-card">
                <div class="sr-security-title">
                  <span class="sr-lock-icon">🔒</span>
                  VAULT GUARANTEE
                </div>
                <p>Authenticity verified by SOLE//RAW. 14-day archival exchange window active from dispatch date.</p>
              </div>
            </aside>
          </div>
        } @else {
          <div class="sr-not-found-box">
            <h2>ORDER NOT FOUND</h2>
            <p>The requested order reference could not be located in our active telemetry records.</p>
            <a routerLink="/orders" class="sr-btn sr-btn--primary sr-mt-4">
              ← VIEW ALL MY ORDERS
            </a>
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .sr-order-details {
      min-height: 75vh;
      background: #faf7f2;
      color: #111;
      padding: 36px 24px 96px;
      font-family: Arial, 'Helvetica Neue', sans-serif;
    }
    .sr-order-details__inner { max-width: 1300px; margin: 0 auto; }
    .sr-order-details__topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .sr-order-details__back {
      font: 800 11px 'Courier New', monospace;
      letter-spacing: .06em;
      color: #111;
      text-decoration: none;
      border-bottom: 1px solid #111;
      padding-bottom: 2px;
    }
    .sr-order-details__badge { font: 700 11px 'Courier New', monospace; color: #8a8a85; }

    /* Header */
    .sr-order-details__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 36px;
      padding-bottom: 24px;
      border-bottom: 2px solid #111;
    }
    .sr-order-eyebrow {
      font: 800 12px 'Courier New', monospace;
      letter-spacing: .08em;
      color: #111;
      margin-bottom: 8px;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .sr-order-tag { background: #111; color: #fff; padding: 3px 6px; }
    h1 {
      margin: 0;
      font-size: clamp(38px, 6vw, 68px);
      line-height: .9;
      letter-spacing: -.05em;
      text-transform: uppercase;
      font-weight: 900;
    }
    h1 em { color: #8a8a85; font-style: normal; }
    .sr-order-meta { margin: 12px 0 0; font: 700 11px 'Courier New', monospace; color: #666; }

    /* Status Pill */
    .sr-status-box { display: grid; gap: 6px; }
    .sr-status-label { font: 800 10px 'Courier New', monospace; color: #777; }
    .sr-status-pill {
      font: 800 12px 'Courier New', monospace;
      padding: 6px 14px;
      border: 1px solid #111;
      letter-spacing: .05em;
      text-align: center;
    }
    .sr-status-pill--placed, .sr-status-pill--confirmed { background: #d9f13d; color: #111; }
    .sr-status-pill--processing, .sr-status-pill--shipped { background: #111; color: #fff; }
    .sr-status-pill--delivered { background: #557d00; color: #fff; border-color: #557d00; }
    .sr-status-pill--cancelled { background: #c2392a; color: #fff; border-color: #c2392a; }

    /* Layout Grid */
    .sr-order-details__grid {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.8fr);
      gap: 32px;
      align-items: start;
    }
    .sr-details-main, .sr-details-sidebar { display: grid; gap: 24px; }

    /* Panels */
    .sr-panel {
      background: #fff;
      border: 1px solid #111;
      box-shadow: 6px 6px 0 rgba(17,17,17,.9);
    }
    .sr-panel__top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      border-bottom: 1px solid #111;
      font: 800 11px 'Courier New', monospace;
      letter-spacing: .06em;
      background: #faf7f2;
    }
    .sr-panel__top b { color: #557d00; }
    .sr-panel__body { padding: 22px; }
    .sr-p-0 { padding: 0 !important; }

    /* Items Table */
    .sr-items-table { display: grid; }
    .sr-item-row {
      display: grid;
      grid-template-columns: 72px 1fr auto;
      gap: 16px;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e0ded6;
    }
    .sr-item-row:last-child { border-bottom: none; }
    .sr-item-img {
      width: 72px;
      height: 72px;
      object-fit: cover;
      background: #ece6da;
      border: 1px solid #111;
    }
    .sr-item-details { display: grid; gap: 3px; }
    .sr-item-brand { font: 700 10px 'Courier New', monospace; color: #888; }
    .sr-item-name { margin: 0; font-size: 15px; font-weight: 800; text-transform: uppercase; }
    .sr-item-sku { font: 700 10px 'Courier New', monospace; color: #666; }
    .sr-item-pricing { display: grid; justify-items: end; gap: 4px; }
    .sr-item-unit { font: 700 11px 'Courier New', monospace; color: #777; }
    .sr-item-subtotal { font-size: 15px; font-weight: 800; color: #111; }

    /* Info panels grid */
    .sr-info-panels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
    }
    .sr-coord-name { font-size: 15px; text-transform: uppercase; display: block; margin-bottom: 6px; }
    .sr-coord-address { font-size: 13px; color: #444; line-height: 1.4; margin: 0 0 10px; }
    .sr-coord-phone, .sr-coord-email { font-size: 12px; margin: 4px 0; font-family: 'Courier New', monospace; }
    .sr-label-tag { font-weight: 800; color: #777; }

    .sr-payment-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #111;
      color: #fff;
      font: 800 11px 'Courier New', monospace;
    }
    .sr-dot { width: 8px; height: 8px; background: #d9f13d; border-radius: 50%; }
    .sr-payment-note { font-size: 12px; color: #666; margin: 12px 0 0; line-height: 1.4; }

    /* Breakdown & total */
    .sr-breakdown-rows { display: grid; gap: 12px; margin-bottom: 20px; }
    .sr-breakdown-row {
      display: flex;
      justify-content: space-between;
      font: 700 11px 'Courier New', monospace;
      color: #555;
    }
    .sr-lime-bold { color: #557d00; }
    .sr-total-box {
      padding: 16px;
      background: #111;
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font: 800 12px 'Courier New', monospace;
      margin-bottom: 20px;
    }
    .sr-total-box strong { font-size: 24px; color: #d9f13d; font-family: Arial, sans-serif; font-weight: 900; }

    /* Security card */
    .sr-security-card {
      background: #111;
      color: #fff;
      padding: 18px 20px;
      border: 1px solid #111;
      font-family: 'Courier New', monospace;
    }
    .sr-security-title { font-weight: 800; font-size: 12px; margin-bottom: 8px; color: #d9f13d; display: flex; align-items: center; gap: 6px; }
    .sr-security-card p { font-size: 11px; line-height: 1.5; color: #aaa; margin: 0; }

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
    }
    .sr-btn--primary { background: #111; color: #fff; }
    .sr-btn--dark { background: #111; color: #fff; }
    .sr-btn--dark:hover { background: #262626; color: #d9f13d; }
    .sr-btn--lime { background: #d9f13d; color: #111; }
    .sr-btn--lime:hover { background: #111; color: #fff; }
    .sr-w-full { width: 100%; }
    .sr-mt-2 { margin-top: 8px; }
    .sr-mt-4 { margin-top: 16px; }

    .sr-not-found-box { text-align: center; padding: 64px 24px; }

    @media (max-width: 900px) {
      .sr-order-details__grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .sr-order-details { padding: 24px 16px 64px; }
      .sr-order-details__header { flex-direction: column; align-items: flex-start; }
      .sr-item-row { grid-template-columns: 56px 1fr; }
      .sr-item-pricing { grid-column: 2; justify-items: start; }
    }
  `]
})
export class OrderDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly store = inject(Store<{ orders: OrderState }>);

  readonly order$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const orderId = params.get('id');
      if (!orderId) return of(null);

      return this.orderService.getOrderById(orderId).pipe(
        catchError(() => {
          // Fallback to NgRx store orders
          return this.store.select(selectOrders).pipe(
            map((orders) => orders.find((o) => o.id === orderId) || null)
          );
        })
      );
    })
  );
}

