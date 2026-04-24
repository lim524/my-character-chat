/**
 * 생성기 미리보기(DatingSimScreenPreview)와 채팅 대화창(ChatDialoguePanel)에서
 * 동일한 uiTheme → 인라인 스타일 매핑을 쓰기 위한 공통 헬퍼.
 */
export function buildVnDialogueStyles(uiTheme: Record<string, unknown> | undefined) {
  const {
    nameColor,
    textColor,
    chatBoxStyle,
    senderStyle,
    contentStyle,
    messageStyle,
    ...flatBoxStyles
  } = uiTheme || {}

  const boxStyle: Record<string, unknown> = {
    backgroundColor: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    ...flatBoxStyles,
    ...(chatBoxStyle as object),
  }

  const nameLabelStyle = {
    color: (nameColor as string) ?? '#fbcfe8',
    ...(senderStyle as object),
  }

  const textBodyStyle = {
    color: (textColor as string) ?? '#f3f4f6',
    ...(contentStyle as object),
    ...(messageStyle as object),
  }

  return { boxStyle, nameLabelStyle, textBodyStyle }
}

/** 대화 박스 본체: 생성기 미리보기와 동일한 기본 크기·테두리·패딩 */
export const VN_DIALOGUE_BOX_CLASS =
  'mx-auto w-full max-w-2xl rounded-2xl border border-white/10 p-4 md:p-5 shadow-2xl relative transition-all'
