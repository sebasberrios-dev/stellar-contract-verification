import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Lift border toward primary on hover */
  interactive?: boolean;
}

export default function Card({
  children,
  interactive = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-2xl ${
        interactive ? "hover:border-primary/50 transition-all duration-300" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
