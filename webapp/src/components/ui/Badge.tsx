import * as React from "react";

export type BadgeVariant =
  | "brand"   // admin role, accent — brand-600 tint
  | "muted"   // member role, neutral — brand-200 tint
  | "green"   // confirmed, clinic type
  | "orange"  // pending, open
  | "red"     // cancelled, error
  | "slate";  // dispatcher type, secondary

const variantClasses: Record<BadgeVariant, string> = {
  brand:  "bg-brand-600/10 text-brand-600 border border-brand-600/20",
  muted:  "bg-brand-200    text-brand-800 border border-brand-300",
  green:  "bg-brand-100    text-brand-800 border border-brand-200",
  orange: "bg-orange-50    text-orange-600 border border-orange-200",
  red:    "bg-red-50       text-red-600   border border-red-200",
  slate:  "bg-brand-200/60 text-brand-500  border border-brand-300",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  variant = "muted",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
