// ============================================================
// Bosphorus Fellas / ManCave — API Client
// ============================================================

import type {
  ApiResponse,
  PaginatedResponse,
  User,
  LoginRequest,
  LoginResponse,
  MembershipApplication,
  ApplicationFormData,
  ApplicationReview,
  Event,
  EventFormData,
  News,
  NewsFormData,
  Sponsor,
  SponsorFormData,
  LandingPageStats,
  DashboardData,
  AdminDashboardStats,
  ProfileUpdateData,
  PasswordChangeData,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

// ============================================================
// Helpers
// ============================================================

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mancave_token");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {};

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const contentType = res.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("mancave_token");
        localStorage.removeItem("mancave_user");
      }
    }
    const message =
      typeof data === "object" && data !== null
        ? (data as { message?: string }).message || (data as { error?: string }).error || "Bir hata oluştu"
        : "Bir hata oluştu";
    throw new Error(message);
  }

  return data as T;
}

function appendFormData(formData: FormData, data: object): void {
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const s = search.toString();
  return s ? `?${s}` : "";
}

// ============================================================
// Auth
// ============================================================

export const authApi = {
  login: (data: LoginRequest) =>
    request<ApiResponse<LoginResponse>>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getProfile: () => request<ApiResponse<User>>("/api/auth/profile"),

  updateProfile: (data: ProfileUpdateData) => {
    const formData = new FormData();
    appendFormData(formData, data);
    return request<ApiResponse<User>>("/api/auth/profile", {
      method: "PUT",
      body: formData,
    });
  },

  changePassword: (data: PasswordChangeData) =>
    request<ApiResponse<{ message: string }>>("/api/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// Landing Page
// ============================================================

export const landingApi = {
  getStats: () => request<ApiResponse<LandingPageStats>>("/api/landing-page/stats"),
  getEvents: () => request<ApiResponse<Event[]>>("/api/landing-page/events"),
  getSponsors: () => request<ApiResponse<Sponsor[]>>("/api/landing-page/sponsors"),
};

// ============================================================
// Applications
// ============================================================

export const applicationsApi = {
  submit: (data: ApplicationFormData) => {
    const formData = new FormData();
    appendFormData(formData, data);
    return request<ApiResponse<MembershipApplication>>("/api/applications", {
      method: "POST",
      body: formData,
    });
  },

  list: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    request<PaginatedResponse<MembershipApplication>>(
      `/api/applications${buildQuery(params || {})}`
    ),

  getById: (id: string) =>
    request<ApiResponse<MembershipApplication>>(`/api/applications/${id}`),

  review: (data: ApplicationReview) =>
    request<ApiResponse<MembershipApplication>>(
      `/api/applications/${data.applicationId}/review`,
      {
        method: "PUT",
        body: JSON.stringify({
          action: data.action,
          reason: data.reason,
        }),
      }
    ),
};

// ============================================================
// Members
// ============================================================

export const membersApi = {
  list: (params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) =>
    request<PaginatedResponse<User>>(
      `/api/members${buildQuery(params || {})}`
    ),

  getById: (id: string) =>
    request<ApiResponse<User>>(`/api/members/${id}`),

  toggleStatus: (id: string, status: "active" | "inactive") =>
    request<ApiResponse<User>>(`/api/members/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};

// ============================================================
// Events
// ============================================================

export const eventsApi = {
  list: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    request<PaginatedResponse<Event>>(
      `/api/events${buildQuery(params || {})}`
    ),

  getById: (id: string) =>
    request<ApiResponse<Event>>(`/api/events/${id}`),

  create: (data: EventFormData) => {
    const formData = new FormData();
    appendFormData(formData, data);
    return request<ApiResponse<Event>>("/api/events", {
      method: "POST",
      body: formData,
    });
  },

  update: (id: string, data: Partial<EventFormData>) => {
    const formData = new FormData();
    appendFormData(formData, data);
    return request<ApiResponse<Event>>(`/api/events/${id}`, {
      method: "PUT",
      body: formData,
    });
  },

  delete: (id: string) =>
    request<ApiResponse<{ message: string }>>(`/api/events/${id}`, {
      method: "DELETE",
    }),

  join: (id: string) =>
    request<ApiResponse<{ message: string }>>(`/api/events/${id}/join`, {
      method: "POST",
    }),

  leave: (id: string) =>
    request<ApiResponse<{ message: string }>>(`/api/events/${id}/leave`, {
      method: "POST",
    }),
};

// ============================================================
// News
// ============================================================

export const newsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
  }) =>
    request<PaginatedResponse<News>>(
      `/api/news${buildQuery(params || {})}`
    ),

  getById: (id: string) =>
    request<ApiResponse<News>>(`/api/news/${id}`),

  create: (data: NewsFormData) => {
    const formData = new FormData();
    appendFormData(formData, data);
    return request<ApiResponse<News>>("/api/news", {
      method: "POST",
      body: formData,
    });
  },

  update: (id: string, data: Partial<NewsFormData>) => {
    const formData = new FormData();
    appendFormData(formData, data);
    return request<ApiResponse<News>>(`/api/news/${id}`, {
      method: "PUT",
      body: formData,
    });
  },

  delete: (id: string) =>
    request<ApiResponse<{ message: string }>>(`/api/news/${id}`, {
      method: "DELETE",
    }),
};

// ============================================================
// Sponsors
// ============================================================

export const sponsorsApi = {
  list: (params?: {
    tier?: string;
    activeOnly?: boolean;
    page?: number;
    limit?: number;
  }) =>
    request<PaginatedResponse<Sponsor>>(
      `/api/sponsors${buildQuery(params || {})}`
    ),

  getById: (id: string) =>
    request<ApiResponse<Sponsor>>(`/api/sponsors/${id}`),

  create: (data: SponsorFormData) => {
    const formData = new FormData();
    appendFormData(formData, data);
    return request<ApiResponse<Sponsor>>("/api/sponsors", {
      method: "POST",
      body: formData,
    });
  },

  update: (id: string, data: Partial<SponsorFormData>) => {
    const formData = new FormData();
    appendFormData(formData, data);
    return request<ApiResponse<Sponsor>>(`/api/sponsors/${id}`, {
      method: "PUT",
      body: formData,
    });
  },

  delete: (id: string) =>
    request<ApiResponse<{ message: string }>>(`/api/sponsors/${id}`, {
      method: "DELETE",
    }),
};

// ============================================================
// Dashboard
// ============================================================

export const dashboardApi = {
  getData: () => request<ApiResponse<DashboardData>>("/api/dashboard"),
  getAdminStats: () =>
    request<ApiResponse<AdminDashboardStats>>("/api/dashboard/admin"),
};
