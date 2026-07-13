# ESLint-KR 프로젝트 정리

> 저장소: [DoHyuk-Centric/eslint-kr](https://github.com/DoHyuk-Centric/eslint-kr) · 배포: [dohyuk-centric.github.io/eslint-kr](https://dohyuk-centric.github.io/eslint-kr/)
> 기간: 2026.03.23 ~ 2026.04.06 (1차 구축) + 2026.07.10~07.11 (딥링크/CI 보강) · React 19 + TypeScript + Vite + React Router DOM v7, GitHub Pages 배포, MIT 라이선스
> ESLint 공식 문서에 한국어가 없다는 문제의식에서 시작한 커뮤니티 한국어 가이드 사이트 (1인 개발, 오픈소스 기여 구조로 설계)

이 문서는 저장소의 커밋 히스토리, `CODE_REVIEW.md`(AI 코드 리뷰 결과), `docs/2026-07-11-spa-deeplink-404.md`(작업 회고)를 근거로 정리한 작업 기록입니다.

---

## 1. 구현 기능 정리

### 1.1 핵심 기능

| 기능 | 설명 |
|---|---|
| **ESLint v9 Flat Config 기준 한국어 가이드 콘텐츠** | 공식 문서에 없는 한국어 자료를 초급~고급까지 구성. `RulesReference.tsx`(947줄)·`Rules.tsx`(851줄)·`SettingFile.tsx`(462줄) 등 페이지당 콘텐츠 분량이 상당하며, CODE_REVIEW.md에서도 "문서 콘텐츠 품질 9/10"으로 평가된 핵심 가치. |
| **자체 AI 코드 리뷰 프로세스 도입** | 초기 구축 직후(`04-03`) 스스로 Claude Code에 코드 리뷰를 요청해 `CODE_REVIEW.md`(종합 6.7/10, P0~P3 우선순위)로 남기고, 지적된 라우팅 불일치·중복 로직 상당수를 곧바로 반영. |
| **SPA 딥링크 404 문제 해결 + CI 도입** | GitHub Pages 정적 호스팅에서 홈을 제외한 모든 경로가 새로고침·직접 접근 시 404였던 문제를 `spa-github-pages` 패턴으로 해결하고, 재발 방지용 CI·주간 스모크 테스트까지 구축(`07-10`~`07-11`). |

### 1.2 기능/작업 목록 (커밋 기준 시간순 요약)

**1차 구축 — 초기 세팅 & 페이지 (2026-03-23~03-25)**
- Vite + React 환경 구성, ESLint-KR 초기 세팅 (`03-23`)
- 랜딩(index/Main) 페이지, GitHub 이슈 템플릿 3종 추가 (`03-24`)
- ESLint 소개(Intro), 설치 가이드(Install) 페이지 (`03-24`)
- 기초 설정 가이드(Setting) 페이지 (`03-25`)

**기능 확장 (2026-04-02~04-04)**
- 규칙 가이드(Rules), 규칙 레퍼런스(RulesReference) 페이지 추가, 이전/다음 버튼 이동 링크 수정 (`04-02`)
- 설정 파일 완전 정복(SettingFile) 페이지 (`04-02`)
- 파서(Parser) 페이지 (`04-03`)
- 플러그인(Plugin), 배포판(PluginDistribution) 페이지 (`04-04`)

**자체 코드 리뷰 및 반영 (2026-04-03~04-06)**
- Claude Code 코드 리뷰 도입 및 `CODE_REVIEW.md` 작성 (`04-03`)
- 지적사항 반영: 라우트 경로 재설정·라우트 주소 변경(P0), Copy 로직을 `useClipboard` 훅 + `CopyableCodeBlock` 공통 컴포넌트로 추출(P1), 불필요/중복 파일 삭제(P2), README 보강 (`04-06`)
- Prettier 안내 페이지, 파비콘 추가 (`04-05`)

**딥링크/CI 보강 (2026-07-10~07-11, 약 3개월 공백 후 재개)**
- SPA 딥링크 404 수정 — `public/404.html` + `index.html` 복원 스크립트(`spa-github-pages` 패턴) (`07-10`)
- CI 워크플로(`ci.yml`) 및 배포본 주간 감시(`smoke-live.yml`) 신규 구축 (`07-10`)
- 작업 회고 문서화 (`07-11`)

---

## 2. 문제 해결 과정

### 2.1 SPA 딥링크 404 — GitHub Pages 정적 호스팅의 구조적 한계

- **문제 정의**: 배포된 사이트에서 홈(`/`)을 제외한 모든 경로가 새로고침하거나 링크로 직접 접근하면 404가 발생. 문서를 검색·공유 가능하게 만든다는 프로젝트 목적과 정면으로 충돌하는 상태였다. 포트폴리오 점검 과정에서 AI 코드 리뷰(Claude Code)로 지적받고 직접 재현해 확인.
- **원인**: `main.tsx`에서 `BrowserRouter(basename="/eslint-kr/")`를 사용하는데, GitHub Pages는 정적 파일 서버이기 때문에 `/eslint-kr/rules` 같은 경로에 실제 파일이 없으면 404를 반환한다. 클라이언트 라우팅으로 진입한 경우(메뉴 클릭)는 정상 동작했지만, 직접 진입·새로고침·외부 링크 공유 시에는 SPA 폴백이 전혀 없었다.
- **해결책 설계 및 선택**: `rafgraph/spa-github-pages` 패턴을 채택. `public/404.html`이 요청 경로를 쿼리스트링(`/?/rules`)으로 인코딩해 프로젝트 루트로 리다이렉트하고, `index.html`에 라우터 초기화 **전** 실행되는 복원 스크립트를 추가해 `history.replaceState`로 원래 경로를 복구한 뒤 React Router가 렌더링하도록 설계. `base`가 `/eslint-kr/`이므로 유지할 경로 세그먼트(`pathSegmentsToKeep`)는 1로 설정.
- **구현 및 검증**: 리다이렉트→복원 왕복을 쿼리·해시 포함 7개 케이스로 시뮬레이션해 모두 통과 확인, GitHub Pages 서빙을 흉내낸 정적 서버로 홈/딥링크/리다이렉트 착지/에셋까지 엔드투엔드 검증. `scripts/check-spa-fallback.mjs`를 만들어 빌드 산출물에 폴백이 실제로 포함됐는지 CI에서 검증하도록 구축(`404.html`을 지우면 빌드가 실패하는 것까지 확인).
- **남은 한계**: 첫 응답이 HTTP 404 상태이기 때문에, 사람은 즉시 리다이렉트되지만 검색 크롤러에는 여전히 404로 보인다. 검색 노출이 목적인 사이트인 만큼 완전한 해결책은 아니며, Vercel/Netlify 이전(rewrite로 200 매핑) 또는 라우트별 프리렌더링(SSG)을 후속 과제로 명시하고 이번 PR의 범위는 "사람이 링크를 열면 동작한다"까지로 한정.

### 2.2 자체 코드 리뷰 기반 기술 부채 정리

- **문제 정의**: 2주 만에 7개 페이지를 빠르게 구축하면서, 라우트 참조 불일치(`/plugins`, `/Configuration` 등 정의되지 않은 경로), 페이지마다 반복되는 클립보드 복사 로직, 미구현 상태로 남은 검색창(`Search.tsx`) 등이 누적됨.
- **원인**: 기능 단위로 빠르게 커밋하는 과정에서 공통 유틸리티/훅 폴더 없이 페이지별로 로직을 그때그때 작성했고, 링크·라우트를 상수화하지 않아 문자열이 페이지마다 따로 존재했다.
- **해결책 설계 및 선택**: 자체 AI 코드 리뷰(`CODE_REVIEW.md`)로 문제를 P0(즉시)~P3(장기)로 우선순위화. 라우트 불일치는 즉시 수정 대상(P0), 중복 Copy 로직의 훅 추출은 1~2주 내(P1) 대상으로 분류.
- **구현 및 검증**: 라우트 경로 재설정(`04-06`), 반복되던 Copy 로직을 `useClipboard` 커스텀 훅과 `CopyableCodeBlock` 공통 컴포넌트로 추출해 공통 컴포넌트 적용(`04-06`), 기능이 없던 `Search.tsx`는 P1 권고(구현 또는 임시 제거) 중 제거를 선택해 정리, `@types/react-router-dom`처럼 v7부터 자체 타입을 내장해 불필요해진 의존성도 제거.

---

## 3. 품질/자동화 검증 관련 내용

이 프로젝트는 문서 콘텐츠 사이트라 별도의 성능(LCP 등) 측정 대상은 크지 않지만, 코드 품질과 배포 신뢰성을 수치·자동화로 관리한 기록이 남아있다.

### 3.1 자체 AI 코드 리뷰 점수 (2026-04-03 기준)

| 항목 | 점수 |
|---|---|
| 코드 구조 | 7 / 10 |
| TypeScript 타입 안전성 | 7 / 10 |
| 컴포넌트 재사용성 | 5 / 10 |
| 접근성(a11y) | 4 / 10 |
| 문서 콘텐츠 품질 | 9 / 10 |
| 완성도 | 6 / 10 |
| CSS/반응형 | 7 / 10 |
| 빌드 환경 | 7 / 10 |
| GitHub 기여 환경 | 8 / 10 |
| **종합** | **6.7 / 10** |

→ 지적된 P0(라우트 미등록)·P1(중복 Copy 로직, 미구현 검색창, 불필요 의존성) 항목은 `04-06`까지 대부분 반영(§2.2).

### 3.2 CI/배포 검증 자동화 (2026-07-10 도입)

- 이전까지 `.github`에는 이슈 템플릿만 있고 워크플로가 전혀 없었다 — ESLint 홍보 사이트인데 CI에서 ESLint조차 돌리지 않는 상태였음.
- **`ci.yml`**: PR·푸시마다 `lint` → `tsc -b && vite build` → `scripts/check-spa-fallback.mjs`(빌드 산출물에 SPA 폴백이 실제로 포함됐는지 검증) 순서로 실행. 폴백이 빠지면 빌드 자체가 실패하도록 구성.
- **`smoke-live.yml`**: 배포가 `gh-pages` 수동 배포라 PR 시점에는 실제 배포본을 확인할 수 없다는 한계를 인지하고, 매주 월요일 자동 실행 + 수동 실행(`workflow_dispatch`) 두 경로로 배포된 사이트의 딥링크 상태를 주기적으로 감시하도록 별도 스크립트(`scripts/smoke-live.mjs`) 작성.

---

## 4. 아키텍처 구조

### 4.1 전체 구조 요약

```
[GitHub Pages (정적 호스팅)]
   │
   ├─ /                    → index.html (200, React Router 렌더)
   └─ /rules, /intro 등    → 파일 없음 → 404.html 반환
        │
        └─ 404.html: 요청 경로를 "/?/rules" 형태로 인코딩해 루트로 리다이렉트
             │
             └─ index.html 복원 스크립트: history.replaceState로 원래 경로 복구
                  │
                  └─ React Router(BrowserRouter, basename="/eslint-kr/")가 해당 페이지 렌더
```

### 4.2 폴더 구조

```
eslint-kr/
├─ src/
│  ├─ main.tsx, App.tsx        # 진입점 / 라우팅 정의(React Router v7)
│  ├─ components/
│  │  ├─ Layout/Header/Footer/Aside/Navigation/Main/Logo
│  │  └─ ui/CodeBlock.tsx, CopyableCodeBlock.tsx  # 패키지 매니저 탭 코드 블록 + 복사 공통화
│  ├─ pages/                   # Intro/Install/Setting/Rules/RulesReference/
│  │                             SettingFile/Parser/Plugin/PluginDistribution/Prettier
│  └─ css/components.css
├─ public/404.html             # SPA 딥링크 리다이렉트
├─ scripts/
│  ├─ check-spa-fallback.mjs   # CI — 빌드 산출물의 SPA 폴백 검증
│  └─ smoke-live.mjs           # 배포본 딥링크 주간 감시
├─ .github/
│  ├─ ISSUE_TEMPLATE/          # bug_report / feature_request / docs_translation
│  └─ workflows/ci.yml, smoke-live.yml
└─ CODE_REVIEW.md              # 자체 AI 코드 리뷰 결과 및 P0~P3 개선 항목
```

### 4.3 콘텐츠 구조의 한계 (자체 진단)

- 문서 콘텐츠가 `RulesReference.tsx`(947줄) 등 TSX 파일에 하드코딩되어 있다. `docs_translation` 이슈 템플릿으로 번역 기여를 받겠다는 프로젝트 목표와 충돌 — 기여자가 번역하려면 TSX 코드를 직접 수정해야 하는 구조.
- 회고 문서에서 콘텐츠를 MDX/마크다운으로 분리하면 기여 장벽이 낮아지고, 이 분리가 §2.1의 SEO 한계를 해결할 SSG(라우트별 프리렌더링) 경로와도 자연스럽게 연결된다고 스스로 진단해 후속 과제로 남김.

### 4.4 브랜치 전략 / 기여 흐름

```
main     ── GitHub Pages 배포 브랜치 (직접 커밋 금지)
develop  ── 개발 기본 브랜치, 모든 PR의 병합 대상
docs/*   ── 문서 작성/번역
fix/*    ── 버그 수정
feat/*   ── 신규 기능
```

- 커밋 컨벤션 `type: 내용`(`docs`/`fix`/`feat`/`style`/`refactor`), `develop → main` 머지 시 GitHub Actions가 GitHub Pages에 자동 배포.
- 누구나 기여할 수 있는 구조로 설계 — Fork → `develop` 기반 브랜치 생성 → PR(대상: `develop`) 흐름과, 용도별 이슈 템플릿 3종(버그/기능 제안/번역)을 미리 구성해 둠.

---

## 5. 기타 — 미해결 사항 / 향후 계획

- **SEO 미해결**: SPA 딥링크는 사람이 열면 정상 동작하지만 첫 HTTP 응답이 404 상태라 검색 크롤러에는 여전히 404로 인식됨. "한국어로 검색해서 찾아오는" 것이 이 사이트의 존재 이유인 만큼, Vercel/Netlify 이전(rewrite로 200 매핑) 또는 라우트별 프리렌더링(SSG) 중 하나가 필요하다고 명시했지만 아직 미착수.
- **콘텐츠 하드코딩**: TSX에 박혀 있는 문서 콘텐츠를 MDX/마크다운으로 분리하는 작업이 남아있음 — 번역 기여 장벽 해소와 SEO 해결(SSG)을 동시에 달성할 수 있는 지점으로 스스로 진단했으나 아직 미착수.
- **CODE_REVIEW.md의 P2~P3 항목 중 미확인 항목**: 다크 모드 지원, Contributing 페이지 작성, 단위 테스트 추가, SEO meta 태그, `@` alias 경로 설정 등은 리뷰 시점(`04-03`) 기준 장기 과제로 분류된 채 이후 커밋에서 별도로 다뤄진 흔적이 없어 미해결로 남아있음.
- **오픈소스 기여 구조**: 현재는 1인 개발 상태지만, 브랜치 전략·이슈 템플릿·기여 가이드까지 커뮤니티 참여를 전제로 설계해 둔 상태 — ESLint 공식 문서의 한국어 부재라는 문제의식을 계속 확장할 수 있는 구조.
