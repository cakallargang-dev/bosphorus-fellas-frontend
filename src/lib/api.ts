// ============================================================
// Bosphorus Fellas / ManCave — API Client
// ============================================================

import type {
  ApiResponse,
  PaginatedResponse,
  User,
  UserPublicProfile,
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
  Product,
  ProductFormData,
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

function hasFile(data: object): boolean {
  return Object.values(data).some((v) => v instanceof File || v instanceof Blob);
}

function buildBody(data: object): BodyInit {
  if (hasFile(data)) {
    const fd = new FormData();
    appendFormData(fd, data);
    return fd;
  }
  // Filter out File fields (can't be serialized to JSON)
  const json: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && !(value instanceof File) && !(value instanceof Blob)) {
      json[key] = value;
    }
  });
  return JSON.stringify(json);
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
    return request<ApiResponse<User>>("/api/auth/profile", {
      method: "PUT",
      body: buildBody(data),
    });
  },

  changePassword: (data: PasswordChangeData) =>
    request<ApiResponse<{ message: string }>>("/api/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getPublicProfile: (userId: string) =>
    request<ApiResponse<UserPublicProfile>>(`/api/users/${userId}/profile`),
};

// ============================================================
// Reference Codes
// ============================================================

export const referansApi = {
  getCode: () =>
    request<ApiResponse<{ code: string; expiresAt: string }>>("/api/auth/referans-kodu"),

  verifyCode: (code: string) =>
    request<ApiResponse<{ ownerName: string }>>("/api/auth/referans-kodu/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
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
    return request<ApiResponse<MembershipApplication>>("/api/applications", {
      method: "POST",
      body: buildBody(data),
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

  resetPassword: (id: string) =>
    request<ApiResponse<{ tempPassword: string }>>(
      `/api/members/${id}/reset-password`,
      { method: "POST" }
    ),

  delete: (id: string) =>
    request<ApiResponse<{ message: string }>>(`/api/members/${id}`, {
      method: "DELETE",
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
    return request<ApiResponse<Event>>("/api/events", {
      method: "POST",
      body: buildBody(data),
    });
  },

  update: (id: string, data: Partial<EventFormData>) => {
    return request<ApiResponse<Event>>(`/api/events/${id}`, {
      method: "PUT",
      body: buildBody(data),
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
    return request<ApiResponse<News>>("/api/news", {
      method: "POST",
      body: buildBody(data),
    });
  },

  update: (id: string, data: Partial<NewsFormData>) => {
    return request<ApiResponse<News>>(`/api/news/${id}`, {
      method: "PUT",
      body: buildBody(data),
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
    return request<ApiResponse<Sponsor>>("/api/sponsors", {
      method: "POST",
      body: buildBody(data),
    });
  },

  update: (id: string, data: Partial<SponsorFormData>) => {
    return request<ApiResponse<Sponsor>>(`/api/sponsors/${id}`, {
      method: "PUT",
      body: buildBody(data),
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

// ============================================================
// Products (MANCAVE Market)
// ============================================================

export const productsApi = {
  list: () => request<ApiResponse<Product[]>>("/api/products"),
  listAdmin: (params?: { category?: string; page?: number; limit?: number }) =>
    request<PaginatedResponse<Product>>(
      `/api/products/admin${buildQuery(params || {})}`
    ),
  create: (data: ProductFormData) => {
    const fd = new FormData();
    if (data.image) fd.append("image", data.image);
    fd.append("name", data.name);
    if (data.description) fd.append("description", data.description);
    if (data.price) fd.append("price", data.price);
    fd.append("category", data.category);
    fd.append("shopifyUrl", data.shopifyUrl);
    if (data.sortOrder !== undefined) fd.append("sortOrder", String(data.sortOrder));
    return request<ApiResponse<Product>>("/api/products", {
      method: "POST",
      body: fd,
    });
  },
  update: (id: string, data: Partial<ProductFormData>) => {
    const fd = new FormData();
    if (data.image) fd.append("image", data.image);
    if (data.name) fd.append("name", data.name);
    if (data.description !== undefined) fd.append("description", data.description || "");
    if (data.price !== undefined) fd.append("price", data.price || "");
    if (data.category) fd.append("category", data.category);
    if (data.shopifyUrl) fd.append("shopifyUrl", data.shopifyUrl);
    if (data.sortOrder !== undefined) fd.append("sortOrder", String(data.sortOrder));
    return request<ApiResponse<Product>>(`/api/products/${id}`, {
      method: "PUT",
      body: fd,
    });
  },
  delete: (id: string) =>
    request<ApiResponse<{ message: string }>>(`/api/products/${id}`, {
      method: "DELETE",
    }),
  toggle: (id: string) =>
    request<ApiResponse<Product>>(`/api/products/${id}/toggle`, {
      method: "PUT",
    }),
};

// ============================================================
// Chat
// ============================================================

export const chatApi = {
  getMessages: (channel: string) =>
    request<ApiResponse<any[]>>(`/api/chat/${channel}`),
  sendMessage: (channel: string, content: string) =>
    request<ApiResponse<any>>(`/api/chat/${channel}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  getActivity: () =>
    request<ApiResponse<Record<string, { count: number; lastMessage: { content: string; senderName: string; createdAt: string } | null }>>>(
      "/api/chat/activity"
    ),
  getSupport: () => request<ApiResponse<any[]>>("/api/chat/support"),
  sendSupport: (content: string) =>
    request<ApiResponse<any>>("/api/chat/support", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  replySupport: (id: string, reply: string) =>
    request<ApiResponse<any>>(`/api/chat/support/${id}/reply`, {
      method: "PUT",
      body: JSON.stringify({ reply }),
    }),
  getSupportUnread: () =>
    request<ApiResponse<{ count: number }>>("/api/chat/support/unread"),
};
