import { describe, expect, it } from 'vitest'
import type { GameVariableDefinition } from '@/lib/interfaceConfig'
import { extractGameStateFromAssistant, mergeGameVariableValues } from '@/lib/gameVariables'

describe('extractGameStateFromAssistant', () => {
  it('parses nested JSON and strips block', () => {
    const raw =
      'Hello\n[game_state]\n{"outer":{"inner":1},"plain":2}\n[/game_state]'
    const { displayContent, payload } = extractGameStateFromAssistant(raw)
    expect(displayContent.trim()).toBe('Hello')
    expect(payload).toEqual({ outer: { inner: 1 }, plain: 2 })
  })

  it('returns original when invalid JSON', () => {
    const raw = 'x [game_state] not json [/game_state]'
    const { displayContent, payload } = extractGameStateFromAssistant(raw)
    expect(payload).toBeNull()
    expect(displayContent).toBe(raw)
  })
})

describe('mergeGameVariableValues', () => {
  const defs: GameVariableDefinition[] = [
    {
      id: '1',
      key: 'hp',
      label: 'HP',
      type: 'number',
      defaultValue: '100',
    },
    {
      id: '2',
      key: 'note',
      label: 'N',
      type: 'string',
      defaultValue: '',
    },
  ]

  it('merges only defined keys', () => {
    const prev = { hp: 50, note: 'a' }
    const merged = mergeGameVariableValues(defs, prev, { hp: 80, unknown: 9, note: 'b' })
    expect(merged.hp).toBe(80)
    expect(merged.note).toBe('b')
    expect((merged as Record<string, unknown>).unknown).toBeUndefined()
  })
})
