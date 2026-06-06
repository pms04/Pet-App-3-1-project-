// 생년월일 → "X살 Y개월" 문자열 변환 (원본 동작 동일)
export function calculateDynamicAge(birthDateStr: string): string {
  if (!birthDateStr) return '나이 미등록';
  const birth = new Date(birthDateStr);
  const now = new Date();
  if (isNaN(birth.getTime())) return birthDateStr;

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (years === 0) return `${months}개월`;
  return `${years}살 ${months > 0 ? `${months}개월` : ''}`;
}
