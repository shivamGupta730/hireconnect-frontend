import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = `${environment.profileApiUrl}/profile`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  getCandidateProfile(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidate/${id}`);
  }

  updateCandidateProfile(data: any): Observable<any> {
    // Handling generic wrapper or standard endpoint depending on API
    return this.http.put(`${this.apiUrl}/candidate`, data);
  }

  updateRecruiterProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/recruiter`, data);
  }
}
