import {
  type LoaderFunctionArgs,
  type RouteObject,
  useLoaderData,
  Link,
} from "react-router-dom";
import type { MetaFunction } from "@remix-run/react";
import { Button } from "@workspace/ui/components/button";

export type Route = RouteObject & {
  path: "/";
  loader: typeof loader;
  action: typeof action;
};

type LoaderData = {
  message: string;
};

export const meta: MetaFunction = () => {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
};

export async function loader({
  request: _request,
}: LoaderFunctionArgs): Promise<LoaderData> {
  // Simulate API call
  const data = await new Promise<LoaderData>((resolve) =>
    setTimeout(() => resolve({ message: "Welcome to React Router 7!" }), 100),
  );
  return data;
}

export async function action({ request }: LoaderFunctionArgs) {
  const formData = await request.formData();
  const message = formData.get("message");
  return { success: true, message };
}

export function ErrorBoundary() {
  return (
    <div className="p-4 text-red-500">
      <h2>Oops! Something went wrong.</h2>
    </div>
  );
}

export default function Home() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-6">{data.message}</h1>
      <div className="flex gap-4">
        <Button asChild>
          <Link to="/chat">Go to Chat</Link>
        </Button>
      </div>
    </div>
  );
}
