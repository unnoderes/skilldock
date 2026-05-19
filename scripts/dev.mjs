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

async function waitForUrl(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) {
        return;
      }
    } catch {
      // The service is still starting up.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function startService(service) {
  const child = execa(pnpmCommand, service.args, {
    cwd: rootDir,
    reject: false,
    cleanup: true,
    detached: process.platform === "win32",
    windowsHide: true,
  });

  pipeLines(child.stdout, `${service.name} dev: `);
  pipeLines(child.stderr, `${service.name} dev: `);

  return { ...service, child };
}

const runningServices = [];
const serverService = startService(services[0]);
runningServices.push(serverService);

await waitForUrl("http://127.0.0.1:3301/healthz");

for (const service of services.slice(1)) {
  runningServices.push(startService(service));
}

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
