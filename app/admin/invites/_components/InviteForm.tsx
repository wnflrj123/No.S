'use client';

import { useMemo, useState } from 'react';
import RichTextEditor from '@/components/notices/RichTextEditor';
import VenueEditor from './VenueEditor';
import RoundEditor, { type RoundFormValue } from './RoundEditor';
import SponsorAccountEditor from './SponsorAccountEditor';
import { upsertInvite, type InviteWriteInput } from '@/lib/invites/client';
import type { Invite } from '@/lib/invites/types';

interface Props {
  initial: Invite | null; // null이면 신규 생성
  createdBy: string; // 현재 user uid
  onSaved: (year: number, round: number) => void;
}

const DEFAULT_INVITE: Omit<InviteWriteInput, 'rounds'> & { rounds: RoundFormValue[] } = {
  year: new Date().getFullYear(),
  round: 1,
  title: '',
  subtitle: '',
  description: '',
  posterImageUrl: '',
  venue: { name: '', address: '', directions: '', mapLinks: {} },
  rounds: [],
  sponsorAccount: { bankName: '', accountNumber: '', accountHolder: '' },
  thanksMessage: '',
  isPublished: false,
};

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
    if (form.rounds.some(r => r.casting.some(c => !c.role.trim()))) {
      return setError('캐스팅의 배역을 모두 입력해주세요. (불필요한 행은 삭제)');
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
        subtitle: form.subtitle?.trim() || undefined,
        thanksMessage: form.thanksMessage?.trim() || undefined,
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

        <FieldRow label="공연명" required>
          <input
            type="text"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            maxLength={80}
            className="input"
            required
          />
        </FieldRow>
        <FieldRow label="부제 (선택)">
          <input
            type="text"
            value={form.subtitle ?? ''}
            onChange={e => update('subtitle', e.target.value)}
            maxLength={120}
            className="input"
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

      <Section title="회차">
        <RoundEditor
          value={form.rounds}
          onChange={v => update('rounds', v)}
          inviteId={inviteIdPreview}
        />
      </Section>

      <Section title="후원 계좌">
        <SponsorAccountEditor value={form.sponsorAccount} onChange={v => update('sponsorAccount', v)} />
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
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function toForm(invite: Invite | null): typeof DEFAULT_INVITE {
  if (!invite) return DEFAULT_INVITE;
  return {
    year: invite.year,
    round: invite.round,
    title: invite.title,
    subtitle: invite.subtitle ?? '',
    description: invite.description,
    posterImageUrl: invite.posterImageUrl,
    venue: invite.venue,
    rounds: invite.rounds.map(r => ({
      roundNo: r.roundNo,
      startAtMs: r.startAt.toDate().getTime(),
      teamName: r.teamName,
      casting: r.casting,
    })),
    sponsorAccount: invite.sponsorAccount,
    thanksMessage: invite.thanksMessage ?? '',
    isPublished: invite.isPublished,
  };
}
