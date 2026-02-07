import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract initials from a name for avatar display.
 * 
 * Rules:
 * - Agents/landlords always have first + last name, so they get 2 letters
 * - Tenants get first letter of first name, + first letter of last name if provided
 * - If name has multiple words: first letter of first word + first letter of last word
 * - If name has one word: just the first letter
 * - Falls back to "?" if name is empty/invalid
 */
export function getInitials(name: string | null | undefined): string {
  if (!name || name === "—") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  // First letter of first name + first letter of last name
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
