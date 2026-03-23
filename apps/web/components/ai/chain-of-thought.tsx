"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { Badge } from "@hexio/ui/components/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hexio/ui/components/collapsible";
import { cn } from "@hexio/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import { BrainIcon, ChevronDownIcon, DotIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { createContext, memo, useContext, useMemo } from "react";

interface ChainOfThoughtContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ChainOfToolContext = createContext<ChainOfThoughtContextValue | null>(
  null,
);

const useChainOfTool = () => {
  const context = useContext(ChainOfToolContext);
  if (!context) {
    throw new Error("ChainOfTool components must be used within ChainOfTool");
  }
  return context;
};

export type ChainOfToolProps = ComponentProps<"div"> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ChainOfTool = memo(
  ({
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }: ChainOfToolProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      defaultProp: defaultOpen,
      onChange: onOpenChange,
      prop: open,
    });

    const chainOfToolContext = useMemo(
      () => ({ isOpen, setIsOpen }),
      [isOpen, setIsOpen],
    );

    return (
      <ChainOfToolContext.Provider value={chainOfToolContext}>
        <div className={cn("not-prose w-full space-y-4", className)} {...props}>
          {children}
        </div>
      </ChainOfToolContext.Provider>
    );
  },
);

export type ChainOfToolHeaderProps = ComponentProps<typeof CollapsibleTrigger>;

export const ChainOfToolHeader = memo(
  ({ className, children, ...props }: ChainOfToolHeaderProps) => {
    const { isOpen, setIsOpen } = useChainOfTool();

    return (
      <Collapsible onOpenChange={setIsOpen} open={isOpen}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground",
            className,
          )}
          {...props}
        >
          <BrainIcon className="size-4" />
          <span className="flex-1 text-left">{children ?? "Working"}</span>
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform",
              isOpen ? "rotate-180" : "rotate-0",
            )}
          />
        </CollapsibleTrigger>
      </Collapsible>
    );
  },
);

export type ChainOfToolStepProps = ComponentProps<"div"> & {
  icon?: LucideIcon;
  label: ReactNode;
  description?: ReactNode;
  status?: "complete" | "active" | "pending";
};

const stepStatusStyles = {
  active: "text-foreground",
  complete: "text-muted-foreground",
  pending: "text-muted-foreground/50",
};

export const ChainOfToolStep = memo(
  ({
    className,
    icon: Icon = DotIcon,
    label,
    description,
    status = "complete",
    children,
    ...props
  }: ChainOfToolStepProps) => (
    <div
      className={cn(
        "flex gap-2 text-sm",
        stepStatusStyles[status],
        "fade-in-0 slide-in-from-top-2 animate-in",
        className,
      )}
      {...props}
    >
      <div className="relative mt-0.5">
        <Icon className="size-4" />
        <div className="absolute top-7 bottom-0 left-1/2 -mx-px w-px bg-border" />
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div>{label}</div>
        {description && (
          <div className="text-muted-foreground text-xs">{description}</div>
        )}
        {children}
      </div>
    </div>
  ),
);

export type ChainOfToolSearchResultsProps = ComponentProps<"div">;

export const ChainOfToolSearchResults = memo(
  ({ className, ...props }: ChainOfToolSearchResultsProps) => (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  ),
);

export type ChainOfToolSearchResultProps = ComponentProps<typeof Badge>;

export const ChainOfToolSearchResult = memo(
  ({ className, children, ...props }: ChainOfToolSearchResultProps) => (
    <Badge
      className={cn("gap-1 px-2 py-0.5 font-normal text-xs", className)}
      variant="secondary"
      {...props}
    >
      {children}
    </Badge>
  ),
);

export type ChainOfToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ChainOfToolContent = memo(
  ({ className, children, ...props }: ChainOfToolContentProps) => {
    const { isOpen } = useChainOfTool();

    return (
      <Collapsible open={isOpen}>
        <CollapsibleContent
          className={cn(
            "mt-2 space-y-3",
            "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
            className,
          )}
          {...props}
        >
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  },
);

export type ChainOfToolImageProps = ComponentProps<"div"> & {
  caption?: string;
};

export const ChainOfToolImage = memo(
  ({ className, children, caption, ...props }: ChainOfToolImageProps) => (
    <div className={cn("mt-2 space-y-2", className)} {...props}>
      <div className="relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-lg bg-muted p-3">
        {children}
      </div>
      {caption && <p className="text-muted-foreground text-xs">{caption}</p>}
    </div>
  ),
);

ChainOfTool.displayName = "ChainOfTool";
ChainOfToolHeader.displayName = "ChainOfToolHeader";
ChainOfToolStep.displayName = "ChainOfToolStep";
ChainOfToolSearchResults.displayName = "ChainOfToolSearchResults";
ChainOfToolSearchResult.displayName = "ChainOfToolSearchResult";
ChainOfToolContent.displayName = "ChainOfToolContent";
ChainOfToolImage.displayName = "ChainOfToolImage";

// Backward compatibility aliases for existing imports. Remove once callsites are migrated.
export const ChainOfThought = ChainOfTool;
export const ChainOfThoughtHeader = ChainOfToolHeader;
export const ChainOfThoughtStep = ChainOfToolStep;
export const ChainOfThoughtSearchResults = ChainOfToolSearchResults;
export const ChainOfThoughtSearchResult = ChainOfToolSearchResult;
export const ChainOfThoughtContent = ChainOfToolContent;
export const ChainOfThoughtImage = ChainOfToolImage;
