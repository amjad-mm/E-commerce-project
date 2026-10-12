import { AsyncPipe, CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, map, take } from 'rxjs';
import { Address } from '../../core/models/address.model';
import { Order } from '../../core/models/order.model';
import { user } from '../../core/models/user.models';
import { AddressService } from '../../core/service/address.service';
import { AuthService } from '../../core/service/auth.service';
import { CartService } from '../../core/service/cart.service';
import { NotificationService } from '../../core/service/notification.service';
import { OrderService } from '../../core/service/order.service';
import { WishlistService } from '../../core/service/wishlist.service';
import { hydrateAuth, logout } from '../../core/store/auth.actions';
import { AuthState } from '../../core/store/auth.reducer';
import { selectCurrentUser } from '../../core/store/auth.selectors';
import { OrderState } from '../../core/store/order.reducer';
import { selectOrders } from '../../core/store/order.selectors';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe, UpperCasePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit {
  private readonly store = inject(Store<{ auth: AuthState; orders: OrderState }>);
  private readonly authService = inject(AuthService);
  private readonly addressService = inject(AddressService);
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly currentUser$ = this.store.select(selectCurrentUser);
  readonly storeOrders$ = this.store.select(selectOrders);

  // Tab State
  activeTab: 'profile' | 'addresses' | 'orders' = 'profile';

  readonly cartCount$ = this.cartService.items$.pipe(
    map((items) => items.reduce((total, item) => total + item.quantity, 0))
  );

  readonly wishlistCount$ = this.wishlistService.products$.pipe(
    map((items) => items.length)
  );

  // Profile Form State
  isEditingProfile = false;
  isSavingProfile = false;
  readonly profileForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[0-9+() -]{7,20}$/)]]
  });

  // Address State
  addresses: Address[] = [];
  isLoadingAddresses = true;
  showAddressForm = false;
  editingAddressId: string | null = null;
  isSavingAddress = false;

  readonly addressForm = this.formBuilder.nonNullable.group({
    type: ['home' as Address['type'], Validators.required],
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+() -]{7,20}$/)]],
    addressLine1: ['', [Validators.required, Validators.minLength(5)]],
    addressLine2: [''],
    city: ['', [Validators.required, Validators.minLength(2)]],
    state: ['', [Validators.required, Validators.minLength(2)]],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    landmark: [''],
    isDefault: [false]
  });

  // Orders State
  userOrders: Order[] = [];
  isLoadingOrders = true;

  setTab(tab: 'profile' | 'addresses' | 'orders'): void {
    this.activeTab = tab;
  }

  getUserInitials(name?: string, email?: string): string {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'SR';
  }

  getMemberId(email?: string): string {
    if (!email) return 'SR-MBR-2026';
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = (hash * 31 + email.charCodeAt(i)) % 90000;
    }
    return `SR-CADRE-${10000 + Math.abs(hash)}`;
  }

  ngOnInit(): void {
    this.currentUser$.pipe(take(1)).subscribe((currentUser) => {
      if (currentUser) {
        this.loadAddresses(currentUser.email);
        this.loadUserOrders(currentUser.email);
      } else {
        this.isLoadingAddresses = false;
        this.isLoadingOrders = false;
      }
    });
  }

  // --- Profile Actions ---
  startEditProfile(): void {
    this.currentUser$.pipe(take(1)).subscribe((currentUser) => {
      if (currentUser) {
        this.profileForm.setValue({
          name: currentUser.name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || ''
        });
        this.isEditingProfile = true;
      }
    });
  }

  cancelEditProfile(): void {
    this.isEditingProfile = false;
  }

  saveProfile(currentUser: user): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSavingProfile = true;
    const formValues = this.profileForm.getRawValue();
    const updatedUser: user = {
      ...currentUser,
      name: formValues.name.trim(),
      email: formValues.email.trim(),
      phone: formValues.phone.trim()
    };

    const targetId = currentUser.id ?? currentUser.email;

    this.authService.updateUser(targetId, {
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone
    }).subscribe({
      next: (savedUser) => {
        const mergedUser = { ...currentUser, ...savedUser };
        localStorage.setItem('currentUser', JSON.stringify(mergedUser));
        this.store.dispatch(hydrateAuth({ user: mergedUser }));
        this.isSavingProfile = false;
        this.isEditingProfile = false;
        this.notificationService.show('PROFILE TELEMETRY UPDATED SUCCESSFULLY.', 'success');
      },
      error: () => {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.store.dispatch(hydrateAuth({ user: updatedUser }));
        this.isSavingProfile = false;
        this.isEditingProfile = false;
        this.notificationService.show('PROFILE UPDATED (LOCAL CACHE).', 'info');
      }
    });
  }

  // --- Address Actions ---
  loadAddresses(userEmail: string): void {
    this.isLoadingAddresses = true;
    this.addressService.getAddresses(userEmail).subscribe({
      next: (data) => {
        this.addresses = data || [];
        this.isLoadingAddresses = false;
      },
      error: () => {
        this.addresses = [];
        this.isLoadingAddresses = false;
      }
    });
  }

  openAddAddressForm(): void {
    this.editingAddressId = null;
    this.currentUser$.pipe(take(1)).subscribe((currentUser) => {
      this.addressForm.reset({
        type: 'home',
        fullName: currentUser?.name || '',
        phone: currentUser?.phone || '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        isDefault: this.addresses.length === 0
      });
      this.showAddressForm = true;
    });
  }

  editAddress(addr: Address): void {
    this.editingAddressId = addr.id;
    this.addressForm.setValue({
      type: addr.type,
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      landmark: addr.landmark || '',
      isDefault: addr.isDefault
    });
    this.showAddressForm = true;
  }

  closeAddressForm(): void {
    this.showAddressForm = false;
    this.editingAddressId = null;
    this.addressForm.reset();
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.currentUser$.pipe(take(1)).subscribe((currentUser) => {
      if (!currentUser) return;

      this.isSavingAddress = true;
      const formVal = this.addressForm.getRawValue();

      if (this.editingAddressId) {
        const updated: Partial<Address> = {
          type: formVal.type,
          fullName: formVal.fullName.trim(),
          phone: formVal.phone.trim(),
          addressLine1: formVal.addressLine1.trim(),
          addressLine2: formVal.addressLine2?.trim() || '',
          city: formVal.city.trim(),
          state: formVal.state.trim(),
          pincode: formVal.pincode.trim(),
          landmark: formVal.landmark?.trim() || '',
          isDefault: formVal.isDefault
        };

        this.addressService.updateAddress(this.editingAddressId, updated).subscribe({
          next: () => {
            if (formVal.isDefault) {
              this.addressService.setDefaultAddress(this.editingAddressId!, currentUser.email).subscribe(() => {
                this.finishAddressSave('ADDRESS COORDINATES UPDATED.');
              });
            } else {
              this.finishAddressSave('ADDRESS COORDINATES UPDATED.');
            }
          },
          error: () => {
            this.isSavingAddress = false;
            this.notificationService.show('FAILED TO UPDATE ADDRESS.', 'error');
          }
        });
      } else {
        const newAddress: Address = {
          id: `ADDR-${Date.now()}`,
          userId: currentUser.id ?? currentUser.email,
          userEmail: currentUser.email,
          type: formVal.type,
          fullName: formVal.fullName.trim(),
          phone: formVal.phone.trim(),
          addressLine1: formVal.addressLine1.trim(),
          addressLine2: formVal.addressLine2?.trim() || '',
          city: formVal.city.trim(),
          state: formVal.state.trim(),
          pincode: formVal.pincode.trim(),
          landmark: formVal.landmark?.trim() || '',
          isDefault: formVal.isDefault || this.addresses.length === 0
        };

        this.addressService.addAddress(newAddress).subscribe({
          next: (saved) => {
            if (saved.isDefault && this.addresses.length > 0) {
              this.addressService.setDefaultAddress(saved.id, currentUser.email).subscribe(() => {
                this.finishAddressSave('NEW DISPATCH ADDRESS RECORDED.');
              });
            } else {
              this.finishAddressSave('NEW DISPATCH ADDRESS RECORDED.');
            }
          },
          error: () => {
            this.isSavingAddress = false;
            this.notificationService.show('FAILED TO REGISTER ADDRESS.', 'error');
          }
        });
      }
    });
  }

  private finishAddressSave(msg: string): void {
    this.currentUser$.pipe(take(1)).subscribe((currentUser) => {
      if (currentUser) this.loadAddresses(currentUser.email);
    });
    this.isSavingAddress = false;
    this.closeAddressForm();
    this.notificationService.show(msg, 'success');
  }

  makeDefaultAddress(addr: Address): void {
    this.currentUser$.pipe(take(1)).subscribe((currentUser) => {
      if (!currentUser) return;
      this.addressService.setDefaultAddress(addr.id, currentUser.email).subscribe({
        next: () => {
          this.loadAddresses(currentUser.email);
          this.notificationService.show(`DEFAULT DESTINATION SET TO ${addr.type.toUpperCase()}.`, 'success');
        },
        error: () => {
          this.notificationService.show('UNABLE TO UPDATE DEFAULT ADDRESS.', 'error');
        }
      });
    });
  }

  confirmDeleteAddress(addr: Address): void {
    if (confirm(`REMOVE ${addr.type.toUpperCase()} ADDRESS (${addr.fullName}) FROM SAVED COORDINATES?`)) {
      this.addressService.deleteAddress(addr.id).subscribe({
        next: () => {
          this.currentUser$.pipe(take(1)).subscribe((currentUser) => {
            if (currentUser) this.loadAddresses(currentUser.email);
          });
          this.notificationService.show('ADDRESS REMOVED FROM DOSSIER.', 'info');
        },
        error: () => {
          this.notificationService.show('FAILED TO DELETE ADDRESS.', 'error');
        }
      });
    }
  }

  loadUserOrders(userEmail: string): void {
    this.isLoadingOrders = true;
    combineLatest([
      this.orderService.getOrdersByUser(userEmail),
      this.storeOrders$
    ]).pipe(take(1)).subscribe({
      next: ([apiOrders, storeOrders]) => {
        const storeUserOrders = (storeOrders || []).filter((o) => o.userEmail === userEmail);
        const map = new Map<string, Order>();
        [...storeUserOrders, ...(apiOrders || [])].forEach((ord) => map.set(ord.id, ord));
        this.userOrders = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.isLoadingOrders = false;
      },
      error: () => {
        this.storeOrders$.pipe(take(1)).subscribe((storeOrders) => {
          this.userOrders = (storeOrders || []).filter((o) => o.userEmail === userEmail);
          this.isLoadingOrders = false;
        });
      }
    });
  }

  onLogout(): void {
    localStorage.removeItem('currentUser');
    this.cartService.clearCurrentUser();
    this.wishlistService.clearCurrentUser();
    this.store.dispatch(logout());
    this.notificationService.show('SESSION TERMINATED. SIGNED OUT.', 'info');
    void this.router.navigate(['/login']);
  }
}
