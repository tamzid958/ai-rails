import clsx from "clsx";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  interactive?: boolean;
};

function Card({ children, className, padding = "md", interactive = false }: CardProps) {
  const paddings = { sm: "p-4", md: "p-6", lg: "p-8" };

  return (
    <div
      className={clsx(
        "bg-surface-raised rounded-lg border border-border-subtle shadow-none",
        paddings[padding],
        interactive &&
          "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-border-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("mb-4", className)}>{children}</div>;
}

function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx("text-sm font-medium text-text-tertiary", className)}>
      {children}
    </h3>
  );
}

function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={clsx("text-sm text-text-tertiary mt-1", className)}>
      {children}
    </p>
  );
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("mt-6 pt-4 border-t border-border-subtle flex items-center gap-3", className)}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export type { CardProps };
