import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Standard Tailwind class combiner.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
