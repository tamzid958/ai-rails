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
    <div className={clsx("border border-gray-200 p-3", className)}>
      <p className="text-label uppercase text-gray-500 tracking-[0.06em]">
        {title}
      </p>
      <p className="text-h1 tabular-nums mt-1">{value}</p>
      {trend && (
        <p
          className={clsx(
            "text-small mt-1",
            isPositive ? "text-success" : "text-danger",
          )}
        >
          {isPositive ? "▲" : "▼"} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  );
}

export { StatCard };
export type { StatCardProps };
