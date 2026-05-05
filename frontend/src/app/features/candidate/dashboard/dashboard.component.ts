import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobService } from '../../../core/services/job.service';
import { ApplicationService } from '../../../core/services/application.service';
import { InterviewService } from '../../../core/services/interview.service';
import { Job, Application, Interview, CreateApplicationDto } from '../../../core/models/models';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dashboard-container animate-fade">
      <h2 class="mb-4">Candidate Dashboard</h2>
      
      <div class="glass-panel summary-cards flex gap-4 mb-4">
        <div class="card">
          <h3>Applications</h3>
          <p class="stat">{{ applications.length }}</p>
        </div>
        <div class="card">
          <h3>Jobs Explored</h3>
          <p class="stat">{{ availableJobs?.totalCount || 0 }}</p>
        </div>
      </div>

      <div class="glass-panel">
        <h3 class="mb-2">Available Jobs</h3>
        <div *ngIf="loadingJobs">Loading jobs...</div>
        <div *ngIf="!loadingJobs && availableJobs?.data?.length === 0">No jobs available at the moment.</div>
        
        <div class="job-list" *ngIf="!loadingJobs && availableJobs?.data?.length">
          <div class="job-card" *ngFor="let job of availableJobs?.data">
            <div>
              <h4>{{ job.title }}</h4>
              <p>{{ job.location }} | {{ job.type === 'FullTime' ? 'Full Time' : job.type }}</p>
              <p>{{ job.currency }} {{ job.salaryMin }} - {{ job.salaryMax }}</p>
            </div>
            <button class="btn mt-4 w-full" 
                    [ngClass]="hasApplied(job.id) ? 'btn-secondary' : 'btn-primary'"
                    [disabled]="hasApplied(job.id)"
                    (click)="openApplyModal(job)">
              {{ hasApplied(job.id) ? 'Applied \u2713' : 'Apply Now' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Upcoming Interviews Section -->
      <div class="glass-panel mt-4" *ngIf="upcomingInterviews.length > 0">
        <h3 class="mb-2">Upcoming Interviews</h3>
        <div *ngIf="loadingInterviews">Loading interviews...</div>
        <div class="application-list" *ngIf="!loadingInterviews">
          <div class="application-card" *ngFor="let interview of upcomingInterviews">
            <h4>{{ (jobMap[interview.jobId] && jobMap[interview.jobId] !== '__loading__') ? jobMap[interview.jobId].title : 'Loading Job Detail...' }}</h4>
            <p *ngIf="jobMap[interview.jobId] && jobMap[interview.jobId] !== '__loading__'">{{ jobMap[interview.jobId].location }}</p>
            
            <p class="mt-2"><strong>Scheduled At:</strong> {{ interview.scheduledAt | date:'medium' }}</p>
            <p *ngIf="interview.notes"><strong>Notes:</strong> {{ interview.notes }}</p>
            
            <div class="mt-4 flex gap-4 items-center">
              <span class="status-badge" [ngClass]="{'status-Applied': getStatus(interview) === 'Scheduled', 'status-Rejected': getStatus(interview) === 'Ended'}">
                {{ getStatus(interview) }}
              </span>
              <a *ngIf="interview.meetingLink && getStatus(interview) === 'Scheduled'" [href]="interview.meetingLink" target="_blank" class="btn btn-primary btn-sm">
                Join Meeting
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Ended Interviews Section -->
      <div class="glass-panel mt-4" *ngIf="endedInterviews.length > 0">
        <h3 class="mb-2">Ended Interviews</h3>
        <div class="application-list">
          <div class="application-card" *ngFor="let interview of endedInterviews">
            <h4>{{ (jobMap[interview.jobId] && jobMap[interview.jobId] !== '__loading__') ? jobMap[interview.jobId].title : 'Loading Job Detail...' }}</h4>
            <p *ngIf="jobMap[interview.jobId] && jobMap[interview.jobId] !== '__loading__'">{{ jobMap[interview.jobId].location }}</p>
            
            <p class="mt-2"><strong>Scheduled At:</strong> {{ interview.scheduledAt | date:'medium' }}</p>
            <p *ngIf="interview.notes"><strong>Notes:</strong> {{ interview.notes }}</p>
            
            <div class="mt-4 flex gap-4 items-center">
              <span class="status-badge status-Rejected">
                Ended
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- My Applications Section -->
      <div class="glass-panel mt-4" *ngIf="applications.length > 0">
        <h3 class="mb-2">My Applications</h3>
        <div class="application-list">
          <div class="application-card flex justify-between items-center" *ngFor="let app of applications">
            <div>
              <h4>{{ (jobMap[app.jobId] && jobMap[app.jobId] !== '__loading__') ? jobMap[app.jobId].title : 'Loading Job Detail...' }}</h4>
              <p *ngIf="jobMap[app.jobId] && jobMap[app.jobId] !== '__loading__'">{{ jobMap[app.jobId].location }} | {{ jobMap[app.jobId].currency }} {{ jobMap[app.jobId].salaryMin }} - {{ jobMap[app.jobId].salaryMax }}</p>
              <p class="text-sm mt-1" style="color:var(--text-muted)">Applied: {{ app.appliedAt | date:'mediumDate' }}</p>
            </div>
            <span class="status-badge status-{{ getStatusName(app.status) }}">{{ getStatusName(app.status) }}</span>
          </div>
        </div>
      </div>
      
      <!-- Apply Modal Overlay -->
      <div class="modal-overlay" *ngIf="isModalOpen">
        <div class="modal-content glass-panel animate-slide-down">
          <h3>Apply for {{ selectedJob?.title }}</h3>
          <form [formGroup]="applyForm" (ngSubmit)="submitApplication()">
            <div class="form-group mt-4">
              <label class="form-label">Cover Letter</label>
              <textarea class="form-control" formControlName="coverLetter" rows="4" placeholder="Why are you a good fit?"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Resume URL</label>
              <input type="url" class="form-control" formControlName="resumeUrl" placeholder="Link to your resume" />
            </div>
            <div class="form-group flex gap-4">
              <div class="w-full">
                <label class="form-label">Expected Salary</label>
                <input type="number" class="form-control" formControlName="expectedSalary" placeholder="Expected Salary" />
              </div>
            </div>
            
            <div class="flex justify-between gap-4 mt-4">
              <button type="button" class="btn btn-secondary w-full" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary w-full" [disabled]="applyForm.invalid || isApplying">
                {{ isApplying ? 'Submitting...' : 'Submit Application' }}
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
      color: var(--primary);
    }
    .job-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .job-card {
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 1.5rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .job-card h4 {
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }
    .application-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 2rem;
    }
    .application-card {
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 1.5rem;
      border-radius: 8px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 600;
      background: var(--border);
    }
    .status-Applied { background: #3b82f6; color: white; }
    .status-Shortlisted { background: #8b5cf6; color: white; }
    .status-InterviewScheduled { background: #f59e0b; color: white; }
    .status-Offered { background: #10b981; color: white; }
    .status-Rejected { background: #ef4444; color: white; }
    
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
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-content {
      width: 100%;
      max-width: 500px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  availableJobs: { data: Job[]; totalCount: number } | null = null;
  applications: (Application & { jobData?: Job })[] = [];
  interviews: (Interview & { jobData?: Job })[] = [];
  
  loadingJobs = true;
  loadingInterviews = true;
  
  isModalOpen = false;
  selectedJob: Job | null = null;
  applyForm: FormGroup;
  isApplying = false;

  constructor(
    private jobService: JobService,
    private applicationService: ApplicationService,
    private interviewService: InterviewService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.applyForm = this.fb.group({
      coverLetter: [''],
      resumeUrl: [''],
      expectedSalary: [null]
    });
  }

  ngOnInit() {
    this.loadJobs();
    this.loadApplications();
    this.loadInterviews();
  }

  loadJobs() {
    this.jobService.searchJobs({ page: 1, pageSize: 100 }).subscribe({
      next: res => {
        this.availableJobs = res;
        this.loadingJobs = false;
      },
      error: () => this.loadingJobs = false
    });
  }

  jobMap: { [key: number]: any } = {};

  loadJob(jobId: number) {
    // '__loading__' sentinel prevents duplicate in-flight requests
    if (this.jobMap[jobId] !== undefined) return;

    this.jobMap[jobId] = '__loading__'; // in-flight marker

    console.log('[loadJob] fetching jobId:', jobId);

    this.jobService.getJobById(jobId).subscribe({
      next: (res) => {
        // Backend returns JobResponseDto directly (no wrapper) → store res itself
        console.log('[loadJob] response for jobId', jobId, ':', res);
        this.jobMap[jobId] = res;
      },
      error: (err) => {
        console.error('[loadJob] error for jobId', jobId, ':', err);
        // Reset to undefined so a retry is possible on next render cycle
        delete this.jobMap[jobId];
      }
    });
  }

  loadApplications() {
    this.applicationService.getMyApplications().subscribe({
      next: res => {
        this.applications = res || [];
        this.applications.forEach(app => {
          if (app.jobId) {
            this.loadJob(app.jobId);
          }
        });
      },
      error: err => console.error('Failed to load applications', err)
    });
  }

  hasApplied(jobId: number): boolean {
    return this.applications.some(a => a.jobId === jobId);
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

  getStatus(interview: Interview): string {
    const now = new Date();
    const scheduled = new Date(interview.scheduledAt);
    return now >= scheduled ? 'Ended' : 'Scheduled';
  }

  upcomingInterviews: any[] = [];
  endedInterviews: any[] = [];

  loadInterviews() {
    this.interviewService.getMyInterviews().subscribe({
      next: res => {
        this.interviews = res || [];
        this.interviews.forEach(interview => {
          if (interview.jobId) {
            this.loadJob(interview.jobId);
          }
        });
        
        const now = new Date();
        this.upcomingInterviews = this.interviews.filter(i => {
          return now < new Date(i.scheduledAt);
        });

        this.endedInterviews = this.interviews.filter(i => {
          return now >= new Date(i.scheduledAt);
        });

        this.loadingInterviews = false;
      },
      error: () => this.loadingInterviews = false
    });
  }

  openApplyModal(job: Job) {
    if (this.hasApplied(job.id)) return;
    this.selectedJob = job;
    this.isModalOpen = true;
    this.applyForm.reset();
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedJob = null;
    this.applyForm.reset();
  }

  submitApplication() {
    if (!this.selectedJob) return;
    
    // Exact fields from CreateApplicationDto
    const payload: CreateApplicationDto = {
      jobId: this.selectedJob.id,
      coverLetter: this.applyForm.value.coverLetter || undefined,
      resumeUrl: this.applyForm.value.resumeUrl || undefined,
      expectedSalary: this.applyForm.value.expectedSalary || undefined
    };
    
    this.isApplying = true;
    this.applicationService.applyForJob(payload).subscribe({
      next: () => {
        this.notificationService.showToast('Applied successfully!', 'success');
        this.loadApplications();
        this.isApplying = false;
        this.closeModal();
      },
      error: err => {
        const errorMsg = err?.error?.message || err?.error || 'Failed to apply';
        this.notificationService.showToast(typeof errorMsg === 'string' ? errorMsg : 'You have already applied', 'error');
        this.isApplying = false;
        // Even if failed due to existing application, let's close and refresh
        this.closeModal();
      }
    });
  }
}
