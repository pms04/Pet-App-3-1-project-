// tendency 필드에 임베드된 [Avatar:URI] 토큰 인코딩/디코딩 헬퍼
// 원본 App.tsx 동작 동일

export interface DecodedTendency {
  avatarUri: string | null;
  cleanTendency: string;
}

export function decodeTendency(tendency?: string | null): DecodedTendency {
  if (!tendency) return { avatarUri: null, cleanTendency: tendency || '' };
  const hasEmbedded = tendency.includes('[Avatar:');
  if (!hasEmbedded) return { avatarUri: null, cleanTendency: tendency };
  const match = tendency.match(/\[Avatar:(.*?)\]/);
  if (!match) return { avatarUri: null, cleanTendency: tendency };
  return {
    avatarUri: match[1],
    cleanTendency: tendency.replace(/\[Avatar:.*?\]\s*/, ''),
  };
}

export function encodeTendency(avatarUri: string | null, tendency: string): string {
  return avatarUri ? `[Avatar:${avatarUri}] ${tendency}` : tendency;
}
