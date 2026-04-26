import type { InterfaceConfig } from '@/lib/interfaceConfig'

export function CreateCustomCssTab({
  iface,
  patchInterface,
}: {
  iface: InterfaceConfig
  patchInterface: (patch: Partial<InterfaceConfig>) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block font-semibold mb-2">전역 CSS 설정 (Custom CSS)</label>
        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
          이곳에 작성한 CSS는 앱 전체에 실시간으로 적용됩니다. <code className="text-pink-300/90">@keyframes</code>를 정의하여 
          자신만의 애니메이션 효과를 만들거나, 특정 UI 요소의 스타일을 강제로 덮어쓸 수 있습니다.
        </p>
        <textarea
          value={iface.customCSS || ''}
          onChange={(e) => patchInterface({ customCSS: e.target.value })}
          spellCheck={false}
          className="w-full min-h-[400px] bg-[#090909] border border-[#333] rounded-lg px-4 py-3 text-xs font-mono text-gray-200 focus:border-white outline-none"
          placeholder={`/* 예시: 부드럽게 깜빡이는 효과 */\n@keyframes pulse-custom {\n  0% { opacity: 1; }\n  50% { opacity: 0.5; }\n  100% { opacity: 1; }\n}\n\n.my-custom-pulse {\n  animation: pulse-custom 2s infinite;\n}`}
        />
      </div>
      
      <div className="bg-[#111] border border-[#222] rounded-lg p-3">
        <h4 className="text-[10px] font-bold text-gray-300 mb-2">💡 활용 팁</h4>
        <ul className="text-[10px] text-gray-500 space-y-1 list-disc pl-4">
          <li>애니메이션 이름을 정의한 후 &apos;추가 인터페이스&apos;의 JSON 스타일에서 호출할 수 있습니다.</li>
          <li>특정 클래스명을 사용하여 대화창이나 배경의 연출을 변경해 보세요.</li>
          <li>실시간으로 반영되므로 작성 즉시 화면에서 변화를 확인할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  )
}
