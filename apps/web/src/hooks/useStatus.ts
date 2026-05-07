import { useQuery } from "@tanstack/react-query";
import { fetchStatus } from "../lib/api";

export function useStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: fetchStatus,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
