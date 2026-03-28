const DEFAULT_PATTERNS = [
  /(?:password|secret|token|api_key)\s*[:=]\s*\S+/gi,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi,
];

export function redact(text: string, patterns?: RegExp[]): string {
  const allPatterns = [...DEFAULT_PATTERNS, ...(patterns ?? [])];
  return allPatterns.reduce(
    (result, pattern) => result.replace(pattern, "[REDACTED]"),
    text,
  );
}
