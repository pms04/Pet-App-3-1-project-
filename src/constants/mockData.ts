import { DogProfile } from '../utils/compatScore';

// ── 캘린더 마크 데이터 ─────────────────────────────────────
export const WALK_DATES: Record<string, { type: 'walk' | 'lightning' | 'both' }> = {
  '2026-06-02': { type: 'walk' },
  '2026-06-03': { type: 'lightning' },
  '2026-06-05': { type: 'walk' },
  '2026-06-07': { type: 'both' },
  '2026-06-09': { type: 'walk' },
  '2026-06-10': { type: 'walk' },
  '2026-06-14': { type: 'lightning' },
  '2026-06-18': { type: 'walk' },
  '2026-06-21': { type: 'both' },
  '2026-06-25': { type: 'walk' },
};

// ── 번개 이벤트 ───────────────────────────────────────────
export const CALENDAR_EVENTS = [
  {
    id: '1',
    title: '여의도 한강공원 번개 산책',
    date: '2026-06-03',
    displayDate: '2026.06.03',
    time: '14:00',
    location: '여의도 한강공원 제2주차장',
    participants: 3,
    maxParticipants: 5,
    aiSummary: '비슷한 체급의 친구들이 모여있어요! 활동량도 잘 맞아서 안심하고 뛸 수 있습니다.',
    weather: '☀️ 24°C',
    courseId: '1',
  },
  {
    id: '2',
    title: '남산 둘레길 아침 산책',
    date: '2026-06-14',
    displayDate: '2026.06.14',
    time: '08:30',
    location: '남산도서관 입구',
    participants: 2,
    maxParticipants: 4,
    aiSummary: '에너지가 넘치는 친구들이에요. 신나게 달리고 싶은 날 추천합니다.',
    weather: '☁️ 21°C',
    courseId: '2',
  },
];

// ── 코스 데이터 (커뮤니티 피드) ──────────────────────────
export const FEED_POSTS = [
  {
    id: '1',
    user: '초코언니',
    avatar: '👩',
    courseName: '여의도 벚꽃길 코스',
    distance: '3.2km',
    duration: '45분',
    likes: 24,
    dislikes: 1,
    comments: 5,
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80',
    tags: ['벚꽃', '평지', '매너벨트필수'],
    description: '여의도 한강변 따라 벚꽃길을 걷는 코스예요. 평지라 소형견도 쉽게 완주 가능합니다.',
    saved: false,
  },
  {
    id: '2',
    user: '마루아빠',
    avatar: '👨',
    courseName: '남산 숲길 트레킹',
    distance: '5.1km',
    duration: '1시간 20분',
    likes: 42,
    dislikes: 3,
    comments: 12,
    image: 'https://images.unsplash.com/photo-1444212477490-ca407925329e?auto=format&fit=crop&w=800&q=80',
    tags: ['오르막', '숲길', '물그릇지참'],
    description: '남산 N타워를 끼고 도는 숲길 코스입니다. 중대형견에게 추천.',
    saved: false,
  },
  {
    id: '3',
    user: '루시맘',
    avatar: '👩',
    courseName: '경의선 숲길 카페 투어',
    distance: '2.8km',
    duration: '40분',
    likes: 35,
    dislikes: 0,
    comments: 8,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    tags: ['반려견카페', '평지', '사진스팟'],
    description: '연남동~홍대 구간 경의선 숲길. 반려견 동반 카페가 많아서 쉬어가기 좋아요.',
    saved: true,
  },
];

// ── 내 코스 보관함 ────────────────────────────────────────
export const MY_COURSES = [
  {
    id: 'mine_1',
    courseName: '우리 동네 저녁 코스',
    distance: '2.1km',
    duration: '30분',
    date: '2026.06.01',
    isPublic: true,
    tags: ['야간', '평지'],
  },
  {
    id: 'mine_2',
    courseName: '주말 롱워크',
    distance: '6.4km',
    duration: '1시간 30분',
    date: '2026.05.28',
    isPublic: false,
    tags: ['대형견', '오르막'],
  },
];

// ── 채팅방 ────────────────────────────────────────────────
export const CHAT_ROOMS = [
  {
    id: '1',
    name: '여의도 한강공원 번개방',
    lastMessage: '다들 어디쯤 오셨나요?',
    time: '오후 2:15',
    unread: 3,
    type: 'group',
  },
  {
    id: '2',
    name: '마루아빠',
    lastMessage: '오늘 산책 너무 즐거웠어요!',
    time: '오전 11:30',
    unread: 0,
    type: 'private',
  },
  {
    id: '3',
    name: '단골 메이트: 루시',
    lastMessage: '내일도 같은 시간에 뵐까요?',
    time: '어제',
    unread: 0,
    type: 'mate',
  },
];

// ── 샘플 주변 강아지 프로필 (AI 궁합 시뮬레이션용) ─────────
export const NEARBY_DOGS: Array<{
  id: string;
  name: string;
  ownerName: string;
  profile: DogProfile;
  offsetLat: number;
  offsetLng: number;
}> = [
  {
    id: 'n1',
    name: '초코',
    ownerName: '초코언니',
    profile: { weightKg: 4.5, activityLevel: 3, ageMonths: 36, isNeutered: true, gender: 'M' },
    offsetLat: 0.0012,
    offsetLng: -0.0008,
  },
  {
    id: 'n2',
    name: '마루',
    ownerName: '마루아빠',
    profile: { weightKg: 28, activityLevel: 5, ageMonths: 24, isNeutered: false, gender: 'M' },
    offsetLat: -0.0009,
    offsetLng: 0.0015,
  },
  {
    id: 'n3',
    name: '루시',
    ownerName: '루시맘',
    profile: { weightKg: 6, activityLevel: 3, ageMonths: 48, isNeutered: true, gender: 'F' },
    offsetLat: 0.0006,
    offsetLng: -0.0014,
  },
];

// ── 내 강아지 기본 프로필 (궁합 계산 기준) ───────────────
export const MY_DOG_PROFILE: DogProfile = {
  weightKg: 5,
  activityLevel: 3,
  ageMonths: 30,
  isNeutered: true,
  gender: 'F',
};
