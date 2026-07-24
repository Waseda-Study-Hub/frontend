import { NavLink } from "react-router";
import { User, Library, Users } from "lucide-react";

export function Navigation() {
  return (
    <header className="bg-white border-b border-[var(--color-waseda-border)] sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Logo representation */}
          <div className="w-8 h-8 rounded-full gradient-waseda flex items-center justify-center text-white font-bold">
            W
          </div>
          <span className="font-bold text-lg hidden sm:block">Waseda Study Hub</span>
        </div>

        <nav className="flex items-center gap-6">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? "text-[var(--color-waseda-text)]" : "text-gray-500 hover:text-[var(--color-waseda-text)]"}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/buddies" 
            className={({ isActive }) => 
              `flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? "text-[var(--color-waseda-text)]" : "text-gray-500 hover:text-[var(--color-waseda-text)]"}`
            }
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Study Buddy</span>
          </NavLink>
          <NavLink 
            to="/spots" 
            className={({ isActive }) => 
              `flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? "text-[var(--color-waseda-text)]" : "text-gray-500 hover:text-[var(--color-waseda-text)]"}`
            }
          >
            <Library className="w-4 h-4" />
            <span className="hidden sm:inline">Study Spot</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-4">
          <NavLink to="/profile" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium hover:bg-gray-200 transition-colors">
            <User className="w-4 h-4" />
          </NavLink>
        </div>
      </div>
    </header>
  );
}
