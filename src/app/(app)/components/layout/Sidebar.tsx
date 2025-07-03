import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookCopy, LogOut } from "lucide-react";

const Sidebar: React.FC = () => {
    return (
        <aside className="flex flex-col h-full w-60 bg-gray-900 text-white justify-between py-6 px-4">
            {/* Top: Logo/Title */}
            <div>
                <div className="mb-8 flex items-center gap-2 text-2xl font-bold tracking-tight">
                    {/* Replace with SVG logo if available */}
                    <span>📚</span>
                    <span>Booksphere</span>
                </div>
                {/* Navigation */}
                <nav className="flex flex-col gap-2">
                    <Button asChild variant="ghost" className="justify-start w-full">
                        <Link href="/dashboard">
                            <LayoutDashboard className="mr-2 h-5 w-5" />
                            Dashboard
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start w-full">
                        <Link href="/inventory">
                            <BookCopy className="mr-2 h-5 w-5" />
                            Inventory
                        </Link>
                    </Button>
                </nav>
            </div>
            {/* Bottom: Sign Out */}
            <div>
                <Button variant="ghost" className="justify-start w-full">
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
};

export default Sidebar; 