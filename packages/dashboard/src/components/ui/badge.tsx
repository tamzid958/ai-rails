import clsx from "clsx";

const VARIANT_CLASSES = {
  default: "bg-gray-100 text-gray-700 border-gray-200",
  accent: "bg-accent text-white border-accent",
  success: "bg-success text-white border-success",
  warning: "bg-warning text-white border-warning",
  danger: "bg-danger text-white border-danger",
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
        "inline-block border px-1 py-0 text-label uppercase tracking-[0.06em]",
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
