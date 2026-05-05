import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification, ApiResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  // Correct base: /api/Notification (controller name casing)
  private apiUrl = `${environment.notificationApiUrl}/Notification`;

  private toastSubject = new BehaviorSubject<{message: string, type: string} | null>(null);
  public toast$ = this.toastSubject.asObservable();

  constructor(private http: HttpClient) {}

  // GET /api/Notification/{userId}
  getNotifications(userId: number): Observable<ApiResponse<Notification[]>> {
    return this.http.get<ApiResponse<Notification[]>>(`${this.apiUrl}/${userId}`);
  }

  // POST /api/Notification
  createNotification(payload: { userId: number, message: string, type: string }): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  // GET /api/Notification/{userId}/unread-count
  getUnreadCount(userId: number): Observable<number> {
    return this.http.get<ApiResponse<number>>(`${this.apiUrl}/${userId}/unread-count`).pipe(
      map(res => res.data ?? 0)
    );
  }

  // PUT /api/Notification/read/{id}
  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/read/${id}`, {});
  }

  // PUT /api/Notification/read-all/{userId}
  markAllAsRead(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/read-all/${userId}`, {});
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastSubject.next({ message, type });
    setTimeout(() => {
      this.toastSubject.next(null);
    }, 4000);
  }
}
