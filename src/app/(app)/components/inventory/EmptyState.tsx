import { BookOpen } from "lucide-react";
import React from "react";

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
            <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                    ? `No items match "${searchQuery}". Try adjusting your search terms or filters.`
                    : "Get started by adding your first book."}
            </p>
        </div>
    );
};