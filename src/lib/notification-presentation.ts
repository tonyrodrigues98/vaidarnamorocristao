const EMOJI_RE =
  /\p{Extended_Pictographic}|\u{1F3FB}|\u{1F3FC}|\u{1F3FD}|\u{1F3FE}|\u{1F3FF}|\u{FE0F}|\u200D/gu;

export function stripNotificationEmoji(value: string): string {
  return value.replace(EMOJI_RE, "").replace(/\s+/g, " ").trim();
}
