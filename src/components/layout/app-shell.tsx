import React, { useEffect, useRef } from "react";

import { OnixEditor } from "../../features/editor";
import { useLayoutStore } from "../../stores/layout-store";
import { useKeyboardShortcuts } from "../../utils/keyboard-shortcuts";
import { StatusBar } from "./status-bar";

interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children: _children }: AppShellProps) {
  useKeyboardShortcuts();

  const {
    sidebar,
    rightPanel,
    bottomPanel,
    setSidebarWidth,
    setRightPanelWidth,
    setBottomPanelHeight,
  } = useLayoutStore();

  const sidebarResizeRef = useRef<HTMLDivElement>(null);
  const rightPanelResizeRef = useRef<HTMLDivElement>(null);
  const bottomPanelResizeRef = useRef<HTMLDivElement>(null);

  // Sidebar resize handler
  useEffect(() => {
    const handleSidebarResize = (e: MouseEvent) => {
      e.preventDefault();
      const rect = document.querySelector(".app-shell")?.getBoundingClientRect();
      if (rect) {
        const newWidth = e.clientX - rect.left;
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleSidebarResize);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      document.addEventListener("mousemove", handleSidebarResize);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    };

    const resizer = sidebarResizeRef.current;
    if (resizer) {
      resizer.addEventListener("mousedown", handleMouseDown);
      return () => {
        resizer.removeEventListener("mousedown", handleMouseDown);
      };
    }
  }, [setSidebarWidth]);

  // Right panel resize handler
  useEffect(() => {
    const handleRightPanelResize = (e: MouseEvent) => {
      e.preventDefault();
      const rect = document.querySelector(".app-shell")?.getBoundingClientRect();
      if (rect) {
        const newWidth = rect.right - e.clientX;
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleRightPanelResize);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      document.addEventListener("mousemove", handleRightPanelResize);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    };

    const resizer = rightPanelResizeRef.current;
    if (resizer) {
      resizer.addEventListener("mousedown", handleMouseDown);
      return () => {
        resizer.removeEventListener("mousedown", handleMouseDown);
      };
    }
  }, [setRightPanelWidth]);

  // Bottom panel resize handler
  useEffect(() => {
    const handleBottomPanelResize = (e: MouseEvent) => {
      e.preventDefault();
      const rect = document.querySelector(".app-shell")?.getBoundingClientRect();
      if (rect) {
        const newHeight = rect.bottom - e.clientY - 24; // Account for status bar
        setBottomPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleBottomPanelResize);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      document.addEventListener("mousemove", handleBottomPanelResize);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    };

    const resizer = bottomPanelResizeRef.current;
    if (resizer) {
      resizer.addEventListener("mousedown", handleMouseDown);
      return () => {
        resizer.removeEventListener("mousedown", handleMouseDown);
      };
    }
  }, [setBottomPanelHeight]);

  return (
    <div className="app-shell bg-bg text-fg flex h-screen w-screen flex-col">
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {sidebar.isOpen && (
          <div className="border-border flex border-r">
            <div style={{ width: sidebar.width }} className="flex-shrink-0">
              <p>Sidebar</p>
            </div>
            {/* Sidebar resize handle */}
            <div
              ref={sidebarResizeRef}
              className="hover:bg-accent/20 w-1 cursor-ew-resize bg-transparent"
            />
          </div>
        )}

        {/* Center area (Editor + Bottom Panel) */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Editor Area */}
          <div
            className="flex-1 overflow-hidden"
            style={{
              height: bottomPanel.isOpen ? `calc(100% - ${bottomPanel.height}px)` : "100%",
            }}
          >
            <OnixEditor
              noteTitle="Welcome to Onix"
              notePath="/welcome.md"
              content="<h1>Welcome to Onix</h1><p>This is your privacy-first, local-first Markdown knowledge base. Start writing your notes here!</p><ul><li>Create bidirectional links</li><li>Organize with tags</li><li>Explore the graph view</li><li>Search your entire vault</li></ul>"
              onUpdate={(_html, markdown) => {
                console.warn("Note updated:", markdown.length, "characters markdown");
              }}
              onSave={(_html, markdown) => {
                console.warn("Note saved:", markdown.length, "characters markdown");
              }}
            />
          </div>

          {/* Bottom Panel */}
          {bottomPanel.isOpen && (
            <div className="border-border flex flex-col border-t">
              {/* Bottom panel resize handle */}
              <div
                ref={bottomPanelResizeRef}
                className="hover:bg-accent/20 h-1 cursor-ns-resize bg-transparent"
              />
              <div style={{ height: bottomPanel.height }} className="flex-shrink-0">
                <p>Bottom</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        {rightPanel.isOpen && (
          <div className="border-border flex border-l">
            {/* Right panel resize handle */}
            <div
              ref={rightPanelResizeRef}
              className="hover:bg-accent/20 w-1 cursor-ew-resize bg-transparent"
            />
            <div style={{ width: rightPanel.width }} className="flex-shrink-0">
              <p>Right Panel</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}
