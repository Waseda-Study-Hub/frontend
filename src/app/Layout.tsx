import { Outlet } from "react-router";
import { Navigation } from "./components/Navigation";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-waseda-bg)]">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
