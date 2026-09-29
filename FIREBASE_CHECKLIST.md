# 로그인·동기화·Firebase 저장 점검 체크리스트

점검일: 2026-09-29. 위에서부터 우선순위 순. ✅ = 코드 수정 완료(배포 전), ⏸ = 보류.

## 🔴 심각 (데이터 유실·개인정보)

- [x] **1. 레벨 퀴즈 진도·오답이 Firebase에 안 올라감** — `LevelTemplate.js` recordActivity가 `setDoc(merge)`에 `"levelProgress.키.Day"`, `"stats.weeklyWords"` 같은 점 표기 키를 넘김. setDoc은 점을 경로로 해석하지 않아 이름에 점이 든 최상위 필드가 생김(2026-06-09 c6707f3부터).
  → `updateDoc`으로 교체, 레벨 전체(`levelProgress.키`)를 업로드.
- [x] **1-1. 동기화 병합이 "최신이 통째로 이김"** — 1번을 고치면 먼저 업로드한 기기가 다른 기기의 로컬 오답을 덮어씀.
  → `utils/progress.js` `mergeLevelData`(Day 단위 합집합)로 Home/LevelHome/LevelTemplate/MyVoca 병합 통일. 테스트: `src/utils/progress.test.js`.
- [x] **2. 회원 탈퇴가 실패하고 조용히 끝남** — rules상 users 삭제는 관리자만 가능한데 클라이언트가 `deleteDoc` 호출.
  → Cloud Function `deleteMyAccount`(문서·랭킹·문의·Auth 삭제), 실패 시 안내창.
- [x] **3. 다른 계정이 로그인해도 이전 계정의 로컬 진도·오답·설정이 남음** (공용 기기)
  → `UserDataContext`에서 로컬 데이터 주인(`araon_local_owner`)이 바뀌면 계정별 키 삭제.
- [x] **4. 푸시 토큰이 여러 계정에 중복 저장** — 이전 학생 알림이 다음 학생 기기로 감.
  → 로그아웃 시 `fcmToken` 삭제 + 서버 트리거 `dedupeFcmToken`(같은 토큰은 마지막 등록 계정에만).

## 🟠 누락·버그

- [x] **5. 오답노트 "졸업"이 로컬에만 저장** → lastUpdated 갱신 + `levelProgress.키` 업로드.
- [x] **6. 퀴즈 종료 시 서버로 오래된 dayHistory를 보냄** → `useStorage.saveProgress`가 저장 결과를 바로 반환, 그 값을 화면·서버에 사용.
- [x] **7. 학부모(커스텀 토큰) 세션에서 `doc(db, "users", null)` 예외** → email 없으면 구독·토큰 갱신 안 함.
- [x] **8. 사용자 문서가 없을 때 이전 사용자 캐시가 계속 보임** → userData 초기화, 캐시는 같은 계정일 때만 사용.

## 🟡 보안·정책

- [x] **9. 학부모 로그인이 전화번호만으로 가능** → 학생 이름 + 전화번호 확인(형제가 같은 번호여도 구분).
  ※ 남은 과제: 문자 인증 또는 시도 횟수 제한 (이름+번호를 아는 사람은 여전히 열람 가능).
- [x] **10. 학생 삭제 시 랭킹 기록이 남음** → 관리자 삭제·본인 탈퇴 모두 `deleteStudentData`로 users·leaderboard·본인 문의 삭제.
- [x] **11. 파닉스 진도·학습 기록 미저장** → 스테이지 완료 시 로컬 진도 + levelProgress + attendance(`문제풀이`, Day = 스테이지 번호) 기록.
- [ ] ⏸ **12. attendance 배열 무한 증가** (문서 1MB 한도) → 보류. 학생당 수천 건 이후 문제라 지금은 모니터링만.

## 정리

- [x] 안 쓰는 코드 삭제: `saveLevelProgress`(firebase-helper), `syncFromDB`(useStorage)
- [x] 기존 문서에 쌓인 점 이름 필드 정리 + Day 기록 복구 → 관리자 페이지 "필드 정리" 버튼(`migrateDottedFields`)

## 배포 순서

1. [x] `firebase deploy --only functions` — 2026-09-29 완료 (함수 14개, 신규: deleteMyAccount·dedupeFcmToken·migrateDottedFields)
2. [x] `npm run deploy` (호스팅) — 2026-09-29 완료, vocaraon.web.app에서 새 번들 확인
3. [x] 관리자 페이지 → "필드 정리" 1회 실행 — 2026-09-29 11:06, 37명 정리. 함수·트리거 로그 에러 없음
4. 확인: 두 기기에서 같은 계정으로 퀴즈 → 오답이 양쪽에 보이는지 / 공용 기기에서 계정 바꿔 로그인 → 이전 학생 오답이 안 보이는지 / 탈퇴 → 랭킹에서 사라지는지
