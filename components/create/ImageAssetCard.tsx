import { Image as ImageIcon, Trash2 } from 'lucide-react'
import type { AssetRef } from '@/lib/interfaceConfig'

export function ImageAssetCard({
  asset,
  onLabelChange,
  onRemove,
  onReplaceImage,
}: {
  asset: AssetRef
  onLabelChange: (assetId: string, label: string) => void
  onRemove: (assetId: string) => void
  onReplaceImage: (assetId: string) => void
}) {
  return (
    <div className="flex items-start gap-3 border border-[#333] rounded-lg p-2 bg-[#0c0c0f]">
      <div className="shrink-0 w-[7.5rem] space-y-1.5">
        <div className="aspect-square w-[7.5rem] rounded-md overflow-hidden bg-[#111] border border-[#333]">
          {asset.url ? (
            <img src={asset.url} alt={asset.label} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <ImageIcon size={28} />
            </div>
          )}
        </div>
        <input
          value={asset.label ?? ''}
          onChange={(e) => onLabelChange(asset.id, e.target.value)}
          placeholder="이름"
          className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-[11px]"
        />
      </div>
      <div className="flex flex-col gap-1 shrink-0 mt-0.5">
        <button
          type="button"
          onClick={() => onRemove(asset.id)}
          className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
          title="삭제"
        >
          <Trash2 size={14} />
        </button>
        <button
          type="button"
          onClick={() => onReplaceImage(asset.id)}
          className="p-1.5 rounded hover:bg-[#222] text-gray-400 hover:text-white"
          title="이미지 변경"
        >
          <ImageIcon size={14} />
        </button>
      </div>
    </div>
  )
}
