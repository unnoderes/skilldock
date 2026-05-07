import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-white hover:bg-blue-600 border-transparent",
      secondary: "bg-panel text-foreground hover:bg-gray-800 border-border",
      ghost: "bg-transparent text-foreground hover:bg-white/5 border-transparent",
      danger: "bg-error text-white hover:bg-red-600 border-transparent",
      success: "bg-success text-white hover:bg-green-600 border-transparent",
      outline: "bg-transparent border-border text-foreground/70 hover:bg-white/5 hover:text-foreground",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-9 px-4 text-sm",
      lg: "h-11 px-8 text-base",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
