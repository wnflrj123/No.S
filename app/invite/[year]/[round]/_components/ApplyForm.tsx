'use client';

import { useEffect, useState } from 'react';
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

interface EditPrefill {
  name?: string;
  phone?: string;
  roundSelections?: { roundNo: number; headcount: number }[];
  companions?: string;
  supportingActors?: string;
  seatRequests?: string;
  cheerMessage?: string;
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
  const [duplicateConfirm, setDuplicateConfirm] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') !== '1') return;
    const raw = sessionStorage.getItem(`invite-edit:${invite.year}-${invite.round}`);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as EditPrefill;
      if (data.name) setName(data.name);
      if (data.phone) setPhone(data.phone);
      if (Array.isArray(data.roundSelections)) {
        const sel: Record<number, number> = {};
        for (const s of data.roundSelections) sel[s.roundNo] = s.headcount;
        setSelections(sel);
      }
      if (data.companions) setCompanions(data.companions);
      if (data.supportingActors) setSupportingActors(data.supportingActors);
      if (data.seatRequests) setSeatRequests(data.seatRequests);
      if (data.cheerMessage) setCheerMessage(data.cheerMessage);
      setPrivacyConsent(true);
      setIsEditMode(true);
    } catch {
      // 손상된 데이터 — 일반 신청 모드로 fallback
    }
  }, [invite.year, invite.round]);

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

  const submitRegistration = async (confirmSupersede: boolean) => {
    setErrors([]);
    setDuplicateConfirm(null);
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
          confirmSupersede,
        }),
      });

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        // 중복 안내. 확인 모달 띄움.
        setDuplicateConfirm(data?.message ?? '이미 신청 내역이 있어요. 새로 신청하면 기존 신청은 취소됩니다.');
        setSubmitting(false);
        return;
      }
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
      const { token, thanksData } = await res.json();
      // thanks 페이지가 Firestore 재조회 없이 즉시 렌더하도록 데이터 캐시
      if (typeof window !== 'undefined' && thanksData) {
        try {
          sessionStorage.setItem(`invite-thanks:${token}`, JSON.stringify(thanksData));
        } catch {
          // sessionStorage 미지원/용량 초과 — fallback으로 thanks 페이지가 API 조회
        }
      }
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(`invite-edit:${invite.year}-${invite.round}`);
        } catch {
          // 무시
        }
      }
      router.replace(`/invite/${invite.year}/${invite.round}/thanks/${token}`);
    } catch {
      setErrors(['네트워크 오류가 발생했습니다. 다시 시도해주세요.']);
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // edit 모드: 같은 이름·휴대폰의 기존 신청을 자동 갱신(supersede)하므로 중복 모달을 건너뛴다
    await submitRegistration(isEditMode);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <strong className="block">신청 내용을 변경하고 있어요</strong>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            저장하시면 기존 신청 내역이 새 내용으로 자동 갱신됩니다.<br />
            이름과 휴대폰 번호는 본인 확인용이라 변경할 수 없어요.
          </p>
        </div>
      )}

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
          className={`input ${isEditMode ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
          required
          readOnly={isEditMode}
          autoComplete="name"
        />
      </Field>

      <Field label="휴대폰" required hint={isEditMode ? undefined : '공연 안내 연락용입니다.'}>
        <input
          type="tel"
          value={phone}
          onChange={e => handlePhoneChange(e.target.value)}
          placeholder="010-1234-5678"
          inputMode="numeric"
          autoComplete="tel"
          className={`input ${isEditMode ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
          required
          readOnly={isEditMode}
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
        {submitting
          ? isEditMode
            ? '저장 중…'
            : '신청 중…'
          : isEditMode
            ? '변경 사항 저장하기'
            : '신청 완료하기'}
      </button>

      {duplicateConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setDuplicateConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-4xl text-center mb-3">📝</div>
            <h4 className="font-bold text-gray-900 text-center text-lg">이미 신청 내역이 있어요</h4>
            <p className="text-sm text-gray-600 text-center mt-2 leading-relaxed whitespace-pre-line">
              {duplicateConfirm}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDuplicateConfirm(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => submitRegistration(true)}
                className="flex-1 py-2.5 bg-[#0066B3] text-white rounded-lg text-sm font-semibold hover:bg-[#0055a0]"
              >
                새로 신청하기
              </button>
            </div>
          </div>
        </div>
      )}
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
