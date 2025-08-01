"use client"

import * as React from "react"
import { Check, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useGroupedAttributes, AttributeType } from "@/lib/services/cataloging-services"

interface AttributePickerProps {
  selectedAttributes: string[];
  onChange: (selected: string[]) => void;
}

export function AttributePicker({ selectedAttributes, onChange }: AttributePickerProps) {
  const { data: groupedAttributes, isLoading } = useGroupedAttributes();

  const handleSelect = (attributeId: string) => {
    if (selectedAttributes.includes(attributeId)) {
      onChange(selectedAttributes.filter((id) => id !== attributeId));
    } else {
      onChange([...selectedAttributes, attributeId]);
    }
  };

  const selectedAttributeDetails = React.useMemo(() => {
    if (!groupedAttributes) return [];
    const allAttributes = Object.values(groupedAttributes).flat();
    return selectedAttributes.map(id => allAttributes.find(attr => attr.attribute_type_id === id)).filter(Boolean) as AttributeType[];
  }, [selectedAttributes, groupedAttributes]);

  return (
    <div className="space-y-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Attributes
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search attributes..." />
            <CommandList>
              {isLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-1/3 mt-4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No results found.</CommandEmpty>
                  {Object.entries(groupedAttributes || {}).map(([category, attributes]) => (
                    <CommandGroup key={category} heading={category}>
                      {attributes.map((attribute) => {
                        const isSelected = selectedAttributes.includes(attribute.attribute_type_id);
                        return (
                          <CommandItem
                            key={attribute.attribute_type_id}
                            onSelect={() => handleSelect(attribute.attribute_type_id)}
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}
                            >
                              <Check className={cn("h-4 w-4")} />
                            </div>
                            <span>{attribute.name}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedAttributeDetails.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
             <h4 className="text-sm font-medium">Selected Attributes</h4>
            <div className="flex flex-wrap gap-2">
              {selectedAttributeDetails.map(attr => (
                <Badge key={attr.attribute_type_id} variant="secondary">
                  {attr.name}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 