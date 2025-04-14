import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "@workspace/ui/globals.css"
import Home, { action, ErrorBoundary, loader, type Route } from "./routes/home";

const routes = [
  {
    path: "/",
    element: <Home />,
    loader,
    action,
    errorElement: <ErrorBoundary />,
  } satisfies Route,
];

const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
