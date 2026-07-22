# 데이터베이스 기획

> 문서 상태: 초안  
> 데이터베이스: PostgreSQL

## 1. 목표

콘텐츠를 한 번 저장하고 여러 지원용 문서에서 재사용할 수 있는 데이터 구조를 제공한다. 데이터 모델은 템플릿 표현 방식과 분리하며, 문서·블록 순서·사용자별 권한과 변경 이력을 안전하게 관리해야 한다.

## 2. 핵심 관계

```text
User
├─ ContentItem
├─ Document
│  └─ DocumentBlock
├─ Template
│  └─ TemplateVersion
├─ Asset
└─ ExportJob
```

## 3. 개념 스키마

### users

| 필드 | 설명 |
|---|---|
| id | 내부 식별자 |
| email | 로그인 이메일, unique |
| password_hash | 자체 인증 선택 시 사용 |
| display_name | 표시 이름 |
| created_at / updated_at | 생성·수정 시각 |
| deleted_at | 소프트 삭제 시각 |

### content_items

| 필드 | 설명 |
|---|---|
| id | 콘텐츠 식별자 |
| user_id | 소유자 |
| type | profile, experience, project, skill, case_study, essay |
| title | 목록 표시 및 검색용 제목 |
| data | 유형별 상세 데이터 JSONB |
| version | 충돌 감지용 버전 |
| created_at / updated_at / deleted_at | 수명 주기 |

### documents

| 필드 | 설명 |
|---|---|
| id | 문서 식별자 |
| user_id | 소유자 |
| template_version_id | 적용 템플릿 버전 |
| title | 문서 이름 |
| target_company | 지원 기업, 선택 |
| target_position | 지원 직무, 선택 |
| slug | 공개 주소, 선택 |
| visibility | private, unlisted, public |
| version | 동시 수정 충돌 감지 |
| created_at / updated_at / deleted_at | 수명 주기 |

### document_blocks

| 필드 | 설명 |
|---|---|
| id | 블록 식별자 |
| document_id | 소속 문서 |
| content_item_id | 원본 콘텐츠, 직접 작성 블록은 null 가능 |
| type | 블록 종류 |
| position | 문서 내 정렬 값 |
| content_override | 문서 전용 문구 JSONB |
| settings | 표시·레이아웃 설정 JSONB |
| created_at / updated_at | 생성·수정 시각 |

### templates / template_versions

- `templates`: 템플릿의 논리적 이름, 소유자와 공개 상태
- `template_versions`: 변경되지 않는 버전별 schema, theme, 생성 시각

기존 문서의 출력이 템플릿 수정으로 갑자기 바뀌지 않도록 문서는 특정 템플릿 버전을 참조한다.

### assets

- 사용자 소유자
- S3 bucket/key
- 원본 파일명
- MIME type
- byte 크기
- 이미지 width/height
- 업로드 완료·삭제 상태

DB에는 파일 자체를 저장하지 않는다.

### export_jobs

- 문서와 요청 사용자
- queued, processing, completed, failed 상태
- 시도 횟수와 오류 코드
- 결과 asset
- 작업 시작·완료·만료 시각

서버 PDF 기능을 도입하기 전까지 테이블 생성을 미룰 수 있다.

## 4. JSONB 사용 전략

유형마다 필드가 달라지는 콘텐츠와 템플릿 설정에는 JSONB가 유용하지만 모든 데이터를 JSONB로 저장하지 않는다.

### 일반 컬럼으로 저장

- 외래 키
- 소유자
- 상태
- 정렬 값
- 검색·정렬에 자주 사용하는 필드
- 생성·수정·삭제 시각

### JSONB로 저장

- 콘텐츠 유형별 세부 필드
- 템플릿 schema와 theme
- 블록별 표시 설정
- 문서 전용 override

JSONB 내부 구조도 애플리케이션 스키마로 검증하며, 구조가 바뀌면 데이터 마이그레이션을 제공한다.

## 5. 문서와 원본 콘텐츠의 변경 정책

아래 두 방식 중 최종 결정이 필요하다.

### 실시간 참조

원본 콘텐츠를 수정하면 이를 사용하는 모든 문서가 변경된다.

- 장점: 한 번 수정하면 전체 반영
- 단점: 과거에 제출한 문서 내용도 달라짐

### 스냅샷

문서에 콘텐츠를 추가할 때 당시 내용을 복사한다.

- 장점: 제출 시점 문서 보존
- 단점: 원본 수정이 기존 문서에 반영되지 않음

### 제안

원본 참조와 문서 override를 유지하되, 문서를 제출·발행할 때 immutable revision을 생성하는 혼합 방식을 검토한다.

## 6. 정렬 전략

블록 정렬은 단순 연속 정수 또는 간격을 둔 정수를 사용할 수 있다.

- MVP: 한 문서의 블록 순서를 트랜잭션에서 전체 갱신
- 성장 후: fractional indexing 등 충돌에 강한 방식 검토

문서 블록 수가 많지 않으므로 초기에는 단순성과 정확성을 우선한다.

## 7. 인덱스 초안

- `users(email)` unique
- `content_items(user_id, type, updated_at)`
- `documents(user_id, updated_at)`
- `documents(slug)` unique where 공개 slug가 존재
- `document_blocks(document_id, position)`
- `assets(user_id, created_at)`
- `export_jobs(status, created_at)`

실제 쿼리 계획과 데이터량을 확인하기 전에 과도한 JSONB GIN 인덱스를 만들지 않는다.

## 8. 트랜잭션이 필요한 작업

- 문서 생성과 초기 블록 삽입
- 블록 전체 순서 변경
- 템플릿 새 버전 발행
- 문서 발행 revision 생성
- 사용자 탈퇴 상태 변경과 접근 차단
- PDF 작업 완료와 Asset 연결

## 9. 백업과 복구

- 매일 `pg_dump` 생성
- 압축 후 AWS S3 업로드
- S3 Lifecycle로 보존 기간 관리
- 서버 로컬 백업은 업로드 성공 후 오래된 파일 삭제
- 주요 마이그레이션 전에 별도 백업
- 정기적으로 빈 DB에 복원 테스트
- 복구 목표 시간과 허용 데이터 손실 범위는 운영 전 결정

백업 파일의 존재가 복구 가능성을 보장하지 않으므로 복원 테스트 결과도 기록한다.

## 10. 마이그레이션 정책

- 마이그레이션 파일은 Git으로 관리한다.
- 운영 적용 전에 개발 DB에서 검증한다.
- 컬럼 추가 등 하위 호환 변경은 자동화 가능하다.
- 컬럼 삭제·타입 변경·대량 변환은 수동 승인을 요구한다.
- 애플리케이션 배포와 DB 변경 순서를 문서화한다.
- 자동 롤백이 어려운 DB 변경은 roll-forward 계획을 우선 준비한다.

## 11. 예상 문제와 대응

| 문제 | 대응 |
|---|---|
| 자동 저장 요청 충돌 | version 기반 optimistic locking |
| 사용자 간 데이터 노출 | 모든 쿼리에 user ownership 조건 적용 |
| JSONB 구조 불일치 | DTO 및 런타임 schema 검증 |
| 문서 삭제 후 S3 파일 잔존 | 참조 검사와 정리 배치 |
| 단일 DB 장애 | 외부 S3 백업과 복원 Runbook |
| 디스크 고갈 | 용량 알림, 로그·백업 로컬 보존 제한 |

## 12. 미결정 사항

- ID 형식: UUID, UUIDv7 또는 다른 방식
- ORM
- 콘텐츠 유형별 JSON schema
- 발행 revision 모델
- Soft delete 보존 기간
- 탈퇴 사용자 데이터 파기 정책
