/**
 * Formats a number with Hungarian thousand separators (spaces)
 * @param value - The number to format
 * @returns Formatted string like "1 000 000"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("hu-HU")
}

/**
 * Parses a formatted number string back to a number
 * Removes all spaces and converts to number
 * @param value - The formatted string like "1 000 000"
 * @returns The numeric value
 */
export function parseNumber(value: string): number {
  return Number(value.replace(/\s/g, "").replace(",", "."))
}
