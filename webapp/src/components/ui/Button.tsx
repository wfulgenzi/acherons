import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-vivid disabled:opacity-60",
  secondary:
    "bg-brand-100 text-brand-800 border border-brand-200 hover:bg-brand-200 hover:border-brand-300 disabled:opacity-50",
  danger:
    "text-red-600 hover:text-red-700 disabled:text-gray-300",
  ghost:
    "text-brand-600 hover:bg-brand-100 disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-5 py-2.5 text-sm rounded-xl",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
} = {}) {
  return [
    "inline-flex items-center justify-center gap-1.5 font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed",
    variantClasses[variant],
    sizeClasses[size],
  ].join(" ");
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonVariants({ variant, size })} ${className}`}
      {...props}
    />
  );
}
