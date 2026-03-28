import clsx from "clsx";

const VARIANT_CLASSES = {
  default: "text-gray-200",
  success: "text-emerald-300",
  warning: "text-amber-300",
  error: "text-red-300",
  info: "text-blue-300",
  outline: "text-gray-300",
  purple: "text-violet-300",
  cyan: "text-cyan-300",
} as const;

const VARIANT_BG: Record<string, string> = {
  default: "#2a2d35",
  success: "#064e3b",
  warning: "#78350f",
  error: "#7f1d1d",
  info: "#1e3a5f",
  outline: "transparent",
  purple: "#4c1d95",
  cyan: "#164e63",
};

type BadgeProps = {
  variant?: keyof typeof VARIANT_CLASSES;
  children: React.ReactNode;
  className?: string;
};

function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium rounded-md leading-5",
        VARIANT_CLASSES[variant],
        variant === "outline" && "ring-1 ring-gray-700",
        className,
      )}
      style={{ backgroundColor: VARIANT_BG[variant] }}
    >
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps };
