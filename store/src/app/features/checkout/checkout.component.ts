import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, take } from 'rxjs';
import { Address } from '../../core/models/address.model';
import { CartItem } from '../../core/models/cart.model';
import { Order } from '../../core/models/order.model';
import { AddressService } from '../../core/service/address.service';
import { CartService } from '../../core/service/cart.service';
import { NotificationService } from '../../core/service/notification.service';
import { OrderService } from '../../core/service/order.service';
import { AuthState } from '../../core/store/auth.reducer';
import { selectCurrentUser } from '../../core/store/auth.selectors';
import { CartState } from '../../core/store/cart.reducer';
import { selectCartItems, selectCartSubtotal } from '../../core/store/cart.selectors';
import { placeOrder } from '../../core/store/order.actions';
import { OrderState } from '../../core/store/order.reducer';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, ReactiveFormsModule, RouterLink],
  template: `
    <main class="sr-checkout">
      <div class="sr-checkout__inner">
        <a class="sr-checkout__back" routerLink="/cart">← RETURN TO BAG</a>

        <header class="sr-checkout__header">
          <div>
            <div class="sr-checkout__eyebrow"><span>[SECURE DISPATCH]</span> // STEP 02 OF 02</div>
            <h1>AUTHORIZE<br /><em>ORDER</em></h1>
            <p>Select delivery coordinates and confirm allocation release.</p>
          </div>
          <div class="sr-checkout__secure">
            <span class="sr-checkout__lock">⌑</span>
            <div><b>ENCRYPTED CHECKOUT</b><small>256-BIT SECURE SYSTEM</small></div>
          </div>
        </header>

        <div class="sr-checkout__grid">
          <form class="sr-form" [formGroup]="checkoutForm" (ngSubmit)="submit()" novalidate>
            <!-- SECTION 01: Recipient Profile -->
            <section class="sr-panel">
              <div class="sr-panel__top">
                <span>01 // RECIPIENT PROFILE</span>
                <b>REQUIRED</b>
              </div>
              <div class="sr-panel__body sr-fields">
                <label>
                  <span>FULL NAME</span>
                  <input formControlName="customerName" autocomplete="name" placeholder="ENTER FULL NAME" />
                  @if (checkoutForm.controls.customerName.invalid && checkoutForm.controls.customerName.touched) {
                    <small>FULL NAME IS REQUIRED.</small>
                  }
                </label>
                <label>
                  <span>PHONE NUMBER</span>
                  <input formControlName="phone" type="tel" autocomplete="tel" placeholder="ENTER PHONE NUMBER" />
                  @if (checkoutForm.controls.phone.invalid && checkoutForm.controls.phone.touched) {
                    <small>ENTER A VALID PHONE NUMBER.</small>
                  }
                </label>
              </div>
            </section>

            <!-- SECTION 02: Delivery Coordinates (Saved vs Custom Address) -->
            <section class="sr-panel">
              <div class="sr-panel__top">
                <span>02 // DELIVERY COORDINATES</span>
                <span class="sr-top-tag">{{ selectedSavedAddress && !isEnteringManualAddress ? 'SAVED PROFILE' : 'MANUAL ENTRY' }}</span>
              </div>

              <div class="sr-panel__body">
                <!-- Case A: Saved Address Selected -->
                @if (selectedSavedAddress && !isEnteringManualAddress && !isChangingAddress) {
                  <div class="sr-saved-selected-box">
                    <div class="sr-saved-selected__header">
                      <span class="sr-type-badge">{{ selectedSavedAddress.type === 'home' ? '⌂ HOME' : '🏢 OFFICE' }}</span>
                      @if (selectedSavedAddress.isDefault) {
                        <span class="sr-default-tag">★ DEFAULT ADDRESS</span>
                      }
                    </div>

                    <div class="sr-saved-selected__body">
                      <strong>{{ selectedSavedAddress.fullName }}</strong>
                      <p>
                        {{ selectedSavedAddress.addressLine1 }}
                        @if (selectedSavedAddress.addressLine2) { , {{ selectedSavedAddress.addressLine2 }} }
                        @if (selectedSavedAddress.landmark) { <br /><em>Landmark: {{ selectedSavedAddress.landmark }}</em> }
                      </p>
                      <p class="sr-saved-locality">
                        {{ selectedSavedAddress.city }}, {{ selectedSavedAddress.state }} - <b>{{ selectedSavedAddress.pincode }}</b>
                      </p>
                      <p class="sr-saved-phone">Phone: {{ selectedSavedAddress.phone }}</p>
                    </div>

                    <div class="sr-saved-selected__actions">
                      @if (savedAddresses.length > 1) {
                        <button type="button" class="sr-btn sr-btn--sm sr-btn--dark" (click)="openChangeAddress()">
                          CHANGE ADDRESS ({{ savedAddresses.length }})
                        </button>
                      }
                      <button type="button" class="sr-btn sr-btn--sm sr-btn--secondary" (click)="switchToManualAddress()">
                        + ENTER NEW ADDRESS
                      </button>
                    </div>
                  </div>
                }

                <!-- Case B: Address Picker List -->
                @if (isChangingAddress) {
                  <div class="sr-picker-box">
                    <div class="sr-picker-header">
                      <p class="sr-picker-title">SELECT A SAVED DELIVERY ADDRESS:</p>
                      <button type="button" class="sr-close-picker" (click)="isChangingAddress = false">✕ CANCEL</button>
                    </div>

                    <div class="sr-picker-grid">
                      @for (addr of savedAddresses; track addr.id) {
                        <div class="sr-picker-card" [class.sr-picker-card--active]="selectedSavedAddress?.id === addr.id">
                          <div class="sr-picker-card__top">
                            <span class="sr-type-badge">{{ addr.type === 'home' ? '⌂ HOME' : '🏢 OFFICE' }}</span>
                            @if (addr.isDefault) { <span class="sr-default-tag">★ DEFAULT</span> }
                          </div>
                          <strong>{{ addr.fullName }}</strong>
                          <p class="sr-picker-text">{{ addr.addressLine1 }}, {{ addr.city }}, {{ addr.state }} - {{ addr.pincode }}</p>
                          <small>Phone: {{ addr.phone }}</small>
                          <button type="button" class="sr-btn sr-btn--lime sr-mt-2" (click)="chooseSavedAddress(addr)">
                            USE THIS ADDRESS
                          </button>
                        </div>
                      }
                    </div>

                    <div class="sr-picker-footer">
                      <button type="button" class="sr-btn sr-btn--secondary" (click)="switchToManualAddress()">
                        + ENTER DIFFERENT ADDRESS
                      </button>
                    </div>
                  </div>
                }

                <!-- Case C: Manual Address Entry Form -->
                @if (isEnteringManualAddress || (!selectedSavedAddress && !isLoadingAddresses)) {
                  <div class="sr-fields">
                    @if (savedAddresses.length > 0) {
                      <div class="sr-back-saved-row">
                        <button type="button" class="sr-link-btn" (click)="cancelManualAddress()">
                          ← CHOOSE FROM SAVED ADDRESSES ({{ savedAddresses.length }})
                        </button>
                      </div>
                    }

                    <label class="sr-address-field">
                      <span>DELIVERY ADDRESS (FLAT, BUILDING, STREET) *</span>
                      <textarea formControlName="address" rows="3" autocomplete="street-address" placeholder="HOUSE / STREET / LOCALITY"></textarea>
                      @if (checkoutForm.controls.address.invalid && checkoutForm.controls.address.touched) {
                        <small>DELIVERY ADDRESS IS REQUIRED.</small>
                      }
                    </label>

                    <label>
                      <span>CITY *</span>
                      <input formControlName="city" autocomplete="address-level2" placeholder="ENTER CITY" />
                      @if (checkoutForm.controls.city.invalid && checkoutForm.controls.city.touched) {
                        <small>ENTER A VALID CITY.</small>
                      }
                    </label>

                    <label>
                      <span>STATE *</span>
                      <input formControlName="state" autocomplete="address-level1" placeholder="ENTER STATE" />
                      @if (checkoutForm.controls.state.invalid && checkoutForm.controls.state.touched) {
                        <small>ENTER A VALID STATE.</small>
                      }
                    </label>

                    <label>
                      <span>PINCODE *</span>
                      <input formControlName="pincode" inputmode="numeric" autocomplete="postal-code" placeholder="6-DIGIT PINCODE" />
                      @if (checkoutForm.controls.pincode.invalid && checkoutForm.controls.pincode.touched) {
                        <small>ENTER A VALID 6-DIGIT PINCODE.</small>
                      }
                    </label>

                    <label class="sr-save-address-label">
                      <input type="checkbox" formControlName="saveAddressForFuture" />
                      <span>SAVE THIS ADDRESS TO MY PROFILE FOR FUTURE DISPATCHES</span>
                    </label>

                    <div class="sr-delivery-note">
                      <span>✓</span> EXPRESS COURIER // TRACKING ISSUED AFTER DISPATCH
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- SECTION 03: Payment Protocol -->
            <section class="sr-panel">
              <div class="sr-panel__top">
                <span>03 // PAYMENT PROTOCOL</span>
                <b>VERIFIED</b>
              </div>
              <div class="sr-panel__body">
                <label class="sr-payment">
                  <span>SELECT METHOD</span>
                  <select formControlName="paymentMethod">
                    <option value="cash-on-delivery">CASH ON DELIVERY</option>
                    <option value="online-payment">ONLINE PAYMENT (DEMO)</option>
                  </select>
                </label>
                <p class="sr-payment__note">NO SURPRISE FEES // GST &amp; EXPRESS COURIER INCLUDED</p>
              </div>
            </section>

            @if (errorMessage) {
              <p class="sr-form__error">{{ errorMessage }}</p>
            }
          </form>

          <!-- Order Summary Sidebar -->
          <aside class="sr-order">
            <div class="sr-order__header">
              <h2>ORDER MANIFEST</h2>
              <span>LIVE</span>
            </div>

            @if (items$ | async; as items) {
              <div class="sr-order__items">
                @for (item of items; track item.product.id) {
                  <article class="sr-order-item">
                    <img [src]="item.product.image" [alt]="item.product.name" />
                    <div>
                      <h3>{{ item.product.name }}</h3>
                      <p>QTY: {{ item.quantity }} // ARCHIVE STOCK</p>
                    </div>
                    <strong>{{ item.product.price * item.quantity | currency:'INR':'symbol':'1.0-0' }}</strong>
                  </article>
                } @empty {
                  <p class="sr-order__empty">YOUR BAG IS EMPTY.</p>
                }
              </div>
            }

            <div class="sr-order__rows">
              <p><span>SUBTOTAL</span><b>{{ total | currency:'INR':'symbol':'1.0-0' }}</b></p>
              <p><span>EXPRESS COURIER</span><b class="sr-free">FREE</b></p>
            </div>

            <div class="sr-order__total">
              <span>FINAL VALUATION<br /><b>TOTAL</b></span>
              <strong>{{ total | currency:'INR':'symbol':'1.0-0' }}</strong>
            </div>

            <button type="submit" class="sr-submit" (click)="submit()" [disabled]="checkoutForm.invalid || isSubmitting">
              <span class="sr-submit__pulse-beacon" aria-hidden="true"></span>
              <span>{{ isSubmitting ? 'PLACING ORDER...' : 'AUTHORIZE ORDER →' }}</span>
            </button>
            <p class="sr-order__foot">⌑ AUTHENTICITY GUARANTEED &nbsp; // &nbsp; 14-DAY RETURNS</p>
          </aside>
        </div>
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .sr-checkout { min-height: 70vh; padding: 32px 24px 88px; background: #faf7f2; color: #111; font-family: Arial, 'Helvetica Neue', sans-serif; }
    .sr-checkout__inner { max-width: 1400px; margin: 0 auto; }
    .sr-checkout__back { display: inline-block; color: #111; font: 800 11px 'Courier New', monospace; letter-spacing: .05em; text-decoration: none; border-bottom: 1px solid #111; padding-bottom: 4px; }
    .sr-checkout__header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin: 30px 0 34px; }
    .sr-checkout__eyebrow { font: 700 11px 'Courier New', monospace; letter-spacing: .06em; color: #c2392a; margin-bottom: 12px; }
    .sr-checkout__eyebrow span { padding: 5px 9px; background: #111; color: #fff; margin-right: 8px; }
    h1 { margin: 0; font-size: clamp(44px, 7vw, 82px); line-height: .82; letter-spacing: -.065em; text-transform: uppercase; }
    h1 em { color: #c9c4b6; font-style: normal; }
    .sr-checkout__header p { margin: 16px 0 0; font-size: 15px; }
    .sr-checkout__secure { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #fff; border: 1px solid #111; font-family: 'Courier New', monospace; }
    .sr-checkout__lock { width: 26px; height: 26px; display: grid; place-items: center; background: #d9f13d; font-weight: 900; }
    .sr-checkout__secure b, .sr-checkout__secure small { display: block; font-size: 10px; letter-spacing: .04em; } .sr-checkout__secure small { margin-top: 3px; color: #777; }
    .sr-checkout__grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(300px, .8fr); align-items: start; gap: 28px; }
    .sr-form { display: grid; gap: 20px; }
    .sr-panel, .sr-order { background: #fff; border: 1px solid #111; box-shadow: 6px 6px 0 rgba(17,17,17,.9); }
    .sr-panel__top, .sr-order__header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid #111; font: 800 11px 'Courier New', monospace; letter-spacing: .05em; }
    .sr-panel__top b { color: #6d9200; } .sr-top-tag { font-size: 10px; color: #777; font-family: 'Courier New', monospace; }
    .sr-panel__body { padding: 22px; }
    .sr-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    .sr-address-field { grid-column: 1 / -1; }
    label, .sr-payment { display: grid; gap: 8px; font: 800 11px 'Courier New', monospace; letter-spacing: .04em; }
    input, textarea, select { width: 100%; border: 1px solid #bdbab3; border-radius: 0; padding: 13px; outline: none; color: #111; background: #fff; font: 700 13px Arial, sans-serif; }
    textarea { resize: vertical; min-height: 90px; } input:focus, textarea:focus, select:focus { border-color: #111; box-shadow: 3px 3px 0 #d9f13d; }
    input::placeholder, textarea::placeholder { color: #a19d94; font: 700 11px 'Courier New', monospace; } select { cursor: pointer; }
    small, .sr-form__error { color: #c2392a; font: 800 10px 'Courier New', monospace; letter-spacing: .03em; }
    .sr-form__error { margin: 0; padding: 12px; border: 1px solid #c2392a; background: #fff4f2; }
    .sr-delivery-note { grid-column: 1 / -1; padding: 10px 12px; background: #f0f6d3; color: #4e6800; font: 800 10px 'Courier New', monospace; letter-spacing: .04em; }
    .sr-delivery-note span { font-size: 14px; }
    .sr-payment__note { margin: 15px 0 0; color: #777; font: 700 10px 'Courier New', monospace; letter-spacing: .03em; }
    .sr-save-address-label { grid-column: 1 / -1; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font: 700 11px 'Courier New', monospace; }
    .sr-save-address-label input { width: 16px; height: 16px; accent-color: #111; }

    /* Saved Address Selected Box */
    .sr-saved-selected-box {
      background: #faf7f2;
      border: 1px solid #111;
      padding: 18px 20px;
      display: grid;
      gap: 12px;
    }
    .sr-saved-selected__header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sr-type-badge {
      padding: 3px 6px;
      background: #111;
      color: #fff;
      font: 800 10px 'Courier New', monospace;
    }
    .sr-default-tag {
      padding: 3px 6px;
      background: #d9f13d;
      color: #111;
      font: 800 9px 'Courier New', monospace;
    }
    .sr-saved-selected__body strong { font-size: 15px; text-transform: uppercase; }
    .sr-saved-selected__body p { margin: 4px 0; font-size: 13px; color: #444; }
    .sr-saved-locality { color: #111 !important; }
    .sr-saved-phone { font-family: 'Courier New', monospace; font-size: 12px; color: #666; }
    .sr-saved-selected__actions { display: flex; gap: 10px; margin-top: 4px; flex-wrap: wrap; }
    
    /* Buttons */
    .sr-btn {
      padding: 10px 16px;
      font: 800 11px 'Courier New', monospace;
      letter-spacing: .04em;
      cursor: pointer;
      border: 1px solid #111;
      text-decoration: none;
    }
    .sr-btn--sm { padding: 8px 12px; font-size: 10px; }
    .sr-btn--dark { background: #111; color: #fff; }
    .sr-btn--dark:hover { background: #262626; color: #d9f13d; }
    .sr-btn--secondary { background: #fff; color: #111; }
    .sr-btn--secondary:hover { background: #f0f0f0; }
    .sr-btn--lime { background: #d9f13d; color: #111; width: 100%; }
    .sr-btn--lime:hover { background: #111; color: #fff; }
    .sr-mt-2 { margin-top: 8px; }

    /* Picker */
    .sr-picker-box { display: grid; gap: 16px; }
    .sr-picker-header { display: flex; justify-content: space-between; align-items: center; }
    .sr-picker-title { margin: 0; font: 800 11px 'Courier New', monospace; color: #111; }
    .sr-close-picker { background: transparent; border: none; font: 800 11px 'Courier New', monospace; cursor: pointer; color: #c2392a; }
    .sr-picker-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
    .sr-picker-card {
      background: #faf7f2;
      border: 1px solid #111;
      padding: 14px;
      display: grid;
      gap: 6px;
    }
    .sr-picker-card--active { border: 2px solid #111; background: #fff; box-shadow: 3px 3px 0 #d9f13d; }
    .sr-picker-card__top { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .sr-picker-text { font-size: 12px; color: #444; margin: 0; line-height: 1.3; }
    .sr-picker-card small { color: #777; }
    .sr-back-saved-row { grid-column: 1 / -1; margin-bottom: -6px; }
    .sr-link-btn { background: transparent; border: none; font: 800 11px 'Courier New', monospace; color: #111; cursor: pointer; text-decoration: underline; padding: 0; }

    /* Order aside */
    .sr-order { position: sticky; top: 20px; }
    .sr-order__header h2 { margin: 0; font-size: 16px; letter-spacing: -.02em; }
    .sr-order__header span { padding: 4px 8px; background: #d9f13d; font: 800 10px 'Courier New', monospace; }
    .sr-order__items { padding: 4px 18px; max-height: 340px; overflow-y: auto; }
    .sr-order-item { display: grid; grid-template-columns: 56px 1fr auto; gap: 11px; align-items: center; padding: 14px 0; border-bottom: 1px solid #e5e2dc; }
    .sr-order-item img { width: 56px; height: 56px; object-fit: cover; background: #ece6da; }
    .sr-order-item h3 { margin: 0 0 5px; font-size: 13px; text-transform: uppercase; }
    .sr-order-item p, .sr-order__empty { margin: 0; color: #777; font: 700 9px 'Courier New', monospace; letter-spacing: .03em; }
    .sr-order-item strong { font-size: 13px; white-space: nowrap; }
    .sr-order__empty { padding: 22px 0; }
    .sr-order__rows { padding: 8px 18px; border-top: 1px solid #111; }
    .sr-order__rows p { display: flex; justify-content: space-between; margin: 11px 0; font: 700 11px 'Courier New', monospace; letter-spacing: .03em; }
    .sr-free { color: #6d9200; }
    .sr-order__total { display: flex; justify-content: space-between; align-items: end; padding: 17px 18px; background: #111; color: #fff; font: 700 10px 'Courier New', monospace; letter-spacing: .04em; }
    .sr-order__total b { display: block; margin-top: 3px; font-size: 15px; }
    .sr-submit {
      width: 100%;
      border: 0;
      border-top: 1px solid #111;
      padding: 18px 24px;
      background: #d9f13d;
      color: #111;
      cursor: pointer;
      font: 900 13px 'Courier New', monospace;
      letter-spacing: .06em;
      transition: all .2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      position: relative;
    }
    .sr-submit:not(:disabled) {
      animation: srBlinkModel 1.5s infinite ease-in-out;
    }
    .sr-submit:hover:not(:disabled) {
      background: #111;
      color: #d9f13d;
      animation: none;
      box-shadow: 0 0 20px rgba(217, 241, 61, 0.6);
    }
    .sr-submit:disabled {
      cursor: not-allowed;
      opacity: .45;
      animation: none;
    }
    .sr-submit__pulse-beacon {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #111;
      display: inline-block;
      animation: srBeaconBlink 1s infinite alternate ease-in-out;
    }
    .sr-submit:disabled .sr-submit__pulse-beacon {
      display: none;
    }
    @keyframes srBlinkModel {
      0%, 100% {
        background-color: #d9f13d;
        color: #111;
        box-shadow: 0 0 0 0 rgba(217, 241, 61, 0.7);
        transform: scale(1);
      }
      50% {
        background-color: #ffffff;
        color: #000;
        box-shadow: 0 0 22px 6px rgba(217, 241, 61, 0.85);
        transform: scale(1.015);
      }
    }
    @keyframes srBeaconBlink {
      0% {
        opacity: 1;
        transform: scale(1.2);
        box-shadow: 0 0 8px #111;
      }
      100% {
        opacity: 0.2;
        transform: scale(0.6);
        box-shadow: none;
      }
    }
    .sr-order__foot { margin: 0; padding: 13px 16px; text-align: center; color: #777; font: 700 9px 'Courier New', monospace; letter-spacing: .02em; }

    @media (max-width: 800px) {
      .sr-checkout { padding: 24px 16px 64px; }
      .sr-checkout__header { align-items: flex-start; flex-direction: column; margin-bottom: 26px; }
      .sr-checkout__grid { grid-template-columns: 1fr; }
      .sr-order { position: static; }
    }
    @media (max-width: 520px) {
      h1 { font-size: 50px; }
      .sr-fields { grid-template-columns: 1fr; }
      .sr-checkout__secure { width: 100%; }
      .sr-panel__body { padding: 16px; }
      .sr-order-item { grid-template-columns: 48px 1fr; }
      .sr-order-item img { width: 48px; height: 48px; }
      .sr-order-item strong { grid-column: 2; }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  private readonly store = inject(Store<{ auth: AuthState; cart: CartState; orders: OrderState }>);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly addressService = inject(AddressService);
  private readonly notificationService = inject(NotificationService);

  readonly items$ = this.store.select(selectCartItems);
  readonly currentUser$ = this.store.select(selectCurrentUser);

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    customerName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+() -]{7,20}$/)]],
    address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    paymentMethod: ['cash-on-delivery' as Order['paymentMethod'], Validators.required],
    saveAddressForFuture: [false]
  });

  savedAddresses: Address[] = [];
  selectedSavedAddress: Address | null = null;
  isLoadingAddresses = true;
  isChangingAddress = false;
  isEnteringManualAddress = false;

  total = 0;
  isSubmitting = false;
  errorMessage = '';

  constructor() {
    this.store.select(selectCartSubtotal).subscribe((total) => (this.total = total));
  }

  ngOnInit(): void {
    this.currentUser$.pipe(take(1)).subscribe((currentUser) => {
      if (currentUser) {
        // Pre-fill recipient credentials
        this.checkoutForm.patchValue({
          customerName: currentUser.name || '',
          phone: currentUser.phone || ''
        });

        // Load saved addresses
        this.addressService.getAddresses(currentUser.email).subscribe({
          next: (addresses) => {
            this.savedAddresses = addresses || [];
            this.isLoadingAddresses = false;

            if (this.savedAddresses.length > 0) {
              const defaultAddr = this.savedAddresses.find((a) => a.isDefault) || this.savedAddresses[0];
              this.chooseSavedAddress(defaultAddr);
            } else {
              this.isEnteringManualAddress = true;
            }
          },
          error: () => {
            this.isLoadingAddresses = false;
            this.isEnteringManualAddress = true;
          }
        });
      } else {
        this.isLoadingAddresses = false;
        this.isEnteringManualAddress = true;
      }
    });
  }

  chooseSavedAddress(addr: Address): void {
    this.selectedSavedAddress = addr;
    this.isChangingAddress = false;
    this.isEnteringManualAddress = false;

    this.checkoutForm.patchValue({
      customerName: addr.fullName,
      phone: addr.phone,
      address: addr.addressLine1 + (addr.addressLine2 ? `, ${addr.addressLine2}` : '') + (addr.landmark ? ` (Near ${addr.landmark})` : ''),
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode
    });
  }

  openChangeAddress(): void {
    this.isChangingAddress = true;
  }

  switchToManualAddress(): void {
    this.selectedSavedAddress = null;
    this.isChangingAddress = false;
    this.isEnteringManualAddress = true;
    this.checkoutForm.patchValue({
      address: '',
      city: '',
      state: '',
      pincode: '',
      saveAddressForFuture: false
    });
  }

  cancelManualAddress(): void {
    if (this.savedAddresses.length > 0) {
      const defaultAddr = this.savedAddresses.find((a) => a.isDefault) || this.savedAddresses[0];
      this.chooseSavedAddress(defaultAddr);
    }
  }

  submit(): void {
    this.checkoutForm.markAllAsTouched();
    this.errorMessage = '';
    if (this.checkoutForm.invalid) return;

    this.isSubmitting = true;
    combineLatest([
      this.currentUser$,
      this.items$
    ]).pipe(take(1)).subscribe(([currentUser, items]) => {
      if (!currentUser || items.length === 0) {
        this.errorMessage = items.length === 0 ? 'Your bag is empty.' : 'Please sign in before checkout.';
        this.isSubmitting = false;
        return;
      }

      const formValues = this.checkoutForm.getRawValue();

      // If manual address entered and "save for future" is checked, save address in background
      if (this.isEnteringManualAddress && formValues.saveAddressForFuture) {
        const newAddr: Address = {
          id: `ADDR-${Date.now()}`,
          userId: currentUser.id ?? currentUser.email,
          userEmail: currentUser.email,
          type: 'home',
          fullName: formValues.customerName.trim(),
          phone: formValues.phone.trim(),
          addressLine1: formValues.address.trim(),
          city: formValues.city.trim(),
          state: formValues.state.trim(),
          pincode: formValues.pincode.trim(),
          isDefault: this.savedAddresses.length === 0
        };
        this.addressService.addAddress(newAddr).subscribe();
      }

      const order: Order = {
        id: `ORD-${Date.now()}`,
        userId: currentUser.id ?? currentUser.email,
        userEmail: currentUser.email,
        customerName: formValues.customerName.trim(),
        phone: formValues.phone.trim(),
        deliveryAddress: `${formValues.address.trim()}, ${formValues.city.trim()}, ${formValues.state.trim()} - ${formValues.pincode.trim()}`,
        city: formValues.city.trim(),
        state: formValues.state.trim(),
        pincode: formValues.pincode.trim(),
        items: items as CartItem[],
        total: this.total,
        paymentMethod: formValues.paymentMethod,
        status: 'placed',
        createdAt: new Date().toISOString()
      };

      this.orderService.createOrder(order).subscribe({
        next: (savedOrder) => {
          this.store.dispatch(placeOrder({ order: savedOrder }));
          this.cartService.clearCart();
          this.isSubmitting = false;
          this.notificationService.show('ORDER AUTHORIZED & PLACED.', 'success');
          void this.router.navigate(['/order-success', savedOrder.id]);
        },
        error: () => {
          this.isSubmitting = false;
          this.errorMessage = 'Unable to place your order. Please try again.';
        }
      });
    });
  }
}
