import { describe, expect, it } from 'vitest'
import { sanitizeGlobalUiHtml, stripScriptTagsFromHtml } from '@/lib/globalUiLayers'

describe('stripScriptTagsFromHtml', () => {
  it('removes inline script tags', () => {
    const html = '<div>a</div><script>alert(1)</script><p>b</p>'
    expect(stripScriptTagsFromHtml(html)).toBe('<div>a</div><p>b</p>')
  })

  it('removes script with attributes', () => {
    const html = '<script type="text/javascript">evil()</script><span>x</span>'
    expect(stripScriptTagsFromHtml(html)).toBe('<span>x</span>')
  })
})

describe('sanitizeGlobalUiHtml', () => {
  it('returns empty for non-string', () => {
    expect(sanitizeGlobalUiHtml(null)).toBe('')
    expect(sanitizeGlobalUiHtml(1)).toBe('')
  })
})
