import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Scope,
  SkillsInstallRequest,
  SkillsListResponse,
  SkillsRemoveRequest,
  SkillsUpdateRequest,
} from "@skilldock/shared";
import {
  fetchSkillsFind,
  fetchSkillsInstallPreview,
  installSkill,
  removeSkill,
  updateSkill,
} from "../lib/api";

async function fetchProjectSkillsList(
  scope: Scope,
  activeProjectId: string | null,
): Promise<SkillsListResponse> {
  const params = new URLSearchParams({ scope });
  if (activeProjectId) params.set("projectId", activeProjectId);

  const response = await fetch(`/api/skills/list?${params.toString()}`);
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    throw new Error(
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: string }).message)
        : String(body),
    );
  }
  return await response.json() as SkillsListResponse;
}

export function useSkillsFind(query: string) {
  return useQuery({
    queryKey: ["skills", "find", query],
    queryFn: () => fetchSkillsFind(query),
    enabled: query.trim().length > 0,
    staleTime: 30_000,
  });
}

export function useSkillsInstallPreview(packageName: string) {
  return useQuery({
    queryKey: ["skills", "install-preview", packageName],
    queryFn: () => fetchSkillsInstallPreview(packageName),
    enabled: packageName.trim().length > 0,
    staleTime: 30_000,
  });
}

export function useSkillsList(scope: Scope, activeProjectId: string | null) {
  return useQuery({
    queryKey: ["skills", activeProjectId, scope],
    queryFn: () => fetchProjectSkillsList(scope, activeProjectId),
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
