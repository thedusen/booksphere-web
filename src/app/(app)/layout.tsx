"use client";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrganizationProvider } from "@/hooks/useOrganization";
import Sidebar from "./components/layout/Sidebar"; // Corrected relative path

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <OrganizationProvider>
                <div className="flex min-h-screen">
                    <Sidebar />
                    <main className="flex-1 bg-white p-8 overflow-auto">
                        {children}
                    </main>
                </div>
            </OrganizationProvider>
        </QueryClientProvider>
    );
}