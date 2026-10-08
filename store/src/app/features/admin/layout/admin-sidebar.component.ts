import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { CartService } from '../../../core/service/cart.service';
import { WishlistService } from '../../../core/service/wishlist.service';
import { logout } from '../../../core/store/auth.actions';
import { AuthState } from '../../../core/store/auth.reducer';
import { selectCurrentUser } from '../../../core/store/auth.selectors';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, UpperCasePipe],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {
  private readonly store = inject(Store<{ auth: AuthState }>);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);

  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  readonly currentUser$ = this.store.select(selectCurrentUser);

  onNavClick(): void {
    this.closeSidebar.emit();
  }

  onLogout(): void {
    localStorage.removeItem('currentUser');
    this.cartService.clearCurrentUser();
    this.wishlistService.clearCurrentUser();
    this.store.dispatch(logout());
    void this.router.navigate(['/login']);
  }
}
