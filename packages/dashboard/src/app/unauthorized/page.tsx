import Link from "next/link";
import { ShieldX } from "lucide-react";

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  const message =
    reason === "domain"
      ? "Your email domain is not authorized to access this platform. Contact your administrator."
      : "You are not authorized to access this platform.";

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center animate-fade-in">
      <div className="text-text-tertiary mb-4">
        <ShieldX size={40} strokeWidth={1} />
      </div>
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
        Access Denied
      </p>
      <h1 className="text-2xl font-semibold text-text-primary mt-1">
        Unauthorized
      </h1>
      <p className="text-sm text-text-tertiary mt-2 text-center max-w-md">
        {message}
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center justify-center border border-border-muted bg-surface-raised px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface transition-colors rounded-md"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
