import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useConditions, useAttributes } from '@/hooks/useInventory';
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/useOrganization';
import { Skeleton } from "@/components/ui/skeleton";
import { inventoryItemSchema, InventoryItemInput } from "@/lib/validators/inventory";

export function InventoryForm() {
    // State variables
    const [conditionId, setConditionId] = useState<string | null>(null);
    const [price, setPrice] = useState<string>('');
    const [sku, setSku] = useState<string>('');
    const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
    const [conditionNotes, setConditionNotes] = useState<string>('');
    const { organizationId } = useOrganization();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof InventoryItemInput, string>>>({});

    // Fetch conditions and attributes
    const { data: conditions, isLoading: loadingConditions } = useConditions({ client: supabase });
    const { data: attributes, isLoading: loadingAttributes } = useAttributes({ client: supabase });

    // Submission mutation
    const mutation = useMutation({
        mutationFn: async () => {
            setSubmitError(null);
            setSubmitSuccess(false);
            // Validate required fields
            if (!organizationId) throw new Error('No organization selected.');
            if (!conditionId) throw new Error('Condition is required.');
            if (!price || isNaN(Number(price))) throw new Error('Valid price is required.');
            // Get userId from Supabase auth
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error('User not authenticated.');
            // Prepare payload (add other required fields as needed)
            const payload = {
                p_organization_id: organizationId,
                p_user_id: user.id,
                p_condition_id: conditionId,
                p_price: Number(price),
                p_condition_notes: conditionNotes,
                p_selected_attributes: selectedAttributeIds,
                // TODO: Add other required fields (isbn13, title, etc.)
            };
            // Call the RPC
            const { error } = await supabase.rpc('add_edition_to_inventory', payload);
            if (error) throw error;
            setSubmitSuccess(true);
        },
        onError: (err: Error) => {
            setSubmitError(err.message || 'Submission failed');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setSubmitSuccess(false);
        setValidationErrors({});
        // Validate with Zod
        const result = inventoryItemSchema.safeParse({
            conditionId: conditionId ?? '',
            price,
            sku,
            selectedAttributeIds,
            conditionNotes,
            location: (document.getElementById('location') as HTMLInputElement)?.value || '',
            internalNotes: (document.getElementById('internalNotes') as HTMLTextAreaElement)?.value || '',
        });
        if (!result.success) {
            const errors: Partial<Record<keyof InventoryItemInput, string>> = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0] as keyof InventoryItemInput;
                errors[field] = issue.message;
            }
            setValidationErrors(errors);
            return;
        }
        mutation.mutate();
    };

    return (
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {submitError && (
                <div className="text-red-600 text-sm mb-2">{submitError}</div>
            )}
            {submitSuccess && (
                <div className="text-green-600 text-sm mb-2">Inventory item added successfully!</div>
            )}
            {/* Core Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Core Details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {/* Condition Select */}
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="condition">Condition</Label>
                        {loadingConditions ? (
                            <Skeleton className="h-9 w-full" />
                        ) : (
                            <Select
                                name="condition"
                                value={conditionId ?? ''}
                                onValueChange={setConditionId}
                                disabled={loadingConditions}
                            >
                                <SelectTrigger id="condition">
                                    <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    {conditions && conditions.map((cond) => (
                                        <SelectItem key={cond.condition_id} value={cond.condition_id}>
                                            {cond.standard_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {validationErrors.conditionId && (
                            <span className="text-red-600 text-xs mt-1">{validationErrors.conditionId}</span>
                        )}
                    </div>
                    {/* Price Input */}
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="price">Price</Label>
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                        {validationErrors.price && (
                            <span className="text-red-600 text-xs mt-1">{validationErrors.price}</span>
                        )}
                    </div>
                    {/* SKU Input */}
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="sku">SKU</Label>
                        <Input
                            id="sku"
                            name="sku"
                            type="text"
                            placeholder="Enter SKU"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                        />
                        {validationErrors.sku && (
                            <span className="text-red-600 text-xs mt-1">{validationErrors.sku}</span>
                        )}
                    </div>
                    {/* Location Input */}
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" type="text" placeholder="Enter location" />
                        {validationErrors.location && (
                            <span className="text-red-600 text-xs mt-1">{validationErrors.location}</span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {/* Condition Notes Textarea */}
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="conditionNotes">Condition Notes</Label>
                        <Textarea
                            id="conditionNotes"
                            name="conditionNotes"
                            placeholder="Describe any condition issues..."
                            value={conditionNotes}
                            onChange={(e) => setConditionNotes(e.target.value)}
                        />
                        {validationErrors.conditionNotes && (
                            <span className="text-red-600 text-xs mt-1">{validationErrors.conditionNotes}</span>
                        )}
                    </div>
                    {/* Internal Notes Textarea */}
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="internalNotes">Internal Notes</Label>
                        <Textarea
                            id="internalNotes"
                            name="internalNotes"
                            placeholder="Internal notes (not visible to customers)"
                        />
                        {validationErrors.internalNotes && (
                            <span className="text-red-600 text-xs mt-1">{validationErrors.internalNotes}</span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Attributes Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Attributes</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {loadingAttributes ? (
                        <>
                            <Skeleton className="h-6 w-1/2 mb-2" />
                            <Skeleton className="h-6 w-1/3 mb-2" />
                            <Skeleton className="h-6 w-1/4" />
                        </>
                    ) : (
                        attributes && attributes.attributeTypes.map((attr) => (
                            <div key={attr.attribute_type_id} className="flex items-center gap-2">
                                <Checkbox
                                    id={attr.attribute_type_id}
                                    name={attr.name}
                                    checked={selectedAttributeIds.includes(attr.attribute_type_id)}
                                    onCheckedChange={(checked) => {
                                        setSelectedAttributeIds((prev) =>
                                            checked
                                                ? [...prev, attr.attribute_type_id]
                                                : prev.filter((id) => id !== attr.attribute_type_id)
                                        );
                                    }}
                                />
                                <Label htmlFor={attr.attribute_type_id}>{attr.name}</Label>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <button
                type="submit"
                className="mt-4 px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
                disabled={mutation.status === 'pending'}
            >
                {mutation.status === 'pending' ? 'Submitting...' : 'Add to Inventory'}
            </button>
        </form>
    );
} 