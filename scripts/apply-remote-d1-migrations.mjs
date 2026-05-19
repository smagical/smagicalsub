import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = resolve(repoRoot, "wrangler.jsonc");
const tempConfigPath = resolve(repoRoot, ".wrangler", "deploy", "wrangler.remote-d1.jsonc");

const config = JSON.parse(await readFile(configPath, "utf8"));
const d1 = config.d1_databases?.find((database) => database.binding === "DB");

if (!d1?.database_name) {
  throw new Error("wrangler.jsonc must define a D1 database named DB with database_name.");
}

const databases = JSON.parse(await wrangler(["d1", "list", "--json", "--config", configPath]));
const remoteDatabase = databases.find((database) => database.name === d1.database_name || database.uuid === d1.database_id);

if (!remoteDatabase?.uuid) {
  throw new Error(`Could not find remote D1 database "${d1.database_name}". Deploy the Worker once so Wrangler automatic provisioning can create it.`);
}

const tempConfig = {
  ...config,
  d1_databases: config.d1_databases.map((database) =>
    database.binding === d1.binding
      ? {
          ...database,
          database_id: remoteDatabase.uuid
        }
      : database
  )
};

await mkdir(dirname(tempConfigPath), { recursive: true });
await writeFile(tempConfigPath, `${JSON.stringify(tempConfig, null, 2)}\n`);

try {
  await wrangler(["d1", "migrations", "apply", "DB", "--remote", "--config", tempConfigPath], { stdio: "inherit" });
} finally {
  await rm(tempConfigPath, { force: true });
}

function wrangler(args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("pnpm", ["--filter", "@smagicalsub/web", "exec", "wrangler", ...args], {
      cwd: repoRoot,
      shell: process.platform === "win32",
      stdio: options.stdio ?? ["ignore", "pipe", "inherit"]
    });

    let stdout = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise(stdout);
        return;
      }

      reject(new Error(`wrangler ${args.join(" ")} exited with code ${code}`));
    });
  });
}
