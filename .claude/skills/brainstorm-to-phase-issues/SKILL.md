---
name: brainstorm-to-phase-issues
description: Use when the user wants to break a brainstormed feature into multiple GitHub issues organized by phase. Triggers on phrases like "Phase별로 나눠서 이슈 만들어줘", "단계별로 이슈화", "대화 내용을 깃헙 이슈로", "이거 한번에 구현하기 힘들것같아 단계로 쪼개줘". Produces detailed, self-contained issues that a developer can implement from issue body alone.
---

# Brainstorm → Phase별 GitHub 이슈화

대화로 정리된 기능 요건을 받아, **PR 단위로 머지 가능한 Phase**로 분할하고 각 Phase를 **자기 완결적인 GitHub 이슈**로 등록한다. 이슈 본문만 보고 코드 작성이 가능한 수준이어야 한다.

## 언제 사용하나

- 이미 `superpowers:brainstorming` 등으로 기능 요건이 정리됐고, 이제 실제 구현 단계로 가기 직전
- 사용자가 "한 번에 구현 어렵다", "단계로 나눠 달라", "Phase별 이슈로 만들어 달라"고 요청

## 선행 조건 체크

1. **합의된 요건이 있어야 한다.** 단순 한두 문장 아이디어 수준이면 먼저 `superpowers:brainstorming` 사용 권장.
2. **GitHub repo가 연결돼야 한다.**
   ```bash
   gh repo view --json nameWithOwner,defaultBranchRef
   ```
   결과가 없으면 사용자에게 repo 연결 필요 안내.
3. **gh 인증이 돼 있어야 한다.** `gh auth status`로 확인. 인증 안 됐으면 사용자에게 `! gh auth login` 안내 후 중단.

## 워크플로우 (체크리스트)

다음 단계를 TodoWrite로 트래킹하며 순차 실행:

1. **요건 정리** — Context / 결정사항 / 데이터 모델 / 보안 / UX를 단일 마크다운으로 정리 (plan file이 있으면 그곳, 없으면 메모)
2. **Phase 분할 제안** — 3·4·6단계 옵션 제시. `AskUserQuestion`으로 합의
3. **Phase별 의존 관계** 도출 — 어떤 Phase가 어떤 Phase에 의존하는지 명확히
4. **라벨 정비** — `gh label list`로 기존 확인 후 부족한 것 `gh label create`
5. **이슈 본문 6개 작성** — 아래 9개 섹션 템플릿 따라 매우 상세히. `/tmp/issue-phase-N.md`로 저장
6. **이슈 생성** — `gh issue create --title ... --body-file /tmp/issue-phase-N.md --label "phase-N,..."`. 생성 후 이슈 번호 수집
7. **placeholder 치환** — 본문에 `#PHASE_N` 같은 placeholder를 실제 번호로 sed 치환 후 `gh issue edit --body-file`로 일괄 갱신
8. **프로젝트 문서 반영** — `docs/PLAN.md` (페이지/기능 명세 + 로드맵), `docs/ARCHITECTURE.md` (스키마·Rules·디렉토리 구조·API), 이슈 번호 링크 포함
9. **결과 보고** — 생성된 이슈 URL 목록 + 다음 단계 안내

## 이슈 본문 템플릿 (9개 섹션)

각 Phase 이슈는 **이것만 보고도 코드 작성 가능**해야 한다. 누락 시 즉시 사용자 컨텍스트로 돌아가 보강.

```markdown
## 개요
이 Phase의 목표 1-2문단. 무엇이 끝나면 결과물로 무엇이 가능해지는지.

## 사전 컨텍스트
### 기능 전체 요약
이 이슈만 봐도 전체 그림 이해되도록 2-3문장 압축.

### 사전 확정 사항
| 항목 | 결정 |
|---|---|
... (브레인스토밍에서 합의된 핵심 결정사항 표)

### 의존 관계
- 선행: Phase N (#이슈번호) — 무엇이 필요한지
- 후행: 어느 Phase가 이 결과물에 의존하는지

## 변경/추가 파일 목록
### 신규
- `path/to/file.ts` — 1줄 역할
### 수정
- `path/to/existing.ts` — 1줄 변경 사항

## 상세 명세
- 타입 정의 (TypeScript 코드 블록)
- 함수 시그니처
- UI 컴포넌트의 props·상태·이벤트
- 사용자 인터랙션 흐름
- **재사용해야 할 기존 헬퍼·컴포넌트** (경로 명시)
- 코드 예시 (필요 부분은 거의 그대로 복붙 가능 수준)

## 디자인 가이드
- 색상·간격·반응형 분기·아이콘
- 기존 디자인 토큰·유틸리티 클래스
- 모바일 우선 여부

## Acceptance Criteria
- [ ] 구체적이고 측정 가능한 검증 항목
- [ ] 빈도: 각 핵심 동작당 1개 이상

## 검증 시나리오
번호 매긴 단계별 수동 테스트 방법. 정상 흐름 + 엣지 케이스 + 보안 검증.

## 비-범위 (Out of scope)
이 Phase에서 다루지 않는 것 (다음 Phase 또는 향후 작업으로 미루기)

## 참고
- 관련 문서: docs/PLAN.md, docs/ARCHITECTURE.md
- 관련 Phase: #이슈번호들
- 재사용할 기존 코드 경로
```

## 라벨 컨벤션

- `invite-flow` 같은 **트랙 라벨**: 같은 기능군 전체를 묶음 (색상은 트랙 핵심 컬러)
- `phase-1` ~ `phase-N`: 단계 라벨 (그라데이션 색상 추천)
- 기본 라벨 (`enhancement`, `bug` 등)도 병행 사용
- `gh label create NAME --color HEX --description "..."` (색상은 # 빼고 6자리)

## 자주 하는 실수 (Anti-patterns)

| 잘못 | 올바름 |
|---|---|
| 한 이슈에 여러 Phase 묶음 | Phase = PR 단위. 1개 이슈에 1 Phase |
| "기획자랑 다시 확인 필요" 같은 미완 마커 | 이슈 생성 전에 모든 결정 끝내기. 미정이면 placeholder + AskUserQuestion |
| "방금 우리 대화한 것처럼" 같은 컨텍스트 의존 표현 | 이슈만 봐도 이해되도록 자체 컨텍스트 포함 |
| 코드 예시 없이 "이런 식으로" | 핵심 함수·컴포넌트는 거의 복붙 수준 예시 포함 |
| AC가 "잘 동작한다" 같은 모호함 | 측정 가능한 조건으로 구체화 |
| 의존성을 #issue 링크 없이 단순 텍스트 | placeholder `#PHASE_N` 두고 모든 이슈 생성 후 일괄 치환 |
| 라벨 없이 이슈 생성 | 모든 이슈에 트랙 라벨 + Phase 라벨 |
| 문서(PLAN.md/ARCHITECTURE.md) 미반영 | 이슈 생성 후 문서에 트래킹 링크 추가 |

## 실행 패턴 예시

### Phase 분할 옵션 제시

```
AskUserQuestion: Phase를 몇 단계로 나눌까요?
- 3단계 (대단위): 관리자 / 공개 / 통계 — 이슈 적지만 PR 큼
- 4단계 (균형): 기반 / 공개 / 신청흐름 / 통계
- 6단계 (세분화, 추천): 기반 / 관리자CRUD / 정보페이지 / 신청+API / 감사+후원 / 통계
```

### 이슈 일괄 생성

```bash
# 1. 본문 파일 작성
# /tmp/issue-phase-1.md ~ /tmp/issue-phase-6.md

# 2. 순차 생성, 이슈 번호 수집
for n in 1 2 3 4 5 6; do
  gh issue create --title "[Phase $n] ..." --body-file /tmp/issue-phase-$n.md --label "phase-$n,트랙라벨,enhancement"
done

# 3. placeholder 치환 (모든 이슈 번호 수집 후)
for n in 1 2 3 4 5 6; do
  sed -i '' -e 's/#PHASE_1/#실제번호1/g' -e 's/#PHASE_2/#실제번호2/g' ... /tmp/issue-phase-$n.md
done

# 4. 본문 갱신
for n in 1 2 3 4 5 6; do
  gh issue edit 실제번호N --body-file /tmp/issue-phase-$n.md
done
```

### 문서 반영 (예시)

`docs/PLAN.md` 로드맵 섹션에:

```markdown
### 진행 중 (Phase별 GitHub 이슈)

- 기능명 (`트랙라벨` 라벨, 이슈 #N1~#N6)
  - Phase 1 (#N1) 제목
  - Phase 2 (#N2) 제목
  ...
```

`docs/ARCHITECTURE.md`:
- 새 컬렉션 스키마 (TypeScript 인터페이스)
- 보안 규칙 표에 행 추가
- 디렉토리 구조 트리에 새 폴더 추가
- API 라우트 섹션에 새 엔드포인트

## 종료 조건

다음이 모두 충족되면 스킬 종료:
- ✅ 모든 Phase 이슈가 GitHub에 생성됨
- ✅ 이슈 본문에 placeholder 없음 (`grep "#PHASE_" /tmp/issue-phase-*.md` 결과 0)
- ✅ 이슈끼리 상호 참조 링크가 실제 번호로 채워짐
- ✅ `docs/PLAN.md`, `docs/ARCHITECTURE.md`에 이슈 번호 트래킹 추가
- ✅ 사용자에게 이슈 URL 6개와 다음 단계 안내가 전달됨

**이 스킬의 결과물은 "구현이 시작될 준비"가 된 이슈 묶음이다.** 실제 구현은 이 스킬의 범위 밖.
