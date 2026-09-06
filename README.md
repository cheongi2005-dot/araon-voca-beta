# 아라온 보카 (Araon Voca)

초·중·고 학생용 영단어 학습 웹앱입니다. 레벨별 단어 학습과 퀴즈, 오답노트,
주간 랭킹, 학부모·관리자 리포트를 제공합니다.

## 실행

```bash
npm install
cp .env.example .env.local   # Firebase 설정값을 채워 넣으세요
npm start                    # 개발 서버 (http://localhost:3000)
npm run build                # 프로덕션 빌드
```

Cloud Functions는 `functions/` 안에서 따로 배포합니다.

```bash
cd functions && npm install
npm run deploy
```

## 디렉터리 구조

```
src/
  config/      앱 전역 상수 — 레벨 정의, 색상, 스토리지 키
  data/        단어·파닉스·FAQ 등 순수 데이터
  services/    Firestore 컬렉션별 공통 규약
  utils/       도메인 로직 — 학습 통계, 오답 관리, 진도 동기화, 저장소 래퍼
  hooks/       상태를 갖는 재사용 로직 — 테마, 음성, 퀴즈, 저장소
  components/  화면 조각
  pages/       라우트 단위 화면
functions/     Cloud Functions (관리자 액션, TTS 프록시, 푸시 알림)
```

### 알아둘 점

- **레벨 정의는 `src/config/levelConfig.js` 한 곳에만 있습니다.** 색상·경로·전체
  Day 수·localStorage 키가 모두 여기서 나옵니다. 레벨을 추가하려면 이 파일만
  고치면 됩니다.
- **학습 기록의 진실의 원천은 Firestore이고 localStorage는 캐시입니다.**
  둘의 병합 규칙은 `src/utils/levelProgress.js`에 모여 있습니다
  (`lastUpdated`가 최신인 쪽이 이기고, 같으면 서버가 이깁니다).
- **`attendance` 배열에는 옛 문자열 형식과 현재 객체 형식이 섞여 있습니다.**
  통계를 낼 때는 반드시 `src/utils/activity.js`를 거치세요. 정규화와 날짜 파싱
  (Firestore Timestamp / `{seconds}` / ISO 문자열)을 여기서 처리합니다.
- **오답노트 기록의 `type`은 `"오답노트 문제풀이"`라 `"문제풀이"`를 부분
  포함합니다.** 두 활동을 나눠 세려면 `isLevelQuiz` / `isMistakeQuiz`를 쓰세요.
- **ElevenLabs API 키는 클라이언트에 두지 않습니다.** `functions/tts.js`가
  프록시하고, 받아온 음성은 IndexedDB에 캐시합니다
  (`src/utils/audioCache.js`).
