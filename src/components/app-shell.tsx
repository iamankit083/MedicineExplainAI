import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ShieldAlert } from "lucide-react";

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            {actions}
          </header>
          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</div>
          </main>
          <Disclaimer />
        </div>
      </div>
    </SidebarProvider>
  );
}

function Disclaimer() {
  return (
    <div className="border-t border-border/60 bg-warning/5 px-6 py-2.5">
      <div className="mx-auto flex max-w-6xl items-start gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
        <span>
          Educational purposes only. This app does not provide medical diagnosis or treatment.
          Always consult a qualified healthcare professional.
        </span>
      </div>
    </div>
  );
}
