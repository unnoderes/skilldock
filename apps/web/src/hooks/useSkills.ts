import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Scope,
  SkillsInstallRequest,
  SkillsRemoveRequest,
  SkillsUpdateRequest,
} from "@skilldock/shared";
import {
  fetchSkillsList,
  installSkill,
  removeSkill,
  updateSkill,
} from "../lib/api";

export function useSkillsList(scope: Scope) {
  return useQuery({
    queryKey: ["skills", scope],
    queryFn: () => fetchSkillsList(scope),
    staleTime: 15_000,
  });
}

export function useSkillInstall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SkillsInstallRequest) => installSkill(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}

export function useSkillRemove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SkillsRemoveRequest) => removeSkill(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}

export function useSkillUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SkillsUpdateRequest) => updateSkill(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}
