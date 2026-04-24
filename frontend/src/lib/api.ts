// Lightweight API client for NurseFlow backend.
// Handles auth tokens, JSON (de)serialization, and automatic 401 refresh.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const ACCESS_TOKEN_KEY = "nf_access_token";
const REFRESH_TOKEN_KEY = "nf_refresh_token";

export interface ApiError extends Error {
  status: number;
  detail?: unknown;
}

function buildError(status: number, detail: unknown): ApiError {
  let message: string;
  if (typeof detail === "string") {
    message = detail;
  } else {
    const d = (detail as { detail?: unknown })?.detail;
    if (typeof d === "string") {
      message = d;
    } else if (Array.isArray(d) && d.length > 0) {
      // Pydantic validation error: [{loc, msg, type}, ...]
      message = d.map((e: { msg?: string }) => e?.msg ?? JSON.stringify(e)).join("; ");
    } else {
      message = `Request failed with status ${status}`;
    }
  }
  const err = new Error(message) as ApiError;
  err.status = status;
  err.detail = detail;
  return err;
}

export const tokenStore = {
  getAccess(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(access: string, refresh: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

async function refreshAccessToken(): Promise<boolean> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    tokenStore.set(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  isForm?: boolean;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
  _retry = false,
): Promise<T> {
  const { body, auth = true, isForm = false, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };
  if (!isForm && body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = tokenStore.getAccess();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: isForm
      ? (body as BodyInit)
      : body !== undefined
      ? JSON.stringify(body)
      : undefined,
  });

  if (res.status === 401 && auth && !_retry) {
    const ok = await refreshAccessToken();
    if (ok) return apiRequest<T>(path, options, true);
    tokenStore.clear();
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) throw buildError(res.status, data ?? text);
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// --- Typed API surface ---

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  unit?: string | null;
  hospital_id?: string | null;
  is_active: boolean;
  is_on_shift: boolean;
  created_at: string;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      }),
    register: (payload: {
      email: string;
      password: string;
      full_name: string;
      role?: string;
      unit?: string;
    }) =>
      apiRequest<UserProfile>("/auth/register", {
        method: "POST",
        body: payload,
        auth: false,
      }),
    me: () => apiRequest<UserProfile>("/auth/me"),
    updateMe: (body: Partial<Pick<UserProfile, "full_name" | "unit" | "is_on_shift">>) =>
      apiRequest<UserProfile>("/auth/me", { method: "PATCH", body }),
    logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
    users: (unit?: string, role?: string) => {
      const params = new URLSearchParams();
      if (unit) params.set("unit", unit);
      if (role) params.set("role", role);
      const qs = params.toString();
      return apiRequest<UserProfile[]>(`/auth/users${qs ? `?${qs}` : ""}`);
    },
  },
  dashboard: {
    summary: () => apiRequest<unknown>("/dashboard/summary"),
    patients: () => apiRequest<unknown[]>("/dashboard/patients"),
  },
  patients: {
    list: () => apiRequest<unknown[]>("/patients"),
    get: (id: string) => apiRequest<unknown>(`/patients/${id}`),
    create: (body: unknown) =>
      apiRequest<unknown>("/patients", { method: "POST", body }),
    update: (id: string, body: unknown) =>
      apiRequest<unknown>(`/patients/${id}`, { method: "PATCH", body }),
    vitals: (id: string) => apiRequest<unknown[]>(`/patients/${id}/vitals`),
    addVitals: (id: string, body: unknown) =>
      apiRequest<unknown>(`/patients/${id}/vitals`, { method: "POST", body }),
  },
  alerts: {
    list: () => apiRequest<unknown[]>("/alerts"),
    forPatient: (patientId: string) =>
      apiRequest<unknown[]>(`/alerts/patient/${patientId}`),
    create: (body: unknown) =>
      apiRequest<unknown>("/alerts", { method: "POST", body }),
    acknowledge: (id: string, body?: { resolution_notes?: string }) =>
      apiRequest<unknown>(`/alerts/${id}/acknowledge`, { method: "POST", body }),
    resolve: (id: string, body: { resolution_notes: string }) =>
      apiRequest<unknown>(`/alerts/${id}/resolve`, { method: "POST", body }),
    checkEscalations: () =>
      apiRequest<unknown>("/alerts/check-escalations", { method: "POST" }),
  },
  medications: {
    queue: () => apiRequest<unknown>("/medications/queue"),
    create: (body: unknown) =>
      apiRequest<unknown>("/medications", { method: "POST", body }),
    get: (id: string) => apiRequest<unknown>(`/medications/${id}`),
    administer: (id: string, body?: unknown) =>
      apiRequest<unknown>(`/medications/${id}/administer`, {
        method: "POST",
        body,
      }),
    updateStatus: (id: string, body: { status: string }) =>
      apiRequest<unknown>(`/medications/${id}/status`, { method: "PATCH", body }),
    forPatient: (patientId: string) =>
      apiRequest<unknown[]>(`/medications/patient/${patientId}`),
    checkInteractions: (body: unknown) =>
      apiRequest<unknown>("/medications/check-interactions", { method: "POST", body }),
  },
  fallRisk: {
    forPatient: (id: string) =>
      apiRequest<unknown[]>(`/fall-risk/patient/${id}`),
    assess: (id: string, body: unknown) =>
      apiRequest<unknown>(`/fall-risk/assess/${id}`, { method: "POST", body }),
    mobilityEvent: (body: unknown) =>
      apiRequest<unknown>("/fall-risk/mobility-event", { method: "POST", body }),
  },
  handoffs: {
    list: () => apiRequest<unknown[]>("/handoffs"),
    get: (id: string) => apiRequest<unknown>(`/handoffs/${id}`),
    create: (body: unknown) =>
      apiRequest<unknown>("/handoffs", { method: "POST", body }),
    update: (id: string, body: unknown) =>
      apiRequest<unknown>(`/handoffs/${id}`, { method: "PATCH", body }),
    generate: (body: unknown) =>
      apiRequest<unknown>("/handoffs/generate", { method: "POST", body }),
    sign: (id: string) =>
      apiRequest<unknown>(`/handoffs/${id}/sign`, { method: "POST" }),
  },
  voiceNotes: {
    list: () => apiRequest<unknown[]>("/voice-notes"),
    get: (id: string) => apiRequest<unknown>(`/voice-notes/${id}`),
    forPatient: (patientId: string) =>
      apiRequest<unknown[]>(`/voice-notes/patient/${patientId}`),
    upload: (form: FormData) =>
      apiRequest<unknown>("/voice-notes", {
        method: "POST",
        body: form,
        isForm: true,
      }),
  },
  analytics: {
    shift: () => apiRequest<unknown>("/analytics/shift"),
    unit: () => apiRequest<unknown>("/analytics/unit"),
    safetyKpis: () => apiRequest<unknown>("/analytics/safety-kpis"),
  },
  settings: {
    get: () => apiRequest<UserProfile>("/settings"),
    update: (body: Partial<UserProfile>) =>
      apiRequest<UserProfile>("/settings", { method: "PUT", body }),
  },
};
