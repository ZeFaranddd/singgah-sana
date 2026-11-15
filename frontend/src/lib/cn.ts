import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Menggabungkan class Tailwind; class yang bertabrakan diselesaikan oleh tailwind-merge. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
