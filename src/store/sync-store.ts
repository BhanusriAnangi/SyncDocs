import { create } from "zustand";
import type { SyncStatusType } from "@/utils/constants";
import { SYNC_STATUS } from "@/utils/constants";

interface SyncState {
  status: SyncStatusType;
  pendingCount: number;
  lastSyncedAt: Date | null;
  isOnline: boolean;
  error: string | null;
  setStatus: (status: SyncStatusType) => void;
  setPendingCount: (count: number) => void;
  setLastSyncedAt: (date: Date) => void;
  setIsOnline: (online: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: SYNC_STATUS.SYNCED,
  pendingCount: 0,
  lastSyncedAt: null,
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  error: null,
  setStatus: (status) => set({ status }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setIsOnline: (isOnline) => set({ isOnline }),
  setError: (error) => set({ error }),
}));
