# WalkFix / Pet App 완성 작업 보고서

## 완료 범위

이번 작업에서는 프로젝트의 **가짜 데이터 의존성을 제거**하고, 주요 화면을 실제 Supabase 데이터 흐름에 맞게 재구성했습니다. 기존 화면 결과물의 UX는 최대한 유지하되, 반복되는 데이터 조회·저장 로직은 공통 훅과 유틸리티로 분리하여 코드 효율성을 높였습니다.

| 영역 | 변경 내용 |
|---|---|
| 인증/온보딩 | 최초 프로필 입력 시 auth metadata뿐 아니라 `users` 테이블에도 사용자 정보를 upsert하도록 수정했습니다. |
| 공통 Supabase 레이어 | `src/lib/supabaseApi.ts`를 추가해 현재 사용자 확인, 오류 표시, 날짜/시간 포맷 등 반복 로직을 공통화했습니다. |
| 코스/커뮤니티 | `CourseScreen`을 샘플 피드가 아닌 `posts` 테이블 기반 목록·내 글 필터·글 작성 기능으로 교체했습니다. 외부 샘플 이미지 fallback도 제거했습니다. |
| 번개 산책 | `lightning_walks`, `lightning_participants` 기반으로 번개 목록, 생성, 참여/취소, 캘린더 마커를 구현했습니다. |
| 지도/산책 기록 | 실제 위치 기록을 `walk_logs` 테이블에 저장하도록 연결하고, 주변 강아지는 실제 `dogs/users` 데이터를 기반으로 표시하도록 변경했습니다. |
| 채팅 | 샘플 채팅방 대신 `chat_room_members`, `messages` 기반 최근 대화방 목록을 표시하도록 변경했습니다. |
| 친구/모임 | 프로필의 친구 및 모임 모달을 각각 `friends/users/dogs`, 참여한 `lightning_walks` 데이터 기반으로 교체했습니다. |
| 샘플 데이터 제거 | 더 이상 참조되지 않는 `mockData.ts`, `sampleSocial.ts`를 삭제했습니다. |
| Supabase 스키마 | 앱 실행에 필요한 테이블, 인덱스, RLS 정책을 정리한 `supabase_schema.sql`을 추가했습니다. |

## 추가된 주요 파일

| 파일 | 역할 |
|---|---|
| `src/lib/supabaseApi.ts` | 공통 Supabase 유틸리티 |
| `src/hooks/usePosts.ts` | 코스/커뮤니티 게시물 조회 및 작성 |
| `src/hooks/useLightningWalks.ts` | 번개 산책 조회·생성·참여 |
| `src/hooks/useFriends.ts` | 친구 목록 조회 |
| `src/hooks/useChatRooms.ts` | 채팅방 목록 및 최근 메시지 조회 |
| `src/hooks/useWalkLogs.ts` | 산책 GPS 기록 저장 및 조회 |
| `src/hooks/useNearbyDogs.ts` | 실제 등록 강아지 기반 주변 강아지 표시 및 궁합 계산 |
| `supabase_schema.sql` | Supabase 테이블/RLS 보완 SQL |

## 검증 결과

아래 명령으로 TypeScript 정적 검사를 완료했습니다.

```bash
pnpm install
pnpm exec tsc --noEmit
```

검사 결과, 최종 상태에서 TypeScript 오류는 발생하지 않았습니다.

## 적용 방법

1. Supabase 프로젝트의 SQL Editor에서 `supabase_schema.sql` 전체를 실행합니다.
2. 프로젝트 루트에서 `pnpm install`을 실행합니다.
3. Expo 앱을 실행합니다.

```bash
pnpm install
pnpm start
```

## 주의 사항

현재 앱은 사용자의 실제 GPS 권한과 Supabase 인증 세션을 필요로 합니다. 실제 데이터가 없는 초기 상태에서는 목록 화면이 비어 보일 수 있으며, 이는 더 이상 샘플 데이터를 표시하지 않도록 변경했기 때문입니다. 사용자 프로필, 반려견, 코스 글, 번개 산책, 산책 기록을 앱에서 직접 생성하면 각 화면에 실제 데이터가 표시됩니다.
