import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  readonly registerForm: FormGroup;

  submitted = false;
  isLoading = false;
  serverError = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.registerForm = this.formBuilder.nonNullable.group({
      firstName: ['', nameValidator],
      lastName: ['', nameValidator],
      email: ['', [Validators.required, Validators.email]],
      dateOfBirth: [''],
      password: ['', passwordValidator],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, { validators: passwordsMatchValidator });
  }

  isInvalid(controlName: 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword' | 'terms'): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted);
  }

  isPasswordMismatch(): boolean {
    return this.registerForm.hasError('passwordMismatch') &&
      (this.registerForm.controls['confirmPassword'].touched || this.submitted);
  }

  passwordError(): string {
    const errors = this.registerForm.controls['password'].errors;
    if (!errors) return '';
    if (errors['required']) return 'Password is required.';
    if (errors['minlength']) return 'Use at least 8 characters.';
    if (errors['uppercase']) return 'Include one uppercase letter.';
    if (errors['lowercase']) return 'Include one lowercase letter.';
    if (errors['number']) return 'Include one number.';
    return 'Include one special character.';
  }

  nameError(controlName: 'firstName' | 'lastName'): string {
    const errors = this.registerForm.controls[controlName].errors;
    if (!errors) return '';
    if (errors['required']) return 'This name is required.';
    if (errors['nameLength']) return 'Use 2 to 50 characters.';
    return 'Use letters, spaces, apostrophes, or hyphens only.';
  }

  submit(): void {
    this.submitted = true;
    this.serverError = '';
    this.successMessage = '';
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { firstName, lastName, email, password } = this.registerForm.getRawValue();

    this.authService.register({
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      password
    }).subscribe({
      next: () => {
        this.finishRegistration();
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 409) {
          this.serverError = 'An account with this email already exists.';
          return;
        }

        this.serverError = 'Unable to save your account to the authentication database.';
      }
    });
  }

  private finishRegistration(): void {
    this.isLoading = false;
    this.successMessage = 'Account created. Redirecting to sign in...';
    this.registerForm.reset();
    this.submitted = false;
    setTimeout(() => void this.router.navigate(['/login']), 700);
  }

}

const passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
};

const nameValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) return { required: true };
  if (value.length < 2 || value.length > 50) return { nameLength: true };
  return /^[\p{L}][\p{L}\s'-]*$/u.test(value) ? null : { invalidName: true };
};

const passwordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '');
  if (!value) return { required: true };
  if (value.length < 8) return { minlength: true };
  if (!/[A-Z]/.test(value)) return { uppercase: true };
  if (!/[a-z]/.test(value)) return { lowercase: true };
  if (!/\d/.test(value)) return { number: true };
  return /[^A-Za-z0-9]/.test(value) ? null : { specialCharacter: true };
};
