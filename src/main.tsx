import ReactDOM from "react-dom/client";

import React from "react";

import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import "./styles/globals.css";

// Create a memory history for desktop app (no URL bar needed)
const memoryHistory = createMemoryHistory({
  initialEntries: ["/"],
});

// Create router instance
const router = createRouter({
  routeTree,
  history: memoryHistory,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
