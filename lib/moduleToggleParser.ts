export type ModuleToggleControlType =
  | 'checkbox'
  | 'select'
  | 'text'
  | 'group'
  | 'groupEnd'
  | 'divider'

export interface ModuleToggleControl {
  key: string
  label: string
  type: ModuleToggleControlType
  options?: string[]
}

/**
 * Risu customModuleToggle format:
 * key=label
 * key=label=select=opt1,opt2
 * key=label=text
 * =Group Title=groupStart
 * ==groupEnd
 * =Divider=divider
 */
export function parseModuleToggleControls(spec: string): ModuleToggleControl[] {
  if (!spec?.trim()) return []
  const lines = spec
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const out: ModuleToggleControl[] = []
  for (const line of lines) {
    const parts = line.split('=')
    const key = (parts[0] ?? '').trim()
    const label = (parts[1] ?? '').trim()
    const kind = (parts[2] ?? '').trim().toLowerCase()
    const optionsRaw = (parts[3] ?? '').trim()

    if (!key) {
      if (kind === 'group' || kind === 'groupstart') {
        out.push({ key: '', label: label || 'Group', type: 'group' })
      } else if (kind === 'groupend') {
        out.push({ key: '', label: label || 'Group End', type: 'groupEnd' })
      } else if (kind === 'divider') {
        out.push({ key: '', label: label || '', type: 'divider' })
      }
      continue
    }

    if (kind === 'select') {
      const options = optionsRaw
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      out.push({ key, label: label || key, type: 'select', options })
      continue
    }
    if (kind === 'text') {
      out.push({ key, label: label || key, type: 'text' })
      continue
    }
    out.push({ key, label: label || key, type: 'checkbox' })
  }
  return out
}

