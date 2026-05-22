# 제작진(스태프) 소개 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정기공연 공연 등록 폼에서 제작진(직책+멤버, 멤버별 선택 사진)을 입력하고, 정보 페이지에 적응형(사진 카드/텍스트)으로 표시한다.

**Architecture:** 기존 `invites` 도메인의 배역(`InviteRole`)·캐스팅 에디터 패턴을 그대로 차용한다. `Invite`에 선택 필드 `staff`를 추가하고, 관리자 `StaffEditor`(중첩 편집)와 공개 `StaffSection`(서버 컴포넌트) 두 컴포넌트를 신규로 만든다. Firestore 규칙은 변경하지 않는다.

**Tech Stack:** Next.js 16 / React 19 / TypeScript strict / TailwindCSS 4 / Firebase Firestore

> **테스트 참고:** 이 저장소에는 단위 테스트 인프라(jest/vitest 등)가 없다. CLAUDE.md는 TypeScript strict 준수를 요구한다. 따라서 각 태스크의 검증은 `npx tsc --noEmit`(타입체크) + `npm run lint`(ESLint)로 하며, 마지막 태스크에서 실행 중인 앱으로 수동 검증한다. 테스트 프레임워크를 새로 도입하지 않는다.

설계 문서: `docs/superpowers/specs/2026-05-22-invite-staff-section-design.md`

---

### Task 1: 데이터 모델 — `InviteStaff` 타입 추가

**Files:**
- Modify: `lib/invites/types.ts`

- [ ] **Step 1: `InviteRole` 인터페이스 바로 다음에 제작진 타입 추가**

`lib/invites/types.ts`에서 `InviteRole` 인터페이스의 닫는 `}` (다음 줄이 빈 줄, 그 다음이 `/**\n * 회차별 캐스팅...` 주석) 바로 뒤에 아래 두 인터페이스를 삽입한다.

찾을 위치 — 아래 블록의 끝(`}` 다음 빈 줄):

```ts
export interface InviteRole {
  id: string; // 안정적 식별자 (crypto.randomUUID)
  name: string; // 배역명
  description: string; // 배역 설명
  order?: number; // 표시 순서 (선택)
}
```

그 빈 줄 다음에 삽입:

```ts
/**
 * 제작진(스태프) 멤버 한 명.
 */
export interface InviteStaffMember {
  name: string;
  /** 정적 파일명 (선택). 경로: /invites/{year}-{round}/staff/{photoFile} */
  photoFile?: string;
}

/**
 * 제작진 한 직책 (예: 연출, 분장). 멤버 1명 이상.
 * 공연 전체 공통이며 회차와 무관.
 */
export interface InviteStaff {
  id: string; // crypto.randomUUID()
  role: string; // 직책명
  members: InviteStaffMember[];
}
```

- [ ] **Step 2: `Invite` 인터페이스에 `staff` 필드 추가**

`Invite` 인터페이스에서 `roles: InviteRole[];` 줄 다음에 한 줄 추가한다.

변경 전:

```ts
  roles: InviteRole[]; // 배역 마스터 (공연 전체 공통). 레거시 데이터는 폼 저장 시 자동 채워짐
  rounds: InviteRound[];
```

변경 후:

```ts
  roles: InviteRole[]; // 배역 마스터 (공연 전체 공통). 레거시 데이터는 폼 저장 시 자동 채워짐
  /** 제작진. 선택 필드 — staff 없는 기존 공연 데이터와 호환. */
  staff?: InviteStaff[];
  rounds: InviteRound[];
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

- [ ] **Step 4: 커밋**

```bash
git add lib/invites/types.ts
git commit -m "$(cat <<'EOF'
feat(invites): 제작진(InviteStaff) 데이터 모델 추가

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 영속성 — `upsertInvite`에 staff 저장

**Files:**
- Modify: `lib/invites/client.ts`

- [ ] **Step 1: `InviteStaff` 타입 import 추가**

`lib/invites/client.ts`의 types import 줄을 수정한다.

변경 전:

```ts
import type { Invite, InviteRegistration, InviteRound, InviteStats, InviteSupporter } from './types';
```

변경 후:

```ts
import type { Invite, InviteRegistration, InviteRound, InviteStaff, InviteStats, InviteSupporter } from './types';
```

- [ ] **Step 2: `InviteWriteInput`에 `staff` 필드 추가**

`InviteWriteInput` 인터페이스에서 `roles: Invite['roles'];` 줄 다음에 한 줄 추가한다.

변경 전:

```ts
  roles: Invite['roles'];
  rounds: Array<Omit<InviteRound, 'startAt'> & { startAtMs: number }>;
```

변경 후:

```ts
  roles: Invite['roles'];
  /** 제작진. 폼에서 항상 배열로 전달되지만 호환을 위해 optional. */
  staff?: InviteStaff[];
  rounds: Array<Omit<InviteRound, 'startAt'> & { startAtMs: number }>;
```

- [ ] **Step 3: `upsertInvite`에 staff 정제 로직 추가**

`upsertInvite` 함수에서 `rounds` 상수 선언(아래 블록) 바로 다음에 `staff` 상수를 추가한다.

찾을 위치 — 이 블록의 끝(`}));` 다음):

```ts
  const rounds: InviteRound[] = input.rounds.map(({ startAtMs, ...rest }) => ({
    ...rest,
    // 새 형식으로 저장: 레거시 role/description 필드는 제거
    casting: rest.casting.map(c => ({
      roleId: c.roleId,
      actorName: c.actorName,
      ...(c.photoFile ? { photoFile: c.photoFile } : {}),
    })),
    startAt: Timestamp.fromMillis(startAtMs),
  }));
```

그 다음에 삽입:

```ts
  // 제작진 정제: 빈 직책·빈 멤버 제거, photoFile 빈 값은 필드 자체를 생략
  const staff: InviteStaff[] = (input.staff ?? [])
    .map(s => ({
      id: s.id,
      role: s.role.trim(),
      members: s.members
        .filter(m => m.name.trim())
        .map(m => ({
          name: m.name.trim(),
          ...(m.photoFile && m.photoFile.trim() ? { photoFile: m.photoFile.trim() } : {}),
        })),
    }))
    .filter(s => s.role && s.members.length > 0);
```

- [ ] **Step 4: setDoc(신규 생성) 본문에 `staff` 기록**

`if (isNew) {` 분기의 `setDoc(ref, { ... })` 객체에서 `roles: input.roles,` 줄 다음에 `staff,`를 추가한다.

변경 전:

```ts
      roles: input.roles,
      rounds,
```

변경 후:

```ts
      roles: input.roles,
      staff,
      rounds,
```

> 주의: 이 변경은 `setDoc` 호출(신규 생성) 안의 객체에만 적용한다. 다음 Step에서 `updateDoc`도 따로 수정한다.

- [ ] **Step 5: updateDoc(수정) 본문에 `staff` 기록**

`else { await updateDoc(ref, { ... })` 객체에서 `roles: input.roles,` 줄 다음에 `staff,`를 추가한다. (Step 4와 동일한 두 줄이 파일에 한 번 더 등장한다 — `updateDoc` 쪽이다.)

변경 전:

```ts
      roles: input.roles,
      rounds,
```

변경 후:

```ts
      roles: input.roles,
      staff,
      rounds,
```

- [ ] **Step 6: 타입체크 + 린트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `npm run lint`
Expected: 새 에러 없음

- [ ] **Step 7: 커밋**

```bash
git add lib/invites/client.ts
git commit -m "$(cat <<'EOF'
feat(invites): upsertInvite에 제작진(staff) 저장 추가

빈 직책·멤버 정제 후 신규/수정 양쪽 본문에 기록.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 관리자 — `StaffEditor` 컴포넌트 신규

**Files:**
- Create: `app/admin/invites/_components/StaffEditor.tsx`

- [ ] **Step 1: `StaffEditor.tsx` 파일 생성**

`app/admin/invites/_components/StaffEditor.tsx`를 아래 내용 그대로 생성한다. `RolesEditor.tsx`(평면 목록) + `CastingEditor.tsx`(인덱스 key) 패턴을 따른다.

```tsx
'use client';

import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { InviteStaff, InviteStaffMember } from '@/lib/invites/types';

interface Props {
  value: InviteStaff[];
  onChange: (next: InviteStaff[]) => void;
  inviteId: string; // "2026-1" 등, 사진 경로 안내용
}

function newStaffId(): string {
  // 브라우저 crypto.randomUUID(). 의존성 추가 없이 안정적인 ID 생성.
  return crypto.randomUUID();
}

function emptyMember(): InviteStaffMember {
  return { name: '', photoFile: '' };
}

export default function StaffEditor({ value, onChange, inviteId }: Props) {
  const updateStaff = (index: number, patch: Partial<InviteStaff>) => {
    onChange(value.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeStaff = (index: number) => onChange(value.filter((_, i) => i !== index));

  const addStaff = () => {
    onChange([...value, { id: newStaffId(), role: '', members: [emptyMember()] }]);
  };

  const updateMember = (
    staffIndex: number,
    memberIndex: number,
    patch: Partial<InviteStaffMember>,
  ) => {
    const members = value[staffIndex].members.map((m, i) =>
      i === memberIndex ? { ...m, ...patch } : m,
    );
    updateStaff(staffIndex, { members });
  };

  const addMember = (staffIndex: number) => {
    updateStaff(staffIndex, { members: [...value[staffIndex].members, emptyMember()] });
  };

  const removeMember = (staffIndex: number, memberIndex: number) => {
    updateStaff(staffIndex, {
      members: value[staffIndex].members.filter((_, i) => i !== memberIndex),
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        연출·분장·강사 등 제작진을 직책별로 추가하세요. 사진은 선택이며,{' '}
        <code>/public/invites/{inviteId}/staff/</code> 폴더에 파일을 넣고 파일명만 입력합니다. (예:{' '}
        <code>lee.jpg</code>)
      </p>

      {value.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
          제작진이 없습니다. 아래 버튼을 눌러 추가하세요.
        </p>
      )}

      <ul className="space-y-3">
        {value.map((staff, si) => (
          <li key={staff.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={staff.role}
                onChange={e => updateStaff(si, { role: e.target.value })}
                placeholder="직책 (예: 연출)"
                maxLength={40}
                className="input flex-1"
                required
              />
              <button
                type="button"
                onClick={() => removeStaff(si)}
                className="px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                aria-label="직책 삭제"
              >
                <FiTrash2 />
              </button>
            </div>

            <ul className="space-y-2 pl-3 border-l-2 border-gray-200">
              {staff.members.map((member, mi) => (
                <li key={mi} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-start">
                  <input
                    type="text"
                    value={member.name}
                    onChange={e => updateMember(si, mi, { name: e.target.value })}
                    placeholder="이름 (예: 이경환)"
                    maxLength={40}
                    className="input"
                    required
                  />
                  <input
                    type="text"
                    value={member.photoFile ?? ''}
                    onChange={e => updateMember(si, mi, { photoFile: e.target.value })}
                    placeholder="사진 파일명 (선택)"
                    maxLength={100}
                    className="input"
                  />
                  <button
                    type="button"
                    onClick={() => removeMember(si, mi)}
                    disabled={staff.members.length <= 1}
                    className="px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0 disabled:text-gray-300 disabled:hover:bg-transparent"
                    aria-label="멤버 삭제"
                  >
                    <FiTrash2 />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => addMember(si)}
              className="ml-3 text-sm text-[#0066B3] hover:underline flex items-center gap-1"
            >
              <FiPlus /> 이름 추가
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addStaff}
        className="w-full py-2 text-sm text-[#0066B3] border border-dashed border-[#0066B3]/40 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-1"
      >
        <FiPlus /> 제작진 추가
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 타입체크 + 린트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `npm run lint`
Expected: 새 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add app/admin/invites/_components/StaffEditor.tsx
git commit -m "$(cat <<'EOF'
feat(invites): 관리자 제작진 편집 컴포넌트 StaffEditor 추가

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 관리자 — `InviteForm`에 제작진 섹션 통합

**Files:**
- Modify: `app/admin/invites/_components/InviteForm.tsx`

- [ ] **Step 1: import 추가**

`import RolesEditor from './RolesEditor';` 줄 다음에 StaffEditor import를 추가한다.

변경 전:

```ts
import RolesEditor from './RolesEditor';
import SponsorAccountEditor from './SponsorAccountEditor';
```

변경 후:

```ts
import RolesEditor from './RolesEditor';
import StaffEditor from './StaffEditor';
import SponsorAccountEditor from './SponsorAccountEditor';
```

`InviteStaff` 타입도 types import 목록에 추가한다.

변경 전:

```ts
import {
  OPTIONAL_FIELD_LABELS,
  type CastingEntry,
  type Invite,
  type InviteRole,
  type OptionalFieldKey,
} from '@/lib/invites/types';
```

변경 후:

```ts
import {
  OPTIONAL_FIELD_LABELS,
  type CastingEntry,
  type Invite,
  type InviteRole,
  type InviteStaff,
  type OptionalFieldKey,
} from '@/lib/invites/types';
```

- [ ] **Step 2: `DEFAULT_INVITE`에 `staff` 추가**

`DEFAULT_INVITE` 객체에서 `roles: [],` 줄 다음에 `staff: [],`를 추가한다.

변경 전:

```ts
  roles: [],
  rounds: [],
```

변경 후:

```ts
  roles: [],
  staff: [],
  rounds: [],
```

- [ ] **Step 3: `toForm()` 반환 객체에 `staff` 추가**

`toForm` 함수의 `return { ... }` 객체에서 `roles,` 줄 다음에 `staff: invite.staff ?? [],`를 추가한다.

변경 전:

```ts
    roles,
    rounds,
```

변경 후:

```ts
    roles,
    staff: invite.staff ?? [],
    rounds,
```

- [ ] **Step 4: handleSubmit에 제작진 검증 추가**

`handleSubmit`의 배역 검증 블록(아래) 다음에 제작진 검증을 추가한다.

찾을 위치 — 이 블록 다음:

```ts
    if (form.roles.some(r => !r.name.trim())) {
      return setError('배역 이름을 모두 입력해주세요. (불필요한 행은 삭제)');
    }
```

그 다음에 삽입:

```ts
    const staffList: InviteStaff[] = form.staff ?? [];
    if (staffList.some(s => !s.role.trim())) {
      return setError('제작진 직책을 모두 입력해주세요. (불필요한 직책은 삭제)');
    }
    if (staffList.some(s => s.members.some(m => !m.name.trim()))) {
      return setError('제작진 이름을 모두 입력해주세요. (불필요한 멤버는 삭제)');
    }
```

- [ ] **Step 5: 제작진 Section UI 추가**

"배역" Section과 "회차" Section 사이에 제작진 Section을 추가한다.

변경 전:

```tsx
      <Section title="배역 (공연 전체 공통)">
        <RolesEditor value={form.roles} onChange={v => update('roles', v)} />
      </Section>

      <Section title="회차">
```

변경 후:

```tsx
      <Section title="배역 (공연 전체 공통)">
        <RolesEditor value={form.roles} onChange={v => update('roles', v)} />
      </Section>

      <Section title="제작진">
        <StaffEditor
          value={form.staff ?? []}
          onChange={v => update('staff', v)}
          inviteId={inviteIdPreview}
        />
      </Section>

      <Section title="회차">
```

> 참고: `InviteWriteInput`의 spread(`...form`)로 `staff`가 자동 포함되므로 `handleSubmit`의 `input` 객체 구성은 수정 불필요하다. `upsertInvite`가 `input.staff ?? []`로 정제한다.

- [ ] **Step 6: 타입체크 + 린트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `npm run lint`
Expected: 새 에러 없음

- [ ] **Step 7: 커밋**

```bash
git add app/admin/invites/_components/InviteForm.tsx
git commit -m "$(cat <<'EOF'
feat(invites): 공연 등록 폼에 제작진 섹션 통합

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: 공개 — `StaffSection` 컴포넌트 신규

**Files:**
- Create: `app/invite/[year]/[round]/_components/StaffSection.tsx`

- [ ] **Step 1: `StaffSection.tsx` 파일 생성**

`app/invite/[year]/[round]/_components/StaffSection.tsx`를 아래 내용 그대로 생성한다. `CastingSection.tsx`처럼 서버 컴포넌트다.

```tsx
import Image from 'next/image';
import type { InviteStaff } from '@/lib/invites/types';

interface Props {
  staff: InviteStaff[];
  inviteId: string;
}

/**
 * 제작진 소개 섹션. 공개 정보 페이지에서 캐스팅 섹션 아래에 표시.
 * - 사진을 가진 멤버가 있는 직책 → 사진 카드
 * - 사진 없는 직책 → "직책  이름, 이름" 텍스트 한 줄
 * 제작진이 없으면 아무것도 렌더하지 않는다.
 */
export default function StaffSection({ staff, inviteId }: Props) {
  const groups = staff.filter(s => s.role.trim() && s.members.length > 0);
  if (groups.length === 0) return null;

  return (
    <section className="px-5 py-8 bg-gray-50">
      <h2 className="text-lg font-bold text-gray-900 mb-3">제작진</h2>
      <div className="space-y-5">
        {groups.map(group => {
          const hasPhoto = group.members.some(m => m.photoFile);

          if (!hasPhoto) {
            return (
              <div key={group.id} className="flex gap-3 text-sm">
                <span className="font-semibold text-[#0066B3] shrink-0">{group.role}</span>
                <span className="text-gray-800">
                  {group.members.map(m => m.name).join(', ')}
                </span>
              </div>
            );
          }

          return (
            <div key={group.id}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{group.role}</h3>
              <ul className="flex flex-wrap gap-3">
                {group.members.map((m, i) => (
                  <li key={i} className="w-24 text-center">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-200">
                      {m.photoFile ? (
                        <Image
                          src={`/invites/${inviteId}/staff/${m.photoFile}`}
                          alt={m.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                          사진 없음
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-900">{m.name}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 타입체크 + 린트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `npm run lint`
Expected: 새 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add "app/invite/[year]/[round]/_components/StaffSection.tsx"
git commit -m "$(cat <<'EOF'
feat(invites): 공개 제작진 표시 컴포넌트 StaffSection 추가

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: 공개 페이지 통합 + 전체 검증

**Files:**
- Modify: `app/invite/[year]/[round]/page.tsx`

- [ ] **Step 1: import 추가**

`import CastingSection from './_components/CastingSection';` 줄 다음에 StaffSection import를 추가한다.

변경 전:

```ts
import CastingSection from './_components/CastingSection';
import ApplyCTA from './_components/ApplyCTA';
```

변경 후:

```ts
import CastingSection from './_components/CastingSection';
import StaffSection from './_components/StaffSection';
import ApplyCTA from './_components/ApplyCTA';
```

- [ ] **Step 2: `StaffSection`을 캐스팅 섹션 아래에 배치**

`<CastingSection .../>` 줄 다음에 `<StaffSection .../>`를 추가한다.

변경 전:

```tsx
        <CastingSection rounds={invite.rounds} roles={invite.roles ?? []} inviteId={invite.id} />
        <RoundsSection rounds={invite.rounds} nowMs={nowMs} />
```

변경 후:

```tsx
        <CastingSection rounds={invite.rounds} roles={invite.roles ?? []} inviteId={invite.id} />
        <StaffSection staff={invite.staff ?? []} inviteId={invite.id} />
        <RoundsSection rounds={invite.rounds} nowMs={nowMs} />
```

- [ ] **Step 3: 타입체크 + 린트 + 빌드**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `npm run lint`
Expected: 새 에러 없음

Run: `npm run build`
Expected: 빌드 성공 (`invite/[year]/[round]` 라우트 컴파일 성공)

- [ ] **Step 4: 수동 검증 (실행 중인 앱)**

`npm run dev`로 앱을 띄우고 아래를 확인한다:

1. **관리자 입력** — `/admin/invites`에서 공연 수정 진입 → "제작진" 섹션 확인
   - "제작진 추가" → 직책 입력(예: `연출`) → 이름 입력(예: `이경환`) → 사진 파일명 비워둠
   - 같은 직책에 "이름 추가"로 멤버 2명 이상 추가 가능 확인
   - 멤버 1명만 남으면 멤버 삭제 버튼 비활성(회색) 확인
   - 사진 카드 검증용: 한 직책의 멤버에 사진 파일명 입력(해당 파일을 `public/invites/{id}/staff/`에 미리 배치)
   - 저장 → 에러 없이 저장됨
2. **재진입** — 같은 공연 수정 폼을 다시 열어 입력한 제작진이 그대로 보이는지 확인
3. **공개 페이지** — `/invite/{year}/{round}` 진입 (해당 공연 `isPublished=true`)
   - 캐스팅 섹션 바로 아래 "제작진" 섹션 표시
   - 사진 없는 직책 → `직책  이름, 이름` 텍스트 한 줄
   - 사진 있는 직책 → 사진 카드 (사진 없는 멤버는 "사진 없음" 플레이스홀더)
4. **빈 상태** — 제작진이 0개인 공연의 공개 페이지에서 제작진 섹션이 아예 안 보이는지 확인
5. **모바일 폭** — DevTools 375px에서 레이아웃 깨짐 없는지 확인

- [ ] **Step 5: 커밋**

```bash
git add "app/invite/[year]/[round]/page.tsx"
git commit -m "$(cat <<'EOF'
feat(invites): 공개 정보 페이지에 제작진 섹션 노출

캐스팅 섹션 아래에 StaffSection 배치. 이슈 #31 완료.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 완료 후

- 이슈 #31 (`[invite] 스탭(제작진) 소개 섹션 추가`)을 닫는다.
- `superpowers:finishing-a-development-branch` 스킬로 `feature/invite-staff-section` 브랜치 통합 방식을 결정한다.
