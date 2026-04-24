import type { CharacterDraft } from '@/lib/interfaceConfig'
import { Image as ImageIcon, Upload } from 'lucide-react'
import { useRef } from 'react'

export function CreateProfileTab({
  draft,
  patchDraft,
}: {
  draft: CharacterDraft
  patchDraft: (patch: Partial<CharacterDraft>) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      patchDraft({ imageUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const imageUrl = (draft.imageUrl as string) ?? draft.image_url

  return (
    <div className="space-y-5">
      <div>
        <label className="block mb-2 font-semibold">대표 이미지 (프로필)</label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative w-32 h-32 rounded-xl bg-[#111] border border-[#333] cursor-pointer overflow-hidden group hover:border-pink-500/50 transition-all"
        >
          {imageUrl ? (
            <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
              <ImageIcon size={32} className="mb-1" />
              <span className="text-[10px]">업로드</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Upload size={20} className="text-white" />
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold">제목</label>
        <input
          value={draft.name ?? ''}
          onChange={(e) => patchDraft({ name: e.target.value })}
          className="w-full bg-[#111] border border-[#333] rounded px-3 py-2"
          placeholder="작품 제목"
        />
      </div>
      <div>
        <label className="block mb-2 font-semibold">프로필</label>
        <textarea
          value={draft.description ?? ''}
          onChange={(e) => patchDraft({ description: e.target.value })}
          className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 min-h-[80px]"
          placeholder="작품 소개"
        />
      </div>
      <div>
        <label className="block mb-2 font-semibold">첫 대사</label>
        <textarea
          value={draft.firstLine ?? ''}
          onChange={(e) => patchDraft({ firstLine: e.target.value })}
          className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 min-h-[60px]"
          placeholder="게임 시작 시 첫 대사"
        />
      </div>
    </div>
  )
}
