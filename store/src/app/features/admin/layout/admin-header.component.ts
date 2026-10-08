import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { AuthState } from '../../../core/store/auth.reducer';
import { selectCurrentUser } from '../../../core/store/auth.selectors';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [RouterLink, AsyncPipe, DatePipe, UpperCasePipe],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css'
})
export class AdminHeaderComponent {
  private readonly store = inject(Store<{ auth: AuthState }>);
  private readonly router = inject(Router);

  @Output() toggleSidebar = new EventEmitter<void>();

  readonly currentUser$ = this.store.select(selectCurrentUser);
  readonly today = new Date();

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/admin/products')) return 'PRODUCT CATALOG DIRECTORY';
    if (url.includes('/admin/orders')) return 'ORDER MANIFEST AUDIT';
    if (url.includes('/admin/users')) return 'REGISTERED USERS DATABASE';
    if (url.includes('/admin/categories')) return 'CATEGORY TAXONOMY';
    if (url.includes('/admin/settings')) return 'SYSTEM TELEMETRY SETTINGS';
    return 'EXECUTIVE TELEMETRY // DASHBOARD';
  }
}
