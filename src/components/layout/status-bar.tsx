// import { useLayoutStore } from "../../stores/layout-store";

export function StatusBar() {
  // const { statusBar } = useLayoutStore();

  return (
    <div className="border-border bg-surface flex h-6 items-center justify-between border-t px-4 text-xs">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <p>Left</p>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        <p>righ</p>
      </div>
    </div>
  );
}
