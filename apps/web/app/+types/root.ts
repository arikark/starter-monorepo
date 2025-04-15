import { type ActionFunction, type LoaderFunction } from "react-router-dom";

export type Route = {
  path: string;
  element: React.ReactNode;
  loader: LoaderFunction;
  action: ActionFunction;
  errorElement: React.ReactNode;
  children: Route[];
};
