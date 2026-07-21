const { execSync } = require("child_process");

console.log("==========================================");
console.log("   SYNC DOCS AUTOMATED TEST RUNNER        ");
console.log("==========================================");

try {
  // Install tsx if missing or use npx
  execSync("npx tsx tests/unit/crdt-conflict.test.ts", { stdio: "inherit" });
  execSync("npx tsx tests/unit/sync-backoff.test.ts", { stdio: "inherit" });

  console.log("\n==========================================");
  console.log(" ALL TEST SUITES PASSED CLEANLY (100%)    ");
  console.log("==========================================");
} catch (error) {
  console.error("Test execution failed:", error);
  process.exit(1);
}
