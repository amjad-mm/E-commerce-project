import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { combineLatest, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { CartItem } from '../../core/models/cart.model';
import { Order } from '../../core/models/order.model';
import { AuthState } from '../../core/store/auth.reducer';
import { selectCurrentUser } from '../../core/store/auth.selectors';
import { CartState } from '../../core/store/cart.reducer';
import { selectCartItems, selectCartSubtotal } from '../../core/store/cart.selectors';
import { placeOrder } from '../../core/store/order.actions';
import { OrderState } from '../../core/store/order.reducer';
import { CartService } from '../../core/service/cart.service';
import { OrderService } from '../../core/service/order.service';

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
            <p>Enter delivery credentials to release your allocation.</p>
          </div>
          <div class="sr-checkout__secure">
            <span class="sr-checkout__lock">⌑</span>
            <div><b>ENCRYPTED CHECKOUT</b><small>256-BIT SECURE SYSTEM</small></div>
          </div>
        </header>

        <div class="sr-checkout__grid">
          <form class="sr-form" [formGroup]="checkoutForm" (ngSubmit)="submit()" novalidate>
            <section class="sr-panel">
              <div class="sr-panel__top"><span>01 // RECIPIENT PROFILE</span><b>REQUIRED</b></div>
              <div class="sr-panel__body sr-fields">
                <label>
                  <span>FULL NAME</span>
                  <input formControlName="customerName" autocomplete="name" placeholder="ENTER FULL NAME" />
                  @if (checkoutForm.controls.customerName.invalid && checkoutForm.controls.customerName.touched) { <small>FULL NAME IS REQUIRED.</small> }
                </label>
                <label>
                  <span>PHONE NUMBER</span>
                  <input formControlName="phone" type="tel" autocomplete="tel" placeholder="ENTER PHONE NUMBER" />
                  @if (checkoutForm.controls.phone.invalid && checkoutForm.controls.phone.touched) { <small>ENTER A VALID PHONE NUMBER.</small> }
                </label>
              </div>
            </section>

            <section class="sr-panel">
              <div class="sr-panel__top"><span>02 // DELIVERY COORDINATES</span><b>INDIA</b></div>
              <div class="sr-panel__body sr-fields">
                <label>
                  <span>DELIVERY ADDRESS</span>
                  <textarea formControlName="address" rows="4" autocomplete="street-address" placeholder="HOUSE / STREET / CITY / PINCODE"></textarea>
                  @if (checkoutForm.controls.address.invalid && checkoutForm.controls.address.touched) { <small>DELIVERY ADDRESS IS REQUIRED.</small> }
                </label>
                <div class="sr-delivery-note"><span>✓</span> EXPRESS COURIER // TRACKING ISSUED AFTER DISPATCH</div>
              </div>
            </section>

            <section class="sr-panel">
              <div class="sr-panel__top"><span>03 // PAYMENT PROTOCOL</span><b>VERIFIED</b></div>
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

            @if (errorMessage) { <p class="sr-form__error">{{ errorMessage }}</p> }
          </form>

          <aside class="sr-order">
            <div class="sr-order__header"><h2>ORDER MANIFEST</h2><span>LIVE</span></div>
            @if (items$ | async; as items) {
              <div class="sr-order__items">
                @for (item of items; track item.product.id) {
                  <article class="sr-order-item">
                    <img [src]="item.product.image" [alt]="item.product.name" />
                    <div><h3>{{ item.product.name }}</h3><p>QTY: {{ item.quantity }} // ARCHIVE STOCK</p></div>
                    <strong>{{ item.product.price * item.quantity | currency:'INR':'symbol':'1.0-0' }}</strong>
                  </article>
                } @empty { <p class="sr-order__empty">YOUR BAG IS EMPTY.</p> }
              </div>
            }
            <div class="sr-order__rows">
              <p><span>SUBTOTAL</span><b>{{ total | currency:'INR':'symbol':'1.0-0' }}</b></p>
              <p><span>EXPRESS COURIER</span><b class="sr-free">FREE</b></p>
            </div>
            <div class="sr-order__total"><span>FINAL VALUATION<br /><b>TOTAL</b></span><strong>{{ total | currency:'INR':'symbol':'1.0-0' }}</strong></div>
            <button type="submit" class="sr-submit" (click)="submit()" [disabled]="checkoutForm.invalid || isSubmitting">
              {{ isSubmitting ? 'PLACING ORDER...' : 'AUTHORIZE ORDER →' }}
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
    .sr-panel__top b { color: #6d9200; } .sr-panel__body { padding: 22px; }
    .sr-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; } .sr-fields label:last-child { grid-column: 1 / -1; }
    label, .sr-payment { display: grid; gap: 8px; font: 800 11px 'Courier New', monospace; letter-spacing: .04em; }
    input, textarea, select { width: 100%; border: 1px solid #bdbab3; border-radius: 0; padding: 13px; outline: none; color: #111; background: #fff; font: 700 13px Arial, sans-serif; }
    textarea { resize: vertical; min-height: 112px; } input:focus, textarea:focus, select:focus { border-color: #111; box-shadow: 3px 3px 0 #d9f13d; }
    input::placeholder, textarea::placeholder { color: #a19d94; font: 700 11px 'Courier New', monospace; } select { cursor: pointer; }
    small, .sr-form__error { color: #c2392a; font: 800 10px 'Courier New', monospace; letter-spacing: .03em; } .sr-form__error { margin: 0; padding: 12px; border: 1px solid #c2392a; background: #fff4f2; }
    .sr-delivery-note { grid-column: 1 / -1; padding: 10px 12px; background: #f0f6d3; color: #4e6800; font: 800 10px 'Courier New', monospace; letter-spacing: .04em; } .sr-delivery-note span { font-size: 14px; }
    .sr-payment__note { margin: 15px 0 0; color: #777; font: 700 10px 'Courier New', monospace; letter-spacing: .03em; }
    .sr-order { position: sticky; top: 20px; } .sr-order__header h2 { margin: 0; font-size: 16px; letter-spacing: -.02em; } .sr-order__header span { padding: 4px 8px; background: #d9f13d; font: 800 10px 'Courier New', monospace; }
    .sr-order__items { padding: 4px 18px; } .sr-order-item { display: grid; grid-template-columns: 56px 1fr auto; gap: 11px; align-items: center; padding: 14px 0; border-bottom: 1px solid #e5e2dc; }
    .sr-order-item img { width: 56px; height: 56px; object-fit: cover; background: #ece6da; } .sr-order-item h3 { margin: 0 0 5px; font-size: 13px; text-transform: uppercase; } .sr-order-item p, .sr-order__empty { margin: 0; color: #777; font: 700 9px 'Courier New', monospace; letter-spacing: .03em; } .sr-order-item strong { font-size: 13px; white-space: nowrap; }
    .sr-order__empty { padding: 22px 0; } .sr-order__rows { padding: 8px 18px; border-top: 1px solid #111; } .sr-order__rows p { display: flex; justify-content: space-between; margin: 11px 0; font: 700 11px 'Courier New', monospace; letter-spacing: .03em; } .sr-free { color: #6d9200; }
    .sr-order__total { display: flex; justify-content: space-between; align-items: end; padding: 17px 18px; background: #111; color: #fff; font: 700 10px 'Courier New', monospace; letter-spacing: .04em; } .sr-order__total b { display: block; margin-top: 3px; font-size: 15px; } .sr-order__total strong { color: #d9f13d; font: 800 25px Arial, sans-serif; letter-spacing: -.04em; }
    .sr-submit { width: 100%; border: 0; border-top: 1px solid #111; padding: 18px; background: #d9f13d; color: #111; cursor: pointer; font: 900 13px 'Courier New', monospace; letter-spacing: .04em; transition: background .15s, color .15s; } .sr-submit:hover:not(:disabled) { background: #111; color: #fff; } .sr-submit:disabled { cursor: not-allowed; opacity: .5; }
    .sr-order__foot { margin: 0; padding: 13px 16px; text-align: center; color: #777; font: 700 9px 'Courier New', monospace; letter-spacing: .02em; }
    @media (max-width: 800px) { .sr-checkout { padding: 24px 16px 64px; } .sr-checkout__header { align-items: flex-start; flex-direction: column; margin-bottom: 26px; } .sr-checkout__grid { grid-template-columns: 1fr; } .sr-order { position: static; } }
    @media (max-width: 520px) { h1 { font-size: 50px; } .sr-fields { grid-template-columns: 1fr; } .sr-checkout__secure { width: 100%; } .sr-panel__body { padding: 16px; } .sr-order-item { grid-template-columns: 48px 1fr; } .sr-order-item img { width: 48px; height: 48px; } .sr-order-item strong { grid-column: 2; } }
  `]
})
export class CheckoutComponent {
  private readonly store = inject(Store<{ auth: AuthState; cart: CartState; orders: OrderState }>);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
 
  readonly items$ = this.store.select(selectCartItems);
  readonly checkoutForm = this.formBuilder.nonNullable.group({
    customerName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+() -]{7,20}$/)]],
    address: ['', Validators.required],
    paymentMethod: ['cash-on-delivery' as Order['paymentMethod'], Validators.required]
  });
  total = 0;
  isSubmitting = false;
  errorMessage = '';

  constructor() {
    this.store.select(selectCartSubtotal).subscribe((total) => this.total = total);
  }

  submit(): void {
    this.checkoutForm.markAllAsTouched();
    this.errorMessage = '';
    if (this.checkoutForm.invalid) return;

    this.isSubmitting = true;
    combineLatest([
      this.store.select(selectCurrentUser),
      this.store.select(selectCartItems)
    ]).pipe(take(1)).subscribe(([currentUser, items]) => {
      if (!currentUser || items.length === 0) {
        this.errorMessage = items.length === 0 ? 'Your bag is empty.' : 'Please sign in before checkout.';
        this.isSubmitting = false;
        return;
      }

      const formValues = this.checkoutForm.getRawValue();
      const order: Order = {
        id: `ORD-${Date.now()}`,
        userId: currentUser.id ?? currentUser.email,
        userEmail: currentUser.email,
        customerName: formValues.customerName.trim(),
        phone: formValues.phone.trim(),
        deliveryAddress: formValues.address.trim(),
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
