# Frontie AI

> 서로 다른 AI 모델의 기능 차이를 하나의 채팅 경험으로 통합한 프론트엔드 학습용 AI 애플리케이션입니다.  
> 스트리밍 응답, 멀티모달 입력, URL 기반 대화 상태 관리와 렌더링 성능 개선에 집중했습니다.

[![Deploy](https://img.shields.io/badge/Deploy-frontie--topaz.vercel.app-111827?style=flat-square&logo=vercel)](https://frontie-topaz.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-DoHyuk--Centric%2Ffrontie-181717?style=flat-square&logo=github)](https://github.com/DoHyuk-Centric/frontie)

## 요약

| 구분 | 내용 |
| --- | --- |
| 개요 | 프론트엔드 학습과 개발 질문에 여러 AI 모델로 답변하는 스트리밍 채팅 애플리케이션 |
| 개발 기간 | 2026.05.16 ~ 2026.05.25 |
| 개발 형태 | 개인 미니 프로젝트 (기획, UI 구현, AI 연동, 상태 관리, 배포 전반 담당) |
| 기술 구조 | Next.js 16 App Router, React 19, TypeScript, Vercel AI SDK, Zustand |
| 핵심 기능 | 멀티 모델 스트리밍, 모델별 이미지 첨부 제어, URL 기반 대화 관리, Markdown·코드 렌더링 |
| 성능 개선 | Lighthouse 성능 점수 48점에서 75점으로 개선 |
| 배포 | Vercel, https://frontie-topaz.vercel.app/ |

<br />

## 목차

1. [개요](#개요)
2. [기술 선택과 사용 맥락](#기술-선택과-사용-맥락)
3. [구현 구조](#구현-구조)
4. [핵심 기능](#핵심-기능)
   - [멀티 모델 스트리밍](#멀티-모델-스트리밍)
   - [모델별 멀티모달 처리](#모델별-멀티모달-처리)
   - [URL 기반 대화 관리](#url-기반-대화-관리)
5. [성능 개선](#성능-개선)
6. [트러블슈팅](#트러블슈팅)
7. [회고](#회고)
8. [Self QnA](#self-qna)
9. [관련 링크](#관련-링크)

<br />

## 개요

Frontie는 React, Next.js, TypeScript, CSS 등 프론트엔드 학습과 개발 과정에서 생기는 질문을 여러 AI 모델에 요청할 수 있도록 만든 채팅 애플리케이션입니다.

단순히 하나의 AI API를 연결하는 것보다 다음 문제를 다루는 데 집중했습니다.

1. 서로 다른 AI 공급자를 하나의 요청 구조로 어떻게 통합할 것인가
2. 모델마다 다른 이미지 지원 여부를 UI와 서버에서 어떻게 처리할 것인가
3. 스트리밍 중인 메시지와 저장된 대화 상태를 어떻게 동기화할 것인가
4. 대화 URL과 현재 선택된 대화 상태를 어떻게 일치시킬 것인가
5. Markdown과 코드 블록이 포함된 응답을 렌더링하면서 초기 로딩 비용을 어떻게 줄일 것인가

<br />

## 기술 선택과 사용 맥락

### Next.js App Router

AI 공급자의 API 키를 브라우저에 노출하지 않고 스트리밍 요청을 중계하기 위해 Next.js App Router와 Route Handler를 사용했습니다.

- `/api/chat`에서 모델 선택, 시스템 프롬프트, 응답 언어와 창의성 설정 처리
- API 키는 `NEXT_PUBLIC_` 접두사 없이 서버 환경변수로 관리
- `/chat/[id]` 동적 경로로 대화 URL 표현
- Layout에서 공통 Header와 Chat UI 유지

### Vercel AI SDK

Gemini, Groq, Cerebras의 서로 다른 SDK를 각각 직접 제어하기보다 공통 메시지·스트리밍 인터페이스로 다루기 위해 Vercel AI SDK를 선택했습니다.

클라이언트에서는 `useChat`과 `DefaultChatTransport`를 사용하고, 서버에서는 `streamText` 결과를 UI Message Stream으로 반환합니다.

```text
사용자 입력
  → useChat
  → /api/chat Route Handler
  → 선택한 AI Provider
  → 스트리밍 응답
  → UIMessage로 렌더링
```

### Zustand

스트리밍 중인 메시지 상태와 별개로 대화 목록, 대화별 메시지, 설정을 여러 컴포넌트에서 공유하기 위해 Zustand를 사용했습니다.

- `chatStore`: 대화 생성·선택·삭제, 메시지와 첨부 파일 이름 관리
- `settingsStore`: 모델, 창의성, 답변 언어 설정 관리
- `persist`: 대화 목록과 사용자 설정을 LocalStorage에 저장
- `activeId`: URL에서 다시 결정할 수 있도록 영속화 대상에서 제외

서버 데이터베이스와 로그인 기능이 없는 개인 프로젝트이므로 대화 기록을 브라우저 안에서 관리했습니다. 구현이 단순하고 서버 저장 비용이 없지만, 기기 간 동기화가 불가능하고 브라우저 데이터를 삭제하면 대화가 사라지는 한계가 있습니다.

### React Markdown과 Shiki

AI가 반환하는 Markdown과 GitHub Flavored Markdown을 화면에 표시하기 위해 `react-markdown`, `remark-gfm`을 사용했습니다. 코드 블록은 Shiki로 변환해 언어별 문법 강조를 적용했습니다.

Shiki와 Markdown 렌더러는 초기 번들에 포함하지 않고 동적으로 불러오며, 하이라이팅 결과가 준비되기 전에는 기본 `<pre><code>` 블록을 먼저 표시합니다.

<br />

## 구현 구조

```text
frontie/
├─ app/
│  ├─ api/chat/route.ts          # 모델 선택, 이미지 변환, 스트리밍 응답
│  ├─ chat/[id]/page.tsx         # URL과 활성 대화 동기화
│  ├─ chat/layout.tsx            # Header와 Chat 공통 레이아웃
│  └─ providers.tsx              # 테마 Provider 경계
├─ components/
│  ├─ chat/
│  │  ├─ Chat.tsx                # 메시지 전송과 스트리밍 상태
│  │  ├─ ChatInput.tsx           # 텍스트·파일 입력
│  │  ├─ MessageItem.tsx         # Markdown 메시지 렌더링
│  │  └─ CodeBlock.tsx           # Shiki 코드 하이라이팅
│  ├─ header/                    # 대화 목록과 Header
│  ├─ settings/                  # 모델·창의성·언어 설정
│  └─ ui/                        # 공통 UI 컴포넌트
├─ hooks/
│  └─ useFileAttachment.ts       # 첨부 파일 선택·삭제·초기화
├─ lib/
│  └─ ai-providers.ts            # AI 공급자와 모델 매핑
└─ store/
   ├─ chatStore.ts               # 대화 상태와 LocalStorage 영속화
   └─ settingsStore.ts           # 사용자 설정 영속화
```

### 채팅 요청 흐름

```text
메시지·첨부 이미지 입력
  → 현재 모델·창의성·언어 설정과 함께 전송
  → Route Handler에서 UIMessage를 ModelMessage로 변환
  → 마지막 사용자 메시지에 ImagePart 결합
  → 선택된 모델로 streamText 실행
  → 응답을 Markdown과 코드 블록으로 렌더링
  → 완료된 메시지를 대화별 LocalStorage에 저장
```

<br />

## 핵심 기능

### 멀티 모델 스트리밍

Gemini, Groq, Cerebras 공급자를 `MODELS` 객체로 관리하고 요청에 포함된 모델 키로 사용할 모델을 결정합니다.

```ts
export const MODELS = {
  groq: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
  gemini: google("gemini-2.5-flash"),
  cerebras: cerebras("gpt-oss-120b"),
} as const;
```

모델 선택뿐 아니라 답변 언어와 창의성 설정도 매 요청에 포함했습니다.

- 한국어·영어에 따라 시스템 프롬프트 변경
- UI의 창의성 값을 `0~1` 범위의 temperature로 변환
- 등록되지 않은 모델 키는 Gemini로 fallback
- 스트리밍 상태를 `submitted`, `streaming`, `ready`로 구분해 입력과 저장 시점 제어

### 모델별 멀티모달 처리

모든 모델이 동일한 입력을 지원하지 않으므로 모델의 기능 차이를 UI와 서버 양쪽에서 처리했습니다.

```text
이미지 선택
  → FileReader로 Base64 변환
  → 요청 body에 파일 정보 전달
  → 서버에서 image MIME type만 선별
  → 마지막 사용자 메시지에 ImagePart 추가
  → 멀티모달 지원 모델로 요청
```

Gemini와 Groq에서는 이미지를 전달할 수 있고, Cerebras를 선택하면 이미지 첨부 버튼을 비활성화하고 지원하지 않는 이유를 안내합니다.

첨부 파일 선택·삭제·초기화는 `useFileAttachment` 훅으로 분리했습니다. 대화 기록에는 파일 원문 대신 메시지별 파일 이름만 저장해 UI에서 어떤 파일을 보냈는지 확인할 수 있도록 했습니다.

### URL 기반 대화 관리

초기 구현에서는 Zustand의 `activeId`만 변경해 대화를 선택했습니다. 이 방식은 URL이 바뀌지 않아 새로고침, 뒤로 가기, 직접 링크 접근에서 화면과 선택 상태가 어긋날 수 있었습니다.

대화 ID를 `/chat/[id]` 경로에 반영하고 URL을 상태의 기준으로 사용하도록 구조를 변경했습니다.

```text
새 대화에서 첫 메시지 전송
  → 대화 ID 생성
  → /chat/[id]로 이동

기존 대화 선택
  → /chat/[id]로 이동
  → URL의 id가 LocalStorage 대화 목록에 존재하는지 확인
  → 존재하면 activeId 갱신
  → 존재하지 않으면 /chat으로 복귀
```

`Chat` 컴포넌트는 Layout에 한 번만 두고, 동적 경로 페이지는 URL과 활성 상태를 동기화하는 역할만 담당하도록 분리했습니다.

<br />

## 성능 개선

Lighthouse 성능 점수가 48점으로 측정된 뒤 번들 구성과 렌더링 범위를 분석해 75점까지 개선했습니다.

### 적용 내용

- `react-syntax-highlighter`를 Shiki로 교체
- Shiki를 코드 블록이 존재할 때 동적으로 import
- `ReactMarkdown`, `CodeBlock`을 `next/dynamic`으로 분리
- 메시지 UI를 `MessageItem`으로 분리하고 `memo` 적용
- Markdown 플러그인 배열을 `useMemo`로 재사용
- Welcome 화면을 정적 영역과 상호작용 영역으로 분리
- ThemeProvider를 별도 Client Component 경계로 이동
- Bundle Analyzer를 추가해 번들 구성을 확인할 수 있도록 구성

### 결과

| 항목 | 개선 전 | 개선 후 |
| --- | ---: | ---: |
| Lighthouse Performance | 48 | 75 |

> 저장소에는 점수 변화와 적용 항목은 기록되어 있지만 측정 기기, 네트워크 환경, 반복 횟수는 남아 있지 않습니다. 동일 조건 재측정과 세부 지표 기록은 추가 개선 과제입니다.

- [성능 개선 PR #26](https://github.com/DoHyuk-Centric/frontie/pull/26)

<br />

## 트러블슈팅

### 1. 스크롤 시 AI 스트리밍 응답이 멈추는 문제

**문제**  
AI 응답이 스트리밍되는 도중 메시지 영역을 스크롤하면 응답이 멈춘 것처럼 보이는 문제가 발생했습니다.

**원인**  
Flex 자식의 기본 `min-height: auto` 때문에 메시지 영역이 부모의 남은 높이 안에서 줄어들지 못했습니다. 스크롤이 메시지 영역이 아니라 전체 페이지에 영향을 주면서 높이 계산과 화면 갱신이 불안정해졌습니다.

**해결**

- 부모 Flex 영역에 `min-h-0`, `overflow-hidden` 적용
- 메시지 목록에 `flex-1`, `overflow-y-auto` 적용
- 스크롤 책임을 전체 페이지가 아니라 메시지 영역으로 제한

**결과**  
메시지가 길어져도 채팅 영역 내부에서만 스크롤되고 스트리밍 UI가 유지되도록 레이아웃 책임을 정리했습니다.

- [Issue #11](https://github.com/DoHyuk-Centric/frontie/issues/11)
- [해결 PR #12](https://github.com/DoHyuk-Centric/frontie/pull/12)

### 2. 대화 URL과 활성 상태 불일치

**문제**  
대화 선택 상태를 Zustand의 `activeId`만으로 관리해 새로고침하거나 URL로 직접 접근했을 때 어떤 대화를 보여줘야 하는지 경로에서 알 수 없었습니다.

**해결**

- 대화 ID를 `/chat/[id]` 동적 경로로 표현
- URL의 ID가 저장된 대화 목록에 있는지 검증
- 유효한 ID만 `activeId`에 반영하고 잘못된 ID는 `/chat`으로 이동
- 새 대화 화면에서는 `activeId`를 비우고 첫 메시지 전송 시 대화를 생성
- 대화 목록만 영속화하고 URL에서 복원 가능한 `activeId`는 저장 대상에서 제외

**결과**  
URL, 대화 목록, 현재 선택 상태가 같은 대화를 가리키도록 책임을 분리했습니다.

- [관련 커밋](https://github.com/DoHyuk-Centric/frontie/commit/a2b5edf)

<br />

## 회고

### 잘한 점

- 세 AI 공급자의 모델을 공통 인터페이스로 통합하고 요청마다 모델과 설정을 변경할 수 있도록 구성했습니다.
- 모델별 이미지 지원 차이를 UI 비활성화와 서버 메시지 변환에 함께 반영했습니다.
- URL을 대화 상태의 기준으로 삼아 새로고침과 직접 접근에서도 선택 상태를 복원할 수 있도록 했습니다.
- 성능 점수를 수치로 확인한 뒤 번들, 컴포넌트 경계, 렌더링 비용을 함께 개선했습니다.
- 이슈와 PR을 기능 단위로 분리해 문제와 변경 내용을 기록했습니다.

### 아쉬운 점과 다음 개선

- Lighthouse 측정 환경과 세부 지표를 기록하지 않아 48점에서 75점으로 개선된 결과를 재현하기 어렵습니다.
- 자동 테스트와 GitHub Actions CI가 없어 멀티 모델 요청, 상태 저장, 라우팅 회귀를 자동으로 검증하지 못합니다.
- 파일 입력에 `accept="image/*"` 제한이 없어 이미지 외 파일도 선택되지만 서버에서는 이미지가 아닌 파일을 무시합니다.
- `rehypeRaw`를 통해 AI 응답의 raw HTML을 처리하므로 허용 범위와 sanitize 정책을 검토해야 합니다.
- 대화가 LocalStorage에만 저장돼 기기 간 동기화와 복구를 지원하지 않습니다.
- 사용하지 않는 Anthropic SDK 의존성이 남아 있어 제거가 필요합니다.

<br />

## Self QnA

### Q1. AI 공급자를 직접 분기하지 않고 Vercel AI SDK를 사용한 이유는 무엇인가요?

- 답변 근거: 공급자마다 다른 SDK 호출 방식을 공통 메시지와 스트리밍 인터페이스로 처리
- 코드 근거: `lib/ai-providers.ts`, `app/api/chat/route.ts`
- 함께 설명할 한계: 모델별 기능 차이는 완전히 추상화되지 않으므로 이미지 지원 여부를 별도로 처리해야 함

### Q2. Zustand 상태와 URL의 역할을 어떻게 나눴나요?

- 답변 근거: URL은 현재 대화의 식별자, Zustand는 대화 데이터와 UI 변경 함수 관리
- 코드 근거: `app/chat/[id]/page.tsx`, `store/chatStore.ts`
- 함께 설명할 판단: URL에서 복원 가능한 `activeId`는 LocalStorage에 저장하지 않음

### Q3. Lighthouse 점수는 어떤 변경으로 개선됐나요?

- 답변 근거: 코드 하이라이터 교체, 동적 import, 메시지 컴포넌트 분리와 memo 적용
- 코드 근거: `MessageItem.tsx`, `CodeBlock.tsx`, `providers.tsx`, `next.config.ts`
- 반드시 설명할 한계: 측정 환경과 세부 지표가 기록되지 않아 점수 자체보다 개선 방향을 중심으로 설명해야 함

<br />

## 관련 링크

- 서비스: https://frontie-topaz.vercel.app/
- GitHub: https://github.com/DoHyuk-Centric/frontie
- 성능 개선: https://github.com/DoHyuk-Centric/frontie/pull/26
- 이미지 첨부 및 모델 처리: https://github.com/DoHyuk-Centric/frontie/pull/28
- 스트리밍 스크롤 문제: https://github.com/DoHyuk-Centric/frontie/pull/12
