import { execSync } from "node:child_process";

const targets = ["chrome", "firefox"];

for (const mode of targets) {
  console.log(`\n📦 Building extension bundle for ${mode}...\n`);
  execSync(`npx vite build --mode ${mode}`, {
    stdio: "inherit",
  });
}

console.log("\n✅ Extension bundles created in dist/.\n");

