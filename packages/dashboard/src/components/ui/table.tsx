import clsx from "clsx";

type TableProps = {
  children: React.ReactNode;
  className?: string;
};

function Table({ children, className }: TableProps) {
  return (
    <table className={clsx("w-full border-collapse", className)}>
      {children}
    </table>
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
    <tr className={clsx("border-b border-gray-100 hover:bg-gray-50", className)}>
      {children}
    </tr>
  );
}

type TableHeadProps = {
  children: React.ReactNode;
  className?: string;
};

function TableHead({ children, className }: TableHeadProps) {
  return (
    <th
      className={clsx(
        "text-left text-label uppercase text-gray-500 tracking-[0.06em] border-b border-gray-200 p-2",
        className,
      )}
    >
      {children}
    </th>
  );
}

type TableCellProps = {
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
};

function TableCell({ children, className, mono = false }: TableCellProps) {
  return (
    <td
      className={clsx(
        "text-body p-2",
        mono && "font-mono text-mono",
        className,
      )}
    >
      {children}
    </td>
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
export type { TableProps, TableHeadProps, TableCellProps };
