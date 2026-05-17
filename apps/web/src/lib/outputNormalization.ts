import type { CommandResult } from "@skilldock/shared";

export type OutputNormalizationMode = "generic" | "mcp";
export type ResultStreamKind = "error" | "stdout" | "stderr";

export interface CleanOutputOptions {
  mode?: OutputNormalizationMode;
  keepBlankLines?: boolean;
  preserveTrailingWhitespace?: boolean;
  collapseInnerWhitespace?: boolean;
  suppressEmptyStateLines?: boolean;
}

export interface ResultOutputSection {
  key: ResultStreamKind;
  rawText: string;
  cleanText: string;
}

const ANSI_ESCAPE_RE =
  /\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\][^\u0007]*(?:\u0007|\u001B\\))/g;

const DECORATION_CHAR_CLASS =
  "\\u2500-\\u257F\\u2580-\\u259F\\u2800-\\u28FF\\u2022\\u2023\\u2043\\u25A0-\\u25FF";

const PURE_DECORATIVE_RE = new RegExp(
  `^[\\s${DECORATION_CHAR_CLASS}=+\\-_*|/\\\\~:]{3,}$`,
  "u",
);

const LEADING_DECORATION_RE = new RegExp(
  `^[\\s${DECORATION_CHAR_CLASS}=+\\-_*|/\\\\~]{1,8}(?=\\s)\\s*`,
  "u",
);
const TRAILING_DECORATION_RE = new RegExp(
  `\\s+[${DECORATION_CHAR_CLASS}=+\\-_*|/\\\\~]{1,8}$`,
  "u",
);

const TABLE_HEADER_RE =
  /^(Argument|MCP Client|Aliases|Local|Global|Server|Name|Transport|Scope|Status)\s+/i;
const HEADER_LABEL_RE =
  /^(Supported agents|Installed MCP servers|MCP servers|Available agents|Results?)\s*[:：]?\s*$/i;
const EMPTY_STATE_RE =
  /no agents detected|no servers?|no mcp|no config(uration)?|nothing (found|installed|to show)|not detected|empty/i;
const INSTRUCTIONAL_RE = /usage:|example:|install with/i;
const ASCII_IDENTIFIER_RE = /[A-Za-z0-9]/;
const URL_TEXT_RE = /https?:\/\//i;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_ESCAPE_RE, "");
}

export function isDecorativeLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return true;
  return PURE_DECORATIVE_RE.test(trimmed);
}

export function isEmptyStateLine(line: string): boolean {
  return EMPTY_STATE_RE.test(line.trim());
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

function isMcpNoiseLine(line: string, suppressEmptyStateLines: boolean): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return true;
  if (isDecorativeLine(trimmed)) return true;
  if (TABLE_HEADER_RE.test(trimmed)) return true;
  if (HEADER_LABEL_RE.test(trimmed)) return true;
  if (INSTRUCTIONAL_RE.test(trimmed)) return true;
  if (suppressEmptyStateLines && isEmptyStateLine(trimmed)) return true;
  if (!ASCII_IDENTIFIER_RE.test(trimmed) && !URL_TEXT_RE.test(trimmed)) return true;
  return false;
}

export function cleanOutputLine(line: string, options: Omit<CleanOutputOptions, "mode" | "keepBlankLines" | "suppressEmptyStateLines"> = {}): string {
  const stripped = stripAnsi(line).replace(/\r/g, "");
  const withoutLeadingNoise = stripped.replace(LEADING_DECORATION_RE, "");
  const withoutTrailingNoise = withoutLeadingNoise.replace(TRAILING_DECORATION_RE, "");
  const normalized = options.collapseInnerWhitespace
    ? withoutTrailingNoise.replace(/[^\S\n]{2,}/g, " ")
    : withoutTrailingNoise;

  return options.preserveTrailingWhitespace
    ? normalized.replace(/\s+$/, "")
    : normalized.trim();
}

export function cleanOutputLines(text: string, options: CleanOutputOptions = {}): string[] {
  const {
    mode = "generic",
    keepBlankLines = false,
    preserveTrailingWhitespace = false,
    collapseInnerWhitespace = false,
    suppressEmptyStateLines = true,
  } = options;

  const cleanedLines: string[] = [];
  let previousWasBlank = true;

  for (const rawLine of normalizeLineEndings(text).split("\n")) {
    const cleanedLine = cleanOutputLine(rawLine, {
      preserveTrailingWhitespace,
      collapseInnerWhitespace,
    });

    const trimmed = cleanedLine.trim();
    if (trimmed.length === 0) {
      if (keepBlankLines && !previousWasBlank && cleanedLines.length > 0) {
        cleanedLines.push("");
      }
      previousWasBlank = true;
      continue;
    }

    const isNoiseLine = mode === "mcp"
      ? isMcpNoiseLine(trimmed, suppressEmptyStateLines)
      : isDecorativeLine(trimmed);

    if (isNoiseLine) {
      continue;
    }

    cleanedLines.push(preserveTrailingWhitespace ? cleanedLine : trimmed);
    previousWasBlank = false;
  }

  while (cleanedLines[0] === "") cleanedLines.shift();
  while (cleanedLines[cleanedLines.length - 1] === "") cleanedLines.pop();

  return cleanedLines;
}

export function cleanOutputText(text: string, options: CleanOutputOptions = {}): string {
  return cleanOutputLines(text, options).join("\n");
}

export function buildResultOutputSections(
  result: Pick<CommandResult, "stdout" | "stderr">,
  error?: string,
): ResultOutputSection[] {
  const sections: Array<{ key: ResultStreamKind; rawText: string }> = [];

  if (error && error.trim()) {
    sections.push({ key: "error", rawText: error });
  }

  if (result.stdout && result.stdout.trim()) {
    sections.push({ key: "stdout", rawText: result.stdout });
  }

  if (result.stderr && result.stderr.trim()) {
    sections.push({ key: "stderr", rawText: result.stderr });
  }

  return sections.map((section) => ({
    ...section,
    cleanText: cleanOutputText(section.rawText, {
      mode: "generic",
      keepBlankLines: true,
      preserveTrailingWhitespace: true,
    }),
  }));
}
