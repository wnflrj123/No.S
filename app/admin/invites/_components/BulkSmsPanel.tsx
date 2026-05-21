'use client';

import { useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { REMINDER_LMS_SUBJECT, REMINDER_LMS_TEMPLATE } from '@/lib/sms/templates/reminder';
import { buildVars, renderTemplate } from '@/lib/sms/templates';
import type { Invite, InviteRegistration } from '@/lib/invites/types';

interface Props {
  invite: Invite;
  registrations: InviteRegistration[];
}

type TargetType = 'all' | 'round' | 'sponsors';

interface SendResult {
  total: number;
  success: number;
  failure: number;
  failures: { name: string; phone: string }[];
}

const COST_PER_LMS = 33; // 원 단위, 예상 표시용

export default function BulkSmsPanel({ invite, registrations }: Props) {
  const [messageTemplate, setMessageTemplate] = useState(REMINDER_LMS_TEMPLATE);
  const [subject, setSubject] = useState(REMINDER_LMS_SUBJECT);
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [roundNo, setRoundNo] = useState<number>(invite.rounds[0]?.roundNo ?? 1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const targetRegs = useMemo(() => {
    if (targetType === 'sponsors') return registrations.filter(r => r.isSponsor);
    if (targetType === 'round') {
      return registrations.filter(r => r.roundSelections.some(s => s.roundNo === roundNo));
    }
    return registrations;
  }, [registrations, targetType, roundNo]);

  const previewText = useMemo(() => {
    const sample = targetRegs[0];
    if (!sample) return messageTemplate;
    return renderTemplate(messageTemplate, buildVars(sample, invite));
  }, [messageTemplate, targetRegs, invite]);

  const estimatedCost = targetRegs.length * COST_PER_LMS;

  const handleSend = async () => {
    if (targetRegs.length === 0) {
      setError('발송 대상이 없습니다.');
      return;
    }
    if (!messageTemplate.trim()) {
      setError('메시지를 입력해주세요.');
      return;
    }
    const ok = window.confirm(
      `${targetRegs.length}명에게 LMS를 발송합니다.\n예상 비용: 약 ${estimatedCost.toLocaleString()}원\n\n계속하시겠어요? (취소 불가)`,
    );
    if (!ok) return;

    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      if (!idToken) {
        setError('로그인 정보를 다시 확인해주세요.');
        setSubmitting(false);
        return;
      }
      const res = await fetch(`/api/invites/${invite.year}/${invite.round}/bulk-sms`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageTemplate,
          subject: subject || undefined,
          targetType,
          roundNo: targetType === 'round' ? roundNo : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? '발송에 실패했습니다.');
      } else {
        setResult(data as SendResult);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '네트워크 오류');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-bold text-gray-900">📨 SMS 일괄 발송 (LMS)</h3>
        <span className="text-xs text-gray-500">
          {targetRegs.length}명 대상 · 예상 비용 ~{estimatedCost.toLocaleString()}원
        </span>
      </div>

      {/* 메시지 textarea */}
      <div>
        <label className="text-sm font-medium text-gray-700">메시지 본문</label>
        <p className="text-xs text-gray-500 mt-0.5">
          변수: <code>{'{이름}'}</code>, <code>{'{공연명}'}</code>, <code>{'{회차별 일시}'}</code>,{' '}
          <code>{'{공연장명}'}</code>, <code>{'{총인원}'}</code> 자동 치환됩니다.
        </p>
        <textarea
          value={messageTemplate}
          onChange={e => setMessageTemplate(e.target.value)}
          rows={12}
          maxLength={2000}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono leading-relaxed"
        />
        <div className="text-xs text-gray-500 mt-1 text-right">
          {messageTemplate.length} / 2000자
        </div>
      </div>

      {/* 제목 (선택) */}
      <div>
        <label className="text-sm font-medium text-gray-700">제목 (LMS, 선택)</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          maxLength={40}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* 발송 대상 */}
      <div>
        <label className="text-sm font-medium text-gray-700">발송 대상</label>
        <div className="mt-2 space-y-2">
          <RadioOption
            checked={targetType === 'all'}
            onChange={() => setTargetType('all')}
            label={`전체 신청자 (${registrations.length}명)`}
          />
          <div className="flex items-center gap-2">
            <RadioOption
              checked={targetType === 'round'}
              onChange={() => setTargetType('round')}
              label="특정 회차"
            />
            <select
              value={roundNo}
              onChange={e => setRoundNo(Number(e.target.value))}
              disabled={targetType !== 'round'}
              className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-400"
            >
              {invite.rounds.map(r => (
                <option key={r.roundNo} value={r.roundNo}>
                  {r.roundNo}회차 ({r.teamName})
                </option>
              ))}
            </select>
          </div>
          <RadioOption
            checked={targetType === 'sponsors'}
            onChange={() => setTargetType('sponsors')}
            label={`후원자만 (${registrations.filter(r => r.isSponsor).length}명)`}
          />
        </div>
      </div>

      {/* 액션 */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          disabled={targetRegs.length === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          미리보기
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={submitting || targetRegs.length === 0}
          className="flex-1 px-4 py-2 bg-[#0066B3] text-white rounded-lg text-sm font-semibold hover:bg-[#0055a0] disabled:bg-gray-300"
        >
          {submitting ? '발송 중…' : `발송 (${targetRegs.length}건)`}
        </button>
      </div>

      {/* 결과 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      {result && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="font-semibold text-[#0066B3]">
            발송 완료: 성공 {result.success}건 / 실패 {result.failure}건 (총 {result.total}건)
          </div>
          {result.failures.length > 0 && (
            <div className="mt-2 text-xs text-gray-700">
              <div className="font-medium">실패 목록:</div>
              <ul className="mt-1 space-y-0.5">
                {result.failures.map((f, i) => (
                  <li key={i}>• {f.name} ({f.phone})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 미리보기 모달 */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-5 max-h-[80vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900">미리보기</h4>
              <button onClick={() => setShowPreview(false)} className="text-gray-400">✕</button>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              첫 번째 대상자({targetRegs[0]?.name})의 치환 결과입니다.
              <br />
              치환 후 글자수: {previewText.length}자
            </div>
            <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200 font-sans">
              {previewText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function RadioOption({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <input type="radio" checked={checked} onChange={onChange} className="w-4 h-4" />
      <span className="text-gray-800">{label}</span>
    </label>
  );
}
