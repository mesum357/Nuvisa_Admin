import { UserRole, UserStatus, ApplicationStatus } from '@prisma/client';

export type { UserRole, UserStatus, ApplicationStatus };

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminRole {
  id: string;
  name: string;
  description?: string | null;
  permissions: Record<string, boolean>;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  status: UserStatus;
  isVerified: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  userId: string;
  applicationNo: string;
  status: ApplicationStatus;
  totalAmount: number;
  paidAmount: number;
  appointmentDate?: Date | null;
  appointmentSlot?: string | null;
  submittedAt: Date;
  updatedAt: Date;
  user?: User;
  documents?: Document[];
  comments?: ApplicationComment[];
}

export interface Document {
  id: string;
  applicationId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
  isVerified: boolean;
}

export interface ApplicationComment {
  id: string;
  applicationId: string;
  comment: string;
  isInternal: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalApplications: number;
  totalUsers: number;
  totalRevenue: number;
  pendingApplications: number;
  submittedApplications: number; // Add submitted applications
  approvedApplications: number;
  rejectedApplications: number;
  newApplicationsToday: number;
  newUsersToday: number;
  revenueThisMonth: number;
  applicationsByStatus: {
    status: ApplicationStatus;
    count: number;
  }[];
  recentApplications: Application[];
}

export interface SiteContent {
  id: string;
  key: string;
  value: string;
  type: string;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface HeaderContent {
  id: string;
  key: string;
  value: string;
  type: string;
  section: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface FooterContent {
  id: string;
  key: string;
  value: string;
  type: string;
  section: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface HeroContent {
  id: string;
  key: string;
  value: string;
  type: string;
  section: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface KlarnaContent {
  id: string;
  key: string;
  value: string;
  type: string;
  section: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface ProcessContent {
  id: string;
  key: string;
  value: string;
  type: string;
  section: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Country {
  id: string;
  name: string;
  slug: string;
  image: string;
  landmark: string;
  visaFee: number;
  insuranceFee: number;
  appointmentText: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface CreateFAQData {
  question: string;
  answer: string;
  category?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateFAQData {
  question?: string;
  answer?: string;
  category?: string;
  order?: number;
  isActive?: boolean;
}

export interface ComparisonSection {
  id: string;
  title: string;
  leftSideTitle: string;
  rightSideTitle: string;
  leftSideImage?: string | null;
  rightSideImage?: string | null;
  leftSideItems: string[];
  rightSideItems: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface CreateComparisonSectionData {
  title: string;
  leftSideTitle: string;
  rightSideTitle: string;
  leftSideImage?: string;
  rightSideImage?: string;
  leftSideItems: string[];
  rightSideItems: string[];
  isActive?: boolean;
}

export interface UpdateComparisonSectionData {
  title?: string;
  leftSideTitle?: string;
  rightSideTitle?: string;
  leftSideImage?: string;
  rightSideImage?: string;
  leftSideItems?: string[];
  rightSideItems?: string[];
  isActive?: boolean;
}

