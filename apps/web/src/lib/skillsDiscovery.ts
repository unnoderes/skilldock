import { stripAnsi } from "./outputNormalization";

export interface DiscoverySkillItem {
  skillId: string;
  skillName?: string;
  installs?: string;
  url?: string;
}

export interface DiscoveryPackageItem {
  packageName: string;
  matchedSkills: DiscoverySkillItem[];
}

export interface DiscoveryInstallRequest {
  packageName: string;
  skillNames?: string[];
  installMode: "package" | "selected-skills";
}

export { stripAnsi } from "./outputNormalization";

function parseSkillReference(skillId: string): { packageName: string; skillName?: string } {
  const separatorIndex = skillId.lastIndexOf("@");
  if (separatorIndex <= 0) {
    return { packageName: skillId };
  }

  return {
    packageName: skillId.slice(0, separatorIndex),
    skillName: skillId.slice(separatorIndex + 1),
  };
}

export function parseDiscoveryItems(stdout: string): DiscoveryPackageItem[] | null {
  const cleaned = stripAnsi(stdout);
  const lines = cleaned.split("\n").map((line) => line.trim()).filter(Boolean);
  const packages = new Map<string, DiscoveryPackageItem>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().startsWith("install with")) continue;

    const match = line.match(/^(\S+)\s+([\d.,]+[KMB]?\s+installs)$/i);
    if (!match) continue;

    const skillId = match[1];
    const installs = match[2];
    let url: string | undefined;

    if (i + 1 < lines.length) {
      const next = lines[i + 1];
      const urlMatch = next.match(/[└•]?\s*(https?:\/\/\S+)/);
      if (urlMatch) {
        url = urlMatch[1];
        i++;
      }
    }

    const { packageName, skillName } = parseSkillReference(skillId);
    const existing = packages.get(packageName) ?? {
      packageName,
      matchedSkills: [],
    };

    existing.matchedSkills.push({
      skillId,
      skillName,
      installs,
      url,
    });

    packages.set(packageName, existing);
  }

  return packages.size > 0 ? Array.from(packages.values()) : null;
}
