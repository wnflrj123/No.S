'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RoundCheckboxList, { type FormRound } from './RoundCheckboxList';
import { MAX_HEADCOUNT, MAX_NAME_LENGTH, MAX_TEXT_LENGTH, PHONE_REGEX } from '@/lib/invites/constants';
import type { OptionalFieldKey } from '@/lib/invites/types';

export interface FormInvite {
  id: string;
  year: number;
  round: number;
  title: string;
  rounds: FormRound[];
  disabledFields?: OptionalFieldKey[];
}

export default function ApplyForm({ invite }: { invite: FormInvite }) {
  const router = useRouter();
  const disabled = new Set(invite.disabledFields ?? []);
  const isOn = (key: OptionalFieldKey) => !disabled.has(key);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [companions, setCompanions] = useState('');
  const [supportingActors, setSupportingActors] = useState('');
  const [seatRequests, setSeatRequests] = useState('');
  const [cheerMessage, setCheerMessage] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handlePhoneChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length < 4) setPhone(digits);
    else if (digits.length < 8) setPhone(`${digits.slice(0, 3)}-${digits.slice(3)}`);
    else setPhone(`${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`);
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('이름을 입력해주세요.');
    else if (name.trim().length > MAX_NAME_LENGTH) errs.push('이름이 너무 깁니다.');
    if (!PHONE_REGEX.test(phone)) errs.push('휴대폰 번호를 010-XXXX-XXXX 형식으로 입력해주세요.');
    const entries = Object.entries(selections).filter(([, hc]) => hc > 0);
    if (entries.length === 0) errs.push('회차를 1개 이상 선택해주세요.');
    if (!privacyConsent) errs.push('개인정보 수집·이용 동의가 필요합니다.');
    for (const t of [companions, supportingActors, seatRequests, cheerMessage]) {
      if (t.length > MAX_TEXT_LENGTH) {
        errs.push(`자유 텍스트는 ${MAX_TEXT_LENGTH}자 이하로 입력해주세요.`);
        break;
      }
    }
    return errs;
  };

  const errorMessageFromServer = (codes: unknown[]): string => {
    const list = (codes ?? []).filter((c): c is string => typeof c === 'string');
    if (list.includes('INVITE_NOT_PUBLISHED')) return '공연 페이지가 비공개로 전환되었습니다.';
    if (list.includes('INVITE_CLOSED')) return '신청이 종료되었습니다.';
    const closedRound = list.find(c => /^ROUND_\d+_CLOSED$/.test(c));
    if (closedRound) {
      const n = closedRound.match(/\d+/)?.[0];
      return `${n}회차는 이미 시작되어 신청할 수 없습니다.`;
    }
    if (list.includes('PHONE_INVALID')) return '휴대폰 번호 형식이 잘못되었습니다.';
    if (list.includes('PRIVACY_NOT_AGREED')) return '개인정보 동의가 필요합니다.';
    return '서버 검증에 실패했습니다: ' + list.join(', ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      const roundSelections = Object.entries(selections)
        .filter(([, hc]) => hc > 0)
        .map(([rn, hc]) => ({ roundNo: Number(rn), headcount: hc }));

      const res = await fetch(`/api/invites/${invite.year}/${invite.round}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          roundSelections,
          companions: isOn('companions') ? companions.trim() || undefined : undefined,
          supportingActors: isOn('supportingActors') ? supportingActors.trim() || undefined : undefined,
          seatRequests: isOn('seatRequests') ? seatRequests.trim() || undefined : undefined,
          cheerMessage: isOn('cheerMessage') ? cheerMessage.trim() || undefined : undefined,
          privacyConsent: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (Array.isArray(data?.errors) && data.errors.length > 0) {
          setErrors([errorMessageFromServer(data.errors)]);
        } else {
          setErrors([data?.message ?? '신청 처리 중 오류가 발생했습니다.']);
        }
        setSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const { token } = await res.json();
      router.replace(`/invite/${invite.year}/${invite.round}/thanks/${token}`);
    } catch {
      setErrors(['네트워크 오류가 발생했습니다. 다시 시도해주세요.']);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.length > 0 && (
        <ul className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 space-y-1">
          {errors.map((m, i) => (
            <li key={i}>• {m}</li>
          ))}
        </ul>
      )}

      <Field label="이름" required>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          className="input"
          required
          autoComplete="name"
        />
      </Field>

      <Field label="휴대폰" required hint="공연 안내 연락용입니다.">
        <input
          type="tel"
          value={phone}
          onChange={e => handlePhoneChange(e.target.value)}
          placeholder="010-1234-5678"
          inputMode="numeric"
          autoComplete="tel"
          className="input"
          required
        />
      </Field>

      <Field label="신청 회차 및 인원수" required>
        <RoundCheckboxList
          rounds={invite.rounds}
          value={selections}
          onChange={setSelections}
          maxHeadcount={MAX_HEADCOUNT}
        />
      </Field>

      {isOn('companions') && (
        <Field label="동반인 이름" hint="함께 오시는 분 이름을 자유롭게 적어주세요 (선택)">
          <input
            type="text"
            value={companions}
            onChange={e => setCompanions(e.target.value)}
            maxLength={MAX_TEXT_LENGTH}
            className="input"
          />
        </Field>
      )}

      {isOn('supportingActors') && (
        <Field label="응원하는 배우" hint="응원하고 싶은 배우가 있다면 적어주세요 (선택)">
          <input
            type="text"
            value={supportingActors}
            onChange={e => setSupportingActors(e.target.value)}
            maxLength={MAX_TEXT_LENGTH}
            className="input"
          />
        </Field>
      )}

      {isOn('seatRequests') && (
        <Field label="좌석 요청사항" hint="휠체어석, 가까운 자리 등 (선택)">
          <textarea
            value={seatRequests}
            onChange={e => setSeatRequests(e.target.value)}
            maxLength={MAX_TEXT_LENGTH}
            rows={2}
            className="input"
          />
        </Field>
      )}

      {isOn('cheerMessage') && (
        <Field label="응원 메시지" hint="배우들에게 전하고 싶은 한 마디 (선택)">
          <textarea
            value={cheerMessage}
            onChange={e => setCheerMessage(e.target.value)}
            maxLength={MAX_TEXT_LENGTH}
            rows={3}
            className="input"
          />
        </Field>
      )}

      <label className="flex items-start gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={privacyConsent}
          onChange={e => setPrivacyConsent(e.target.checked)}
          className="mt-1 w-4 h-4"
        />
        <span>
          <strong className="text-gray-900">[필수]</strong> 개인정보(이름·연락처) 수집 및 이용에 동의합니다.
          <br />
          <span className="text-xs text-gray-500">
            수집된 정보는 공연 안내 및 좌석 배정에만 사용되며, 공연 종료 후 파기됩니다.
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 bg-[#0066B3] text-white rounded-xl font-semibold text-base disabled:bg-gray-300"
      >
        {submitting ? '신청 중…' : '신청 완료하기'}
      </button>
    </form>
  );
}

function Field({
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
    <div>
      <label className="text-sm font-medium text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
