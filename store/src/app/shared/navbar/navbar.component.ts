import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { CartState } from '../../core/store/cart.reducer';
import { selectCartItemCount } from '../../core/store/cart.selectors';
import { AuthState } from '../../core/store/auth.reducer';
import { logout } from '../../core/store/auth.actions';
import { selectCurrentUser } from '../../core/store/auth.selectors';
import { WishlistState } from '../../core/store/wishlist.reducer';
import { selectWishlistCount } from '../../core/store/wishlist.selectors';
import { CartService } from '../../core/service/cart.service';
import { WishlistService } from '../../core/service/wishlist.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private readonly store = inject(Store<{ cart: CartState; auth: AuthState; wishlist: WishlistState }>);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);

  readonly cartCount$ = this.store.select(selectCartItemCount);
  readonly currentUser$ = this.store.select(selectCurrentUser);
  readonly wishlistCount$ = this.store.select(selectWishlistCount);

  logout(): void {
    // Clear the session and the logged-in user's private data.
    localStorage.removeItem('currentUser');
    this.cartService.clearCurrentUser();
    this.wishlistService.clearCurrentUser();
    this.store.dispatch(logout());
    void this.router.navigate(['/login']);
  }
}
