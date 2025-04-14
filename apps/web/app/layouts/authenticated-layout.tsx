import { Outlet } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";

export default function AuthenticatedLayout() {
  return (
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
  );
}
