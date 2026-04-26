import { describe, expect, it } from 'vitest'
import { shouldApplyAssistantReply } from '../lib/chatConcurrency'

describe('shouldApplyAssistantReply', () => {
  it('allows the latest reply in same room', () => {
    expect(
      shouldApplyAssistantReply({
        requestToken: 3,
        latestRequestToken: 3,
        roomIdAtSend: 'room-a',
        currentRoomId: 'room-a',
      })
    ).toBe(true)
  })

  it('rejects stale reply when request token is old', () => {
    expect(
      shouldApplyAssistantReply({
        requestToken: 2,
        latestRequestToken: 3,
        roomIdAtSend: 'room-a',
        currentRoomId: 'room-a',
      })
    ).toBe(false)
  })

  it('rejects reply when user switched room', () => {
    expect(
      shouldApplyAssistantReply({
        requestToken: 3,
        latestRequestToken: 3,
        roomIdAtSend: 'room-a',
        currentRoomId: 'room-b',
      })
    ).toBe(false)
  })
})
