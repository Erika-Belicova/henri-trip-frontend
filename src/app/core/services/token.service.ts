import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private readonly ACCESS_TOKEN_KEY = 'accessToken';

  // save access token to localStorage
  saveAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  // get access token from localStorage
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // remove access token from localStorage
  clearToken(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
  }

  // check whether an access token exists and has not expired
  isAccessTokenValid(): boolean {
    const token = this.getAccessToken();

    if (!token) {
      return false;
    }

    try {
      // decode the JWT payload
      const payload = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      );

      // check whether the expiration timestamp is still valid
      if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
        this.clearToken(); // clear token if not valid
        return false;
      }

      return true;

    } catch {
      // remove malformed or unreadable tokens
      this.clearToken();
      return false;
    }
  }

}