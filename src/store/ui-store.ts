import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  versionPanelOpen: boolean;
  aiPanelOpen: boolean;
  collaboratorPanelOpen: boolean;
  toggleSidebar: () => void;
  toggleVersionPanel: () => void;
  toggleAIPanel: () => void;
  toggleCollaboratorPanel: () => void;
  closePanels: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  versionPanelOpen: false,
  aiPanelOpen: false,
  collaboratorPanelOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleVersionPanel: () =>
    set((state) => ({
      versionPanelOpen: !state.versionPanelOpen,
      aiPanelOpen: false,
      collaboratorPanelOpen: false,
    })),
  toggleAIPanel: () =>
    set((state) => ({
      aiPanelOpen: !state.aiPanelOpen,
      versionPanelOpen: false,
      collaboratorPanelOpen: false,
    })),
  toggleCollaboratorPanel: () =>
    set((state) => ({
      collaboratorPanelOpen: !state.collaboratorPanelOpen,
      versionPanelOpen: false,
      aiPanelOpen: false,
    })),
  closePanels: () =>
    set({
      versionPanelOpen: false,
      aiPanelOpen: false,
      collaboratorPanelOpen: false,
    }),
}));
