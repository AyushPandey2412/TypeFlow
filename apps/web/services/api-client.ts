export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
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
