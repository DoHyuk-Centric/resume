# 백엔드 기획

> 문서 상태: 초안  
> 담당 영역: `apps/api`

## 1. 목표

NestJS로 인증, 권한, 콘텐츠, 문서, 템플릿, 파일과 출력 작업을 관리한다. 비즈니스 규칙과 DB 접근은 백엔드에 집중시키고 프론트엔드에는 OpenAPI 계약만 공개한다.

## 2. 기술 구성

- NestJS
- TypeScript strict mode
- PostgreSQL
- ORM 미정: Drizzle 또는 Prisma
- Swagger/OpenAPI
- Jest 및 Supertest
- AWS S3 SDK

초기에는 모듈형 모놀리스를 사용한다. 서비스별 배포나 마이크로서비스는 트래픽과 조직 규모가 이를 요구하기 전까지 도입하지 않는다.

## 3. 모듈 구조

```text
AppModule
├─ AuthModule
├─ UsersModule
├─ ContentsModule
├─ DocumentsModule
├─ TemplatesModule
├─ AssetsModule
├─ ExportsModule
└─ HealthModule
```

### 책임

- `AuthModule`: 로그인, 로그아웃, 세션/토큰, 비밀번호 처리
- `UsersModule`: 사용자 프로필과 계정 설정
- `ContentsModule`: 경력, 프로젝트, 기술, 사례 CRUD
- `DocumentsModule`: 문서 및 블록 구성, 순서와 덮어쓰기
- `TemplatesModule`: 템플릿과 버전 관리
- `AssetsModule`: S3 업로드 권한 및 파일 메타데이터
- `ExportsModule`: PDF 생성 요청과 결과 관리
- `HealthModule`: 배포 및 모니터링용 상태 확인

## 4. API 원칙

- `/api/v1`처럼 버전이 드러나는 경로를 사용한다.
- DTO와 Validation Pipe로 모든 외부 입력을 검증한다.
- 인증된 사용자 ID는 요청 본문이 아닌 인증 컨텍스트에서 얻는다.
- 소유권 검사는 Controller가 아닌 Service/Guard 정책으로 일관되게 적용한다.
- 오류 응답의 코드와 형태를 통일한다.
- 목록 API는 페이지네이션, 정렬, 필터 조건을 명시한다.
- API 변경은 OpenAPI 문서와 생성 타입에 반영한다.

## 5. 인증과 권한

같은 서비스의 웹 클라이언트에는 HttpOnly, Secure, SameSite 쿠키 기반 인증을 우선 검토한다.

필수 보안 항목:

- 비밀번호는 검증된 해시 알고리즘 사용
- 로그인 Rate Limit
- 인증 쿠키에 HttpOnly·Secure 설정
- CSRF 위협 모델과 SameSite 정책 검토
- 세션 폐기 및 전체 기기 로그아웃
- 비밀번호 재설정 토큰의 짧은 만료 시간과 단일 사용
- 사용자 A가 사용자 B의 문서 ID를 알더라도 접근할 수 없도록 소유권 검사

AWS Cognito는 운영 부담을 낮추지만 초기 설정과 사용자 경험 커스텀이 복잡하다. 자체 인증과 Cognito의 비용·운영 책임을 비교한 후 ADR로 결정한다.

## 6. 파일 업로드

NestJS 서버가 대용량 파일을 직접 전달하지 않고 S3 Presigned URL을 발급한다.

```text
클라이언트 → 업로드 권한 요청
NestJS     → 사용자·용량·형식 검증 후 Presigned URL 반환
클라이언트 → S3 직접 업로드
클라이언트 → 업로드 완료 메타데이터 등록
NestJS     → 객체 존재 및 소유 경로 확인
```

### 예상 문제

- 확장자만 바꾼 악성 파일
- 큰 파일 반복 업로드로 인한 비용 증가
- 업로드 후 문서에 연결되지 않은 고아 객체
- Presigned URL 탈취

### 대응

- MIME, 확장자, 최대 크기와 이미지 디코딩 검증
- 사용자별 저장 한도와 Rate Limit
- 짧은 URL 만료 시간
- 사용자별 S3 Key prefix
- 고아 객체 정리 배치

## 7. PDF 출력

MVP에서는 프론트엔드의 브라우저 인쇄만 지원한다. 서버 PDF가 필요해지면 API 요청과 실제 생성 작업을 분리한다.

```text
POST /exports
  → 작업 생성 및 202 응답
  → Worker가 Playwright로 PDF 생성
  → S3 업로드
  → 완료 상태 갱신
```

Chromium은 메모리 사용량이 크므로 NestJS API 프로세스 안에서 동기적으로 실행하지 않는다. 재시도 횟수, 작업 만료, 중복 요청 방지와 실패 원인을 저장해야 한다.

## 8. 관측 가능성

- 요청 ID를 발급하고 구조화 로그에 포함
- 비밀번호, 토큰, 쿠키, Presigned URL을 로그에서 제거
- `/health/live`: 프로세스 생존 확인
- `/health/ready`: DB 등 필수 의존성 준비 확인
- 4xx와 5xx를 구분해 집계
- 로그인 실패, 권한 거부, 파일 업로드 실패를 감사 대상으로 기록

## 9. 예상 문제와 트레이드오프

| 항목 | 선택 | 이점 | 비용/위험 |
|---|---|---|---|
| NestJS 별도 API | 명확한 도메인·권한 계층 | 확장성과 테스트 용이 | 프로세스·배포 복잡도 증가 |
| 모듈형 모놀리스 | 단일 배포 | 빠른 개발과 트랜잭션 처리 | 모듈 경계가 흐려질 수 있음 |
| OpenAPI 타입 생성 | FE·BE 계약 자동 점검 | 런타임 오류 감소 | 생성 파일 최신화 절차 필요 |
| Presigned URL | API 부하 감소 | 파일 비용과 업로드 효율 개선 | 완료 검증과 고아 객체 처리 필요 |

## 10. 대안

- Next.js Route Handler만 사용: 가장 빠르지만 비즈니스 로직과 권한 규칙이 프론트 프로젝트에 섞인다.
- Lambda + API Gateway: 유휴 비용은 낮지만 배포·로컬 개발·콜드 스타트와 연결 관리가 복잡하다.
- 마이크로서비스: 현재 사용자·트래픽·팀 규모에는 운영 비용이 과도하다.

## 11. 미결정 사항

- 인증 구현 방식
- ORM 선택
- REST 외 API 방식 도입 여부
- API 응답 표준 형식
- Rate Limit 수치
- 서버 PDF 작업 큐 구현 및 도입 시점
