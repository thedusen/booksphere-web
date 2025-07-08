import React from "react";

// This layout's only job is to render the pages within the /inventory route.
// State is now handled by the parent layout at /app/(app)/layout.tsx.
export default function InventoryLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}