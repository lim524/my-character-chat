'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  GLOBAL_UI_LAYERS_UPDATED_EVENT,
  getGlobalUiLayers,
  type GlobalUiLayer,
} from '@/lib/globalUiLayers'
import {
  applyGameVariablePlaceholders,
  GAME_VARIABLES_UPDATED_EVENT,
} from '@/lib/gameVariables'
import { sanitizeCustomCss } from '@/lib/interfaceConfigSanitizer'

type LayoutMode = 'viewport' | 'embedded'

export type GlobalUiLayersRuntimeProps = {
  /**
   * 넘기면 IndexedDB 대신 이 배열만 사용 (미리보기·캐릭터별 레이어).
   * `undefined`면 앱 설정(global-ui-layers)을 로드한다.
   */
  layers?: GlobalUiLayer[]
  /** embedded: 미리보기 등 부모 `relative` 안에서만 덮음 */
  layout?: LayoutMode
  /**
   * 생성 화면 미리보기 등: `{{키}}` 치환에 쓸 초기 맵. 지정되면 이 값이 바뀔 때마다 맵이 갱신됩니다.
   * 채팅 화면에서는 지정하지 않고 `game-variables-updated` 이벤트만 사용합니다.
   */
  initialGameVariableValues?: Record<string, string | number | boolean>
}

/** 설정에 저장된 전역 레이어를 순서대로 적용합니다 (CSS → HTML 오버레이 → JS). */
export default function GlobalUiLayersRuntime({
  layers: controlledLayers,
  layout = 'viewport',
  initialGameVariableValues,
}: GlobalUiLayersRuntimeProps) {
  const controlled = controlledLayers !== undefined
  const [idbLayers, setIdbLayers] = useState<GlobalUiLayer[]>([])
  const [gameVarMap, setGameVarMap] = useState<Record<string, string | number | boolean>>(() =>
    initialGameVariableValues !== undefined ? { ...initialGameVariableValues } : {}
  )

  useEffect(() => {
    if (initialGameVariableValues === undefined) return
    setGameVarMap({ ...initialGameVariableValues })
  }, [initialGameVariableValues])

  useEffect(() => {
    if (controlled) return
    void getGlobalUiLayers().then(setIdbLayers)
    const onUpdate = () => {
      void getGlobalUiLayers().then(setIdbLayers)
    }
    window.addEventListener(GLOBAL_UI_LAYERS_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(GLOBAL_UI_LAYERS_UPDATED_EVENT, onUpdate)
  }, [controlled])

  useEffect(() => {
    const onVars = (e: Event) => {
      if (initialGameVariableValues !== undefined) return
      const d = (e as CustomEvent<Record<string, string | number | boolean>>).detail
      if (d && typeof d === 'object') setGameVarMap({ ...d })
    }
    window.addEventListener(GAME_VARIABLES_UPDATED_EVENT, onVars as EventListener)
    return () => window.removeEventListener(GAME_VARIABLES_UPDATED_EVENT, onVars as EventListener)
  }, [initialGameVariableValues])

  const layers = controlled ? controlledLayers! : idbLayers
  const active = useMemo(() => layers.filter((l) => l.enabled), [layers])

  useEffect(() => {
    const cleanups: Array<() => void> = []
    for (const layer of active) {
      const code = layer.javascript.trim()
      if (!code) continue
      try {
        const fn = new Function(code)
        const ret = fn()
        if (typeof ret === 'function') cleanups.push(ret as () => void)
      } catch (e) {
        console.error(`[전역 UI 레이어 JS] ${layer.name || layer.id}`, e)
      }
    }
    return () => {
      for (const c of cleanups) {
        try {
          c()
        } catch {
          /* ignore */
        }
      }
    }
  }, [active])

  const rootPositionClass =
    layout === 'embedded'
      ? 'pointer-events-none absolute inset-0 z-[25]'
      : 'pointer-events-none fixed inset-0 z-40'

  return (
    <>
      {active.map((layer) => {
        const css = sanitizeCustomCss(layer.css)
        if (!css) return null
        return (
          <style
            key={`css-${layer.id}`}
            data-global-ui-layer={layer.id}
            dangerouslySetInnerHTML={{ __html: css }}
          />
        )
      })}
      <div
        className={rootPositionClass}
        aria-hidden
        data-global-ui-root
        data-global-ui-layout={layout}
      >
        {active.map((layer) => {
          const html = layer.html.trim()
          if (!html) return null
          const rendered = applyGameVariablePlaceholders(html, gameVarMap)
          return (
            <div
              key={`html-${layer.id}`}
              data-global-ui-layer={layer.id}
              className="pointer-events-none absolute inset-0 [&>*]:pointer-events-auto"
              dangerouslySetInnerHTML={{ __html: rendered }}
            />
          )
        })}
      </div>
    </>
  )
}
