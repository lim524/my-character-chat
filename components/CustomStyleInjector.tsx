'use client'

import { useMemo } from 'react'
import { sanitizeCustomCss } from '@/lib/interfaceConfigSanitizer'

/**
 * InterfaceConfig의 customCSS 필드 내용을 <style> 태그로 주입하는 컴포넌트.
 * 사용자가 정의한 @keyframes 및 클래스 스타일을 실시간으로 적용합니다.
 */
export default function CustomStyleInjector({ css }: { css?: string }) {
  const sanitizedCss = useMemo(() => {
    return sanitizeCustomCss(css) ?? null
  }, [css])

  if (!sanitizedCss) return null

  return (
    <style dangerouslySetInnerHTML={{ __html: sanitizedCss }} />
  )
}
