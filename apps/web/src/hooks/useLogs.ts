import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LogsListQuery } from "@skilldock/shared";
import { clearLogs, fetchLogs } from "../lib/api";

export function useLogs(query: LogsListQuery | number) {
  return useQuery({
    queryKey: ["logs", query],
    queryFn: () => fetchLogs(query),
    staleTime: 10_000,
  });
}

export function useClearLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearLogs,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}
