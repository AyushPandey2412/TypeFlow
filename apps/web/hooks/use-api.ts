import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import { friendService, type RaceOptions } from "../services/friend.service";
import { raceService } from "../services/race.service";
export const queryKeys = { results: (kind: string) => ["results", kind] as const, friends: ["friends"] as const, invites: ["friend-invites"] as const, friend: (id: string) => ["friend", id] as const };
export function useResults(kind: "leaderboard" | "history") { return useQuery({ queryKey: queryKeys.results(kind), queryFn: () => raceService.results(kind) }); }
export function useFriends() { return useQuery({ queryKey: queryKeys.friends, queryFn: friendService.list }); }
export function useFriendInvites() { return useQuery({ queryKey: queryKeys.invites, queryFn: friendService.invites }); }
export function useFriendProfile(id: string) { return useQuery({ queryKey: queryKeys.friend(id), queryFn: () => friendService.profile(id) }); }
export function useAddFriend() { const client = useQueryClient(); return useMutation({ mutationFn: friendService.add, onSuccess: async () => client.invalidateQueries({ queryKey: queryKeys.friends }) }); }
export function useInviteFriend() { return useMutation({ mutationFn: ({ id, options }: { id: string; options: RaceOptions }) => friendService.invite(id, options) }); }
export function useAuthAction() { return useMutation({ mutationFn: ({ action, body }: { action: "login" | "register" | "guest"; body?: object }) => action === "guest" ? authService.guest() : authService[action](body || {}) }); }
