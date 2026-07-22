# ADR-003: Vercel과 GitHub Actions를 이용한 CI/CD 분리

- 상태: 채택
- 날짜: 2026-07-22

## 상황

Next.js와 NestJS의 배포 대상이 다르며, Vercel의 Next.js 빌드만으로는 모노레포 전체의 타입·테스트·API 계약을 검증할 수 없다.

## 결정

- Vercel은 `apps/web`의 Preview와 Production 배포를 담당한다.
- GitHub Actions는 FE·BE 전체 검사와 NestJS AWS 배포 자동화를 담당한다.
- PR 필수 검사는 ESLint, Type Check, 테스트, Build와 Playwright E2E다.
- FE API 타입은 NestJS OpenAPI에서 생성하고 CI에서 최신 상태를 확인한다.
- 운영 배포 후 Health Check와 최소 Smoke Test를 실행한다.

## 결과

### 장점

- 프론트 Preview 경험과 전체 모노레포 검증을 함께 얻는다.
- 타입과 API 계약 오류를 배포 전에 차단한다.
- Playwright로 실제 사용자 흐름과 출력 레이아웃을 검증한다.

### 단점

- Vercel과 GitHub Actions에서 일부 빌드가 중복될 수 있다.
- Preview, 테스트 DB와 운영 환경변수 관리가 필요하다.
- FE와 API의 배포 순서를 조정해야 한다.

## 운영 원칙

- CI 실패 시 병합과 배포를 중단한다.
- 파괴적 DB 마이그레이션은 자동 승인하지 않는다.
- 테스트 실패 자료는 Trace와 Report artifact로 보존한다.
- CI의 AWS 인증에는 최소 권한과 단기 자격 증명을 사용한다.
