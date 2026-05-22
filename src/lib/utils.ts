import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function reputationLabel(rep: number): string {
  if (rep >= 90) return 'Legendario'
  if (rep >= 70) return 'Confiable'
  if (rep >= 40) return 'Regular'
  return 'Nuevo'
}

export function reputationColor(rep: number): string {
  if (rep >= 90) return 'text-yellow-400'
  if (rep >= 70) return 'text-emerald-400'
  if (rep >= 40) return 'text-blue-400'
  return 'text-zinc-400'
}
