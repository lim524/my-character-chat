'use client'

import type { AssetRef, ExtraInterfaceEntry } from '@/lib/interfaceConfig'
import { parseExtraInterfaceIcons, parseExtraInterfaceOverlays } from '@/lib/interfaceRuntime'
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
  Sword,
  FlaskConical,
  Shield,
  Coins,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'

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
  Sword,
  Potion: FlaskConical,
  FlaskConical,
  Shield,
  Coins,
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
    case 'center':
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    case 'full':
      return 'inset-0'
    default:
      return 'top-16 right-3'
  }
}

import { useState } from 'react'

type Props = {
  entries?: ExtraInterfaceEntry[]
  assets?: AssetRef[]
  activeOverlays?: string[] // 추가: 현재 활성화된 오버레이 ID/에셋ID 목록
  onToggleOverlay?: (id: string) => void
  className?: string
}

export default function ExtraInterfaceOverlay({
  entries,
  assets,
  activeOverlays = [],
  onToggleOverlay,
  className = '',
}: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const allIcons = parseExtraInterfaceIcons(entries)
  const overlays = parseExtraInterfaceOverlays(entries)
  
  if (allIcons.length === 0 && overlays.length === 0) return null

  // parentId가 없는 기본 아이콘들과, 현재 열려있는 메뉴에 속한 아이콘들만 필터링
  const visibleIcons = allIcons.filter(ic => {
    if (!ic.parentId) return true
    return openMenuId === ic.parentId
  })

  return (
    <div className={`pointer-events-none absolute inset-0 z-[25] ${className}`}>
      {/* 오버레이 (기타 이미지 등) 렌더링 */}
      {overlays.map((ov, idx) => {
        const url = ov.url || assets?.find(a => a.id === ov.assetId)?.url
        if (!url) return null
        
        // 1. JSON에 직접 visible: true인 경우 (항상 노출)
        // 2. AI 메시지 태그 등을 통해 activeOverlays에 포함된 경우 (트리거 노출)
        const isTriggered = activeOverlays.includes(ov.id) || (ov.assetId && activeOverlays.includes(ov.assetId))
        const isVisible = ov.visible !== false ? (ov.visible || true) : false
        
        // 최종 가시성 판단: 명시적으로 true이거나, 트리거되었을 때만 표시
        if (!isTriggered && ov.visible === false) return null
        if (ov.visible === undefined && !isTriggered) return null // 기본적으로 명시 안 되면 트리거 대기
        
        const pos = positionClass(ov.position)
        return (
          <motion.div
            key={`ov-${ov.id}-${idx}`}
            className={`absolute ${pos}`}
            style={ov.style}
            {...(ov.motion || {})}
          >
            <img 
              src={url} 
              alt={ov.id} 
              className="w-full h-full object-contain"
            />
          </motion.div>
        )
      })}

      {/* 아이콘 버튼 렌더링 */}
      {visibleIcons.map((ic, idx) => {
        const Icon = resolveIcon(ic.lucide)
        const pos = positionClass(ic.position)
        
        // 아이콘이 여러 개일 때 겹치지 않게 오프셋 계산 (간단한 예시용)
        // parentId가 있는 아이콘들은 메뉴 아이콘 위에 나열되도록 처리
        const offsetStyle: React.CSSProperties = {}
        if (ic.parentId) {
          // 메뉴 아이콘(보통 우하단) 기준 위로 나열
          offsetStyle.bottom = `${4.5 + (allIcons.filter(x => x.parentId === ic.parentId).indexOf(ic) + 1) * 3.2}rem`
        }

        return (
          <motion.div
            key={ic.id + idx}
            className={`pointer-events-auto absolute flex flex-col items-center gap-0.5 ${pos}`}
            style={offsetStyle}
            {...(ic.motion || {})}
          >
            <button
              type="button"
              title={ic.label || ic.id}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition shadow-lg backdrop-blur-md ${
                openMenuId === ic.id 
                  ? 'bg-white/20 border-white/40 text-white' 
                  : 'border-white/15 bg-black/55 text-white/90 hover:bg-black/75 hover:border-white/30'
              }`}
              onClick={() => {
                const overlayTarget = ic.triggerOverlayId || ic.triggerAssetId
                if (overlayTarget && ic.toggleOverlay !== false && onToggleOverlay) {
                  onToggleOverlay(overlayTarget)
                } else if (ic.toggleMenuId) {
                  const tid = ic.toggleMenuId
                  setOpenMenuId(prev => prev === tid ? null : tid)
                } else if (ic.href && typeof window !== 'undefined') {
                  window.open(ic.href, '_blank', 'noopener,noreferrer')
                }
              }}
            >
              {Icon ? <Icon size={20} strokeWidth={2} /> : <span className="text-[10px] font-mono">{ic.id.slice(0, 3)}</span>}
            </button>
            {ic.label ? (
              <span className="max-w-[72px] truncate text-[9px] text-white/70">{ic.label}</span>
            ) : null}
          </motion.div>
        )
      })}
    </div>
  )
}
