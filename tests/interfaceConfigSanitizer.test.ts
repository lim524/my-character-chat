import { describe, expect, it } from 'vitest'
import { importCardToLocalCharacter } from '../lib/characterCardInterop'
import { isSafeExternalHref } from '../lib/interfaceConfigSanitizer'

describe('import interface config sanitization', () => {
  it('truncates too long customCSS on card import', () => {
    const longCss = `body{color:red;}${'x'.repeat(25000)}`
    const imported = importCardToLocalCharacter({
      name: 'test',
      extensions: {
        my_character_chat: {
          interfaceConfig: {
            customCSS: longCss,
          },
        },
      },
    })

    expect((imported.character.interfaceConfig?.customCSS ?? '').length).toBeLessThanOrEqual(20000)
    expect(imported.warnings.some((w) => w.includes('customCSS'))).toBe(true)
  })
})

describe('external href safety', () => {
  it('allows only http/https links', () => {
    expect(isSafeExternalHref('https://example.com')).toBe(true)
    expect(isSafeExternalHref('http://example.com')).toBe(true)
    expect(isSafeExternalHref('javascript:alert(1)')).toBe(false)
    expect(isSafeExternalHref('data:text/html,hello')).toBe(false)
  })
})
