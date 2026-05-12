import { stripAnsi } from "./skillsDiscovery";

export interface McpServerItem {
  title: string;
  lines: string[];
  url?: string;
  transport?: string;
  scope?: string;
}

export interface McpAgentItem {
  name: string;
  description?: string;
}

const DECORATIVE_RE = /^(?:[┌┐└┘├┤┬┴┼─═│║\s+=\-*\/])*$/;
const URL_RE = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/;
const TRANSPORT_RE = /\b(sse|http|stdio|websocket|ws)\b/i;
const SCOPE_RE = /\b(project|global)\b/i;

function isDecorativeLine(line: string): boolean {
  return DECORATIVE_RE.test(line) || line.trim().length === 0;
}

function looksLikeHeader(line: string): boolean {
  const lower = line.toLowerCase();
  return lower.includes("install with") || lower.includes("usage:") || lower.includes("example:");
}

function extractUrl(line: string): string | undefined {
  const match = line.match(URL_RE);
  return match ? match[0] : undefined;
}

function extractTransport(line: string): string | undefined {
  const match = line.match(TRANSPORT_RE);
  return match ? match[1].toLowerCase() : undefined;
}

function extractScope(line: string): string | undefined {
  const match = line.match(SCOPE_RE);
  return match ? match[1].toLowerCase() : undefined;
}

function cleanLine(line: string): string {
  return stripAnsi(line)
    .replace(/^\s*[├└┌┐│─═\s]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function parseMcpServers(stdout: string): McpServerItem[] | null {
  const rawLines = stdout.split("\n");
  const cleaned = rawLines.map(cleanLine).filter((l) => l.length > 0 && !isDecorativeLine(l) && !looksLikeHeader(l));

  if (cleaned.length === 0) return null;

  const items: McpServerItem[] = [];
  let current: McpServerItem | null = null;

  for (const line of cleaned) {
    const url = extractUrl(line);
    const transport = extractTransport(line);
    const scope = extractScope(line);

    const isProbablyNewEntry =
      !line.startsWith(" ") &&
      !line.startsWith("  ") &&
      (url !== undefined || transport !== undefined || /^[a-z0-9_-]+/i.test(line.split(/\s/)[0] ?? ""));

    if (isProbablyNewEntry || current === null) {
      if (current) items.push(current);
      const firstToken = line.split(/\s+/)[0] ?? line;
      current = {
        title: firstToken,
        lines: [line],
        url,
        transport,
        scope,
      };
    } else {
      current.lines.push(line);
      if (url && !current.url) current.url = url;
      if (transport && !current.transport) current.transport = transport;
      if (scope && !current.scope) current.scope = scope;
    }
  }

  if (current) items.push(current);
  return items.length > 0 ? items : null;
}

export function parseMcpAgents(stdout: string): McpAgentItem[] | null {
  const rawLines = stdout.split("\n");
  const cleaned = rawLines.map(cleanLine).filter((l) => l.length > 0 && !isDecorativeLine(l) && !looksLikeHeader(l));

  if (cleaned.length === 0) return null;

  const items: McpAgentItem[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const line = cleaned[i];
    if (line.toLowerCase().startsWith("install with")) continue;

    const name = line.split(/\s+/)[0] ?? line;
    let description: string | undefined;
    const rest = line.slice(name.length).trim();
    if (rest.length > 0) description = rest;

    if (name.length > 0) {
      items.push({ name, description });
    }
  }

  return items.length > 0 ? items : null;
}

export function cleanedMcpOutput(stdout: string): string[] {
  return stdout
    .split("\n")
    .map(cleanLine)
    .filter((l) => l.length > 0 && !isDecorativeLine(l));
}
