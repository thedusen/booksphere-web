import { z } from "zod";

export const inventoryItemSchema = z.object({
  conditionId: z.string().min(1, { message: "Condition is required" }),
  price: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number().positive({ message: "Price must be a positive number" })
  ),
  sku: z.string().optional(),
  selectedAttributeIds: z.array(z.string()),
  conditionNotes: z.string().optional(),
  // Add other fields as needed, e.g. location, internalNotes, etc.
  location: z.string().optional(),
  internalNotes: z.string().optional(),
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>; 