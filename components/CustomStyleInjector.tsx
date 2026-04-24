'use client'

import { useMemo } from 'react'

/**
 * InterfaceConfig의 customCSS 필드 내용을 <style> 태그로 주입하는 컴포넌트.
 * 사용자가 정의한 @keyframes 및 클래스 스타일을 실시간으로 적용합니다.
 */
export default function CustomStyleInjector({ css }: { css?: string }) {
  const sanitizedCss = useMemo(() => {
    if (!css?.trim()) return null
    // 아주 기본적인 산재 처리가 필요할 수 있으나, 일단은 그대로 주입 (사용자 정의 보장)
    return css
  }, [css])

  if (!sanitizedCss) return null

  return (
    <style dangerouslySetInnerHTML={{ __html: sanitizedCss }} />
  )
}
