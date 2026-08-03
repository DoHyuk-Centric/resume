# DoHyuk.dev

> Vanilla JavaScript와 Vite MPA로 구현한 개인 기술 블로그입니다.  
> 글 작성 과정에서 발견한 마크다운 렌더링 문제를 분석하고, 증분 렌더링 로직을 npm 패키지로 분리했습니다.

[![Deploy](https://img.shields.io/badge/Deploy-dohyuk.dev-111827?style=flat-square)](https://dohyuk.dev)
[![npm](https://img.shields.io/badge/npm-markdown--block--preview-CB3837?style=flat-square&logo=npm)](https://www.npmjs.com/package/markdown-block-preview)
[![Package GitHub](https://img.shields.io/badge/GitHub-markdown--block--preview-181717?style=flat-square&logo=github)](https://github.com/DoHyuk-Centric/markdown-block-preview)

## 요약

| 구분 | 내용 |
| --- | --- |
| 개요 | 개발 과정과 학습 기록을 직접 작성·관리하기 위해 만든 개인 기술 블로그 |
| 개발 기간 | 2026.01 ~ 2026.03 |
| 후속 개선 | 2026.07 문서 정비, 시크릿 관리 자동화 및 v2 전환 설계 |
| 목적 | Markdown 기반 글 작성·미리보기와 게시글 관리 흐름을 직접 설계하고 운영 |
| 개발 형태 | 개인 프로젝트 (기획, UI 구현, 데이터 연동, 배포 및 운영 전반 담당) |
| 현재 구조 | Vanilla JavaScript, Vite 기반 15개 HTML 진입점의 MPA, Supabase BaaS |
| 배포 | Vercel, https://dohyuk.dev |
| 핵심 구현 | 게시글 CRUD, 임시저장, 이미지 업로드, Markdown 입력 도구·실시간 프리뷰, 반응형 인터랙티브 소개 페이지 |
| 성능 개선 | 전체 마크다운 재렌더링을 블록 단위 갱신으로 개선하고 npm 패키지로 분리 |
| 운영 개선 | PR과 main 브랜치 push에서 환경변수 추적 여부와 시크릿을 자동 검사 |

<br />

## 목차

1. [개요](#개요)
2. [기술 선택과 사용 맥락](#기술-선택과-사용-맥락)
3. [구현 구조](#구현-구조)
4. [핵심 기능](#핵심-기능)
   - [마크다운 증분 렌더링](#마크다운-증분-렌더링)
   - [Markdown 작성 도구](#markdown-작성-도구)
5. [반응형 인터랙티브 UI](#반응형-인터랙티브-ui)
6. [트러블슈팅](#트러블슈팅)
7. [회고](#회고)
8. [Self QnA](#self-qna)
9. [관련 링크](#관련-링크)
10. [[부록] 문제 해결 및 고민 근거](#부록-문제-해결-및-고민-근거)

<br />

## 개요

글 작성과 게시글 관리 흐름을 직접 구현하고 통제하기 위해 개인 기술 블로그를 개발했습니다.

개발 과정에서는 다음 문제를 중점적으로 다뤘습니다.

1. 프레임워크 없이 여러 페이지와 공통 기능을 어떻게 분리할 것인가
2. 글이 길어질수록 반복되는 마크다운 전체 렌더링을 어떻게 줄일 것인가
3. 데스크톱과 모바일의 서로 다른 인터랙션을 어떻게 관리할 것인가
4. 코드와 README의 불일치, 환경변수 노출 같은 운영 문제의 재발을 어떻게 막을 것인가

<br />

## 기술 선택과 사용 맥락

### Vanilla JavaScript

DOM 조작, 이벤트 전파, UI 상태 변경 과정을 직접 다뤄보기 위해 프레임워크 없이 구현했습니다.

소개 페이지의 인터랙션은 데이터, 템플릿, 동작을 분리하고 이벤트 위임과 매핑 객체를 사용해 관리했습니다. 프레임워크가 제공하는 상태 관리나 컴포넌트 생명주기 대신, 화면별 상태 변경 범위를 직접 정의한 경험을 얻었습니다.

현재 구조에서는 공통 UI가 늘어날수록 중복 관리 비용이 커지고, CSR로 렌더링되는 게시글의 SEO가 약하다는 한계도 확인했습니다.

### Vite MPA

이 프로젝트는 SPA가 아니라 `index.html`과 `pages/`의 HTML 14개를 `vite.config.js`에 등록한 MPA입니다.

- 페이지별로 필요한 스크립트만 진입점에서 로드
- 정적 HTML 페이지와 Vanilla JavaScript 모듈을 단순하게 연결
- 별도 클라이언트 라우터나 전역 상태 관리 없이 페이지 책임 분리

페이지가 늘어나면서 공통 레이아웃 관리와 동적 메타데이터 생성이 어려워지는 한계가 있어, v2에서는 Next.js 전환을 설계하고 있습니다. 이는 현재 구현이 아니라 향후 설계입니다.

### Supabase

별도 백엔드 서버를 직접 운영하지 않고도 다음 기능을 구현하기 위해 BaaS로 사용했습니다.

- Postgres 기반 게시글·프로필 데이터 관리
- GitHub·Google OAuth 인증
- 게시글 및 프로필 이미지 저장
- 공공데이터 API를 중계하는 Edge Function

공공데이터 API는 서버 측 인증키가 필요하므로 브라우저에서 직접 호출하지 않았습니다. 요청을 Supabase Edge Function에서 대신 처리해 인증키를 서버 환경변수로 관리하고, 클라이언트에는 응답 데이터만 전달하도록 보안 경계를 나눴습니다.

클라이언트에서 BaaS를 직접 호출하는 구조는 빠른 구현에는 유리했지만, 데이터 접근 경계와 RLS 정책에 대한 검증이 중요하다는 점을 확인했습니다.

### Markdown

개발자를 주요 독자로 하는 기술 블로그이기 때문에 글 작성 형식으로 Markdown을 선택했습니다. Markdown은 README와 기술 문서에서 익숙하게 사용되며, 별도의 편집 도구 없이도 제목, 목록, 링크, 인용문, 코드 블록을 간결한 문법으로 작성할 수 있습니다.

- 기술 글에서 자주 사용하는 코드 블록과 계층 구조 표현이 간단함
- 서식이 포함된 에디터 데이터가 아니라 일반 텍스트로 저장 가능
- README나 프로젝트 문서로 내용을 옮겨도 같은 문법을 재사용할 수 있음
- 특정 에디터 형식에 종속되지 않아 원문을 다른 환경에서도 활용 가능

작성한 Markdown 원문은 Supabase에 저장하고, 조회 화면에서는 `marked`로 HTML을 생성합니다. 글쓰기 화면에서는 작성 결과를 바로 확인할 수 있도록 실시간 미리보기를 제공했습니다.

<br />

## 구현 구조

```text
myBlog/
├─ index.html                       # 랜딩 페이지
├─ pages/                           # 페이지별 HTML 14개
├─ components/
│  ├─ about/                        # 소개 페이지 데이터·템플릿·동작
│  ├─ postCreate/                   # 글 작성, 임시저장, 이미지 업로드
│  └─ ...                           # 페이지별 UI 및 기능 모듈
├─ src/
│  ├─ supabase.js                   # 브라우저용 Supabase 클라이언트
│  └─ ...                           # 공통 진입 스크립트와 스타일
├─ supabase/
│  └─ functions/get-holidays/       # 인증키를 사용하는 공공데이터 API 중계
├─ docs/                            # 성능 검토, 보안 개선, v2 설계 문서
├─ scripts/                         # 환경변수 추적 검사
├─ vite.config.js                   # MPA 진입점 구성
└─ .github/workflows/secrets.yml    # 환경변수·시크릿 검사 CI
```

### 페이지 구성

`vite.config.js`에서 루트 `index.html`과 홈, 소개, 게시글 목록·상세·작성·수정, 임시저장, 프로필, 로그인 등의 HTML 14개를 각각 진입점으로 관리합니다.

### 글 작성 흐름

```text
사용자 입력
  → markdown-block-preview로 미리보기 갱신
  → 이미지 임시 미리보기
  → 발행 시 이미지 업로드 및 URL 치환
  → Supabase에 게시글 저장
```

<br />

## 핵심 기능

### 마크다운 증분 렌더링

#### 문제

마크다운 에디터에서 한 글자를 수정할 때마다 전체 문서를 다시 파싱하고 미리보기 DOM을 교체하면, 변경되지 않은 영역까지 반복해서 처리하게 됩니다.

```text
기존 방식
입력 → 전체 마크다운 파싱 → 전체 미리보기 DOM 교체
```

#### 선택

마크다운을 빈 줄 기준의 블록으로 분리하고 이전 블록 배열과 비교한 뒤, 변경된 블록만 다시 파싱하는 방식을 선택했습니다.

```text
개선 방식
입력
  → 블록 분리
  → 이전 상태와 비교
  → 변경 블록 식별
  → 변경 블록만 파싱·교체
```

블록 개수가 같으면 변경된 블록만 교체하고, 마지막에 블록이 추가된 경우에는 새 블록만 추가합니다. 중간 삽입처럼 구조가 크게 달라지면 전체를 다시 구성하는 방식으로 정확성을 우선했습니다.

#### 구현

프로젝트 내부 로직으로 끝내지 않고 `markdown-block-preview` npm 패키지로 분리했습니다.

```js
import { setupMarkdownPreview } from "markdown-block-preview";

setupMarkdownPreview({
  textarea: document.getElementById("content"),
  preview: document.getElementById("preview-content"),
});
```

현재 블로그에서는 `components/postCreate/marked/markedControler.js`가 위 API를 호출합니다.

#### 검증 결과

| 조건 | 결과 |
| --- | ---: |
| 50블록 중 1블록 변경 | 전체 렌더링 대비 최대 8.2배 개선 |
| 50블록 중 10블록 변경 | 전체 렌더링 대비 최대 3.8배 개선 |
| 모든 블록 변경 | 비교 방식보다 약 0.8배로 소폭 느림 |
| Chromium, 1,400블록 문서 | 패키지 1.11ms / 전체 렌더링 55.09ms |

추가 실측에서는 약 600~700블록부터 전체 렌더링 방식이 60fps 프레임 예산을 넘기기 시작했습니다. 반면 일반적인 개인 블로그 글은 이 규모에 도달하지 않으므로, 이 프로젝트만을 기준으로 보면 증분 렌더링은 과도한 최적화라는 결론을 내렸습니다.

따라서 v2 전환 시에는 패키지를 억지로 이식하지 않고 단순한 전체 렌더링과 입력 지연 처리로 시작하기로 결정했습니다. 패키지는 장문 편집기처럼 실제로 증분 렌더링이 필요한 환경을 위한 독립 프로젝트로 유지합니다.

- [성능 및 React 전환 적합성 검토](./docs/2026-07-11-markdown-preview-perf-review.md)
- [블록 단위 렌더링 수요 조사](./docs/2026-07-11-block-rendering-demand-research.md)

### Markdown 작성 도구

Markdown 문법에 익숙하지 않거나 문법을 반복 입력해야 하는 불편을 줄이기 위해 글쓰기 도구 모음을 구현했습니다.

지원하는 기능은 제목 H1~H4, 굵게, 기울임, 취소선, 인용문, 링크, 이미지, 코드 블록입니다.

#### 선택 영역에 따른 문법 적용

`selectionStart`와 `selectionEnd`로 textarea의 커서와 선택 범위를 확인해 사용자의 현재 작성 상태에 따라 다르게 처리했습니다.

- 텍스트를 선택한 경우 선택 영역을 Markdown 문법으로 감쌈
- 선택 영역이 없는 경우 여는 문법과 닫는 문법을 함께 삽입
- 문법 삽입 후 커서를 실제 내용을 작성할 위치로 이동
- 제목을 변경할 때 기존 `#` 문법을 제거한 뒤 선택한 단계로 교체
- 처리 후 textarea에 포커스를 돌려 바로 이어서 작성 가능

예를 들어 굵게 버튼은 선택한 텍스트가 있으면 `**선택한 텍스트**`로 감쌉니다. 선택한 텍스트가 없으면 `****`를 삽입하고 두 쌍의 별표 사이로 커서를 이동합니다.

링크 버튼은 선택 여부에 따라 입력 흐름을 다르게 구성했습니다.

```text
선택한 텍스트 없음
  → [링크 텍스트](url) 삽입
  → '링크 텍스트' 영역 선택

선택한 텍스트 있음
  → [선택한 텍스트](url) 삽입
  → 'url' 영역 선택
```

이를 통해 사용자가 문법을 직접 입력하거나 삽입된 문법 사이로 커서를 다시 옮기지 않고 글쓰기를 이어갈 수 있도록 했습니다.

#### 이미지 Markdown 입력 경험 개선

Velog를 사용했을 당시 문장 끝에서 이미지를 추가하면 이미지 Markdown이 기존 텍스트 바로 뒤에 붙어, 직접 줄바꿈을 추가해야 하는 점이 불편했습니다.

DoHyuk.dev에서는 이미지 선택이 끝나면 현재 커서 위치 앞에 줄바꿈(`\n`)을 먼저 삽입하고, 다음 줄에 이미지 Markdown을 추가하도록 구현했습니다.

```text
기존 문장 뒤에서 이미지 추가
  → 줄바꿈 삽입
  → ![이미지 이름](미리보기 URL) 추가
  → 이미지 Markdown 뒤로 커서 이동
```

이미지 문법이 기존 문장과 붙지 않도록 분리해 사용자가 줄바꿈을 다시 입력하는 과정을 줄였습니다. 이때 실제 이미지는 바로 업로드하지 않고 브라우저의 미리보기 URL로 표시하며, 글을 발행할 때 Storage에 업로드한 URL로 교체합니다.

- 코드: `components/postCreate/inputcontent/inputPostEditor.js`
- [글쓰기 기능 구현 기록](https://hyeeoooook.tistory.com/37)

<br />

## 반응형 인터랙티브 UI

소개 페이지는 데스크톱에서 Windows XP, 모바일에서 Samsung One UI를 모티브로 구성했습니다.

### 데이터·템플릿·동작 분리

```text
components/about/
├─ data/                    # 화면에 표시할 데이터
├─ sections/
│  ├─ *-templates.js       # HTML 템플릿 생성
│  └─ mockup/
│     ├─ desktop.js        # 데스크톱 이벤트 처리
│     └─ mobile.js         # 모바일 상태와 이벤트 처리
└─ index.js                # 섹션 마운트
```

데스크톱 UI는 앱 키와 화면 키를 객체로 매핑하고 상위 요소에서 클릭·더블클릭 이벤트를 위임합니다. 모바일 UI는 `isOpenApp` 상태를 기준으로 홈과 앱 화면을 전환합니다.

이를 통해 앱이나 화면을 추가할 때 조건문을 반복하기보다 데이터와 매핑을 확장할 수 있도록 구성했습니다.

<br />

## 트러블슈팅

### 1. 화면 크기에 따라 어긋나는 섹션 탐색

**문제**  
소개 페이지에서 현재 섹션을 `scrollTop`과 각 섹션의 `offsetTop`으로 계산했습니다. 섹션마다 높이가 달라 일부 인덱스가 중복되었고, 화면 크기나 확대 비율에 따라 활성화되는 내비게이션이 달라졌습니다.

**시도**  
섹션의 중간 지점을 기준으로 범위를 다시 계산했지만, 픽셀 좌표에 의존하는 방식이라 사용 환경에 따른 오차를 해결하지 못했습니다.

**해결**  
좌표를 직접 계산하는 대신 `IntersectionObserver`가 스크롤 컨테이너 안에서 섹션의 노출 여부를 관찰하도록 변경했습니다. 임계값을 0.5로 설정하고, 화면에 절반 이상 들어온 섹션의 인덱스로 내비게이션 상태를 갱신했습니다.

**결과**

- 서로 다른 높이의 섹션에서도 현재 위치를 일관되게 판별
- 화면 크기와 확대 비율에 의존하던 좌표 계산 제거
- 스크롤 이벤트마다 모든 섹션의 위치를 비교하던 로직 제거

- [문제 해결 기록](https://hyeeoooook.tistory.com/30)
- 코드: `components/about/aside_nav.js`

### 2. 공용 Header 주입과 bfcache 충돌

**문제**  
여러 HTML에서 공통으로 사용하는 Header를 `fetch`로 불러왔습니다. Header DOM이 비동기로 추가되면서 관련 이벤트 코드의 실행 순서를 맞춰야 했고, 브라우저의 뒤로 가기·앞으로 가기에서는 bfcache가 이전 실행 상태를 복원해 UI와 이벤트 상태가 일관되지 않았습니다.

**생각해본 해결 방법**

- 기존 JavaScript 모듈 전체 재설계
- bfcache 강제 무효화
- `setTimeout`으로 실행 순서 지연
- 별도 서버를 통한 서버 사이드 렌더링

프로젝트의 규모와 Vanilla JavaScript 학습 목적을 고려해, 임시 지연이나 캐시 무효화 대신 Vite의 정적 자원 처리 기능을 사용했습니다.

**해결**  
Header HTML을 Vite의 `?raw` import로 빌드 시점에 문자열로 가져와 먼저 DOM에 반영한 뒤 이벤트를 연결했습니다. 이를 통해 네트워크 `fetch` 완료 시점에 의존하던 실행 순서를 제거했습니다.

**결과**

- 공용 Header 구조를 유지하면서 페이지별 중복 마크업 감소
- Header DOM 생성과 이벤트 연결 순서 명확화
- 시간 지연에 의존하는 임시 처리 제거

- [문제 해결 기록](https://hyeeoooook.tistory.com/35)

### 3. 게시글 저장 전에 페이지가 이동하는 문제

**문제**  
게시글 저장 버튼을 누르면 오류 없이 목록 페이지로 이동했지만 DB에는 글이 저장되지 않았습니다. 데이터가 짧은 경우에는 간헐적으로 저장되어 원인을 재현하기도 어려웠습니다.

**원인**  
Supabase 저장 요청이 끝나기 전에 페이지 이동이 실행됐습니다. 문서가 이동하면서 실행 중인 JavaScript와 네트워크 요청이 중단됐고, 전송이 우연히 먼저 끝난 짧은 글만 저장됐습니다.

**해결**  
저장 함수를 `await`해 DB 응답을 확인한 뒤 페이지를 이동하도록 실행 순서를 변경했습니다. 저장 실패 시에는 이동하지 않고 오류를 확인할 수 있도록 흐름을 분리했습니다.

**결과**

- 게시글 길이와 네트워크 속도에 따라 달라지던 간헐적 저장 실패 제거
- 저장 성공과 화면 이동의 실행 순서 보장
- 비동기 작업의 완료 여부를 기준으로 후속 동작을 실행하도록 기준 정립

- [문제 해결 기록](https://hyeeoooook.tistory.com/39)

### [운영 개선] 환경변수 추적 방지

`.env`와 `supabase/functions/.env`가 Git에서 추적된 문제를 발견한 뒤, 추적 해제와 `.gitignore` 수정에 그치지 않고 재발 방지 검사를 추가했습니다.

- `scripts/check-no-tracked-env.sh`로 환경변수 파일 추적 여부 검사
- GitHub Actions에서 PR과 main 브랜치 push를 대상으로 위 검사와 Gitleaks 시크릿 스캔 실행
- `.env`, `.env.*`가 Git에 추적되지 않도록 ignore 규칙과 검사 스크립트 구성
- 공개된 키는 히스토리 삭제가 아니라 폐기·재발급이 필요함을 문서화

> 실제 키 로테이션과 Supabase RLS 적용 여부는 별도로 확인해야 하는 수동 점검 항목입니다.

- [시크릿 관리 개선 기록](./docs/2026-07-11-readme-fix-and-secret-hygiene.md)

<br />

## 회고

### 잘한 점

- 글 작성 과정에서 발견한 성능 문제를 프로젝트 내부 최적화로 끝내지 않고 npm 패키지로 분리했습니다.
- 성능 수치만 강조하지 않고 실제 문서 규모에서는 최적화가 필요한지 다시 측정했습니다.
- 데이터, 템플릿, 이벤트 로직을 분리하며 Vanilla JavaScript 환경에서 UI 상태 흐름을 직접 설계했습니다.
- 문서 오류와 시크릿 노출을 일회성 수정으로 끝내지 않고 자동 검사로 재발을 방지했습니다.
- 프로젝트의 문제 정의부터 기술적 판단, 구현과 개선 과정을 기술 블로그에 기록하고, 이를 [문제 해결 및 고민 근거](#부록-문제-해결-및-고민-근거)로 연결했습니다.

### 아쉬운 점과 다음 개선

- 초기에는 커밋 메시지와 PR 기반 셀프 리뷰가 부족해 작업 의도와 검증 과정을 충분히 기록하지 못했습니다.
- 게시글이 CSR로 렌더링되어 검색 엔진이 콘텐츠를 읽기 어렵습니다.
- `marked` 결과를 `innerHTML`로 반영하는 부분은 sanitize 적용을 추가 검토해야 합니다.
- 현재 CI는 시크릿 검사 중심이며 린트·빌드·기능 테스트가 포함되어 있지 않습니다.
- Supabase RLS와 권한별 CRUD 동작을 자동 테스트로 검증할 필요가 있습니다.
- 사용되지 않는 Firebase 코드와 의존성이 남아 있어 제거가 필요합니다.

이 한계를 해결하기 위해 Next.js와 별도 API 서버로 전환하는 v2 구조를 설계했습니다. 아직 구현 완료 상태가 아니므로 현재 프로젝트 기능과 구분해 문서로 관리합니다.

- [v2 Next.js 전환 설계](./docs/2026-07-11-nextjs-migration-design.md)
- [데이터 모델 및 삭제 정책 설계](./docs/2026-07-11-database-erd-and-deletion-automation.md)

<br />

## Self QnA

### Q1. React가 아니라 Vanilla JavaScript를 선택한 이유는 무엇인가요?

- 답변 근거: DOM 조작과 이벤트·상태 흐름을 직접 다루기 위한 학습 목적
- 코드 근거: `components/about/sections/mockup/desktop.js`, `mobile.js`
- 함께 설명할 한계: 공통 UI 중복, CSR 기반 SEO, 규모 증가에 따른 관리 비용

### Q2. 마크다운 렌더링이 최대 8.2배 개선됐다는 수치는 어떻게 측정했나요?

- 답변 근거: 50블록에서 변경 블록 수에 따른 전체 렌더링과 증분 렌더링 비교
- 추가 근거: Chromium에서 블록 수별 300회 반복, 1,400블록에서 200회 반복 측정
- 반드시 설명할 한계: 일반적인 블로그 글에서는 전체 렌더링도 충분해 과도한 최적화일 수 있음

### Q3. 환경변수 노출 문제를 어떻게 해결했고, 왜 Git 히스토리를 지우지 않았나요?

- 답변 근거: 추적 해제, ignore 규칙, 검사 스크립트, Gitleaks CI
- 판단 근거: 이미 공개된 키는 히스토리를 지워도 안전해지지 않으므로 폐기·재발급이 필요
- 남은 검증: 실제 키 로테이션과 Supabase RLS 정책 확인

<br />

## 관련 링크

- 서비스: https://dohyuk.dev
- 기술 블로그: https://hyeeoooook.tistory.com/
- npm: https://www.npmjs.com/package/markdown-block-preview
- 패키지 저장소: https://github.com/DoHyuk-Centric/markdown-block-preview

### [부록] 문제 해결 및 고민 근거

#### 기능 구현

- [JavaScript 달력 구현](https://hyeeoooook.tistory.com/24)
- [개인 블로그 글쓰기 버튼 구현](https://hyeeoooook.tistory.com/37)
- [카드 드래그 로직 구현](https://hyeeoooook.tistory.com/49)
- [글쓰기 미리보기 구현과 npm 배포](https://hyeeoooook.tistory.com/75)

#### 문제 해결

- [달력 버튼 기능 최적화](https://hyeeoooook.tistory.com/27)
- [스크롤 기반 페이지 이동 문제 해결](https://hyeeoooook.tistory.com/30)
- [JavaScript 상태 변경 지연과 CSR·SSR](https://hyeeoooook.tistory.com/31)
- [Vite 환경에서 공용 Header를 재사용할 때 발생한 bfcache 문제](https://hyeeoooook.tistory.com/35)
- [잘못된 게시글 ID 접근을 404 페이지로 처리](https://hyeeoooook.tistory.com/38)
- [게시글 저장 과정에서 발생한 동기·비동기 처리 문제](https://hyeeoooook.tistory.com/39)
- [Firebase 인증을 Supabase로 교체](https://hyeeoooook.tistory.com/40)
- [로그인 관련 버그 원인 분석](https://hyeeoooook.tistory.com/69)
- [로그인 관련 버그 해결 과정](https://hyeeoooook.tistory.com/70)

#### 구조와 리팩터링

- [공통 HTML 분리와 접근성·시멘틱 구조 개선](https://hyeeoooook.tistory.com/32)
- [메뉴 UI 이벤트와 접근성 로직 결합](https://hyeeoooook.tistory.com/33)
- [버튼 이벤트 방식 비교와 이벤트 위임 적용](https://hyeeoooook.tistory.com/53)
- [객체 기반 디스패치 패턴](https://hyeeoooook.tistory.com/58)
- [개인 프로젝트의 배럴 패턴 리팩터링](https://hyeeoooook.tistory.com/64)
