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
        "flex justify-between items-start border-b border-gray-200 pb-3 mb-4",
        className,
      )}
    >
      <div>
        <h1 className="text-display">{title}</h1>
        {description && (
          <p className="text-body text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}

export { PageHeader };
export type { PageHeaderProps };
