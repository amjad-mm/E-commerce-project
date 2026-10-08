import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';

import { routes } from './app.routes';
import { cartReducer } from './core/store/cart.reducer';
import { authReducer } from './core/store/auth.reducer';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { orderReducer } from './core/store/order.reducer';
import { wishlistReducer } from './core/store/wishlist.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({ cart: cartReducer, auth: authReducer, orders: orderReducer, wishlist: wishlistReducer })
  ]
};
