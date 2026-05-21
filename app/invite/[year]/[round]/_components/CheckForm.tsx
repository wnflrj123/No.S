'use client';

import { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';
import { PHONE_REGEX } from '@/lib/invites/constants';

const KST = 'Asia/Seoul';

interface LookupResult {
  found: boolean;
  registration?: {
    name: string;
    phone: string;
    roundSelections: { roundNo: number; headcount: number }[];
    totalHeadcount: number;
    isSponsor: boolean;
    createdAt: number;
  };
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
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
          <div className="text-3xl text-center">🎉</div>
          <p className="text-center font-semibold text-[#0066B3]">
            {result.registration.name}님의 신청 내역
          </p>
          <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">휴대폰</span>
              <span className="text-gray-900">{result.registration.phone}</span>
            </div>
            <div className="flex justify-between items-start gap-3">
              <span className="text-gray-500 shrink-0">신청 회차</span>
              <span className="text-gray-900 text-right">
                {result.registration.roundSelections
                  .map(s => `${s.roundNo}회 (${s.headcount}명)`)
                  .join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">총 인원</span>
              <span className="text-gray-900 font-semibold">{result.registration.totalHeadcount}명</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">신청일</span>
              <span className="text-gray-900">
                {formatInTimeZone(new Date(result.registration.createdAt), KST, 'M월 d일 HH:mm', { locale: ko })}
              </span>
            </div>
            {result.registration.isSponsor && (
              <div className="flex justify-between">
                <span className="text-gray-500">후원</span>
                <span className="text-[#0066B3] font-semibold">💛 후원해주셨어요</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 text-center">
            정보 변경이 필요하시면 같은 이름·휴대폰 번호로 다시 신청해주세요.<br />
            새로 신청하시면 기존 내역은 자동으로 취소됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
