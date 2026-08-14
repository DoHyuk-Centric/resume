# 김도혁 이력서

* [개발자 김도혁의 이력서](./index.html)

정적 HTML + Tailwind CSS로 만든 1페이지 이력서입니다.

## 실행

```bash
npm install
npm run dev
```

`npm run dev`는 `src/styles/main.css`를 감시해 `styles/main.css`로 빌드합니다. `index.html`을 브라우저로 열면 바로 확인할 수 있습니다.

## 빌드

```bash
npm run build
```

## 구조

* `index.html` — 이력서 본문
* `src/styles/main.css` — Tailwind 소스 (컴포넌트 클래스 정의)
* `styles/main.css` — 빌드된 CSS (커밋됨)
* `img/` — 프로필 사진, 아이콘
