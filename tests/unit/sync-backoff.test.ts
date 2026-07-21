import { getBackoffDelay } from "../../src/lib/utils";
import assert from "node:assert";

/**
 * Unit Test Suite: Exponential Backoff & Jitter
 */
export function runBackoffTests() {
  console.log("🧪 Running Sync Engine Backoff Tests...");

  // Test 1: Exponential growth
  const delay0 = getBackoffDelay(0, 1000, 30000);
  const delay1 = getBackoffDelay(1, 1000, 30000);
  const delay2 = getBackoffDelay(2, 1000, 30000);

  assert(delay0 >= 750 && delay0 <= 1250, `Delay 0 within expected jitter range: ${delay0}`);
  assert(delay1 >= 1500 && delay1 <= 2500, `Delay 1 within expected jitter range: ${delay1}`);
  assert(delay2 >= 3000 && delay2 <= 5000, `Delay 2 within expected jitter range: ${delay2}`);

  console.log("✅ Test 1 Passed: Exponential backoff growth verified.");

  // Test 2: Maximum delay cap enforced
  const maxDelay = getBackoffDelay(10, 1000, 30000);
  assert(maxDelay <= 37500, `Max delay capped with jitter: ${maxDelay}`);

  console.log("✅ Test 2 Passed: Maximum delay cap enforced.");
  console.log("🎉 All Sync Engine Backoff tests passed successfully!");
}

if (require.main === module) {
  runBackoffTests();
}
