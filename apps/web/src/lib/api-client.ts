import type { ApiResponse } from "@smagicalsub/shared";

const adminTokenStorageKey = "smagicalsub.adminToken";
const authTokenStorageKey = "smagicalsub.authToken";

export function getAdminToken() {
  return getAuthToken();
}

export function setAdminToken(token: string) {
  setAuthToken(token);
}

export function clearAdminToken() {
  clearAuthToken();
}

export function getAuthToken() {
  return browserStorage()?.getItem(authTokenStorageKey) ?? browserStorage()?.getItem(adminTokenStorageKey) ?? "";
}

export function setAuthToken(token: string) {
  const storage = browserStorage();
  const normalized = token.trim();

  if (!storage) {
    return;
  }

  if (normalized) {
    storage.setItem(authTokenStorageKey, normalized);
    storage.removeItem(adminTokenStorageKey);
  } else {
    storage.removeItem(authTokenStorageKey);
  }
}

export function clearAuthToken() {
  browserStorage()?.removeItem(authTokenStorageKey);
  browserStorage()?.removeItem(adminTokenStorageKey);
}

export async function getJson<T>(url: string): Promise<T> {
  return requestJson<T>(url);
}

export async function postJson<T>(url: string, body?: unknown): Promise<T> {
  return requestJson<T>(url, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

export async function patchJson<T>(url: string, body: unknown): Promise<T> {
  return requestJson<T>(url, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function deleteJson<T>(url: string): Promise<T> {
  return requestJson<T>(url, {
    method: "DELETE"
  });
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const authToken = getAuthToken();

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : undefined),
        ...(init?.body ? { "Content-Type": "application/json" } : undefined),
        ...init?.headers
      }
    });
  } catch {
    throw new Error("网络请求失败，请确认本地 Worker 或 Cloudflare 部署可访问");
  }

  const payload = await readApiPayload<T>(response);

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

async function readApiPayload<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("Content-Type") ?? "";

  if (!contentType.includes("application/json")) {
    const fallback = await response.text();
    throw new Error(fallback.trim() || `请求失败，HTTP ${response.status}`);
  }

  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(`接口返回了无效 JSON，HTTP ${response.status}`);
  }
}

function browserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
