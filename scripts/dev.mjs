import { execa } from "execa";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const services = [
  {
    name: "apps/server",
    args: ["--filter", "@skilldock/server", "dev"],
  },
  {
    name: "apps/web",
    args: ["--filter", "@skilldock/web", "dev"],
  },
];

function pipeLines(stream, prefix) {
  if (!stream) return;

  const reader = readline.createInterface({ input: stream });
  reader.on("line", (line) => {
    process.stdout.write(`${prefix}${line}\n`);
  });
}

const runningServices = services.map((service) => {
  const child = execa(pnpmCommand, service.args, {
    cwd: rootDir,
    reject: false,
    cleanup: true,
    detached: process.platform === "win32",
  });

  pipeLines(child.stdout, `${service.name} dev: `);
  pipeLines(child.stderr, `${service.name} dev: `);

  return { ...service, child };
});

let shuttingDown = false;

function stopServices(reason) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (reason) {
    process.stderr.write(`${reason}\n`);
  }

  for (const service of runningServices) {
    if (process.platform === "win32" && service.child.pid) {
      void execa("taskkill", ["/PID", String(service.child.pid), "/T", "/F"], {
        reject: false,
        windowsHide: true,
      });
      continue;
    }

    service.child.kill("SIGTERM", {
      forceKillAfterTimeout: 2000,
    });
  }
}

process.on("SIGINT", () => stopServices());
process.on("SIGTERM", () => stopServices());

const exitCode = await new Promise((resolve) => {
  let settled = false;
  let remaining = runningServices.length;

  for (const service of runningServices) {
    service.child.then((result) => {
      remaining -= 1;

      if (settled) return;
      if (shuttingDown) {
        if (remaining === 0) {
          settled = true;
          resolve(0);
        }
        return;
      }

      const code = result.exitCode ?? 0;
      const unexpectedReason = code === 0
        ? `${service.name} dev exited unexpectedly.`
        : `${service.name} dev exited with code ${code}.`;

      settled = true;
      stopServices(unexpectedReason);
      resolve(code === 0 ? 1 : code);
    }).catch((error) => {
      remaining -= 1;

      if (settled) return;
      const message = error instanceof Error ? error.message : String(error);
      settled = true;
      stopServices(`${service.name} dev failed to start: ${message}`);
      resolve(1);
    });
  }
});

process.exit(exitCode);
