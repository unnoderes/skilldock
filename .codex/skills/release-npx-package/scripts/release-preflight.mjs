#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    }).trim();
  } catch (error) {
    if (options.optional) return "";
    const stderr = error?.stderr?.toString?.() ?? "";
    throw new Error(`${command} ${args.join(" ")} failed${stderr ? `:\n${stderr}` : ""}`);
  }
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const cwd = process.cwd();
const packagePath = path.join(cwd, "package.json");
if (!existsSync(packagePath)) {
  throw new Error("package.json not found in current directory");
}

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const targetVersion = arg("--target-version");

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

if (!packageJson.name) fail("package.json#name is missing");
if (!packageJson.version) fail("package.json#version is missing");
if (packageJson.private === true) fail("package is private");
if (!packageJson.bin) fail("package.json#bin is missing; package may not be npx-runnable");
if (!packageJson.files) warn("package.json#files is missing; npm tarball may include unwanted files");

const version = targetVersion ?? packageJson.version;
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  fail(`target version is not semver-like: ${version}`);
}

const status = run("git", ["status", "--short"], { optional: true });
if (status) warn("git worktree has local changes; use a clean release worktree before committing");

const branch = run("git", ["branch", "--show-current"], { optional: true });
if (branch === "main" || branch === "master") {
  fail("do not prepare releases directly on main/master");
}

const scripts = packageJson.scripts ?? {};
for (const script of ["typecheck", "build"]) {
  if (!scripts[script]) warn(`package.json#scripts.${script} is missing`);
}

if (packageJson.name) {
  const published = run("npm", ["view", `${packageJson.name}@${version}`, "version"], { optional: true });
  if (published === version) {
    fail(`${packageJson.name}@${version} already appears to be published`);
  }

  const latest = run("npm", ["view", packageJson.name, "version"], { optional: true });
  if (latest) {
    warn(`${packageJson.name} latest on npm is ${latest}`);
  } else {
    warn(`${packageJson.name} does not appear to exist on npm yet`);
  }
}

const whoami = run("npm", ["whoami"], { optional: true });
if (!whoami && !process.env.NPM_TOKEN) {
  warn("npm auth not available; publishing will require npm login or NPM_TOKEN");
}

for (const message of warnings) {
  console.error(`WARN: ${message}`);
}

if (failures.length) {
  for (const message of failures) {
    console.error(`FAIL: ${message}`);
  }
  process.exit(1);
}

console.log(`OK: release preflight passed for ${packageJson.name}@${version}`);
