export function shouldApplyAssistantReply(args: {
  requestToken: number
  latestRequestToken: number
  roomIdAtSend: string | null
  currentRoomId: string | null
}): boolean {
  const { requestToken, latestRequestToken, roomIdAtSend, currentRoomId } = args
  if (requestToken !== latestRequestToken) return false
  if (roomIdAtSend !== currentRoomId) return false
  return true
}
