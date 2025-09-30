import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  // This component is rendered inside the AppShell
  // The AppShell already provides the full editor interface
  return null;
}
