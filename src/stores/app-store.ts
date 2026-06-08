import { create } from "zustand";

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;

  // Theme
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Active date for tracking
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Quick action modal
  quickActionOpen: boolean;
  setQuickActionOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapse: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  theme: "dark",
  setTheme: (theme) => set({ theme }),

  selectedDate: new Date().toISOString().split("T")[0],
  setSelectedDate: (date) => set({ selectedDate: date }),

  quickActionOpen: false,
  setQuickActionOpen: (open) => set({ quickActionOpen: open }),
}));
