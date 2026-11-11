import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { toErrorMessage } from '../../../../core/error-message';
import type { LoginRequestDTO } from '../../../../shared/interfaces/login-request-dto';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submitted = false;
  errorMessage = '';
  isLoading = false;

  // authenticate the user and redirect to the guide list
  onSubmit(): void {
    this.submitted = true;

    if (this.loginForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginRequestDTO = this.loginForm.getRawValue();

    this.authService.login(credentials)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.router.navigate(['/guides']);
        },
        error: (error: unknown) => {
          this.errorMessage = toErrorMessage(error);
        }
      });
  }
}
