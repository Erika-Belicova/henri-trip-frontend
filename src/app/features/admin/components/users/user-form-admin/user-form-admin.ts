import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { UserService } from '../../../../../core/services/user.service';
import { toErrorMessage } from '../../../../../core/error-message';

import { UserRole } from '../../../../../shared/enumerations/user-role';
import { CreateUserRequestDTO } from '../../../../../shared/interfaces/user/create-user-request-dto';
import { UserResponseDTO } from '../../../../../shared/interfaces/user/user-response-dto';

@Component({
  selector: 'app-user-form-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './user-form-admin.html',
  styleUrl: './user-form-admin.scss',
})
export class UserFormAdmin {

  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  isSaving = false;
  errorMessage = '';

  readonly userRoles = Object.values(UserRole);

  // form used exclusively for user creation
  form = this.fb.group({
    email: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(255)
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(8)
    ]],
    role: [UserRole.USER, Validators.required]
  });

  // create a user and return to the user list
  onSubmit(): void {
    if (this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const request = this.form.getRawValue() as CreateUserRequestDTO;

    this.userService.createUser(request).subscribe({
      next: (user: UserResponseDTO) => {
        this.isSaving = false;
        this.router.navigate(['/admin/users']);
      },
      error: (err: unknown) => {
        this.errorMessage = toErrorMessage(err);
        this.isSaving = false;
      }
    });
  }

  // return to the user list without creating an account
  cancel(): void {
    this.router.navigate(['/admin/users']);
  }
}
