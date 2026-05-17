import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}
