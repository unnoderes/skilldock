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

/* ─── Noise patterns ─── */

// Purely decorative lines (box-drawing chars, spaces, symbols)
const DECORATIVE_RE = /^(?:[┌┐└┘├┤┬┴┼─═│║\s+=\-*\/█▓▒░╔╗╚╝])*$/;

// Lines overwhelmingly decorative symbols (banner fragments, borders)
const MOSTLY_DECORATIVE_RE = /^[\s┌┐└┘├┤┬┴┼─═│║█▓▒░╔╗╚╝●•·›►▶\-–—_=+|/\\*]{3,}$/;

// Banner lines containing block-drawing characters
const BANNER_RE = /[█▓▒░]/;

// Table headers and section labels
const TABLE_HEADER_RE = /^(Argument|MCP Client|Aliases|Local|Global|Server|Name|Transport|Scope|Status)\s+/i;
const SEPARATOR_RE = /^[\s\-–—═━┅┄┈]+$/;
const HEADER_LABEL_RE = /^(Supported agents|Installed MCP servers|MCP servers|Available agents|Results?)\s*[:：]?\s*$/i;

// Empty-state messages that should trigger normal empty UI instead of cards
const EMPTY_STATE_RE = /no agents detected|no servers?|no mcp|no config(uration)?|nothing (found|installed|to show)|not detected|empty/i;

// Instructional noise that should not be rendered as list items
const INSTRUCTIONAL_RE = /usage:|example:|install with/i;

export function isDecorativeLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return true;
  if (DECORATIVE_RE.test(trimmed)) return true;
  if (MOSTLY_DECORATIVE_RE.test(trimmed)) return true;
  if (BANNER_RE.test(trimmed)) return true;
  if (SEPARATOR_RE.test(trimmed)) return true;
  if (HEADER_LABEL_RE.test(trimmed)) return true;
  if (TABLE_HEADER_RE.test(trimmed)) return true;
  if (INSTRUCTIONAL_RE.test(trimmed)) return true;
  return false;
}

export function isEmptyStateLine(line: string): boolean {
  return EMPTY_STATE_RE.test(line);
}

/* ─── Cleaning helpers ─── */

function cleanLine(line: string): string {
  return stripAnsi(line)
    .replace(/^[├└┌┐│─═\s●•·›►▶█▓▒░╔╗╚╝]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanLinePreserveSpacing(line: string): string {
  return stripAnsi(line)
    .replace(/^[├└┌┐│─═\s●•·›►▶█▓▒░╔╗╚╝]+/, "")
    .replace(/\s+$/, "");
}

/* ─── Content extraction ─── */

const URL_RE = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/;
const TRANSPORT_RE = /\b(sse|http|stdio|websocket|ws)\b/i;
const SCOPE_RE = /\b(project|global)\b/i;

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

/* ─── add-mcp list ─── */

export function parseMcpServers(stdout: string): McpServerItem[] | null {
  const rawLines = stdout.split("\n");
  const cleaned = rawLines
    .map(cleanLine)
    .filter((l) => l.length > 0 && !isDecorativeLine(l) && !isEmptyStateLine(l));

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
      (url !== undefined || transport !== undefined || /^[a-z0-9_/-]+/i.test(line.split(/\s/)[0] ?? ""));

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

/* ─── add-mcp list-agents ─── */

export function parseMcpAgents(stdout: string): McpAgentItem[] | null {
  const rawLines = stdout.split("\n");
  const stripped = rawLines.map(cleanLinePreserveSpacing);

  const cleaned = stripped.filter((l) => {
    const trimmed = l.trim();
    return trimmed.length > 0 && !isDecorativeLine(trimmed) && !isEmptyStateLine(trimmed);
  });

  if (cleaned.length === 0) return null;

  const items: McpAgentItem[] = [];

  for (const line of cleaned) {
    const trimmed = line.trim();

    // Skip residual table headers / separators
    if (/^(Argument|MCP Client|Aliases|Local|Global)$/i.test(trimmed)) continue;
    if (/^[─═━┅┄┈\-–—]+$/.test(trimmed)) continue;

    // Split by 2+ spaces to respect table columns
    const columns = line.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
    const name = columns[0] ?? "";
    if (!name) continue;

    // Defensive: reject known header words and non-identifier tokens
    if (/^(argument|mcp client|aliases|local|global|server|name|transport|scope|status)$/i.test(name)) continue;

    // Require agent-like identifiers (start with letter, alphanumeric + hyphen/underscore)
    if (!/^[a-z][a-z0-9_-]*$/i.test(name)) continue;

    // Everything after the first column becomes description
    let description: string | undefined = columns.slice(1).join(" ").trim();
    if (!description || /^[─═━\-–—]+$/.test(description)) {
      description = undefined;
    }

    items.push({ name, description });
  }

  return items.length > 0 ? items : null;
}

/* ─── Fallback text cleaning ─── */

export function cleanedMcpOutput(stdout: string): string[] {
  return stdout
    .split("\n")
    .map(cleanLine)
    .filter((l) => l.length > 0 && !isDecorativeLine(l) && !isEmptyStateLine(l));
}
