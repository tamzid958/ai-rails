import clsx from "clsx";

type StatCardProps = {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
};

function StatCard({ title, value, trend, className }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div className={clsx("card p-4 flex flex-col justify-between min-h-30", className)}>
      <p className="text-label uppercase text-gray-400 tracking-[0.08em]">
        {title}
      </p>
      <div>
        <p className="text-metric tabular-nums text-black">{value}</p>
        {trend && (
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={clsx(
                "inline-flex items-center gap-0.5 text-label tracking-[0.06em] font-semibold",
                isPositive ? "text-success" : "text-danger",
              )}
            >
              <svg
                className={clsx("w-3 h-3", !isPositive && "rotate-180")}
                viewBox="0 0 12 12"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6 2.5l4 5H2l4-5z" />
              </svg>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-label text-gray-400 tracking-[0.06em]">
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export { StatCard };
export type { StatCardProps };
