import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "@workspace/ui/globals.css";
import { AuthenticatedLayout } from "./layouts/authenticated-layout";
import { QueryProvider } from "./lib/query-provider";
import { Chat } from "./routes/chat";
import { action, ErrorBoundary, loader, type Route } from "./routes/home";

const routes = [
  {
    path: "/",
    element: <AuthenticatedLayout />,
    loader,
    action,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "/chat",
        element: <Chat />,
      },
    ],
  } satisfies Route,
];

const router = createBrowserRouter(routes);

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </React.StrictMode>,
);
