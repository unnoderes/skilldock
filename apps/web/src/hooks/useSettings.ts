import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, saveSettings } from "../lib/api";
import type { SettingsUpdateRequest } from "@skilldock/shared";

export function useSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (update: SettingsUpdateRequest) => saveSettings(update),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return { query, mutation };
}
