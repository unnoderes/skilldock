import { stripAnsi } from "./outputNormalization";

export interface DiscoveryItem {
  skillId: string;
  installs?: string;
  url?: string;
}

export { stripAnsi } from "./outputNormalization";

export function parseDiscoveryItems(stdout: string): DiscoveryItem[] | null {
  const cleaned = stripAnsi(stdout);
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  const items: DiscoveryItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().startsWith("install with")) continue;

    const match = line.match(/^(\S+)\s+([\d.]+[KMB]?\s+installs)$/i);
    if (match) {
      const skillId = match[1];
      const installs = match[2];
      let url: string | undefined;

      if (i + 1 < lines.length) {
        const next = lines[i + 1];
        const urlMatch = next.match(/[├└]?\s*(https?:\/\/\S+)/);
        if (urlMatch) {
          url = urlMatch[1];
          i++;
        }
      }

      items.push({ skillId, installs, url });
    }
  }

  return items.length > 0 ? items : null;
}
