import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookCopy, LogOut, Flag, Shield } from "lucide-react";

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
                
                {/* Main Navigation */}
                <nav className="flex flex-col gap-2 mb-6">
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

                {/* Admin Section */}
                <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-400">
                        <Shield className="h-4 w-4" />
                        <span>Administration</span>
                    </div>
                    <nav className="flex flex-col gap-2">
                        <Button asChild variant="ghost" className="justify-start w-full">
                            <Link href="/admin/flags">
                                <Flag className="mr-2 h-5 w-5" />
                                Data Quality Flags
                            </Link>
                        </Button>
                        {/* TODO: Add more admin links as needed */}
                    </nav>
                </div>
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