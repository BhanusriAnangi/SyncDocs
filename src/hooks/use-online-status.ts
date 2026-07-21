"use client";

import { useState, useEffect } from "react";
import { useSyncStore } from "@/store/sync-store";

/**
 * Hook to track browser online/offline status.
 * Updates the global sync store and returns the current status.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const setStoreOnline = useSyncStore((state) => state.setIsOnline);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setStoreOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
      setStoreOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setStoreOnline]);

  return isOnline;
}
