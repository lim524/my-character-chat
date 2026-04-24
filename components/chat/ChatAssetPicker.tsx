import React, { useState } from 'react'
import { X, Image as ImageIcon, Layout, User, Search } from 'lucide-react'
import type { AssetRef } from '@/lib/interfaceConfig'

interface Props {
  assets: AssetRef[]
  onSelect: (asset: AssetRef) => void
  onClose: () => void
}

export function ChatAssetPicker({ assets, onSelect, onClose }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'character' | 'background' | 'etc'>('all')

  const filteredAssets = assets.filter((a) => {
    const matchesSearch = 
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (a.label || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || a.type === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="absolute bottom-full left-0 mb-4 w-full max-w-sm sm:max-w-md bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[60] animate-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#e45463]" />
          <h3 className="text-sm font-bold text-white">이미지 에셋 선택</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search & Tabs */}
      <div className="p-3 flex flex-col gap-3 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="에셋 이름 또는 ID 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#e45463]/50 transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
          {(['all', 'background', 'character', 'etc'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === t 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {t === 'all' && '전체'}
              {t === 'background' && <><Layout size={12} /> 배경</>}
              {t === 'character' && <><User size={12} /> 캐릭터</>}
              {t === 'etc' && '기타'}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[450px] p-3">
        {filteredAssets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 opacity-60 py-12">
            <Search size={32} />
            <p className="text-sm">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => onSelect(asset)}
                className="group relative aspect-[3/4] bg-black/40 rounded-xl border border-white/5 overflow-hidden hover:border-[#e45463]/50 transition-all active:scale-[0.98]"
              >
                <img 
                  src={asset.url} 
                  alt={asset.label} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-2 text-left translate-y-1 group-hover:translate-y-0 transition-transform">
                  <p className="text-[10px] font-medium text-white line-clamp-1">{asset.label || asset.id}</p>
                  <p className="text-[8px] text-gray-400 uppercase tracking-tighter">{asset.type}</p>
                </div>
                {/* Selection Indicator */}
                <div className="absolute top-2 right-2 w-5 h-5 bg-[#e45463] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all shadow-lg shadow-[#e45463]/20">
                  <span className="text-white text-[10px] font-bold">+</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer info */}
      <div className="p-2.5 bg-black/40 border-t border-white/5 text-center">
        <p className="text-[10px] text-gray-500">클릭하면 대화창에 태그가 삽입됩니다.</p>
      </div>
    </div>
  )
}
