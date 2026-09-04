import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98]",
  {
    variants: {
      variant: {
        solid:
          "bg-fg text-bg hover:bg-accent hover:text-accent-fg",
        accent:
          "bg-accent text-accent-fg hover:bg-fg hover:text-bg",
        ghost:
          "bg-transparent text-fg hover:bg-elevated",
        outline:
          "border border-border bg-transparent text-fg hover:border-border-strong hover:bg-elevated",
      },
      size: {
        sm: "h-9 rounded-sm px-3 text-sm",
        md: "h-11 rounded-md px-4 text-sm",
        lg: "h-12 rounded-lg px-5 text-base",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
