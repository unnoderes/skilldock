import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { McpAddRequest, Scope } from "@skilldock/shared";
import { addMcp, fetchMcpAgents, fetchMcpList } from "../lib/api";

export function useMcpList(scope: Scope) {
  return useQuery({
    queryKey: ["mcp", "list", scope],
    queryFn: () => fetchMcpList(scope),
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
