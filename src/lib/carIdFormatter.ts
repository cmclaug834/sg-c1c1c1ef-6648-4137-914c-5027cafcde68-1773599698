/**
 * GLOBAL RULE: NormalizedCarId
 * 
 * Normalizes and formats car IDs consistently throughout the application.
 * 
 * Rules:
 * - Accept any input containing letters and digits (spaces/punctuation allowed)
 * - Extract letters as prefix (A-Z only) and digits as number (0-9 only)
 * - Uppercase prefix
 * - Remove all spaces and punctuation from the number and concatenate digits
 * - Display format: PREFIX + single space + DIGITS
 * 
 * Examples:
 * - "t box 663 566" → "TBOX 663566"
 * - "tbox663566" → "TBOX 663566"
 * - "TBOX-663-566" → "TBOX 663566"
 * - "abc123def456" → "ABCDEF 123456"
 */

export function normalizeCarId(input: string): string {
  if (!input) return "";
  
  // Extract only letters (A-Z) and digits (0-9)
  const letters = input.match(/[a-zA-Z]/g) || [];
  const digits = input.match(/[0-9]/g) || [];
  
  // Uppercase prefix and join digits
  const prefix = letters.join("").toUpperCase();
  const number = digits.join("");
  
  // Return formatted: PREFIX + space + DIGITS
  if (!prefix && !number) return "";
  if (!prefix) return number;
  if (!number) return prefix;
  
  return `${prefix} ${number}`;
}

/**
 * Validates if a car ID input is valid (contains at least some letters or digits)
 */
export function isValidCarId(input: string): boolean {
  return /[a-zA-Z0-9]/.test(input);
}