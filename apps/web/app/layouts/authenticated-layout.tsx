import { Outlet, useLoaderData } from "react-router-dom";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/react-router";
import { rootAuthLoader } from "@clerk/react-router/ssr.server";

import type { Route } from "../+types/root";

export async function loader(args: Route["loader"]["arguments"]) {
  return rootAuthLoader(args);
}

const PUBLISHABLE_KEY = import.meta.env.VITE_APP_CLERK_PUBLISHABLE_KEY;
export function AuthenticatedLayout() {
  const loaderData = useLoaderData();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      loaderData={loaderData}
      signUpFallbackRedirectUrl="/chat"
      signInFallbackRedirectUrl="/chat"
    >
      <div className="flex flex-col h-screen">
        <header className="flex items-center justify-between p-4">
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </ClerkProvider>
  );
}
