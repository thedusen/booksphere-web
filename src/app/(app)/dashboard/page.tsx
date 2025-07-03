import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manage Inventory Card */}
                <Link href="/inventory" className="group">
                    <Card className="p-8 h-full cursor-pointer transition-shadow group-hover:shadow-xl">
                        <h2 className="text-2xl font-semibold mb-2">Manage Inventory</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Add, edit, and organize your book inventory. View stock, update details, and keep your catalog up to date.
                        </p>
                    </Card>
                </Link>
                {/* View Reports Card (placeholder) */}
                <Card className="p-8 h-full opacity-70 cursor-not-allowed">
                    <h2 className="text-2xl font-semibold mb-2">View Reports</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Analytics and reports coming soon.
                    </p>
                </Card>
            </div>
        </div>
    );
} 