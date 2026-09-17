import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { AuthState } from '../store/auth.reducer';
import { selectIsAuthenticated } from '../store/auth.selectors';

export const guestGuard: CanActivateFn = () => {
  const store = inject(Store<{ auth: AuthState }>);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return router.createUrlTree(['/']);
      }

      return true;
    })
  );
};
