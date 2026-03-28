import clsx from "clsx";
import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
};

function ChartCard({ title, description, children, className, action }: ChartCardProps) {
  return (
    <div
      className={clsx(
        "bg-surface-raised rounded-lg border border-border-subtle p-6 shadow-none",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-medium text-text-tertiary">{title}</h3>
          {description && <p className="text-xs text-text-tertiary mt-0.5">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

export { ChartCard };
export type { ChartCardProps };
