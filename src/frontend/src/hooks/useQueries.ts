import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClassBlock, RoutineBlockInput, UserProfile } from "../backend.d";
import { todayDateInt } from "../utils/timeUtils";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useUserData() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["userData", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getUserData(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCompletions() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const dateInt = todayDateInt();

  return useQuery({
    queryKey: [
      "completions",
      identity?.getPrincipal().toString(),
      dateInt.toString(),
    ],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getCompletions(identity.getPrincipal(), dateInt);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userData", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useSaveClasses() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (classList: ClassBlock[]) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveClasses(classList);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userData", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useSaveRoutines() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (routineBlocks: RoutineBlockInput[]) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveRoutines(routineBlocks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userData", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useSaveCompletions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routineIds: bigint[]) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCompletions(todayDateInt(), routineIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["completions"] });
    },
  });
}
