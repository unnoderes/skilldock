import {
  cleanOutputLines,
} from "./outputNormalization";

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

const URL_RE = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/;
const TRANSPORT_RE = /\b(sse|http|stdio|websocket|ws)\b/i;
const SCOPE_RE = /\b(project|global)\b/i;
const HEADER_TOKEN_RE = /^(argument|mcp client|aliases|local|global|server|name|transport|scope|status)$/i;
const IDENTIFIER_RE = /^[a-z][a-z0-9_-]*$/i;

function extractUrl(line: string): string | undefined {
  return line.match(URL_RE)?.[0];
}

function extractTransport(line: string): string | undefined {
  return line.match(TRANSPORT_RE)?.[1]?.toLowerCase();
}

function extractScope(line: string): string | undefined {
  return line.match(SCOPE_RE)?.[1]?.toLowerCase();
}

function getServerLines(stdout: string): string[] {
  return cleanOutputLines(stdout, {
    mode: "mcp",
    collapseInnerWhitespace: true,
  });
}

function getAgentLines(stdout: string): string[] {
  return cleanOutputLines(stdout, {
    mode: "mcp",
    preserveTrailingWhitespace: true,
  });
}

export function parseMcpServers(stdout: string): McpServerItem[] | null {
  const cleaned = getServerLines(stdout);
  if (cleaned.length === 0) return null;

  const items: McpServerItem[] = [];
  let current: McpServerItem | null = null;

  for (const line of cleaned) {
    const url = extractUrl(line);
    const transport = extractTransport(line);
    const scope = extractScope(line);
    const firstToken = line.split(/\s+/)[0] ?? line;

    const isProbablyNewEntry =
      url !== undefined ||
      transport !== undefined ||
      /^[a-z0-9_/-]+$/i.test(firstToken);

    if (isProbablyNewEntry || current === null) {
      if (current) items.push(current);
      current = {
        title: firstToken,
        lines: [line],
        url,
        transport,
        scope,
      };
      continue;
    }

    current.lines.push(line);
    if (url && !current.url) current.url = url;
    if (transport && !current.transport) current.transport = transport;
    if (scope && !current.scope) current.scope = scope;
  }

  if (current) items.push(current);
  return items.length > 0 ? items : null;
}

export function parseMcpAgents(stdout: string): McpAgentItem[] | null {
  const cleaned = getAgentLines(stdout);
  if (cleaned.length === 0) return null;

  const items: McpAgentItem[] = [];

  for (const line of cleaned) {
    const columns = line.split(/\s{2,}/).map((column) => column.trim()).filter(Boolean);
    const name = columns[0] ?? "";
    if (!name || HEADER_TOKEN_RE.test(name) || !IDENTIFIER_RE.test(name)) {
      continue;
    }

    const description = columns.slice(1).join(" ").trim() || undefined;
    items.push({ name, description });
  }

  return items.length > 0 ? items : null;
}

export function cleanedMcpOutput(stdout: string): string[] {
  return getServerLines(stdout);
}
