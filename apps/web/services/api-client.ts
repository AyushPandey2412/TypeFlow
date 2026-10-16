export class ApiError extends Error {
  public readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

let pendingRefresh: Promise<boolean> | null = null;

function refreshSession() {
  pendingRefresh ??= fetch("/api/auth/refresh", { method: "POST" })
    .then(response => response.ok)
    .finally(() => { pendingRefresh = null; });
  return pendingRefresh;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const options = {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  };
  let response = await fetch(path, options);
  // Share token rotation across concurrent requests and retry only once.
  if (response.status === 401 && path.startsWith("/api/") && (!path.startsWith("/api/auth/") || path === "/api/auth/me")) {
    if (await refreshSession()) response = await fetch(path, options);
  }
  const text = await response.text();
  let body: unknown = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError("The server returned an invalid response.", response.status);
  }
  if (!response.ok) {
    const message = typeof body === "object" && body && "error" in body ? String(body.error) : "Request failed.";
    throw new ApiError(message, response.status);
  }
  return body as T;
}

export function postJson<T>(path: string, body: object = {}) {
  return apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) });
}
