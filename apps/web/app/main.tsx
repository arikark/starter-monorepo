import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";

import "@workspace/ui/globals.css";
import AuthenticatedLayout from "./layouts/authenticated-layout";
import { QueryProvider } from "./lib/query-provider";
import Chat, { loader as chatLoader } from "./routes/chat";
import Home, { action, ErrorBoundary, loader, type Route } from "./routes/home";

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
        loader: chatLoader,
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
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ClerkProvider>
  </React.StrictMode>,
);
