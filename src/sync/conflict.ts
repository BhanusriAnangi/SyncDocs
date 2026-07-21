import * as Y from "yjs";

/**
 * CRDT Conflict Resolution Engine (Yjs)
 *
 * Mathematical convergence guarantee:
 * CRDTs (Conflict-free Replicated Data Types) ensure that concurrent edits from
 * multiple offline or online clients merge deterministically into the exact same state,
 * regardless of the order in which updates are received.
 *
 * Key functions:
 * 1. createYDocFromState: Initializes a Y.Doc from a binary Uint8Array state
 * 2. encodeYDocState: Serializes a Y.Doc to binary state
 * 3. mergeYDocUpdates: Merges two or more binary Yjs update arrays deterministically
 * 4. calculateStateVector: Computes the state vector for delta syncing
 */

/**
 * Create a new Y.Doc and populate it from a binary update or state vector.
 */
export function createYDocFromState(stateBytes?: Uint8Array | null): Y.Doc {
  const ydoc = new Y.Doc();
  if (stateBytes && stateBytes.length > 0) {
    Y.applyUpdate(ydoc, stateBytes);
  }
  return ydoc;
}

/**
 * Encode a Y.Doc instance to a Uint8Array binary representation.
 */
export function encodeYDocState(ydoc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(ydoc);
}

/**
 * Merge multiple Yjs binary updates into a single unified Y.Doc state.
 *
 * Conflict Resolution Guarantee:
 * Concurrent edits from Client A (offline) and Client B (online) will produce
 * the EXACT same merged Y.Doc state regardless of which update is processed first.
 */
export function mergeYDocUpdates(updates: Uint8Array[]): Uint8Array {
  if (updates.length === 0) return new Uint8Array();
  if (updates.length === 1) return updates[0];

  const mergedDoc = new Y.Doc();
  for (const update of updates) {
    if (update && update.length > 0) {
      Y.applyUpdate(mergedDoc, update);
    }
  }

  return Y.encodeStateAsUpdate(mergedDoc);
}

/**
 * Compute the difference (delta) between client state and server state vector.
 * Returns only the missing updates required to bring the client up to date.
 */
export function computeDeltaUpdate(
  ydoc: Y.Doc,
  targetStateVector: Uint8Array
): Uint8Array {
  return Y.encodeStateAsUpdate(ydoc, targetStateVector);
}

/**
 * Get current state vector of a Y.Doc for efficient sync handshake.
 */
export function getStateVector(ydoc: Y.Doc): Uint8Array {
  return Y.encodeStateVector(ydoc);
}
