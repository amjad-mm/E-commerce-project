import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, take } from 'rxjs';
import { AuthState } from '../store/auth.reducer';
import { selectCurrentUser } from '../store/auth.selectors';
import { logout } from '../store/auth.actions';
import { AuthService } from '../service/auth.service';
import { CartService } from '../service/cart.service';
import { WishlistService } from '../service/wishlist.service';
import { NotificationService } from '../service/notification.service';
import { user } from '../models/user.models';

function getStoredUser(): user | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('currentUser') : null;
    return raw ? (JSON.parse(raw) as user) : null;
  } catch {
    return null;
  }
}

export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(Store<{ auth: AuthState }>);
  const router = inject(Router);
  const authService = inject(AuthService);
  const cartService = inject(CartService);
  const wishlistService = inject(WishlistService);
  const notificationService = inject(NotificationService);

  return store.select(selectCurrentUser).pipe(
    take(1),
    switchMap((storeUser) => {
      const activeUser = storeUser ?? getStoredUser();

      if (!activeUser) {
        return of(
          router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url }
          })
        );
      }

      // 1. If flagged as blocked in memory or storage
      if (activeUser.isBlocked) {
        localStorage.removeItem('currentUser');
        store.dispatch(logout());
        cartService.clearCurrentUser();
        wishlistService.clearCurrentUser();
        notificationService.show(
          'Your account has been banned or blocked by administration. Access denied.',
          'error'
        );
        return of(
          router.createUrlTree(['/login'], {
            queryParams: { banned: 'true', email: activeUser.email }
          })
        );
      }

      // 2. Real-time verification with database
      return authService.getUserByEmail(activeUser.email).pipe(
        map((dbUser) => {
          if (dbUser && dbUser.isBlocked) {
            localStorage.removeItem('currentUser');
            store.dispatch(logout());
            cartService.clearCurrentUser();
            wishlistService.clearCurrentUser();
            notificationService.show(
              'Your account has been banned or blocked by administration. Access denied.',
              'error'
            );
            return router.createUrlTree(['/login'], {
              queryParams: { banned: 'true', email: activeUser.email }
            });
          }

          return true;
        }),
        catchError(() => of(true))
      );
    })
  );
};
