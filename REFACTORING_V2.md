# Refactoring V2 — 책임 분리 & 중복 제거 (2차)

본 디렉토리는 사용자 요청 계획(A~E)을 그대로 적용한 결과입니다.
**기능·UI·Supabase 호출·네비게이션은 원본과 100% 동일하게 유지**했고,
파일 분리·훅 추출·중복 제거·React.memo 만 적용했습니다.

## 핵심 결과

| 항목 | Before | After |
|---|---|---|
| `ProfileScreen.tsx` | 758줄 | **약 230줄 (조립 전용)** |
| `useState` 직접 선언 수 | 25+ | 6 |
| 견종 검색 UI 중복 | 이미 1개로 통합됨(BreedSearchInline) | 유지 |
| 반려견 폼 상태 (`dogName/editDogName ...`) | 평행 2벌 | **`useDogForm()` 단일화 (인스턴스 2개)** |
| 반려견 폼 JSX | 등록/수정 2벌 중복 | **`DogFormFields` 1벌** |
| 스타일 | 단일 158줄 객체 | **네임스페이스 4개로 분할 + 토큰 + 원본 호환 유지** |

## 디렉토리 추가/변경

```
src/
  hooks/
    useDogs.ts                  ⬅ NEW  (fetch / insert / update + validation)
    useUserProfile.ts           ⬅ NEW  (nickname/gender + edit 로드/저장)
    useAlbums.ts                ⬅ NEW  (CRUD + 선택모드 + 상세 캡슐화)
    useDogForm.ts               ⬅ NEW  (등록/수정 폼 상태 단일화)
    useImagePicker.ts           (기존 유지)
  styles/
    styles.ts                   (원본 유지 — 기존 import 호환)
    tokens.ts                   ⬅ NEW  (color / shadow 토큰)
    auth.styles.ts              ⬅ NEW
    map.styles.ts               ⬅ NEW
    profile.styles.ts           ⬅ NEW
    modal.styles.ts             ⬅ NEW
    index.ts                    ⬅ NEW  (네임스페이스 진입점)
  screens/
    ProfileScreen.tsx           (758 → ~230줄, 조립만)
    profile/
      UserProfileHeader.tsx     ⬅ NEW (React.memo)
      DogList.tsx               ⬅ NEW (React.memo)
      AlbumGrid.tsx             ⬅ NEW (React.memo)
      modals/
        ModalHeader.tsx         ⬅ NEW (취소/제목/저장 공용)
        DogFormFields.tsx       ⬅ NEW (등록/수정 폼 JSX 공용)
        DogRegisterModal.tsx    ⬅ NEW
        DogEditModal.tsx        ⬅ NEW
        UserProfileEditModal.tsx ⬅ NEW
        AlbumAddModal.tsx       ⬅ NEW
        AlbumDetailModal.tsx    ⬅ NEW
        BreedSearchInline.tsx   (기존 유지)
        FriendListModal.tsx     (기존 유지)
        GroupListModal.tsx      (기존 유지)
```

## A. ProfileScreen 책임 분리

`ProfileScreen` 은 이제 **상태 오케스트레이션 + 조립**만 담당합니다.
실제 렌더링은 `UserProfileHeader / DogList / AlbumGrid` 와
각 모달 컴포넌트에 위임했습니다.

리스트형 컴포넌트(`DogList`, `AlbumGrid`, `UserProfileHeader`)는
`React.memo` 로 감싸 부모 재렌더 시 불필요한 재렌더를 차단합니다.

## B. 공용 훅 추출

| 훅 | 책임 |
|---|---|
| `useDogs` | Supabase `dogs` 테이블 fetch/insert/update + 입력 검증 (메시지/타이밍 원본 동일) |
| `useUserProfile` | `supabase.auth` user_metadata 로드/저장 + 닉네임/성별 노출 |
| `useAlbums` | 앨범 배열 / 선택모드 / 삭제확인 Alert / 메모 수정 (모두 원본 메시지 유지) |
| `useDogForm` | 등록·수정 공용 폼 상태 (`patch`, `reset`, `hydrateFromDog`) |

## C. 스타일 분할 (원본 100% 호환)

- 기존 `styles.ts` 는 **그대로 유지** → 모든 기존 import 호환.
- 추가로 `auth.styles.ts / map.styles.ts / profile.styles.ts / modal.styles.ts`
  네임스페이스를 만들어, 신규 컴포넌트는 본인 영역만 import 할 수 있습니다.
- `tokens.ts` 에 색상/그림자 상수를 분리해 향후 디자인 토큰화의 발판을 마련했습니다.

> 본 단계에서는 “디자인 토큰화/타입 강화”는 보장 범위 외 항목이므로 진행하지 않았습니다.

## D. 중복 제거

- 견종 검색 모달: 이미 1차에서 `BreedSearchInline` 으로 통합되어 있어 그대로 사용.
- **반려견 폼 상태**: `dogName/editDogName ...` 평행 2벌 → `useDogForm()` 인스턴스 2개로 단일화.
- **반려견 폼 JSX**: 등록/수정에서 100여 줄씩 중복되던 입력 폼 → `DogFormFields` 한 벌.
- **모달 헤더**: 7개 모달에서 반복되던 헤더(취소/제목/저장) → `ModalHeader` 공용 컴포넌트.

## E. 작은 성능 개선

- `UserProfileHeader / DogList / AlbumGrid` → `React.memo`.
- 핸들러 → `useCallback`(의존성 정확히 명시).
- 모달 컴포넌트가 분리되어, 한 모달의 상태 변경이 다른 모달 트리 재렌더에 영향을 덜 줍니다.

## 동작 보장 (행위 동등성)

다음 항목은 원본과 1:1 동일하게 유지되었습니다:

- 모든 `Alert.alert(...)` 메시지/타이틀
- 입력 검증 규칙(필수값/`YYYY-MM-DD` 정규식/`parseFloat` 체크)
- Supabase 호출 시그니처 (`from('dogs').insert/.update/.select.eq.order`)
- `auth.updateUser({ data: { ...user.user_metadata, ... } })` payload 키 전체
- `encodeTendency` / `decodeTendency` 로 `[Avatar:URI]` 임베드 유지
- 등록 모달 저장 성공 후 입력값만 초기화하고 `gender` 는 유지하는 원본 동작
- 앨범 추가 시 날짜 포맷 `YYYY.MM.DD`, 기본 메모 `오늘의 소중한 산책 기록 🐾`
- 삭제 확인 다이얼로그/메모 저장 알림 문구
- 로그아웃 동작 (`supabase.auth.signOut()`)
- 네비게이션/화면 구성/스타일 시각 결과
