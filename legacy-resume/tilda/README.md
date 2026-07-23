# Tilda 지원용 이력서·포트폴리오

이 폴더는 `legacy-resume` 원본과 분리된 독립 작업본입니다.

## 실행

저장소 루트에서 이력서 전용 개발 명령을 실행합니다.

```powershell
npm run dev:resume
```

- 이력서: `http://localhost:3000/legacy-resume/tilda/resume.html`
- 포트폴리오: `http://localhost:3000/legacy-resume/tilda/portfolio.html`

이 명령은 `legacy-resume`를 루트로 하는 Vite 서버를 3000번 포트에서
실행하고 Tilda 이력서를 자동으로 엽니다.

## PDF 생성

```powershell
npm run pdf
npm run portfolio-pdf
```

## 파일 구조

- `resume.html`: Tilda 지원용 이력서
- `portfolio.html`: Tilda 지원용 포트폴리오
- `src/`: 이력서·포트폴리오 스타일
- `kanto/`, `myblog/`, `frontie/`: 포트폴리오 이미지
- 루트 이미지·아이콘: 포트폴리오 배경 및 프로젝트 아이콘

원본 파일을 수정해도 이 폴더의 HTML과 이미지에는 영향을 주지 않습니다.
