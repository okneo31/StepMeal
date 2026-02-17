import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  glow?: "green" | "amber" | "purple" | "blue" | "none";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = "md", glow = "none", className = "", children, ...props }, ref) => {
    const paddings = { sm: "p-3", md: "p-4", lg: "p-6" };
    const glows = {
      none: "",
      green: "glow-green",
      amber: "glow-amber",
      purple: "glow-purple",
      blue: "glow-blue",
    };
    return (
      <div
        ref={ref}
        className={`bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] ${paddings[padding]} ${glows[glow]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
export default Card;
