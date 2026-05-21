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
  failures: { name: string; phone: string; error?: string }[];
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
  const [showConfirm, setShowConfirm] = useState(false);

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
    // 서버와 동일 규칙: 특정 회차 발송이면 그 회차만 본문에 노출되도록 reg를 필터링
    const scopedSample =
      targetType === 'round'
        ? {
            ...sample,
            roundSelections: sample.roundSelections.filter(s => s.roundNo === roundNo),
          }
        : sample;
    return renderTemplate(messageTemplate, buildVars(scopedSample, invite));
  }, [messageTemplate, targetRegs, invite, targetType, roundNo]);

  const estimatedCost = targetRegs.length * COST_PER_LMS;

  const openConfirm = () => {
    setError(null);
    if (targetRegs.length === 0) {
      setError('발송 대상이 없습니다.');
      return;
    }
    if (!messageTemplate.trim()) {
      setError('메시지를 입력해주세요.');
      return;
    }
    setShowConfirm(true);
  };

  const handleSend = async () => {
    setShowConfirm(false);
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

      {/* 액션 — 발송 버튼 클릭 시 메시지 미리보기 + 확인 모달 */}
      <div className="pt-1">
        <button
          type="button"
          onClick={openConfirm}
          disabled={submitting || targetRegs.length === 0}
          className="w-full px-4 py-3 bg-[#0066B3] text-white rounded-lg text-sm font-semibold hover:bg-[#0055a0] disabled:bg-gray-300"
        >
          {submitting ? '발송 중…' : `발송 확인 (${targetRegs.length}건)`}
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
              <ul className="mt-1 space-y-1">
                {result.failures.map((f, i) => (
                  <li key={i}>
                    <span className="font-medium">{f.name}</span> ({f.phone})
                    {f.error && (
                      <div className="text-red-600 ml-3 break-all">↳ {f.error}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 발송 확인 모달 — 메시지 본문 + 인원수 + 비용 + 발송/취소 */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-900">이렇게 보낼게요. 진짜 발송할까요?</h4>
              <button onClick={() => setShowConfirm(false)} className="text-gray-400 text-lg">✕</button>
            </div>

            <div className="p-5 overflow-auto space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500">발송 인원</div>
                  <div className="text-gray-900 font-bold text-lg mt-0.5">{targetRegs.length}명</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500">예상 비용</div>
                  <div className="text-gray-900 font-bold text-lg mt-0.5">
                    ~{estimatedCost.toLocaleString()}원
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500">글자수</div>
                  <div className="text-gray-900 font-bold text-lg mt-0.5">{previewText.length}자</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  미리보기 (첫 번째 대상자 <strong>{targetRegs[0]?.name}</strong>의 치환 결과)
                </div>
                <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200 font-sans leading-relaxed">
                  {previewText}
                </pre>
                <p className="text-xs text-gray-500 mt-2">
                  실제로는 각 신청자의 이름·회차·인원에 맞춰 개별 치환되어 발송됩니다.
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSend}
                className="flex-1 px-4 py-2.5 bg-[#0066B3] text-white rounded-lg text-sm font-semibold hover:bg-[#0055a0]"
              >
                네, 발송할게요
              </button>
            </div>
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
