"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { InventoryForm } from "../../components/inventory/InventoryForm";

export default function NewInventoryPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/inventory">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Inventory
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Add New Inventory Item</h1>
            </div>

            <InventoryForm />
        </div>
    );
}