import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, UserRole, ApiResponse } from '../models/models';
import { Router } from '@angular/router';

// Inline base64 JWT decoder (no external dependency)
function jwtDecode(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// The exact claim URI .NET uses for ClaimTypes.NameIdentifier
const NAME_IDENTIFIER = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
// The exact claim URI .NET uses for ClaimTypes.Role
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.authApiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  public get currentUserValue(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  /**
   * Builds a LoginResponse from a raw backend response + its decoded JWT.
   * Backend LoginResponse: { token, expiresAt, role (number), userId (number) }
   * We also decode the JWT to extract userId from NameIdentifier claim as fallback.
   */
  private buildUserFromResponse(data: LoginResponse): LoginResponse {
    console.log("TOKEN:", data.token);
    const decoded = jwtDecode(data.token);
    console.log("PAYLOAD:", decoded);

    let userId: number | null = data.userId || null;
    if (!userId && decoded) {
      const claim = decoded[NAME_IDENTIFIER] || decoded['nameid'] || decoded['sub'] || decoded['UserId'] || decoded['userId'] || decoded['id'];
      if (claim) userId = parseInt(claim, 10);
    }
    console.log("USER ID:", userId);

    // Role in JWT is stored as the string name e.g. "Recruiter"
    // Backend sets Role enum as UserRole.Recruiter = 2, but JWT stores as "Recruiter" string
    // The response.data.role is already the numeric enum from JSON
    let role = data.role;
    if (!role && decoded) {
      const roleClaim = decoded[ROLE_CLAIM] || decoded['role'];
      if (roleClaim === 'Recruiter') role = UserRole.Recruiter;
      else if (roleClaim === 'Candidate') role = UserRole.Candidate;
      else if (roleClaim === 'Admin') role = UserRole.Admin;
    }

    return { ...data, userId: userId as number, role };
  }

  private getStoredUser(): LoginResponse | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      console.log("TOKEN:", token);
      const decoded = jwtDecode(token);
      if (!decoded) return null;

      console.log("PAYLOAD:", decoded);

      // Check expiry
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }

      const userStr = localStorage.getItem('user');
      let stored: LoginResponse = { token, role: 0 as UserRole, userId: 0, expiresAt: new Date(decoded.exp * 1000).toISOString() };
      if (userStr) {
        try {
          stored = { ...stored, ...JSON.parse(userStr) };
        } catch {}
      }

      // Prefer stored.userId, otherwise try to extract from token
      let userId: number | null = stored.userId || null;
      if (!userId) {
        const claim = decoded[NAME_IDENTIFIER] || decoded['nameid'] || decoded['sub'] || decoded['UserId'] || decoded['userId'] || decoded['id'];
        if (claim) userId = parseInt(claim, 10);
      }
      stored.userId = userId as number;
      
      let role = stored.role;
      if (!role) {
         const roleClaim = decoded[ROLE_CLAIM] || decoded['role'];
         if (roleClaim === 'Recruiter') role = UserRole.Recruiter;
         else if (roleClaim === 'Candidate') role = UserRole.Candidate;
         else if (roleClaim === 'Admin') role = UserRole.Admin;
      }
      stored.role = role;

      return stored;
    } catch {
      return null;
    }
  }

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data?.token) {
          const user = this.buildUserFromResponse(response.data);
          localStorage.setItem('token', user.token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        if (response.success && response.data?.token) {
          const user = this.buildUserFromResponse(response.data);
          localStorage.setItem('token', user.token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): UserRole | null {
    return this.currentUserValue?.role ?? null;
  }

  /** Returns the numeric userId from JWT (NameIdentifier claim) */
  getUserId(): number | null {
    const userId = this.currentUserValue?.userId;
    if (userId !== undefined && userId !== null && !isNaN(userId)) {
      return userId;
    }
    return null;
  }
}
