import { create } from "zustand";
type User = { id: string; displayName: string; email?: string; role: "user" | "guest" };
type AuthState = { user: User | null; hydrated: boolean; setUser: (user: User | null) => void; setHydrated: () => void; clear: () => void };
export const useAuth = create<AuthState>(set => ({ user: null, hydrated: false, setUser: user => set({ user }), setHydrated: () => set({ hydrated: true }), clear: () => set({ user: null, hydrated: true }) }));
