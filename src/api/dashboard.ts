const API_BASE = import.meta.env.VITE_API_BASE_URL;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  const sessionId = localStorage.getItem("sessionId");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(sessionId ? { "X-Session-Id": sessionId } : {}),
  };
  return headers;
}

export async function getProfile() {
  const res = await fetch(`${API_BASE}/user/profile`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch profile");
  return res.json();
}

export async function getSessions() {
  const sessionId = localStorage.getItem("sessionId");
  const q = sessionId ? `?currentSessionId=${encodeURIComponent(sessionId)}` : "";
  const res = await fetch(`${API_BASE}/user/sessions${q}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch sessions");
  return res.json();
}

export async function endOtherSessions(keepSessionId?: string) {
  const res = await fetch(`${API_BASE}/user/sessions/end-others`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ keepSessionId: keepSessionId || localStorage.getItem("sessionId") }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to end sessions");
  return res.json();
}

export async function getSecurityOverview() {
  const res = await fetch(`${API_BASE}/user/security-overview`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch security overview");
  return res.json();
}

export async function getLoginAnalytics() {
  const res = await fetch(`${API_BASE}/user/login-analytics`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch login analytics");
  return res.json();
}

export async function getSecurityLogs() {
  const res = await fetch(`${API_BASE}/user/security-logs`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch security logs");
  return res.json();
}

export async function getActivityHistory(page = 1, limit = 20) {
  const res = await fetch(`${API_BASE}/user/activity-history?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch activity history");
  return res.json();
}

export async function exportActivityCsv(): Promise<Blob> {
  const res = await fetch(`${API_BASE}/user/activity-history/export`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to export CSV");
  return res.blob();
}

export async function refreshToken() {
  const res = await fetch(`${API_BASE}/user/refresh-token`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to refresh token");
  const data = await res.json();
  if (data.token) localStorage.setItem("token", data.token);
  return data;
}

export async function securityLockdown() {
  const res = await fetch(`${API_BASE}/user/security-lockdown`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to lockdown");
  return res.json();
}

export async function getNotifications() {
  const res = await fetch(`${API_BASE}/user/notifications`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch notifications");
  return res.json();
}
