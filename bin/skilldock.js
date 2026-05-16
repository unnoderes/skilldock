#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3301;
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

function color(code, text) {
  return useColor ? `\x1b[${code}m${text}\x1b[0m` : text;
}

function renderBanner(url, version) {
  const title = [
    " ____  _    _ _ _ ____             _    ",
    "/ ___|| | _(_) | |  _ \\  ___   ___| | __",
    "\\___ \\| |/ / | | | | | |/ _ \\ / __| |/ /",
    " ___) |   <| | | | |_| | (_) | (__|   < ",
    "|____/|_|\\_\\_|_|_|____/ \\___/ \\___|_|\\_\\",
  ].map((line, index) => color(index % 2 === 0 ? 37 : 90, line)).join("\n");

  return `${title}

${color(90, "The local console for agent skills and MCP")}

${color(90, "$")} npx skilldock                 ${color(90, "Start the local console")}
${color(90, "$")} npx skilldock --port 3301     ${color(90, "Choose a server port")}

${color(90, "Version")}    skilldock v${version}
${color(90, "Local URL")}  ${url}`;
}

function usage() {
  return `SkillDock

Usage:
  skilldock [--host <host>] [--port <port>]

Options:
  --host <host>   Host to bind. Defaults to 127.0.0.1.
  --port <port>   Port to bind. Defaults to 3301.
  --help          Show this help.
  --version       Show package version.

Environment:
  SKILLDOCK_HOST, SKILLDOCK_SERVER_HOST
  SKILLDOCK_PORT, SKILLDOCK_SERVER_PORT
`;
}

function readOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`invalid port: ${value}`);
  }
  return port;
}

async function readPackageVersion(rootDir) {
  const packageJson = JSON.parse(await readFile(path.join(rootDir, "package.json"), "utf8"));
  return String(packageJson.version ?? "0.0.0");
}

const args = process.argv.slice(2);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage());
  process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
  console.log(await readPackageVersion(rootDir));
  process.exit(0);
}

try {
  process.env.SKILLDOCK_SERVER_LOGGER ??= "false";

  const host = readOption(args, "--host")
    ?? process.env.SKILLDOCK_HOST
    ?? process.env.SKILLDOCK_SERVER_HOST
    ?? DEFAULT_HOST;
  const port = parsePort(
    readOption(args, "--port")
      ?? process.env.SKILLDOCK_PORT
      ?? process.env.SKILLDOCK_SERVER_PORT
      ?? String(DEFAULT_PORT),
  );
  const version = await readPackageVersion(rootDir);
  const displayUrl = `http://${host}:${port}`;
  console.log(renderBanner(displayUrl, version));
  console.log("");

  const { startServer } = await import("../apps/server/dist/index.js");
  const staticRoot = path.join(rootDir, "apps", "web", "dist");
  const url = await startServer({
    host,
    port,
    staticRoot,
    launchProjectPath: rootDir,
  });

  if (url !== displayUrl) {
    console.log(`SkillDock running at ${url}`);
  }
  console.log("Press Ctrl+C to stop.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`SkillDock failed to start: ${message}`);
  process.exit(1);
}
