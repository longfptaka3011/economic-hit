export const CHARACTER_COUNT = 6;
export const AVATAR_COLORS = [0x38bdf8, 0xfb923c, 0xa3e635, 0xe879f9, 0xfacc15, 0xf472b6, 0x5eead4, 0xc4b5fd,
  0xef4444,0x16a34a,0x2563eb,0xf97316,0xa16207,0x64748b,0xf8fafc,0x8b5cf6] as const;
export interface AvatarProfile { nickname: string; character: number; color: number }

/** Validate at the server boundary as well as the local setup screen. */
export function parseAvatarProfile(value: unknown): AvatarProfile | null {
  if (!value || typeof value !== 'object') return null;
  const profile = value as Partial<AvatarProfile>;
  if (typeof profile.nickname !== 'string') return null;
  const nickname = profile.nickname.replace(/[\x00-\x1f\x7f]/g, '').trim().normalize('NFC');
  if (nickname.length < 2 || nickname.length > 24) return null;
  if (!Number.isInteger(profile.character) || profile.character! < 0 || profile.character! >= CHARACTER_COUNT) return null;
  if (!AVATAR_COLORS.some(color => color === profile.color)) return null;
  return { nickname, character: profile.character!, color: profile.color! };
}
