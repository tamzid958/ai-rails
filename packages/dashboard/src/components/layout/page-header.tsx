import clsx from "clsx";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={clsx(
        "flex justify-between items-end pb-4 mb-6",
        className,
      )}
    >
      <div>
        <div className="accent-rule mb-3" />
        <h1 className="text-display text-black">{title}</h1>
        {description && (
          <p className="text-body text-gray-500 mt-1 max-w-lg">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0 ml-4">{actions}</div>}
    </div>
  );
}

export { PageHeader };
export type { PageHeaderProps };
