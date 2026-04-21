"use client";

import type { ReactNode } from "react";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppSidebar } from "@/components/layout/app-sidebar";

export type AppShellUser = {
  name: string;
  email: string;
};

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: AppShellUser;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger />
          </header>
          <div className="flex min-h-[calc(100svh-3.5rem)] flex-1 flex-col">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
