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

export interface InstallPreviewPackageItem {
  packageName: string;
  availableSkills: {
    skillName: string;
    description?: string;
  }[];
}

export interface DiscoveryInstallRequest {
  packageName: string;
  skillNames?: string[];
  installMode: "package" | "selected-skills";
}

export { stripAnsi } from "./outputNormalization";

const DISCOVERY_RESULT_RE = /^(\S+)\s+([\d.,]+[KMB]?\s+installs)$/i;
const DISCOVERY_URL_RE = /^└\s+(https?:\/\/\S+)$/i;
const SKILL_NAME_RE = /^[a-z0-9][a-z0-9._-]*$/i;

function normalizeCliOutput(text: string): string[] {
  return stripAnsi(text)
    .replace(/\r\n?/g, "\n")
    .split("\n");
}

function stripCliPrefix(line: string): string {
  if (/^\s*\|\s?/.test(line)) {
    return line.replace(/^\s*\|\s?/, "");
  }

  if (/^\s*[•oxO0×✔✖—-]\s{2,}/u.test(line)) {
    return line.replace(/^\s*[•oxO0×✔✖—-]\s{2,}/u, "");
  }

  return line;
}

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
  const lines = normalizeCliOutput(stdout)
    .map((line) => stripCliPrefix(line).trim())
    .filter(Boolean);
  const packages = new Map<string, DiscoveryPackageItem>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().startsWith("install with")) continue;

    const match = line.match(DISCOVERY_RESULT_RE);
    if (!match) continue;

    const skillId = match[1];
    const installs = match[2];
    let url: string | undefined;

    if (i + 1 < lines.length) {
      const next = lines[i + 1];
      const urlMatch = next.match(DISCOVERY_URL_RE);
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

export function parseInstallPreview(stdout: string, packageName: string): InstallPreviewPackageItem | null {
  const availableSkills: InstallPreviewPackageItem["availableSkills"] = [];
  let inAvailableSkills = false;

  for (const rawLine of normalizeCliOutput(stdout)) {
    const lineWithoutPrefix = stripCliPrefix(rawLine);
    const trimmed = lineWithoutPrefix.trim();
    if (!trimmed) continue;

    if (!inAvailableSkills) {
      if (/^Available Skills$/i.test(trimmed)) {
        inAvailableSkills = true;
      }
      continue;
    }

    if (/^Use --skill <name> to install specific skills$/i.test(trimmed)) {
      break;
    }

    if (
      /^Found \d+ skills$/i.test(trimmed) ||
      /^Source:/i.test(trimmed) ||
      /^(Agent detected|Fetching skills|Discovering skills|Cloning repository|Repository cloned|Installation failed|Canceled|Done!)/i.test(trimmed)
    ) {
      continue;
    }

    const indent = lineWithoutPrefix.length - lineWithoutPrefix.trimStart().length;

    if (indent >= 2 && SKILL_NAME_RE.test(trimmed)) {
      availableSkills.push({ skillName: trimmed });
      continue;
    }

    if (availableSkills.length > 0 && indent >= 4) {
      const previous = availableSkills[availableSkills.length - 1];
      previous.description = previous.description
        ? `${previous.description} ${trimmed}`.trim()
        : trimmed;
    }
  }

  return availableSkills.length > 0
    ? {
        packageName,
        availableSkills,
      }
    : null;
}
