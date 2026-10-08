import { AsyncPipe, CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, take } from 'rxjs';
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
  template: `
    <main class="sr-account">
      <div class="sr-account__inner">
        <!-- Top breadcrumb & header -->
        <div class="sr-account__topbar">
          <a routerLink="/" class="sr-account__back">← RETURN TO STORE</a>
          <span class="sr-account__badge">[CADRE_ID // ARCHIVE_2026]</span>
        </div>

        <header class="sr-account__header">
          <div>
            <p class="sr-account__eyebrow">// MEMBER DOSSIER</p>
            <h1>ACCOUNT <em>CONTROL</em></h1>
          </div>
          <button type="button" class="sr-logout-btn" (click)="onLogout()">
            <svg xmlns="http://www.w3.org/2000/svg" class="sr-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            TERMINATE SESSION // LOG OUT
          </button>
        </header>

        <div class="sr-account__grid">
          <!-- Left Column: Personal Info & Addresses -->
          <div class="sr-account__main">
            <!-- SECTION 1: Personal Information -->
            <section class="sr-panel">
              <div class="sr-panel__top">
                <span>01 // PERSONAL INFORMATION</span>
                @if (!isEditingProfile) {
                  <button type="button" class="sr-action-link" (click)="startEditProfile()">[ EDIT PROFILE ]</button>
                }
              </div>

              <div class="sr-panel__body">
                @if (currentUser$ | async; as currentUser) {
                  @if (!isEditingProfile) {
                    <div class="sr-info-grid">
                      <div class="sr-info-item">
                        <span class="sr-info-label">IDENTIFIER // NAME</span>
                        <strong class="sr-info-value">{{ currentUser.name || 'NOT CONFIGURED' }}</strong>
                      </div>
                      <div class="sr-info-item">
                        <span class="sr-info-label">COMMUNICATION // EMAIL</span>
                        <strong class="sr-info-value">{{ currentUser.email }}</strong>
                      </div>
                      <div class="sr-info-item">
                        <span class="sr-info-label">TELEMETRY // PHONE</span>
                        <strong class="sr-info-value">{{ currentUser.phone || 'NO PHONE REGISTERED' }}</strong>
                      </div>
                      <div class="sr-info-item">
                        <span class="sr-info-label">MEMBER STATUS</span>
                        <span class="sr-status-tag">TIER_0 // VERIFIED CADRE</span>
                      </div>
                    </div>
                  } @else {
                    <form [formGroup]="profileForm" (ngSubmit)="saveProfile(currentUser)" class="sr-form">
                      <div class="sr-form-row">
                        <label>
                          <span>FULL NAME *</span>
                          <input formControlName="name" placeholder="ENTER FULL NAME" />
                          @if (profileForm.controls.name.invalid && profileForm.controls.name.touched) {
                            <small class="sr-error">Valid name is required (min 2 characters).</small>
                          }
                        </label>
                        <label>
                          <span>PHONE NUMBER</span>
                          <input formControlName="phone" type="tel" placeholder="+91 98765 43210" />
                          @if (profileForm.controls.phone.invalid && profileForm.controls.phone.touched) {
                            <small class="sr-error">Enter a valid phone number format.</small>
                          }
                        </label>
                      </div>

                      <div class="sr-form-row">
                        <label>
                          <span>EMAIL ADDRESS *</span>
                          <input formControlName="email" type="email" placeholder="user@domain.com" />
                          @if (profileForm.controls.email.invalid && profileForm.controls.email.touched) {
                            <small class="sr-error">Valid email address is required.</small>
                          }
                        </label>
                      </div>

                      <div class="sr-btn-row">
                        <button type="submit" class="sr-btn sr-btn--primary" [disabled]="profileForm.invalid || isSavingProfile">
                          {{ isSavingProfile ? 'SAVING CHANGES...' : 'SAVE MODIFICATIONS' }}
                        </button>
                        <button type="button" class="sr-btn sr-btn--secondary" (click)="cancelEditProfile()" [disabled]="isSavingProfile">
                          CANCEL
                        </button>
                      </div>
                    </form>
                  }
                }
              </div>
            </section>

            <!-- SECTION 2: Delivery Addresses -->
            <section class="sr-panel">
              <div class="sr-panel__top">
                <span>02 // DELIVERY DISPATCH COORDINATES</span>
                @if (!showAddressForm) {
                  <button type="button" class="sr-action-link sr-action-link--lime" (click)="openAddAddressForm()">
                    + ADD NEW ADDRESS
                  </button>
                }
              </div>

              <div class="sr-panel__body">
                <!-- Address Form (Add / Edit) -->
                @if (showAddressForm) {
                  <div class="sr-address-form-box">
                    <div class="sr-form-heading">
                      <h3>{{ editingAddressId ? 'MODIFY DISPATCH ADDRESS' : 'REGISTER NEW DISPATCH ADDRESS' }}</h3>
                      <span class="sr-form-code">{{ editingAddressId ? '[REF: ' + editingAddressId + ']' : '[NEW ENTRY]' }}</span>
                    </div>

                    <form [formGroup]="addressForm" (ngSubmit)="saveAddress()" class="sr-form">
                      <div class="sr-type-toggle">
                        <span class="sr-info-label">ADDRESS TYPE:</span>
                        <label class="sr-radio-label">
                          <input type="radio" formControlName="type" value="home" />
                          <span>HOME</span>
                        </label>
                        <label class="sr-radio-label">
                          <input type="radio" formControlName="type" value="office" />
                          <span>OFFICE</span>
                        </label>
                      </div>

                      <div class="sr-form-row">
                        <label>
                          <span>RECIPIENT FULL NAME *</span>
                          <input formControlName="fullName" placeholder="MARCUS VANCE" />
                          @if (addressForm.controls.fullName.invalid && addressForm.controls.fullName.touched) {
                            <small class="sr-error">Full name is required.</small>
                          }
                        </label>
                        <label>
                          <span>CONTACT PHONE *</span>
                          <input formControlName="phone" type="tel" placeholder="+91 98765 43210" />
                          @if (addressForm.controls.phone.invalid && addressForm.controls.phone.touched) {
                            <small class="sr-error">Valid contact phone required.</small>
                          }
                        </label>
                      </div>

                      <label>
                        <span>ADDRESS LINE 1 (FLAT, BUILDING, STREET) *</span>
                        <input formControlName="addressLine1" placeholder="402 RAW TOWER, SECTOR 4" />
                        @if (addressForm.controls.addressLine1.invalid && addressForm.controls.addressLine1.touched) {
                          <small class="sr-error">Address line 1 is required.</small>
                        }
                      </label>

                      <label>
                        <span>ADDRESS LINE 2 (AREA / LOCALITY - OPTIONAL)</span>
                        <input formControlName="addressLine2" placeholder="NEAR ARCHIVE WAREHOUSE" />
                      </label>

                      <div class="sr-form-row sr-form-row--3">
                        <label>
                          <span>CITY *</span>
                          <input formControlName="city" placeholder="MUMBAI" />
                          @if (addressForm.controls.city.invalid && addressForm.controls.city.touched) {
                            <small class="sr-error">City is required.</small>
                          }
                        </label>
                        <label>
                          <span>STATE *</span>
                          <input formControlName="state" placeholder="MAHARASHTRA" />
                          @if (addressForm.controls.state.invalid && addressForm.controls.state.touched) {
                            <small class="sr-error">State is required.</small>
                          }
                        </label>
                        <label>
                          <span>PINCODE *</span>
                          <input formControlName="pincode" placeholder="400001" />
                          @if (addressForm.controls.pincode.invalid && addressForm.controls.pincode.touched) {
                            <small class="sr-error">Valid 6-digit PIN required.</small>
                          }
                        </label>
                      </div>

                      <label>
                        <span>LANDMARK (OPTIONAL)</span>
                        <input formControlName="landmark" placeholder="OPPOSITE METRO GATE 2" />
                      </label>

                      <label class="sr-checkbox-label">
                        <input type="checkbox" formControlName="isDefault" />
                        <span>SET AS DEFAULT DISPATCH DESTINATION</span>
                      </label>

                      <div class="sr-btn-row">
                        <button type="submit" class="sr-btn sr-btn--primary" [disabled]="addressForm.invalid || isSavingAddress">
                          {{ isSavingAddress ? 'RECORDING...' : (editingAddressId ? 'UPDATE ADDRESS' : 'SAVE NEW ADDRESS') }}
                        </button>
                        <button type="button" class="sr-btn sr-btn--secondary" (click)="closeAddressForm()" [disabled]="isSavingAddress">
                          CANCEL
                        </button>
                      </div>
                    </form>
                  </div>
                }

                <!-- Saved Addresses Cards Grid -->
                @if (isLoadingAddresses) {
                  <p class="sr-loading-note">RETRIEVING SAVED COORDINATES...</p>
                } @else if (addresses.length === 0 && !showAddressForm) {
                  <div class="sr-empty-block">
                    <p>// NO REGISTERED DISPATCH COORDINATES</p>
                    <small>Add delivery addresses for frictionless, 1-click checkout authorization.</small>
                    <button type="button" class="sr-btn sr-btn--lime sr-mt-4" (click)="openAddAddressForm()">
                      + REGISTER FIRST ADDRESS
                    </button>
                  </div>
                } @else {
                  <div class="sr-address-grid">
                    @for (addr of addresses; track addr.id) {
                      <div class="sr-address-card" [class.sr-address-card--default]="addr.isDefault">
                        <div class="sr-address-card__top">
                          <span class="sr-address-type" [class.sr-address-type--office]="addr.type === 'office'">
                            {{ addr.type === 'home' ? '⌂ HOME' : '🏢 OFFICE' }}
                          </span>
                          @if (addr.isDefault) {
                            <span class="sr-default-badge">★ DEFAULT DESTINATION</span>
                          }
                        </div>

                        <div class="sr-address-card__content">
                          <h4 class="sr-address-name">{{ addr.fullName }}</h4>
                          <p class="sr-address-lines">
                            {{ addr.addressLine1 }}
                            @if (addr.addressLine2) { <br />{{ addr.addressLine2 }} }
                            @if (addr.landmark) { <br /><span class="sr-landmark-text">Landmark: {{ addr.landmark }}</span> }
                          </p>
                          <p class="sr-address-locality">
                            <strong>{{ addr.city }}</strong>, {{ addr.state }} — <span class="sr-pin">{{ addr.pincode }}</span>
                          </p>
                          <p class="sr-address-phone">
                            <span class="sr-label-tag">PHONE:</span> {{ addr.phone }}
                          </p>
                        </div>

                        <div class="sr-address-card__actions">
                          @if (!addr.isDefault) {
                            <button type="button" class="sr-action-btn" (click)="makeDefaultAddress(addr)">
                              SET DEFAULT
                            </button>
                          }
                          <button type="button" class="sr-action-btn" (click)="editAddress(addr)">
                            EDIT
                          </button>
                          <button type="button" class="sr-action-btn sr-action-btn--delete" (click)="confirmDeleteAddress(addr)">
                            DELETE
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </section>
          </div>

          <!-- Right Column: Recent Orders & Quick Stats -->
          <aside class="sr-account__sidebar">
            <section class="sr-panel">
              <div class="sr-panel__top">
                <span>03 // RECENT DISPATCHES</span>
                <a routerLink="/orders" class="sr-action-link">[ VIEW ALL ({{ userOrders.length }}) → ]</a>
              </div>

              <div class="sr-panel__body">
                @if (isLoadingOrders) {
                  <p class="sr-loading-note">ACCESSING ORDER MANIFEST...</p>
                } @else if (userOrders.length === 0) {
                  <div class="sr-empty-block">
                    <p>// NO PRIOR DISPATCHES FOUND</p>
                    <small>Your vault is currently awaiting its first allotment.</small>
                    <a routerLink="/" class="sr-btn sr-btn--lime sr-mt-4">BROWSE CATALOG</a>
                  </div>
                } @else {
                  <div class="sr-recent-orders-list">
                    @for (order of userOrders.slice(0, 3); track order.id) {
                      <div class="sr-recent-order-item">
                        <div class="sr-recent-order-header">
                          <span class="sr-order-id">{{ order.id }}</span>
                          <span class="sr-order-status sr-order-status--{{ order.status }}">{{ order.status | uppercase }}</span>
                        </div>

                        <div class="sr-recent-order-info">
                          <span>{{ order.items.length }} ITEM(S)</span>
                          <span class="sr-bullet">•</span>
                          <span>{{ order.createdAt | date:'dd MMM yyyy' }}</span>
                        </div>

                        <div class="sr-recent-order-total">
                          <span>TOTAL VALUATION:</span>
                          <strong>{{ order.total | currency:'INR':'symbol':'1.0-0' }}</strong>
                        </div>

                        <a [routerLink]="['/orders', order.id]" class="sr-order-detail-btn">
                          VIEW DISPATCH MANIFEST →
                        </a>
                      </div>
                    }

                    <div class="sr-view-all-box">
                      <a routerLink="/orders" class="sr-btn sr-btn--dark sr-w-full">
                        VIEW ALL ORDERS ({{ userOrders.length }}) →
                      </a>
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- Quick Vault Telemetry Info Card -->
            <div class="sr-telemetry-box">
              <div class="sr-telemetry-item">
                <span class="sr-telemetry-label">SECURITY PROTOCOL</span>
                <strong>ENCRYPTED_SHA256</strong>
              </div>
              <div class="sr-telemetry-item">
                <span class="sr-telemetry-label">DISPATCH CARRIER</span>
                <strong>RAW_EXPRESS // AIR</strong>
              </div>
              <div class="sr-telemetry-item">
                <span class="sr-telemetry-label">VAULT ACCESS</span>
                <strong class="sr-lime-text">UNRESTRICTED</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .sr-account {
      min-height: 75vh;
      background: #faf7f2;
      color: #111;
      padding: 36px 24px 96px;
      font-family: Arial, 'Helvetica Neue', sans-serif;
    }
    .sr-account__inner { max-width: 1400px; margin: 0 auto; }
    .sr-account__topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .sr-account__back {
      font: 800 11px 'Courier New', monospace;
      letter-spacing: .06em;
      color: #111;
      text-decoration: none;
      border-bottom: 1px solid #111;
      padding-bottom: 2px;
    }
    .sr-account__badge {
      font: 700 11px 'Courier New', monospace;
      color: #8a8a85;
      letter-spacing: .05em;
    }
    .sr-account__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 36px;
      padding-bottom: 24px;
      border-bottom: 2px solid #111;
    }
    .sr-account__eyebrow {
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
    .sr-logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 18px;
      background: #fff;
      color: #c2392a;
      border: 1px solid #c2392a;
      font: 800 11px 'Courier New', monospace;
      letter-spacing: .05em;
      cursor: pointer;
      box-shadow: 4px 4px 0 rgba(194, 57, 42, 0.2);
      transition: all .15s ease;
    }
    .sr-logout-btn:hover {
      background: #c2392a;
      color: #fff;
      box-shadow: none;
    }
    .sr-icon { width: 15px; height: 15px; }

    /* Layout grid */
    .sr-account__grid {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.85fr);
      gap: 32px;
      align-items: start;
    }
    .sr-account__main, .sr-account__sidebar {
      display: grid;
      gap: 28px;
    }

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
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid #111;
      font: 800 11px 'Courier New', monospace;
      letter-spacing: .06em;
      background: #fdfdfc;
    }
    .sr-panel__body { padding: 24px; }

    .sr-action-link {
      background: transparent;
      border: none;
      color: #111;
      font: 800 11px 'Courier New', monospace;
      letter-spacing: .05em;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
    }
    .sr-action-link--lime {
      color: #557d00;
      text-decoration: none;
      padding: 4px 8px;
      background: #d9f13d;
      border: 1px solid #111;
    }
    .sr-action-link--lime:hover { background: #111; color: #fff; }

    /* Personal info */
    .sr-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }
    .sr-info-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 14px;
      background: #faf7f2;
      border: 1px solid #e2ded7;
    }
    .sr-info-label {
      font: 700 10px 'Courier New', monospace;
      letter-spacing: .05em;
      color: #777;
    }
    .sr-info-value {
      font-size: 15px;
      font-weight: 800;
      color: #111;
      word-break: break-word;
    }
    .sr-status-tag {
      display: inline-block;
      align-self: flex-start;
      font: 800 10px 'Courier New', monospace;
      padding: 4px 8px;
      background: #d9f13d;
      color: #111;
      border: 1px solid #111;
    }

    /* Forms */
    .sr-form { display: grid; gap: 18px; }
    .sr-form-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .sr-form-row--3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    label {
      display: grid;
      gap: 6px;
      font: 800 11px 'Courier New', monospace;
      letter-spacing: .04em;
    }
    input, select {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #bdbab3;
      border-radius: 0;
      font: 700 13px Arial, sans-serif;
      background: #fff;
      color: #111;
      outline: none;
    }
    input:focus, select:focus {
      border-color: #111;
      box-shadow: 3px 3px 0 #d9f13d;
    }
    .sr-error {
      color: #c2392a;
      font: 700 10px 'Courier New', monospace;
    }
    .sr-btn-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
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
    .sr-btn--primary {
      background: #111;
      color: #fff;
      border-bottom: 3px solid #d9f13d;
    }
    .sr-btn--primary:hover:not(:disabled) { background: #262626; }
    .sr-btn--secondary { background: #eeece6; color: #111; }
    .sr-btn--secondary:hover:not(:disabled) { background: #e0ded6; }
    .sr-btn--lime { background: #d9f13d; color: #111; }
    .sr-btn--lime:hover { background: #111; color: #fff; }
    .sr-btn--dark { background: #111; color: #fff; }
    .sr-btn--dark:hover { background: #262626; color: #d9f13d; }
    .sr-btn:disabled { opacity: .5; cursor: not-allowed; }
    .sr-w-full { width: 100%; }
    .sr-mt-4 { margin-top: 14px; }

    /* Address form box */
    .sr-address-form-box {
      padding: 20px;
      background: #faf7f2;
      border: 1px solid #111;
      margin-bottom: 24px;
      box-shadow: 4px 4px 0 rgba(17,17,17,.9);
    }
    .sr-form-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid #dedad0;
    }
    .sr-form-heading h3 { margin: 0; font-size: 14px; font-weight: 800; }
    .sr-form-code { font: 700 10px 'Courier New', monospace; color: #777; }
    .sr-type-toggle {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 6px;
    }
    .sr-radio-label, .sr-checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font: 700 11px 'Courier New', monospace;
      cursor: pointer;
    }
    .sr-radio-label input, .sr-checkbox-label input {
      width: 16px;
      height: 16px;
      accent-color: #111;
      cursor: pointer;
    }

    /* Address Cards */
    .sr-address-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 18px;
    }
    .sr-address-card {
      background: #faf7f2;
      border: 1px solid #111;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px;
      transition: transform .15s ease;
    }
    .sr-address-card--default {
      border: 2px solid #111;
      background: #fff;
      box-shadow: 4px 4px 0 #d9f13d;
    }
    .sr-address-card__top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .sr-address-type {
      font: 800 10px 'Courier New', monospace;
      padding: 3px 6px;
      background: #111;
      color: #fff;
      letter-spacing: .04em;
    }
    .sr-address-type--office { background: #2b3b82; }
    .sr-default-badge {
      font: 800 9px 'Courier New', monospace;
      color: #4e6800;
      background: #f0f6d3;
      padding: 3px 6px;
      border: 1px solid #d9f13d;
    }
    .sr-address-name {
      margin: 0 0 6px;
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .sr-address-lines {
      margin: 0 0 6px;
      font-size: 13px;
      line-height: 1.4;
      color: #444;
    }
    .sr-landmark-text { font-size: 11px; color: #777; font-style: italic; }
    .sr-address-locality {
      margin: 0 0 8px;
      font-size: 13px;
      color: #111;
    }
    .sr-pin { font-family: 'Courier New', monospace; font-weight: 700; }
    .sr-address-phone {
      margin: 0;
      font-size: 12px;
      color: #555;
    }
    .sr-label-tag { font: 700 10px 'Courier New', monospace; color: #777; }
    .sr-address-card__actions {
      display: flex;
      gap: 8px;
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid #e0ded6;
      flex-wrap: wrap;
    }
    .sr-action-btn {
      padding: 5px 9px;
      background: #fff;
      border: 1px solid #111;
      font: 800 10px 'Courier New', monospace;
      letter-spacing: .03em;
      cursor: pointer;
    }
    .sr-action-btn:hover { background: #111; color: #fff; }
    .sr-action-btn--delete { color: #c2392a; border-color: #c2392a; }
    .sr-action-btn--delete:hover { background: #c2392a; color: #fff; }

    /* Orders sidebar */
    .sr-recent-orders-list { display: grid; gap: 16px; }
    .sr-recent-order-item {
      padding: 16px;
      background: #faf7f2;
      border: 1px solid #111;
      display: grid;
      gap: 8px;
    }
    .sr-recent-order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .sr-order-id { font: 800 12px 'Courier New', monospace; color: #111; }
    .sr-order-status {
      font: 800 9px 'Courier New', monospace;
      padding: 3px 6px;
      letter-spacing: .04em;
    }
    .sr-order-status--placed, .sr-order-status--confirmed { background: #d9f13d; color: #111; }
    .sr-order-status--processing, .sr-order-status--shipped { background: #111; color: #fff; }
    .sr-order-status--delivered { background: #6d9200; color: #fff; }
    .sr-order-status--cancelled { background: #c2392a; color: #fff; }
    .sr-recent-order-info {
      font: 700 11px 'Courier New', monospace;
      color: #777;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sr-bullet { color: #aaa; }
    .sr-recent-order-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font: 700 11px 'Courier New', monospace;
    }
    .sr-recent-order-total strong { font-size: 14px; color: #111; }
    .sr-order-detail-btn {
      margin-top: 6px;
      font: 800 10px 'Courier New', monospace;
      color: #111;
      text-decoration: underline;
      display: inline-block;
    }
    .sr-empty-block {
      text-align: center;
      padding: 24px 16px;
      font: 700 11px 'Courier New', monospace;
      color: #777;
    }
    .sr-empty-block small { display: block; margin-top: 4px; color: #999; }
    .sr-loading-note { font: 700 11px 'Courier New', monospace; color: #777; }

    /* Telemetry box */
    .sr-telemetry-box {
      background: #111;
      color: #fff;
      padding: 16px 20px;
      border: 1px solid #111;
      display: grid;
      gap: 10px;
      font-family: 'Courier New', monospace;
    }
    .sr-telemetry-item { display: flex; justify-content: space-between; font-size: 11px; }
    .sr-telemetry-label { color: #888; }
    .sr-lime-text { color: #d9f13d; }

    @media (max-width: 960px) {
      .sr-account__grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .sr-account { padding: 24px 16px 64px; }
      .sr-form-row, .sr-form-row--3 { grid-template-columns: 1fr; }
      .sr-account__header { flex-direction: column; align-items: flex-start; }
      .sr-logout-btn { width: 100%; justify-content: center; }
    }
  `]
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
        // Fallback for mock environment if patch fails on email key
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
        isDefault: this.addresses.length === 0 // Default if first address
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
        // Update existing address
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
        // Create new address
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

  // --- Orders Actions ---
  loadUserOrders(userEmail: string): void {
    this.isLoadingOrders = true;
    combineLatest([
      this.orderService.getOrdersByUser(userEmail),
      this.storeOrders$
    ]).pipe(take(1)).subscribe({
      next: ([apiOrders, storeOrders]) => {
        // Merge & deduplicate orders between backend API and store
        const storeUserOrders = (storeOrders || []).filter((o) => o.userEmail === userEmail);
        const map = new Map<string, Order>();
        [...storeUserOrders, ...(apiOrders || [])].forEach((ord) => map.set(ord.id, ord));
        this.userOrders = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.isLoadingOrders = false;
      },
      error: () => {
        // Fallback to store orders
        this.storeOrders$.pipe(take(1)).subscribe((storeOrders) => {
          this.userOrders = (storeOrders || []).filter((o) => o.userEmail === userEmail);
          this.isLoadingOrders = false;
        });
      }
    });
  }

  // --- Session Logout ---
  onLogout(): void {
    localStorage.removeItem('currentUser');
    this.cartService.clearCurrentUser();
    this.wishlistService.clearCurrentUser();
    this.store.dispatch(logout());
    this.notificationService.show('SESSION TERMINATED. SIGNED OUT.', 'info');
    void this.router.navigate(['/login']);
  }
}
