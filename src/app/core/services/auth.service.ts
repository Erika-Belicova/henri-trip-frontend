import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { AuthResponseDTO } from '../../shared/interfaces/auth-response-dto';
import { LoginRequestDTO } from '../../shared/interfaces/login-request-dto';
import { UserResponseDTO } from '../../shared/interfaces/user-response-dto';
import { UserRole } from '../../shared/enumerations/user-role';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly USER_KEY = 'currentUser';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) {}

  // authenticate and store the access token and the user returned by the API
  login(credentials: LoginRequestDTO): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(
      `${environment.apiUrl}/auth/login`, credentials
    ).pipe(
      tap(response => {
        this.tokenService.saveAccessToken(response.accessToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
      })
    );
  }

  // clear the session and go back to the login page
  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  // get the user stored at login, or null if there is none
  getCurrentUser(): UserResponseDTO | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) as UserResponseDTO : null;
    } catch {
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === UserRole.ADMIN;
  }

  isAuthenticated(): boolean {
    const isValid = this.tokenService.isAccessTokenValid();
    if (!isValid) { // if not valid clear session
      this.clearSession();
    }
    return isValid;
  }

  // clear the access token and stored user information
  clearSession(): void {
    this.tokenService.clearToken();
    localStorage.removeItem(this.USER_KEY);
  }

}