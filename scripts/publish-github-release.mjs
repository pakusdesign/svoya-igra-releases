import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function readReleaseEnv() {
  const envFile = path.join(process.cwd(), ".env.release");
  if (!existsSync(envFile)) return;

  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

readReleaseEnv();

if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
  console.error("Не найден GH_TOKEN или GITHUB_TOKEN.");
  console.error("Создайте .env.release на основе .env.release.example или выполните команду с GH_TOKEN=...");
  process.exit(1);
}

run("npm", ["run", "build"]);
run("npx", ["electron-builder", "--win", "--x64", "--publish", "always"]);
run("npx", ["electron-builder", "--mac", "--publish", "always"]);
