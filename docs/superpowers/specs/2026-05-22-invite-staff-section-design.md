# 제작진(스태프) 소개 기능 — 설계 문서

- 날짜: 2026-05-22
- 관련 이슈: #31 ([invite] 스탭(제작진) 소개 섹션 추가)
- 대상 도메인: 정기공연 신청 페이지 (`invite-flow`)

## 배경 / 목표

정기공연 공개 정보 페이지(`/invite/[year]/[round]`)에 제작진(연출·분장·강사 등)을 소개하는 섹션을 추가한다. 관리자는 공연 등록/수정 폼에서 제작진을 입력하고, 관객은 정보 페이지에서 직책·이름(필요 시 사진)을 본다.

현재 `invites` 도메인에는 배우 캐스팅(`InviteRole` + `CastingEntry`)만 모델링돼 있고 제작진 개념이 전혀 없다.

## 요구사항

- 제작진은 **직책(role)** + **멤버(이름들)** 로 구성한다. 한 직책에 1명 또는 여러 명.
- 멤버마다 **사진을 선택적으로** 붙일 수 있다 (연출·강사 등은 사진 노출, 분장 등 크루는 텍스트만).
- 관리자 공연 등록/수정 폼에서 입력한다.
- 정보 페이지에 표시하며, 제작진이 없으면 섹션 자체를 표시하지 않는다.
- 표시 형식: 사진 있는 직책은 사진 카드, 사진 없는 직책은 `직책   이름, 이름` 텍스트 한 줄.

## 데이터 모델

`lib/invites/types.ts` 에 추가:

```ts
/** 제작진 멤버 한 명. */
export interface InviteStaffMember {
  name: string;
  /** 정적 파일명 (선택). 경로: /invites/{year}-{round}/staff/{photoFile} */
  photoFile?: string;
}

/** 제작진 한 직책 (예: 연출, 분장). 멤버 1명 이상. */
export interface InviteStaff {
  id: string; // crypto.randomUUID()
  role: string; // 직책명
  members: InviteStaffMember[];
}
```

`Invite` 인터페이스에 추가:

```ts
/** 제작진. 선택 필드 — staff 없는 기존 공연 데이터와 호환. */
staff?: InviteStaff[];
```

배열 순서가 표시 순서다. 별도 `order` 필드는 두지 않는다.

## 컴포넌트 구조

### 관리자 — `StaffEditor.tsx` (신규)

경로: `app/admin/invites/_components/StaffEditor.tsx`
패턴: `RolesEditor.tsx`(평면 목록) + `RoundEditor.tsx`(중첩 목록) 차용.

Props:

```ts
interface Props {
  value: InviteStaff[];
  onChange: (next: InviteStaff[]) => void;
}
```

UI:

- 직책 블록 목록. 각 블록 = `[직책 입력칸]` `[직책 삭제]` + 멤버 행 목록 + `+ 이름 추가` 버튼
- 각 멤버 행 = `[이름 입력칸]` `[사진 파일명 입력칸]` `[멤버 삭제]`
- 하단 `+ 제작진 추가` 버튼 → 새 직책 블록(빈 멤버 1행 포함) 추가
- 신규 직책 `id` 는 `crypto.randomUUID()`
- 제작진 0개일 때 안내 문구 (RolesEditor 스타일)
- 멤버가 1명만 남았을 때는 `멤버 삭제` 버튼을 비활성화한다 (멤버 0개 직책 방지). 직책 전체를 지우려면 `직책 삭제`를 쓴다.

### 공개 — `StaffSection.tsx` (신규)

경로: `app/invite/[year]/[round]/_components/StaffSection.tsx`
서버 컴포넌트 (`CastingSection.tsx` 와 동일).

Props:

```ts
interface Props {
  staff: InviteStaff[];
  inviteId: string;
}
```

렌더 규칙:

- `staff` 가 비어 있으면 `return null`
- 섹션 컨테이너 + `<h2>제작진</h2>` (캐스팅 섹션과 톤 일관)
- 각 직책에 대해:
  - 멤버 중 `photoFile` 보유자가 1명 이상 → **사진 카드 모드**: 직책명 소제목 + 멤버 카드 행. 카드 = 사진(`/invites/{inviteId}/staff/{photoFile}`, `next/image`) + 이름. 같은 직책 안에서 사진 없는 멤버는 캐스팅과 동일한 회색 플레이스홀더 카드로 표시해 그리드 정렬을 유지한다.
  - 멤버 중 `photoFile` 보유자가 0명 → **텍스트 모드**: `직책`(semibold, `#0066B3`) + 멤버 이름 `, ` 조인. 한 줄, 모바일에서도 한 줄 유지.

### `page.tsx` 통합

`app/invite/[year]/[round]/page.tsx` 에서 `<CastingSection>` 바로 다음에 배치:

```tsx
<CastingSection rounds={invite.rounds} roles={invite.roles ?? []} inviteId={invite.id} />
<StaffSection staff={invite.staff ?? []} inviteId={invite.id} />
```

## 영속성

`lib/invites/client.ts`:

- `InviteWriteInput` 에 `staff?: InviteStaff[]` 추가
- `upsertInvite()` 의 create / update 본문 양쪽에 `staff: input.staff ?? []` 기록
- 저장 시 정제: 빈 직책(직책명 공백)·빈 멤버(이름 공백) 제거, `photoFile` 빈 문자열은 필드 자체를 생략한다 (캐스팅의 `photoFile` 처리와 동일: `...(m.photoFile ? { photoFile: m.photoFile } : {})`)

`InviteForm.tsx`:

- `DEFAULT_INVITE` 에 `staff: []`
- `toForm()` 에 `staff: invite.staff ?? []`
- 배역 섹션과 회차 섹션 사이에 `<Section title="제작진">` + `<StaffEditor>`
- `handleSubmit` 검증: 직책 블록이 있으면 직책명 필수, 멤버 이름에 빈 값이 없어야 함, 멤버 0개 직책 금지 (배역 검증과 동일한 `setError` 스타일)
- `handleSubmit` 의 `InviteWriteInput` 구성에 `staff` 포함

## Firestore 규칙

`/invites/{inviteId}` 의 create/update 는 `isAdmin()` 만 검사하며 필드 화이트리스트가 없다 → **규칙 변경 불필요**.

## 사진 파일 운영

캐스팅 사진과 동일하게 정적 파일로 운영한다. 관리자가 `public/invites/{year}-{round}/staff/` 폴더에 파일을 직접 넣고, 폼에는 파일명만 입력한다. 앱 내 업로드 UI는 없다.

## 비-범위 (Out of scope)

- 앱 내 사진 업로드 기능
- 제작진 순서 드래그 정렬 (배열 순서로 충분)
- 제작진별 설명문 필드 (이름·사진만 표시)

## 영향 파일 요약

| 파일 | 변경 |
|---|---|
| `lib/invites/types.ts` | `InviteStaffMember`·`InviteStaff` 추가, `Invite.staff` 추가 |
| `lib/invites/client.ts` | `InviteWriteInput.staff`, `upsertInvite` staff 기록·정제 |
| `app/admin/invites/_components/StaffEditor.tsx` | 신규 — 관리자 제작진 편집 |
| `app/admin/invites/_components/InviteForm.tsx` | DEFAULT_INVITE·toForm·Section·검증·submit |
| `app/invite/[year]/[round]/_components/StaffSection.tsx` | 신규 — 공개 제작진 표시 |
| `app/invite/[year]/[round]/page.tsx` | `StaffSection` 배치 |
