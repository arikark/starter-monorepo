import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "@workspace/ui/globals.css";
import { QueryProvider } from "./lib/query-provider";
import Chat, { loader as chatLoader } from "./routes/chat";
import Home, { action, ErrorBoundary, loader, type Route } from "./routes/home";

const routes = [
  {
    path: "/",
    element: <Home />,
    loader,
    action,
    errorElement: <ErrorBoundary />,
  } satisfies Route,
  {
    path: "/chat",
    element: <Chat />,
    loader: chatLoader,
  },
];

const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </React.StrictMode>,
);
