"use client";

import { CommercialSidebar } from "@/components/dashboard/commercial-sidebar";
import { RouteGuard } from "@/components/auth/route-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <div className="flex h-screen overflow-hidden">
        <CommercialSidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}

