import clsx from "clsx";

const VARIANT_CLASSES = {
  default: "bg-gray-800 text-text-tertiary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  outline: "bg-transparent text-text-tertiary border border-border-muted",
} as const;

type BadgeProps = {
  variant?: keyof typeof VARIANT_CLASSES;
  children: React.ReactNode;
  className?: string;
};

function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide rounded leading-5",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps };
