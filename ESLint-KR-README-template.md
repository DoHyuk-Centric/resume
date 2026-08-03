# ESLint 한국어 가이드

> 영어로 제공되는 ESLint 공식 문서를 한국 개발자가 쉽게 이해하고 적용할 수 있도록 재구성한 한국어 가이드입니다.  
> ESLint v9 Flat Config를 기준으로 개념, 설정, Rules, Parser, Plugin과 Prettier 연동을 실제 코드 예제와 함께 설명합니다.

[![Guide](https://img.shields.io/badge/Guide-ESLint--KR-4B32C3?style=flat-square&logo=eslint)](https://dohyuk-centric.github.io/eslint-kr/)
[![GitHub](https://img.shields.io/badge/GitHub-DoHyuk--Centric%2Feslint--kr-181717?style=flat-square&logo=github)](https://github.com/DoHyuk-Centric/eslint-kr)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](./LICENSE)

## 요약

| 구분 | 내용 |
| --- | --- |
| 개요 | ESLint의 개념부터 설정·Rules·Parser·Plugin까지 설명하는 한국어 가이드 |
| 개발 기간 | 2026.03.23 ~ 2026.04.06 |
| 개발 형태 | 개인 오픈소스 문서 프로젝트 (문서 기획, 콘텐츠 작성, UI 구현, 기여 환경과 배포 구성) |
| 문서 기준 | ESLint v9, Flat Config |
| 기술 구조 | React 19, TypeScript, Vite, React Router DOM, React Compiler |
| 핵심 경험 | 문서 탐색 구조 설계, 코드 예제 재사용, GitHub 기여 환경 구성 |
| 문제 해결 | GitHub Pages의 SPA 딥링크 404 복구와 재발 방지 자동화 |
| 검증 | PR·Push CI, 빌드 산출물 검사, 배포본 주간 Smoke Test |
| 배포 | GitHub Pages, https://dohyuk-centric.github.io/eslint-kr/ |

<br />

## 목차

1. [개요](#개요)
2. [기술 선택과 사용 맥락](#기술-선택과-사용-맥락)
3. [문서 구성](#문서-구성)
4. [구현 구조](#구현-구조)
5. [핵심 경험](#핵심-경험)
   - [ESLint v9 중심의 학습 흐름](#eslint-v9-중심의-학습-흐름)
   - [재사용 가능한 코드 예제](#재사용-가능한-코드-예제)
   - [오픈소스 기여 환경](#오픈소스-기여-환경)
6. [트러블슈팅](#트러블슈팅)
7. [검증 자동화](#검증-자동화)
8. [기여 방법](#기여-방법)
9. [회고](#회고)
10. [Self QnA](#self-qna)
11. [관련 링크](#관련-링크)

<br />

## 개요

ESLint 공식 문서는 영어를 중심으로 제공됩니다. 설정 파일, Parser, Plugin과 개별 Rule의 설명에는 생소한 용어가 많아 ESLint를 처음 사용하는 개발자가 실제 프로젝트 설정까지 연결하기 어렵다고 판단했습니다.

ESLint-KR은 공식 문장을 그대로 번역하는 데 그치지 않고 다음 기준으로 내용을 재구성했습니다.

- ESLint를 처음 접하는 개발자도 순서대로 읽을 수 있는 학습 흐름
- ESLint v9 Flat Config 기준의 설정 예제
- 잘못된 코드와 수정된 코드를 함께 보여주는 Rule 설명
- npm, yarn, pnpm, bun 환경에서 바로 사용할 수 있는 명령어
- Parser, Plugin, Prettier처럼 함께 이해해야 하는 도구의 관계 설명
- 전체 규칙을 빠르게 찾을 수 있는 Rules Reference 제공

사이트의 문서와 코드는 공개되어 있으며 오탈자, 설명 보완, 새 문서 제안을 Issue와 Pull Request로 받을 수 있도록 구성했습니다.

<br />

## 기술 선택과 사용 맥락

### React와 TypeScript

문서 페이지 사이에서 Layout, Navigation, 코드 블록과 복사 UI를 재사용하고 문서별 탐색 흐름을 구성하기 위해 React를 사용했습니다.

TypeScript의 엄격한 설정을 적용해 컴포넌트 Props와 코드 예제 UI의 데이터 구조를 명시했습니다. 다만 문서 내용이 TSX 안에 직접 작성돼 있어 개발 환경에 익숙하지 않은 문서 기여자의 진입 장벽이 높다는 한계가 있습니다.

### Vite와 React Compiler

정적 문서 사이트를 빠르게 빌드하고 GitHub Pages에 배포하기 위해 Vite를 사용했습니다. 저장소의 하위 경로에서 에셋과 라우터가 동작하도록 `base`를 `/eslint-kr/`로 설정했습니다.

React Compiler는 Vite 플러그인에 연결해 사용하고 있습니다. 수동 메모이제이션을 반복하기보다 컴파일 단계에서 렌더링 최적화를 적용할 수 있지만, 문서 사이트 규모에서는 빌드 복잡도와 실제 효과를 별도로 측정할 필요가 있습니다.

### React Router DOM

공통 Layout 안에서 문서별 URL을 제공하고 이전·다음 문서 탐색을 연결하기 위해 React Router DOM을 사용했습니다.

```text
/intro               ESLint 소개
/install             설치
/setting             첫 설정
/rules               주요 Rules
/rulesReference      전체 Rules Reference
/settingFile         설정 파일
/parser              Parser
/plugin              Plugin
/PluginDistribution  Plugin 배포
/prettier             Prettier 연동
```

GitHub Pages는 SPA의 동적 경로를 직접 알지 못하므로 새로고침과 직접 접근을 위한 별도 폴백 처리가 필요했습니다.

### GitHub Pages

오픈소스 저장소와 문서 사이트를 같은 GitHub 환경에서 관리하고 정적 결과물을 공개하기 위해 GitHub Pages를 사용했습니다.

별도 서버 비용 없이 배포할 수 있다는 장점이 있지만 서버 Rewrite를 설정할 수 없어 SPA 딥링크의 첫 응답이 404가 되는 한계가 있습니다.

<br />

## 문서 구성

| 문서 | 설명 |
| --- | --- |
| ESLint란? | ESLint의 역할, 사용 이유, Prettier와의 차이 |
| 설치하기 | 패키지 매니저별 설치와 VS Code 연동 |
| 첫 설정 | `eslint.config.*`를 이용한 기본 설정 |
| Rules | 실무에서 자주 사용하는 규칙을 주제별로 설명 |
| Rules Reference | 규칙 목록과 Recommended·Fixable 정보 |
| 설정 파일 | Flat Config와 Legacy Config 비교 |
| Parser | AST와 커스텀 Parser의 역할 |
| Plugin | Plugin의 구조와 사용 방법 |
| Plugin 배포 | 직접 만든 Plugin의 배포 흐름 |
| Prettier | ESLint와 Prettier의 역할 분리와 연동 |

문서는 개념 설명, 코드 예제, 관련 문서 이동 순서로 구성해 한 페이지를 읽은 뒤 다음 학습 주제로 이어질 수 있도록 설계했습니다.

<br />

## 구현 구조

```text
eslint-kr/
├─ src/
│  ├─ App.tsx                         # 문서 라우팅
│  ├─ components/
│  │  ├─ Layout.tsx                  # 공통 문서 Layout
│  │  ├─ Header.tsx                  # Header
│  │  ├─ Aside.tsx                   # 문서 사이드바
│  │  ├─ Navigation.tsx              # 상단 Navigation
│  │  └─ ui/
│  │     ├─ CodeBlock.tsx            # 패키지 매니저별 코드 탭
│  │     └─ CopyableCodeBlock.tsx    # 복사 가능한 코드 예제
│  └─ pages/
│     ├─ hooks/useClipboard.ts       # 클립보드와 Toast 상태
│     ├─ Intro.tsx
│     ├─ Install.tsx
│     ├─ Setting.tsx
│     ├─ Rules.tsx
│     ├─ RulesReference.tsx
│     ├─ SettingFile.tsx
│     ├─ Parser.tsx
│     ├─ Plugin.tsx
│     ├─ PluginDistribution.tsx
│     └─ Prettier.tsx
├─ public/404.html                    # GitHub Pages 딥링크 리다이렉트
├─ scripts/
│  ├─ check-spa-fallback.mjs          # 빌드 산출물의 폴백 검사
│  └─ smoke-live.mjs                  # 실제 배포본 딥링크 검사
├─ docs/                              # 문제 해결 기록
└─ .github/
   ├─ ISSUE_TEMPLATE/                 # Bug·기능·문서 기여 템플릿
   └─ workflows/                      # CI와 배포본 Smoke Test
```

<br />

## 핵심 경험

### ESLint v9 중심의 학습 흐름

단순한 Rule 목록보다 ESLint를 처음 접한 개발자가 설정 파일을 작성할 수 있게 되는 순서를 우선했습니다.

```text
ESLint의 역할 이해
  → 설치와 Editor 연동
  → Flat Config 작성
  → 주요 Rule 적용
  → 전체 Rule 탐색
  → Parser와 Plugin 이해
  → Prettier와 책임 분리
```

모든 설정 예시는 ESLint v9 Flat Config를 기준으로 작성했습니다. Legacy Config는 기존 프로젝트를 이해하기 위한 비교 대상으로 설명하고, 신규 설정은 Flat Config를 우선하도록 구성했습니다.

### 재사용 가능한 코드 예제

초기에는 여러 문서 페이지에서 클립보드 복사 로직과 알림 처리가 반복됐습니다. 이를 `useClipboard` 훅과 `CopyableCodeBlock` 컴포넌트로 분리했습니다.

```text
Copy 버튼 선택
  → useClipboard.copy(code)
  → Clipboard API 호출
  → 성공·실패 메시지 갱신
  → 일정 시간 뒤 Toast 제거
```

패키지 설치 명령은 `CodeBlock`에서 npm, yarn, pnpm, bun 탭으로 제공해 사용자가 자신의 환경에 맞는 명령어를 바로 확인할 수 있도록 했습니다.

- [공통 코드 블록 리팩터링 커밋](https://github.com/DoHyuk-Centric/eslint-kr/commit/8fa0d2d)

### 오픈소스 기여 환경

문서 프로젝트는 코드 기능뿐 아니라 어떤 내용을 어떻게 제안해야 하는지가 명확해야 한다고 판단했습니다.

- Bug Report: 재현 경로와 기대 동작을 포함한 오류 제보
- Feature Request: 현재 불편과 제안 해결책 분리
- Docs Translation: 대상 문서와 작업 범위를 명시한 문서 기여
- Blank Issue 비활성화로 필요한 정보 누락 방지
- `develop`을 병합 대상으로 사용하는 작업 브랜치 규칙 제공

문서와 기능 변경은 Pull Request에서 Lint, TypeScript Build와 SPA 폴백 검사를 통과해야 합니다.

<br />

## 트러블슈팅

### GitHub Pages에서 SPA 딥링크가 404가 되는 문제

**문제**  
홈에서 메뉴를 통해 이동하면 정상적으로 문서를 볼 수 있었지만, `/rules`, `/intro` 같은 문서 URL을 직접 열거나 새로고침하면 GitHub Pages가 404를 반환했습니다.

```text
/eslint-kr/        → 200
/eslint-kr/rules   → 404
/eslint-kr/intro   → 404
```

문서 링크 공유와 검색 유입이 중요한 프로젝트에서 홈을 거치지 않으면 문서를 볼 수 없는 상태였습니다.

**원인**  
React Router의 `BrowserRouter`는 브라우저에서 경로를 처리하지만, GitHub Pages는 요청된 경로에 실제 파일이 없으면 404를 반환하는 정적 파일 서버입니다. 서버 Rewrite를 설정할 수 없어 모든 경로를 `index.html`로 전달하지 못했습니다.

**해결**  
GitHub Pages의 `404.html`을 이용해 요청 경로를 임시 쿼리로 인코딩하고, `index.html`에서 React Router가 실행되기 전에 원래 경로로 복원했습니다.

```text
/eslint-kr/rules 직접 접근
  → GitHub Pages가 404.html 반환
  → /eslint-kr/?/rules로 리다이렉트
  → index.html 응답
  → history.replaceState로 /eslint-kr/rules 복원
  → React Router가 해당 문서 렌더링
```

프로젝트가 GitHub Pages의 하위 경로에 있으므로 유지해야 하는 경로 세그먼트를 1로 설정했습니다. 경로 복원 스크립트는 React 진입 모듈보다 먼저 실행되도록 `index.html` 상단에 배치했습니다.

**검증**

- 일반 경로, Query String, Hash를 포함한 7개 경로 왕복 검증
- GitHub Pages 동작을 모방한 정적 서버에서 404 리다이렉트와 200 착지 확인
- 배포본의 홈과 각 문서 경로를 주기적으로 Smoke Test

**남은 한계**  
브라우저 사용자는 최종 문서를 볼 수 있지만 최초 HTTP 상태는 여전히 404입니다. 검색 크롤러에는 존재하지 않는 페이지로 인식될 수 있어 SEO 문제의 완전한 해결은 아닙니다.

완전한 해결을 위해서는 Rewrite를 제공하는 배포 환경으로 이전하거나 문서 경로별 정적 HTML을 생성하는 SSG 구조가 필요합니다.

- [문제 해결 문서](./docs/2026-07-11-spa-deeplink-404.md)
- [관련 PR #28](https://github.com/DoHyuk-Centric/eslint-kr/pull/28)

<br />

## 검증 자동화

### CI

Push와 Pull Request에서 다음 작업을 순서대로 실행합니다.

```text
npm ci
  → ESLint
  → TypeScript type check
  → Vite build
  → SPA 폴백 산출물 검사
```

`check-spa-fallback.mjs`는 빌드된 `dist/404.html`의 리다이렉트 코드와 `dist/index.html`의 경로 복원 코드가 존재하는지 확인합니다. 폴백 파일이나 스크립트가 누락되면 CI를 실패시킵니다.

### 배포본 Smoke Test

GitHub Pages 배포는 CI와 별도의 시점에 이루어지므로 빌드 결과 검사만으로 실제 배포 상태를 보장할 수 없습니다.

`smoke-live.mjs`는 실제 배포된 사이트에서 다음 항목을 확인합니다.

- 홈 경로가 200을 반환하는지
- 문서 딥링크가 200 또는 리다이렉트 스크립트를 포함한 404를 반환하는지
- Intro, Install, Rules, Parser, Plugin, Prettier 경로의 폴백이 유지되는지

Smoke Test는 매주 월요일에 실행되며 필요할 때 수동으로도 실행할 수 있습니다.

<br />

## 기여 방법

이 프로젝트는 문서 보완, 오탈자 수정, 예제 개선과 새 주제 제안을 받을 수 있도록 공개되어 있습니다.

```text
Issue 또는 작업 주제 선택
  → develop 기준 작업 브랜치 생성
  → 문서·코드 변경
  → Lint와 Build 확인
  → develop 대상으로 Pull Request 작성
  → CI 통과 후 검토·병합
```

브랜치 이름은 작업 목적에 따라 구분합니다.

| 형식 | 용도 |
| --- | --- |
| `docs/*` | 문서 작성과 번역 |
| `fix/*` | 오류와 잘못된 설명 수정 |
| `feat/*` | 신규 페이지와 기능 추가 |

<br />

## 회고

### 잘한 점

- ESLint의 개념부터 Plugin과 Prettier까지 이어지는 한국어 학습 흐름을 구성했습니다.
- ESLint v9 Flat Config를 기준으로 예제와 설명의 방향을 통일했습니다.
- 반복되던 코드 복사 로직을 훅과 공통 컴포넌트로 분리했습니다.
- 문서 기여 목적에 맞는 Issue Template과 브랜치·PR 흐름을 마련했습니다.
- 딥링크 문제를 수정하는 데 그치지 않고 빌드 산출물 검사와 배포본 Smoke Test로 재발을 감시했습니다.
- 우회 방식이 최초 404 상태와 SEO 문제를 해결하지 못한다는 한계까지 문서화했습니다.

### 아쉬운 점과 다음 개선

- 문서 콘텐츠가 큰 TSX 파일에 직접 작성돼 있어 비개발자의 문서 기여가 어렵습니다.
- `RulesReference.tsx`처럼 한 파일이 지나치게 커져 문서 수정과 리뷰 범위가 넓습니다.
- 자동 단위 테스트가 없고 현재 검증은 Lint, Build, SPA 폴백에 집중돼 있습니다.
- GitHub Pages 폴백은 사용자 접근만 복구하며 검색 엔진의 404 인식은 해결하지 못합니다.
- 라우트 이름에 camelCase와 PascalCase가 섞여 URL 컨벤션이 일관되지 않습니다.
- 기존 `CODE_REVIEW.md`는 이후 해결된 항목이 반영되지 않아 현재 코드 기준으로 갱신이 필요합니다.
- 문서 검색 기능이 없어 문서 수가 늘어날수록 원하는 규칙을 찾기 어려울 수 있습니다.

다음 단계에서는 콘텐츠를 Markdown 또는 MDX로 분리하고, 문서별 정적 경로를 생성하는 구조를 검토할 수 있습니다. 이는 기여 장벽과 SEO 문제를 함께 줄일 수 있는 방향입니다.

<br />

## Self QnA

### Q1. 공식 문서를 그대로 번역하지 않고 내용을 재구성한 이유는 무엇인가요?

- 답변 근거: 초급자가 개념, 설치, 설정, Rule을 순서대로 연결할 수 있는 학습 흐름이 필요했음
- 문서 근거: Intro, Install, Setting, Rules, RulesReference 페이지
- 함께 설명할 기준: 공식 용어와 코드 동작은 유지하되 설명과 예시는 한국어 학습 맥락에 맞게 구성

### Q2. GitHub Pages 딥링크 문제를 왜 404.html 방식으로 해결했나요?

- 답변 근거: GitHub Pages에서는 서버 Rewrite를 설정할 수 없음
- 구현 근거: `public/404.html`, `index.html`, `scripts/check-spa-fallback.mjs`
- 반드시 설명할 한계: 사용자 접근은 복구하지만 첫 응답이 404라 SEO는 해결되지 않음

### Q3. 문서 프로젝트에 CI와 Smoke Test가 필요한 이유는 무엇인가요?

- 답변 근거: 빌드 성공과 실제 배포 경로의 정상 동작은 서로 다른 문제
- CI 근거: Lint, TypeScript Build, SPA 폴백 산출물 검사
- Smoke Test 근거: 배포된 홈과 문서 딥링크를 주간·수동으로 확인

<br />

## 관련 링크

- 가이드: https://dohyuk-centric.github.io/eslint-kr/
- GitHub: https://github.com/DoHyuk-Centric/eslint-kr
- SPA 딥링크 개선: https://github.com/DoHyuk-Centric/eslint-kr/pull/28
- Issue 등록: https://github.com/DoHyuk-Centric/eslint-kr/issues/new/choose
- License: ./LICENSE

