import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Application, PagedResponse, CreateApplicationDto, UpdateApplicationStatusDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  // Controller route: /api/Application (matches [Route("api/[controller]")])
  private apiUrl = `${environment.applicationApiUrl}/Application`;

  constructor(private http: HttpClient) {}

  // POST /api/Application - Candidate only
  applyForJob(data: CreateApplicationDto): Observable<Application> {
    return this.http.post<Application>(`${this.apiUrl}`, data);
  }

  // GET /api/Application/my - Candidate only
  getMyApplications(): Observable<Application[]> {
    return this.http.get<PagedResponse<Application>>(`${this.apiUrl}/my`).pipe(
      map(res => res?.data || [])
    );
  }

  // GET /api/Application/job/{jobId} - Recruiter only
  getApplicationsForJob(jobId: number): Observable<Application[]> {
    return this.http.get<PagedResponse<Application>>(`${this.apiUrl}/job/${jobId}`).pipe(
      map(res => res?.data || [])
    );
  }

  // PUT /api/Application/{id} - Recruiter only (update status)
  updateStatus(id: number, data: UpdateApplicationStatusDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }
}
