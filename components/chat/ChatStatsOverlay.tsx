import type { StatDefinition } from '@/lib/interfaceConfig'

export function ChatStatsOverlay({
  stats,
  parsedStats,
}: {
  stats: StatDefinition[]
  parsedStats: Record<string, number>
}) {
  if (!stats.length) return null
  return (
    <div className="absolute top-16 left-0 right-0 z-40 px-4 sm:px-6 pointer-events-none mt-2">
      <div className="max-w-max mx-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex flex-wrap gap-4 items-center justify-center pointer-events-auto shadow-lg">
        {stats.map((st) => {
          const val = parsedStats[st.key] ?? st.initial
          const percent = Math.max(0, Math.min(100, ((val - st.min) / (st.max - st.min)) * 100))
          return (
            <div key={st.key} className="flex items-center gap-2 group relative">
              <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">{st.name}</span>
              <div className="w-20 h-2 bg-[#222] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs text-white font-mono">{val}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
