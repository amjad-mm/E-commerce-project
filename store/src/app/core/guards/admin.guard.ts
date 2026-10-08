import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap, take } from 'rxjs';
import { AuthState } from '../store/auth.reducer';
import { selectCurrentUser } from '../store/auth.selectors';
import { Store } from '@ngrx/store';
import { AuthService } from '../service/auth.service';
import { hydrateAuth } from '../store/auth.actions';
import { user } from '../models/user.models';

function getStoredUser(): user | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('currentUser') : null;
    return raw ? (JSON.parse(raw) as user) : null;
  } catch {
    return null;
  }
}

export const adminGuard: CanActivateFn = (_route, state) => {
  const store = inject(Store<{ auth: AuthState }>);
  const router = inject(Router);
  const authService = inject(AuthService);

  return store.select(selectCurrentUser).pipe(
    take(1),
    switchMap((storeUser) => {
      const currentUser = storeUser ?? getStoredUser();

      // 1. Not logged in at all -> redirect to login with returnUrl
      if (!currentUser) {
        return of(router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        }));
      }

      // 2. Already has admin role in memory/storage -> allow access
      if (currentUser.role === 'admin') {
        return of(true);
      }

      // 3. Fallback: check database directly in case db.json was edited on disk while localStorage remained stale
      return authService.getUserByEmail(currentUser.email).pipe(
        map((dbUser) => {
          if (dbUser && dbUser.role === 'admin') {
            localStorage.setItem('currentUser', JSON.stringify(dbUser));
            store.dispatch(hydrateAuth({ user: dbUser }));
            return true;
          }
          return router.createUrlTree(['/']);
        }),
        catchError(() => of(router.createUrlTree(['/'])))
      );
    })
  );
};
