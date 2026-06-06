// 친구/모임 샘플 데이터 (원본과 동일)
export interface SampleFriend {
  id: number;
  name: string;
  location: string;
  dog: string;
}

export interface SampleGroup {
  id: number;
  title: string;
  members: number;
  time: string;
}

export const sampleFriends: SampleFriend[] = [
  { id: 1, name: '초코 언니', location: '김포시 구래동', dog: '푸들 🐩' },
  { id: 2, name: '보리 요정', location: '김포시 장기동', dog: '말티즈 🐾' },
  { id: 3, name: '장군 아빠', location: '김포시 운양동', dog: '리트리버 🐕' },
];

export const sampleGroups: SampleGroup[] = [
  { id: 1, title: '한강 중앙공원 야간 산책회', members: 14, time: '매주 목요일 저녁 8시' },
  { id: 2, title: '김포 라베니체 주말 소형견 모임', members: 8, time: '매주 토요일 오후 2시' },
];

export const DEFAULT_ALBUMS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=500&q=80', memo: '오늘 구래동 중앙공원에서 날씨 맑음! 초코랑 신나게 뛰놀았던 날 ☀️', date: '2026.05.10' },
  { id: '2', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80', memo: '동네 애견카페 투어. 수제 간식 맛있게 냠냠하고 기분 최고조!', date: '2026.05.12' },
  { id: '3', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=500&q=80', memo: '새로 장만한 노란색 우비 입고 집 앞 마당 가벼운 우중 산책 ☔', date: '2026.05.15' },
  { id: '4', url: 'https://images.unsplash.com/photo-1537151608828-ea2b117b6281?auto=format&fit=crop&w=500&q=80', memo: '주말 한강 나들이. 다른 댕댕이 크루들 만나서 사회성 기르기 훈련 완료.', date: '2026.05.17' },
];
