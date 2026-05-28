// ============================================================
// Bosphorus Fellas / ManCave — TypeScript Types
// ============================================================

// --- User / Auth ---
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  city?: string;
  role: "user" | "admin";
  avatar?: string;
  status: "active" | "inactive" | "pending";
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

// --- Membership Application ---
export interface MembershipApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  carBrand: string;
  carModel: string;
  carYear: number;
  instagram?: string;
  occupation?: string;
  about: string;
  expectation?: string;
  photoUrl?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ApplicationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  carBrand: string;
  carModel: string;
  carYear: number;
  instagram?: string;
  occupation?: string;
  about: string;
  expectation?: string;
  referansKodu?: string;
  photo?: File;
}

export interface ApplicationReview {
  applicationId: string;
  action: "approve" | "reject";
  reason?: string;
}

// --- Events ---
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  locationUrl?: string;
  imageUrl?: string;
  maxParticipants?: number;
  currentParticipants: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  isJoined?: boolean;
  createdBy: string;
  createdAt: string;
  participants?: EventParticipant[];
}

export interface EventParticipant {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  joinedAt: string;
}

export interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  locationUrl?: string;
  maxParticipants?: number;
  image?: File;
}

// --- News ---
export interface News {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NewsFormData {
  title: string;
  content: string;
  image?: File;
}

// --- Sponsors ---
export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  logo?: string;
  websiteUrl?: string;
  website?: string;
  description?: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  isActive: boolean;
  createdAt: string;
}

export interface SponsorFormData {
  name: string;
  logo?: File;
  websiteUrl?: string;
  description?: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
}

// --- Landing Page ---
export interface LandingPageStats {
  totalMembers: number;
  totalEvents: number;
  upcomingEvents: number;
  activeMembers: number;
}

// --- API Responses ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  statusCode: number;
}

// --- Dashboard ---
export interface DashboardData {
  user: User;
  stats: LandingPageStats;
  upcomingEvents: Event[];
  recentNews: News[];
  sponsors: Sponsor[];
}

// --- Admin ---
export interface AdminDashboardStats {
  totalMembers: number;
  totalApplications: number;
  pendingApplications: number;
  totalEvents: number;
  upcomingEvents: number;
  totalSponsors: number;
}

// --- Profile Update ---
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  birthDate?: string;
  occupation?: string;
  about?: string;
  instagram?: string;
  avatar?: File;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

// --- Chat ---
export interface ChatMessage {
  id: string;
  channel: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  sender?: {
    avatar: string | null;
  };
}

export interface SupportMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  replied: boolean;
  createdAt: string;
}
