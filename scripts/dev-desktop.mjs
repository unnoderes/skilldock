import { execa } from "execa";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const electronCommand = process.platform === "win32" ? "electron.cmd" : "electron";

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

await execa(pnpmCommand, ["--filter", "@skilldock/desktop", "build"], {
  cwd: rootDir,
  stdio: "inherit",
});

const runningServices = services.map((service) => {
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
});

let shuttingDown = false;
let electronChild = null;

function stopServices(reason) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (reason) {
    process.stderr.write(`${reason}\n`);
  }

  if (electronChild?.pid) {
    if (process.platform === "win32") {
      void execa("taskkill", ["/PID", String(electronChild.pid), "/T", "/F"], {
        reject: false,
        windowsHide: true,
      });
    } else {
      electronChild.kill("SIGTERM", {
        forceKillAfterTimeout: 2000,
      });
    }
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

const servicesReady = Promise.all([
  waitForUrl("http://127.0.0.1:3301/healthz"),
  waitForUrl("http://127.0.0.1:5173"),
]);

try {
  await servicesReady;

  electronChild = execa(electronCommand, ["apps/desktop/dist/main.js"], {
    cwd: rootDir,
    reject: false,
    cleanup: true,
    windowsHide: false,
    env: {
      ...process.env,
      SKILLDOCK_DESKTOP_RENDERER_URL: "http://127.0.0.1:5173",
    },
  });

  pipeLines(electronChild.stdout, "apps/desktop dev: ");
  pipeLines(electronChild.stderr, "apps/desktop dev: ");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  stopServices(`desktop dev failed to start: ${message}`);
}

const exitCode = await new Promise((resolve) => {
  let settled = false;
  let remaining = runningServices.length;

  const resolveOnce = (code) => {
    if (settled) return;
    settled = true;
    resolve(code);
  };

  for (const service of runningServices) {
    service.child.then((result) => {
      remaining -= 1;

      if (settled) return;
      if (shuttingDown) {
        if (remaining === 0) {
          resolveOnce(0);
        }
        return;
      }

      const code = result.exitCode ?? 0;
      const unexpectedReason = code === 0
        ? `${service.name} dev exited unexpectedly.`
        : `${service.name} dev exited with code ${code}.`;

      stopServices(unexpectedReason);
      resolveOnce(code === 0 ? 1 : code);
    }).catch((error) => {
      remaining -= 1;

      if (settled) return;
      const message = error instanceof Error ? error.message : String(error);
      stopServices(`${service.name} dev failed to start: ${message}`);
      resolveOnce(1);
    });
  }

  if (electronChild) {
    electronChild.then((result) => {
      if (shuttingDown) {
        resolveOnce(0);
        return;
      }

      const code = result.exitCode ?? 0;
      stopServices(code === 0 ? undefined : `apps/desktop dev exited with code ${code}.`);
      resolveOnce(code);
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      stopServices(`apps/desktop dev failed to start: ${message}`);
      resolveOnce(1);
    });
  }
});

process.exit(exitCode);
