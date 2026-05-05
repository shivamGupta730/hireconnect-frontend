import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Interview, PagedResponse } from '../models/models';

export interface ScheduleInterviewDto {
  applicationId: number;
  scheduledAt: string; // ISO datetime string
  meetingLink?: string;
  notes?: string;
}

export interface UpdateInterviewStatusDto {
  status: number; // InterviewStatus enum value
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private apiUrl = `${environment.interviewApiUrl}/Interview`;

  constructor(private http: HttpClient) {}

  // POST /api/Interview  (Recruiter only - requires Shortlisted application)
  scheduleInterview(dto: ScheduleInterviewDto): Observable<Interview> {
    return this.http.post<Interview>(`${this.apiUrl}`, dto);
  }

  // GET /api/Interview/my  (Candidate only)
  getMyInterviews(): Observable<Interview[]> {
    return this.http.get<PagedResponse<Interview>>(`${this.apiUrl}/my`).pipe(
      map(res => res.data || [])
    );
  }

  // GET /api/Interview/job/{jobId}  (Recruiter only)
  getInterviewsByJob(jobId: number): Observable<Interview[]> {
    return this.http.get<PagedResponse<Interview>>(`${this.apiUrl}/job/${jobId}`).pipe(
      map(res => res.data || [])
    );
  }

  // GET /api/Interview/{id}
  getById(id: number): Observable<Interview> {
    return this.http.get<Interview>(`${this.apiUrl}/${id}`);
  }

  // PUT /api/Interview/{id}  (Recruiter only)
  updateStatus(id: number, dto: UpdateInterviewStatusDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dto);
  }

  // DELETE /api/Interview/{id}  (Recruiter only)
  cancelInterview(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
