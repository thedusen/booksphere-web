import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-lavender-50/20 to-secondary/5 p-8">
            <div className="relative">
                <h1 className="text-4xl font-bold mb-2 gradient-text">Dashboard</h1>
                <p className="text-muted-foreground mb-8">Welcome back! Here's what's happening with your bookstore.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Manage Inventory Card */}
                    <Link href="/inventory" className="group">
                        <Card className="p-8 h-full cursor-pointer hover-scale-sm group-hover:glow-purple">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-secondary">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-semibold">Manage Inventory</h2>
                            </div>
                            <p className="text-muted-foreground">
                                Add, edit, and organize your book inventory. View stock, update details, and keep your catalog up to date.
                            </p>
                        </Card>
                    </Link>
                    
                    {/* Cataloging Jobs Card */}
                    <Link href="/cataloging" className="group">
                        <Card className="p-8 h-full cursor-pointer hover-scale-sm group-hover:glow-aqua">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-gradient-to-r from-secondary to-accent">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-semibold">Cataloging Jobs</h2>
                            </div>
                            <p className="text-muted-foreground">
                                Monitor and review book cataloging jobs. Process AI-extracted data and finalize new inventory items.
                            </p>
                        </Card>
                    </Link>
                    
                    {/* View Reports Card (placeholder) */}
                    <Card className="p-8 h-full opacity-70 cursor-not-allowed">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-muted to-muted-foreground/20">
                                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold">View Reports</h2>
                        </div>
                        <p className="text-muted-foreground">
                            Analytics and reports coming soon.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
} 