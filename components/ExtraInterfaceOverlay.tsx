'use client'

import type { ExtraInterfaceEntry } from '@/lib/interfaceConfig'
import { parseExtraInterfaceIcons } from '@/lib/interfaceRuntime'
import {
  Backpack,
  BookOpen,
  Heart,
  Home,
  Map,
  Menu,
  Settings,
  Star,
  User,
  Gem,
  Image as LucideImage,
  MessageCircle,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

const LUCIDE_BY_NAME: Record<string, LucideIcon> = {
  Menu,
  Backpack,
  Settings,
  BookOpen,
  Heart,
  Star,
  Map,
  Home,
  User,
  Gem,
  Image: LucideImage,
  MessageCircle,
  Sparkles,
}

function resolveIcon(name?: string): LucideIcon | null {
  if (!name?.trim()) return null
  const k = name.trim()
  return LUCIDE_BY_NAME[k] || LUCIDE_BY_NAME[k.charAt(0).toUpperCase() + k.slice(1)] || null
}

function positionClass(position?: string): string {
  switch (position) {
    case 'top-left':
      return 'top-3 left-3'
    case 'top-right':
      return 'top-3 right-3'
    case 'bottom-left':
      return 'bottom-3 left-3'
    case 'bottom-right':
      return 'bottom-3 right-3'
    case 'bottom-center':
      return 'bottom-3 left-1/2 -translate-x-1/2'
    default:
      return 'top-16 right-3'
  }
}

type Props = {
  entries?: ExtraInterfaceEntry[]
  className?: string
}

export default function ExtraInterfaceOverlay({ entries, className = '' }: Props) {
  const icons = parseExtraInterfaceIcons(entries)
  if (icons.length === 0) return null

  return (
    <div className={`pointer-events-none absolute inset-0 z-[25] ${className}`}>
      {icons.map((ic) => {
        const Icon = resolveIcon(ic.lucide)
        const pos = positionClass(ic.position)
        return (
          <div
            key={ic.id}
            className={`pointer-events-auto absolute flex flex-col items-center gap-0.5 ${pos}`}
          >
            <button
              type="button"
              title={ic.label || ic.id}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/55 text-white/90 shadow-lg backdrop-blur-md transition hover:bg-black/75 hover:border-white/30"
              onClick={() => {
                if (ic.href && typeof window !== 'undefined') window.open(ic.href, '_blank', 'noopener,noreferrer')
              }}
            >
              {Icon ? <Icon size={20} strokeWidth={2} /> : <span className="text-[10px] font-mono">{ic.id.slice(0, 3)}</span>}
            </button>
            {ic.label ? (
              <span className="max-w-[72px] truncate text-[9px] text-white/70">{ic.label}</span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
