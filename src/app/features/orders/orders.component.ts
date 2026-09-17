import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { Store } from '@ngrx/store';
import { AuthState } from '../../core/store/auth.reducer';
import { selectCurrentUser } from '../../core/store/auth.selectors';
import { OrderState } from '../../core/store/order.reducer';
import { selectOrders } from '../../core/store/order.selectors';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe, RouterLink],
  template: `
    <main class="orders-page">
      <a routerLink="/">← CONTINUE SHOPPING</a>
      <h1>YOUR ORDERS</h1>
      @if (orders$ | async; as orders) {
        @if (orders.length === 0) {
          <p>No orders yet.</p>
        } @else {
          @for (order of orders; track order.id) {
            <article>
              <div>
                <strong>{{ order.id }}</strong>
                <span>{{ order.createdAt | date:'medium' }}</span>
              </div>
              <span>{{ order.total | currency:'INR':'symbol':'1.0-0' }}</span>
            </article>
          }
        }
      }
    </main>
  `,
  styles: [`
    .orders-page { max-width: 900px; min-height: 60vh; margin: 0 auto; padding: 56px 24px; }
    article { display: flex; justify-content: space-between; gap: 16px; padding: 18px 0; border-top: 1px solid #111; }
    article div { display: grid; gap: 6px; }
    article span { color: #666; }
  `]
})
export class OrdersComponent {
  private readonly store = inject(Store<{ auth: AuthState; orders: OrderState }>);
  readonly orders$ = combineLatest([
    this.store.select(selectCurrentUser),
    this.store.select(selectOrders)
  ]).pipe(
    map(([currentUser, orders]) => currentUser
      ? orders.filter((order) => order.userEmail === currentUser.email)
      : [])
  );
}
