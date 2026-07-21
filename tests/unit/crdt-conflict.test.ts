import { mergeYDocUpdates, createYDocFromState, encodeYDocState } from "../../src/sync/conflict";
import * as Y from "yjs";
import assert from "node:assert";

/**
 * Unit Test Suite: CRDT Conflict Resolution Engine
 */
export function runCrdtTests() {
  console.log("🧪 Running CRDT Conflict Resolution Tests...");

  // Test 1: Concurrent Edits Merge Deterministically
  const docA = new Y.Doc();
  const textA = docA.getText("content");
  textA.insert(0, "Hello World from Client A");

  const docB = new Y.Doc();
  const textB = docB.getText("content");
  textB.insert(0, "Concurrent edit from Client B. ");

  const updateA = encodeYDocState(docA);
  const updateB = encodeYDocState(docB);

  // Merge A into B, and B into A
  const mergedAB = mergeYDocUpdates([updateA, updateB]);
  const mergedBA = mergeYDocUpdates([updateB, updateA]);

  // Verify convergence: mergedAB and mergedBA MUST produce identical byte states
  const docResultAB = createYDocFromState(mergedAB);
  const docResultBA = createYDocFromState(mergedBA);

  assert.strictEqual(
    docResultAB.getText("content").toString(),
    docResultBA.getText("content").toString(),
    "CRDT Merged states must be mathematically identical regardless of arrival order"
  );

  console.log("✅ Test 1 Passed: Deterministic CRDT Convergence verified.");

  // Test 2: Non-destructive merge (No data loss)
  const content = docResultAB.getText("content").toString();
  assert(content.includes("Client A"), "Client A content must be preserved");
  assert(content.includes("Client B"), "Client B content must be preserved");

  console.log("✅ Test 2 Passed: Zero data loss verified.");
  console.log("🎉 All CRDT Conflict Resolution tests passed successfully!");
}

if (require.main === module) {
  runCrdtTests();
}
