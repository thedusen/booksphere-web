import { BookOpen, Camera, Plus } from "lucide-react";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    searchQuery?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ searchQuery }) => {
    return (
        <div className="text-center py-16">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {searchQuery ? "No Results Found" : "No Inventory Items"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 mb-6">
                {searchQuery
                    ? `No items match "${searchQuery}". Try adjusting your search terms or filters.`
                    : "Get started by adding your first book to inventory."}
            </p>
            
            {/* Show action buttons only when there's no search query */}
            {!searchQuery && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <Button asChild size="lg" variant="primary" className="shadow-elevation-2 hover-scale-sm">
                        <Link href="/cataloging/scan">
                            <Camera className="mr-2 h-5 w-5" />
                            Scan & Catalog Books
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="shadow-elevation-2 hover-scale-sm">
                        <Link href="/inventory/new">
                            <Plus className="mr-2 h-5 w-5" />
                            Add Item Manually
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
};