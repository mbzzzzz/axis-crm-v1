import { execSync } from "node:child_process";

const targets = ["chrome", "firefox"];
const failures = [];

for (const target of targets) {
  try {
    console.log(`Building ${target}...`);
    execSync(`npm run build:${target}`, { stdio: "inherit" });
    console.log(`✓ ${target} build succeeded\n`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${target} build failed: ${errorMessage}\n`);
    failures.push({ target, error: errorMessage });
  }
}

if (failures.length > 0) {
  console.error("\nBuild Summary:");
  failures.forEach(({ target, error }) => {
    console.error(`  ${target}: ${error}`);
  });
  process.exit(1);
}

console.log("All builds completed successfully");
