import clsx from "clsx";

const VARIANT_CLASSES = {
  default: "bg-gray-100 text-gray-600 border-gray-200",
  accent: "bg-accent-light text-accent border-accent/20",
  success: "bg-success-light text-success border-success/20",
  warning: "bg-warning-light text-warning border-warning/20",
  danger: "bg-danger-light text-danger border-danger/20",
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
        "inline-flex items-center border px-1.5 py-0.5 text-label uppercase tracking-[0.08em] font-semibold leading-none",
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
