import { NextResponse, type NextRequest } from "next/server";

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

/**
 * Wraps a Next.js API route handler with standardized error handling.
 * Catches unhandled exceptions and returns a structured 500 response
 * instead of letting them propagate as raw errors.
 */
export function apiHandler(fn: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
      console.error(`[API ${request.method} ${request.nextUrl.pathname}]`, error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  };
}
