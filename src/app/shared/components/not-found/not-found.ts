import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  imports: [],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  // navigate to main page based on authentication
  navigateHome(): void {
    this.router.navigate([this.authService.isAuthenticated() ? '/guides' : '/login']);
  }

}