import { useQuery } from "@tanstack/react-query";
import type { LogsListQuery } from "@skilldock/shared";
import { fetchLogs } from "../lib/api";

export function useLogs(query: LogsListQuery | number) {
  return useQuery({
    queryKey: ["logs", query],
    queryFn: () => fetchLogs(query),
    staleTime: 10_000,
  });
}
