"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface HeaderProps {
  userEmail?: string | null;
  minimal?: boolean;
}

export function Header({ userEmail, minimal = false }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <header className="h-14 border-b border-line bg-surface px-6 sticky top-0 z-30 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="font-display text-xl font-medium tracking-tight text-ink hover:text-ink/80 transition-colors"
        >
          MOCKTEST PORTAL
        </Link>
      </div>

      {!minimal && userEmail && (
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-ink">
                <User size={16} strokeWidth={1.75} />
                <span className="font-mono text-xs max-w-[140px] truncate">
                  {userEmail}
                </span>
                <span className="text-xs text-ink-faint">▾</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-mono text-[11px] truncate">
                {userEmail}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center gap-2 cursor-pointer">
                  <PlusCircle size={16} strokeWidth={1.75} />
                  <span>Load question file</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-wrong focus:bg-wrong-soft focus:text-wrong flex items-center gap-2"
              >
                <LogOut size={16} strokeWidth={1.75} />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
