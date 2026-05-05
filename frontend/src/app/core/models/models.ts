export enum UserRole {
  Candidate = 1,
  Recruiter = 2,
  Admin = 3
}

export enum ApplicationStatus {
  Applied = 1,
  Shortlisted = 2,
  InterviewScheduled = 3,
  Offered = 4,
  Rejected = 5
}

export enum InterviewStatus {
  Scheduled = 1,
  Confirmed = 2,
  Rescheduled = 3,
  Cancelled = 4,
  Completed = 5
}

export enum JobType {
  FullTime = 1,
  PartTime = 2,
  Contract = 3,
  Internship = 4,
  Remote = 5
}

export enum JobStatus {
  Active = 1,
  Inactive = 2,
  Closed = 3
}

export enum NotificationType {
  ApplicationReceived = 1,
  ApplicationStatusChanged = 2,
  InterviewScheduled = 3,
  JobPosted = 4,
  System = 5
}

// Matches backend: HireConnect.Shared.Models.LoginResponse
// JSON serialized fields: token, expiresAt, role (number), userId (number)
export interface LoginResponse {
  token: string;
  expiresAt: string;
  role: UserRole;
  userId: number; // backend field is UserId → serialized as userId
}

export interface Address {
  id: number;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  userId: number;
}

export interface CandidateProfile {
  id: number;
  fullName: string;
  email: string;
  mobile?: string;
  skills: string;
  skillsList: string[];
  experience?: string;
  experienceYears: number;
  resumeUrl?: string;
  education?: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  userId: number;
  address?: Address;
  createdAt: string;
}

export interface RecruiterProfile {
  id: number;
  fullName: string;
  companyName: string;
  designation?: string;
  industry?: string;
  website?: string;
  description?: string;
  companySize?: string;
  headquarters?: string;
  userId: number;
  address?: Address;
  createdAt: string;
}

// Matches backend JobResponseDto fields (camelCase after serialization)
export interface Job {
  id: number;
  title: string;
  category: string;
  type: string; // backend serializes as string e.g. "FullTime"
  location: string;
  isRemote: boolean;
  salaryMin: number;
  salaryMax?: number;
  currency: string;
  skills: string[];
  experienceRequired?: number;
  description: string;
  requirements?: string;
  benefits?: string;
  postedBy: number;
  status: number;
  postedAt: string;
  expiresAt?: string;
  viewCount: number;
  applicationCount: number;
}

// Matches backend ApplicationResponseDto
export interface Application {
  id: number;
  jobId: number;
  candidateId: number;
  status: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  expectedSalary?: number;
  notes?: string;
  appliedAt: string;
  updatedAt?: string;
  statusChangedAt?: string;
  // Enriched client-side
  jobData?: Job;
  candidateData?: any;
}

// Matches backend InterviewResponseDto
export interface Interview {
  id: number;
  applicationId: number;
  scheduledAt: string;
  meetingLink?: string;
  status: InterviewStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  jobId: number;
  candidateId: number;
}

// Matches backend NotificationResponseDto — Type is stored and returned as a string
export interface Notification {
  notificationId: number;
  userId: number;
  type: string;  // backend stores Type as string (e.g. "ApplicationReceived")
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors: string[];
}

export interface PagedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// --- Request DTOs matching backend exactly ---

// Matches HireConnect.Shared.Models.RegisterRequest
export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
}

// Matches HireConnect.Shared.Models.LoginRequest
export interface LoginRequest {
  email: string;
  password: string;
}

// Matches HireConnect.JobService.DTOs.CreateJobDto
export interface CreateJobDto {
  title: string;
  category: string;
  type: string;           // "FullTime" | "PartTime" | "Contract" | "Internship" | "Remote"
  location: string;
  isRemote: boolean;
  salaryMin: number;
  salaryMax?: number;
  currency: string;
  skills: string[];
  experienceRequired?: number;
  description: string;
  requirements?: string;
  benefits?: string;
  expiresAt?: string;
}

// Matches HireConnect.ApplicationService.DTOs.CreateApplicationDto
export interface CreateApplicationDto {
  jobId: number;
  coverLetter?: string;
  resumeUrl?: string;
  expectedSalary?: number;
}

// Matches HireConnect.ApplicationService.DTOs.UpdateApplicationStatusDto
export interface UpdateApplicationStatusDto {
  status: ApplicationStatus;
  notes?: string;
}

// Matches HireConnect.InterviewService.DTOs.ScheduleInterviewDto
export interface ScheduleInterviewDto {
  applicationId: number;
  scheduledAt: string;  // ISO string
  meetingLink?: string;
  notes?: string;
}
