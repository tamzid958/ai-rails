import clsx from "clsx";

type SkeletonProps = {
  className?: string;
};

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-gray-100",
        className,
      )}
    >
      <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/60 to-transparent" style={{ transform: "translateX(-100%)" }} />
      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
}

export { Skeleton };
export type { SkeletonProps };
