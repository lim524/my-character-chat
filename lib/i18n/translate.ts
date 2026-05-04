import type { AppLanguage } from '@/lib/appSettings'
import { messages } from './dictionaries'

export const APP_LANGUAGE_CHANGED_EVENT = 'app-language-changed'

/** Flat path: `mypage.menuChatbot`, `create.profile.titleLabel` */
export function translate(
  lang: AppLanguage,
  path: string,
  vars?: Record<string, string | number>
): string {
  const dict = messages[lang]
  let cur = dict[path]
  if (cur === undefined) cur = messages.ko[path]
  if (typeof cur !== 'string') return path
  let s = cur
  if (vars) {
    for (const [vk, vv] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{\\{${vk}\\}\\}`, 'g'), String(vv))
    }
  }
  return s
}
