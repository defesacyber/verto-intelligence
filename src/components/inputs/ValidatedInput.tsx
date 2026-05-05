import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";

interface ValidatedInputProps extends React.ComponentProps<"input"> {
  isValid?: boolean;
  isTouched?: boolean;
  showValidation?: boolean;
  error?: string;
  isCurrency?: boolean;
}

const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, type, isValid, isTouched, showValidation = true, error, isCurrency, ...props }, ref) => {
    const showSuccess = showValidation && isTouched && isValid && !error;
    const showError = showValidation && isTouched && (error || !isValid);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isCurrency) {
        // Prevent non-numeric characters except for control keys
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', '.', ','];
        if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key)) {
          e.preventDefault();
        }
      }
      props.onKeyDown?.(e);
    };

    return (
      <div className="relative">
        <input
          type={type}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-10 transition-colors duration-200",
            showSuccess && "border-green-500 focus-visible:ring-green-500/30",
            showError && "border-destructive focus-visible:ring-destructive/30",
            !showSuccess && !showError && "border-input focus-visible:ring-ring",
            className,
          )}
          ref={ref}
          {...props}
        />
        {showValidation && isTouched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {showSuccess && (
              <Check className="h-4 w-4 text-green-500 animate-in fade-in-0 zoom-in-50 duration-200" />
            )}
            {showError && (
              <AlertCircle className="h-4 w-4 text-destructive animate-in fade-in-0 zoom-in-50 duration-200" />
            )}
          </div>
        )}
      </div>
    );
  },
);

ValidatedInput.displayName = "ValidatedInput";

export { ValidatedInput };
