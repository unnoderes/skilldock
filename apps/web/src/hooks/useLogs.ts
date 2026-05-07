import { useQuery } from "@tanstack/react-query";
import { fetchLogs } from "../lib/api";

export function useLogs(limit: number) {
  return useQuery({
    queryKey: ["logs", limit],
    queryFn: () => fetchLogs(limit),
    staleTime: 10_000,
  });
}
