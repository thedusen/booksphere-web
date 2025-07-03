import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = RadixSelect.Root;
const SelectGroup = RadixSelect.Group;
const SelectValue = RadixSelect.Value;
const SelectTrigger = React.forwardRef<
    React.ElementRef<typeof RadixSelect.Trigger>,
    React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger>
>(({ className, children, ...props }, ref) => (
    <RadixSelect.Trigger
        ref={ref}
        className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            className
        )}
        {...props}
    >
        {children}
        <RadixSelect.Icon asChild>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </RadixSelect.Icon>
    </RadixSelect.Trigger>
));
SelectTrigger.displayName = RadixSelect.Trigger.displayName;

const SelectContent = React.forwardRef<
    React.ElementRef<typeof RadixSelect.Content>,
    React.ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(({ className, children, ...props }, ref) => (
    <RadixSelect.Portal>
        <RadixSelect.Content
            ref={ref}
            className={cn(
                "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80",
                className
            )}
            {...props}
        >
            <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
        </RadixSelect.Content>
    </RadixSelect.Portal>
));
SelectContent.displayName = RadixSelect.Content.displayName;

const SelectLabel = React.forwardRef<
    React.ElementRef<typeof RadixSelect.Label>,
    React.ComponentPropsWithoutRef<typeof RadixSelect.Label>
>(({ className, ...props }, ref) => (
    <RadixSelect.Label
        ref={ref}
        className={cn("px-2 py-1.5 text-sm font-semibold", className)}
        {...props}
    />
));
SelectLabel.displayName = RadixSelect.Label.displayName;

const SelectItem = React.forwardRef<
    React.ElementRef<typeof RadixSelect.Item>,
    React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ className, children, ...props }, ref) => (
    <RadixSelect.Item
        ref={ref}
        className={cn(
            "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-base outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className
        )}
        {...props}
    >
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            <RadixSelect.ItemIndicator>
                <Check className="h-4 w-4" />
            </RadixSelect.ItemIndicator>
        </span>
        <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
));
SelectItem.displayName = RadixSelect.Item.displayName;

const SelectSeparator = React.forwardRef<
    React.ElementRef<typeof RadixSelect.Separator>,
    React.ComponentPropsWithoutRef<typeof RadixSelect.Separator>
>(({ className, ...props }, ref) => (
    <RadixSelect.Separator
        ref={ref}
        className={cn("-mx-1 my-1 h-px bg-muted", className)}
        {...props}
    />
));
SelectSeparator.displayName = RadixSelect.Separator.displayName;

const SelectScrollUpButton = React.forwardRef<
    React.ElementRef<typeof RadixSelect.ScrollUpButton>,
    React.ComponentPropsWithoutRef<typeof RadixSelect.ScrollUpButton>
>(({ className, ...props }, ref) => (
    <RadixSelect.ScrollUpButton
        ref={ref}
        className={cn("flex cursor-default items-center justify-center py-1", className)}
        {...props}
    >
        <ChevronUp className="h-4 w-4" />
    </RadixSelect.ScrollUpButton>
));
SelectScrollUpButton.displayName = RadixSelect.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
    React.ElementRef<typeof RadixSelect.ScrollDownButton>,
    React.ComponentPropsWithoutRef<typeof RadixSelect.ScrollDownButton>
>(({ className, ...props }, ref) => (
    <RadixSelect.ScrollDownButton
        ref={ref}
        className={cn("flex cursor-default items-center justify-center py-1", className)}
        {...props}
    >
        <ChevronDown className="h-4 w-4" />
    </RadixSelect.ScrollDownButton>
));
SelectScrollDownButton.displayName = RadixSelect.ScrollDownButton.displayName;

const SelectPortal = RadixSelect.Portal;

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
    SelectPortal,
}; 