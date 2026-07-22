# frontie(프론티 AI) 프로젝트 정리

> 저장소: [DoHyuk-Centric/frontie](https://github.com/DoHyuk-Centric/frontie) · 배포: [frontie-topaz.vercel.app](https://frontie-topaz.vercel.app/)
> 기간: 2026.05.16 ~ 2026.05.27 (약 2주, 커밋 61개 · 병합 PR 14개) · 개인 프로젝트 · Next.js 16(App Router) + Vercel AI SDK(Groq/Gemini/Cerebras 멀티 LLM)

이 문서는 저장소의 전체 커밋 히스토리(`git log`), 병합된 PR 14건, 이슈 15건(그중 1건은 미해결)과 소스 코드를 직접 조회해 정리한 작업 기록입니다. `feature/*`·`fix/*`·`design/*`·`pref/*` 브랜치를 이슈 번호 단위로 파서 `develop`에 PR로 병합하는 방식으로 진행되었습니다.

---

## 1. 구현 기능 정리

### 1.1 핵심 기능

| 기능 | 설명 |
|---|---|
| **멀티 LLM 스트리밍 챗봇** | Groq(`llama-4-scout-17b`)·Gemini(`gemini-2.5-flash`)·Cerebras(`gpt-oss-120b`) 3개 프로바이더를 Vercel AI SDK(`ai`, `@ai-sdk/*`)로 통합, 설정 모달에서 실시간 모델 전환 및 `streamText`로 스트리밍 응답 |
| **URL 기반 채팅 라우팅 + 로컬 영속화** | `/chat`, `/chat/[id]` 라우트와 Zustand(`persist`) 스토어로 채팅 목록·메시지·활성 대화(`activeId`)를 관리. 페이지 이동 시에도 `Chat` 컴포넌트를 레이아웃에 배치해 상태를 유지 |
| **이미지 첨부 + 비전 멀티모달** | `useFileAttachment` 훅으로 파일 선택, base64 인코딩 후 API 라우트에서 `ImagePart`로 변환해 비전 지원 모델(Groq/Gemini)에 전달. 비전 미지원 Cerebras 선택 시 첨부 버튼 자동 비활성화 |
| **Lighthouse 성능 개선(48점 → 75점)** | 코드 스플리팅·dynamic import·컴포넌트 분리·`memo` 적용으로 초기 로딩·렌더링 성능을 실측 기반으로 개선(§3) |

### 1.2 기능 목록 (커밋 기준 시간순)

**초기 셋업 / 레이아웃 (`05-16`~`05-17`)**
- Create Next App 기반 프로젝트 생성, shadcn/ui·TailwindCSS 도입 (`first commit`)
- 파비콘 변경, `Header` 컴포넌트·`LogoIcon` 제작, 예시 질문(`questions`) 동적 props 적용
- lucide-react 아이콘으로 기존 이미지 교체, Home 레이아웃(`h-screen`, gap 간격) 정리
- 왼쪽에서 열리는 슬라이드 네비게이션 구현(`useState` 기반 open 상태관리)
- `next-themes` 기반 다크모드 구현 → 이후 별도 `theme/` 폴더가 불필요하다고 판단해 직접 되돌림
- 설정 모달(`SettingModal`) 컴포넌트 최초 구현, `header/page.tsx → Header.tsx` 네이밍 규칙 정리

**AI 챗봇 코어 (`05-18`~`05-19`)**
- Groq 스트리밍 API 라우트(`app/api/chat/route.ts`)·프로바이더 설정, `useChat`으로 메시지 렌더링 연결
- TailwindCSS Typography 플러그인 추가 — AI 마크다운 응답의 글자 크기가 Tailwind reset으로 기본값이 되는 문제 해결
- Gemini AI 연동 및 설정 모달에서 AI 선택 기능 추가
- 스크롤 시 AI 응답이 멈추는 버그 수정(§2.1)
- Cerebras AI 추가로 3개 프로바이더 체제 완성

**채팅 기록 / 라우팅 (`05-19`~`05-24`)**
- Zustand로 상태관리 전환, 새 메시지 발생 시 LocalStorage에 저장, 삭제 버튼으로 리스트에서 제거
- LocalStorage 기반 채팅 기록(`persist` 미들웨어) 구현
- 헤더 타이틀 변경(새 대화 → 프론티)
- URL 기반 채팅 라우팅 구조로 전면 리팩토링 — `Chat` 컴포넌트를 `components/chat/`로 이동, `app/chat/layout.tsx`에 `Header`+`Chat` 배치(페이지 전환에도 상태 유지), `app/chat/[id]/page.tsx`로 URL↔활성 채팅방 동기화, `settingsStore` 신설, `activeId`는 persist 대상에서 제외
- 첫 화면 진입 시 무조건 이전 대화로 이동되던 현상 수정, 프론티 홈으로 이동하는 `Link` 추가
- 예시 버튼 클릭 시 새 채팅 리스트가 생성되도록 수정, 대화 리스트 미리보기 글자 수 조정(`slice(0,20)→(0,15)`)
- 토큰 제한(`maxOutputTokens`) 완전 제거(§2.2)

**디자인/렌더링 개선 (`05-24`)**
- `react-syntax-highlighter` 기반 코드블록 색상 적용 → 사용자 채팅 코드블록에도 동일 적용
- 마크다운 이미지 렌더링 개선 — SVG는 `rehype-raw`, `<img>`는 별도 컴포넌트로 처리(§2.3)
- 예시 버튼 디자인·텍스트 색상 개선, 불필요한 주석 제거

**성능 개선 (`05-25`)**
- Lighthouse 성능 점수 48점 → 75점 개선: `shiki`로 하이라이터 교체(동적 import), `ReactMarkdown`/`CodeBlock` dynamic import, `ThemeProvider` 클라이언트 컴포넌트 분리, `WelcomeScreen` 서버/클라이언트 분리, `MessageItem` 분리 + `memo` 적용(§3)

**파일 첨부 (`05-25`)**
- `useFileAttachment` 훅 신설, 이미지 base64 인코딩 후 API 전달, Cerebras 선택 시 첨부 비활성화, 메시지에 첨부 파일명 표시, `chatStore`에 `messageFiles` 추가, Groq 모델을 비전 지원 `llama-4-scout`로 교체, `sendMessage` body 직접 전달로 모델 실시간 변경 반영

**배포 후 핫픽스 (`05-26`, `main` 브랜치)**
- 폴더명 `Chat` → `chat` 소문자로 변경(§2.5) — 이 두 커밋은 `main`에는 반영되었으나 **`develop`에는 아직 병합되지 않은 상태**로 남아 있음(§5)

---

## 2. 문제 해결 과정

### 2.1 채팅 스크롤 시 AI 응답이 멈추는 버그

- **문제 정의**: 스트리밍 응답 도중 사용자가 스크롤하면 메시지 렌더링(응답 표시)이 멈추는 현상 발생(이슈 #11).
- **원인**: 부모 flex 컨테이너에 `min-h-0`가 없어 flex 자식 요소의 기본 `min-height: auto` 때문에 높이 계산이 꼬였고, 메시지 영역이 별도 스크롤 컨테이너로 분리되지 않은 채 전체 페이지 레이아웃과 얽혀 있었다.
- **해결책 설계 및 선택**: 부모 flex 컨테이너에 `min-h-0`·`overflow-hidden`을 추가하고, 메시지 영역에만 `flex-1`·`overflow-y-auto`를 부여해 스크롤 영역을 분리.
- **구현 및 검증**: `fix: 스크롤 시 AI 응답 멈춤 버그 수정`(`05-19`, PR #12)으로 반영. 이후 성능 개선 커밋(`05-25`)에서도 동일한 `min-h-0`/`overflow-hidden` 패턴이 `Chat.tsx`에 유지됨.

### 2.2 토큰 제한으로 인한 답변 중간 끊김

- **문제 정의**: 설정에서 응답 길이(512/1024/2048 토큰)를 선택하게 했으나, 실제로는 답변이 완결되기 전에 잘리는 현상이 발생(이슈 #21).
- **원인**: `streamText`에 전달하던 `maxOutputTokens` 값 자체가 응답의 논리적 완결과 무관하게 하드 컷을 발생시켰다.
- **해결책 설계 및 선택**: 응답 길이를 사용자가 선택하게 하는 기능 자체를 제거하고 토큰 제한을 두지 않는 방향으로 단순화.
- **구현 및 검증**: `fix: 토큰 제한 해제`(`05-24`, PR #22)로 `route.ts`·`Chat.tsx`·`SettingsModal.tsx`에서 `maxLength` 관련 코드를 모두 제거해 반영.

### 2.3 마크다운 이미지(SVG 포함) 렌더링 문제

- **문제 정의**: AI가 마크다운 응답에 이미지나 인라인 SVG를 포함시켜도 정상적으로 렌더링되지 않음.
- **원인**: `react-markdown`은 기본적으로 원본 HTML을 파싱하지 않아 SVG 같은 raw HTML 태그가 무시되고, `<img>` 태그도 별도 스타일링 컴포넌트 없이 기본 렌더링에 그쳤다.
- **해결책 설계 및 선택**: `rehype-raw` 플러그인을 추가해 raw HTML(SVG 등)을 파싱하도록 하고, `img` 렌더러를 커스텀 컴포넌트로 오버라이드해 `rounded-lg`·`max-w-full` 스타일을 적용.
- **구현 및 검증**: `fix: 이미지 개선`(`05-24`) 커밋으로 `Chat.tsx`(이후 `MessageItem.tsx`)에 반영. `rehype-raw`는 신뢰할 수 없는 HTML을 그대로 렌더링할 수 있어 XSS 관점의 잠재 리스크가 남아있음(§5).

### 2.4 Lighthouse 성능 점수 저하(48점)

§3에서 상세히 다룹니다.

### 2.5 배포 환경(Linux)의 대소문자 구분 폴더명 문제

- **문제 정의**: 로컬 개발(Windows/Mac)에서는 `app/Chat/` 폴더 경로가 문제없이 동작했지만, Vercel(Linux) 배포 환경에서는 대소문자를 구분하는 파일시스템 특성으로 라우팅 문제가 발생할 소지가 있었다.
- **원인**: Next.js App Router가 폴더명을 그대로 라우트 세그먼트로 사용하는데, `Chat`처럼 대문자로 시작하는 폴더명은 Linux 배포 환경·일부 import 경로 대소문자 불일치와 충돌 가능성이 있었다.
- **해결책 설계 및 선택**: 라우트 폴더명을 관례대로 소문자(`chat`)로 통일.
- **구현 및 검증**: `fix: Chat -> chat 폴더명 소문자로 변경`, `fix: Chat → chat으로 변경`(`05-26`) 두 커밋으로 `main` 브랜치에 반영. **다만 이 두 커밋은 `develop` 브랜치에는 아직 병합되지 않아, 두 브랜치의 폴더명 표기가 어긋나 있는 상태**(§5).

---

## 3. 성능 개선 관련 내용

`perf: Lighthouse 성능 점수 개선 (48점 → 75점)`(`05-25`, PR #26, 이슈 #25) 커밋 하나에 실측 기반 개선이 집약되어 있습니다.

| 개선 항목 | 내용 |
|---|---|
| 하이라이터 교체 | `react-syntax-highlighter`(정적 번들에 다량의 언어 문법 포함) → `shiki` 동적 import로 교체해 초기 번들 크기 축소 |
| 마크다운 렌더러 지연 로딩 | `ReactMarkdown`, `CodeBlock`을 `next/dynamic`(`ssr: false`)으로 지연 로딩 |
| 테마 프로바이더 분리 | `ThemeProvider`를 `app/providers.tsx` 별도 클라이언트 컴포넌트로 분리해 루트 레이아웃의 서버/클라이언트 경계를 명확히 함 |
| Welcome 화면 분리 | `WelcomeScreen`을 서버/클라이언트 컴포넌트로 분리해 불필요한 클라이언트 번들 포함을 줄임 |
| 렌더링 최적화 | `MessageItem`을 별도 컴포넌트로 분리하고 `memo` 적용 — 새 메시지 추가 시 이전 메시지들의 불필요한 리렌더링 방지 |
| 번들 분석 도구 도입 | `@next/bundle-analyzer` 추가(devDependencies)로 번들 구성을 지속적으로 점검할 수 있는 기반 마련 |

- 결과: Lighthouse 성능 점수 **48점 → 75점**으로 개선.
- `CodeBlock.tsx`는 `shiki`가 로드되기 전까지 plain `<pre>` fallback을 렌더링하도록 설계해, 지연 로딩 중에도 레이아웃 시프트 없이 코드가 보이도록 처리.

---

## 4. 아키텍처 구조

### 4.1 전체 구조 요약

```
[브라우저] app/chat/layout.tsx (Header + Chat, 페이지 전환에도 상태 유지)
   │
   ├─ Zustand chatStore(persist)   — 채팅 목록·메시지·첨부파일명 (localStorage: "chat-storage")
   ├─ Zustand settingsStore(persist) — 모델/창의성/언어 설정 (localStorage: "settings-storage")
   │
   ├─ useChat({ transport: DefaultChatTransport("/api/chat") })
   │        │  sendMessage({ text }, { body: { model, creativity, language, files } })
   │        ▼
   └─ app/api/chat/route.ts (Route Handler)
            │  system prompt 언어 분기(ko/en) → convertToModelMessages → 이미지 첨부 시 ImagePart 병합
            ▼
      lib/ai-providers.ts  MODELS = { groq, gemini, cerebras }
            │
            ▼
      streamText() → toUIMessageStreamResponse()  (Groq / Gemini / Cerebras 중 선택된 모델로 스트리밍)
```

### 4.2 폴더 구조

```
frontie/
├─ app/
│  ├─ layout.tsx, page.tsx        # 루트 레이아웃, "/" → "/chat" 리다이렉트
│  ├─ providers.tsx                # ThemeProvider(next-themes) 분리
│  ├─ Chat/ (develop) · chat/(main)  # [id]/page.tsx(URL↔activeId 동기화), layout.tsx(Header+Chat 유지), page.tsx(activeId 초기화)
│  └─ api/chat/route.ts           # 멀티 LLM 스트리밍 Route Handler
├─ components/
│  ├─ chat/       # Chat, ChatInput, MessageItem(memo), CodeBlock(shiki), ExampleQuestion, WelcomeScreen/Actions
│  ├─ header/     # Header — 슬라이드 네비게이션, 채팅 목록, 다크모드 토글, 설정 진입점
│  ├─ settings/   # SettingsModal — 모델/창의성/언어
│  ├─ icons/      # LogoIcon, chat/(Code·Docs·ElectricBulb·Idea) 예시 질문 아이콘
│  └─ ui/         # shadcn/ui 프리미티브(button/dialog/input/select/sheet/slider)
├─ hooks/
│  └─ useFileAttachment.ts        # 파일 선택 상태(File[])·input ref 관리
├─ lib/
│  └─ ai-providers.ts             # Groq/Gemini/Cerebras 클라이언트 및 MODELS 매핑
├─ store/
│  ├─ chatStore.ts                # 채팅 목록/활성 id/메시지/첨부파일명 (persist)
│  └─ settingsStore.ts            # AISettings (persist)
├─ AGENTS.md, CLAUDE.md           # Next.js 16(신버전) breaking change 경고 — node_modules 내 최신 문서 우선 참조 지시
└─ README.md                      # 프로젝트 개요만 작성, 기술 스택 섹션은 미완성(§5)
```

### 4.3 채팅 전송 데이터 흐름

```
ChatInput → onSubmit({ text, files })
  → 파일 존재 시 fileToBase64()로 인코딩(Chat.tsx)
  → activeId 없으면 addChat()으로 새 채팅 생성 후 /chat/{id}로 push
  → sendMessage({ text }, { body: { model, creativity, language, files: encodedFiles } })
  → app/api/chat/route.ts
       ├─ UIMessage[] → ModelMessage[] 변환(convertToModelMessages) 후 text part만 남기도록 sanitize
       ├─ 이미지 파일이 있으면 마지막 메시지 content에 ImagePart[] 병합(base64 → Buffer)
       └─ streamText({ model: MODELS[model], system, messages, temperature: creativity/100 })
  → toUIMessageStreamResponse()로 스트리밍 반환
  → useChat이 messages를 순차 갱신 → status==="ready" 시 chatStore.updateMessages로 영속화
  → 첫 사용자 메시지 기준으로 채팅 제목 자동 생성(15자 슬라이스)
  → 첨부파일이 있었다면 pendingFiles를 마지막 user 메시지 id에 매핑해 messageFiles에 저장
```

### 4.4 URL ↔ 상태 동기화

```
/chat            → ChatPage: 마운트 시 clearActiveId() 호출(activeId 초기화)
/chat/[id]        → ChatRoomPage: params.id가 chatList에 존재하면 setActiveId(id),
                     존재하지 않으면 /chat으로 replace
Header 채팅 목록 클릭 → router.push(`/chat/${id}`) → 위 흐름으로 activeId 동기화
```

- `Chat` 컴포넌트 자체는 `app/chat/layout.tsx`에 배치되어 있어 `/chat` ↔ `/chat/[id]` 전환 시에도 언마운트되지 않고 메시지 상태가 유지됨 — `activeId` 변경에 반응하는 `useEffect`로만 메시지를 다시 채워 넣는 구조.

### 4.5 상태 관리(Zustand) 스키마

```
chatStore (persist: "chat-storage", activeId는 partialize에서 제외)
  chatList: { id, title, messages: UIMessage[], messageFiles: Record<messageId, string[]> }[]
  activeId: number | null

settingsStore (persist: "settings-storage")
  settings: { model: "groq" | "gemini" | "cerebras", creativity: number, language: "ko" | "en" }
```

---

## 5. 기타 — 미해결 사항 / 향후 계획

### 5.1 오픈 이슈 #29 "버그 개선" (2026-05-27 등록, 미해결)

레포에 미완료 상태로 남아있는 체크리스트(부분 완료):

- [x] 라이트 테마에서 글씨 잘 안보임
- [ ] 모바일에서 깨짐
- [ ] 햄버거 메뉴가 안닫힘
- [ ] 새대화 위에 로고 하나 달아라
- [ ] 모바일에서 설정창 열고 뒤로가기 누르면 설정창은 그대로 떠있는데 초기화면으로 돌아감

대응하는 `bug/29-issue-description` 브랜치는 생성만 되어 있고 `develop` 대비 커밋이 아직 없는 착수 전 상태.

### 5.2 브랜치 동기화 공백

- `main` 브랜치가 `develop`보다 2개 커밋 앞서 있음 — 폴더명 대소문자 수정(§2.5, `f062d55`/`3889070`)이 `main`에는 반영됐지만 `develop`로 역병합(back-merge)되지 않은 상태. 다음 `feature/*` 브랜치를 `develop`에서 새로 딸 경우 동일한 대소문자 문제가 재발할 수 있음.

### 5.3 남아있는 기술 부채

- **README 미완성**: "기술 스택" 섹션 제목만 있고 내용이 비어 있음.
- **XSS 잠재 리스크**: `rehype-raw`로 AI 응답의 raw HTML(SVG 등)을 그대로 렌더링(§2.3)하고 있어, DOMPurify 등 별도 sanitize 없이 신뢰할 수 없는 콘텐츠를 렌더링하는 경로가 남아 있음. `CodeBlock.tsx`의 `dangerouslySetInnerHTML`(shiki 출력)도 같은 맥락.
- **API 키 검증 없음**: `lib/ai-providers.ts`가 `process.env.*_API_KEY`를 별도 존재 검증 없이 그대로 `createXxx()`에 전달 — 키 누락 시 첫 요청에서야 실패가 드러나는 구조.

### 5.4 프로젝트 성격

부트캠프 팀 프로젝트(`kanto.md` 참고)와 병행 진행한 개인 사이드 프로젝트로, 약 2주 동안 이슈 단위로 브랜치를 파고 PR로 병합하는 협업 워크플로우를 1인 개발에도 동일하게 적용해 커밋 히스토리와 변경 이력을 추적 가능하게 관리한 사례.
