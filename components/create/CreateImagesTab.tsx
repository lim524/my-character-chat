import type { AssetRef, AssetType, InterfaceConfig } from '@/lib/interfaceConfig'
import { FolderOpen, Plus, Upload } from 'lucide-react'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { ImageAssetCard } from './ImageAssetCard'

export function CreateImagesTab({
  iface,
  patchInterface,
  imageCategoryTab,
  setImageCategoryTab,
  setAddAssetType,
  addAssetsFromFiles,
  imagesFileInputRef,
  imagesFolderInputRef,
  imageReplaceInputRef,
  onReplaceAssetImage,
  startReplaceAssetImage,
  imageDropActive,
  setImageDropActive,
}: {
  iface: InterfaceConfig
  patchInterface: (patch: Partial<InterfaceConfig>) => void
  imageCategoryTab: AssetType
  setImageCategoryTab: Dispatch<SetStateAction<AssetType>>
  setAddAssetType: Dispatch<SetStateAction<AssetType>>
  addAssetsFromFiles: (files: FileList | null, typeOverride?: AssetType) => void
  imagesFileInputRef: RefObject<HTMLInputElement | null>
  imagesFolderInputRef: RefObject<HTMLInputElement | null>
  imageReplaceInputRef: RefObject<HTMLInputElement | null>
  onReplaceAssetImage: (ev: React.ChangeEvent<HTMLInputElement>) => void
  startReplaceAssetImage: (assetId: string) => void
  imageDropActive: boolean
  setImageDropActive: Dispatch<SetStateAction<boolean>>
}) {
  const backgroundAssets = iface.assets.filter((a) => a.type === 'background')
  const characterAssets = iface.assets.filter((a) => a.type === 'character')
  const otherAssets = iface.assets.filter((a) => a.type === 'ui')

  const selectImageCategory = (t: AssetType) => {
    setImageCategoryTab(t)
    setAddAssetType(t)
  }

  const categoryLabel =
    imageCategoryTab === 'background'
      ? '배경 이미지'
      : imageCategoryTab === 'character'
        ? '캐릭터 이미지'
        : '기타 이미지'

  const listForTab =
    imageCategoryTab === 'background'
      ? backgroundAssets
      : imageCategoryTab === 'character'
        ? characterAssets
        : otherAssets

  return (
    <div className="space-y-4">
      <input
        ref={imagesFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => {
          addAssetsFromFiles(e.target.files, imageCategoryTab)
          e.target.value = ''
        }}
      />
      <input
        ref={imagesFolderInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
        multiple
        className="hidden"
        onChange={(e) => {
          addAssetsFromFiles(e.target.files, imageCategoryTab)
          e.target.value = ''
        }}
      />
      <input
        ref={imageReplaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={onReplaceAssetImage}
      />

      <div className="grid grid-cols-3 gap-1.5">
        {(
          [
            ['background', '배경 이미지'] as const,
            ['character', '캐릭터 이미지'] as const,
            ['ui', '기타 이미지'] as const,
          ]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => selectImageCategory(id)}
            className={`rounded-lg border px-2 py-2.5 text-[11px] font-medium leading-tight transition-colors ${
              imageCategoryTab === id
                ? 'border-white bg-white text-black'
                : 'border-[#444] bg-[#0c0c0f] text-gray-300 hover:border-[#666]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[#333] bg-[#0a0a0c] p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-200">{categoryLabel} 추가</span>
          <span className="text-[10px] text-gray-500">파일은 Ctrl+클릭으로 여러 장 선택 가능</span>
        </div>
        <div
          role="button"
          tabIndex={0}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setImageDropActive(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setImageDropActive(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setImageDropActive(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setImageDropActive(false)
            addAssetsFromFiles(e.dataTransfer.files, imageCategoryTab)
          }}
          className={`rounded-lg border-2 border-dashed px-3 py-6 text-center transition-colors ${
            imageDropActive
              ? 'border-pink-400/80 bg-pink-500/10'
              : 'border-[#444] bg-[#080808] hover:border-[#555]'
          }`}
        >
          <Upload className="mx-auto mb-2 text-gray-500" size={22} />
          <p className="text-[11px] text-gray-400 mb-1">이미지를 여기에 끌어다 놓기</p>
          <p className="text-[10px] text-gray-600">현재 선택: {categoryLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => imagesFileInputRef.current?.click()}
            className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-1.5 rounded-lg border border-[#444] bg-[#111] px-3 py-2 text-xs hover:border-white"
          >
            <Plus size={14} /> 파일 (다중 선택)
          </button>
          <button
            type="button"
            onClick={() => imagesFolderInputRef.current?.click()}
            className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-1.5 rounded-lg border border-[#444] bg-[#111] px-3 py-2 text-xs hover:border-white"
          >
            <FolderOpen size={14} /> 폴더
          </button>
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400">{categoryLabel} 목록</h3>
          {listForTab.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (!window.confirm(`${categoryLabel}을 모두 삭제할까요?`)) return
                patchInterface({
                  assets: iface.assets.filter((a) => a.type !== imageCategoryTab),
                })
              }}
              className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>
        <div className="space-y-2">
          {listForTab.length === 0 ? (
            <p className="text-[11px] text-gray-500 py-3 text-center rounded-lg border border-dashed border-[#333]">
              아직 없습니다. 위에서 추가하세요.
            </p>
          ) : (
            listForTab.map((asset: AssetRef) => (
              <ImageAssetCard
                key={asset.id}
                asset={asset}
                onLabelChange={(id, label) => {
                  patchInterface({
                    assets: iface.assets.map((a) => (a.id === id ? { ...a, label } : a)),
                  })
                }}
                onRemove={(id) => {
                  patchInterface({
                    assets: iface.assets.filter((a) => a.id !== id),
                  })
                }}
                onReplaceImage={startReplaceAssetImage}
              />
            ))
          )}
        </div>
      </section>
    </div>
  )
}
