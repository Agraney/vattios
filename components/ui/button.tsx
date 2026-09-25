import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-brand-foreground shadow-subtle hover:bg-brand-hover active:bg-[#0A182E]",
        secondary:
          "bg-white border border-neutral-200 text-neutral-700 shadow-subtle hover:bg-neutral-50 hover:text-brand",
        outline:
          "border border-neutral-300 bg-transparent hover:bg-neutral-100 text-neutral-800",
        ghost:
          "hover:bg-neutral-100 hover:text-neutral-900 text-neutral-600",
        destructive:
          "bg-financial-destructive text-white shadow-subtle hover:bg-red-700 active:bg-red-800",
        link:
          "text-brand underline-offset-4 hover:underline p-0 h-auto",
        positive:
          "bg-financial-positive text-white shadow-subtle hover:bg-[#245732]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
