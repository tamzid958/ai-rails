import clsx from "clsx";

type SkeletonProps = {
  className?: string;
};

function Skeleton({ className }: SkeletonProps) {
  return <div className={clsx("bg-gray-100 animate-pulse", className)} />;
}

export { Skeleton };
export type { SkeletonProps };
