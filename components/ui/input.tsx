import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-semibold uppercase tracking-wide text-ink-soft"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "h-9 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint transition-colors duration-150 focus:outline-2 focus:outline-offset-0 focus:outline-ink disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-wrong focus:outline-wrong",
            className
          )}
          ref={ref}
          {...props}
        />
        {hint && !error && (
          <p className="text-[13px] text-ink-soft">{hint}</p>
        )}
        {error && (
          <p className="text-[13px] text-wrong font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
