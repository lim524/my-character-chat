import Image from 'next/image'
import type { CSSProperties } from 'react'
import ExtraInterfaceOverlay from '@/components/ExtraInterfaceOverlay'
import { parseMergedVisibility } from '@/lib/interfaceRuntime'
import type { AssetRef, ExtraInterfaceEntry } from '@/lib/interfaceConfig'

export function ChatVnLayer({
  displayedImage,
  isDataUrl,
  nSprites,
  effectiveLiftPx,
  spriteScale,
  sideBySide,
  gridColumnCount,
  gapPx,
  justifyContent,
  alignItemsFlex,
  spriteCellMaxWidthStyle,
  spriteHeightVh,
  activeCharacterSprites,
  extraInterfaceEntries,
  assets,
  activeOverlays,
  overlayOnlyMode,
}: {
  displayedImage: string | null
  isDataUrl: (s: string) => boolean
  nSprites: number
  effectiveLiftPx: number
  spriteScale: number
  sideBySide: boolean
  gridColumnCount: number
  gapPx: number
  justifyContent: CSSProperties['justifyContent']
  alignItemsFlex: CSSProperties['alignItems']
  spriteCellMaxWidthStyle: CSSProperties | undefined
  spriteHeightVh: number | null
  activeCharacterSprites: string[]
  extraInterfaceEntries: ExtraInterfaceEntry[] | undefined
  assets: AssetRef[]
  activeOverlays: string[]
  overlayOnlyMode: boolean
}) {
  const visibility = parseMergedVisibility(extraInterfaceEntries)

  return (
    <>
      {displayedImage && visibility.background !== false && (
        <Image
          src={displayedImage}
          alt="배경"
          fill
          className="object-cover z-0"
          unoptimized={isDataUrl(displayedImage)}
        />
      )}

      {nSprites > 0 && visibility.character !== false && !overlayOnlyMode && (
        <div
          className="absolute inset-x-0 top-16 sm:top-[4.5rem] flex justify-center items-end px-4 z-10 pointer-events-none"
          style={{ bottom: effectiveLiftPx }}
        >
          <div
            className="w-full flex justify-center"
            style={{
              transform: spriteScale !== 1 ? `scale(${spriteScale})` : undefined,
              transformOrigin: 'bottom center',
            }}
          >
            <div
              className="w-full max-w-[min(96vw,80rem)] mx-auto"
              style={{
                display: nSprites === 1 ? 'block' : sideBySide ? 'grid' : 'flex',
                flexDirection: !sideBySide && nSprites > 1 ? 'column' : undefined,
                gridTemplateColumns: sideBySide ? `repeat(${gridColumnCount}, minmax(0, 1fr))` : undefined,
                gap: gapPx,
                justifyItems: sideBySide ? 'center' : undefined,
                justifyContent: sideBySide ? justifyContent : undefined,
                alignItems:
                  !sideBySide && nSprites > 1 ? 'center' : sideBySide ? alignItemsFlex : undefined,
              }}
            >
              {activeCharacterSprites.map((spriteUrl, i) => (
                <div
                  key={`${i}-${spriteUrl.slice(0, 48)}`}
                  className={`min-w-0 flex justify-center ${nSprites === 1 ? 'mx-auto' : ''}`}
                  style={spriteCellMaxWidthStyle}
                >
                  <div
                    className={
                      spriteHeightVh == null
                        ? 'relative w-full max-w-[min(36rem,calc(100vw-2rem))] h-[min(42vh,52dvh)] sm:h-[min(52vh,min(380px,48dvh))] max-h-[min(400px,70dvh)] min-h-[120px]'
                        : 'relative w-full max-w-[min(36rem,calc(100vw-2rem))] min-h-[120px]'
                    }
                    style={
                      spriteHeightVh != null
                        ? {
                            height: `${spriteHeightVh}vh`,
                            maxHeight: 'min(80vh, 520px, calc(100dvh - 11rem))',
                          }
                        : undefined
                    }
                  >
                    <Image
                      src={spriteUrl}
                      alt={nSprites > 1 ? `캐릭터 ${i + 1}` : '캐릭터 스탠딩'}
                      fill
                      sizes="(max-width: 640px) 96vw, (max-width: 1024px) 50vw, min(36rem, 96vw)"
                      className="object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                      unoptimized={isDataUrl(spriteUrl)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ExtraInterfaceOverlay 
        entries={extraInterfaceEntries} 
        assets={assets} 
        activeOverlays={activeOverlays}
      />

      {/* AI가 트리거한 동적 CG/오버레이 레이어 (전용 레이어) */}
      {activeOverlays.map((assetId) => {
        const asset = assets.find((a) => a.id === assetId)
        // 이미 ExtraInterfaceOverlay에서 처리 중인 ID이거나, 배경/캐릭터 타입이면 무시
        if (!asset || asset.type === 'background' || asset.type === 'character') return null
        
        return (
          <div
            key={`dynamic-ov-${assetId}`}
            className="absolute inset-0 z-[23] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
          >
             <div className="relative w-[90%] h-[80%] max-w-4xl">
               <Image 
                src={asset.url} 
                fill 
                className="object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" 
                alt={asset.label || 'CG'} 
                sizes="90vw"
               />
             </div>
          </div>
        )
      })}

    </>
  )
}
