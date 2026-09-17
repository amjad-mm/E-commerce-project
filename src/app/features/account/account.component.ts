import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthState } from '../../core/store/auth.reducer';
import { selectCurrentUser } from '../../core/store/auth.selectors';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  template: `
    <main class="account-page">
      <a routerLink="/">← CONTINUE SHOPPING</a>
      @if (currentUser$ | async; as currentUser) {
        <h1>ACCOUNT</h1>
        <p>{{ currentUser.name }}</p>
        <p>{{ currentUser.email }}</p>
      }
    </main>
  `,
  styles: [`
    .account-page { max-width: 720px; min-height: 60vh; margin: 0 auto; padding: 56px 24px; }
  `]
})
export class AccountComponent {
  private readonly store = inject(Store<{ auth: AuthState }>);
  readonly currentUser$ = this.store.select(selectCurrentUser);
}
