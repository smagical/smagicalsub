import type { ApiResponse } from "@smagicalsub/shared";

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
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : undefined),
      ...init?.headers
    }
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}
