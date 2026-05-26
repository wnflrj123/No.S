'use client';

import { useMemo, useState } from 'react';
import RichTextEditor from '@/components/notices/RichTextEditor';
import VenueEditor from './VenueEditor';
import RoundEditor, { type RoundFormValue } from './RoundEditor';
import RolesEditor from './RolesEditor';
import StaffEditor from './StaffEditor';
import SponsorAccountEditor from './SponsorAccountEditor';
import { upsertInvite, type InviteWriteInput } from '@/lib/invites/client';
import {
  OPTIONAL_FIELD_LABELS,
  type CastingEntry,
  type Invite,
  type InviteRole,
  type InviteStaff,
  type OptionalFieldKey,
} from '@/lib/invites/types';

interface Props {
  initial: Invite | null; // null이면 신규 생성
  createdBy: string; // 현재 user uid
  onSaved: (year: number, round: number) => void;
}

const DEFAULT_INVITE: Omit<InviteWriteInput, 'rounds'> & { rounds: RoundFormValue[] } = {
  year: new Date().getFullYear(),
  round: 1,
  overline: '',
  title: '',
  subtitle: '',
  description: '',
  posterImageUrl: '',
  venue: { name: '', address: '', directions: '', mapLinks: {} },
  roles: [],
  staff: [],
  rounds: [],
  sponsorAccount: { bankName: '', accountNumber: '', accountHolder: '' },
  thanksMessage: '',
  disabledFields: [],
  disableWallSupport: false,
  isPublished: false,
};

const OPTIONAL_FIELD_KEYS: OptionalFieldKey[] = ['companions', 'supportingActors', 'seatRequests', 'cheerMessage'];

export default function InviteForm({ initial, createdBy, onSaved }: Props) {
  const isNew = initial === null;
  const initialForm = useMemo(() => toForm(initial), [initial]);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const inviteIdPreview = `${form.year}-${form.round}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1차 검증
    if (!form.title.trim()) return setError('공연명을 입력해주세요.');
    if (!form.posterImageUrl.trim()) return setError('포스터 이미지 경로를 입력해주세요.');
    if (!form.venue.name.trim() || !form.venue.address.trim()) return setError('장소 정보(공연장명·주소)를 입력해주세요.');
    if (form.rounds.length === 0) return setError('회차를 1개 이상 추가해주세요.');
    if (form.rounds.some(r => !r.teamName.trim() || !r.startAtMs)) return setError('모든 회차에 팀명과 시작 시각을 입력해주세요.');
    if (form.rounds.some(r => r.casting.some(c => !c.roleId))) {
      return setError('캐스팅의 배역을 모두 선택해주세요. (불필요한 행은 삭제)');
    }
    if (form.rounds.some(r => r.casting.some(c => !c.actorName.trim()))) {
      return setError('캐스팅의 배우 이름을 모두 입력해주세요. (불필요한 행은 삭제)');
    }
    if (form.roles.some(r => !r.name.trim())) {
      return setError('배역 이름을 모두 입력해주세요. (불필요한 행은 삭제)');
    }
    const staffList: InviteStaff[] = form.staff ?? [];
    if (staffList.some(s => !s.role.trim())) {
      return setError('제작진 직책을 모두 입력해주세요. (불필요한 직책은 삭제)');
    }
    if (staffList.some(s => s.members.some(m => !m.name.trim()))) {
      return setError('제작진 이름을 모두 입력해주세요. (불필요한 멤버는 삭제)');
    }
    const roundNos = form.rounds.map(r => r.roundNo);
    if (new Set(roundNos).size !== roundNos.length) return setError('회차 번호가 중복됩니다.');
    if (form.isPublished && form.rounds.every(r => r.startAtMs <= Date.now())) {
      return setError('공개 상태이지만 모든 회차의 시작 시각이 과거입니다. 시각을 수정하거나 비공개로 저장하세요.');
    }
    if (!form.sponsorAccount.bankName.trim() || !form.sponsorAccount.accountNumber.trim() || !form.sponsorAccount.accountHolder.trim()) {
      return setError('후원 계좌 정보를 모두 입력해주세요.');
    }

    setSubmitting(true);
    try {
      const input: InviteWriteInput = {
        ...form,
        overline: form.overline?.trim() || undefined,
        subtitle: form.subtitle?.trim() || undefined,
        thanksMessage: form.thanksMessage?.trim() || undefined,
        disabledFields: form.disabledFields ?? [],
        disableWallSupport: form.disableWallSupport ?? false,
      };
      const id = await upsertInvite(input, createdBy, isNew);
      const [yStr, rStr] = id.split('-');
      onSaved(Number(yStr), Number(rStr));
    } catch (err) {
      const raw = err instanceof Error ? err.message : '알 수 없는 오류';
      const msg = raw.startsWith('INVITE_ALREADY_EXISTS')
        ? '같은 연도·회차의 공연이 이미 존재합니다. 다른 회차 번호를 사용해주세요.'
        : `저장에 실패했습니다: ${raw}`;
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section title="기본 정보">
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="연도" required>
            <input
              type="number"
              value={form.year}
              onChange={e => update('year', Number(e.target.value))}
              min={2020}
              max={2099}
              className="input"
              required
              disabled={!isNew}
            />
          </FieldRow>
          <FieldRow label="회차" required>
            <input
              type="number"
              value={form.round}
              onChange={e => update('round', Number(e.target.value))}
              min={1}
              max={99}
              className="input"
              required
              disabled={!isNew}
            />
          </FieldRow>
        </div>
        {isNew ? (
          <p className="text-xs text-gray-500 mt-1">문서 ID: <code>{inviteIdPreview}</code></p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">연도·회차는 수정할 수 없습니다.</p>
        )}

        <FieldRow
          label="최상단 타이틀 (선택)"
          hint="포스터 위쪽에 작게 표시되는 라벨. 예: '삼성전자 뮤지컬 동호회 제1회 정기공연'"
        >
          <input
            type="text"
            value={form.overline ?? ''}
            onChange={e => update('overline', e.target.value)}
            maxLength={80}
            className="input"
            placeholder="삼성전자 뮤지컬 동호회 제1회 정기공연"
          />
        </FieldRow>
        <FieldRow label="공연명" required>
          <input
            type="text"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            maxLength={80}
            className="input"
            required
            placeholder="Les Misérables"
          />
        </FieldRow>
        <FieldRow label="부제 (선택)">
          <input
            type="text"
            value={form.subtitle ?? ''}
            onChange={e => update('subtitle', e.target.value)}
            maxLength={120}
            className="input"
            placeholder="뮤지컬 <레미제라블>"
          />
        </FieldRow>
        <FieldRow label="포스터 이미지 경로" required>
          <input
            type="text"
            value={form.posterImageUrl}
            onChange={e => update('posterImageUrl', e.target.value)}
            placeholder={`/invites/${inviteIdPreview}/poster.jpg`}
            maxLength={200}
            className="input"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            <code>/public</code> 폴더 기준 경로 또는 외부 URL
          </p>
        </FieldRow>
        <label className="flex items-center gap-2 mt-3">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={e => update('isPublished', e.target.checked)}
          />
          <span className="text-sm text-gray-700">공개 (체크 해제 시 외부 페이지에서 404)</span>
        </label>
      </Section>

      <Section title="공연 안내">
        <RichTextEditor
          content={form.description}
          onChange={html => update('description', html)}
          placeholder="공연 소개, 줄거리 등"
        />
      </Section>

      <Section title="장소">
        <VenueEditor value={form.venue} onChange={v => update('venue', v)} />
      </Section>

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
        <RoundEditor
          value={form.rounds}
          onChange={v => update('rounds', v)}
          roles={form.roles}
          inviteId={inviteIdPreview}
        />
      </Section>

      <Section title="후원 계좌">
        <SponsorAccountEditor value={form.sponsorAccount} onChange={v => update('sponsorAccount', v)} />
      </Section>

      <Section title="신청 폼에서 받을 선택 항목">
        <p className="text-xs text-gray-500 mb-2">
          체크된 항목만 신청자에게 입력 받습니다. 끄면 신청 폼에 해당 칸이 표시되지 않아요.
          (이름·휴대폰·회차·개인정보 동의는 필수라 끌 수 없습니다.)
        </p>
        <ul className="space-y-1">
          {OPTIONAL_FIELD_KEYS.map(key => {
            const enabled = !(form.disabledFields ?? []).includes(key);
            return (
              <li key={key}>
                <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={e => {
                      const current = new Set(form.disabledFields ?? []);
                      if (e.target.checked) current.delete(key);
                      else current.add(key);
                      update('disabledFields', Array.from(current));
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-800">{OPTIONAL_FIELD_LABELS[key]}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="후원자 Wall 설정">
        <label className="flex items-start gap-2 cursor-pointer text-sm py-1">
          <input
            type="checkbox"
            checked={!form.disableWallSupport}
            onChange={e => update('disableWallSupport', !e.target.checked)}
            className="w-4 h-4 mt-0.5"
          />
          <span className="text-gray-800">
            <strong>현장 후원자 받기</strong> (응원 꽃다발 보내기 버튼 노출)
            <br />
            <span className="text-xs text-gray-500">
              끄면 wall 페이지에서 외부 응원자 등록이 차단됩니다. 이미 등록된 분은 그대로 표시.
            </span>
          </span>
        </label>
      </Section>

      <Section title="감사 메시지 (선택)">
        <textarea
          value={form.thanksMessage ?? ''}
          onChange={e => update('thanksMessage', e.target.value)}
          maxLength={500}
          rows={3}
          className="input"
          placeholder="신청자가 보게 될 감사 메시지를 입력해주세요"
        />
      </Section>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-[#0066B3] text-white rounded-xl font-semibold disabled:bg-gray-300"
      >
        {submitting ? '저장 중…' : isNew ? '공연 만들기' : '저장'}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function FieldRow({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function toForm(invite: Invite | null): typeof DEFAULT_INVITE {
  if (!invite) return DEFAULT_INVITE;

  const { roles, rounds } = migrateRolesAndCasting(invite);

  return {
    year: invite.year,
    round: invite.round,
    overline: invite.overline ?? '',
    title: invite.title,
    subtitle: invite.subtitle ?? '',
    description: invite.description,
    posterImageUrl: invite.posterImageUrl,
    venue: invite.venue,
    roles,
    staff: invite.staff ?? [],
    rounds,
    sponsorAccount: invite.sponsorAccount,
    thanksMessage: invite.thanksMessage ?? '',
    disabledFields: invite.disabledFields ?? [],
    disableWallSupport: invite.disableWallSupport ?? false,
    isPublished: invite.isPublished,
  };
}

/**
 * 폼 로드 시 레거시 데이터(invite.roles 없음 + casting에 role/description 직접 입력)를
 * 새 형식(roles 마스터 + casting.roleId 참조)으로 자동 변환한다.
 *
 * 변환 규칙:
 * - 모든 회차의 casting에서 unique한 role 이름을 추출해 InviteRole 생성
 * - casting의 role 필드를 roleId로 매핑
 * - actorName은 빈 문자열로 (사용자가 다시 입력해야 함)
 */
function migrateRolesAndCasting(invite: Invite): {
  roles: InviteRole[];
  rounds: RoundFormValue[];
} {
  const hasLegacy =
    (!invite.roles || invite.roles.length === 0) &&
    invite.rounds.some(r => r.casting.some(c => c.role && !c.roleId));

  if (!hasLegacy) {
    return {
      roles: invite.roles ?? [],
      rounds: invite.rounds.map(r => ({
        roundNo: r.roundNo,
        startAtMs: r.startAt.toDate().getTime(),
        teamName: r.teamName,
        seatCapacity: r.seatCapacity,
        casting: r.casting.map(c => ({
          roleId: c.roleId ?? '',
          actorName: c.actorName ?? '',
          photoFile: c.photoFile,
          photoCrop: c.photoCrop,
        })),
      })),
    };
  }

  // 레거시 데이터 마이그레이션
  const roleInfoByName = new Map<string, { description: string; order: number }>();
  let order = 0;
  for (const round of invite.rounds) {
    for (const c of round.casting) {
      const name = c.role?.trim();
      if (!name) continue;
      if (!roleInfoByName.has(name)) {
        roleInfoByName.set(name, { description: c.description ?? '', order: order++ });
      }
    }
  }

  const roles: InviteRole[] = Array.from(roleInfoByName.entries()).map(([name, info]) => ({
    id: crypto.randomUUID(),
    name,
    description: info.description,
    order: info.order,
  }));

  const nameToId = new Map(roles.map(r => [r.name, r.id]));

  const rounds: RoundFormValue[] = invite.rounds.map(r => ({
    roundNo: r.roundNo,
    startAtMs: r.startAt.toDate().getTime(),
    teamName: r.teamName,
    seatCapacity: r.seatCapacity,
    casting: r.casting.map((c): CastingEntry => ({
      roleId: c.role ? nameToId.get(c.role) ?? '' : c.roleId ?? '',
      actorName: c.actorName ?? '', // 레거시 데이터에는 배우 이름이 없음 → 사용자가 다시 입력
      photoFile: c.photoFile,
      photoCrop: c.photoCrop,
    })),
  }));

  return { roles, rounds };
}
