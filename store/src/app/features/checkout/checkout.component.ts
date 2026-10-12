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
import { SettingsService } from '../../core/service/settings.service';
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
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  private readonly store = inject(Store<{ auth: AuthState; cart: CartState; orders: OrderState }>);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly addressService = inject(AddressService);
  private readonly notificationService = inject(NotificationService);
  private readonly settingsService = inject(SettingsService);

  readonly items$ = this.store.select(selectCartItems);
  readonly currentUser$ = this.store.select(selectCurrentUser);

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    customerName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+() -]{7,20}$/)]],
    address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    paymentMethod: ['upi' as Order['paymentMethod'], Validators.required],
    saveAddressForFuture: [false]
  });

  savedAddresses: Address[] = [];
  selectedSavedAddress: Address | null = null;
  isLoadingAddresses = true;
  isChangingAddress = false;
  isEnteringManualAddress = false;

  subtotal = 0;
  shippingFee = 0;
  standardShippingFee = 250;
  freeShippingThreshold = 10000;
  total = 0;
  isSubmitting = false;
  errorMessage = '';

  constructor() {
    this.store.select(selectCartSubtotal).subscribe((subtotal) => {
      this.subtotal = subtotal;
      this.recalculateShipping();
    });

    this.settingsService.settings$.subscribe((settings) => {
      if (settings?.shipping) {
        this.standardShippingFee = settings.shipping.standardShippingFee;
        this.freeShippingThreshold = settings.shipping.freeShippingThreshold;
        this.recalculateShipping();
      }
    });
  }

  private recalculateShipping(): void {
    if (this.subtotal === 0) {
      this.shippingFee = 0;
      this.total = 0;
      return;
    }
    if (this.subtotal >= this.freeShippingThreshold) {
      this.shippingFee = 0;
    } else {
      this.shippingFee = this.standardShippingFee;
    }
    this.total = this.subtotal + this.shippingFee;
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

  onImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/asset/products/product1.png';
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
