import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-display">404</h1>
      <p className="text-body text-gray-500 mt-2">Page not found.</p>
      <Link
        href="/"
        className="mt-4 border border-gray-200 px-3 py-1 text-small font-medium text-black hover:bg-gray-50"
      >
        Go home
      </Link>
    </div>
  );
}
