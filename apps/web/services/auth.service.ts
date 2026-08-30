import { postJson } from "./api-client";
export type AuthUser = { id: string; displayName: string; email?: string; role: "user" | "guest" };
type AuthResponse = { user: AuthUser };
export const authService = {
  login: (body: object) => postJson<AuthResponse>("/api/auth/login", body),
  register: (body: object) => postJson<AuthResponse>("/api/auth/register", body),
  guest: () => postJson<AuthResponse>("/api/auth/guest"),
  refresh: () => postJson<AuthResponse>("/api/auth/refresh"),
  logout: () => postJson<Record<string, never>>("/api/auth/logout"),
};
