import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectAddRequest, ProjectRecord } from "@skilldock/shared";
import {
  addProject,
  fetchProjects,
  removeProject,
  setActiveProject,
} from "../lib/api";

function findActiveProject(
  projects: ProjectRecord[] | undefined,
  activeProjectId: string | undefined,
) {
  return projects?.find((project) => project.id === activeProjectId) ?? null;
}

export function useProjects() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 15_000,
  });

  const invalidateProjectContext = () => {
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
    void queryClient.invalidateQueries({ queryKey: ["skills"] });
    void queryClient.invalidateQueries({ queryKey: ["mcp"] });
  };

  const addMutation = useMutation({
    mutationFn: (payload: ProjectAddRequest) => addProject(payload),
    onSuccess: invalidateProjectContext,
  });

  const setActiveMutation = useMutation({
    mutationFn: (projectId: string) => setActiveProject({ projectId }),
    onSuccess: invalidateProjectContext,
  });

  const removeMutation = useMutation({
    mutationFn: (projectId: string) => removeProject(projectId),
    onSuccess: invalidateProjectContext,
  });

  const activeProject = useMemo(
    () => findActiveProject(query.data?.projects, query.data?.activeProjectId),
    [query.data?.activeProjectId, query.data?.projects],
  );

  return {
    query,
    projects: query.data?.projects ?? [],
    activeProject,
    activeProjectId: query.data?.activeProjectId ?? null,
    launchProjectId: query.data?.launchProjectId ?? null,
    addProject: addMutation,
    setActiveProject: setActiveMutation,
    removeProject: removeMutation,
  };
}
