"use client";

import { cn } from "@/lib/utils";
import Header from "../shared/Header";

export function Navbar() {
  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 transition-colors duration-300"
      )}
    >
      <Header />
    </nav>
  );
}
