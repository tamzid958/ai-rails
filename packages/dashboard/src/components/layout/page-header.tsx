import clsx from "clsx";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={clsx("flex flex-col sm:flex-row sm:items-start sm:justify-between pb-2 mb-6", className)}>
      <div>
        <h1 className="text-2xl font-light tracking-tight text-text-primary">{title}</h1>
        {description && <p className="text-sm text-text-tertiary mt-1 max-w-xl">{description}</p>}
      </div>
      {actions && <div className="shrink-0 mt-3 sm:mt-0 sm:ml-4">{actions}</div>}
    </div>
  );
}

export { PageHeader };
export type { PageHeaderProps };
