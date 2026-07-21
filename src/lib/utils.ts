import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx for conditional class composition.
 * Uses tailwind-merge to resolve conflicting utility classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable relative or absolute string.
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Format a date to a full timestamp string.
 */
export function formatTimestamp(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Generate a unique client-side ID.
 * Uses crypto.randomUUID when available, falls back to timestamp-based.
 */
export function generateClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Extract plain text from Tiptap JSON content for previews.
 */
export function extractTextFromContent(content: unknown): string {
  if (!content || typeof content !== "object") return "";

  const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
  if (!doc.content) return "";

  return doc.content
    .flatMap((node) => node.content?.map((child) => child.text || "") || [])
    .join(" ")
    .trim();
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Calculate exponential backoff delay with jitter.
 * Prevents thundering herd on reconnect.
 */
export function getBackoffDelay(
  retryCount: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  // Add ±25% jitter to prevent synchronized retries
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(0, exponentialDelay + jitter);
}
