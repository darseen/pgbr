"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type VariantProps } from "class-variance-authority";

type Props = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { label: string };

// Icon-only actions: one styled tooltip instead of the browser's slow native
// title, plus the accessible name that an icon button otherwise lacks.
export default function TooltipButton({ label, children, ...props }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
