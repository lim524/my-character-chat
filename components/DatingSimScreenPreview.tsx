import Image from 'next/image'
import type { ScreenConfig, AssetRef, InterfaceConfig } from '@/lib/interfaceConfig'

type Props = {
  screen: ScreenConfig | null
  assets: AssetRef[]
  uiTheme?: InterfaceConfig['uiTheme']
}

function findAssetUrl(assets: AssetRef[], id?: string) {
  if (!id) return ''
  const found = assets.find((a) => a.id === id)
  return found?.url ?? ''
}

export default function DatingSimScreenPreview({ screen, assets, uiTheme }: Props) {
  const backgroundUrl = findAssetUrl(assets, screen?.background)
  
  // Support both flat and nested JSON structures:
  // - Flat: { backgroundColor: '...', nameColor: '...', textColor: '...' }
  // - Nested: { chatBoxStyle: { ... }, senderStyle: { ... }, contentStyle: { ... } }
  const { nameColor, textColor, chatBoxStyle, senderStyle, contentStyle, messageStyle, ...flatBoxStyles } = (uiTheme || {}) as any
  
  const boxStyle = { backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', ...flatBoxStyles, ...(chatBoxStyle || {}) }
  const nameLabelStyle = { color: nameColor ?? '#fbcfe8', ...(senderStyle || {}) }
  const textBodyStyle = { color: textColor ?? '#f3f4f6', ...(contentStyle || {}), ...(messageStyle || {}) }

  return (
    <div className="relative w-full h-full min-h-[420px] max-h-[640px] bg-black rounded-xl overflow-hidden">
      {/* 배경 */}
      {backgroundUrl ? (
        <Image
          src={backgroundUrl}
          alt="배경"
          fill
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      )}

      {/* 어둡게 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* 캐릭터들 */}
      <div className="absolute inset-0 flex items-end justify-center gap-6 px-6 pb-32 pointer-events-none">
        {(screen?.characters ?? []).map((ch) => {
          const url = findAssetUrl(assets, ch.assetId)
          if (!url) return null
          const baseClass =
            'relative w-28 h-40 md:w-32 md:h-48 drop-shadow-[0_0_18px_rgba(0,0,0,0.8)]'
          const alignClass =
            ch.slot === 'left'
              ? 'self-end translate-x-[-40%]'
              : ch.slot === 'right'
              ? 'self-end translate-x-[40%]'
              : 'self-end'

          return (
            <div key={ch.assetId + ch.slot} className={`${baseClass} ${alignClass}`}>
              <Image
                src={url}
                alt={ch.expression || '캐릭터'}
                fill
                className="object-contain object-bottom"
              />
            </div>
          )
        })}
      </div>

      {/* 대화 박스 */}
      <div className="absolute left-0 right-0 bottom-0 px-4 pb-4 md:px-6 md:pb-6">
        <div 
          className="mx-auto max-w-2xl rounded-2xl border border-white/10 p-4 md:p-5"
          style={boxStyle}
        >
          <div className="flex items-center justify-between mb-2">
            <div 
              className="text-xs font-semibold tracking-wide"
              style={nameLabelStyle}
            >
              {screen?.dialogue?.speakerName || '???'}
            </div>
          </div>
          <div 
            className="text-sm md:text-base min-h-[3rem] whitespace-pre-wrap leading-relaxed"
            style={textBodyStyle}
          >
            {screen?.dialogue?.text || '여기에 대사가 표시됩니다.'}
          </div>

          {screen?.choices && screen.choices.length > 0 && (
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {screen.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className="text-left text-xs md:text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-100 transition"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

