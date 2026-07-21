"use client";

import { useEffect, useRef } from "react";
import { startSyncEngine, stopSyncEngine, forceSync } from "@/sync/engine";
import { useSyncStore } from "@/store/sync-store";
import { getPendingCount } from "@/sync/queue";

/**
 * Hook to initialize and manage the background sync engine.
 * 
 * Must be called once at the app level (e.g., in the dashboard layout).
 * Handles lifecycle: starts engine on mount, stops on unmount.
 */
export function useSyncEngine() {
  const engineStarted = useRef(false);
  const status = useSyncStore((s) => s.status);
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const isOnline = useSyncStore((s) => s.isOnline);
  const error = useSyncStore((s) => s.error);

  useEffect(() => {
    if (engineStarted.current) return;
    engineStarted.current = true;

    startSyncEngine();

    // Initial pending count
    getPendingCount().then((count) => {
      useSyncStore.getState().setPendingCount(count);
    });

    return () => {
      stopSyncEngine();
      engineStarted.current = false;
    };
  }, []);

  return {
    status,
    pendingCount,
    lastSyncedAt,
    isOnline,
    error,
    forceSync,
  };
}
