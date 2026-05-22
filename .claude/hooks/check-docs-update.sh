#!/bin/bash
# Claude Code PreToolUse hook: git push 전에 docs 업데이트 필요 여부 체크
# $CLAUDE_TOOL_INPUT 에 Bash 명령어가 JSON으로 전달됨

# git push 명령인지 확인 (stdin JSON 또는 env 변수 둘 다 지원)
input=$(cat - 2>/dev/null)
combined="$input$CLAUDE_TOOL_INPUT"
if ! echo "$combined" | grep -q 'git push'; then
  exit 0
fi

# 명령 본문에 '[skip-docs-check]' 마커가 있으면 의도적 우회 — docs 검사 생략
if echo "$combined" | grep -q '\[skip-docs-check\]'; then
  exit 0
fi

cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

# 마지막 푸시 이후 변경된 파일 감지
remote_branch=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)
if [ -z "$remote_branch" ]; then
  remote_branch="origin/main"
fi

changed_files=$(git diff --name-only "$remote_branch"...HEAD 2>/dev/null)
if [ -z "$changed_files" ]; then
  exit 0
fi

# docs 및 설정 파일 제외, 소스 코드만 필터
src_changes=$(echo "$changed_files" | grep -v '^docs/' | grep -v '^\.' | grep -v '^node_modules/' | grep -E '\.(tsx?|json|css|yml)$' | sort -u)

if [ -z "$src_changes" ]; then
  exit 0
fi

# 순수 스타일 변경(.css만)이면 docs 갱신 요구 안 함 — 효과 미세 조정 등
non_css_changes=$(echo "$src_changes" | grep -vE '\.css$')
if [ -z "$non_css_changes" ]; then
  exit 0
fi

# 변경 유형 분류
has_component_change=$(echo "$src_changes" | grep -c 'components/')
has_page_change=$(echo "$src_changes" | grep -c 'app/')
has_type_change=$(echo "$src_changes" | grep -c 'types/')
has_context_change=$(echo "$src_changes" | grep -c 'contexts/')
has_lib_change=$(echo "$src_changes" | grep -c 'lib/')
has_api_change=$(echo "$src_changes" | grep -c 'api/')
has_config_change=$(echo "$src_changes" | grep -cE '(package\.json|tsconfig|next\.config|tailwind)')
has_deploy_change=$(echo "$src_changes" | grep -c '.github/')

need_plan=false
need_arch=false

if [ "$has_page_change" -gt 0 ] || [ "$has_component_change" -gt 0 ]; then
  need_plan=true
fi

if [ "$has_type_change" -gt 0 ] || [ "$has_context_change" -gt 0 ] || [ "$has_lib_change" -gt 0 ] || [ "$has_api_change" -gt 0 ] || [ "$has_config_change" -gt 0 ] || [ "$has_deploy_change" -gt 0 ]; then
  need_arch=true
fi

if ! $need_plan && ! $need_arch; then
  exit 0
fi

# 이미 docs가 함께 수정되었는지 확인
docs_changed=$(echo "$changed_files" | grep '^docs/' | sort -u)
plan_updated=$(echo "$docs_changed" | grep -c 'PLAN.md')
arch_updated=$(echo "$docs_changed" | grep -c 'ARCHITECTURE.md')

msg=""

if $need_plan && [ "$plan_updated" -eq 0 ]; then
  msg="${msg}[docs 업데이트 필요] 페이지/컴포넌트 변경이 감지되었습니다. docs/PLAN.md를 확인하고 필요시 업데이트한 뒤 푸시해주세요.\n"
fi

if $need_arch && [ "$arch_updated" -eq 0 ]; then
  msg="${msg}[docs 업데이트 필요] 타입/아키텍처/API/설정 변경이 감지되었습니다. docs/ARCHITECTURE.md를 확인하고 필요시 업데이트한 뒤 푸시해주세요.\n"
fi

if [ -n "$msg" ]; then
  echo -e "$msg"
  echo "변경된 소스 파일:"
  echo "$src_changes" | head -15
  exit 2
fi
