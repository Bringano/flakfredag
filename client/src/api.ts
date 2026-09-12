import type { Beer, Tasting, PersonStat, NewTastingPayload, UpdateTastingPayload } from "./types";
import { getAuthHeader, clearAuth, AuthRequiredError } from "./auth";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeader = getAuthHeader();
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {})
    },
    ...options
  });
  if (res.status === 401) {
    clearAuth();
    throw new AuthRequiredError();
  }
  if (!res.ok) {
    let message = `Fel (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore, use default message
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const api = {
  getBeers: () => request<Beer[]>("/api/beers"),
  getTastings: () => request<Tasting[]>("/api/tastings"),
  getPersonStats: () => request<PersonStat[]>("/api/stats/persons"),
  createTasting: (payload: NewTastingPayload) =>
    request<Tasting>("/api/tastings", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateTasting: (id: number, payload: UpdateTastingPayload) =>
    request<Tasting>(`/api/tastings/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteTasting: (id: number) =>
    request<void>(`/api/tastings/${id}`, { method: "DELETE" })
};
