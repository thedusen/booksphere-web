import React from "react";
import { useInventoryState } from "./inventory/InventoryStateProvider";
import Sidebar from "./components/layout/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { scrollContainerRef } = useInventoryState();
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main
                ref={scrollContainerRef}
                className="flex-1 bg-gradient-page min-h-screen overflow-auto"
            >
                {children}
            </main>
        </div>
    );
} 