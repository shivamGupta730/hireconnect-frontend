import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobService } from '../../../core/services/job.service';
import { ApplicationService } from '../../../core/services/application.service';
import { InterviewService } from '../../../core/services/interview.service';
import { Job, Application } from '../../../core/models/models';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dashboard-container animate-fade">
      <div class="flex justify-between items-center mb-4">
        <h2>Recruiter Dashboard</h2>
        <button class="btn btn-primary" (click)="openPostJobModal()">Post a Job</button>
      </div>
      
      <div class="glass-panel summary-cards flex gap-4 mb-4">
        <div class="card">
          <h3>Active Listings</h3>
          <p class="stat">{{ activeJobCount }}</p>
        </div>
        <div class="card">
          <h3>Total Views</h3>
          <p class="stat">{{ totalViews }}</p>
        </div>
      </div>

      <div class="glass-panel">
        <h3 class="mb-2">Your Posted Jobs</h3>
        <div *ngIf="loading">Loading jobs...</div>
        <table class="jobs-table w-full" *ngIf="!loading && myJobs.length > 0">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Applications</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let job of myJobs">
              <td>{{ job.title }}</td>
              <td><span class="badge" [ngClass]="{'active': job.status === 1}">{{ job.status === 1 ? 'Active' : (job.status === 3 ? 'Closed' : 'Inactive') }}</span></td>
              <td>{{ job.applicationCount }}</td>
              <td>
                <button class="btn btn-secondary btn-sm" (click)="viewApplications(job)">View Applications</button>
                <button class="btn btn-sm" [ngClass]="job.status === 1 ? 'btn-danger' : 'btn-primary'" style="margin-left: 8px;" (click)="toggleJobStatus(job)">
                  {{ job.status === 1 ? 'Deactivate' : 'Activate' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="!loading && myJobs.length === 0">
          <p>You haven't posted any jobs yet.</p>
        </div>
      </div>
      
      <!-- Post Job Modal Overlay -->
      <div class="modal-overlay" *ngIf="isModalOpen">
        <div class="modal-content glass-panel animate-slide-down">
          <h3>Post a New Job</h3>
          <form [formGroup]="postJobForm" (ngSubmit)="submitJob()">
            
            <div class="form-group mt-4">
              <label class="form-label">Job Title*</label>
              <input type="text" class="form-control" formControlName="title" placeholder="Software Engineer" />
            </div>
            
            <div class="form-group">
              <label class="form-label">Category*</label>
              <input type="text" class="form-control" formControlName="category" placeholder="IT, Design, etc." />
            </div>

            <div class="form-group flex gap-4">
              <div class="w-full">
                <label class="form-label">Location*</label>
                <input type="text" class="form-control" formControlName="location" placeholder="City, Country" />
              </div>
              <div class="w-full">
                <label class="form-label">Job Type*</label>
                <select class="form-control" formControlName="type">
                  <option value="FullTime">Full Time</option>
                  <option value="PartTime">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            <div class="form-group flex gap-4">
              <div class="w-full">
                <label class="form-label">Min Salary*</label>
                <input type="number" class="form-control" formControlName="salaryMin" placeholder="50000" />
              </div>
              <div class="w-full">
                <label class="form-label">Max Salary</label>
                <input type="number" class="form-control" formControlName="salaryMax" placeholder="80000" />
              </div>
            </div>

            <div class="form-group flex gap-4">
               <label class="flex items-center gap-2">
                 <input type="checkbox" formControlName="isRemote" />
                 Is Remote?
               </label>
            </div>

            <div class="form-group">
              <label class="form-label">Skills (comma separated)</label>
              <input type="text" class="form-control" formControlName="skills" placeholder="Angular, C#, SQL" />
            </div>

            <div class="form-group">
              <label class="form-label">Description*</label>
              <textarea class="form-control" formControlName="description" rows="4" placeholder="Detailed job description..."></textarea>
            </div>
            
            <div class="flex justify-between gap-4 mt-4">
              <button type="button" class="btn btn-secondary w-full" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary w-full" [disabled]="postJobForm.invalid || isPosting">
                {{ isPosting ? 'Posting...' : 'Create Job' }}
              </button>
            </div>
            
          </form>
        </div>
      </div>
      
      <!-- View Applications Modal Overlay -->
      <div class="modal-overlay" *ngIf="isAppModalOpen">
        <div class="modal-content glass-panel animate-slide-down" style="max-width: 800px;">
          <div class="flex justify-between items-center mb-4">
            <h3>Applications for {{ activeJob?.title }}</h3>
            <button class="btn btn-secondary btn-sm" (click)="closeAppModal()">Close</button>
          </div>
          
          <div *ngIf="loadingApps">Loading...</div>
          <div *ngIf="!loadingApps && jobApplications.length === 0">No applications yet.</div>
          
          <table class="jobs-table w-full" *ngIf="!loadingApps && jobApplications.length > 0">
            <thead>
              <tr>
                <th>Candidate Details</th>
                <th>Applied At</th>
                <th>Current Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let app of jobApplications">
                <td>
                  <strong>{{ app.candidateData?.fullName || ('Candidate #' + app.candidateId) }}</strong><br/>
                  <small style="color:var(--text-muted)">{{ app.candidateData?.email || 'No email' }}</small><br/>
                  <small *ngIf="app.candidateData?.skills">Skills: {{ app.candidateData?.skills }}</small>
                  <div *ngIf="app.candidateData?.resumeUrl || app.resumeUrl" class="mt-1">
                    <a [href]="app.candidateData?.resumeUrl || app.resumeUrl" target="_blank" class="btn btn-secondary btn-sm">View Resume</a>
                  </div>
                </td>
                <td>{{ app.appliedAt | date }}</td>
                <td><span class="badge" [ngClass]="'status-' + getStatusName(app.status)">{{ getStatusName(app.status) }}</span></td>
                <td class="action-cell">
                  <select class="form-control" style="padding: 0.25rem; margin-bottom:0.5rem;" (change)="updateAppStatus(app, $event)" [value]="app.status">
                    <option [value]="1" [disabled]="app.status > 1">Applied</option>
                    <option [value]="2" [disabled]="app.status > 2 || app.status < 1">Shortlisted</option>
                    <option [value]="3" [disabled]="app.status > 3 || app.status < 2">Interview Scheduled</option>
                    <option [value]="4" [disabled]="app.status < 3">Offered</option>
                    <option [value]="5" [disabled]="app.status < 3">Rejected</option>
                  </select>
                  <button class="btn btn-primary btn-sm" 
                          *ngIf="app.status === 2"
                          (click)="openScheduleModal(app)">
                    📅 Schedule Interview
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Schedule Interview Modal -->
      <div class="modal-overlay" *ngIf="isInterviewModalOpen">
        <div class="modal-content glass-panel animate-slide-down">
          <h3>Schedule Interview</h3>
          <p class="mb-4" style="color:var(--text-muted)">Application #{{ selectedAppForInterview?.id }} — Candidate #{{ selectedAppForInterview?.candidateId }}</p>
          <form [formGroup]="scheduleForm" (ngSubmit)="submitInterview()">
            <div class="form-group">
              <label class="form-label">Date & Time*</label>
              <input type="datetime-local" class="form-control" formControlName="scheduledAt" />
            </div>
            <div class="form-group">
              <label class="form-label">Meeting Link</label>
              <input type="url" class="form-control" formControlName="meetingLink" placeholder="https://meet.google.com/..." />
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-control" formControlName="notes" rows="3" placeholder="Interview instructions..."></textarea>
            </div>
            <div class="flex gap-4 mt-4">
              <button type="button" class="btn btn-secondary w-full" (click)="closeInterviewModal()">Cancel</button>
              <button type="submit" class="btn btn-primary w-full" [disabled]="scheduleForm.invalid || isScheduling">
                {{ isScheduling ? 'Scheduling...' : 'Confirm Interview' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    .summary-cards .card {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
    }
    .stat {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--secondary);
    }
    .jobs-table {
      text-align: left;
      border-collapse: collapse;
    }
    .jobs-table th, .jobs-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .btn-sm {
      padding: 0.25rem 0.75rem;
      font-size: 0.875rem;
    }
    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      background: var(--surface);
    }
    .badge.active {
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1050;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 2rem 1rem;
      overflow-y: auto;
    }
    .modal-content {
      width: 100%;
      max-width: 600px;
      margin: auto;
    }
  `]
})
export class DashboardComponent implements OnInit {
  myJobs: Job[] = [];
  loading = true;

  isModalOpen = false;
  isPosting = false;
  postJobForm: FormGroup;
  
  totalViews = 0;
  activeJobCount = 0;
  
  isAppModalOpen = false;
  loadingApps = false;
  jobApplications: Application[] = [];
  activeJob: Job | null = null;

  isInterviewModalOpen = false;
  isScheduling = false;
  selectedAppForInterview: Application | null = null;
  scheduleForm: FormGroup;

  constructor(
    private jobService: JobService,
    private applicationService: ApplicationService,
    private interviewService: InterviewService,
    private notificationService: NotificationService,
    private profileService: ProfileService,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.postJobForm = this.fb.group({
      title: ['', Validators.required],
      category: ['', Validators.required],
      type: ['FullTime', Validators.required],
      location: ['', Validators.required],
      isRemote: [false],
      salaryMin: [null, [Validators.required, Validators.min(0)]],
      salaryMax: [null],
      currency: ['USD'],
      skills: [''],
      description: ['', Validators.required]
    });
    this.scheduleForm = this.fb.group({
      scheduledAt: ['', Validators.required],
      meetingLink: [''],
      notes: ['']
    });
  }

  ngOnInit() {
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error("User ID missing");
      this.router.navigate(['/auth/login']);
      return;
    }
    this.loadMyJobs();
  }

  loadMyJobs() {
    this.jobService.getJobsByRecruiter().subscribe({
      next: res => {
        this.myJobs = res || [];
        this.activeJobCount = this.myJobs.filter(j => j.status === 1).length;
        this.totalViews = this.myJobs.reduce((acc, job) => acc + (job.viewCount || 0), 0);
        console.log('Loaded recruiter jobs:', this.myJobs);
        this.loading = false;
      },
      error: (err) => {
        console.error('Load jobs error:', err);
        this.loading = false;
      }
    });
  }

  openPostJobModal() {
    this.isModalOpen = true;
    this.postJobForm.reset({
      type: 'FullTime',
      isRemote: false,
      currency: 'USD'
    });
  }

  closeModal() {
    this.isModalOpen = false;
    this.postJobForm.reset();
  }

  submitJob() {
    if (this.postJobForm.invalid) return;

    const formValue = this.postJobForm.value;
    if (formValue.salaryMax && formValue.salaryMin > formValue.salaryMax) {
      this.notificationService.showToast('Max salary must be >= min salary.', 'error');
      return;
    }

    this.isPosting = true;

    // type is already a string value from the select (e.g. 'FullTime')
    const payload = {
      title: formValue.title,
      category: formValue.category,
      type: formValue.type,
      location: formValue.location,
      isRemote: formValue.isRemote || false,
      salaryMin: Number(formValue.salaryMin),
      salaryMax: formValue.salaryMax ? Number(formValue.salaryMax) : undefined,
      currency: formValue.currency || 'USD',
      skills: formValue.skills
        ? formValue.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : [],
      description: formValue.description
    };

    console.log('Creating job with payload:', payload);

    this.jobService.createJob(payload).subscribe({
      next: (res) => {
        console.log('Job created:', res);
        this.notificationService.showToast('Job posted successfully!', 'success');
        this.closeModal();
        this.isPosting = false;
        this.loadMyJobs();
      },
      error: err => {
        this.isPosting = false;
        console.error('Create job error:', err);
        this.notificationService.showToast(err?.error?.message || 'Failed to post job. Check details.', 'error');
      }
    });
  }

  viewApplications(job: Job) {
    this.activeJob = job;
    this.isAppModalOpen = true;
    this.loadingApps = true;
    this.applicationService.getApplicationsForJob(job.id).subscribe({
      next: res => {
        const apps = res || [];
        if (apps.length === 0) {
          this.jobApplications = [];
          this.loadingApps = false;
          return;
        }

        // Fetch candidate details for each application
        const appObservables = apps.map(app => 
          this.profileService.getCandidateProfile(app.candidateId).pipe(
            map(profileRes => {
              if (profileRes && profileRes.success && profileRes.data) {
                 app.candidateData = profileRes.data.candidateProfile || profileRes.data;
              } else {
                 app.candidateData = profileRes;
              }
              return app;
            }),
            catchError(() => {
              app.candidateData = null; // Provide safe fallback on 404
              return of(app);
            })
          )
        );

        forkJoin(appObservables).subscribe({
          next: enrichedApps => {
            this.jobApplications = enrichedApps;
            this.loadingApps = false;
          },
          error: () => {
             this.jobApplications = apps;
             this.loadingApps = false;
          }
        });
      },
      error: () => this.loadingApps = false
    });
  }

  closeAppModal() {
    this.isAppModalOpen = false;
    this.activeJob = null;
    this.jobApplications = [];
  }

  toggleJobStatus(job: Job) {
    const newStatus = job.status === 1 ? 3 : 1; // 1 = Active, 3 = Closed
    this.jobService.updateJobStatus(job.id, newStatus).subscribe({
      next: () => {
        job.status = newStatus;
        this.activeJobCount = this.myJobs.filter(j => j.status === 1).length;
        this.notificationService.showToast(`Job ${newStatus === 1 ? 'activated' : 'deactivated'} successfully!`, 'success');
      },
      error: err => {
        console.error('Toggle status error:', err);
        this.notificationService.showToast('Failed to update job status.', 'error');
      }
    });
  }

  updateAppStatus(app: Application, event: Event) {
    const target = (event.target as HTMLSelectElement);
    const newStatus = Number(target.value);
    
    if (newStatus === app.status) return;

    this.applicationService.updateStatus(app.id, { status: newStatus, notes: undefined }).subscribe({
      next: () => {
        this.notificationService.showToast('Status updated', 'success');
        app.status = newStatus; // Update locally without refreshing whole list
      },
      error: err => {
        console.error('Update status error:', err);
        target.value = String(app.status); // Revert select
        this.notificationService.showToast(err?.error?.message || 'Invalid status transition', 'error');
      }
    });
  }

  openScheduleModal(app: Application) {
    this.selectedAppForInterview = app;
    this.isInterviewModalOpen = true;
    this.scheduleForm.reset();
  }

  closeInterviewModal() {
    this.isInterviewModalOpen = false;
    this.selectedAppForInterview = null;
    this.scheduleForm.reset();
  }

  submitInterview() {
    if (!this.selectedAppForInterview || this.scheduleForm.invalid) return;
    this.isScheduling = true;

    const fv = this.scheduleForm.value;
    const payload = {
      applicationId: this.selectedAppForInterview.id,
      scheduledAt: new Date(fv.scheduledAt).toISOString(),
      meetingLink: fv.meetingLink || undefined,
      notes: fv.notes || undefined
    };

    const candidateId = this.selectedAppForInterview.candidateId;
    const jobTitle = this.activeJob?.title || 'a job';

    this.interviewService.scheduleInterview(payload).subscribe({
      next: () => {
        this.notificationService.showToast('Interview scheduled!', 'success');
        this.isScheduling = false;
        this.closeInterviewModal();
        
        // Optional fallback: notify candidate directly
        this.notificationService.createNotification({
          userId: candidateId,
          message: `Your interview for ${jobTitle} has been scheduled.`,
          type: 'Interview'
        }).subscribe({
          error: e => console.log('Optional notification failed:', e)
        });

        // Refresh applications to see updated status
        if (this.activeJob) this.viewApplications(this.activeJob);
      },
      error: err => {
        this.isScheduling = false;
        this.notificationService.showToast(
          err?.error?.message || 'Failed to schedule interview', 'error'
        );
      }
    });
  }

  getStatusName(status: number): string {
    const statuses: Record<number, string> = {
      1: 'Applied',
      2: 'Shortlisted',
      3: 'InterviewScheduled',
      4: 'Offered',
      5: 'Rejected'
    };
    return statuses[status] || 'Applied';
  }
}
