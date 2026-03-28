import clsx from "clsx";

type SeparatorProps = {
  orientation?: "horizontal" | "vertical";
  strong?: boolean;
  className?: string;
};

function Separator({
  orientation = "horizontal",
  strong = false,
  className,
}: SeparatorProps) {
  const color = strong ? "border-gray-200" : "border-gray-100";

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={clsx(
        orientation === "horizontal"
          ? `w-full border-t ${color}`
          : `h-full border-l ${color}`,
        className,
      )}
    />
  );
}

export { Separator };
export type { SeparatorProps };
