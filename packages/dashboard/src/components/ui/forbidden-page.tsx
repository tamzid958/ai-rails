import Link from "next/link";
import { Button } from "./button";
import { ShieldX } from "lucide-react";

type ForbiddenPageProps = { message?: string };

function ForbiddenPage({ message = "You don't have access to this resource." }: ForbiddenPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center animate-fade-in">
      <div className="text-gray-600 mb-4">
        <ShieldX size={40} strokeWidth={1} />
      </div>
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Error 403</p>
      <h1 className="text-2xl font-semibold text-text-primary mt-1">Forbidden</h1>
      <p className="text-sm text-text-tertiary mt-2">{message}</p>
      <div className="mt-6">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/">Go back</Link>
        </Button>
      </div>
    </div>
  );
}

export { ForbiddenPage };
export type { ForbiddenPageProps };
