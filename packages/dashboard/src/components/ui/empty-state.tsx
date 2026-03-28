import clsx from "clsx";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx("flex flex-col items-center justify-center py-8 text-center", className)}>
      <h3 className="text-h3">{title}</h3>
      {description && (
        <p className="text-body text-gray-500 mt-1">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
