import type { AxiosError } from "axios";

function readDetail(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    const parts = detail
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object" && "msg" in entry) {
          return String((entry as { msg?: unknown }).msg ?? "");
        }
        return "";
      })
      .filter(Boolean);
    if (parts.length) return parts.join("; ");
  }
  return null;
}

/** Surface backend errors clearly — never swallow 404s or validation messages. */
export function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof Error && !("response" in err)) {
    return err.message || fallback;
  }

  const ax = err as AxiosError<{ error?: string; message?: string; detail?: unknown }>;
  const status = ax.response?.status;
  const data = ax.response?.data;
  const detail = readDetail(data?.detail);
  const message =
    data?.error ?? data?.message ?? detail ?? ax.message ?? fallback;

  if (status === 404) {
    return `Not found (404): ${message}. The playlist or track may have been removed, or the link is invalid.`;
  }
  if (status === 409) {
    return message;
  }
  if (status === 422) {
    return detail ?? message ?? "Validation failed. Check your input and try again.";
  }
  if (status) {
    return `${message} (HTTP ${status})`;
  }
  return message || fallback;
}
