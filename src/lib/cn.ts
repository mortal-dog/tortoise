/** Joins class names, skipping falsy values. A small first-party helper instead of a dependency. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
