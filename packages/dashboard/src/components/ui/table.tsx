import clsx from "clsx";

type TableProps = {
  children: React.ReactNode;
  className?: string;
};

function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx("w-full border-collapse", className)}>
        {children}
      </table>
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
    <tr className={clsx("border-b border-gray-100 transition-colors hover:bg-gray-50/80", className)}>
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
        "text-left text-label uppercase text-gray-400 tracking-[0.08em] font-semibold border-b-2 border-gray-900 py-2.5 px-3",
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
        "text-body py-2.5 px-3",
        mono && "font-mono text-mono text-gray-600",
        className,
      )}
    >
      {children}
    </td>
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
export type { TableProps, TableHeadProps, TableCellProps };
