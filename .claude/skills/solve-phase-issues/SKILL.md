---
name: solve-phase-issues
description: Use when the user wants to sequentially implement multiple GitHub issues (e.g. phase-1 ~ phase-N), each followed by verification, code review, commit/push, issue comment, and close. Triggers on phrases like "순차적으로 이슈 하나씩 해결해줘", "Phase별로 차례로 구현해줘", "이슈 다 처리해줘".
---

# 순차적 Phase 이슈 해결 워크플로우

여러 개의 Phase 이슈(예: `invite-flow` 트랙의 #5~#10)를 받아 **하나씩 완결**하며 순서대로 처리한다. 한 이슈가 완전히 닫힌 뒤에야 다음 이슈로 이동.

## 언제 사용하나

- `brainstorm-to-phase-issues` 등으로 Phase별 이슈가 이미 생성된 상태
- 사용자가 "순차적으로 해결", "차례로 구현", "이슈 다 닫아 달라"고 요청
- Phase 간 의존성이 있어 병렬 실행이 위험할 때 (한 Phase의 산출물에 다음 Phase가 의존)

## 선행 조건

1. **이슈 목록 확보**: `gh issue list --label 트랙라벨 --json number,title --jq '...'`
2. **clean working tree 권장**: `git status --short` 확인. 미커밋 변경이 있으면 먼저 처리
3. **현재 브랜치 확인**: `git branch --show-current`. main 직접 push 정책 확인 — 사용자가 main 푸시를 허용했는지, feature 브랜치를 만들지
4. **gh 인증**: `gh auth status`

## 이슈 1개당 실행 단계 (체크리스트)

각 이슈마다 다음을 TodoWrite로 트래킹:

1. **이슈 본문 읽기** — `gh issue view N --json title,body,labels` 로 최신 상태 로드 (이슈가 수정됐을 수 있음)
2. **선행 의존 확인** — 본문의 "선행: Phase X (#Y)" 라벨된 이슈가 closed인지 확인. 안 닫혔으면 중단
3. **기존 코드 탐색** — 이슈의 "참고" 섹션에 명시된 재사용 자산 확인. `Read`/`Bash grep`로 위치·시그니처 파악
4. **구현** — "변경/추가 파일 목록"과 "상세 명세"를 그대로 따라 작성. 코드 예시는 거의 복붙 가능 수준이지만 프로젝트 컨벤션에 맞춰 조정
5. **자체 점검** — 이슈의 "Acceptance Criteria" 체크리스트를 한 줄씩 확인하며 빠진 항목 없는지 체크. 코드에 임시 코드, console.log, TODO 마커 남아있지 않은지
6. **빌드·타입체크·린트** — 프로젝트가 정의한 명령으로 실행
   ```bash
   npx tsc --noEmit         # 타입체크
   npm run lint             # 린트 (스크립트 있으면)
   npm run build            # 빌드 (스크립트 있으면)
   ```
7. **코드 리뷰** — `superpowers:code-reviewer` 서브에이전트를 띄워 변경 diff 검토. 결과의 critical/major 이슈는 닫기 전 반드시 수정
8. **이슈 수정 (필요 시)** — 리뷰에서 나온 지적 사항 반영 → 다시 5번부터
9. **커밋** — Conventional Commit 스타일 + 한국어 메시지. 본문에 "Closes #N" 라인으로 자동 종료 트리거
   ```bash
   git add 변경된파일들
   git commit -m "$(cat <<'EOF'
   feat: Phase N 짧은 제목

   - 변경 요약 bullet
   - ...

   Closes #N
   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   EOF
   )"
   ```
10. **푸시** — `git push`. main 외 브랜치면 `git push -u origin 브랜치명`
11. **이슈 코멘트** — 해결 방법을 정리해 `gh issue comment N --body-file /tmp/comment-phase-N.md`. 코멘트에 포함:
    - 한 줄 요약
    - 생성/수정 파일 목록
    - 핵심 구현 포인트 3-5개
    - 검증 결과 (타입체크 OK, AC N/N 통과 등)
    - 관련 커밋 SHA
12. **이슈 닫기** — `gh issue close N` (이미 "Closes #N" 커밋이 머지/푸시되어 닫혔으면 skip 또는 확인만)
13. **다음 이슈로 이동** — 1번부터 반복

## 주요 결정 포인트

### main 직접 푸시 vs feature 브랜치

| 상황 | 권장 |
|---|---|
| 1인 프로젝트, 빠른 반복 | main 직접 푸시 (사용자가 허용한 경우만) |
| 팀 협업, PR 리뷰 필요 | `feature/phase-N-...` 브랜치 + `gh pr create` |
| 본 워크플로우 기본값 | **사용자가 명시적으로 허용했으면 main 푸시**. 명시 안 됐으면 묻기 |

### 코드 리뷰 강도

| 변경 유형 | 리뷰 수준 |
|---|---|
| 새 파일 (UI/로직 신규) | full review (`code-reviewer` 에이전트) |
| 단순 텍스트·문서 | 셀프 리뷰만 |
| Firestore Rules 변경 | 보안 리뷰 필수 (`security-review` 또는 직접 시뮬레이터 시나리오 확인) |

### Acceptance Criteria 검증 방식

- 컴파일·타입체크로 검증 가능한 항목 → 자동
- UI/UX 항목 → 코드 상으로 충족됨을 확인 (실제 브라우저 테스트는 어려우면 코멘트에 명시)
- DB 동작 항목 → 가능하면 emulator로, 어려우면 코드 경로 추적으로 검증

## 멈춰야 할 때

다음 상황이면 사용자에게 보고 후 중단:

1. **선행 Phase가 닫히지 않았음** — 의존 이슈 먼저 처리
2. **이슈 본문에 모순·누락** — 명세가 실제 코드와 합치되지 않음
3. **빌드/타입체크 실패가 본 Phase 범위 밖** — 다른 코드의 기존 에러
4. **코드 리뷰에서 critical 보안/데이터 손실 위험 발견** — 단순 수정으로 안 끝남
5. **커밋·푸시 권한 거부** — 사용자에게 권한 요청
6. **이슈 본문이 명시한 외부 작업 필요** — Firestore Rules 콘솔 배포, 환경변수 추가, Firestore 인덱스 생성 등 → 사용자에게 위임

## Anti-patterns

| 잘못 | 올바름 |
|---|---|
| 여러 Phase를 한 커밋에 묶기 | Phase 하나당 1커밋 (또는 1 PR), 이슈와 1:1 매칭 |
| AC 미충족 상태로 닫기 | AC 빠짐없이 충족 후 닫기. 못 한 게 있으면 후속 이슈로 분리 |
| 리뷰 없이 main에 푸시 | 최소한 `code-reviewer` 에이전트로 셀프 리뷰 |
| 이슈 코멘트에 "구현 완료" 한 줄 | 위 11번에 명시한 5개 항목 포함 |
| "Closes #N" 누락 | 커밋 메시지에 항상 포함. push 시 자동으로 이슈 닫힘 (또는 머지 시) |
| 이슈 본문 placeholder를 그대로 코드에 복붙 | 코드는 프로젝트 컨벤션·기존 컴포넌트 시그니처에 맞춰 조정 |
| 토큰 사용량 한도 무시 | Phase 1개 끝날 때마다 사용자에게 진행 상황 1-2줄 보고 |

## 종료 조건

- 모든 Phase 이슈가 closed
- 트랙 라벨로 검색했을 때 open 이슈 0개: `gh issue list --label 트랙라벨 --state open` 빈 결과
- main(또는 메인 브랜치)에 모든 Phase 코드가 머지됨
- `docs/` 문서가 최신화됨 (Phase 진행에 따라 변동된 부분 반영)
