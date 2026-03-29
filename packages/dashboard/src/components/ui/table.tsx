import clsx from "clsx";

type TableProps = { children: React.ReactNode; className?: string };

function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx("w-full border-collapse", className)}>{children}</table>
    </div>
  );
}

function TableHeader({ children, className }: TableProps) {
  return <thead className={clsx(className)}>{children}</thead>;
}

function TableBody({ children, className }: TableProps) {
  return <tbody className={clsx(className)}>{children}</tbody>;
}

function TableRow({ children, className }: TableProps) {
  return (
    <tr className={clsx("border-b border-border-subtle transition-colors hover:bg-surface-raised", className)}>
      {children}
    </tr>
  );
}

type TableHeadProps = { children: React.ReactNode; className?: string };

function TableHead({ children, className }: TableHeadProps) {
  return (
    <th className={clsx("text-xs font-medium text-text-tertiary uppercase tracking-wide border-b border-border-muted py-3 px-3", !className?.includes("text-center") && "text-left", className)}>
      {children}
    </th>
  );
}

type TableCellProps = { children: React.ReactNode; className?: string; mono?: boolean; colSpan?: number; style?: React.CSSProperties };

function TableCell({ children, className, mono = false, colSpan, style }: TableCellProps) {
  return (
    <td
      colSpan={colSpan}
      style={style}
      className={clsx(
        "py-3 px-3 text-sm text-text-secondary",
        mono && "font-mono text-xs text-text-tertiary",
        className,
      )}
    >
      {children}
    </td>
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
export type { TableProps, TableHeadProps, TableCellProps };
