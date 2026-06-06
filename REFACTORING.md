# Pet App 리팩토링 결과

원본 `App.tsx` (1767줄)를 기능 단위로 분리했습니다. **동작은 100% 동일**합니다 — 로직/스타일/JSX를 한 줄도 수정하지 않고, 위치만 옮기고 `import/export`만 추가했습니다.

## 적용 방법

본인 GitHub 레포 루트에 이 폴더의 내용을 그대로 복사(덮어쓰기)하세요. `package.json`, `app.json`, `supabase.ts`, `assets/`는 원본과 동일하므로 덮어써도 됩니다.

```
App.tsx                    # 진입점만 남김 (세션 분기 + 모달 + RootTabs)
supabase.ts                # 그대로
src/
├── constants/breeds.ts                       # AKC_BREEDS
├── styles/styles.ts                          # 공용 StyleSheet + width
├── components/
│   ├── DefaultUserAvatar.tsx
│   ├── DefaultDogAvatar.tsx
│   ├── FirstVisitUserProfileModal.tsx
│   └── WeatherWidget.tsx
├── screens/
│   ├── AuthScreen.tsx
│   ├── placeholders.tsx                      # Calendar/Feed/Shop/Message
│   ├── ProfileScreen.tsx
│   └── MapScreen.tsx
└── navigation/RootTabs.tsx                   # Tab.Navigator 설정
```

## 보장 사항

- 컴포넌트 이름·상태·이펙트·Supabase 호출 동일
- StyleSheet 키/값 동일 (단일 모듈로 이전)
- 탭 순서·아이콘·옵션 동일
- 의존성 변경 없음 (`package.json` 그대로)
