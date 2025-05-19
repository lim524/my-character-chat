import Link from 'next/link'
import { useRouter } from 'next/router'
import clsx from 'clsx'

const steps = [
  { label: '프로필', path: '/create' },
  { label: '상세설정', path: '/create/setting' },
  { label: '기타설정', path: '/create/moresetting' },
  { label: '이미지', path: '/create/image' },
]

export default function CreateStepTab() {
  const router = useRouter()

  return (
    <nav className="w-full border-b border-[#333] bg-[#111]">
      <div className="flex justify-center gap-6 px-6 py-3 overflow-x-auto pt-16">
        {steps.map(({ label, path }) => (
          <Link
            key={path}
            href={path}
            className={clsx(
              'text-sm pb-1 transition whitespace-nowrap',
              router.pathname === path
              ? 'text-white border-b-2 border-white font-semibold'
              : 'text-gray-400 hover:text-white'
)}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
