import clsx from "clsx";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx("flex flex-col items-center justify-center py-16 text-center animate-fade-in", className)}>
      <div className="w-12 h-px bg-gray-200 mb-5" />
      <h3 className="text-h2 text-gray-900">{title}</h3>
      {description && (
        <p className="text-body text-gray-400 mt-2 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
