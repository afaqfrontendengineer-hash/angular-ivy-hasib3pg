import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'https://data-integration-qrk9.onrender.com';

  // Tracks login status
  private loggedInSubject = new BehaviorSubject<boolean>(
    !!localStorage.getItem('token')
  );
  loggedIn$ = this.loggedInSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ✅ Login via backend API
  login(email: string, password: string): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/api/login`, { email, password })
      .pipe(
        tap({
          next: (res: any) => {
            // Save JWT token in localStorage
            localStorage.setItem('token', res.token);
            this.loggedInSubject.next(true);
          },
          error: () => {
            // Clear token if login fails
            localStorage.removeItem('token');
            this.loggedInSubject.next(false);
          },
        })
      );
  }

  // ✅ Logout
  logout(): void {
    localStorage.removeItem('token');
    this.loggedInSubject.next(false);
  }

  // ✅ Check if user is logged in
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Optional: Get token for API requests
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
