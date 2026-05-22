'use client';

import { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';
import { PHONE_REGEX } from '@/lib/invites/constants';

const KST = 'Asia/Seoul';
const EDIT_DEADLINE_MS = 2 * 24 * 60 * 60 * 1000; // 공연 시작 48시간 전 (D-2)

interface LookupResult {
  found: boolean;
  registration?: {
    name: string;
    phone: string;
    roundSelections: { roundNo: number; headcount: number }[];
    totalHeadcount: number;
    isSponsor: boolean;
    createdAt: number;
    companions?: string;
    supportingActors?: string;
    seatRequests?: string;
    cheerMessage?: string;
  };
  rounds?: { roundNo: number; teamName: string; startAtMs: number }[];
  message?: string;
}

export default function CheckForm({ year, round }: { year: number; round: number }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  const handlePhoneChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length < 4) setPhone(digits);
    else if (digits.length < 8) setPhone(`${digits.slice(0, 3)}-${digits.slice(3)}`);
    else setPhone(`${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!name.trim()) return setError('이름을 입력해주세요.');
    if (!PHONE_REGEX.test(phone)) return setError('휴대폰 번호 형식을 확인해주세요. (010-XXXX-XXXX)');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/invites/${year}/${round}/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone }),
      });
      const data = (await res.json()) as LookupResult;
      if (!res.ok) {
        setError(data.message ?? '조회에 실패했습니다.');
        return;
      }
      setResult(data);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-800">이름</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input mt-1"
            maxLength={50}
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-800">휴대폰</label>
          <input
            type="tel"
            value={phone}
            onChange={e => handlePhoneChange(e.target.value)}
            placeholder="010-1234-5678"
            inputMode="numeric"
            autoComplete="tel"
            className="input mt-1"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#0066B3] text-white rounded-xl font-semibold disabled:bg-gray-300"
        >
          {submitting ? '조회 중…' : '내 신청 내역 확인하기'}
        </button>
      </form>

      {result && !result.found && (
        <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl text-center">
          <div className="text-3xl mb-2">🔍</div>
          <p className="font-semibold text-gray-800">신청 내역이 없습니다</p>
          <p className="text-sm text-gray-600 mt-1">
            입력하신 이름·휴대폰 번호로 신청한 내역을 찾을 수 없어요.
          </p>
        </div>
      )}

      {result?.found && result.registration && (
        <RegistrationCard
          year={year}
          round={round}
          registration={result.registration}
          rounds={result.rounds ?? []}
        />
      )}
    </div>
  );
}

interface RegistrationCardProps {
  year: number;
  round: number;
  registration: NonNullable<LookupResult['registration']>;
  rounds: NonNullable<LookupResult['rounds']>;
}

function RegistrationCard({ year, round, registration, rounds }: RegistrationCardProps) {
  const startAtMsList = registration.roundSelections
    .map(s => rounds.find(r => r.roundNo === s.roundNo)?.startAtMs)
    .filter((x): x is number => typeof x === 'number');
  const earliestStartMs = startAtMsList.length > 0 ? Math.min(...startAtMsList) : null;
  const editDeadlineMs = earliestStartMs !== null ? earliestStartMs - EDIT_DEADLINE_MS : null;
  const canEdit = editDeadlineMs !== null && Date.now() < editDeadlineMs;

  const handleEdit = () => {
    if (!canEdit) return;
    const data = {
      name: registration.name,
      phone: registration.phone,
      roundSelections: registration.roundSelections,
      companions: registration.companions,
      supportingActors: registration.supportingActors,
      seatRequests: registration.seatRequests,
      cheerMessage: registration.cheerMessage,
    };
    try {
      sessionStorage.setItem(`invite-edit:${year}-${round}`, JSON.stringify(data));
    } catch {
      // sessionStorage 미지원 — apply 페이지에서 빈 폼이 뜨므로 안내 후 진행
    }
    window.location.href = `/invite/${year}/${round}/apply?edit=1`;
  };

  return (
    <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
      <div className="text-3xl text-center">🎉</div>
      <p className="text-center font-semibold text-[#0066B3]">
        {registration.name}님의 신청 내역
      </p>
      <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">휴대폰</span>
          <span className="text-gray-900">{registration.phone}</span>
        </div>
        <div className="flex justify-between items-start gap-3">
          <span className="text-gray-500 shrink-0">신청 회차</span>
          <div className="text-gray-900 text-right space-y-1">
            {registration.roundSelections.map(s => {
              const r = rounds.find(x => x.roundNo === s.roundNo);
              return (
                <div key={s.roundNo}>
                  <div className="font-medium">
                    {s.roundNo}회차{r?.teamName ? ` · ${r.teamName}` : ''} — {s.headcount}명
                  </div>
                  {r && (
                    <div className="text-xs text-gray-500">
                      {formatInTimeZone(new Date(r.startAtMs), KST, 'M월 d일(EEE) HH:mm', { locale: ko })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">총 인원</span>
          <span className="text-gray-900 font-semibold">{registration.totalHeadcount}명</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">신청일</span>
          <span className="text-gray-900">
            {formatInTimeZone(new Date(registration.createdAt), KST, 'M월 d일 HH:mm', { locale: ko })}
          </span>
        </div>
        {registration.isSponsor && (
          <div className="flex justify-between">
            <span className="text-gray-500">후원</span>
            <span className="text-[#0066B3] font-semibold">💛 후원해주셨어요</span>
          </div>
        )}
      </div>

      <div className="pt-1 space-y-2">
        <button
          type="button"
          onClick={handleEdit}
          disabled={!canEdit}
          className="w-full py-3 bg-[#0066B3] text-white rounded-xl font-semibold text-sm hover:bg-[#0055a0] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {canEdit ? '신청 내용 변경하기' : '변경 가능 기간이 지났어요'}
        </button>
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          공연 시작 48시간 전(D-2)까지 변경할 수 있어요.
          {editDeadlineMs !== null && (
            <>
              <br />
              {canEdit ? '변경 마감' : '마감됨'}:{' '}
              {formatInTimeZone(new Date(editDeadlineMs), KST, 'M월 d일(EEE) HH:mm', { locale: ko })}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
