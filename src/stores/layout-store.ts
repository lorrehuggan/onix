import { create } from "zustand";
import { persist } from "zustand/middleware";

import React from "react";

export interface Tab {
  id: string;
  label: string;
  content?: React.ReactNode;
  filePath?: string;
  isDirty?: boolean;
  type?: "note" | "graph" | "search" | "backlinks" | "tags";
}

export interface SidebarState {
  isOpen: boolean;
  width: number;
  activeTab: string;
  tabs: Tab[];
}

export interface RightPanelState {
  isOpen: boolean;
  width: number;
  activeTab: string;
  tabs: Tab[];
}

export interface BottomPanelState {
  isOpen: boolean;
  height: number;
  activeTab: string;
  tabs: Tab[];
}

export interface StatusBarState {
  vaultStats: {
    noteCount: number;
    linkCount: number;
    lastSync: string;
  };
  currentNote: {
    wordCount: number;
    charCount: number;
    lastModified: string;
  };
  searchResults: number;
  cursor: {
    line: number;
    col: number;
  };
}

export interface EditorSplit {
  id: string;
  type: "editor" | "horizontal" | "vertical";
  tabs?: string[];
  activeTab?: string;
  children?: EditorSplit[];
  size?: number; // Flex size
}

export interface LayoutState {
  sidebar: SidebarState;
  rightPanel: RightPanelState;
  bottomPanel: BottomPanelState;
  statusBar: StatusBarState;
  editorLayout: EditorSplit;
  editorTabs: Record<string, Tab>;
  graphViewMode: "local" | "global";
  isFullscreen: boolean;
  zenMode: boolean;
}

export interface LayoutActions {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setSidebarActiveTab: (tabId: string) => void;
  addSidebarTab: (tab: Tab) => void;
  removeSidebarTab: (tabId: string) => void;

  // Right panel actions (backlinks, graph, etc.)
  toggleRightPanel: () => void;
  setRightPanelWidth: (width: number) => void;
  setRightPanelActiveTab: (tabId: string) => void;
  addRightPanelTab: (tab: Tab) => void;
  removeRightPanelTab: (tabId: string) => void;

  // Bottom panel actions (search results, etc.)
  toggleBottomPanel: () => void;
  setBottomPanelHeight: (height: number) => void;
  setBottomPanelActiveTab: (tabId: string) => void;
  addBottomPanelTab: (tab: Tab) => void;
  removeBottomPanelTab: (tabId: string) => void;

  // Status bar actions
  updateStatusBar: (updates: Partial<StatusBarState>) => void;

  // Editor actions
  addEditorTab: (tab: Tab) => void;
  removeEditorTab: (tabId: string) => void;
  setActiveEditorTab: (splitId: string, tabId: string) => void;
  splitEditor: (splitId: string, direction: "horizontal" | "vertical") => void;
  closeSplit: (splitId: string) => void;
  updateEditorLayout: (layout: EditorSplit) => void;
  moveTabToSplit: (tabId: string, targetSplitId: string) => void;

  // Knowledge base specific actions
  setGraphViewMode: (mode: "local" | "global") => void;
  toggleFullscreen: () => void;
  toggleZenMode: () => void;
  openNoteInNewTab: (notePath: string, noteTitle: string) => void;
  showBacklinksForNote: (notePath: string) => void;
  showLocalGraph: (notePath: string) => void;
}

export type LayoutStore = LayoutState & LayoutActions;

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 500;
const RIGHT_PANEL_MIN_WIDTH = 250;
const RIGHT_PANEL_MAX_WIDTH = 600;
const BOTTOM_PANEL_MIN_HEIGHT = 150;
const BOTTOM_PANEL_MAX_HEIGHT = 500;

const initialState: LayoutState = {
  sidebar: {
    isOpen: true,
    width: 280,
    activeTab: "files",
    tabs: [
      { id: "files", label: "Files", type: "note" },
      { id: "search", label: "Search", type: "search" },
      { id: "tags", label: "Tags", type: "tags" },
      { id: "recent", label: "Recent", type: "note" },
    ],
  },
  rightPanel: {
    isOpen: true,
    width: 320,
    activeTab: "backlinks",
    tabs: [
      { id: "backlinks", label: "Backlinks", type: "backlinks" },
      { id: "outline", label: "Outline", type: "note" },
      { id: "local-graph", label: "Local Graph", type: "graph" },
      { id: "note-info", label: "Note Info", type: "note" },
    ],
  },
  bottomPanel: {
    isOpen: false,
    height: 200,
    activeTab: "search-results",
    tabs: [
      { id: "search-results", label: "Search Results", type: "search" },
      { id: "global-graph", label: "Global Graph", type: "graph" },
      { id: "unlinked-mentions", label: "Unlinked Mentions", type: "backlinks" },
    ],
  },
  statusBar: {
    vaultStats: {
      noteCount: 0,
      linkCount: 0,
      lastSync: new Date().toISOString(),
    },
    currentNote: {
      wordCount: 0,
      charCount: 0,
      lastModified: new Date().toISOString(),
    },
    searchResults: 0,
    cursor: { line: 1, col: 1 },
  },
  editorLayout: {
    id: "root",
    type: "editor",
    tabs: ["welcome"],
    activeTab: "welcome",
    size: 1,
  },
  editorTabs: {
    welcome: {
      id: "welcome",
      label: "Welcome to Onix",
      content: undefined,
      type: "note",
    },
  },
  graphViewMode: "local",
  isFullscreen: false,
  zenMode: false,
};

let splitCounter = 1;

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Sidebar actions
      toggleSidebar: () =>
        set(state => ({
          sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen },
        })),

      setSidebarWidth: (width: number) =>
        set(state => ({
          sidebar: {
            ...state.sidebar,
            width: Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, width)),
          },
        })),

      setSidebarActiveTab: (tabId: string) =>
        set(state => ({
          sidebar: { ...state.sidebar, activeTab: tabId },
        })),

      addSidebarTab: (tab: Tab) =>
        set(state => ({
          sidebar: {
            ...state.sidebar,
            tabs: state.sidebar.tabs.some(t => t.id === tab.id)
              ? state.sidebar.tabs
              : [...state.sidebar.tabs, tab],
          },
        })),

      removeSidebarTab: (tabId: string) =>
        set(state => ({
          sidebar: {
            ...state.sidebar,
            tabs: state.sidebar.tabs.filter(t => t.id !== tabId),
            activeTab:
              state.sidebar.activeTab === tabId
                ? state.sidebar.tabs[0]?.id || ""
                : state.sidebar.activeTab,
          },
        })),

      // Right panel actions
      toggleRightPanel: () =>
        set(state => ({
          rightPanel: { ...state.rightPanel, isOpen: !state.rightPanel.isOpen },
        })),

      setRightPanelWidth: (width: number) =>
        set(state => ({
          rightPanel: {
            ...state.rightPanel,
            width: Math.max(RIGHT_PANEL_MIN_WIDTH, Math.min(RIGHT_PANEL_MAX_WIDTH, width)),
          },
        })),

      setRightPanelActiveTab: (tabId: string) =>
        set(state => ({
          rightPanel: { ...state.rightPanel, activeTab: tabId },
        })),

      addRightPanelTab: (tab: Tab) =>
        set(state => ({
          rightPanel: {
            ...state.rightPanel,
            tabs: state.rightPanel.tabs.some(t => t.id === tab.id)
              ? state.rightPanel.tabs
              : [...state.rightPanel.tabs, tab],
          },
        })),

      removeRightPanelTab: (tabId: string) =>
        set(state => ({
          rightPanel: {
            ...state.rightPanel,
            tabs: state.rightPanel.tabs.filter(t => t.id !== tabId),
            activeTab:
              state.rightPanel.activeTab === tabId
                ? state.rightPanel.tabs[0]?.id || ""
                : state.rightPanel.activeTab,
          },
        })),

      // Bottom panel actions
      toggleBottomPanel: () =>
        set(state => ({
          bottomPanel: { ...state.bottomPanel, isOpen: !state.bottomPanel.isOpen },
        })),

      setBottomPanelHeight: (height: number) =>
        set(state => ({
          bottomPanel: {
            ...state.bottomPanel,
            height: Math.max(BOTTOM_PANEL_MIN_HEIGHT, Math.min(BOTTOM_PANEL_MAX_HEIGHT, height)),
          },
        })),

      setBottomPanelActiveTab: (tabId: string) =>
        set(state => ({
          bottomPanel: { ...state.bottomPanel, activeTab: tabId },
        })),

      addBottomPanelTab: (tab: Tab) =>
        set(state => ({
          bottomPanel: {
            ...state.bottomPanel,
            tabs: state.bottomPanel.tabs.some(t => t.id === tab.id)
              ? state.bottomPanel.tabs
              : [...state.bottomPanel.tabs, tab],
          },
        })),

      removeBottomPanelTab: (tabId: string) =>
        set(state => ({
          bottomPanel: {
            ...state.bottomPanel,
            tabs: state.bottomPanel.tabs.filter(t => t.id !== tabId),
            activeTab:
              state.bottomPanel.activeTab === tabId
                ? state.bottomPanel.tabs[0]?.id || ""
                : state.bottomPanel.activeTab,
          },
        })),

      // Status bar actions
      updateStatusBar: (updates: Partial<StatusBarState>) =>
        set(state => ({
          statusBar: { ...state.statusBar, ...updates },
        })),

      // Editor actions
      addEditorTab: (tab: Tab) =>
        set(state => ({
          editorTabs: { ...state.editorTabs, [tab.id]: tab },
        })),

      removeEditorTab: (tabId: string) => {
        const state = get();
        const newTabs = { ...state.editorTabs };
        delete newTabs[tabId];

        // Remove from all splits
        const updateSplit = (split: EditorSplit): EditorSplit => {
          if (split.type === "editor" && split.tabs) {
            const newSplitTabs = split.tabs.filter(id => id !== tabId);
            const newActiveTab =
              split.activeTab === tabId ? newSplitTabs[0] || "" : split.activeTab;
            return {
              ...split,
              tabs: newSplitTabs,
              activeTab: newActiveTab,
            };
          }
          return {
            ...split,
            children: split.children?.map(updateSplit),
          };
        };

        set({
          editorTabs: newTabs,
          editorLayout: updateSplit(state.editorLayout),
        });
      },

      setActiveEditorTab: (splitId: string, tabId: string) => {
        const state = get();
        const updateSplit = (split: EditorSplit): EditorSplit => {
          if (split.id === splitId) {
            return { ...split, activeTab: tabId };
          }
          return {
            ...split,
            children: split.children?.map(updateSplit),
          };
        };

        set({ editorLayout: updateSplit(state.editorLayout) });
      },

      splitEditor: (splitId: string, direction: "horizontal" | "vertical") => {
        const state = get();
        const newSplitId = `split-${splitCounter++}`;

        const updateSplit = (split: EditorSplit): EditorSplit => {
          if (split.id === splitId && split.type === "editor") {
            return {
              id: split.id,
              type: direction,
              size: split.size,
              children: [
                { ...split, size: 0.5 },
                {
                  id: newSplitId,
                  type: "editor",
                  tabs: [],
                  activeTab: "",
                  size: 0.5,
                },
              ],
            };
          }
          return {
            ...split,
            children: split.children?.map(updateSplit),
          };
        };

        set({ editorLayout: updateSplit(state.editorLayout) });
      },

      closeSplit: (_splitId: string) => {
        // Implementation for closing a split (merge with sibling)
        // This is complex and would need careful handling of the tree structure
        // TODO: Implement split closing logic
      },

      updateEditorLayout: (layout: EditorSplit) => set({ editorLayout: layout }),

      moveTabToSplit: (tabId: string, targetSplitId: string) => {
        const state = get();
        // Remove tab from current split and add to target split
        const updateSplit = (split: EditorSplit): EditorSplit => {
          if (split.type === "editor") {
            if (split.id === targetSplitId) {
              // Add tab to target split
              const tabs = split.tabs || [];
              return {
                ...split,
                tabs: tabs.includes(tabId) ? tabs : [...tabs, tabId],
                activeTab: tabId,
              };
            } else if (split.tabs?.includes(tabId)) {
              // Remove tab from current split
              return {
                ...split,
                tabs: split.tabs.filter(id => id !== tabId),
                activeTab:
                  split.activeTab === tabId
                    ? split.tabs.find(id => id !== tabId) || ""
                    : split.activeTab,
              };
            }
          }
          return {
            ...split,
            children: split.children?.map(updateSplit),
          };
        };

        set({ editorLayout: updateSplit(state.editorLayout) });
      },

      // Knowledge base specific actions
      setGraphViewMode: (mode: "local" | "global") => set({ graphViewMode: mode }),

      toggleFullscreen: () => set(state => ({ isFullscreen: !state.isFullscreen })),

      toggleZenMode: () =>
        set(state => ({
          zenMode: !state.zenMode,
          sidebar: { ...state.sidebar, isOpen: state.zenMode ? true : false },
          rightPanel: { ...state.rightPanel, isOpen: state.zenMode ? true : false },
          bottomPanel: { ...state.bottomPanel, isOpen: false },
        })),

      openNoteInNewTab: (notePath: string, noteTitle: string) => {
        const state = get();
        const tabId = `note-${Date.now()}`;
        const newTab: Tab = {
          id: tabId,
          label: noteTitle,
          filePath: notePath,
          type: "note",
        };

        // Add to editor tabs
        const newEditorTabs = { ...state.editorTabs, [tabId]: newTab };

        // Add to the active split or root split
        const updateSplit = (split: EditorSplit): EditorSplit => {
          if (split.type === "editor") {
            return {
              ...split,
              tabs: [...(split.tabs || []), tabId],
              activeTab: tabId,
            };
          }
          return {
            ...split,
            children: split.children?.map(updateSplit),
          };
        };

        set({
          editorTabs: newEditorTabs,
          editorLayout: updateSplit(state.editorLayout),
        });
      },

      showBacklinksForNote: (_notePath: string) => {
        const { setRightPanelActiveTab, toggleRightPanel } = get();
        const state = get();

        if (!state.rightPanel.isOpen) {
          toggleRightPanel();
        }
        setRightPanelActiveTab("backlinks");
      },

      showLocalGraph: (_notePath: string) => {
        const { setRightPanelActiveTab, toggleRightPanel, setGraphViewMode } = get();
        const state = get();

        setGraphViewMode("local");
        if (!state.rightPanel.isOpen) {
          toggleRightPanel();
        }
        setRightPanelActiveTab("local-graph");
      },
    }),
    {
      name: "onix-layout-store",
      version: 2,
    },
  ),
);
