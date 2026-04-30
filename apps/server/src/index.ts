import cors from "@fastify/cors";
import { execa } from "execa";
import Fastify from "fastify";
import { z } from "zod";
import type { AppStatus, CliName, CommandResult, SkillRecord } from "@skilldock/shared";

const server = Fastify({ logger: true });
await server.register(cors, { origin: true });

const PORT = Number(process.env.SKILLDOCK_SERVER_PORT ?? 3301);
const HOST = process.env.SKILLDOCK_SERVER_HOST ?? "127.0.0.1";

const secretPatterns = [
  /(sk-[A-Za-z0-9_-]{8,})/g,
  /(sk-ant-[A-Za-z0-9_-]{8,})/g,
  /(ghp_[A-Za-z0-9_]{8,})/g,
  /((?:API_KEY|TOKEN|SECRET|PASSWORD)=)[^\s]+/gi,
];

function redact(value: string): string {
  return secretPatterns.reduce((text, pattern) => text.replace(pattern, (_match, prefix) => {
    if (typeof prefix === "string" && prefix.endsWith("=")) return `${prefix}[REDACTED]`;
    return "[REDACTED]";
  }), value);
}

async function runCli(command: "npx", args: string[]): Promise<CommandResult> {
  const started = Date.now();
  try {
    const result = await execa(command, args, { reject: false, stripFinalNewline: false });
    return {
      command,
      args,
      exitCode: result.exitCode ?? 0,
      stdout: redact(result.stdout),
      stderr: redact(result.stderr),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      command,
      args,
      exitCode: 1,
      stdout: "",
      stderr: redact(message),
      durationMs: Date.now() - started,
    };
  }
}

async function cliStatus(name: CliName): Promise<AppStatus["cli"][number]> {
  const result = await runCli("npx", [name, "--version"]);
  const version = result.stdout.trim() || result.stderr.trim();
  return {
    name,
    available: result.exitCode === 0,
    version: result.exitCode === 0 ? version : undefined,
    error: result.exitCode === 0 ? undefined : result.stderr || result.stdout,
  };
}

server.get("/api/status", async (): Promise<AppStatus> => {
  const cli = await Promise.all([cliStatus("skills"), cliStatus("add-mcp")]);
  return {
    name: "SkillDock",
    ok: true,
    serverTime: new Date().toISOString(),
    cli,
  };
});

server.get("/api/skills/list", async (request) => {
  const querySchema = z.object({ scope: z.enum(["project", "global"]).default("project") });
  const query = querySchema.parse(request.query);
  const args = ["skills", "list", "--json"];
  if (query.scope === "global") args.push("--global");
  const result = await runCli("npx", args);
  let skills: SkillRecord[] = [];
  if (result.exitCode === 0 && result.stdout.trim()) {
    skills = JSON.parse(result.stdout) as SkillRecord[];
  }
  return { result, skills };
});

server.post("/api/skills/help", async () => runCli("npx", ["skills", "--help"]));
server.post("/api/mcp/help", async () => runCli("npx", ["add-mcp", "--help"]));
server.get("/api/mcp/list-agents", async () => runCli("npx", ["add-mcp", "list-agents"]));
server.get("/api/mcp/list", async (request) => {
  const querySchema = z.object({ scope: z.enum(["project", "global"]).default("project") });
  const query = querySchema.parse(request.query);
  const args = ["add-mcp", "list"];
  if (query.scope === "global") args.push("--global");
  return runCli("npx", args);
});

server.get("/healthz", async () => ({ ok: true }));

await server.listen({ port: PORT, host: HOST });
