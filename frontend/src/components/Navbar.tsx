"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Cloud } from "lucide-react";
import SkyToggle from "@/components/ui/sky-toggle";

const navItems = [
  { id: "/", label: "Home" },
  { id: "/maps", label: "Live Maps" },
  { id: "/archive", label: "Archive" },
  { id: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <nav className="sticky top-4 z-50 mx-6 mt-4">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14 glass rounded-2xl depth-floating border-white/10 dark:border-white/5">
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 group"
        >
          <div className="relative">
            <Cloud
              size={22}
              className="text-[var(--accent)] transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-[var(--accent)]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="font-display font-bold text-sm tracking-wider text-[var(--text-primary)] hidden sm:block">
            ATMOLENS
          </span>
        </button>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.id;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.id)}
                className="relative px-4 py-2 text-sm font-medium transition-colors duration-200"
              >
                <span
                  className={
                    isActive
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }
                >
                  {item.label}
                </span>
                {/* Animated underline */}
                <span
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-[var(--accent-glow)] rounded-full transition-all duration-300 ${
                    isActive ? "w-6 opacity-100" : "w-0 opacity-0"
                  }`}
                />
              </button>
            );
          })}

          {/* Theme toggle */}
          {mounted && (
            <div className="ml-4 flex items-center">
              <SkyToggle 
                checked={theme === "dark"}
                onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
