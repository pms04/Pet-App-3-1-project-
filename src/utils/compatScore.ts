// ============================================================
// AI 궁합 점수 엔진 (WalkFix)
// 출처 근거:
//   - 체중(35%): AVMA Dog Bite Statistics — 체급 차이 클수록 부상 치명률↑
//   - 활동량(25%): AKC Breed Energy Level 5단계 분류
//   - 나이/생애주기(25%): AAHA Life Stage Guidelines (사회화 황금기 3~16주 특별 처리)
//   - 성별·중성화(15%): AVMA & Reisner IR et al. (2007) JAVMA
// ============================================================

export interface DogProfile {
  weightKg: number;          // 체중 (kg)
  activityLevel: 1 | 2 | 3 | 4 | 5; // AKC 기준 1(낮음)~5(매우 높음)
  ageMonths: number;         // 나이 (개월)
  isNeutered: boolean;       // 중성화 여부
  gender: 'M' | 'F';        // 성별
}

// ── 생애주기 분류 (AAHA Life Stage Guidelines) ──────────────
type LifeStage = 'golden' | 'puppy' | 'adult' | 'senior';

function getLifeStage(ageMonths: number): LifeStage {
  if (ageMonths <= 3.7)  return 'golden';  // 사회화 황금기: ~16주
  if (ageMonths <= 12)   return 'puppy';
  if (ageMonths <= 84)   return 'adult';   // 7년
  return 'senior';
}

// ── 1. 체중 점수 (35%) — AVMA 기반 ─────────────────────────
// 체급 차이가 클수록 부상 치명률 상승 → 유사할수록 高점수
function weightScore(a: number, b: number): number {
  const ratio = Math.min(a, b) / Math.max(a, b); // 0~1
  return ratio; // 체중이 같으면 1.0, 차이가 클수록 0에 수렴
}

// ── 2. 활동량 점수 (25%) — AKC Breed Energy Level ───────────
function activityScore(a: number, b: number): number {
  const diff = Math.abs(a - b); // 0~4
  return 1 - diff / 4;
}

// ── 3. 나이/생애주기 점수 (25%) — AAHA Life Stage ───────────
// 사회화 황금기 강아지는 차분한 성견/중성화 암컷과만 높은 점수
function ageScore(a: DogProfile, b: DogProfile): number {
  const stageA = getLifeStage(a.ageMonths);
  const stageB = getLifeStage(b.ageMonths);

  // 황금기 강아지 특별 보호 로직
  const isGoldenInvolved = stageA === 'golden' || stageB === 'golden';
  if (isGoldenInvolved) {
    const other = stageA === 'golden' ? b : a;
    const otherStage = stageA === 'golden' ? stageB : stageA;
    // 황금기 강아지는 성견(adult) + 중성화 + 암컷과만 안전
    if (otherStage === 'adult' && other.isNeutered && other.gender === 'F') return 0.95;
    if (otherStage === 'adult' && other.isNeutered) return 0.75;
    if (otherStage === 'puppy') return 0.60; // 비슷한 또래 puppy
    return 0.20; // 그 외 조합은 위험
  }

  // 노령견은 차분한 성견/같은 노령견 선호
  const isseniorInvolved = stageA === 'senior' || stageB === 'senior';
  if (isseniorInvolved) {
    if (stageA === stageB) return 0.90; // 둘 다 노령견
    const other = stageA === 'senior' ? stageB : stageA;
    if (other === 'adult') return 0.65;
    if (other === 'puppy') return 0.30; // 에너지 차이로 스트레스
    return 0.20;
  }

  // 일반 케이스: 같은 스테이지끼리
  if (stageA === stageB) return 1.0;

  const monthDiff = Math.abs(a.ageMonths - b.ageMonths);
  // 나이 차이 월 기준 선형 감소 (24개월 차이 이상이면 0.4)
  return Math.max(0.4, 1 - monthDiff / 60);
}

// ── 4. 성별·중성화 점수 (15%) — AVMA + Reisner 2007 ────────
// 비중성화 수컷 간 조합이 가장 위험 (호르몬 공격성)
function genderNeuterScore(a: DogProfile, b: DogProfile): number {
  const bothMaleUncut = a.gender === 'M' && !a.isNeutered && b.gender === 'M' && !b.isNeutered;
  if (bothMaleUncut) return 0.15; // 가장 위험한 조합

  const oneMaleUncut =
    (a.gender === 'M' && !a.isNeutered) || (b.gender === 'M' && !b.isNeutered);
  if (oneMaleUncut) return 0.55;

  const bothNeutered = a.isNeutered && b.isNeutered;
  if (bothNeutered) return 1.0;

  return 0.80; // 한쪽만 중성화
}

// ── 최종 궁합 점수 계산 ──────────────────────────────────────
export function calcCompatScore(a: DogProfile, b: DogProfile): {
  score: number;         // 0~100 정수
  grade: 'safe' | 'caution' | 'danger';
  breakdown: {
    weight: number;
    activity: number;
    age: number;
    genderNeuter: number;
  };
} {
  const w  = weightScore(a.weightKg, b.weightKg);
  const ac = activityScore(a.activityLevel, b.activityLevel);
  const ag = ageScore(a, b);
  const gn = genderNeuterScore(a, b);

  // 가중 합산
  const raw = w * 0.35 + ac * 0.25 + ag * 0.25 + gn * 0.15;
  const score = Math.round(raw * 100);

  const grade = score >= 70 ? 'safe' : score >= 40 ? 'caution' : 'danger';

  return {
    score,
    grade,
    breakdown: {
      weight:      Math.round(w  * 100),
      activity:    Math.round(ac * 100),
      age:         Math.round(ag * 100),
      genderNeuter:Math.round(gn * 100),
    },
  };
}

// ── 등급 라벨 헬퍼 ───────────────────────────────────────────
export function gradeLabel(grade: 'safe' | 'caution' | 'danger'): string {
  return { safe: '✅ 안전', caution: '⚠️ 주의', danger: '🚫 위험' }[grade];
}

export function gradeColor(grade: 'safe' | 'caution' | 'danger'): string {
  return { safe: '#30D158', caution: '#FF9F0A', danger: '#FF3B30' }[grade];
}
