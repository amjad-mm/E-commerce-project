import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from '../../core/service/auth.service';
import { loginSuccess } from '../../core/store/auth.actions';
import { CartService } from '../../core/service/cart.service';
import { WishlistService } from '../../core/service/wishlist.service';
import { user } from '../../core/models/user.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  readonly loginForm: FormGroup;

  submitted = false;
  isLoading = false;
  serverError = '';
  successMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly route: ActivatedRoute,
    private readonly cartService: CartService,
    private readonly wishlistService: WishlistService
  ) {
    this.loginForm = this.formBuilder.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted);
  }

  submit(): void {
    this.submitted = true;
    this.serverError = '';
    this.successMessage = '';
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.getRawValue();

    this.authService.login(email.trim(), password).subscribe({
      next: (users) => {
        if (users.length === 0) {
          this.isLoading = false;
          this.serverError = 'Invalid email or password.';
          return;
        }

        this.finishLogin(users[0]);
      },
      error: () => {
        this.isLoading = false;
        this.serverError = 'Unable to reach the authentication database.';
      }
    });
  }

  private finishLogin(loggedInUser: user): void {
    this.store.dispatch(loginSuccess({ user: loggedInUser }));
    localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
    this.cartService.setUser(loggedInUser.email);
    this.wishlistService.setUser(loggedInUser.email);

    this.isLoading = false;
    this.successMessage = 'Access authorized. Redirecting...';
    this.loginForm.reset();
    this.submitted = false;

    const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const returnUrl = requestedUrl && requestedUrl.startsWith('/') ? requestedUrl : '/';
    void this.router.navigateByUrl(returnUrl);
  }

}
