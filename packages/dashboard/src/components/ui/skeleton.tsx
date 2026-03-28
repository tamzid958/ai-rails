import clsx from "clsx";

type SkeletonProps = {
  className?: string;
};

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "bg-gray-800 skeleton-shimmer rounded-md",
        className,
      )}
    />
  );
}

export { Skeleton };
export type { SkeletonProps };
