import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Job, PagedResponse, CreateJobDto } from '../models/models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class JobService {
  private apiUrl = `${environment.jobApiUrl}/Job`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // GET /api/Job - Public
  searchJobs(params: any): Observable<PagedResponse<Job>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(k => {
      if (params[k] !== null && params[k] !== undefined) {
        httpParams = httpParams.set(k, params[k]);
      }
    });
    return this.http.get<PagedResponse<Job>>(`${this.apiUrl}`, { params: httpParams });
  }

  // GET /api/Job/{id} - Public
  getJobById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // POST /api/Job - Recruiter only
  createJob(job: CreateJobDto): Observable<Job> {
    return this.http.post<Job>(`${this.apiUrl}`, job);
  }

  // PUT /api/Job/{id} - Recruiter only
  updateJob(id: number, job: any): Observable<Job> {
    return this.http.put<Job>(`${this.apiUrl}/${id}`, job);
  }

  // GET /api/Job/recruiter/{recruiterId} - Recruiter only
  // Uses the EXACT userId from JWT (NameIdentifier claim)
  getJobsByRecruiter(): Observable<Job[]> {
    const userId = this.authService.getUserId();
    console.log("API CALL /api/Job/recruiter/{recruiterId} with ID:", userId);
    if (userId === null || userId === undefined || isNaN(userId)) {
      console.error("User ID missing");
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }
    return this.http.get<PagedResponse<Job>>(`${this.apiUrl}/recruiter/${userId}`).pipe(
      map(res => res?.data || [])
    );
  }

  // DELETE /api/Job/{id}
  deleteJob(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // PATCH /api/Job/{id}/status
  updateJobStatus(id: number, status: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
  }
}
