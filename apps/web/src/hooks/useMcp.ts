import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CommandResult, McpAddRequest, Scope } from "@skilldock/shared";
import { addMcp, fetchMcpAgents } from "../lib/api";

async function fetchProjectMcpList(
  scope: Scope,
  activeProjectId: string | null,
): Promise<CommandResult> {
  const params = new URLSearchParams({ scope });
  if (activeProjectId) params.set("projectId", activeProjectId);

  const response = await fetch(`/api/mcp/list?${params.toString()}`);
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
  return await response.json() as CommandResult;
}

export function useMcpList(scope: Scope, activeProjectId: string | null) {
  return useQuery({
    queryKey: ["mcp", activeProjectId, scope],
    queryFn: () => fetchProjectMcpList(scope, activeProjectId),
    staleTime: 15_000,
  });
}

export function useMcpAgents() {
  return useQuery({
    queryKey: ["mcp", "agents"],
    queryFn: fetchMcpAgents,
    staleTime: 60_000,
  });
}

export function useMcpAdd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: McpAddRequest) => addMcp(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mcp"] });
    },
  });
}
