import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { FooterComponent, } from './shared/footer/footer.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { ProductsComponent } from './features/products/products.component';
import { CatagoriesComponent } from './shared/catagories/catagories.component';
import { Section1Component } from './shared/section1/section1.component';
import { CartComponent } from './features/cart/cart.component';
import { Router } from '@angular/router';
import { RegisterComponent } from './features/register/register.component';
import { LoginComponent } from './features/login/login.component';
import { Store } from '@ngrx/store';
import { hydrateAuth } from './core/store/auth.actions';
import { user } from './core/models/user.models';
import { hydrateOrders } from './core/store/order.actions';
import { selectOrders } from './core/store/order.selectors';
import { Order } from './core/models/order.model';
import { NotificationComponent } from './shared/notification/notification.component';
import { CartService } from './core/service/cart.service';
import { WishlistService } from './core/service/wishlist.service';
import { AuthService } from './core/service/auth.service';
import { NotificationService } from './core/service/notification.service';
import { ProductViewComponent } from './features/product-view/product-view.component';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { OrderSuccessComponent } from './features/order-success/order-success.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, RouterOutlet, FooterComponent, NavbarComponent, ProductsComponent, CatagoriesComponent, Section1Component, CartComponent, RegisterComponent, LoginComponent, NotificationComponent, ProductViewComponent, CheckoutComponent, OrderSuccessComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'store';

  constructor(
    private readonly router: Router,
    private readonly store: Store,
    private readonly cartService: CartService,
    private readonly wishlistService: WishlistService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService
  ) {
    this.restoreUserSession();
    this.restoreOrders();
  }

  private restoreUserSession(): void {
    const storedUser = localStorage.getItem('currentUser');
    let currentUser: user | null = null;

    try {
      if (storedUser) {
        currentUser = JSON.parse(storedUser) as user;
      }
    } catch {
      localStorage.removeItem('currentUser');
    }

    if (currentUser?.isBlocked) {
      this.terminateBlockedSession(currentUser.email);
      return;
    }

    this.store.dispatch(hydrateAuth({ user: currentUser }));
    this.cartService.setUser(currentUser ? currentUser.email : null);
    this.wishlistService.setUser(currentUser ? currentUser.email : null);

    // Live verification in background
    if (currentUser) {
      this.authService.getUserByEmail(currentUser.email).subscribe({
        next: (dbUser) => {
          if (dbUser && dbUser.isBlocked) {
            this.terminateBlockedSession(dbUser.email);
          }
        }
      });
    }
  }

  private terminateBlockedSession(email: string): void {
    localStorage.removeItem('currentUser');
    this.store.dispatch(hydrateAuth({ user: null }));
    this.cartService.setUser(null);
    this.wishlistService.setUser(null);
    this.notificationService.show(
      'Your account has been banned or blocked by administration. Access denied.',
      'error'
    );
    if (!this.isAuthRoute()) {
      void this.router.navigate(['/login'], { queryParams: { banned: 'true', email } });
    }
  }

  private restoreOrders(): void {
    const storedOrders = localStorage.getItem('sole-raw-orders');
    let orders: Order[] = [];

    try {
      if (storedOrders) {
        orders = JSON.parse(storedOrders) as Order[];
      }
    } catch {
      localStorage.removeItem('sole-raw-orders');
    }

    this.store.dispatch(hydrateOrders({ orders }));
    this.store.select(selectOrders).subscribe((currentOrders) => {
      localStorage.setItem('sole-raw-orders', JSON.stringify(currentOrders));
    });
  }

  isHomeRoute(): boolean {
    const cleanUrl = this.router.url.split('?')[0].split('#')[0];
    return cleanUrl === '/' || cleanUrl === '';
  }

  isAuthRoute(): boolean {
    return this.router.url.startsWith('/register') || this.router.url.startsWith('/login');
  }

  isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }
}
