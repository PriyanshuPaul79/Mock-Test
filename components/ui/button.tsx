import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const base =
      "inline-flex select-none items-center justify-center gap-2 rounded-sm font-sans font-medium transition-colors duration-150 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      primary:
        "bg-ink text-paper border border-ink hover:bg-[#2a2822] active:translate-y-px",
      secondary:
        "bg-surface text-ink border border-line-strong hover:bg-paper active:translate-y-px",
      ghost:
        "text-ink-soft border border-transparent hover:bg-recess hover:text-ink",
      destructive:
        "bg-wrong text-white border border-wrong hover:bg-[#9c2019]",
    };

    const sizes = {
      sm: "h-8 px-3 text-[13px]",
      md: "h-9 px-4 text-sm",
      lg: "h-11 px-6 text-[15px]",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
