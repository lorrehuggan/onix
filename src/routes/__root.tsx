import { useEffect } from "react";

import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { AppShell } from "../components/layout/app-shell";

function RootComponent() {
  useEffect(() => {
    // Set dark mode as default
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-slate-400">404</h1>
        <h3 className="text-xl font-semibold">Page Not Found</h3>
        <p className="text-slate-600 dark:text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          to="/"
          className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  ),
});
