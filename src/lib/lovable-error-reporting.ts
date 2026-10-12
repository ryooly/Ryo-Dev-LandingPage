// Error reporting helper used by route error boundaries and other capture points.
// Reports are forwarded to console.error, which src/lib/error-capture.ts wraps
// so stacks (including the cause chain) survive into the log pipeline.

export type ReportContext = Record<string, unknown>;

export function reportLovableError(error: unknown, context: ReportContext = {}): void {
  try {
    const scope = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : "";
    console.error(`[error-report]${scope}`, error);
  } catch {
    // Never let reporting failures mask the original error.
  }
}
