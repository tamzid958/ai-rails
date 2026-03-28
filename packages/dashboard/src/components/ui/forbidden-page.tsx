import Link from "next/link";

type ForbiddenPageProps = {
  message?: string;
};

function ForbiddenPage({
  message = "You don't have access to this resource.",
}: ForbiddenPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-display">403</h1>
      <p className="text-body text-gray-500 mt-2">{message}</p>
      <Link
        href="/"
        className="mt-4 border border-gray-200 px-3 py-1 text-small font-medium text-black hover:bg-gray-50"
      >
        Go back
      </Link>
    </div>
  );
}

export { ForbiddenPage };
export type { ForbiddenPageProps };
